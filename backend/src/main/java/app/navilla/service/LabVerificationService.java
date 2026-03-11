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
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import app.navilla.entity.HealthStatus;
import app.navilla.entity.HealthStatusValue;
import app.navilla.entity.TestResult;
import app.navilla.entity.TestResultStatus;
import app.navilla.entity.TestVisit;
import app.navilla.lab.LabProvider;
import app.navilla.lab.LabProviderRegistry;
import app.navilla.lab.LabTestResult;
import app.navilla.lab.LabVerificationResult;
import app.navilla.lab.ValidationResult;
import app.navilla.repository.HealthStatusRepository;
import app.navilla.repository.TestResultRepository;
import app.navilla.repository.TestVisitRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service that orchestrates the lab verification flow.
 *
 * <p>The verification flow has two steps:
 * <ol>
 *   <li>{@link #verify} — calls the lab provider and returns results for user review</li>
 *   <li>{@link #confirm} — saves the verified results after user confirmation</li>
 * </ol>
 *
 * @author Navilla Team
 * @since 2026-03-06
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LabVerificationService {

  private final LabProviderRegistry labProviderRegistry;
  private final TestVisitRepository testVisitRepository;
  private final TestResultRepository testResultRepository;
  private final HealthStatusRepository healthStatusRepository;
  private final EncryptionService encryptionService;
  private final ConditionCatalogService conditionCatalogService;

  /**
   * Step 1: Call the lab provider and return results for review.
   *
   * <p>When {@code visitId} is provided, validates ownership and uses it.
   * When {@code visitId} is null, creates a shell visit from {@code testDate}.
   *
   * @param userHash         the hashed user identifier
   * @param visitId          the test visit ID to verify (nullable)
   * @param testDate         the test date for creating a shell visit (nullable, used when visitId is null)
   * @param labCode          the lab provider code
   * @param visitCredentials credentials for the visit (e.g., order number)
   * @param labCredentials   credentials for the lab provider (e.g., patient ID)
   * @return a wrapper containing the resolved visitId and verification result
   * @throws IllegalArgumentException if the visit is not found, belongs to another user,
   *                                  or the lab provider is unknown
   */
  @Transactional
  public LabVerifyServiceResponse verify(
      String userHash,
      UUID visitId,
      java.time.LocalDate testDate,
      String labCode,
      Map<String, String> visitCredentials,
      Map<String, String> labCredentials) {

    UUID resolvedVisitId;

    if (visitId != null) {
      // Existing visit — validate ownership
      TestVisit visit = testVisitRepository.findById(visitId)
          .orElseThrow(() -> new IllegalArgumentException("Visit not found"));
      if (!visit.getUserHash().equals(userHash)) {
        throw new IllegalArgumentException("Visit does not belong to user");
      }
      resolvedVisitId = visitId;
    } else {
      // No visit — create a shell visit
      TestVisit shell = TestVisit.builder()
          .userHash(userHash)
          .testDate(testDate != null ? testDate : java.time.LocalDate.now())
          .verified(false)
          .build();
      shell = testVisitRepository.save(shell);
      resolvedVisitId = shell.getId();
      log.info("Created shell visit {} for lab verification", resolvedVisitId);
    }

    LabProvider provider = labProviderRegistry.getProvider(labCode)
        .orElseThrow(() -> new IllegalArgumentException("Unknown lab provider: " + labCode));

    ValidationResult validation = provider.validateInput(visitCredentials);
    if (!validation.valid()) {
      return new LabVerifyServiceResponse(resolvedVisitId,
          LabVerificationResult.failure("VALIDATION_ERROR",
              "Invalid input: " + validation.fieldErrors()));
    }

    LabVerificationResult result = provider.verify(visitCredentials, labCredentials);
    return new LabVerifyServiceResponse(resolvedVisitId, result);
  }

  /**
   * Step 2: User confirmed the results — save everything.
   *
   * <p>Updates the test visit as verified, replaces test results,
   * and synchronizes health status for valid condition codes.
   *
   * @param userHash    the hashed user identifier
   * @param visitId     the test visit ID to confirm
   * @param labResults  the lab test results to save
   * @param rawResponse the raw response bytes from the lab provider
   * @param notes       optional user notes to encrypt and store on the visit
   */
  @Transactional
  public void confirm(
      String userHash,
      UUID visitId,
      List<LabTestResult> labResults,
      byte[] rawResponse,
      String notes) {

    TestVisit visit = testVisitRepository.findById(visitId)
        .orElseThrow(() -> new IllegalArgumentException("Visit not found"));

    if (!visit.getUserHash().equals(userHash)) {
      throw new IllegalArgumentException("Visit does not belong to user");
    }

    // Mark visit as verified
    visit.setVerified(true);
    visit.setVerifiedAt(OffsetDateTime.now());

    // Encrypt and store the raw lab response
    if (rawResponse != null) {
      String base64Response = Base64.getEncoder().encodeToString(rawResponse);
      visit.setRawLabResponseEncrypted(encryptionService.encryptToBytes(base64Response));
    }

    // Encrypt and store user notes
    if (notes != null && !notes.isBlank()) {
      visit.setNotesEncrypted(encryptionService.encryptToBytes(notes.trim()));
    }

    // Update test date from lab results if available
    labResults.stream()
        .filter(r -> r.testDate() != null)
        .findFirst()
        .ifPresent(r -> visit.setTestDate(r.testDate()));

    testVisitRepository.save(visit);
    log.info("Test visit verified: {}", visitId);

    // Delete existing test results for this visit
    List<TestResult> existingResults = testResultRepository.findByVisitIdOrderByCreatedAt(visitId);
    testResultRepository.deleteAll(existingResults);

    // Create new test results from lab data
    for (LabTestResult labResult : labResults) {
      TestResult result = TestResult.builder()
          .visitId(visitId)
          .conditionType(labResult.conditionCode() != null
              ? labResult.conditionCode().toUpperCase() : null)
          .status(TestResultStatus.fromValue(labResult.result()))
          .resultValueEncrypted(labResult.resultValue() != null
              ? encryptionService.encryptToBytes(labResult.resultValue()) : null)
          .referenceRange(labResult.referenceRange())
          .build();
      testResultRepository.save(result);

      // Sync to health_status for valid condition codes
      if (labResult.conditionCode() != null
          && conditionCatalogService.isValidCode(labResult.conditionCode().toUpperCase())) {
        syncHealthStatus(userHash, labResult.conditionCode().toUpperCase(),
            result.getStatus(), visit.getTestDate(), visitId);
      }
    }
  }

  /**
   * Upserts health status for a condition based on a verified lab result.
   */
  private void syncHealthStatus(
      String userHash, String conditionCode,
      TestResultStatus resultStatus, java.time.LocalDate testDate, java.util.UUID visitId) {

    HealthStatusValue mappedStatus = mapToHealthStatusValue(resultStatus);
    if (mappedStatus == null) {
      return; // Skip PENDING and INDETERMINATE
    }

    Optional<HealthStatus> existingOpt = healthStatusRepository
        .findByUserHashAndConditionType(userHash, conditionCode);

    HealthStatus healthStatus;
    if (existingOpt.isPresent()) {
      healthStatus = existingOpt.get();
    } else {
      healthStatus = HealthStatus.builder()
          .userHash(userHash)
          .conditionType(conditionCode)
          .build();
    }

    healthStatus.setStatus(mappedStatus);
    healthStatus.setTestDate(testDate);
    healthStatus.setVerified(true);
    healthStatus.setVisitId(visitId);

    if (mappedStatus == HealthStatusValue.POSITIVE && healthStatus.getClearedAt() != null) {
      healthStatus.setClearedAt(null);
    }

    healthStatusRepository.save(healthStatus);
    log.debug("Health status synced (verified): {} = {} for user", conditionCode, mappedStatus);
  }

  private HealthStatusValue mapToHealthStatusValue(TestResultStatus status) {
    return switch (status) {
      case POSITIVE -> HealthStatusValue.POSITIVE;
      case NEGATIVE -> HealthStatusValue.NEGATIVE;
      case PENDING, INDETERMINATE -> null;
    };
  }
}
