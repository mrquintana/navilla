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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import app.navilla.config.HealthCatalogProperties;
import app.navilla.dto.PrepStreakResponse;
import app.navilla.entity.Medication;
import app.navilla.entity.MedicationLog;
import app.navilla.repository.MedicationLogRepository;
import app.navilla.repository.MedicationRepository;
import app.navilla.repository.ReminderRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Unit tests for PrEP adherence streak calculation in {@link MedicationService}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@ExtendWith(MockitoExtension.class)
class MedicationServiceStreakTest {

  @Mock
  private MedicationRepository medicationRepository;

  @Mock
  private MedicationLogRepository medicationLogRepository;

  @Mock
  private ReminderRepository reminderRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private HealthCatalogProperties catalogProperties;

  @InjectMocks
  private MedicationService medicationService;

  private static final String USER_EMAIL = "user@example.com";
  private static final String USER_HASH = "userhash123";

  private Jwt mockJwt() {
    Jwt jwt = mock(Jwt.class);
    when(jwt.getClaimAsString("email")).thenReturn(USER_EMAIL);
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    return jwt;
  }

  private Medication buildPrepMedication(UUID id) {
    return Medication.builder()
        .id(id)
        .userHash(USER_HASH)
        .medicationType("PREP_DAILY")
        .nameEncrypted(new byte[]{1, 2, 3})
        .startDate(LocalDate.of(2026, 1, 1))
        .frequency("DAILY")
        .active(true)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  private MedicationLog buildLog(Medication med, LocalDate scheduledFor, boolean taken) {
    return MedicationLog.builder()
        .id(UUID.randomUUID())
        .medication(med)
        .userHash(USER_HASH)
        .scheduledFor(scheduledFor)
        .taken(taken)
        .loggedAt(OffsetDateTime.now())
        .createdAt(OffsetDateTime.now())
        .build();
  }

  /**
   * Stubs the repository to return empty lists for PREP and PREP_ON_DEMAND
   * when we only want PREP_DAILY results.
   */
  private void stubEmptyPrepAndOnDemand() {
    when(medicationRepository
        .findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP", true))
        .thenReturn(Collections.emptyList());
    when(medicationRepository
        .findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_ON_DEMAND", true))
        .thenReturn(Collections.emptyList());
  }

  @Nested
  @DisplayName("getPrepStreak")
  class GetPrepStreak {

    @Test
    @DisplayName("should return zeros when user has no PrEP medications")
    void noPrepMeds_returnsZeroStreak() {
      Jwt jwt = mockJwt();

      when(medicationRepository
          .findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP", true))
          .thenReturn(Collections.emptyList());
      when(medicationRepository
          .findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_DAILY", true))
          .thenReturn(Collections.emptyList());
      when(medicationRepository
          .findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_ON_DEMAND", true))
          .thenReturn(Collections.emptyList());

      PrepStreakResponse result = medicationService.getPrepStreak(jwt);

      assertThat(result.currentStreakDays()).isZero();
      assertThat(result.longestStreakDays()).isZero();
      assertThat(result.milestones()).hasSize(3);
      assertThat(result.milestones()).allSatisfy(m ->
          assertThat(m.achieved()).isFalse()
      );
    }

    @Test
    @DisplayName("should return zeros when PrEP medication has no logs")
    void emptyLogs_returnsZeroStreak() {
      Jwt jwt = mockJwt();
      UUID medId = UUID.randomUUID();
      Medication med = buildPrepMedication(medId);

      stubEmptyPrepAndOnDemand();
      when(medicationRepository
          .findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_DAILY", true))
          .thenReturn(List.of(med));

      when(medicationLogRepository.findByMedicationIdOrderByScheduledForDesc(medId))
          .thenReturn(Collections.emptyList());

      PrepStreakResponse result = medicationService.getPrepStreak(jwt);

      assertThat(result.currentStreakDays()).isZero();
      assertThat(result.longestStreakDays()).isZero();
      assertThat(result.milestones()).allSatisfy(m ->
          assertThat(m.achieved()).isFalse()
      );
    }

    @Test
    @DisplayName("should calculate 7-day current streak and achieve week milestone")
    void sevenDayStreak_achievesWeekMilestone() {
      Jwt jwt = mockJwt();
      UUID medId = UUID.randomUUID();
      Medication med = buildPrepMedication(medId);

      stubEmptyPrepAndOnDemand();
      when(medicationRepository
          .findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_DAILY", true))
          .thenReturn(List.of(med));

      // Build 7 consecutive days ending today
      LocalDate today = LocalDate.now();
      List<MedicationLog> logs = new ArrayList<>();
      for (int i = 0; i < 7; i++) {
        logs.add(buildLog(med, today.minusDays(i), true));
      }

      when(medicationLogRepository.findByMedicationIdOrderByScheduledForDesc(medId))
          .thenReturn(logs);

      PrepStreakResponse result = medicationService.getPrepStreak(jwt);

      assertThat(result.currentStreakDays()).isEqualTo(7);
      assertThat(result.longestStreakDays()).isEqualTo(7);

      // Week milestone achieved, month and quarter not
      assertThat(result.milestones()).satisfiesExactly(
          week -> {
            assertThat(week.days()).isEqualTo(7);
            assertThat(week.achieved()).isTrue();
          },
          month -> {
            assertThat(month.days()).isEqualTo(30);
            assertThat(month.achieved()).isFalse();
          },
          quarter -> {
            assertThat(quarter.days()).isEqualTo(90);
            assertThat(quarter.achieved()).isFalse();
          }
      );
    }

    @Test
    @DisplayName("should break current streak at gap but preserve longest streak")
    void gapInMiddle_currentStreakResetsButLongestPreserved() {
      Jwt jwt = mockJwt();
      UUID medId = UUID.randomUUID();
      Medication med = buildPrepMedication(medId);

      stubEmptyPrepAndOnDemand();
      when(medicationRepository
          .findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_DAILY", true))
          .thenReturn(List.of(med));

      LocalDate today = LocalDate.now();

      // Current streak: 3 days (today, yesterday, day before)
      // Gap on day -3 (missing)
      // Previous streak: 5 days (day -4 through day -8)
      List<MedicationLog> logs = new ArrayList<>();

      // Current streak: 3 consecutive days
      logs.add(buildLog(med, today, true));
      logs.add(buildLog(med, today.minusDays(1), true));
      logs.add(buildLog(med, today.minusDays(2), true));
      // Day -3 is missing (gap)
      // Previous streak: 5 consecutive days
      logs.add(buildLog(med, today.minusDays(4), true));
      logs.add(buildLog(med, today.minusDays(5), true));
      logs.add(buildLog(med, today.minusDays(6), true));
      logs.add(buildLog(med, today.minusDays(7), true));
      logs.add(buildLog(med, today.minusDays(8), true));

      when(medicationLogRepository.findByMedicationIdOrderByScheduledForDesc(medId))
          .thenReturn(logs);

      PrepStreakResponse result = medicationService.getPrepStreak(jwt);

      assertThat(result.currentStreakDays()).isEqualTo(3);
      assertThat(result.longestStreakDays()).isEqualTo(5);
    }

    @Test
    @DisplayName("should achieve month milestone with 30+ consecutive days")
    void thirtyDayStreak_achievesMonthMilestone() {
      Jwt jwt = mockJwt();
      UUID medId = UUID.randomUUID();
      Medication med = buildPrepMedication(medId);

      stubEmptyPrepAndOnDemand();
      when(medicationRepository
          .findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_DAILY", true))
          .thenReturn(List.of(med));

      // Build 30 consecutive days ending today
      LocalDate today = LocalDate.now();
      List<MedicationLog> logs = new ArrayList<>();
      for (int i = 0; i < 30; i++) {
        logs.add(buildLog(med, today.minusDays(i), true));
      }

      when(medicationLogRepository.findByMedicationIdOrderByScheduledForDesc(medId))
          .thenReturn(logs);

      PrepStreakResponse result = medicationService.getPrepStreak(jwt);

      assertThat(result.currentStreakDays()).isEqualTo(30);
      assertThat(result.longestStreakDays()).isEqualTo(30);

      // Week and month milestones achieved, quarter not
      assertThat(result.milestones()).satisfiesExactly(
          week -> {
            assertThat(week.days()).isEqualTo(7);
            assertThat(week.achieved()).isTrue();
          },
          month -> {
            assertThat(month.days()).isEqualTo(30);
            assertThat(month.achieved()).isTrue();
          },
          quarter -> {
            assertThat(quarter.days()).isEqualTo(90);
            assertThat(quarter.achieved()).isFalse();
          }
      );
    }

    @Test
    @DisplayName("should break streak when taken=false")
    void takenFalse_breaksStreak() {
      Jwt jwt = mockJwt();
      UUID medId = UUID.randomUUID();
      Medication med = buildPrepMedication(medId);

      stubEmptyPrepAndOnDemand();
      when(medicationRepository
          .findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_DAILY", true))
          .thenReturn(List.of(med));

      LocalDate today = LocalDate.now();

      // Today: taken=true, yesterday: taken=false, day before: taken=true
      List<MedicationLog> logs = new ArrayList<>();
      logs.add(buildLog(med, today, true));
      logs.add(buildLog(med, today.minusDays(1), false)); // breaks streak
      logs.add(buildLog(med, today.minusDays(2), true));

      when(medicationLogRepository.findByMedicationIdOrderByScheduledForDesc(medId))
          .thenReturn(logs);

      PrepStreakResponse result = medicationService.getPrepStreak(jwt);

      // Current streak is 1 (only today)
      assertThat(result.currentStreakDays()).isEqualTo(1);
      // Longest streak is 1 (either today alone or day-before-yesterday alone)
      assertThat(result.longestStreakDays()).isEqualTo(1);
    }

    @Test
    @DisplayName("should handle current streak starting from today with taken=false today")
    void takenFalseToday_currentStreakIsZero() {
      Jwt jwt = mockJwt();
      UUID medId = UUID.randomUUID();
      Medication med = buildPrepMedication(medId);

      stubEmptyPrepAndOnDemand();
      when(medicationRepository
          .findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_DAILY", true))
          .thenReturn(List.of(med));

      LocalDate today = LocalDate.now();

      // Today: taken=false, then 5 days taken=true before that
      List<MedicationLog> logs = new ArrayList<>();
      logs.add(buildLog(med, today, false));
      for (int i = 1; i <= 5; i++) {
        logs.add(buildLog(med, today.minusDays(i), true));
      }

      when(medicationLogRepository.findByMedicationIdOrderByScheduledForDesc(medId))
          .thenReturn(logs);

      PrepStreakResponse result = medicationService.getPrepStreak(jwt);

      // Current streak is 0 because today was not taken
      assertThat(result.currentStreakDays()).isZero();
      // Longest streak is 5 (the 5 consecutive days before today)
      assertThat(result.longestStreakDays()).isEqualTo(5);
    }
  }
}
