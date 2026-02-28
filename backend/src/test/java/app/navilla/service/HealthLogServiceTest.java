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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.dto.CreateTestVisitRequest;
import app.navilla.dto.CreateTestVisitRequest.TestResultInput;
import app.navilla.dto.TestVisitResponse;
import app.navilla.dto.UpdateTestVisitRequest;
import app.navilla.entity.ConditionType;
import app.navilla.entity.HealthStatus;
import app.navilla.entity.HealthStatusValue;
import app.navilla.entity.Lab;
import app.navilla.entity.LabProvider;
import app.navilla.entity.TestResult;
import app.navilla.entity.TestResultStatus;
import app.navilla.entity.TestVisit;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.HealthStatusRepository;
import app.navilla.repository.LabRepository;
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
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Unit tests for {@link HealthLogService}.
 *
 * @author Navilla Team
 * @since 2026-02-27
 */
@ExtendWith(MockitoExtension.class)
class HealthLogServiceTest {

  @Mock
  private TestVisitRepository testVisitRepository;

  @Mock
  private TestResultRepository testResultRepository;

  @Mock
  private LabRepository labRepository;

  @Mock
  private HealthStatusRepository healthStatusRepository;

  @Mock
  private EncryptionService encryptionService;

  @InjectMocks
  private HealthLogService healthLogService;

  private static final String USER_EMAIL = "user@example.com";
  private static final String USER_HASH = "userhash123";
  private static final UUID VISIT_ID = UUID.randomUUID();
  private static final UUID LAB_ID = UUID.randomUUID();
  private static final byte[] ENCRYPTED_LAB_REF = new byte[]{1, 2, 3};
  private static final byte[] ENCRYPTED_NOTES = new byte[]{4, 5, 6};
  private static final byte[] ENCRYPTED_CUSTOM_CONDITION = new byte[]{7, 8, 9};
  private static final byte[] ENCRYPTED_RESULT_VALUE = new byte[]{10, 11, 12};
  private static final byte[] ENCRYPTED_LAB_NAME = new byte[]{13, 14, 15};

  private Jwt mockJwt() {
    Jwt jwt = mock(Jwt.class);
    when(jwt.getClaimAsString("email")).thenReturn(USER_EMAIL);
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    return jwt;
  }

