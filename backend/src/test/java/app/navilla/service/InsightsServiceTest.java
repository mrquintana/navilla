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
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.dto.InsightsResponse;
import app.navilla.dto.PrepStreakResponse;
import app.navilla.entity.ConditionCatalogEntry;
import app.navilla.entity.EncounterJournal;
import app.navilla.entity.TestResult;
import app.navilla.entity.TestResultStatus;
import app.navilla.entity.TestVisit;
import app.navilla.entity.Vaccination;
import app.navilla.repository.EncounterJournalRepository;
import app.navilla.repository.MedicationLogRepository;
import app.navilla.repository.MedicationRepository;
import app.navilla.repository.ReminderRepository;
import app.navilla.repository.TestResultRepository;
import app.navilla.repository.TestVisitRepository;
import app.navilla.repository.VaccinationRepository;
import app.navilla.security.EncryptionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Unit tests for {@link InsightsService}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@ExtendWith(MockitoExtension.class)
class InsightsServiceTest {

  @Mock
  private EncounterJournalRepository encounterJournalRepository;

  @Mock
  private TestVisitRepository testVisitRepository;

  @Mock
  private TestResultRepository testResultRepository;

  @Mock
  private MedicationRepository medicationRepository;

  @Mock
  private MedicationLogRepository medicationLogRepository;

  @Mock
  private VaccinationRepository vaccinationRepository;

  @Mock
  private ReminderRepository reminderRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private ObjectMapper objectMapper;

  @Mock
  private MedicationService medicationService;

  @Mock
  private ConditionCatalogService conditionCatalogService;

  @InjectMocks
  private InsightsService insightsService;

  private static final String USER_EMAIL = "insights@example.com";
  private static final String USER_HASH = "insightshash123";

  private static final List<String> STANDARD_CONDITION_CODES = List.of(
      "CHLAMYDIA", "GONORRHEA", "SYPHILIS", "HIV", "HSV1",
      "HSV2", "HPV", "HEPATITIS_B", "HEPATITIS_C", "TRICHOMONIASIS");

  private List<ConditionCatalogEntry> buildCatalogEntries() {
    return STANDARD_CONDITION_CODES.stream()
        .map(code -> ConditionCatalogEntry.builder()
            .id(java.util.UUID.randomUUID())
            .code(code)
            .displayName(code)
            .active(true)
            .displayOrder(STANDARD_CONDITION_CODES.indexOf(code))
            .build())
        .toList();
  }

  private void stubCatalog() {
    when(conditionCatalogService.listActive()).thenReturn(buildCatalogEntries());
  }

  private Jwt mockJwt() {
    Jwt jwt = mock(Jwt.class);
    when(jwt.getClaimAsString("email")).thenReturn(USER_EMAIL);
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    return jwt;
  }

  @Nested
  @DisplayName("getInsights - empty data")
  class EmptyData {

    @Test
    @DisplayName("should return zeros and defaults when user has no data")
    void shouldReturnZerosWhenNoData() {
      Jwt jwt = mockJwt();
      stubCatalog();

      // No encounters
      when(encounterJournalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      // No visits or results
      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());
      when(testResultRepository.findAllByUserHash(USER_HASH))
          .thenReturn(Collections.emptyList());

      // No medications
      when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP", true))
          .thenReturn(Collections.emptyList());
      when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_DAILY", true))
          .thenReturn(Collections.emptyList());
      when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_ON_DEMAND", true))
          .thenReturn(Collections.emptyList());

      // No PrEP streak
      when(medicationService.getPrepStreak(jwt))
          .thenReturn(new PrepStreakResponse(0, 0, List.of()));

      // No vaccinations
      when(vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(USER_HASH))
          .thenReturn(Collections.emptyList());

      // No reminders
      when(reminderRepository.countByUserHashAndActiveTrueAndCompletedAtIsNull(USER_HASH))
          .thenReturn(0L);

      InsightsResponse response = insightsService.getInsights(jwt);

      // Activity
      assertThat(response.activity().totalEncounters()).isZero();
      assertThat(response.activity().encountersThisMonth()).isZero();
      assertThat(response.activity().protectionRate()).isZero();
      assertThat(response.activity().encounterTypeCounts()).isEmpty();
      assertThat(response.activity().protectionMethodCounts()).isEmpty();
      assertThat(response.activity().encountersByMonth()).hasSize(12);

      // Testing
      assertThat(response.testing().daysSinceLastTest()).isEqualTo(-1);
      assertThat(response.testing().testsThisYear()).isZero();
      assertThat(response.testing().conditionsCovered()).isZero();
      assertThat(response.testing().totalStandardConditions())
          .isEqualTo(STANDARD_CONDITION_CODES.size());
      assertThat(response.testing().lastTestDate()).isNull();
      assertThat(response.testing().coverageMap()).hasSize(STANDARD_CONDITION_CODES.size());
      assertThat(response.testing().coverageMap().values())
          .allMatch("NOT_TESTED"::equals);

      // Prevention
      assertThat(response.prevention().prepAdherenceRate()).isNull();
      assertThat(response.prevention().currentPrepStreakDays()).isZero();
      assertThat(response.prevention().longestPrepStreakDays()).isZero();
      assertThat(response.prevention().completedVaccines()).isEmpty();
      assertThat(response.prevention().pendingVaccines()).isEmpty();
      assertThat(response.prevention().activeReminders()).isZero();
    }
  }

