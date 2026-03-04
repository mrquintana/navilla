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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import app.navilla.dto.ConditionHistoryResponse;
import app.navilla.dto.ConditionSummary;
import app.navilla.dto.CreateTestVisitRequest;
import app.navilla.dto.HealthLogSummaryResponse;
import app.navilla.dto.TestResultDto;
import app.navilla.dto.TestVisitResponse;
import app.navilla.dto.UpdateTestVisitRequest;
import app.navilla.entity.ConditionType;
import app.navilla.entity.HealthStatus;
import app.navilla.entity.HealthStatusValue;
import app.navilla.entity.Lab;
import app.navilla.entity.TestResult;
import app.navilla.entity.TestResultStatus;
import app.navilla.entity.TestVisit;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.HealthStatusRepository;
import app.navilla.repository.LabRepository;
import app.navilla.repository.TestResultRepository;
import app.navilla.repository.TestVisitRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing test visit CRUD operations in the Health Log.
 *
 * <p>Handles creation, retrieval, update, and deletion of test visits
 * and their associated results. Sensitive fields (lab reference, notes,
 * custom conditions, result values) are encrypted at rest.
 *
 * <p>Maintains write-through synchronization to the {@code health_status}
 * table for standard condition types with definitive results (POSITIVE/NEGATIVE).
 *
 * @author Navilla Team
 * @since 2026-02-27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HealthLogService {

  private final TestVisitRepository testVisitRepository;
  private final TestResultRepository testResultRepository;
  private final LabRepository labRepository;
  private final HealthStatusRepository healthStatusRepository;
  private final EncryptionService encryptionService;

  /**
   * Creates a new test visit with results.
   *
   * <p>Encrypts sensitive fields, saves the visit and each result,
   * then synchronizes definitive results to the health_status table.
   *
   * @param jwt     the authenticated user's JWT
   * @param request the create request with visit details and results
   * @return the created visit response with decrypted fields
   */
  @Transactional
  @Caching(evict = {
      @CacheEvict(value = "healthLogSummary", key = "#jwt.subject"),
      @CacheEvict(value = "insights", key = "#jwt.subject")
  })
  public TestVisitResponse createVisit(Jwt jwt, CreateTestVisitRequest request) {
    String userHash = hashEmail(jwt);

    TestVisit visit = TestVisit.builder()
        .userHash(userHash)
        .testDate(LocalDate.parse(request.testDate()))
        .labId(request.labId())
        .labReferenceEncrypted(encryptOptional(request.labReference()))
        .notesEncrypted(encryptOptional(request.notes()))
        .build();

    TestVisit savedVisit = testVisitRepository.save(visit);
    log.info("Test visit created for user: {}", savedVisit.getId());

    List<TestResult> savedResults = new ArrayList<>();
    for (CreateTestVisitRequest.TestResultInput input : request.results()) {
      TestResult result = buildTestResult(savedVisit.getId(), input);
      savedResults.add(testResultRepository.save(result));
    }

    syncHealthStatus(userHash, savedResults, savedVisit.getTestDate());

    return toResponse(savedVisit, savedResults);
  }

  /**
   * Retrieves a single test visit with its results.
   *
   * @param jwt the authenticated user's JWT
   * @param id  the visit ID
   * @return the visit response with decrypted fields
   * @throws ResourceNotFoundException if the visit does not exist
   * @throws IllegalStateException     if the visit belongs to another user
   */
  @Transactional(readOnly = true)
  public TestVisitResponse getVisit(Jwt jwt, UUID id) {
    String userHash = hashEmail(jwt);

    TestVisit visit = testVisitRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("healthLog.error.notFound"));

    verifyOwnership(visit, userHash);

    List<TestResult> results = testResultRepository.findByVisitIdOrderByCreatedAt(id);

    return toResponse(visit, results);
  }

  /**
   * Updates an existing test visit and optionally replaces its results.
   *
   * <p>If results are provided, the old results are deleted and replaced
   * with the new ones. Health status is re-synchronized for affected conditions.
   *
   * @param jwt     the authenticated user's JWT
   * @param id      the visit ID
   * @param request the update request
   * @return the updated visit response with decrypted fields
   * @throws ResourceNotFoundException if the visit does not exist
   * @throws IllegalStateException     if the visit belongs to another user
   */
  @Transactional
  @Caching(evict = {
      @CacheEvict(value = "healthLogSummary", key = "#jwt.subject"),
      @CacheEvict(value = "insights", key = "#jwt.subject")
  })
  public TestVisitResponse updateVisit(Jwt jwt, UUID id, UpdateTestVisitRequest request) {
    String userHash = hashEmail(jwt);

    TestVisit visit = testVisitRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("healthLog.error.notFound"));

    verifyOwnership(visit, userHash);

    // Update visit fields if provided
    if (request.testDate() != null) {
      visit.setTestDate(LocalDate.parse(request.testDate()));
    }
    if (request.labId() != null) {
      visit.setLabId(request.labId());
    }
    if (request.labReference() != null) {
      visit.setLabReferenceEncrypted(encryptOptional(request.labReference()));
    }
    if (request.notes() != null) {
      visit.setNotesEncrypted(encryptOptional(request.notes()));
    }

    testVisitRepository.save(visit);
    log.info("Test visit updated: {}", id);

    List<TestResult> newResults;
    if (request.results() != null) {
      // Delete old results and replace with new
      List<TestResult> oldResults = testResultRepository.findByVisitIdOrderByCreatedAt(id);
      testResultRepository.deleteAll(oldResults);

      newResults = new ArrayList<>();
      for (CreateTestVisitRequest.TestResultInput input : request.results()) {
        TestResult result = buildTestResult(id, input);
        newResults.add(testResultRepository.save(result));
      }

      syncHealthStatus(userHash, newResults, visit.getTestDate());
    } else {
      newResults = testResultRepository.findByVisitIdOrderByCreatedAt(id);
    }

    return toResponse(visit, newResults);
  }

  /**
   * Deletes a test visit and re-derives health status for affected conditions.
   *
   * <p>Results are cascade-deleted via the database FK constraint.
   * For each standard condition in the deleted results, the health_status
   * is re-derived from remaining test results.
   *
   * @param jwt the authenticated user's JWT
   * @param id  the visit ID
   * @throws ResourceNotFoundException if the visit does not exist
   * @throws IllegalStateException     if the visit belongs to another user
   */
  @Transactional
  @Caching(evict = {
      @CacheEvict(value = "healthLogSummary", key = "#jwt.subject"),
      @CacheEvict(value = "insights", key = "#jwt.subject")
  })
  public void deleteVisit(Jwt jwt, UUID id) {
    String userHash = hashEmail(jwt);

    TestVisit visit = testVisitRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("healthLog.error.notFound"));

    verifyOwnership(visit, userHash);

    // Fetch results before deletion for re-derivation
    List<TestResult> results = testResultRepository.findByVisitIdOrderByCreatedAt(id);

    testVisitRepository.delete(visit);
    log.info("Test visit deleted: {}", id);

    // Re-derive health_status for each affected standard condition
    for (TestResult result : results) {
      if (result.getConditionType() != null) {
        reDeriveHealthStatus(userHash, result.getConditionType());
      }
    }
  }

  /**
   * Lists all test visits for the authenticated user, newest first.
   *
   * @param jwt the authenticated user's JWT
   * @return list of visit responses with decrypted fields
   */
  @Transactional(readOnly = true)
  public List<TestVisitResponse> listVisits(Jwt jwt) {
    String userHash = hashEmail(jwt);

    List<TestVisit> visits = testVisitRepository.findByUserHashOrderByTestDateDesc(userHash);

    return visits.stream()
        .map(visit -> {
          List<TestResult> results =
              testResultRepository.findByVisitIdOrderByCreatedAt(visit.getId());
          return toResponse(visit, results);
        })
        .toList();
  }

  /**
   * Returns a summary of the user's health log, including days since last test,
   * tests this year, condition coverage, and per-condition summaries.
   *
   * @param jwt the authenticated user's JWT
   * @return the health log summary response
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "healthLogSummary", key = "#jwt.subject")
  public HealthLogSummaryResponse getSummary(Jwt jwt) {
    String userHash = hashEmail(jwt);

    List<TestVisit> visits = testVisitRepository.findByUserHashOrderByTestDateDesc(userHash);
    List<TestResult> allResults = testResultRepository.findAllByUserHash(userHash);

    // daysSinceLastTest: -1 if never tested
    int daysSinceLastTest;
    if (visits.isEmpty()) {
      daysSinceLastTest = -1;
    } else {
      daysSinceLastTest = (int) ChronoUnit.DAYS.between(
          visits.getFirst().getTestDate(), LocalDate.now());
    }

    // testsThisYear: count visits where testDate.getYear() == current year
    int currentYear = LocalDate.now().getYear();
    int testsThisYear = (int) visits.stream()
        .filter(v -> v.getTestDate().getYear() == currentYear)
        .count();

    // Group results by condition key
    // Key: conditionType.name() for standard, "CUSTOM:" + decrypted for custom
    Map<String, List<TestResult>> groupedResults = new LinkedHashMap<>();
    for (TestResult result : allResults) {
      String key;
      if (result.getConditionType() != null) {
        key = result.getConditionType().name();
      } else {
        String decrypted = encryptionService.decryptFromBytes(
            result.getCustomConditionEncrypted());
        key = "CUSTOM:" + decrypted;
      }
      groupedResults.computeIfAbsent(key, k -> new ArrayList<>()).add(result);
    }

    // Build ConditionSummary for each group
    List<ConditionSummary> conditions = new ArrayList<>();
    for (Map.Entry<String, List<TestResult>> entry : groupedResults.entrySet()) {
      String key = entry.getKey();
      List<TestResult> groupResults = entry.getValue();
      TestResult latest = groupResults.getFirst(); // already sorted by testDate DESC

      String conditionType;
      String customCondition;
      if (key.startsWith("CUSTOM:")) {
        conditionType = null;
        customCondition = key.substring("CUSTOM:".length());
      } else {
        conditionType = key;
        customCondition = null;
      }

      String latestStatus = latest.getStatus().name();
      String latestResultValue = latest.getResultValueEncrypted() != null
          ? encryptionService.decryptFromBytes(latest.getResultValueEncrypted())
          : null;

      // Lookup test date from the visit for the latest result
      LocalDate lastTestDate = null;
      Optional<TestVisit> visitOpt = testVisitRepository.findById(latest.getVisitId());
      if (visitOpt.isPresent()) {
        lastTestDate = visitOpt.get().getTestDate();
      }

      int totalTests = groupResults.size();
      boolean hasPositive = groupResults.stream()
          .anyMatch(r -> r.getStatus() == TestResultStatus.POSITIVE);

      conditions.add(new ConditionSummary(
          conditionType, customCondition, latestStatus, latestResultValue,
          lastTestDate, totalTests, hasPositive));
    }

    // conditionsCovered: count distinct standard conditionTypes tested in current year
    int conditionsCovered = (int) allResults.stream()
        .filter(r -> r.getConditionType() != null)
        .filter(r -> {
          Optional<TestVisit> resultVisit = testVisitRepository.findById(r.getVisitId());
          return resultVisit.isPresent()
              && resultVisit.get().getTestDate().getYear() == currentYear;
        })
        .map(TestResult::getConditionType)
        .distinct()
        .count();

    int totalStandardConditions = ConditionType.values().length;

    return new HealthLogSummaryResponse(
        daysSinceLastTest, testsThisYear, conditionsCovered,
        totalStandardConditions, conditions);
  }

  /**
   * Returns the testing history for a specific condition type, including
   * all visits, lab info, and result details.
   *
   * @param jwt           the authenticated user's JWT
   * @param conditionType the condition type to retrieve history for (case-insensitive)
   * @return the condition history response
   * @throws IllegalStateException if the condition type is invalid
   */
  @Transactional(readOnly = true)
  public ConditionHistoryResponse getConditionHistory(Jwt jwt, String conditionType) {
    String userHash = hashEmail(jwt);

    ConditionType parsedType;
    try {
      parsedType = ConditionType.valueOf(conditionType.toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new ResourceNotFoundException("healthLog.error.conditionNotFound");
    }
    List<TestResult> results = testResultRepository.findByUserAndCondition(userHash, parsedType);

    if (results.isEmpty()) {
      return new ConditionHistoryResponse(
          parsedType.name(), null, 0, null, List.of());
    }

    List<ConditionHistoryResponse.HistoryEntry> entries = new ArrayList<>();
    for (TestResult result : results) {
      Optional<TestVisit> visitOpt = testVisitRepository.findById(result.getVisitId());
      TestVisit visit = visitOpt.orElse(null);

      LocalDate testDate = visit != null ? visit.getTestDate() : null;
      boolean verified = visit != null && Boolean.TRUE.equals(visit.getVerified());

      String labName = null;
      String labProvider = null;
      if (visit != null && visit.getLabId() != null) {
        Optional<Lab> labOpt = labRepository.findById(visit.getLabId());
        if (labOpt.isPresent()) {
          Lab lab = labOpt.get();
          labName = encryptionService.decryptFromBytes(lab.getNameEncrypted());
          labProvider = lab.getProvider().name();
        }
      }

      String resultValue = result.getResultValueEncrypted() != null
          ? encryptionService.decryptFromBytes(result.getResultValueEncrypted())
          : null;

      entries.add(new ConditionHistoryResponse.HistoryEntry(
          result.getVisitId(),
          testDate,
          result.getStatus().name(),
          resultValue,
          result.getReferenceRange(),
          labName,
          labProvider,
          verified,
          result.getClearedAt()));
    }

    TestResult first = results.getFirst();
    String latestStatus = first.getStatus().name();
    LocalDate lastTestDate = entries.getFirst().testDate();

    return new ConditionHistoryResponse(
        parsedType.name(), latestStatus, results.size(),
        lastTestDate, entries);
  }

  // ---- Private helpers ----

  private String hashEmail(Jwt jwt) {
    return encryptionService.hashEmail(jwt.getClaimAsString("email"));
  }

  private byte[] encryptOptional(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return encryptionService.encryptToBytes(value);
  }

  private void verifyOwnership(TestVisit visit, String userHash) {
    if (!visit.getUserHash().equals(userHash)) {
      throw new IllegalStateException("healthLog.error.notOwner");
    }
  }

  private TestResult buildTestResult(UUID visitId, CreateTestVisitRequest.TestResultInput input) {
    return TestResult.builder()
        .visitId(visitId)
        .conditionType(input.conditionType() != null
            ? ConditionType.valueOf(input.conditionType().toUpperCase()) : null)
        .customConditionEncrypted(encryptOptional(input.customCondition()))
        .status(TestResultStatus.valueOf(input.status().toUpperCase()))
        .resultValueEncrypted(encryptOptional(input.resultValue()))
        .referenceRange(input.referenceRange())
        .build();
  }

  /**
   * Synchronizes definitive test results to the health_status table.
   *
   * <p>For each result with a standard conditionType and a definitive status
   * (POSITIVE or NEGATIVE), finds or creates the corresponding HealthStatus
   * record and updates it. PENDING and INDETERMINATE statuses are skipped.
   */
  private void syncHealthStatus(String userHash, List<TestResult> results, LocalDate testDate) {
    for (TestResult result : results) {
      if (result.getConditionType() == null) {
        continue; // Skip custom conditions
      }

      HealthStatusValue mappedStatus = mapToHealthStatusValue(result.getStatus());
      if (mappedStatus == null) {
        continue; // Skip PENDING and INDETERMINATE
      }

      Optional<HealthStatus> existingOpt = healthStatusRepository
          .findByUserHashAndConditionType(userHash, result.getConditionType());

      HealthStatus healthStatus;
      if (existingOpt.isPresent()) {
        healthStatus = existingOpt.get();
      } else {
        healthStatus = HealthStatus.builder()
            .userHash(userHash)
            .conditionType(result.getConditionType())
            .build();
      }

      healthStatus.setStatus(mappedStatus);
      healthStatus.setTestDate(testDate);

      // If POSITIVE and was previously cleared, reset clearedAt
      if (mappedStatus == HealthStatusValue.POSITIVE && healthStatus.getClearedAt() != null) {
        healthStatus.setClearedAt(null);
      }

      healthStatusRepository.save(healthStatus);
      log.debug("Health status synced: {} = {} for user", result.getConditionType(), mappedStatus);
    }
  }

  /**
   * Re-derives health_status for a condition from remaining test results.
   *
   * <p>Called after a visit is deleted to ensure health_status accurately
   * reflects the most recent test result for the condition.
   */
  private void reDeriveHealthStatus(String userHash, ConditionType conditionType) {
    List<TestResult> remainingResults =
        testResultRepository.findByUserAndCondition(userHash, conditionType);

    // Find the first definitive result (POSITIVE or NEGATIVE)
    TestResult latestDefinitive = remainingResults.stream()
        .filter(r -> mapToHealthStatusValue(r.getStatus()) != null)
        .findFirst()
        .orElse(null);

    Optional<HealthStatus> existingOpt =
        healthStatusRepository.findByUserHashAndConditionType(userHash, conditionType);

    if (latestDefinitive != null) {
      HealthStatusValue mappedStatus = mapToHealthStatusValue(latestDefinitive.getStatus());
      if (existingOpt.isPresent()) {
        HealthStatus hs = existingOpt.get();
        hs.setStatus(mappedStatus);
        healthStatusRepository.save(hs);
      } else {
        HealthStatus hs = HealthStatus.builder()
            .userHash(userHash)
            .conditionType(conditionType)
            .status(mappedStatus)
            .build();
        healthStatusRepository.save(hs);
      }
    } else {
      // No definitive results remain - delete health_status
      existingOpt.ifPresent(healthStatusRepository::delete);
    }
  }

  /**
   * Maps a TestResultStatus to a HealthStatusValue.
   *
   * @return the mapped value, or null if the status should be skipped
   */
  private HealthStatusValue mapToHealthStatusValue(TestResultStatus status) {
    return switch (status) {
      case POSITIVE -> HealthStatusValue.POSITIVE;
      case NEGATIVE -> HealthStatusValue.NEGATIVE;
      case PENDING, INDETERMINATE -> null;
    };
  }

  /**
   * Converts a TestVisit and its results to a response DTO with decrypted fields.
   */
  private TestVisitResponse toResponse(TestVisit visit, List<TestResult> results) {
    String labName = null;
    String labProvider = null;

    if (visit.getLabId() != null) {
      Optional<Lab> labOpt = labRepository.findById(visit.getLabId());
      if (labOpt.isPresent()) {
        Lab lab = labOpt.get();
        labName = encryptionService.decryptFromBytes(lab.getNameEncrypted());
        labProvider = lab.getProvider().name();
      }
    }

    String labReference = visit.getLabReferenceEncrypted() != null
        ? encryptionService.decryptFromBytes(visit.getLabReferenceEncrypted())
        : null;

    String notes = visit.getNotesEncrypted() != null
        ? encryptionService.decryptFromBytes(visit.getNotesEncrypted())
        : null;

    List<TestResultDto> resultDtos = results.stream()
        .map(this::toResultDto)
        .toList();

    return new TestVisitResponse(
        visit.getId(),
        visit.getTestDate(),
        visit.getLabId(),
        labName,
        labProvider,
        labReference,
        notes,
        visit.getVerified(),
        visit.getVerifiedAt(),
        resultDtos,
        visit.getCreatedAt(),
        visit.getUpdatedAt()
    );
  }

  /**
   * Converts a TestResult to a DTO with decrypted fields.
   */
  private TestResultDto toResultDto(TestResult result) {
    String customCondition = result.getCustomConditionEncrypted() != null
        ? encryptionService.decryptFromBytes(result.getCustomConditionEncrypted())
        : null;

    String resultValue = result.getResultValueEncrypted() != null
        ? encryptionService.decryptFromBytes(result.getResultValueEncrypted())
        : null;

    return new TestResultDto(
        result.getId(),
        result.getConditionType() != null ? result.getConditionType().name() : null,
        customCondition,
        result.getStatus().name(),
        resultValue,
        result.getReferenceRange(),
        result.getClearedAt()
    );
  }
}