  private TestVisit buildVisit(UUID id, String userHash) {
    return TestVisit.builder()
        .id(id)
        .userHash(userHash)
        .testDate(LocalDate.of(2026, 2, 15))
        .labId(null)
        .labReferenceEncrypted(null)
        .notesEncrypted(null)
        .verified(false)
        .verifiedAt(null)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  private TestResult buildResult(UUID visitId, ConditionType conditionType, TestResultStatus status) {
    return TestResult.builder()
        .id(UUID.randomUUID())
        .visitId(visitId)
        .conditionType(conditionType)
        .customConditionEncrypted(null)
        .status(status)
        .resultValueEncrypted(null)
        .referenceRange(null)
        .clearedAt(null)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  @Nested
  @DisplayName("createVisit")
  class CreateVisit {

    @Test
    @DisplayName("should save visit and results with encryption")
    void createVisit_shouldSaveVisitAndResultsWithEncryption() {
      Jwt jwt = mockJwt();

      List<TestResultInput> results = List.of(
          new TestResultInput("HIV", null, "NEGATIVE", "non-reactive", "< 1.0"));
      CreateTestVisitRequest request = new CreateTestVisitRequest(
          "2026-02-15", LAB_ID, "REF-12345", results, "All clear");

      when(encryptionService.encryptToBytes("REF-12345")).thenReturn(ENCRYPTED_LAB_REF);
      when(encryptionService.encryptToBytes("All clear")).thenReturn(ENCRYPTED_NOTES);
      when(encryptionService.encryptToBytes("non-reactive")).thenReturn(ENCRYPTED_RESULT_VALUE);

      when(testVisitRepository.save(any(TestVisit.class))).thenAnswer(invocation -> {
        TestVisit saved = invocation.getArgument(0);
        saved.setId(VISIT_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      when(testResultRepository.save(any(TestResult.class))).thenAnswer(invocation -> {
        TestResult saved = invocation.getArgument(0);
        saved.setId(UUID.randomUUID());
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      // Write-through: HIV NEGATIVE should create/update health_status
      when(healthStatusRepository.findByUserHashAndConditionType(USER_HASH, ConditionType.HIV))
          .thenReturn(Optional.empty());

      // Decryption stubs for toResponse
      when(encryptionService.decryptFromBytes(ENCRYPTED_LAB_REF)).thenReturn("REF-12345");
      when(encryptionService.decryptFromBytes(ENCRYPTED_NOTES)).thenReturn("All clear");
      when(encryptionService.decryptFromBytes(ENCRYPTED_RESULT_VALUE)).thenReturn("non-reactive");

      // Lab lookup for toResponse
      Lab lab = Lab.builder()
          .id(LAB_ID)
          .provider(LabProvider.CHOPO)
          .nameEncrypted(ENCRYPTED_LAB_NAME)
          .build();
      when(labRepository.findById(LAB_ID)).thenReturn(Optional.of(lab));
      when(encryptionService.decryptFromBytes(ENCRYPTED_LAB_NAME)).thenReturn("Mi Chopo");

      TestVisitResponse response = healthLogService.createVisit(jwt, request);

      // Verify visit was saved with encrypted fields
      ArgumentCaptor<TestVisit> visitCaptor = ArgumentCaptor.forClass(TestVisit.class);
      verify(testVisitRepository).save(visitCaptor.capture());
      TestVisit capturedVisit = visitCaptor.getValue();
      assertThat(capturedVisit.getUserHash()).isEqualTo(USER_HASH);
      assertThat(capturedVisit.getTestDate()).isEqualTo(LocalDate.of(2026, 2, 15));
      assertThat(capturedVisit.getLabId()).isEqualTo(LAB_ID);
      assertThat(capturedVisit.getLabReferenceEncrypted()).isEqualTo(ENCRYPTED_LAB_REF);
      assertThat(capturedVisit.getNotesEncrypted()).isEqualTo(ENCRYPTED_NOTES);

      // Verify result was saved
      ArgumentCaptor<TestResult> resultCaptor = ArgumentCaptor.forClass(TestResult.class);
      verify(testResultRepository).save(resultCaptor.capture());
      TestResult capturedResult = resultCaptor.getValue();
      assertThat(capturedResult.getConditionType()).isEqualTo(ConditionType.HIV);
      assertThat(capturedResult.getStatus()).isEqualTo(TestResultStatus.NEGATIVE);
      assertThat(capturedResult.getResultValueEncrypted()).isEqualTo(ENCRYPTED_RESULT_VALUE);
      assertThat(capturedResult.getReferenceRange()).isEqualTo("< 1.0");

      // Verify response is decrypted
      assertThat(response.id()).isEqualTo(VISIT_ID);
      assertThat(response.testDate()).isEqualTo(LocalDate.of(2026, 2, 15));
      assertThat(response.labId()).isEqualTo(LAB_ID);
      assertThat(response.labName()).isEqualTo("Mi Chopo");
      assertThat(response.labProvider()).isEqualTo("CHOPO");
      assertThat(response.labReference()).isEqualTo("REF-12345");
      assertThat(response.notes()).isEqualTo("All clear");
      assertThat(response.results()).hasSize(1);
      assertThat(response.results().getFirst().conditionType()).isEqualTo("HIV");
      assertThat(response.results().getFirst().status()).isEqualTo("NEGATIVE");
      assertThat(response.results().getFirst().resultValue()).isEqualTo("non-reactive");
    }

    @Test
    @DisplayName("should write through to health_status for POSITIVE/NEGATIVE results")
    void createVisit_shouldWriteThroughToHealthStatus() {
      Jwt jwt = mockJwt();

      List<TestResultInput> results = List.of(
          new TestResultInput("HIV", null, "POSITIVE", null, null),
          new TestResultInput("SYPHILIS", null, "NEGATIVE", null, null));
      CreateTestVisitRequest request = new CreateTestVisitRequest(
          "2026-02-15", null, null, results, null);

      when(testVisitRepository.save(any(TestVisit.class))).thenAnswer(invocation -> {
        TestVisit saved = invocation.getArgument(0);
        saved.setId(VISIT_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      when(testResultRepository.save(any(TestResult.class))).thenAnswer(invocation -> {
        TestResult saved = invocation.getArgument(0);
        saved.setId(UUID.randomUUID());
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      // No existing health_status records
      when(healthStatusRepository.findByUserHashAndConditionType(USER_HASH, ConditionType.HIV))
          .thenReturn(Optional.empty());
      when(healthStatusRepository.findByUserHashAndConditionType(USER_HASH, ConditionType.SYPHILIS))
          .thenReturn(Optional.empty());
      when(healthStatusRepository.save(any(HealthStatus.class))).thenAnswer(i -> i.getArgument(0));

      healthLogService.createVisit(jwt, request);

      // Verify health_status was saved for both HIV (POSITIVE) and SYPHILIS (NEGATIVE)
      ArgumentCaptor<HealthStatus> captor = ArgumentCaptor.forClass(HealthStatus.class);
      verify(healthStatusRepository, org.mockito.Mockito.times(2)).save(captor.capture());

      List<HealthStatus> savedStatuses = captor.getAllValues();

      HealthStatus hivStatus = savedStatuses.stream()
          .filter(hs -> hs.getConditionType() == ConditionType.HIV)
          .findFirst().orElseThrow();
      assertThat(hivStatus.getStatus()).isEqualTo(HealthStatusValue.POSITIVE);
      assertThat(hivStatus.getUserHash()).isEqualTo(USER_HASH);
      assertThat(hivStatus.getTestDate()).isEqualTo(LocalDate.of(2026, 2, 15));

      HealthStatus syphilisStatus = savedStatuses.stream()
          .filter(hs -> hs.getConditionType() == ConditionType.SYPHILIS)
          .findFirst().orElseThrow();
      assertThat(syphilisStatus.getStatus()).isEqualTo(HealthStatusValue.NEGATIVE);
    }

    @Test
    @DisplayName("should handle custom conditions with null conditionType")
    void createVisit_shouldHandleCustomConditions() {
      Jwt jwt = mockJwt();

      List<TestResultInput> results = List.of(
          new TestResultInput(null, "Mycoplasma", "NEGATIVE", null, null));
      CreateTestVisitRequest request = new CreateTestVisitRequest(
          "2026-02-15", null, null, results, null);

      when(encryptionService.encryptToBytes("Mycoplasma")).thenReturn(ENCRYPTED_CUSTOM_CONDITION);

      when(testVisitRepository.save(any(TestVisit.class))).thenAnswer(invocation -> {
        TestVisit saved = invocation.getArgument(0);
        saved.setId(VISIT_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      when(testResultRepository.save(any(TestResult.class))).thenAnswer(invocation -> {
        TestResult saved = invocation.getArgument(0);
        saved.setId(UUID.randomUUID());
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      // Decryption for toResponse
      when(encryptionService.decryptFromBytes(ENCRYPTED_CUSTOM_CONDITION)).thenReturn("Mycoplasma");

      TestVisitResponse response = healthLogService.createVisit(jwt, request);

      // Verify custom condition was encrypted
      ArgumentCaptor<TestResult> captor = ArgumentCaptor.forClass(TestResult.class);
      verify(testResultRepository).save(captor.capture());
      TestResult saved = captor.getValue();
      assertThat(saved.getConditionType()).isNull();
      assertThat(saved.getCustomConditionEncrypted()).isEqualTo(ENCRYPTED_CUSTOM_CONDITION);

      // No write-through for custom conditions (conditionType is null)
      verify(healthStatusRepository, never()).save(any());

      // Verify response
      assertThat(response.results()).hasSize(1);
      assertThat(response.results().getFirst().conditionType()).isNull();
      assertThat(response.results().getFirst().customCondition()).isEqualTo("Mycoplasma");
    }

    @Test
    @DisplayName("should not write through for PENDING status")
    void createVisit_shouldNotWriteThroughPendingStatus() {
      Jwt jwt = mockJwt();

      List<TestResultInput> results = List.of(
          new TestResultInput("HIV", null, "PENDING", null, null));
      CreateTestVisitRequest request = new CreateTestVisitRequest(
          "2026-02-15", null, null, results, null);

      when(testVisitRepository.save(any(TestVisit.class))).thenAnswer(invocation -> {
        TestVisit saved = invocation.getArgument(0);
        saved.setId(VISIT_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      when(testResultRepository.save(any(TestResult.class))).thenAnswer(invocation -> {
        TestResult saved = invocation.getArgument(0);
        saved.setId(UUID.randomUUID());
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      healthLogService.createVisit(jwt, request);

      // PENDING should NOT trigger health_status write-through
      verify(healthStatusRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("getVisit")
  class GetVisit {

    @Test
    @DisplayName("should decrypt and return visit with results")
    void getVisit_shouldDecryptAndReturnWithResults() {
      Jwt jwt = mockJwt();

      TestVisit visit = buildVisit(VISIT_ID, USER_HASH);
      visit.setLabReferenceEncrypted(ENCRYPTED_LAB_REF);
      visit.setNotesEncrypted(ENCRYPTED_NOTES);

      TestResult result = buildResult(VISIT_ID, ConditionType.HIV, TestResultStatus.NEGATIVE);
      result.setResultValueEncrypted(ENCRYPTED_RESULT_VALUE);
      result.setReferenceRange("< 1.0");

      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));
      when(testResultRepository.findByVisitIdOrderByCreatedAt(VISIT_ID)).thenReturn(List.of(result));
      when(encryptionService.decryptFromBytes(ENCRYPTED_LAB_REF)).thenReturn("REF-12345");
      when(encryptionService.decryptFromBytes(ENCRYPTED_NOTES)).thenReturn("All clear");
      when(encryptionService.decryptFromBytes(ENCRYPTED_RESULT_VALUE)).thenReturn("non-reactive");

      TestVisitResponse response = healthLogService.getVisit(jwt, VISIT_ID);

      assertThat(response.id()).isEqualTo(VISIT_ID);
      assertThat(response.labReference()).isEqualTo("REF-12345");
      assertThat(response.notes()).isEqualTo("All clear");
      assertThat(response.results()).hasSize(1);
      assertThat(response.results().getFirst().conditionType()).isEqualTo("HIV");
      assertThat(response.results().getFirst().status()).isEqualTo("NEGATIVE");
      assertThat(response.results().getFirst().resultValue()).isEqualTo("non-reactive");
      assertThat(response.results().getFirst().referenceRange()).isEqualTo("< 1.0");
    }

    @Test
    @DisplayName("should reject if not owner")
    void getVisit_shouldRejectIfNotOwner() {
      Jwt jwt = mockJwt();

      TestVisit visit = buildVisit(VISIT_ID, "other_user_hash");
      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));

      assertThatThrownBy(() -> healthLogService.getVisit(jwt, VISIT_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("healthLog.error.notOwner");
    }

    @Test
    @DisplayName("should throw ResourceNotFoundException for missing visit")
    void getVisit_shouldThrowNotFound() {
      Jwt jwt = mockJwt();

      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> healthLogService.getVisit(jwt, VISIT_ID))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessage("healthLog.error.notFound");
    }
  }

  @Nested
  @DisplayName("updateVisit")
  class UpdateVisit {

    @Test
    @DisplayName("should replace results and re-sync health_status")
    void updateVisit_shouldReplaceResultsAndReSync() {
      Jwt jwt = mockJwt();

      TestVisit visit = buildVisit(VISIT_ID, USER_HASH);
      visit.setNotesEncrypted(ENCRYPTED_NOTES);

      // Old result: HIV NEGATIVE
      TestResult oldResult = buildResult(VISIT_ID, ConditionType.HIV, TestResultStatus.NEGATIVE);

      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));
      when(testResultRepository.findByVisitIdOrderByCreatedAt(VISIT_ID))
          .thenReturn(List.of(oldResult));

      // New results: HIV POSITIVE
      List<TestResultInput> newResults = List.of(
          new TestResultInput("HIV", null, "POSITIVE", null, null));
      UpdateTestVisitRequest request = new UpdateTestVisitRequest(
          "2026-03-01", null, null, newResults, "Updated notes");

      byte[] encryptedNewNotes = new byte[]{20, 21, 22};
      when(encryptionService.encryptToBytes("Updated notes")).thenReturn(encryptedNewNotes);

      when(testVisitRepository.save(any(TestVisit.class))).thenAnswer(i -> i.getArgument(0));
      when(testResultRepository.save(any(TestResult.class))).thenAnswer(invocation -> {
        TestResult saved = invocation.getArgument(0);
        saved.setId(UUID.randomUUID());
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      // Write-through for HIV POSITIVE
      when(healthStatusRepository.findByUserHashAndConditionType(USER_HASH, ConditionType.HIV))
          .thenReturn(Optional.empty());
      when(healthStatusRepository.save(any(HealthStatus.class))).thenAnswer(i -> i.getArgument(0));

      // Decryption stubs for toResponse
      when(encryptionService.decryptFromBytes(encryptedNewNotes)).thenReturn("Updated notes");

      TestVisitResponse response = healthLogService.updateVisit(jwt, VISIT_ID, request);

      // Verify old results were deleted
      verify(testResultRepository).deleteAll(List.of(oldResult));

      // Verify new result was saved
      ArgumentCaptor<TestResult> resultCaptor = ArgumentCaptor.forClass(TestResult.class);
      verify(testResultRepository).save(resultCaptor.capture());
      assertThat(resultCaptor.getValue().getConditionType()).isEqualTo(ConditionType.HIV);
      assertThat(resultCaptor.getValue().getStatus()).isEqualTo(TestResultStatus.POSITIVE);

      // Verify visit was updated
      assertThat(visit.getTestDate()).isEqualTo(LocalDate.of(2026, 3, 1));
      assertThat(visit.getNotesEncrypted()).isEqualTo(encryptedNewNotes);

      // Verify health_status write-through
      ArgumentCaptor<HealthStatus> hsCaptor = ArgumentCaptor.forClass(HealthStatus.class);
      verify(healthStatusRepository).save(hsCaptor.capture());
      assertThat(hsCaptor.getValue().getConditionType()).isEqualTo(ConditionType.HIV);
      assertThat(hsCaptor.getValue().getStatus()).isEqualTo(HealthStatusValue.POSITIVE);

      assertThat(response.notes()).isEqualTo("Updated notes");
      assertThat(response.testDate()).isEqualTo(LocalDate.of(2026, 3, 1));
    }

    @Test
    @DisplayName("should throw ResourceNotFoundException for missing visit")
    void updateVisit_shouldThrowNotFound() {
      Jwt jwt = mockJwt();

      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.empty());

      UpdateTestVisitRequest request = new UpdateTestVisitRequest(
          "2026-03-01", null, null, null, null);

      assertThatThrownBy(() -> healthLogService.updateVisit(jwt, VISIT_ID, request))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessage("healthLog.error.notFound");
    }

    @Test
    @DisplayName("should reject update if not owner")
    void updateVisit_shouldRejectIfNotOwner() {
      Jwt jwt = mockJwt();

      TestVisit visit = buildVisit(VISIT_ID, "other_user_hash");
      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));

      UpdateTestVisitRequest request = new UpdateTestVisitRequest(
          "2026-03-01", null, null, null, null);

      assertThatThrownBy(() -> healthLogService.updateVisit(jwt, VISIT_ID, request))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("healthLog.error.notOwner");
    }
  }

  @Nested
  @DisplayName("deleteVisit")
  class DeleteVisit {

    @Test
    @DisplayName("should cascade delete and re-derive health_status")
    void deleteVisit_shouldCascadeAndReDeriveHealthStatus() {
      Jwt jwt = mockJwt();

      TestVisit visit = buildVisit(VISIT_ID, USER_HASH);
      TestResult hivResult = buildResult(VISIT_ID, ConditionType.HIV, TestResultStatus.POSITIVE);

      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));
      when(testResultRepository.findByVisitIdOrderByCreatedAt(VISIT_ID))
          .thenReturn(List.of(hivResult));

      // Re-derive: no other HIV results exist for this user
      when(testResultRepository.findByUserAndCondition(USER_HASH, ConditionType.HIV))
          .thenReturn(Collections.emptyList());
      // Existing health_status for HIV should be deleted
      HealthStatus existingHs = HealthStatus.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .conditionType(ConditionType.HIV)
          .status(HealthStatusValue.POSITIVE)
          .build();
      when(healthStatusRepository.findByUserHashAndConditionType(USER_HASH, ConditionType.HIV))
          .thenReturn(Optional.of(existingHs));

      healthLogService.deleteVisit(jwt, VISIT_ID);

      // Verify visit was deleted
      verify(testVisitRepository).delete(visit);

      // Verify health_status was deleted since no other HIV results remain
      verify(healthStatusRepository).delete(existingHs);
    }

    @Test
    @DisplayName("should re-derive health_status from remaining results after delete")
    void deleteVisit_shouldReDeriveFromRemainingResults() {
      Jwt jwt = mockJwt();

      TestVisit visit = buildVisit(VISIT_ID, USER_HASH);
      TestResult hivResult = buildResult(VISIT_ID, ConditionType.HIV, TestResultStatus.POSITIVE);

      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));
      when(testResultRepository.findByVisitIdOrderByCreatedAt(VISIT_ID))
          .thenReturn(List.of(hivResult));

      // Re-derive: another HIV NEGATIVE result exists from a different visit
      TestResult remainingResult = buildResult(UUID.randomUUID(), ConditionType.HIV, TestResultStatus.NEGATIVE);
      when(testResultRepository.findByUserAndCondition(USER_HASH, ConditionType.HIV))
          .thenReturn(List.of(remainingResult));

      HealthStatus existingHs = HealthStatus.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .conditionType(ConditionType.HIV)
          .status(HealthStatusValue.POSITIVE)
          .build();
      when(healthStatusRepository.findByUserHashAndConditionType(USER_HASH, ConditionType.HIV))
          .thenReturn(Optional.of(existingHs));
      when(healthStatusRepository.save(any(HealthStatus.class))).thenAnswer(i -> i.getArgument(0));

      healthLogService.deleteVisit(jwt, VISIT_ID);

      verify(testVisitRepository).delete(visit);

      // Health status should be updated to NEGATIVE (from remaining result), not deleted
      ArgumentCaptor<HealthStatus> captor = ArgumentCaptor.forClass(HealthStatus.class);
      verify(healthStatusRepository).save(captor.capture());
      assertThat(captor.getValue().getStatus()).isEqualTo(HealthStatusValue.NEGATIVE);
      verify(healthStatusRepository, never()).delete(any());
    }

    @Test
    @DisplayName("should throw ResourceNotFoundException for missing visit")
    void deleteVisit_shouldThrowNotFound() {
      Jwt jwt = mockJwt();

      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> healthLogService.deleteVisit(jwt, VISIT_ID))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessage("healthLog.error.notFound");
    }

    @Test
    @DisplayName("should reject delete if not owner")
    void deleteVisit_shouldRejectIfNotOwner() {
      Jwt jwt = mockJwt();

      TestVisit visit = buildVisit(VISIT_ID, "other_user_hash");
      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));

      assertThatThrownBy(() -> healthLogService.deleteVisit(jwt, VISIT_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("healthLog.error.notOwner");
    }
  }

  @Nested
  @DisplayName("listVisits")
  class ListVisits {

    @Test
    @DisplayName("should return visits ordered newest first")
    void listVisits_shouldReturnNewestFirst() {
      Jwt jwt = mockJwt();

      TestVisit visit1 = buildVisit(UUID.randomUUID(), USER_HASH);
      visit1.setTestDate(LocalDate.of(2026, 1, 10));

      TestVisit visit2 = buildVisit(UUID.randomUUID(), USER_HASH);
      visit2.setTestDate(LocalDate.of(2026, 2, 15));

      // Repository already returns in order (testDate desc)
      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(List.of(visit2, visit1));
      when(testResultRepository.findByVisitIdOrderByCreatedAt(visit1.getId()))
          .thenReturn(Collections.emptyList());
      when(testResultRepository.findByVisitIdOrderByCreatedAt(visit2.getId()))
          .thenReturn(Collections.emptyList());

      List<TestVisitResponse> result = healthLogService.listVisits(jwt);

      assertThat(result).hasSize(2);
      assertThat(result.get(0).testDate()).isEqualTo(LocalDate.of(2026, 2, 15));
      assertThat(result.get(1).testDate()).isEqualTo(LocalDate.of(2026, 1, 10));
    }

    @Test
    @DisplayName("should return empty list when no visits")
    void listVisits_shouldReturnEmptyList() {
      Jwt jwt = mockJwt();

      when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      List<TestVisitResponse> result = healthLogService.listVisits(jwt);

      assertThat(result).isEmpty();
    }
  }
}
