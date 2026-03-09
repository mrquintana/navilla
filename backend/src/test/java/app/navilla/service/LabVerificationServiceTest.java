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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import app.navilla.entity.HealthStatus;
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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link LabVerificationService}.
 *
 * @author Navilla Team
 * @since 2026-03-06
 */
@ExtendWith(MockitoExtension.class)
class LabVerificationServiceTest {

  @Mock
  private LabProviderRegistry labProviderRegistry;

  @Mock
  private TestVisitRepository testVisitRepository;

  @Mock
  private TestResultRepository testResultRepository;

  @Mock
  private HealthStatusRepository healthStatusRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private ConditionCatalogService conditionCatalogService;

  @InjectMocks
  private LabVerificationService labVerificationService;

  private static final String USER_HASH = "userhash123";
  private static final UUID VISIT_ID = UUID.randomUUID();

  private TestVisit buildVisit(UUID id, String userHash) {
    return TestVisit.builder()
        .id(id)
        .userHash(userHash)
        .testDate(LocalDate.of(2026, 3, 1))
        .verified(false)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  @Nested
  @DisplayName("verify")
  class Verify {

    @Test
    @DisplayName("should return results on successful verification with existing visit")
    void verify_success() {
      TestVisit visit = buildVisit(VISIT_ID, USER_HASH);
      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));

      LabProvider mockProvider = org.mockito.Mockito.mock(LabProvider.class);
      when(labProviderRegistry.getProvider("CHOPO")).thenReturn(Optional.of(mockProvider));
      when(mockProvider.validateInput(any())).thenReturn(ValidationResult.ok());

      List<LabTestResult> labResults = List.of(
          new LabTestResult("Test User", LocalDate.of(2026, 3, 1),
              "HIV", "NEGATIVE", "non-reactive", "< 1.0", "REF-001"));
      LabVerificationResult expected = LabVerificationResult.success(
          new byte[]{1, 2, 3}, "application/json", labResults);
      when(mockProvider.verify(any(), any())).thenReturn(expected);

      LabVerifyServiceResponse response = labVerificationService.verify(
          USER_HASH, VISIT_ID, null, "CHOPO", Map.of("orderNumber", "123"), Map.of());

      assertThat(response.visitId()).isEqualTo(VISIT_ID);
      assertThat(response.result().success()).isTrue();
      assertThat(response.result().results()).hasSize(1);
      assertThat(response.result().results().getFirst().conditionCode()).isEqualTo("HIV");
    }

    @Test
    @DisplayName("should create shell visit when visitId is null")
    void verify_createsShellVisit() {
      UUID shellId = UUID.randomUUID();
      when(testVisitRepository.save(any(TestVisit.class))).thenAnswer(invocation -> {
        TestVisit saved = invocation.getArgument(0);
        saved.setId(shellId);
        return saved;
      });

      LabProvider mockProvider = org.mockito.Mockito.mock(LabProvider.class);
      when(labProviderRegistry.getProvider("CHOPO")).thenReturn(Optional.of(mockProvider));
      when(mockProvider.validateInput(any())).thenReturn(ValidationResult.ok());

      List<LabTestResult> labResults = List.of(
          new LabTestResult("Test User", LocalDate.of(2026, 3, 1),
              "HIV", "NEGATIVE", "non-reactive", "< 1.0", "REF-001"));
      LabVerificationResult expected = LabVerificationResult.success(
          new byte[]{1, 2, 3}, "application/json", labResults);
      when(mockProvider.verify(any(), any())).thenReturn(expected);

      LocalDate testDate = LocalDate.of(2026, 3, 5);
      LabVerifyServiceResponse response = labVerificationService.verify(
          USER_HASH, null, testDate, "CHOPO", Map.of("orderNumber", "123"), Map.of());

      assertThat(response.visitId()).isEqualTo(shellId);
      assertThat(response.result().success()).isTrue();

      // Verify shell visit was saved with correct fields
      ArgumentCaptor<TestVisit> captor = ArgumentCaptor.forClass(TestVisit.class);
      verify(testVisitRepository).save(captor.capture());
      TestVisit shell = captor.getValue();
      assertThat(shell.getUserHash()).isEqualTo(USER_HASH);
      assertThat(shell.getTestDate()).isEqualTo(testDate);
      assertThat(shell.getVerified()).isFalse();
    }

