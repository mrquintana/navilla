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
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import app.navilla.dto.InsightsResponse;
import app.navilla.dto.InsightsResponse.ActivitySummary;
import app.navilla.dto.InsightsResponse.PreventionSummary;
import app.navilla.dto.InsightsResponse.TestingSummary;
import app.navilla.dto.PrepStreakResponse;
import app.navilla.entity.ConditionType;
import app.navilla.entity.EncounterJournal;
import app.navilla.entity.Medication;
import app.navilla.entity.TestResult;
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
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service that aggregates activity, testing, and prevention data
 * into a unified insights response.
 *
 * <p>Collects data from encounter journal, test visits, medications,
 * vaccinations, and reminders to provide a holistic view of the
 * user's sexual health journey.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InsightsService {

  private final EncounterJournalRepository encounterJournalRepository;
  private final TestVisitRepository testVisitRepository;
  private final TestResultRepository testResultRepository;
  private final MedicationRepository medicationRepository;
  private final MedicationLogRepository medicationLogRepository;
  private final VaccinationRepository vaccinationRepository;
  private final ReminderRepository reminderRepository;
  private final EncryptionService encryptionService;
  private final ObjectMapper objectMapper;
  private final MedicationService medicationService;

  private static final DateTimeFormatter MONTH_FORMAT =
      DateTimeFormatter.ofPattern("yyyy-MM");

  /**
   * Aggregates all insights data for the authenticated user.
   *
   * @param jwt the authenticated user's JWT
   * @return the complete insights response
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "insights", key = "#jwt.subject")
  public InsightsResponse getInsights(Jwt jwt) {
    String userHash = hashEmail(jwt);

    ActivitySummary activity = buildActivitySummary(userHash);
    TestingSummary testing = buildTestingSummary(userHash);
    PreventionSummary prevention = buildPreventionSummary(userHash, jwt);

    return new InsightsResponse(activity, testing, prevention);
  }

  // ---- Activity Summary ----

  private ActivitySummary buildActivitySummary(String userHash) {
    List<EncounterJournal> entries =
        encounterJournalRepository.findByUserHashOrderByEncounterDateDesc(userHash);

    int totalEncounters = entries.size();

    // Encounters this month
    YearMonth currentMonth = YearMonth.now();
    LocalDate monthStart = currentMonth.atDay(1);
    LocalDate monthEnd = currentMonth.atEndOfMonth();
    int encountersThisMonth = (int) entries.stream()
        .filter(e -> !e.getEncounterDate().isBefore(monthStart)
            && !e.getEncounterDate().isAfter(monthEnd))
        .count();

    // Encounters by month (last 12 months)
    Map<String, Integer> encountersByMonth = buildEncountersByMonth(entries);

    // Protection rate + type/method counts
    int protectedCount = 0;
    int entriesWithProtectionData = 0;
    Map<String, Integer> encounterTypeCounts = new HashMap<>();
    Map<String, Integer> protectionMethodCounts = new HashMap<>();

    for (EncounterJournal entry : entries) {
      // Encounter types
      List<String> encounterTypes = decryptStringList(entry.getEncounterTypesEncrypted());
      if (encounterTypes != null) {
        for (String type : encounterTypes) {
          encounterTypeCounts.merge(type, 1, Integer::sum);
        }
      }

      // Protection methods
      List<String> protectionMethods = decryptStringList(entry.getProtectionMethodsEncrypted());
      if (protectionMethods != null && !protectionMethods.isEmpty()) {
        entriesWithProtectionData++;
        boolean hasProtection = protectionMethods.stream()
            .anyMatch(m -> !"NONE".equalsIgnoreCase(m));
        if (hasProtection) {
          protectedCount++;
        }
        for (String method : protectionMethods) {
          protectionMethodCounts.merge(method, 1, Integer::sum);
        }
      }
    }

    double protectionRate = entriesWithProtectionData > 0
        ? (double) protectedCount / entriesWithProtectionData
        : 0.0;

    return new ActivitySummary(
        totalEncounters,
        encountersThisMonth,
        encountersByMonth,
        protectionRate,
        encounterTypeCounts,
        protectionMethodCounts
    );
  }

  private Map<String, Integer> buildEncountersByMonth(List<EncounterJournal> entries) {
    Map<String, Integer> monthCounts = new LinkedHashMap<>();
    YearMonth now = YearMonth.now();

    // Initialize last 12 months with zeros
    for (int i = 11; i >= 0; i--) {
      YearMonth month = now.minusMonths(i);
      monthCounts.put(month.format(MONTH_FORMAT), 0);
    }

    // Count entries per month
    for (EncounterJournal entry : entries) {
      String monthKey = YearMonth.from(entry.getEncounterDate()).format(MONTH_FORMAT);
      if (monthCounts.containsKey(monthKey)) {
        monthCounts.merge(monthKey, 1, Integer::sum);
      }
    }

    return monthCounts;
  }

  // ---- Testing Summary ----

  private TestingSummary buildTestingSummary(String userHash) {
    List<TestVisit> visits =
        testVisitRepository.findByUserHashOrderByTestDateDesc(userHash);
    List<TestResult> allResults =
        testResultRepository.findAllByUserHash(userHash);

    // Days since last test
    int daysSinceLastTest;
    LocalDate lastTestDate;
    if (visits.isEmpty()) {
      daysSinceLastTest = -1;
      lastTestDate = null;
    } else {
      lastTestDate = visits.getFirst().getTestDate();
      daysSinceLastTest = (int) ChronoUnit.DAYS.between(lastTestDate, LocalDate.now());
    }

    // Tests this year
    int currentYear = LocalDate.now().getYear();
    int testsThisYear = (int) visits.stream()
        .filter(v -> v.getTestDate().getYear() == currentYear)
        .count();

    // Condition coverage this year
    Set<ConditionType> coveredThisYear = new HashSet<>();
    Map<ConditionType, TestResult> latestResultByCondition = new LinkedHashMap<>();

    for (TestResult result : allResults) {
      if (result.getConditionType() == null) {
        continue;
      }

      // Track latest result per condition
      if (!latestResultByCondition.containsKey(result.getConditionType())) {
        latestResultByCondition.put(result.getConditionType(), result);
      }

      // Track coverage this year
      Optional<TestVisit> visit = testVisitRepository.findById(result.getVisitId());
      if (visit.isPresent() && visit.get().getTestDate().getYear() == currentYear) {
        coveredThisYear.add(result.getConditionType());
      }
    }

    int conditionsCovered = coveredThisYear.size();
    int totalStandardConditions = ConditionType.values().length;

    // Coverage map: condition -> latest status
    Map<String, String> coverageMap = new LinkedHashMap<>();
    for (ConditionType condition : ConditionType.values()) {
      TestResult latest = latestResultByCondition.get(condition);
      coverageMap.put(condition.name(), latest != null ? latest.getStatus().name() : "NOT_TESTED");
    }

    return new TestingSummary(
        daysSinceLastTest,
        testsThisYear,
        conditionsCovered,
        totalStandardConditions,
        lastTestDate,
        coverageMap
    );
  }

  // ---- Prevention Summary ----

  private PreventionSummary buildPreventionSummary(String userHash, Jwt jwt) {
    // PrEP adherence
    Double prepAdherenceRate = calculatePrepAdherence(userHash);

    // PrEP streaks via MedicationService
    PrepStreakResponse streakResponse = medicationService.getPrepStreak(jwt);
    int currentPrepStreakDays = streakResponse.currentStreakDays();
    int longestPrepStreakDays = streakResponse.longestStreakDays();

    // Vaccination status
    List<Vaccination> vaccinations =
        vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(userHash);
    List<String> completedVaccines = new ArrayList<>();
    List<String> pendingVaccines = new ArrayList<>();
    buildVaccinationLists(vaccinations, completedVaccines, pendingVaccines);

    // Active reminders count
    long activeReminders =
        reminderRepository.countByUserHashAndActiveTrueAndCompletedAtIsNull(userHash);

    return new PreventionSummary(
        prepAdherenceRate,
        currentPrepStreakDays,
        longestPrepStreakDays,
        completedVaccines,
        pendingVaccines,
        (int) activeReminders
    );
  }

  private Double calculatePrepAdherence(String userHash) {
    // Find active PrEP medications
    List<Medication> prepMeds = new ArrayList<>();
    prepMeds.addAll(medicationRepository.findByUserHashAndMedicationTypeAndActive(
        userHash, "PREP", true));
    prepMeds.addAll(medicationRepository.findByUserHashAndMedicationTypeAndActive(
        userHash, "PREP_DAILY", true));
    prepMeds.addAll(medicationRepository.findByUserHashAndMedicationTypeAndActive(
        userHash, "PREP_ON_DEMAND", true));

    if (prepMeds.isEmpty()) {
      return null;
    }

    // Calculate adherence for current month across all PrEP medications
    YearMonth currentMonth = YearMonth.now();
    LocalDate monthStart = currentMonth.atDay(1);
    LocalDate monthEnd = currentMonth.atEndOfMonth();

    long totalTaken = 0;
    long totalScheduled = 0;

    for (Medication med : prepMeds) {
      totalTaken += medicationLogRepository
          .countByMedicationIdAndTakenTrueAndScheduledForBetween(
              med.getId(), monthStart, monthEnd);
      totalScheduled += medicationLogRepository
          .countByMedicationIdAndScheduledForBetween(
              med.getId(), monthStart, monthEnd);
    }

    if (totalScheduled == 0) {
      // If there are PrEP meds but no logs yet, calculate based on days since start
      int totalDays = 0;
      for (Medication med : prepMeds) {
        LocalDate effectiveStart = med.getStartDate().isAfter(monthStart)
            ? med.getStartDate() : monthStart;
        LocalDate effectiveEnd = med.getEndDate() != null
            && med.getEndDate().isBefore(monthEnd)
            ? med.getEndDate() : monthEnd;
        if (!effectiveStart.isAfter(effectiveEnd)) {
          totalDays += (int) (effectiveEnd.toEpochDay() - effectiveStart.toEpochDay()) + 1;
        }
      }
      return totalDays > 0 ? 0.0 : null;
    }

    return (double) totalTaken / totalScheduled;
  }

  private void buildVaccinationLists(
      List<Vaccination> vaccinations,
      List<String> completedVaccines,
      List<String> pendingVaccines) {

    // Group by vaccine type, track max dose and total doses
    Map<String, Integer> maxDoseByType = new HashMap<>();
    Map<String, Integer> totalDosesByType = new HashMap<>();

    for (Vaccination vax : vaccinations) {
      String type = vax.getVaccineType();
      maxDoseByType.merge(type, vax.getDoseNumber(), Math::max);
      // totalDoses should be the same across all records of same type
      totalDosesByType.put(type, vax.getTotalDoses());
    }

    for (Map.Entry<String, Integer> entry : maxDoseByType.entrySet()) {
      String type = entry.getKey();
      int completedDoses = entry.getValue();
      int totalDoses = totalDosesByType.getOrDefault(type, 1);

      if (completedDoses >= totalDoses) {
        completedVaccines.add(type);
      } else {
        pendingVaccines.add(type);
      }
    }
  }

  // ---- Private helpers ----

  private String hashEmail(Jwt jwt) {
    return encryptionService.hashEmail(jwt.getClaimAsString("email"));
  }

  private List<String> decryptStringList(byte[] encrypted) {
    if (encrypted == null) {
      return null;
    }
    try {
      String json = encryptionService.decryptFromBytes(encrypted);
      return objectMapper.readValue(json, new TypeReference<List<String>>() {});
    } catch (Exception ex) {
      throw new RuntimeException("Failed to deserialize string list", ex);
    }
  }
}
