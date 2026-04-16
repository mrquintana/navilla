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
import java.util.UUID;

import app.navilla.entity.Connection;
import app.navilla.entity.ConnectionPhoneEntry;
import app.navilla.entity.ConnectionStatus;
import app.navilla.entity.ConnectionType;
import app.navilla.entity.PhoneBlock;
import app.navilla.entity.PhoneReport;
import app.navilla.exception.ConnectionConflictException;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.ConnectionPhoneEntryRepository;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.PhoneBlockRepository;
import app.navilla.repository.PhoneReportRepository;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for handling notification-based phone matching.
 *
 * <p>Handles the flow when a one-sided phone entry is detected and the
 * recipient needs to confirm or deny the match. Also handles blocking
 * and reporting of phone numbers.
 *
 * <p>Note: The one-sided notification flow requires mapping a phone hash
 * back to a user, which requires a phone_hash column on the users table.
 * Since that column doesn't exist yet, the {@link #processOneSidedEntry}
 * method logs a TODO and returns without action. Mutual matching via
 * {@link PhoneMatchService} works fully without this.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PhoneNotificationMatchService {

  private final UserRepository userRepository;
  private final ConnectionPhoneEntryRepository phoneEntryRepository;
  private final PhoneBlockRepository phoneBlockRepository;
  private final PhoneReportRepository phoneReportRepository;
  private final ConnectionRepository connectionRepository;
  private final EncryptionService encryptionService;

  /**
   * Processes a one-sided phone entry for notification matching.
   *
   * <p>Currently a no-op because we cannot map a phone hash back to a user
   * without a phone_hash column on the users table. The mutual match path
   * in {@link PhoneMatchService} works without this.
   *
   * @param entry the unmatched phone entry to process
   */
  public void processOneSidedEntry(ConnectionPhoneEntry entry) {
    // TODO: Implement when users table has phone_hash column.
    // To send a notification, we need to find which user owns the phone number
    // represented by entry.getPhoneHash(). Since we only store hashes (not the
    // actual numbers), and the users table doesn't have a phone_hash column,
    // we can't look up the recipient. This is a known limitation.
    log.debug("One-sided phone entry {} — notification matching not yet available "
        + "(requires phone_hash on users table)", entry.getId());
  }

  /**
   * Confirms a phone match, creating a connection between the two users.
   *
   * @param jwt          the JWT of the confirming user
   * @param phoneEntryId the phone entry ID to confirm
   * @return the created connection
   * @throws ResourceNotFoundException    if the phone entry is not found
   * @throws ConnectionConflictException  if a connection already exists
   */
  @Transactional
  public Connection confirmMatch(Jwt jwt, UUID phoneEntryId) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));

    ConnectionPhoneEntry entry = phoneEntryRepository.findById(phoneEntryId)
        .orElseThrow(() -> new ResourceNotFoundException("phoneMatch.error.notFound"));

    String otherUserHash = entry.getUserHash();

    // Check if connection already exists
    if (connectionRepository.existsBetweenUsers(userHash, otherUserHash)) {
      throw new ConnectionConflictException("phoneMatch.error.alreadyConnected", null);
    }

    // Create connection
    Connection connection = Connection.builder()
        .requesterHash(otherUserHash)
        .recipientHash(userHash)
        .status(ConnectionStatus.CONFIRMED)
        .connectionType(ConnectionType.NOTIFICATION_MATCH)
        .confirmedAt(OffsetDateTime.now())
        .respondedAt(OffsetDateTime.now())
        .build();
    connectionRepository.save(connection);

    // Mark entry as matched
    entry.setMatched(true);
    phoneEntryRepository.save(entry);

    log.debug("Phone match confirmed between {} and {}", userHash, otherUserHash);
    log.info("Phone match confirmed");
    return connection;
  }

  /**
   * Denies a phone match, marking the entry as processed.
   *
   * @param jwt          the JWT of the denying user
   * @param phoneEntryId the phone entry ID to deny
   * @throws ResourceNotFoundException if the phone entry is not found
   */
  @Transactional
  public void denyMatch(Jwt jwt, UUID phoneEntryId) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));

    ConnectionPhoneEntry entry = phoneEntryRepository.findById(phoneEntryId)
        .orElseThrow(() -> new ResourceNotFoundException("phoneMatch.error.notFound"));

    // Mark as matched (processed) to prevent re-processing
    entry.setMatched(true);
    phoneEntryRepository.save(entry);

    log.debug("Phone match denied by {} for entry {}", userHash, phoneEntryId);
  }

  /**
   * Blocks a phone hash for the authenticated user.
   *
   * @param jwt       the JWT of the blocking user
   * @param phoneHash the phone hash to block
   */
  @Transactional
  public void blockPhone(Jwt jwt, String phoneHash) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));

    if (phoneBlockRepository.existsByUserHashAndBlockedPhoneHash(userHash, phoneHash)) {
      log.debug("Phone hash {} already blocked by user {}", phoneHash, userHash);
      return;
    }

    PhoneBlock block = PhoneBlock.builder()
        .userHash(userHash)
        .blockedPhoneHash(phoneHash)
        .build();
    phoneBlockRepository.save(block);

    log.debug("User {} blocked phone hash {}", userHash, phoneHash);
  }

  /**
   * Reports a phone hash for abuse and automatically blocks it.
   *
   * @param jwt       the JWT of the reporting user
   * @param phoneHash the phone hash to report
   * @param reason    the reason for the report
   */
  @Transactional
  public void reportPhone(Jwt jwt, String phoneHash, String reason) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));

    // Create report
    PhoneReport report = PhoneReport.builder()
        .reporterHash(userHash)
        .reportedPhoneHash(phoneHash)
        .reason(reason)
        .build();
    phoneReportRepository.save(report);

    // Auto-block
    if (!phoneBlockRepository.existsByUserHashAndBlockedPhoneHash(userHash, phoneHash)) {
      PhoneBlock block = PhoneBlock.builder()
          .userHash(userHash)
          .blockedPhoneHash(phoneHash)
          .build();
      phoneBlockRepository.save(block);
    }

    log.info("Phone hash reported for: {}", reason);
    log.debug("User {} reported phone hash {}", userHash, phoneHash);
  }
}
