/*
 * Copyright 2026 Navilla
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package app.navilla.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import app.navilla.dto.ConnectionResponse;
import app.navilla.dto.ConnectionStatsResponse;
import app.navilla.dto.CreateConnectionRequest;
import app.navilla.entity.Connection;
import app.navilla.entity.ConnectionStatus;
import app.navilla.entity.ProfileVisibility;
import app.navilla.entity.User;
import app.navilla.exception.ConnectionConflictException;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.metrics.ConnectionMetrics;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for connection-related operations.
 *
 * <p>Handles creating, accepting, denying, and managing connections
 * between users. All user identifiers are hashed for privacy.
 *
 * @author Navilla Team
 * @since 2026-01-31
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConnectionService {

  private final ConnectionRepository connectionRepository;
  private final UserRepository userRepository;
  private final EncryptionService encryptionService;
  private final NotificationService notificationService;
  private final ConnectionMetrics connectionMetrics;
  private final ResourceCapService resourceCapService;

  @Value("${navilla.storage.public-base-url}")
  private String storagePublicBaseUrl;

  @Value("${navilla.storage.avatar-bucket}")
  private String avatarBucket;

  /**
   * Creates a new connection request.
   *
   * @param jwt the JWT token of the requesting user
   * @param request the connection request with recipient identifier
   * @throws IllegalArgumentException if trying to connect with self
   * @throws IllegalStateException if connection already exists
   */
  @Transactional
  public void createConnection(Jwt jwt, CreateConnectionRequest request) {
    String requesterEmail = jwt.getClaimAsString("email");
    String requesterHash = encryptionService.hashEmail(requesterEmail);
    resourceCapService.checkCap("connections", connectionRepository.countConfirmedByUserHash(requesterHash));
    String identifier = request.identifier() == null ? "" : request.identifier().trim();

    if (identifier.isBlank()) {
      throw new IllegalArgumentException("connection.error.identifierRequired");
    }

    User recipientUser = resolveRecipient(identifier).orElse(null);
    if (recipientUser == null) {
      log.info("Connection request queued for unknown recipient: {}", maskIdentifier(identifier));
      connectionMetrics.recordQueuedUnknown();
      return;
    }

    String recipientHash = recipientUser.getEmailHash();

    // Validate not connecting to self
    if (requesterHash.equals(recipientHash)) {
      throw new IllegalArgumentException("connection.error.selfConnection");
    }

    // Check if connection already exists
    connectionRepository.findBetweenUsers(requesterHash, recipientHash)
        .ifPresent(existing -> {
          if (existing.getStatus() == ConnectionStatus.PENDING
              && requesterHash.equals(existing.getRecipientHash())) {
            throw new ConnectionConflictException("connection.error.alreadyExists", existing.getId());
          }
          throw new IllegalStateException("connection.error.alreadyExists");
        });

    Connection connection = Connection.builder()
        .requesterHash(requesterHash)
        .recipientHash(recipientHash)
        .status(ConnectionStatus.PENDING)
        .build();

    Connection saved = connectionRepository.save(connection);
    log.info("Connection request created: {} -> {}",
        requesterHash.substring(0, 8), recipientHash.substring(0, 8));
    connectionMetrics.recordCreated();
    notificationService.createConnectionRequestNotification(recipientHash, saved.getId());
  }

  /**
   * Gets all connections for the current user.
   *
   * @param jwt the JWT token of the user
   * @return list of connections
   */
  @Transactional(readOnly = true)
  public List<ConnectionResponse> getConnections(Jwt jwt) {
    String email = jwt.getClaimAsString("email");
    String userHash = encryptionService.hashEmail(email);

    List<Connection> connections = connectionRepository.findAllByUserHash(userHash);
    Map<String, User> userLookup = fetchPartnerUsers(connections, userHash);

    return connections.stream()
        .filter(c -> isVisibleToRequester(c, userHash, userLookup))
        .map(c -> toConnectionResponse(c, userHash, userLookup))
        .toList();
  }

  /**
   * Gets confirmed connections for the current user.
   *
   * @param jwt the JWT token of the user
   * @return list of confirmed connections
   */
  @Transactional(readOnly = true)
  public List<ConnectionResponse> getConfirmedConnections(Jwt jwt) {
    String email = jwt.getClaimAsString("email");
    String userHash = encryptionService.hashEmail(email);

    List<Connection> connections = connectionRepository.findConfirmedByUserHash(userHash);
    Map<String, User> userLookup = fetchPartnerUsers(connections, userHash);

    return connections.stream()
        .map(c -> toConnectionResponse(c, userHash, userLookup))
        .toList();
  }

  /**
   * Gets confirmed connections with server-side pagination and optional search.
   *
   * @param jwt the JWT token of the user
   * @param page zero-based page number
   * @param size page size
   * @param search optional search term to filter by partner name or username
   * @return paginated confirmed connections
   */
  @Transactional(readOnly = true)
  public Page<ConnectionResponse> getConfirmedConnectionsPaged(Jwt jwt, int page, int size, String search) {
    String email = jwt.getClaimAsString("email");
    String userHash = encryptionService.hashEmail(email);

    Page<Connection> connectionPage = connectionRepository.findConfirmedByUserHashPaged(
        userHash, PageRequest.of(page, size));

    Map<String, User> userLookup = fetchPartnerUsers(connectionPage.getContent(), userHash);

    List<ConnectionResponse> responses = connectionPage.getContent().stream()
        .map(c -> toConnectionResponse(c, userHash, userLookup))
        .toList();

    if (search != null && !search.isBlank()) {
      String query = search.trim().toLowerCase();
      List<ConnectionResponse> filtered = responses.stream()
          .filter(r -> {
            String displayName = r.partnerDisplayName() != null
                ? r.partnerDisplayName().toLowerCase() : "";
            String username = r.partnerUsername() != null
                ? r.partnerUsername().toLowerCase() : "";
            return displayName.contains(query) || username.contains(query);
          })
          .toList();
      return new PageImpl<>(filtered, connectionPage.getPageable(), connectionPage.getTotalElements());
    }

    return new PageImpl<>(responses, connectionPage.getPageable(), connectionPage.getTotalElements());
  }

  /**
   * Gets pending incoming connection requests for the current user.
   *
   * @param jwt the JWT token of the user
   * @return list of pending incoming requests
   */
  @Transactional(readOnly = true)
  public List<ConnectionResponse> getPendingIncoming(Jwt jwt) {
    String email = jwt.getClaimAsString("email");
    String userHash = encryptionService.hashEmail(email);

    List<Connection> connections = connectionRepository
        .findByRecipientHashAndStatus(userHash, ConnectionStatus.PENDING);
    Map<String, User> userLookup = fetchPartnerUsers(connections, userHash);

    return connections.stream()
        .map(c -> toConnectionResponse(c, userHash, userLookup))
        .toList();
  }

  /**
   * Gets pending sent connection requests for the current user.
   *
   * @param jwt the JWT token of the user
   * @return list of pending sent requests
   */
  @Transactional(readOnly = true)
  public List<ConnectionResponse> getPendingSent(Jwt jwt) {
    String email = jwt.getClaimAsString("email");
    String userHash = encryptionService.hashEmail(email);

    List<Connection> connections = connectionRepository
        .findByRequesterHashAndStatus(userHash, ConnectionStatus.PENDING);
    Map<String, User> userLookup = fetchPartnerUsers(connections, userHash);

    return connections.stream()
        .filter(c -> isVisibleToRequester(c, userHash, userLookup))
        .map(c -> toConnectionResponse(c, userHash, userLookup))
        .toList();
  }

  /**
   * Accepts a pending connection request.
   *
   * @param jwt the JWT token of the recipient
   * @param connectionId the connection to accept
   * @return the updated connection
   * @throws ResourceNotFoundException if connection not found
   * @throws IllegalStateException if connection is not pending or user is not recipient
   */
  @Transactional
  public ConnectionResponse acceptConnection(Jwt jwt, UUID connectionId) {
    String email = jwt.getClaimAsString("email");
    String userHash = encryptionService.hashEmail(email);

    Connection connection = connectionRepository.findById(connectionId)
        .orElseThrow(() -> new ResourceNotFoundException("connection.error.notFound"));

    // Validate user is the recipient
    if (!connection.getRecipientHash().equals(userHash)) {
      throw new IllegalStateException("connection.error.notRecipient");
    }

    // Validate connection is pending
    if (connection.getStatus() != ConnectionStatus.PENDING) {
      throw new IllegalStateException("connection.error.notPending");
    }

    connection.setStatus(ConnectionStatus.CONFIRMED);
    connection.setRespondedAt(OffsetDateTime.now());
    connection.setConfirmedAt(OffsetDateTime.now());

    Connection saved = connectionRepository.save(connection);
    log.info("Connection accepted: {}", connectionId);
    connectionMetrics.recordAccepted();
    notificationService.createConnectionConfirmedNotification(connection.getRequesterHash(), connectionId);

    Map<String, User> userLookup = fetchPartnerUsers(List.of(saved), userHash);
    return toConnectionResponse(saved, userHash, userLookup);
  }

  /**
   * Denies a pending connection request.
   *
   * @param jwt the JWT token of the recipient
   * @param connectionId the connection to deny
   * @return the updated connection
   * @throws ResourceNotFoundException if connection not found
   * @throws IllegalStateException if connection is not pending or user is not recipient
   */
  @Transactional
  public ConnectionResponse denyConnection(Jwt jwt, UUID connectionId) {
    String email = jwt.getClaimAsString("email");
    String userHash = encryptionService.hashEmail(email);

    Connection connection = connectionRepository.findById(connectionId)
        .orElseThrow(() -> new ResourceNotFoundException("connection.error.notFound"));

    // Validate user is the recipient
    if (!connection.getRecipientHash().equals(userHash)) {
      throw new IllegalStateException("connection.error.notRecipient");
    }

    // Validate connection is pending
    if (connection.getStatus() != ConnectionStatus.PENDING) {
      throw new IllegalStateException("connection.error.notPending");
    }

    connection.setStatus(ConnectionStatus.DENIED);
    connection.setRespondedAt(OffsetDateTime.now());

    Connection saved = connectionRepository.save(connection);
    log.info("Connection denied: {}", connectionId);
    connectionMetrics.recordDenied();
    notificationService.createConnectionDeniedNotification(connection.getRequesterHash(), connectionId);

    Map<String, User> userLookup = fetchPartnerUsers(List.of(saved), userHash);
    return toConnectionResponse(saved, userHash, userLookup);
  }

  /**
   * Cancels or removes a connection.
   *
   * @param jwt the JWT token of the requester
   * @param connectionId the connection to cancel
   * @throws ResourceNotFoundException if connection not found
   * @throws IllegalStateException if user is not authorized to remove the connection
   */
  @Transactional
  public void cancelConnection(Jwt jwt, UUID connectionId) {
    String email = jwt.getClaimAsString("email");
    String userHash = encryptionService.hashEmail(email);

    Connection connection = connectionRepository.findById(connectionId)
        .orElseThrow(() -> new ResourceNotFoundException("connection.error.notFound"));

    boolean isRequester = connection.getRequesterHash().equals(userHash);
    boolean isRecipient = connection.getRecipientHash().equals(userHash);

    if (!isRequester && !isRecipient) {
      throw new IllegalStateException("connection.error.notParticipant");
    }

    if (connection.getStatus() == ConnectionStatus.PENDING) {
      if (!isRequester) {
        throw new IllegalStateException("connection.error.notRequester");
      }
      connectionRepository.delete(connection);
      log.info("Connection cancelled: {}", connectionId);
      connectionMetrics.recordCancelledPending();
      return;
    }

    if (connection.getStatus() == ConnectionStatus.CONFIRMED) {
      connectionRepository.delete(connection);
      log.info("Connection removed: {}", connectionId);
      connectionMetrics.recordRemovedConfirmed();
      return;
    }

    throw new IllegalStateException("connection.error.notPending");
  }

  /**
   * Gets connection statistics for the current user.
   *
   * @param jwt the JWT token of the user
   * @return connection statistics
   */
  @Transactional(readOnly = true)
  public ConnectionStatsResponse getStats(Jwt jwt) {
    String email = jwt.getClaimAsString("email");
    String userHash = encryptionService.hashEmail(email);

    long confirmedCount = connectionRepository.countConfirmedByUserHash(userHash);
    long pendingIncomingCount = connectionRepository.countByRecipientHashAndStatus(
        userHash, ConnectionStatus.PENDING);

    List<Connection> pendingSent = connectionRepository
        .findByRequesterHashAndStatus(userHash, ConnectionStatus.PENDING);
    Map<String, User> userLookup = fetchPartnerUsers(pendingSent, userHash);
    long pendingSentCount = pendingSent.stream()
        .filter(c -> isVisibleToRequester(c, userHash, userLookup))
        .count();

    return new ConnectionStatsResponse(confirmedCount, pendingIncomingCount, pendingSentCount);
  }

  private boolean isVisibleToRequester(Connection connection, String currentUserHash,
      Map<String, User> userLookup) {
    if (!connection.getRequesterHash().equals(currentUserHash)) {
      return true;
    }
    if (connection.getStatus() != ConnectionStatus.PENDING) {
      return true;
    }

    User recipient = userLookup.get(connection.getRecipientHash());
    if (recipient == null) {
      return false;
    }
    return recipient.getProfileVisibility() == ProfileVisibility.PUBLIC;
  }

  /**
   * Resolves a recipient user based on email or username input.
   *
   * @param identifier email or username
   * @return matching user if found and visible
   */
  private java.util.Optional<User> resolveRecipient(String identifier) {
    String normalized = normalizeIdentifier(identifier);
    if (normalized.isBlank()) {
      return java.util.Optional.empty();
    }
    if (isEmailIdentifier(normalized)) {
      String hash = encryptionService.hashEmail(normalized);
      return userRepository.findByEmailHash(hash);
    }
    String usernameHash = encryptionService.hashUsername(normalized);
    return userRepository.findByUsernameHash(usernameHash);
  }

  /**
   * Masks a user-provided identifier for logs.
   *
   * @param identifier email or username input
   * @return a masked representation safe for logs
   */
  private String maskIdentifier(String identifier) {
    String normalized = normalizeIdentifier(identifier);
    if (normalized.isBlank()) {
      return "***";
    }
    if (isEmailIdentifier(normalized)) {
      String[] parts = normalized.split("@", 2);
      String local = parts[0];
      String domain = parts.length > 1 ? parts[1] : "";
      if (local.isBlank()) {
        return "***" + (domain.isBlank() ? "" : "@" + domain);
      }
      return local.charAt(0) + "***@" + domain;
    }
    return normalized.charAt(0) + "***";
  }

  /**
   * Determines whether the identifier should be treated as an email address.
   *
   * @param identifier normalized identifier
   * @return true when it is an email-like identifier
   */
  private boolean isEmailIdentifier(String identifier) {
    return !identifier.startsWith("@")
        && identifier.contains("@")
        && !identifier.endsWith("@");
  }

  /**
   * Normalizes identifiers for lookups (trim, strip leading '@' for usernames).
   *
   * @param identifier raw identifier from request
   * @return normalized identifier (never null)
   */
  private String normalizeIdentifier(String identifier) {
    if (identifier == null) {
      return "";
    }
    String trimmed = identifier.trim();
    if (trimmed.startsWith("@")) {
      return trimmed.substring(1);
    }
    return trimmed;
  }

  /**
   * Batch-fetches all partner users for a list of connections.
   *
   * <p>Collects all partner email hashes and fetches them in a single query,
   * avoiding N+1 when converting multiple connections to responses.
   *
   * @param connections the connections to fetch partners for
   * @param currentUserHash the current user's email hash
   * @return map of email hash to User
   */
  private Map<String, User> fetchPartnerUsers(List<Connection> connections, String currentUserHash) {
    Set<String> partnerHashes = connections.stream()
        .map(c -> c.getRequesterHash().equals(currentUserHash)
            ? c.getRecipientHash() : c.getRequesterHash())
        .collect(Collectors.toSet());
    if (partnerHashes.isEmpty()) {
      return Map.of();
    }
    return userRepository.findByEmailHashIn(partnerHashes).stream()
        .collect(Collectors.toMap(User::getEmailHash, u -> u, (a, b) -> a));
  }

  /**
   * Converts a Connection entity to a ConnectionResponse DTO.
   */
  private ConnectionResponse toConnectionResponse(Connection connection, String currentUserHash,
      Map<String, User> userLookup) {
    boolean isRequester = connection.getRequesterHash().equals(currentUserHash);
    String partnerHash = isRequester ? connection.getRecipientHash() : connection.getRequesterHash();

    User partner = userLookup.get(partnerHash);
    String partnerDisplayName = null;
    String partnerUsername = null;
    String partnerAvatarThumbUrl = null;

    if (partner != null) {
      String firstName = partner.getFirstNameEncrypted() != null
          ? encryptionService.decryptFromBytes(partner.getFirstNameEncrypted()) : null;
      String lastName = partner.getLastNameEncrypted() != null
          ? encryptionService.decryptFromBytes(partner.getLastNameEncrypted()) : null;
      if (firstName != null && lastName != null) {
        partnerDisplayName = firstName + " " + lastName;
      } else if (firstName != null) {
        partnerDisplayName = firstName;
      }
      partnerUsername = partner.getUsername();
      partnerAvatarThumbUrl = buildPublicUrl(partner.getAvatarThumbKey());
    }

    return new ConnectionResponse(
        connection.getId(),
        connection.getStatus(),
        connection.getConnectionType() != null
            ? connection.getConnectionType().name()
            : null,
        isRequester,
        connection.getRequestedAt(),
        connection.getConfirmedAt(),
        partnerDisplayName,
        partnerUsername,
        partnerAvatarThumbUrl
    );
  }

  /**
   * Builds a public URL for an avatar key in storage.
   *
   * @param key the storage key
   * @return public URL or null when key is blank
   */
  private String buildPublicUrl(String key) {
    if (key == null || key.isBlank()) {
      return null;
    }
    return String.format("%s/%s/%s", storagePublicBaseUrl, avatarBucket, key);
  }
}
