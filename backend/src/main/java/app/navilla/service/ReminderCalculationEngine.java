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
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import app.navilla.config.HealthCatalogProperties;
import app.navilla.entity.EncounterJournal;
import app.navilla.entity.Reminder;
import app.navilla.entity.TestResult;
import app.navilla.entity.TestVisit;
import app.navilla.repository.EncounterJournalRepository;
import app.navilla.repository.ReminderRepository;
import app.navilla.repository.TestResultRepository;
import app.navilla.repository.TestVisitRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Engine that analyzes a user's journal entries and health log data
 * to auto-generate testing reminders and follow-up reminders.
 *
 * <p>Called by the scheduler job for each active user. Works with
 * userHash (not JWT) since it runs in a background context.
 *
 * <p>Two categories of reminders are evaluated:
 * <ul>
 *   <li><strong>TESTING</strong> — based on encounter activity and time since last test</li>
 *   <li><strong>FOLLOW_UP</strong> — based on positive test results requiring test-of-cure</li>
 * </ul>
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderCalculationEngine {

  private final EncounterJournalRepository journalRepository;
  private final TestVisitRepository testVisitRepository;
  private final TestResultRepository testResultRepository;
  private final ReminderRepository reminderRepository;
  private final EncryptionService encryptionService;
  private final HealthCatalogProperties catalogProperties;

  /**
   * Evaluates a user's data and creates reminders as needed.
   *
   * @param userHash the hashed user identifier
   */
  @Transactional
  public void evaluateUser(String userHash) {
    evaluateTestingReminders(userHash);
    evaluateFollowUpReminders(userHash);
  }

  /**
   * Evaluates whether a TESTING reminder should be generated based on
   * encounter activity and time since last test.
   *
   * <p>Logic:
   * <ol>
   *   <li>Find the most recent TestVisit for this user</li>
   *   <li>Find all journal entries (to assess activity level)</li>
   *   <li>Count unique partners to determine activity level</li>
   *   <li>Apply heuristics: high activity uses shorter interval, moderate uses longer</li>
   *   <li>If no test exists but activity does, use nudgeAfterDays from first entry</li>
   *   <li>Skip if an active TESTING reminder already exists</li>
   * </ol>
   */
  private void evaluateTestingReminders(String userHash) {
    HealthCatalogProperties.TestingHeuristicsConfig heuristics =
        catalogProperties.testingHeuristics();

    List<TestVisit> visits = testVisitRepository.findByUserHashOrderByTestDateDesc(userHash);
    List<EncounterJournal> allEntries =
        journalRepository.findByUserHashOrderByEncounterDateDesc(userHash);

    // No activity at all — nothing to evaluate
    if (allEntries.isEmpty()) {
      log.debug("No journal entries for user; skipping testing reminder evaluation");
      return;
    }

    // Determine entries since last test (or all entries if never tested)
    List<EncounterJournal> entriesSinceLastTest;
    LocalDate lastTestDate;

    if (!visits.isEmpty()) {
      lastTestDate = visits.getFirst().getTestDate();
      entriesSinceLastTest = allEntries.stream()
          .filter(e -> e.getEncounterDate().isAfter(lastTestDate))
          .toList();
    } else {
      lastTestDate = null;
      entriesSinceLastTest = allEntries;
    }

    // Count unique partners in entries since last test
    Set<UUID> uniquePartners = entriesSinceLastTest.stream()
        .map(EncounterJournal::getPartnerId)
        .filter(java.util.Objects::nonNull)
        .collect(Collectors.toSet());

    // Also count entries without a partner ID as individual encounters
    long nullPartnerCount = entriesSinceLastTest.stream()
        .filter(e -> e.getPartnerId() == null)
        .count();

    long effectiveUniqueCount = uniquePartners.size() + nullPartnerCount;

    // Determine the interval based on activity level
    int intervalDays;
    if (effectiveUniqueCount >= heuristics.highActivityThreshold()) {
      intervalDays = heuristics.highActivityIntervalDays();
    } else {
      intervalDays = heuristics.moderateActivityIntervalDays();
    }

    boolean shouldRemind;

    if (lastTestDate != null) {
      // Have a previous test — check if interval exceeded
      long daysSinceLastTest = ChronoUnit.DAYS.between(lastTestDate, LocalDate.now());
      shouldRemind = daysSinceLastTest > intervalDays;
    } else {
      // Never tested — nudge if activity is old enough
      LocalDate earliestEntry = allEntries.stream()
          .map(EncounterJournal::getEncounterDate)
          .min(LocalDate::compareTo)
          .orElse(LocalDate.now());
      long daysSinceFirstEntry = ChronoUnit.DAYS.between(earliestEntry, LocalDate.now());
      shouldRemind = daysSinceFirstEntry > heuristics.nudgeAfterDays();
    }

    if (!shouldRemind) {
      log.debug("Testing reminder not warranted for user");
      return;
    }

    // Check for existing active TESTING reminder
    List<Reminder> existingReminders =
        reminderRepository.findByUserHashAndReminderTypeAndActiveTrueAndCompletedAtIsNull(
            userHash, "TESTING");

    if (!existingReminders.isEmpty()) {
      log.debug("Active TESTING reminder already exists for user; skipping");
      return;
    }

    // Create the TESTING reminder
    Reminder reminder = Reminder.builder()
        .userHash(userHash)
        .reminderType("TESTING")
        .titleEncrypted(encryptionService.encryptToBytes("Time for a test"))
        .scheduledFor(OffsetDateTime.now(ZoneOffset.UTC))
        .active(true)
        .build();

    reminderRepository.save(reminder);
    log.info("TESTING reminder created for user");
  }

  /**
   * Evaluates whether FOLLOW_UP reminders should be generated based on
   * positive test results.
   *
   * <p>For each positive result, creates a follow-up reminder scheduled
   * for testOfCureDays after the test date, unless one already exists.
   */
  private void evaluateFollowUpReminders(String userHash) {
    HealthCatalogProperties.FollowUpRulesConfig followUp = catalogProperties.followUpRules();

    List<TestResult> positiveResults = testResultRepository.findPositiveByUserHash(userHash);

    for (TestResult result : positiveResults) {
      // Check if a FOLLOW_UP reminder already exists for this specific result
      List<Reminder> existingFollowUps =
          reminderRepository.findByReferenceIdAndActiveTrueAndCompletedAtIsNull(result.getId());

      if (!existingFollowUps.isEmpty()) {
        log.debug("Active FOLLOW_UP reminder already exists for result {}; skipping",
            result.getId());
        continue;
      }

      // Look up the test visit to get the test date
      TestVisit visit = testVisitRepository.findById(result.getVisitId()).orElse(null);
      if (visit == null) {
        log.warn("TestVisit not found for result {}; skipping follow-up", result.getId());
        continue;
      }

      OffsetDateTime scheduledFor = visit.getTestDate()
          .plusDays(followUp.testOfCureDays())
          .atStartOfDay()
          .atOffset(ZoneOffset.UTC);

      Reminder reminder = Reminder.builder()
          .userHash(userHash)
          .reminderType("FOLLOW_UP")
          .referenceId(result.getId())
          .titleEncrypted(encryptionService.encryptToBytes("Follow-up test recommended"))
          .scheduledFor(scheduledFor)
          .active(true)
          .build();

      reminderRepository.save(reminder);
      log.info("FOLLOW_UP reminder created for result {}", result.getId());
    }
  }
}
