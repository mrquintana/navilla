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

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import app.navilla.dto.CardVerificationResponse;
import app.navilla.dto.CreateVerificationCardRequest;
import app.navilla.dto.PublicVerificationCardResponse;
import app.navilla.dto.UpdateVerificationCardRequest;
import app.navilla.dto.VerificationCardResponse;
import app.navilla.entity.HealthStatus;
import app.navilla.entity.User;
import app.navilla.entity.VerificationCard;
import app.navilla.repository.HealthStatusRepository;
import app.navilla.repository.UserRepository;
import app.navilla.repository.VerificationCardRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VerificationCardService {

  private final VerificationCardRepository verificationCardRepository;
  private final HealthStatusRepository healthStatusRepository;
  private final EncryptionService encryptionService;
  private final UserRepository userRepository;
  private final SecureRandom secureRandom = new SecureRandom();

  @Value("${navilla.app.base-url:https://www.navilla.app}")
  private String appBaseUrl;

  /**
   * Creates a new verification card for the given user.
   *
   * <p>Display name is auto-resolved from the user's profile (firstName + lastName).
   * Only conditions where the user has a verified health status with a test date are included.
   *
   * @param userHash the user's hashed identifier
   * @param req the creation request with card configuration
   * @return the created verification card response
   */
  @Transactional
  public VerificationCardResponse createCard(String userHash, CreateVerificationCardRequest req) {
    User user = userRepository.findByEmailHash(userHash)
        .orElseThrow(() -> new IllegalStateException("User not found"));

    String firstName = user.getFirstNameEncrypted() != null
        ? encryptionService.decryptFromBytes(user.getFirstNameEncrypted()) : null;
    String lastName = user.getLastNameEncrypted() != null
        ? encryptionService.decryptFromBytes(user.getLastNameEncrypted()) : null;
    String username = user.getUsername();

    if (firstName == null || firstName.isBlank()
        || lastName == null || lastName.isBlank()
        || username == null || username.isBlank()) {
      throw new IllegalStateException("First name, last name, and username must be set");
    }

    String displayName = firstName + " " + lastName;
    byte[] displayNameEncrypted = encryptionService.encryptToBytes(displayName);

    // Filter conditions to only verified ones with test dates
    String[] validConditions = filterVerifiedConditions(userHash, req.includedConditions());

    byte[] tokenBytes = new byte[32];
    secureRandom.nextBytes(tokenBytes);
    String shareToken = HexFormat.of().formatHex(tokenBytes);

    VerificationCard card = VerificationCard.builder()
        .userHash(userHash)
        .displayNameEncrypted(displayNameEncrypted)
        .includedConditions(validConditions)
        .showTestDates(true)
        .showVerificationLevel(req.showVerificationLevel() != null ? req.showVerificationLevel() : true)
        .shareToken(shareToken)
        .maxViews(req.maxViews())
        .expiresAt(req.expiresAt())
        .build();

    card = verificationCardRepository.save(card);
    return toResponse(card, username);
  }

  /**
   * Lists all verification cards for the given user.
   *
   * @param userHash the user's hashed identifier
   * @return list of verification card responses ordered by creation date descending
   */
  @Transactional(readOnly = true)
  public List<VerificationCardResponse> getUserCards(String userHash) {
    String username = userRepository.findByEmailHash(userHash)
        .map(User::getUsername)
        .orElse(null);

    return verificationCardRepository.findByUserHashOrderByCreatedAtDesc(userHash)
        .stream()
        .map(card -> toResponse(card, username))
        .toList();
  }

  /**
   * Updates an existing verification card.
   *
   * <p>Display name is re-resolved from the user's profile on every update.
   * Conditions are validated against the verified-only filter.
   *
   * @param userHash the user's hashed identifier
   * @param cardId the card's UUID as string
   * @param req the update request with fields to change
   * @return the updated verification card response
   */
  @Transactional
  public VerificationCardResponse updateCard(String userHash, String cardId,
      UpdateVerificationCardRequest req) {
    VerificationCard card = verificationCardRepository.findByIdAndUserHash(
        java.util.UUID.fromString(cardId), userHash)
        .orElseThrow(() -> new IllegalArgumentException("Card not found"));

    // Re-resolve name from profile
    User user = userRepository.findByEmailHash(userHash)
        .orElseThrow(() -> new IllegalStateException("User not found"));

    String firstName = user.getFirstNameEncrypted() != null
        ? encryptionService.decryptFromBytes(user.getFirstNameEncrypted()) : null;
    String lastName = user.getLastNameEncrypted() != null
        ? encryptionService.decryptFromBytes(user.getLastNameEncrypted()) : null;

    if (firstName != null && !firstName.isBlank() && lastName != null && !lastName.isBlank()) {
      String displayName = firstName + " " + lastName;
      card.setDisplayNameEncrypted(encryptionService.encryptToBytes(displayName));
    }

    if (req.includedConditions() != null) {
      String[] validConditions = filterVerifiedConditions(userHash, req.includedConditions());
      card.setIncludedConditions(validConditions);
    }
    if (req.showVerificationLevel() != null) {
      card.setShowVerificationLevel(req.showVerificationLevel());
    }
    if (req.privacyMode() != null) {
      card.setPrivacyMode(req.privacyMode());
    }
    if (req.maxViews() != null) {
      card.setMaxViews(req.maxViews());
    }
    if (req.expiresAt() != null) {
      card.setExpiresAt(req.expiresAt());
    }

    card = verificationCardRepository.save(card);
    return toResponse(card, user.getUsername());
  }

  /**
   * Deletes a verification card owned by the given user.
   *
   * @param userHash the user's hashed identifier
   * @param cardId the card's UUID as string
   */
  @Transactional
  public void deleteCard(String userHash, String cardId) {
    VerificationCard card = verificationCardRepository.findByIdAndUserHash(
        java.util.UUID.fromString(cardId), userHash)
        .orElseThrow(() -> new IllegalArgumentException("Card not found"));
    verificationCardRepository.delete(card);
  }

  /**
   * Retrieves a public verification card by share token, incrementing the view count.
   *
   * <p>Only conditions with verified=true AND a non-null test date are included.
   * Test dates are always shown.
   *
   * @param shareToken the unique share token for the card
   * @return the public verification card response with condition statuses
   * @throws IllegalArgumentException if the card is not found
   * @throws IllegalStateException if the card has expired or reached its view limit
   */
  @Transactional
  public PublicVerificationCardResponse getPublicCard(String shareToken) {
    VerificationCard card = verificationCardRepository.findByShareToken(shareToken)
        .orElseThrow(() -> new IllegalArgumentException("Card not found"));

    // Check expiry
    if (card.getExpiresAt() != null && card.getExpiresAt().isBefore(OffsetDateTime.now())) {
      throw new IllegalStateException("Card has expired");
    }

    // Check view limit
    if (card.getMaxViews() != null && card.getCurrentViews() >= card.getMaxViews()) {
      throw new IllegalStateException("Card view limit reached");
    }

    // Increment views
    card.setCurrentViews(card.getCurrentViews() + 1);
    verificationCardRepository.save(card);

    // Build response
    String displayName = card.getDisplayNameEncrypted() != null
        ? encryptionService.decryptFromBytes(card.getDisplayNameEncrypted())
        : "Anonymous";

    // Fetch username from user entity
    String username = userRepository.findByEmailHash(card.getUserHash())
        .map(User::getUsername)
        .orElse(null);

    List<HealthStatus> statuses = healthStatusRepository
        .findByUserHashOrderByReportedAtDesc(card.getUserHash());

    List<String> includedConditions = Arrays.asList(card.getIncludedConditions());

    // Only include conditions that are verified AND have a test date
    List<PublicVerificationCardResponse.PublicConditionStatus> conditions = statuses.stream()
        .filter(hs -> includedConditions.contains(hs.getConditionType().toLowerCase())
            || includedConditions.contains(hs.getConditionType()))
        .filter(hs -> Boolean.TRUE.equals(hs.getVerified()) && hs.getTestDate() != null)
        .map(hs -> new PublicVerificationCardResponse.PublicConditionStatus(
            hs.getConditionType(),
            hs.getStatus().name(),
            card.getShowVerificationLevel()
                ? "LAB_VERIFIED"
                : null,
            hs.getTestDate().toString()
        ))
        .toList();

    Integer viewsRemaining = card.getMaxViews() != null
        ? card.getMaxViews() - card.getCurrentViews()
        : null;

    return new PublicVerificationCardResponse(
        displayName,
        username,
        conditions,
        card.getExpiresAt(),
        viewsRemaining
    );
  }

  /**
   * Verifies that a card is currently valid without incrementing the view count.
   *
   * <p>Returns a signed response proving the verification came from Navilla's servers.
   *
   * @param shareToken the unique share token for the card
   * @return the card verification response with validity, timestamp, and HMAC signature
   * @throws IllegalArgumentException if the card is not found
   */
  @Transactional(readOnly = true)
  public CardVerificationResponse verifyCard(String shareToken) {
    VerificationCard card = verificationCardRepository.findByShareToken(shareToken)
        .orElseThrow(() -> new IllegalArgumentException("Card not found"));

    // Check expiry
    if (card.getExpiresAt() != null && card.getExpiresAt().isBefore(OffsetDateTime.now())) {
      return new CardVerificationResponse(false, null, null);
    }

    // Check view limit
    if (card.getMaxViews() != null && card.getCurrentViews() >= card.getMaxViews()) {
      return new CardVerificationResponse(false, null, null);
    }

    String verifiedAt = OffsetDateTime.now(ZoneOffset.UTC)
        .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    String signature = encryptionService.hmacSign(shareToken + ":" + verifiedAt);

    return new CardVerificationResponse(true, verifiedAt, signature);
  }

  /**
   * Filters a list of requested conditions to only those where the user has
   * a verified health status with a non-null test date.
   */
  private String[] filterVerifiedConditions(String userHash, List<String> requestedConditions) {
    if (requestedConditions == null || requestedConditions.isEmpty()) {
      return new String[0];
    }

    List<HealthStatus> statuses = healthStatusRepository
        .findByUserHashOrderByReportedAtDesc(userHash);

    Set<String> verifiedConditionCodes = statuses.stream()
        .filter(hs -> Boolean.TRUE.equals(hs.getVerified()) && hs.getTestDate() != null)
        .map(hs -> hs.getConditionType().toLowerCase())
        .collect(Collectors.toSet());

    return requestedConditions.stream()
        .filter(c -> verifiedConditionCodes.contains(c.toLowerCase()))
        .toArray(String[]::new);
  }

  private VerificationCardResponse toResponse(VerificationCard card, String username) {
    String displayName = card.getDisplayNameEncrypted() != null
        ? encryptionService.decryptFromBytes(card.getDisplayNameEncrypted())
        : null;

    String shareUrl = appBaseUrl + "/v/" + card.getShareToken();

    return new VerificationCardResponse(
        card.getId().toString(),
        displayName,
        username,
        Arrays.asList(card.getIncludedConditions()),
        card.getShowVerificationLevel(),
        card.getShareToken(),
        shareUrl,
        card.getPrivacyMode(),
        card.getMaxViews(),
        card.getCurrentViews(),
        card.getExpiresAt(),
        card.getCreatedAt(),
        card.getUpdatedAt()
    );
  }
}
