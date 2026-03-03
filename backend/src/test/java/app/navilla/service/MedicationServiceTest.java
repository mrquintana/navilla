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
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import app.navilla.config.HealthCatalogProperties;
import app.navilla.config.HealthCatalogProperties.FrequencyConfig;
import app.navilla.config.HealthCatalogProperties.MedicationTypeConfig;
import app.navilla.dto.CreateMedicationRequest;
import app.navilla.dto.DoseLogEntry;
import app.navilla.dto.LogDoseRequest;
import app.navilla.dto.MedicationAdherenceResponse;
import app.navilla.dto.MedicationResponse;
import app.navilla.dto.UpdateMedicationRequest;
import app.navilla.entity.Medication;
import app.navilla.entity.MedicationLog;
import app.navilla.entity.Reminder;
import app.navilla.repository.MedicationLogRepository;
import app.navilla.repository.MedicationRepository;
import app.navilla.repository.ReminderRepository;
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
 * Unit tests for {@link MedicationService}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@ExtendWith(MockitoExtension.class)
class MedicationServiceTest {

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
  private static final UUID MED_ID = UUID.randomUUID();
  private static final byte[] ENCRYPTED_NAME = new byte[]{1, 2, 3};
  private static final byte[] ENCRYPTED_DOSAGE = new byte[]{4, 5, 6};
  private static final byte[] ENCRYPTED_NOTES = new byte[]{7, 8, 9};

  private Jwt mockJwt() {
    Jwt jwt = mock(Jwt.class);
    when(jwt.getClaimAsString("email")).thenReturn(USER_EMAIL);
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    return jwt;
  }

