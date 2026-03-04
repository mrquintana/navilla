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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import app.navilla.config.HealthCatalogProperties;
import app.navilla.config.HealthCatalogProperties.FollowUpRulesConfig;
import app.navilla.config.HealthCatalogProperties.TestingHeuristicsConfig;
import app.navilla.entity.EncounterJournal;
import app.navilla.entity.Reminder;
import app.navilla.entity.TestResult;
import app.navilla.entity.TestResultStatus;
import app.navilla.entity.TestVisit;
import app.navilla.repository.EncounterJournalRepository;
import app.navilla.repository.ReminderRepository;
import app.navilla.repository.TestResultRepository;
import app.navilla.repository.TestVisitRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link ReminderCalculationEngine}.
 *
 * <p>Tests the smart reminder logic that analyzes journal entries and health log
 * data to auto-generate testing reminders and follow-up reminders.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@ExtendWith(MockitoExtension.class)
class ReminderCalculationEngineTest {

  @Mock
  private EncounterJournalRepository journalRepository;

  @Mock
  private TestVisitRepository testVisitRepository;

  @Mock
  private TestResultRepository testResultRepository;

  @Mock
  private ReminderRepository reminderRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private HealthCatalogProperties catalogProperties;

  @InjectMocks
  private ReminderCalculationEngine engine;

  private static final String USER_HASH = "userhash123";
  private static final byte[] ENCRYPTED_TITLE = new byte[]{10, 20, 30};

  private TestingHeuristicsConfig defaultHeuristics() {
    return new TestingHeuristicsConfig(90, 180, 3, 180);
  }

  private FollowUpRulesConfig defaultFollowUpRules() {
    return new FollowUpRulesConfig(21, 14);
  }

  private void stubEncryption() {
    when(encryptionService.encryptToBytes(anyString())).thenReturn(ENCRYPTED_TITLE);
  }

  private EncounterJournal buildJournalEntry(LocalDate date, UUID partnerId) {
    return EncounterJournal.builder()
        .id(UUID.randomUUID())
        .userHash(USER_HASH)
        .encounterDate(date)
        .partnerId(partnerId)
        .build();
  }

  private TestVisit buildTestVisit(LocalDate testDate) {
    return TestVisit.builder()
        .id(UUID.randomUUID())
        .userHash(USER_HASH)
        .testDate(testDate)
        .build();
  }

  private TestResult buildTestResult(UUID visitId, TestResultStatus status, String condition) {
    return TestResult.builder()
        .id(UUID.randomUUID())
        .visitId(visitId)
        .status(status)
        .conditionType(condition)
        .build();
  }

  @Nested
  @DisplayName("Testing Reminders")
  class TestingReminders {

    @Test
    @DisplayName("should generate TESTING reminder when encounters since last test exceed high-activity threshold")
    void shouldGenerateTestingReminderForHighActivity() {
      stubEncryption();
      when(catalogProperties.testingHeuristics()).thenReturn(defaultHeuristics());
      when(catalogProperties.followUpRules()).thenReturn(defaultFollowUpRules());

      // Last test was 100 days ago (exceeds highActivityIntervalDays=90)
      TestVisit lastVisit = buildTestVisit(LocalDate.now().minusDays(100));
      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(List.of(lastVisit));

      // 4 unique partners since last test (>= highActivityThreshold=3)
      UUID p1 = UUID.randomUUID();
      UUID p2 = UUID.randomUUID();
      UUID p3 = UUID.randomUUID();
      UUID p4 = UUID.randomUUID();
      List<EncounterJournal> entries = List.of(
          buildJournalEntry(LocalDate.now().minusDays(80), p1),
          buildJournalEntry(LocalDate.now().minusDays(60), p2),
          buildJournalEntry(LocalDate.now().minusDays(40), p3),
          buildJournalEntry(LocalDate.now().minusDays(20), p4));
      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(entries);

      // No existing active TESTING reminder
      when(reminderRepository.findByUserHashAndReminderTypeAndActiveTrueAndCompletedAtIsNull(
          USER_HASH, "TESTING")).thenReturn(Collections.emptyList());

      // No positive results for follow-up evaluation
      when(testResultRepository.findPositiveByUserHash(USER_HASH))
          .thenReturn(Collections.emptyList());

      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> {
        Reminder r = i.getArgument(0);
        r.setId(UUID.randomUUID());
        return r;
      });

