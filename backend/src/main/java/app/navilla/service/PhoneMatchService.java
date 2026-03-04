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

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import app.navilla.entity.Connection;
import app.navilla.entity.ConnectionPhoneEntry;
import app.navilla.entity.ConnectionStatus;
import app.navilla.exception.RateLimitException;
import app.navilla.repository.ConnectionPhoneEntryRepository;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.PhoneBlockRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for phone-based connection matching.
 *
 * <p>Handles the lifecycle of phone-based connection entries:
 * <ul>
 *   <li>Registering phone entries from journal encounters</li>
 *   <li>Detecting mutual matches when both parties log each other's phone</li>
 *   <li>Rate limiting to prevent abuse</li>
 *   <li>Respecting block lists</li>
 * </ul>
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PhoneMatchService {

  private final ConnectionPhoneEntryRepository phoneEntryRepository;
  private final PhoneBlockRepository phoneBlockRepository;
  private final ConnectionRepository connectionRepository;
  private final AppConfigService appConfigService;
  private final EncryptionService encryptionService;

  /**
   * Hashes a phone number using the same pepper-based approach as email hashing.
   *
   * @param rawPhone the raw phone number (may contain dashes, spaces, etc.)
   * @return the hex-encoded hash (64 characters)
   */
  public String hashPhone(String rawPhone) {
    return encryptionService.hashPhone(rawPhone);
  }

  /**
   * Registers a phone entry from a journal encounter.
   *
   * <p>This method:
   * <ol>
   *   <li>Checks the user's weekly rate limit</li>
   *   <li>Hashes the phone number</li>
   *   <li>Saves the entry</li>
   *   <li>Checks for an immediate mutual match</li>
   * </ol>
   *
   * @param userHash       the submitting user's hash
   * @param rawPhone       the raw phone number
   * @param encounterDate  the date of the encounter
   * @param journalEntryId optional journal entry ID
   * @throws RateLimitException if the user has exceeded their weekly limit
   */
  @Transactional
  public void registerPhoneEntry(String userHash, String rawPhone,
                                  LocalDate encounterDate, UUID journalEntryId) {
    // 1. Check rate limit
    int maxPerWeek = appConfigService.getInt("phone_match.max_attempts_per_week", 5);
    OffsetDateTime weekStart = OffsetDateTime.now().minusDays(7);
    long count = phoneEntryRepository.countEntriesThisWeek(userHash, weekStart);
    if (count >= maxPerWeek) {
      throw new RateLimitException("phoneMatch.rateLimitExceeded");
    }

    // 2. Hash phone
    String phoneHash = hashPhone(rawPhone);

    // 3. Save entry
    ConnectionPhoneEntry entry = ConnectionPhoneEntry.builder()
        .userHash(userHash)
        .phoneHash(phoneHash)
        .encounterDate(encounterDate)
        .journalEntryId(journalEntryId)
        .build();
    phoneEntryRepository.save(entry);
    log.info("Registered phone entry for user {} on {}", userHash, encounterDate);

    // 4. Check for immediate mutual match
    checkAndCreateMutualMatch(userHash, phoneHash, encounterDate);
  }

  /**
   * Checks if a mutual match exists and creates a connection if so.
   *
   * <p>A mutual match occurs when:
   * <ul>
   *   <li>User A logged phone hash X</li>
   *   <li>Another user B also logged a phone hash that matches user A's phone</li>
   *   <li>The encounter dates are within the configurable window</li>
   *   <li>Neither user has blocked the other's phone hash</li>
   *   <li>No existing connection exists between them</li>
   * </ul>
   *
   * @param userHash      the current user's hash
   * @param phoneHash     the hashed phone number
   * @param encounterDate the encounter date
   */
  void checkAndCreateMutualMatch(String userHash, String phoneHash, LocalDate encounterDate) {
    int windowDays = appConfigService.getInt("phone_match.window_days", 2);

    // Find entries where someone else logged this same phone hash
    List<ConnectionPhoneEntry> otherEntries =
        phoneEntryRepository.findByPhoneHashAndMatchedFalseAndUserHashNot(phoneHash, userHash);

    for (ConnectionPhoneEntry otherEntry : otherEntries) {
      String otherUserHash = otherEntry.getUserHash();

      // Check date window
      long daysDiff = Math.abs(
          encounterDate.toEpochDay() - otherEntry.getEncounterDate().toEpochDay());
      if (daysDiff > windowDays) {
        continue;
      }

      // Check if either user has blocked the other's phone hash
      if (phoneBlockRepository.existsByUserHashAndBlockedPhoneHash(userHash, phoneHash)
          || phoneBlockRepository.existsByUserHashAndBlockedPhoneHash(otherUserHash, phoneHash)) {
        continue;
      }

      // Check if connection already exists
      if (connectionRepository.existsBetweenUsers(userHash, otherUserHash)) {
        log.debug("Connection already exists between {} and {}", userHash, otherUserHash);
        continue;
      }

      // Create connection
      Connection connection = Connection.builder()
          .requesterHash(userHash)
          .recipientHash(otherUserHash)
          .status(ConnectionStatus.CONFIRMED)
          .confirmedAt(OffsetDateTime.now())
          .respondedAt(OffsetDateTime.now())
          .build();
      connectionRepository.save(connection);

      // Mark both entries as matched
      otherEntry.setMatched(true);
      phoneEntryRepository.save(otherEntry);

      // Mark current user's entries for this phone hash as matched
      List<ConnectionPhoneEntry> myEntries =
          phoneEntryRepository.findByUserHashAndPhoneHashAndMatchedFalse(userHash, phoneHash);
      for (ConnectionPhoneEntry myEntry : myEntries) {
        myEntry.setMatched(true);
        phoneEntryRepository.save(myEntry);
      }

      log.info("Mutual phone match created between {} and {}", userHash, otherUserHash);
      break; // Only create one connection per phone hash match
    }
  }
}