  @Nested
  @DisplayName("getInsights - activity summary")
  class ActivitySummaryTests {

    @Test
    @DisplayName("should return correct activity totals with encounters")
    void shouldReturnCorrectActivityTotals() {
      Jwt jwt = mockJwt();
      LocalDate today = LocalDate.now();
      // Use first of current month to ensure it falls within this month
      LocalDate thisMonthDate = today.withDayOfMonth(1);

      EncounterJournal entry1 = EncounterJournal.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .encounterDate(today)
          .build();

      EncounterJournal entry2 = EncounterJournal.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .encounterDate(thisMonthDate)
          .build();

      EncounterJournal entry3 = EncounterJournal.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .encounterDate(today.minusMonths(2))
          .build();

      when(encounterJournalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(List.of(entry1, entry2, entry3));

      // Stub testing/prevention dependencies
      stubTestingDefaults();
      stubPreventionDefaults(jwt);

      InsightsResponse response = insightsService.getInsights(jwt);

      assertThat(response.activity().totalEncounters()).isEqualTo(3);
      assertThat(response.activity().encountersThisMonth()).isEqualTo(2);

      // Check that current month has 2 entries in the by-month map
      String currentMonthKey = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
      assertThat(response.activity().encountersByMonth().get(currentMonthKey)).isEqualTo(2);
    }

    @Test
    @DisplayName("should calculate protection rate correctly")
    void shouldCalculateProtectionRateCorrectly() throws Exception {
      Jwt jwt = mockJwt();
      LocalDate today = LocalDate.now();

      byte[] protectedBytes = new byte[]{1, 2, 3};
      byte[] unprotectedBytes = new byte[]{4, 5, 6};

      EncounterJournal protectedEntry = EncounterJournal.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .encounterDate(today)
          .protectionMethodsEncrypted(protectedBytes)
          .build();

      EncounterJournal unprotectedEntry = EncounterJournal.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .encounterDate(today.minusDays(1))
          .protectionMethodsEncrypted(unprotectedBytes)
          .build();

      EncounterJournal noDataEntry = EncounterJournal.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .encounterDate(today.minusDays(2))
          .build();

      when(encounterJournalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(List.of(protectedEntry, unprotectedEntry, noDataEntry));

      // Decrypt protected entry -> has a real method
      when(encryptionService.decryptFromBytes(protectedBytes)).thenReturn("[\"CONDOM\"]");
      when(objectMapper.readValue(eq("[\"CONDOM\"]"), any(com.fasterxml.jackson.core.type.TypeReference.class)))
          .thenReturn(List.of("CONDOM"));

      // Decrypt unprotected entry -> NONE
      when(encryptionService.decryptFromBytes(unprotectedBytes)).thenReturn("[\"NONE\"]");
      when(objectMapper.readValue(eq("[\"NONE\"]"), any(com.fasterxml.jackson.core.type.TypeReference.class)))
          .thenReturn(List.of("NONE"));

      stubTestingDefaults();
      stubPreventionDefaults(jwt);

      InsightsResponse response = insightsService.getInsights(jwt);

      // 2 entries have protection data, 1 is protected -> 50%
      assertThat(response.activity().protectionRate()).isCloseTo(0.5, within(0.01));
      assertThat(response.activity().protectionMethodCounts().get("CONDOM")).isEqualTo(1);
      assertThat(response.activity().protectionMethodCounts().get("NONE")).isEqualTo(1);
    }
  }

  @Nested
  @DisplayName("getInsights - testing summary")
  class TestingSummaryTests {

    @Test
    @DisplayName("should return correct days since last test")
    void shouldReturnCorrectDaysSinceLastTest() {
      Jwt jwt = mockJwt();
      stubCatalog();
      LocalDate testDate = LocalDate.now().minusDays(15);
      UUID visitId = UUID.randomUUID();

      TestVisit visit = TestVisit.builder()
          .id(visitId)
          .userHash(USER_HASH)
          .testDate(testDate)
          .build();

      when(encounterJournalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());
      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(List.of(visit));
      when(testResultRepository.findAllByUserHash(USER_HASH))
          .thenReturn(Collections.emptyList());

      stubPreventionDefaults(jwt);

      InsightsResponse response = insightsService.getInsights(jwt);

      assertThat(response.testing().daysSinceLastTest()).isEqualTo(15);
      assertThat(response.testing().lastTestDate()).isEqualTo(testDate);
      assertThat(response.testing().testsThisYear()).isEqualTo(1);
    }

    @Test
    @DisplayName("should populate coverage map with latest test results")
    void shouldPopulateCoverageMap() {
      Jwt jwt = mockJwt();
      stubCatalog();
      UUID visitId = UUID.randomUUID();

      TestVisit visit = TestVisit.builder()
          .id(visitId)
          .userHash(USER_HASH)
          .testDate(LocalDate.now().minusDays(5))
          .build();

      TestResult hivResult = TestResult.builder()
          .id(UUID.randomUUID())
          .visitId(visitId)
          .conditionType("HIV")
          .status(TestResultStatus.NEGATIVE)
          .build();

      TestResult syphilisResult = TestResult.builder()
          .id(UUID.randomUUID())
          .visitId(visitId)
          .conditionType("SYPHILIS")
          .status(TestResultStatus.NEGATIVE)
          .build();

      when(encounterJournalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());
      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(List.of(visit));
      when(testResultRepository.findAllByUserHash(USER_HASH))
          .thenReturn(List.of(hivResult, syphilisResult));
      when(testVisitRepository.findById(visitId))
          .thenReturn(Optional.of(visit));

      stubPreventionDefaults(jwt);

      InsightsResponse response = insightsService.getInsights(jwt);

      assertThat(response.testing().coverageMap().get("HIV")).isEqualTo("NEGATIVE");
      assertThat(response.testing().coverageMap().get("SYPHILIS")).isEqualTo("NEGATIVE");
      assertThat(response.testing().coverageMap().get("CHLAMYDIA")).isEqualTo("NOT_TESTED");
      assertThat(response.testing().conditionsCovered()).isEqualTo(2);
    }
  }

  @Nested
  @DisplayName("getInsights - prevention summary")
  class PreventionSummaryTests {

    @Test
    @DisplayName("should return null adherence when no PrEP medications")
    void shouldReturnNullAdherenceWhenNoPrep() {
      Jwt jwt = mockJwt();

      when(encounterJournalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      stubTestingDefaults();

      // No PrEP medications
      when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP", true))
          .thenReturn(Collections.emptyList());
      when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_DAILY", true))
          .thenReturn(Collections.emptyList());
      when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_ON_DEMAND", true))
          .thenReturn(Collections.emptyList());

      when(medicationService.getPrepStreak(jwt))
          .thenReturn(new PrepStreakResponse(0, 0, List.of()));

      when(vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(USER_HASH))
          .thenReturn(Collections.emptyList());

      when(reminderRepository.countByUserHashAndActiveTrueAndCompletedAtIsNull(USER_HASH))
          .thenReturn(0L);

      InsightsResponse response = insightsService.getInsights(jwt);

      assertThat(response.prevention().prepAdherenceRate()).isNull();
    }

    @Test
    @DisplayName("should count active reminders correctly")
    void shouldCountActiveReminders() {
      Jwt jwt = mockJwt();

      when(encounterJournalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      stubTestingDefaults();

      when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP", true))
          .thenReturn(Collections.emptyList());
      when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_DAILY", true))
          .thenReturn(Collections.emptyList());
      when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_ON_DEMAND", true))
          .thenReturn(Collections.emptyList());

      when(medicationService.getPrepStreak(jwt))
          .thenReturn(new PrepStreakResponse(0, 0, List.of()));

      when(vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(USER_HASH))
          .thenReturn(Collections.emptyList());

      when(reminderRepository.countByUserHashAndActiveTrueAndCompletedAtIsNull(USER_HASH))
          .thenReturn(3L);

      InsightsResponse response = insightsService.getInsights(jwt);

      assertThat(response.prevention().activeReminders()).isEqualTo(3);
    }

    @Test
    @DisplayName("should classify completed and pending vaccines correctly")
    void shouldClassifyVaccinesCorrectly() {
      Jwt jwt = mockJwt();

      when(encounterJournalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      stubTestingDefaults();

      when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP", true))
          .thenReturn(Collections.emptyList());
      when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_DAILY", true))
          .thenReturn(Collections.emptyList());
      when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_ON_DEMAND", true))
          .thenReturn(Collections.emptyList());

      when(medicationService.getPrepStreak(jwt))
          .thenReturn(new PrepStreakResponse(0, 0, List.of()));

      // HPV vaccine: 3/3 doses complete
      // HEP_B vaccine: 1/3 doses done (pending)
      Vaccination hpv1 = Vaccination.builder()
          .userHash(USER_HASH).vaccineType("HPV")
          .doseNumber(1).totalDoses(3)
          .administeredDate(LocalDate.now().minusMonths(6))
          .build();
      Vaccination hpv2 = Vaccination.builder()
          .userHash(USER_HASH).vaccineType("HPV")
          .doseNumber(2).totalDoses(3)
          .administeredDate(LocalDate.now().minusMonths(4))
          .build();
      Vaccination hpv3 = Vaccination.builder()
          .userHash(USER_HASH).vaccineType("HPV")
          .doseNumber(3).totalDoses(3)
          .administeredDate(LocalDate.now().minusMonths(2))
          .build();
      Vaccination hepB1 = Vaccination.builder()
          .userHash(USER_HASH).vaccineType("HEP_B")
          .doseNumber(1).totalDoses(3)
          .administeredDate(LocalDate.now().minusMonths(1))
          .build();

      when(vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(USER_HASH))
          .thenReturn(List.of(hepB1, hpv1, hpv2, hpv3));

      when(reminderRepository.countByUserHashAndActiveTrueAndCompletedAtIsNull(USER_HASH))
          .thenReturn(0L);

      InsightsResponse response = insightsService.getInsights(jwt);

      assertThat(response.prevention().completedVaccines()).containsExactly("HPV");
      assertThat(response.prevention().pendingVaccines()).containsExactly("HEP_B");
    }
  }

  // ---- Helper methods ----

  private void stubTestingDefaults() {
    stubCatalog();
    when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
        .thenReturn(Collections.emptyList());
    when(testResultRepository.findAllByUserHash(USER_HASH))
        .thenReturn(Collections.emptyList());
  }

  private void stubPreventionDefaults(Jwt jwt) {
    when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP", true))
        .thenReturn(Collections.emptyList());
    when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_DAILY", true))
        .thenReturn(Collections.emptyList());
    when(medicationRepository.findByUserHashAndMedicationTypeAndActive(USER_HASH, "PREP_ON_DEMAND", true))
        .thenReturn(Collections.emptyList());

    when(medicationService.getPrepStreak(jwt))
        .thenReturn(new PrepStreakResponse(0, 0, List.of()));

    when(vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(USER_HASH))
        .thenReturn(Collections.emptyList());

    when(reminderRepository.countByUserHashAndActiveTrueAndCompletedAtIsNull(USER_HASH))
        .thenReturn(0L);
  }
}
