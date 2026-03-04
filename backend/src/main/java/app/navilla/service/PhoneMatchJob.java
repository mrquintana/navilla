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

import java.util.List;

import app.navilla.entity.ConnectionPhoneEntry;
import app.navilla.repository.ConnectionPhoneEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduled job that processes unmatched phone entries.
 *
 * <p>Runs periodically to:
 * <ol>
 *   <li>Find all unmatched phone entries</li>
 *   <li>Attempt mutual matching via {@link PhoneMatchService}</li>
 *   <li>For entries with no mutual match, delegate to
 *       {@link PhoneNotificationMatchService} for one-sided notification</li>
 * </ol>
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PhoneMatchJob {

  private final PhoneMatchService phoneMatchService;
  private final PhoneNotificationMatchService notificationMatchService;
  private final ConnectionPhoneEntryRepository phoneEntryRepository;

  /**
   * Processes all unmatched phone entries.
   *
   * <p>Runs every 5 minutes by default (configurable via
   * {@code navilla.phone-match.interval-ms}).
   */
  @Scheduled(fixedDelayString = "${navilla.phone-match.interval-ms:300000}")
  @Transactional
  public void processUnmatchedEntries() {
    List<ConnectionPhoneEntry> unmatched = phoneEntryRepository.findByMatchedFalse();

    if (unmatched.isEmpty()) {
      log.debug("Phone match job: no unmatched entries to process");
      return;
    }

    log.info("Phone match job: processing {} unmatched entries", unmatched.size());
    int matched = 0;
    int delegated = 0;

    for (ConnectionPhoneEntry entry : unmatched) {
      try {
        // Try mutual match
        phoneMatchService.checkAndCreateMutualMatch(
            entry.getUserHash(), entry.getPhoneHash(), entry.getEncounterDate());

        // Re-read the entry to check if it was matched
        ConnectionPhoneEntry refreshed = phoneEntryRepository.findById(entry.getId())
            .orElse(entry);

        if (Boolean.TRUE.equals(refreshed.getMatched())) {
          matched++;
        } else {
          // No mutual match — delegate to notification service
          notificationMatchService.processOneSidedEntry(refreshed);
          delegated++;
        }
      } catch (Exception e) {
        log.error("Failed to process phone entry {}: {}", entry.getId(), e.getMessage());
      }
    }

    log.debug("Phone match job completed: {} matched, {} delegated for notification",
        matched, delegated);
  }
}