    @Test
    @DisplayName("should throw when provider is unknown")
    void verify_unknownProvider() {
      TestVisit visit = buildVisit(VISIT_ID, USER_HASH);
      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));
      when(labProviderRegistry.getProvider("UNKNOWN")).thenReturn(Optional.empty());

      assertThatThrownBy(() -> labVerificationService.verify(
          USER_HASH, VISIT_ID, null, "UNKNOWN", Map.of(), Map.of()))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Unknown lab provider");
    }

    @Test
    @DisplayName("should throw when visit not found")
    void verify_visitNotFound() {
      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> labVerificationService.verify(
          USER_HASH, VISIT_ID, null, "CHOPO", Map.of(), Map.of()))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Visit not found");
    }

    @Test
    @DisplayName("should throw when visit belongs to different user")
    void verify_wrongUser() {
      TestVisit visit = buildVisit(VISIT_ID, "other_user_hash");
      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));

      assertThatThrownBy(() -> labVerificationService.verify(
          USER_HASH, VISIT_ID, null, "CHOPO", Map.of(), Map.of()))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("does not belong to user");
    }

    @Test
    @DisplayName("should return failure when input validation fails")
    void verify_validationFailure() {
      TestVisit visit = buildVisit(VISIT_ID, USER_HASH);
      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));

      LabProvider mockProvider = org.mockito.Mockito.mock(LabProvider.class);
      when(labProviderRegistry.getProvider("CHOPO")).thenReturn(Optional.of(mockProvider));
      when(mockProvider.validateInput(any())).thenReturn(
          ValidationResult.invalid(Map.of("orderNumber", "required")));

      LabVerifyServiceResponse response = labVerificationService.verify(
          USER_HASH, VISIT_ID, null, "CHOPO", Map.of(), Map.of());

      assertThat(response.result().success()).isFalse();
      assertThat(response.result().errorCode()).isEqualTo("VALIDATION_ERROR");
    }
  }

  @Nested
  @DisplayName("confirm")
  class Confirm {

    @Test
    @DisplayName("should save verified visit with results and sync health status")
    void confirm_savesVerifiedVisit() {
      TestVisit visit = buildVisit(VISIT_ID, USER_HASH);
      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));
      when(testVisitRepository.save(any(TestVisit.class))).thenAnswer(i -> i.getArgument(0));

      when(testResultRepository.findByVisitIdOrderByCreatedAt(VISIT_ID))
          .thenReturn(Collections.emptyList());
      when(testResultRepository.save(any(TestResult.class))).thenAnswer(invocation -> {
        TestResult saved = invocation.getArgument(0);
        saved.setId(UUID.randomUUID());
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      when(encryptionService.encryptToBytes(anyString())).thenReturn(new byte[]{1, 2, 3});
      when(conditionCatalogService.isValidCode("HIV")).thenReturn(true);
      when(healthStatusRepository.findByUserHashAndConditionType(USER_HASH, "HIV"))
          .thenReturn(Optional.empty());
      when(healthStatusRepository.save(any(HealthStatus.class))).thenAnswer(i -> i.getArgument(0));

      List<LabTestResult> labResults = List.of(
          new LabTestResult("Test User", LocalDate.of(2026, 3, 1),
              "HIV", "NEGATIVE", "non-reactive", "< 1.0", "REF-001"));

      labVerificationService.confirm(USER_HASH, VISIT_ID, labResults, new byte[]{10, 20});

      // Verify visit was marked as verified
      ArgumentCaptor<TestVisit> visitCaptor = ArgumentCaptor.forClass(TestVisit.class);
      verify(testVisitRepository).save(visitCaptor.capture());
      TestVisit savedVisit = visitCaptor.getValue();
      assertThat(savedVisit.getVerified()).isTrue();
      assertThat(savedVisit.getVerifiedAt()).isNotNull();
      assertThat(savedVisit.getRawLabResponseEncrypted()).isNotNull();

      // Verify test result was saved
      ArgumentCaptor<TestResult> resultCaptor = ArgumentCaptor.forClass(TestResult.class);
      verify(testResultRepository).save(resultCaptor.capture());
      TestResult savedResult = resultCaptor.getValue();
      assertThat(savedResult.getConditionType()).isEqualTo("HIV");
      assertThat(savedResult.getStatus()).isEqualTo(TestResultStatus.NEGATIVE);

      // Verify health status was synced with verified=true
      ArgumentCaptor<HealthStatus> hsCaptor = ArgumentCaptor.forClass(HealthStatus.class);
      verify(healthStatusRepository).save(hsCaptor.capture());
      HealthStatus savedHs = hsCaptor.getValue();
      assertThat(savedHs.getConditionType()).isEqualTo("HIV");
      assertThat(savedHs.getVerified()).isTrue();
    }

    @Test
    @DisplayName("should throw when visit not found")
    void confirm_visitNotFound() {
      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> labVerificationService.confirm(
          USER_HASH, VISIT_ID, List.of(), null))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Visit not found");
    }

    @Test
    @DisplayName("should throw when visit belongs to different user")
    void confirm_wrongUser() {
      TestVisit visit = buildVisit(VISIT_ID, "other_user_hash");
      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));

      assertThatThrownBy(() -> labVerificationService.confirm(
          USER_HASH, VISIT_ID, List.of(), null))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("does not belong to user");
    }

    @Test
    @DisplayName("should not sync health status for unknown condition codes")
    void confirm_skipsUnknownConditions() {
      TestVisit visit = buildVisit(VISIT_ID, USER_HASH);
      when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(visit));
      when(testVisitRepository.save(any(TestVisit.class))).thenAnswer(i -> i.getArgument(0));
      when(testResultRepository.findByVisitIdOrderByCreatedAt(VISIT_ID))
          .thenReturn(Collections.emptyList());
      when(testResultRepository.save(any(TestResult.class))).thenAnswer(invocation -> {
        TestResult saved = invocation.getArgument(0);
        saved.setId(UUID.randomUUID());
        return saved;
      });

      when(conditionCatalogService.isValidCode("UNKNOWN_CONDITION")).thenReturn(false);

      List<LabTestResult> labResults = List.of(
          new LabTestResult("User", null, "unknown_condition", "NEGATIVE", null, null, null));

      labVerificationService.confirm(USER_HASH, VISIT_ID, labResults, null);

      verify(healthStatusRepository, never()).save(any());
    }
  }
}