  private Medication buildMedication(UUID id, String userHash, boolean active) {
    return Medication.builder()
        .id(id)
        .userHash(userHash)
        .medicationType("PREP_DAILY")
        .nameEncrypted(ENCRYPTED_NAME)
        .dosageEncrypted(ENCRYPTED_DOSAGE)
        .startDate(LocalDate.of(2026, 3, 1))
        .endDate(null)
        .frequency("DAILY")
        .reminderTime(LocalTime.of(9, 0))
        .notesEncrypted(ENCRYPTED_NOTES)
        .active(active)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  private void stubDecryption() {
    when(encryptionService.decryptFromBytes(ENCRYPTED_NAME)).thenReturn("Truvada");
    when(encryptionService.decryptFromBytes(ENCRYPTED_DOSAGE)).thenReturn("200mg/300mg");
    when(encryptionService.decryptFromBytes(ENCRYPTED_NOTES)).thenReturn("Take with food");
  }

  private Map<String, MedicationTypeConfig> defaultMedTypes() {
    return Map.of(
        "PREP_DAILY", new MedicationTypeConfig("medications.type.prepDaily", "DAILY", true),
        "PREP_ON_DEMAND", new MedicationTypeConfig("medications.type.prepOnDemand", "AS_NEEDED", false)
    );
  }

  private Map<String, FrequencyConfig> defaultFrequencies() {
    return Map.of(
        "DAILY", new FrequencyConfig(24, null)
    );
  }

  @Nested
  @DisplayName("create")
  class CreateMedication {

    @Test
    @DisplayName("should save medication with encrypted fields and return response")
    void create_shouldSaveWithEncryptedFieldsAndReturnResponse() {
      Jwt jwt = mockJwt();

      CreateMedicationRequest request = new CreateMedicationRequest(
          "PREP_DAILY", "Truvada", "200mg/300mg", "2026-03-01",
          null, "DAILY", null, "Take with food");

      when(catalogProperties.medicationTypes()).thenReturn(defaultMedTypes());
      when(encryptionService.encryptToBytes("Truvada")).thenReturn(ENCRYPTED_NAME);
      when(encryptionService.encryptToBytes("200mg/300mg")).thenReturn(ENCRYPTED_DOSAGE);
      when(encryptionService.encryptToBytes("Take with food")).thenReturn(ENCRYPTED_NOTES);

      when(medicationRepository.save(any(Medication.class))).thenAnswer(invocation -> {
        Medication saved = invocation.getArgument(0);
        saved.setId(MED_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      // Decryption for toResponse
      stubDecryption();

      MedicationResponse response = medicationService.create(jwt, request);

      // Verify entity was saved with encrypted fields
      ArgumentCaptor<Medication> captor = ArgumentCaptor.forClass(Medication.class);
      verify(medicationRepository).save(captor.capture());
      Medication captured = captor.getValue();
      assertThat(captured.getUserHash()).isEqualTo(USER_HASH);
      assertThat(captured.getMedicationType()).isEqualTo("PREP_DAILY");
      assertThat(captured.getNameEncrypted()).isEqualTo(ENCRYPTED_NAME);
      assertThat(captured.getDosageEncrypted()).isEqualTo(ENCRYPTED_DOSAGE);
      assertThat(captured.getNotesEncrypted()).isEqualTo(ENCRYPTED_NOTES);
      assertThat(captured.getStartDate()).isEqualTo(LocalDate.of(2026, 3, 1));
      assertThat(captured.getFrequency()).isEqualTo("DAILY");
      assertThat(captured.getActive()).isTrue();

      // No reminder should be created (reminderTime is null)
      verify(reminderRepository, never()).save(any());

      // Verify response has decrypted fields
      assertThat(response.id()).isEqualTo(MED_ID);
      assertThat(response.name()).isEqualTo("Truvada");
      assertThat(response.dosage()).isEqualTo("200mg/300mg");
      assertThat(response.notes()).isEqualTo("Take with food");
      assertThat(response.medicationType()).isEqualTo("PREP_DAILY");
      assertThat(response.frequency()).isEqualTo("DAILY");
      assertThat(response.active()).isTrue();
    }

    @Test
    @DisplayName("should create linked reminder when reminderTime is set")
    void create_shouldCreateLinkedReminderWhenReminderTimeSet() {
      Jwt jwt = mockJwt();

      CreateMedicationRequest request = new CreateMedicationRequest(
          "PREP_DAILY", "Truvada", null, "2026-03-01",
          null, "DAILY", "09:00", null);

      when(catalogProperties.medicationTypes()).thenReturn(defaultMedTypes());
      when(catalogProperties.frequencies()).thenReturn(defaultFrequencies());
      when(encryptionService.encryptToBytes("Truvada")).thenReturn(ENCRYPTED_NAME);

      when(medicationRepository.save(any(Medication.class))).thenAnswer(invocation -> {
        Medication saved = invocation.getArgument(0);
        saved.setId(MED_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> {
        Reminder saved = invocation.getArgument(0);
        saved.setId(UUID.randomUUID());
        return saved;
      });

      // Decryption for toResponse
      when(encryptionService.decryptFromBytes(ENCRYPTED_NAME)).thenReturn("Truvada");

      medicationService.create(jwt, request);

      // Verify reminder was created with correct fields
      ArgumentCaptor<Reminder> captor = ArgumentCaptor.forClass(Reminder.class);
      verify(reminderRepository).save(captor.capture());
      Reminder reminder = captor.getValue();
      assertThat(reminder.getUserHash()).isEqualTo(USER_HASH);
      assertThat(reminder.getReminderType()).isEqualTo("MEDICATION");
      assertThat(reminder.getReferenceId()).isEqualTo(MED_ID);
      assertThat(reminder.getTitleEncrypted()).isEqualTo(ENCRYPTED_NAME);
      assertThat(reminder.getRepeatRule()).isNotNull();
      assertThat(reminder.getActive()).isTrue();
    }

    @Test
    @DisplayName("should NOT create reminder when reminderTime is null")
    void create_shouldNotCreateReminderWhenReminderTimeNull() {
      Jwt jwt = mockJwt();

      CreateMedicationRequest request = new CreateMedicationRequest(
          "PREP_DAILY", "Truvada", null, "2026-03-01",
          null, "DAILY", null, null);

      when(catalogProperties.medicationTypes()).thenReturn(defaultMedTypes());
      when(encryptionService.encryptToBytes("Truvada")).thenReturn(ENCRYPTED_NAME);

      when(medicationRepository.save(any(Medication.class))).thenAnswer(invocation -> {
        Medication saved = invocation.getArgument(0);
        saved.setId(MED_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      when(encryptionService.decryptFromBytes(ENCRYPTED_NAME)).thenReturn("Truvada");

      medicationService.create(jwt, request);

      verify(reminderRepository, never()).save(any());
    }

    @Test
    @DisplayName("should throw when medication type not in catalog")
    void create_shouldThrowWhenMedicationTypeNotInCatalog() {
      Jwt jwt = mockJwt();

      CreateMedicationRequest request = new CreateMedicationRequest(
          "UNKNOWN_TYPE", "Mystery Drug", null, "2026-03-01",
          null, "DAILY", null, null);

      when(catalogProperties.medicationTypes()).thenReturn(defaultMedTypes());

      assertThatThrownBy(() -> medicationService.create(jwt, request))
          .isInstanceOf(IllegalArgumentException.class);
    }
  }

  @Nested
  @DisplayName("list")
  class ListMedications {

    @Test
    @DisplayName("should return medications with decrypted fields ordered by active desc, created desc")
    void list_shouldReturnDecryptedMedicationsInOrder() {
      Jwt jwt = mockJwt();

      Medication med1 = buildMedication(MED_ID, USER_HASH, true);
      Medication med2 = buildMedication(UUID.randomUUID(), USER_HASH, false);

      when(medicationRepository.findByUserHashOrderByActiveDescCreatedAtDesc(USER_HASH))
          .thenReturn(List.of(med1, med2));

      stubDecryption();

      List<MedicationResponse> result = medicationService.list(jwt);

      assertThat(result).hasSize(2);
      assertThat(result.get(0).name()).isEqualTo("Truvada");
      assertThat(result.get(0).dosage()).isEqualTo("200mg/300mg");
      assertThat(result.get(0).notes()).isEqualTo("Take with food");
      assertThat(result.get(0).active()).isTrue();
      assertThat(result.get(1).active()).isFalse();
    }

    @Test
    @DisplayName("should return empty list for user with no medications")
    void list_shouldReturnEmptyListWhenNoMedications() {
      Jwt jwt = mockJwt();

      when(medicationRepository.findByUserHashOrderByActiveDescCreatedAtDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      List<MedicationResponse> result = medicationService.list(jwt);

      assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("should decrypt name, dosage, and notes in response")
    void list_shouldDecryptNameDosageAndNotes() {
      Jwt jwt = mockJwt();

      Medication med = buildMedication(MED_ID, USER_HASH, true);

      when(medicationRepository.findByUserHashOrderByActiveDescCreatedAtDesc(USER_HASH))
          .thenReturn(List.of(med));

      stubDecryption();

      List<MedicationResponse> result = medicationService.list(jwt);

      // Verify decryption was called for each encrypted field
      verify(encryptionService).decryptFromBytes(ENCRYPTED_NAME);
      verify(encryptionService).decryptFromBytes(ENCRYPTED_DOSAGE);
      verify(encryptionService).decryptFromBytes(ENCRYPTED_NOTES);

      assertThat(result.getFirst().name()).isEqualTo("Truvada");
      assertThat(result.getFirst().dosage()).isEqualTo("200mg/300mg");
      assertThat(result.getFirst().notes()).isEqualTo("Take with food");
    }
  }

  @Nested
  @DisplayName("update")
  class UpdateMedication {

    @Test
    @DisplayName("should update fields and recalculate linked reminder")
    void update_shouldUpdateFieldsAndRecalculateReminder() {
      Jwt jwt = mockJwt();

      Medication existing = buildMedication(MED_ID, USER_HASH, true);
      when(medicationRepository.findById(MED_ID)).thenReturn(Optional.of(existing));

      byte[] newNameEncrypted = new byte[]{20, 21, 22};
      when(encryptionService.encryptToBytes("Descovy")).thenReturn(newNameEncrypted);

      UpdateMedicationRequest request = new UpdateMedicationRequest(
          null, "Descovy", null, null, null, null, "10:00", null, null);

      when(catalogProperties.frequencies()).thenReturn(defaultFrequencies());

      // Existing reminders for this medication
      Reminder existingReminder = Reminder.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .reminderType("MEDICATION")
          .referenceId(MED_ID)
          .active(true)
          .build();
      when(reminderRepository.findByReferenceIdAndActiveTrueAndCompletedAtIsNull(MED_ID))
          .thenReturn(List.of(existingReminder));

      when(medicationRepository.save(any(Medication.class))).thenAnswer(i -> i.getArgument(0));
      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> i.getArgument(0));

      // Decryption for toResponse
      when(encryptionService.decryptFromBytes(newNameEncrypted)).thenReturn("Descovy");
      when(encryptionService.decryptFromBytes(ENCRYPTED_DOSAGE)).thenReturn("200mg/300mg");
      when(encryptionService.decryptFromBytes(ENCRYPTED_NOTES)).thenReturn("Take with food");

      MedicationResponse response = medicationService.update(jwt, MED_ID, request);

      // Verify medication was updated
      assertThat(existing.getNameEncrypted()).isEqualTo(newNameEncrypted);
      assertThat(existing.getReminderTime()).isEqualTo(LocalTime.of(10, 0));

      // Verify response has updated name
      assertThat(response.name()).isEqualTo("Descovy");
    }

    @Test
    @DisplayName("should throw for medication not owned by user")
    void update_shouldThrowForNotOwner() {
      Jwt jwt = mockJwt();

      Medication other = buildMedication(MED_ID, "other_hash", true);
      when(medicationRepository.findById(MED_ID)).thenReturn(Optional.of(other));

      UpdateMedicationRequest request = new UpdateMedicationRequest(
          null, "New Name", null, null, null, null, null, null, null);

      assertThatThrownBy(() -> medicationService.update(jwt, MED_ID, request))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("medication.error.notOwner");
    }
  }

  @Nested
  @DisplayName("deactivate")
  class DeactivateMedication {

    @Test
    @DisplayName("should set active=false and deactivate linked reminders")
    void deactivate_shouldSetInactiveAndDeactivateReminders() {
      Jwt jwt = mockJwt();

      Medication med = buildMedication(MED_ID, USER_HASH, true);
      when(medicationRepository.findById(MED_ID)).thenReturn(Optional.of(med));

      Reminder activeReminder = Reminder.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .reminderType("MEDICATION")
          .referenceId(MED_ID)
          .active(true)
          .build();
      when(reminderRepository.findByReferenceIdAndActiveTrueAndCompletedAtIsNull(MED_ID))
          .thenReturn(List.of(activeReminder));

      when(medicationRepository.save(any(Medication.class))).thenAnswer(i -> i.getArgument(0));
      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> i.getArgument(0));

      medicationService.deactivate(jwt, MED_ID);

      // Verify medication was deactivated
      assertThat(med.getActive()).isFalse();
      verify(medicationRepository).save(med);

      // Verify reminder was deactivated
      ArgumentCaptor<Reminder> captor = ArgumentCaptor.forClass(Reminder.class);
      verify(reminderRepository).save(captor.capture());
      assertThat(captor.getValue().getActive()).isFalse();
    }

    @Test
    @DisplayName("should throw for medication not owned by user")
    void deactivate_shouldThrowForNotOwner() {
      Jwt jwt = mockJwt();

      Medication other = buildMedication(MED_ID, "other_hash", true);
      when(medicationRepository.findById(MED_ID)).thenReturn(Optional.of(other));

      assertThatThrownBy(() -> medicationService.deactivate(jwt, MED_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("medication.error.notOwner");
    }
  }

  @Nested
  @DisplayName("logDose")
  class LogDose {

    @Test
    @DisplayName("should create medication log entry")
    void logDose_shouldCreateLogEntry() {
      Jwt jwt = mockJwt();

      Medication med = buildMedication(MED_ID, USER_HASH, true);
      when(medicationRepository.findById(MED_ID)).thenReturn(Optional.of(med));

      LogDoseRequest request = new LogDoseRequest("2026-03-03", true, "Took with breakfast");

      byte[] encryptedLogNotes = new byte[]{30, 31, 32};
      when(encryptionService.encryptToBytes("Took with breakfast")).thenReturn(encryptedLogNotes);

      when(medicationLogRepository.save(any(MedicationLog.class))).thenAnswer(invocation -> {
        MedicationLog saved = invocation.getArgument(0);
        saved.setId(UUID.randomUUID());
        saved.setLoggedAt(OffsetDateTime.now());
        saved.setCreatedAt(OffsetDateTime.now());
        return saved;
      });

      when(encryptionService.decryptFromBytes(encryptedLogNotes)).thenReturn("Took with breakfast");

      DoseLogEntry result = medicationService.logDose(jwt, MED_ID, request);

      // Verify log was saved
      ArgumentCaptor<MedicationLog> captor = ArgumentCaptor.forClass(MedicationLog.class);
      verify(medicationLogRepository).save(captor.capture());
      MedicationLog captured = captor.getValue();
      assertThat(captured.getMedication()).isEqualTo(med);
      assertThat(captured.getUserHash()).isEqualTo(USER_HASH);
      assertThat(captured.getScheduledFor()).isEqualTo(LocalDate.of(2026, 3, 3));
      assertThat(captured.getTaken()).isTrue();
      assertThat(captured.getNotesEncrypted()).isEqualTo(encryptedLogNotes);

      // Verify response
      assertThat(result.taken()).isTrue();
      assertThat(result.scheduledFor()).isEqualTo("2026-03-03");
      assertThat(result.notes()).isEqualTo("Took with breakfast");
    }

    @Test
    @DisplayName("should throw for inactive medication")
    void logDose_shouldThrowForInactiveMedication() {
      Jwt jwt = mockJwt();

      Medication inactiveMed = buildMedication(MED_ID, USER_HASH, false);
      when(medicationRepository.findById(MED_ID)).thenReturn(Optional.of(inactiveMed));

      LogDoseRequest request = new LogDoseRequest("2026-03-03", true, null);

      assertThatThrownBy(() -> medicationService.logDose(jwt, MED_ID, request))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("medication.error.inactive");
    }
  }

  @Nested
  @DisplayName("getAdherence")
  class GetAdherence {

    @Test
    @DisplayName("should calculate adherence rate for given month")
    void getAdherence_shouldCalculateAdherenceRate() {
      Jwt jwt = mockJwt();

      Medication med = buildMedication(MED_ID, USER_HASH, true);
      med.setStartDate(LocalDate.of(2026, 2, 1));
      when(medicationRepository.findById(MED_ID)).thenReturn(Optional.of(med));

      // March 2026 has 31 days, medication started Feb 1 so all 31 days count
      LocalDate monthStart = LocalDate.of(2026, 3, 1);
      LocalDate monthEnd = LocalDate.of(2026, 3, 31);

      when(medicationLogRepository.countByMedicationIdAndTakenTrueAndScheduledForBetween(
          MED_ID, monthStart, monthEnd)).thenReturn(25L);
      when(medicationLogRepository.countByMedicationIdAndScheduledForBetween(
          MED_ID, monthStart, monthEnd)).thenReturn(31L);

      MedicationLog log1 = MedicationLog.builder()
          .id(UUID.randomUUID())
          .medication(med)
          .userHash(USER_HASH)
          .scheduledFor(LocalDate.of(2026, 3, 1))
          .taken(true)
          .loggedAt(OffsetDateTime.now())
          .createdAt(OffsetDateTime.now())
          .build();

      when(medicationLogRepository.findByMedicationIdAndScheduledForBetween(
          MED_ID, monthStart, monthEnd)).thenReturn(List.of(log1));

      MedicationAdherenceResponse result = medicationService.getAdherence(jwt, MED_ID, "2026-03");

      assertThat(result.month()).isEqualTo("2026-03");
      assertThat(result.takenCount()).isEqualTo(25);
      assertThat(result.totalDays()).isEqualTo(31);
      assertThat(result.adherenceRate()).isGreaterThan(0.0);
      assertThat(result.logs()).hasSize(1);
    }

    @Test
    @DisplayName("should return zero when no logs exist")
    void getAdherence_shouldReturnZeroWhenNoLogs() {
      Jwt jwt = mockJwt();

      Medication med = buildMedication(MED_ID, USER_HASH, true);
      med.setStartDate(LocalDate.of(2026, 2, 1));
      when(medicationRepository.findById(MED_ID)).thenReturn(Optional.of(med));

      LocalDate monthStart = LocalDate.of(2026, 3, 1);
      LocalDate monthEnd = LocalDate.of(2026, 3, 31);

      when(medicationLogRepository.countByMedicationIdAndTakenTrueAndScheduledForBetween(
          MED_ID, monthStart, monthEnd)).thenReturn(0L);
      when(medicationLogRepository.countByMedicationIdAndScheduledForBetween(
          MED_ID, monthStart, monthEnd)).thenReturn(0L);
      when(medicationLogRepository.findByMedicationIdAndScheduledForBetween(
          MED_ID, monthStart, monthEnd)).thenReturn(Collections.emptyList());

      MedicationAdherenceResponse result = medicationService.getAdherence(jwt, MED_ID, "2026-03");

      assertThat(result.month()).isEqualTo("2026-03");
      assertThat(result.takenCount()).isZero();
      assertThat(result.totalDays()).isEqualTo(31);
      assertThat(result.adherenceRate()).isEqualTo(0.0);
      assertThat(result.logs()).isEmpty();
    }
  }
}