      engine.evaluateUser(USER_HASH);

      ArgumentCaptor<Reminder> captor = ArgumentCaptor.forClass(Reminder.class);
      verify(reminderRepository).save(captor.capture());
      Reminder saved = captor.getValue();
      assertThat(saved.getUserHash()).isEqualTo(USER_HASH);
      assertThat(saved.getReminderType()).isEqualTo("TESTING");
      assertThat(saved.getActive()).isTrue();
    }

    @Test
    @DisplayName("should use moderate interval when unique partners < highActivityThreshold")
    void shouldUseModerateIntervalWhenFewPartners() {
      when(catalogProperties.testingHeuristics()).thenReturn(defaultHeuristics());
      when(catalogProperties.followUpRules()).thenReturn(defaultFollowUpRules());

      // Last test was 100 days ago (within moderateActivityIntervalDays=180, but past highActivityIntervalDays=90)
      TestVisit lastVisit = buildTestVisit(LocalDate.now().minusDays(100));
      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(List.of(lastVisit));

      // Only 2 unique partners (< highActivityThreshold=3 => moderate interval of 180 days)
      UUID p1 = UUID.randomUUID();
      UUID p2 = UUID.randomUUID();
      List<EncounterJournal> entries = List.of(
          buildJournalEntry(LocalDate.now().minusDays(80), p1),
          buildJournalEntry(LocalDate.now().minusDays(60), p2)
      );
      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(entries);

      // No positive results for follow-up evaluation
      when(testResultRepository.findPositiveByUserHash(USER_HASH))
          .thenReturn(Collections.emptyList());

      engine.evaluateUser(USER_HASH);

      // Should NOT generate a reminder because 100 days < moderateActivityIntervalDays=180
      verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    @DisplayName("should generate nudge when no test in nudgeAfterDays with any activity")
    void shouldGenerateNudgeWhenNoTestButActivity() {
      stubEncryption();
      when(catalogProperties.testingHeuristics()).thenReturn(defaultHeuristics());
      when(catalogProperties.followUpRules()).thenReturn(defaultFollowUpRules());

      // No test visits at all
      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      // Has journal entries, first one 200 days ago (> nudgeAfterDays=180)
      UUID p1 = UUID.randomUUID();
      List<EncounterJournal> entries = List.of(
          buildJournalEntry(LocalDate.now().minusDays(200), p1),
          buildJournalEntry(LocalDate.now().minusDays(100), p1)
      );
      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(entries);

      // No existing active TESTING reminder
      when(reminderRepository.findByUserHashAndReminderTypeAndActiveTrueAndCompletedAtIsNull(
          USER_HASH, "TESTING")).thenReturn(Collections.emptyList());

      // No positive results for follow-up evaluation
      when(testResultRepository.findPositiveByUserHash(USER_HASH))
          .thenReturn(Collections.emptyList());

      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> {
        Reminder r = i.getArgument(0);
        r.setId(UUID.randomUUID());
        return r;
      });

      engine.evaluateUser(USER_HASH);

      ArgumentCaptor<Reminder> captor = ArgumentCaptor.forClass(Reminder.class);
      verify(reminderRepository).save(captor.capture());
      Reminder saved = captor.getValue();
      assertThat(saved.getReminderType()).isEqualTo("TESTING");
      assertThat(saved.getActive()).isTrue();
    }

    @Test
    @DisplayName("should NOT generate reminder when no journal entries exist")
    void shouldNotGenerateReminderWhenNoJournalEntries() {
      when(catalogProperties.testingHeuristics()).thenReturn(defaultHeuristics());
      when(catalogProperties.followUpRules()).thenReturn(defaultFollowUpRules());

      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());
      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      // No positive results for follow-up evaluation
      when(testResultRepository.findPositiveByUserHash(USER_HASH))
          .thenReturn(Collections.emptyList());

      engine.evaluateUser(USER_HASH);

      verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    @DisplayName("should NOT generate duplicate if active TESTING reminder already exists for user")
    void shouldNotGenerateDuplicateTestingReminder() {
      when(catalogProperties.testingHeuristics()).thenReturn(defaultHeuristics());
      when(catalogProperties.followUpRules()).thenReturn(defaultFollowUpRules());

      // Last test was 100 days ago
      TestVisit lastVisit = buildTestVisit(LocalDate.now().minusDays(100));
      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(List.of(lastVisit));

      // 4 unique partners (high activity)
      UUID p1 = UUID.randomUUID();
      UUID p2 = UUID.randomUUID();
      UUID p3 = UUID.randomUUID();
      UUID p4 = UUID.randomUUID();
      List<EncounterJournal> entries = List.of(
          buildJournalEntry(LocalDate.now().minusDays(80), p1),
          buildJournalEntry(LocalDate.now().minusDays(60), p2),
          buildJournalEntry(LocalDate.now().minusDays(40), p3),
          buildJournalEntry(LocalDate.now().minusDays(20), p4)
      );
      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(entries);

      // Active TESTING reminder already exists
      Reminder existingReminder = Reminder.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .reminderType("TESTING")
          .active(true)
          .build();
      when(reminderRepository.findByUserHashAndReminderTypeAndActiveTrueAndCompletedAtIsNull(
          USER_HASH, "TESTING")).thenReturn(List.of(existingReminder));

      // No positive results for follow-up evaluation
      when(testResultRepository.findPositiveByUserHash(USER_HASH))
          .thenReturn(Collections.emptyList());

      engine.evaluateUser(USER_HASH);

      // Should NOT save any new reminder
      verify(reminderRepository, never()).save(any(Reminder.class));
    }
  }

  @Nested
  @DisplayName("Follow-Up Reminders")
  class FollowUpReminders {

    @Test
    @DisplayName("should generate FOLLOW_UP reminder after POSITIVE test result")
    void shouldGenerateFollowUpForPositiveResult() {
      stubEncryption();
      when(catalogProperties.testingHeuristics()).thenReturn(defaultHeuristics());
      when(catalogProperties.followUpRules()).thenReturn(defaultFollowUpRules());

      // No journal entries (skip testing reminders)
      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());
      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      // Positive test result
      UUID visitId = UUID.randomUUID();
      TestVisit visit = TestVisit.builder()
          .id(visitId)
          .userHash(USER_HASH)
          .testDate(LocalDate.now().minusDays(5))
          .build();

      TestResult positiveResult = buildTestResult(visitId, TestResultStatus.POSITIVE, "CHLAMYDIA");

      when(testResultRepository.findPositiveByUserHash(USER_HASH))
          .thenReturn(List.of(positiveResult));
      when(testVisitRepository.findById(visitId))
          .thenReturn(java.util.Optional.of(visit));

      // No existing follow-up reminder for this result
      when(reminderRepository.findByReferenceIdAndActiveTrueAndCompletedAtIsNull(positiveResult.getId()))
          .thenReturn(Collections.emptyList());

      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> {
        Reminder r = i.getArgument(0);
        r.setId(UUID.randomUUID());
        return r;
      });

      engine.evaluateUser(USER_HASH);

      ArgumentCaptor<Reminder> captor = ArgumentCaptor.forClass(Reminder.class);
      verify(reminderRepository).save(captor.capture());
      Reminder saved = captor.getValue();
      assertThat(saved.getUserHash()).isEqualTo(USER_HASH);
      assertThat(saved.getReminderType()).isEqualTo("FOLLOW_UP");
      assertThat(saved.getReferenceId()).isEqualTo(positiveResult.getId());
      assertThat(saved.getActive()).isTrue();
    }

    @Test
    @DisplayName("should set follow-up scheduledFor to testOfCureDays after test date")
    void shouldSetScheduledForToTestOfCureDaysAfterTestDate() {
      stubEncryption();
      when(catalogProperties.testingHeuristics()).thenReturn(defaultHeuristics());
      when(catalogProperties.followUpRules()).thenReturn(defaultFollowUpRules());

      // No journal entries
      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());
      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      LocalDate testDate = LocalDate.of(2026, 3, 1);
      UUID visitId = UUID.randomUUID();
      TestVisit visit = TestVisit.builder()
          .id(visitId)
          .userHash(USER_HASH)
          .testDate(testDate)
          .build();

      TestResult positiveResult = buildTestResult(visitId, TestResultStatus.POSITIVE, "GONORRHEA");

      when(testResultRepository.findPositiveByUserHash(USER_HASH))
          .thenReturn(List.of(positiveResult));
      when(testVisitRepository.findById(visitId))
          .thenReturn(java.util.Optional.of(visit));

      when(reminderRepository.findByReferenceIdAndActiveTrueAndCompletedAtIsNull(positiveResult.getId()))
          .thenReturn(Collections.emptyList());

      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> {
        Reminder r = i.getArgument(0);
        r.setId(UUID.randomUUID());
        return r;
      });

      engine.evaluateUser(USER_HASH);

      ArgumentCaptor<Reminder> captor = ArgumentCaptor.forClass(Reminder.class);
      verify(reminderRepository).save(captor.capture());
      Reminder saved = captor.getValue();

      // testOfCureDays = 21, so scheduledFor should be testDate + 21 days
      OffsetDateTime expectedScheduledFor = testDate.plusDays(21)
          .atStartOfDay().atOffset(ZoneOffset.UTC);
      assertThat(saved.getScheduledFor()).isEqualTo(expectedScheduledFor);
    }

    @Test
    @DisplayName("should NOT generate duplicate if active FOLLOW_UP reminder exists for same reference")
    void shouldNotGenerateDuplicateFollowUpReminder() {
      when(catalogProperties.testingHeuristics()).thenReturn(defaultHeuristics());
      when(catalogProperties.followUpRules()).thenReturn(defaultFollowUpRules());

      // No journal entries
      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());
      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      UUID visitId = UUID.randomUUID();
      TestVisit visit = TestVisit.builder()
          .id(visitId)
          .userHash(USER_HASH)
          .testDate(LocalDate.now().minusDays(10))
          .build();

      TestResult positiveResult = buildTestResult(visitId, TestResultStatus.POSITIVE, "SYPHILIS");

      when(testResultRepository.findPositiveByUserHash(USER_HASH))
          .thenReturn(List.of(positiveResult));

      // Active FOLLOW_UP reminder already exists for this result
      Reminder existingFollowUp = Reminder.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .reminderType("FOLLOW_UP")
          .referenceId(positiveResult.getId())
          .active(true)
          .build();
      when(reminderRepository.findByReferenceIdAndActiveTrueAndCompletedAtIsNull(positiveResult.getId()))
          .thenReturn(List.of(existingFollowUp));

      engine.evaluateUser(USER_HASH);

      // Should NOT save any new reminder
      verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    @DisplayName("should generate follow-ups for multiple positive results independently")
    void shouldGenerateFollowUpsForMultiplePositiveResults() {
      stubEncryption();
      when(catalogProperties.testingHeuristics()).thenReturn(defaultHeuristics());
      when(catalogProperties.followUpRules()).thenReturn(defaultFollowUpRules());

      // No journal entries
      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());
      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      UUID visitId = UUID.randomUUID();
      TestVisit visit = TestVisit.builder()
          .id(visitId)
          .userHash(USER_HASH)
          .testDate(LocalDate.now().minusDays(5))
          .build();

      TestResult result1 = buildTestResult(visitId, TestResultStatus.POSITIVE, "CHLAMYDIA");
      TestResult result2 = buildTestResult(visitId, TestResultStatus.POSITIVE, "GONORRHEA");

      when(testResultRepository.findPositiveByUserHash(USER_HASH))
          .thenReturn(List.of(result1, result2));
      when(testVisitRepository.findById(visitId))
          .thenReturn(java.util.Optional.of(visit));

      // No existing follow-up reminders for either result
      when(reminderRepository.findByReferenceIdAndActiveTrueAndCompletedAtIsNull(result1.getId()))
          .thenReturn(Collections.emptyList());
      when(reminderRepository.findByReferenceIdAndActiveTrueAndCompletedAtIsNull(result2.getId()))
          .thenReturn(Collections.emptyList());

      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> {
        Reminder r = i.getArgument(0);
        r.setId(UUID.randomUUID());
        return r;
      });

      engine.evaluateUser(USER_HASH);

      // Should save 2 separate FOLLOW_UP reminders
      ArgumentCaptor<Reminder> captor = ArgumentCaptor.forClass(Reminder.class);
      verify(reminderRepository, times(2)).save(captor.capture());
      List<Reminder> savedReminders = captor.getAllValues();
      assertThat(savedReminders).allMatch(r -> "FOLLOW_UP".equals(r.getReminderType()));
      assertThat(savedReminders).extracting(Reminder::getReferenceId)
          .containsExactlyInAnyOrder(result1.getId(), result2.getId());
    }
  }
}
