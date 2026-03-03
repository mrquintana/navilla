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
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import app.navilla.config.HealthCatalogProperties;
import app.navilla.dto.CreateMedicationRequest;
import app.navilla.dto.DoseLogEntry;
import app.navilla.dto.LogDoseRequest;
import app.navilla.dto.MedicationAdherenceResponse;
import app.navilla.dto.MedicationResponse;
import app.navilla.dto.UpdateMedicationRequest;
import app.navilla.entity.Medication;
import app.navilla.entity.MedicationLog;
import app.navilla.entity.Reminder;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.MedicationLogRepository;
import app.navilla.repository.MedicationRepository;
import app.navilla.repository.ReminderRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing medication CRUD operations, dose logging, and adherence tracking.
 *
 * <p>Handles creation, retrieval, update, and deactivation of medications.
 * Sensitive fields (name, dosage, notes) are encrypted at rest.
 * Optionally creates linked reminders when a reminder time is specified.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MedicationService {

  private final MedicationRepository medicationRepository;
  private final MedicationLogRepository medicationLogRepository;
  private final ReminderRepository reminderRepository;
  private final EncryptionService encryptionService;
  private final HealthCatalogProperties catalogProperties;

  /**
   * Creates a new medication with encrypted fields and an optional linked reminder.
   *
   * @param jwt     the authenticated user's JWT
   * @param request the create request with medication details
   * @return the created medication response with decrypted fields
   * @throws IllegalArgumentException if the medication type is not in the catalog
   */
  @Transactional
  public MedicationResponse create(Jwt jwt, CreateMedicationRequest request) {
    String userHash = hashEmail(jwt);

    // Validate medication type against catalog
    if (!catalogProperties.medicationTypes().containsKey(request.medicationType())) {
      throw new IllegalArgumentException("medication.error.invalidType");
    }

    Medication medication = Medication.builder()
        .userHash(userHash)
        .medicationType(request.medicationType())
        .nameEncrypted(encryptionService.encryptToBytes(request.name()))
        .dosageEncrypted(encryptOptional(request.dosage()))
        .startDate(LocalDate.parse(request.startDate()))
        .endDate(request.endDate() != null ? LocalDate.parse(request.endDate()) : null)
        .frequency(request.frequency())
        .reminderTime(request.reminderTime() != null && !request.reminderTime().isBlank()
            ? LocalTime.parse(request.reminderTime()) : null)
        .notesEncrypted(encryptOptional(request.notes()))
        .active(true)
        .build();

    Medication saved = medicationRepository.save(medication);
    log.info("Medication created: {}", saved.getId());

    // Create linked reminder if reminderTime is set
    if (request.reminderTime() != null && !request.reminderTime().isBlank()) {
      createLinkedReminder(userHash, saved);
    }

    return toResponse(saved);
  }

  /**
   * Lists all medications for the authenticated user, ordered by active desc then created desc.
   *
   * @param jwt the authenticated user's JWT
   * @return list of medication responses with decrypted fields
   */
  @Transactional(readOnly = true)
  public List<MedicationResponse> list(Jwt jwt) {
    String userHash = hashEmail(jwt);

    return medicationRepository.findByUserHashOrderByActiveDescCreatedAtDesc(userHash)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  /**
   * Retrieves a single medication by ID.
   *
   * @param jwt the authenticated user's JWT
   * @param id  the medication ID
   * @return the medication response with decrypted fields
   * @throws ResourceNotFoundException if the medication does not exist
   * @throws IllegalStateException     if the medication belongs to another user
   */
  @Transactional(readOnly = true)
  public MedicationResponse get(Jwt jwt, UUID id) {
    String userHash = hashEmail(jwt);

    Medication medication = medicationRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("medication.error.notFound"));

    verifyOwnership(medication, userHash);

    return toResponse(medication);
  }

  /**
   * Updates an existing medication with partial fields and recalculates linked reminders.
   *
   * @param jwt     the authenticated user's JWT
   * @param id      the medication ID
   * @param request the update request with nullable fields
   * @return the updated medication response with decrypted fields
   * @throws ResourceNotFoundException if the medication does not exist
   * @throws IllegalStateException     if the medication belongs to another user
   */
  @Transactional
  public MedicationResponse update(Jwt jwt, UUID id, UpdateMedicationRequest request) {
    String userHash = hashEmail(jwt);

    Medication medication = medicationRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("medication.error.notFound"));

    verifyOwnership(medication, userHash);

    // Apply non-null fields
    if (request.medicationType() != null) {
      medication.setMedicationType(request.medicationType());
    }
    if (request.name() != null) {
      medication.setNameEncrypted(encryptionService.encryptToBytes(request.name()));
    }
    if (request.dosage() != null) {
      medication.setDosageEncrypted(encryptOptional(request.dosage()));
    }
    if (request.startDate() != null) {
      medication.setStartDate(LocalDate.parse(request.startDate()));
    }
    if (request.endDate() != null) {
      medication.setEndDate(LocalDate.parse(request.endDate()));
    }
    if (request.frequency() != null) {
      medication.setFrequency(request.frequency());
    }
    if (request.reminderTime() != null) {
      medication.setReminderTime(request.reminderTime().isBlank()
          ? null : LocalTime.parse(request.reminderTime()));
    }
    if (request.notes() != null) {
      medication.setNotesEncrypted(encryptOptional(request.notes()));
    }
    if (request.active() != null) {
      medication.setActive(request.active());
    }

    medicationRepository.save(medication);
    log.info("Medication updated: {}", id);

    // Recalculate linked reminders if reminderTime changed
    if (request.reminderTime() != null) {
      updateLinkedReminders(userHash, medication);
    }

    return toResponse(medication);
  }

  /**
   * Deactivates a medication and its linked reminders.
   *
   * @param jwt the authenticated user's JWT
   * @param id  the medication ID
   * @throws ResourceNotFoundException if the medication does not exist
   * @throws IllegalStateException     if the medication belongs to another user
   */
  @Transactional
  public void deactivate(Jwt jwt, UUID id) {
    String userHash = hashEmail(jwt);

    Medication medication = medicationRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("medication.error.notFound"));

    verifyOwnership(medication, userHash);

    medication.setActive(false);
    medicationRepository.save(medication);
    log.info("Medication deactivated: {}", id);

    // Deactivate linked reminders
    List<Reminder> reminders =
        reminderRepository.findByReferenceIdAndActiveTrueAndCompletedAtIsNull(id);
    for (Reminder reminder : reminders) {
      reminder.setActive(false);
      reminderRepository.save(reminder);
    }
  }

  /**
   * Logs a dose for a medication.
   *
   * @param jwt          the authenticated user's JWT
   * @param medicationId the medication ID
   * @param request      the dose log request
   * @return the dose log entry response
   * @throws ResourceNotFoundException if the medication does not exist
   * @throws IllegalStateException     if the medication is inactive or not owned
   */
  @Transactional
  public DoseLogEntry logDose(Jwt jwt, UUID medicationId, LogDoseRequest request) {
    String userHash = hashEmail(jwt);

    Medication medication = medicationRepository.findById(medicationId)
        .orElseThrow(() -> new ResourceNotFoundException("medication.error.notFound"));

    verifyOwnership(medication, userHash);

    if (!Boolean.TRUE.equals(medication.getActive())) {
      throw new IllegalStateException("medication.error.inactive");
    }

    MedicationLog medLog = MedicationLog.builder()
        .medication(medication)
        .userHash(userHash)
        .scheduledFor(LocalDate.parse(request.scheduledFor()))
        .taken(request.taken())
        .notesEncrypted(encryptOptional(request.notes()))
        .build();

    MedicationLog saved = medicationLogRepository.save(medLog);
    log.info("Dose logged for medication {}: taken={}", medicationId, request.taken());

    return toDoseLogEntry(saved);
  }

  /**
   * Calculates medication adherence statistics for a given month.
   *
   * @param jwt          the authenticated user's JWT
   * @param medicationId the medication ID
   * @param month        the month in YYYY-MM format
   * @return the adherence response with rate calculation and logs
   * @throws ResourceNotFoundException if the medication does not exist
   * @throws IllegalStateException     if the medication is not owned by the user
   */
  @Transactional(readOnly = true)
  public MedicationAdherenceResponse getAdherence(Jwt jwt, UUID medicationId, String month) {
    String userHash = hashEmail(jwt);

    Medication medication = medicationRepository.findById(medicationId)
        .orElseThrow(() -> new ResourceNotFoundException("medication.error.notFound"));

    verifyOwnership(medication, userHash);

    YearMonth yearMonth = YearMonth.parse(month);
    LocalDate monthStart = yearMonth.atDay(1);
    LocalDate monthEnd = yearMonth.atEndOfMonth();

    // Cap the effective range by medication start/end dates
    LocalDate effectiveStart = medication.getStartDate().isAfter(monthStart)
        ? medication.getStartDate() : monthStart;
    LocalDate effectiveEnd = medication.getEndDate() != null
        && medication.getEndDate().isBefore(monthEnd)
        ? medication.getEndDate() : monthEnd;

    int totalDays = effectiveStart.isAfter(effectiveEnd)
        ? 0 : (int) (effectiveEnd.toEpochDay() - effectiveStart.toEpochDay()) + 1;

    long takenCount = medicationLogRepository
        .countByMedicationIdAndTakenTrueAndScheduledForBetween(
            medicationId, monthStart, monthEnd);

    long logCount = medicationLogRepository
        .countByMedicationIdAndScheduledForBetween(
            medicationId, monthStart, monthEnd);

    double adherenceRate = totalDays > 0 ? (double) takenCount / totalDays : 0.0;

    List<MedicationLog> logs = medicationLogRepository
        .findByMedicationIdAndScheduledForBetween(medicationId, monthStart, monthEnd);

    List<DoseLogEntry> logEntries = logs.stream()
        .map(this::toDoseLogEntry)
        .toList();

    return new MedicationAdherenceResponse(
        month, totalDays, (int) takenCount, (int) (logCount - takenCount),
        adherenceRate, logEntries);
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

  private String decryptOptional(byte[] encrypted) {
    if (encrypted == null) {
      return null;
    }
    return encryptionService.decryptFromBytes(encrypted);
  }

  private void verifyOwnership(Medication medication, String userHash) {
    if (!medication.getUserHash().equals(userHash)) {
      throw new IllegalStateException("medication.error.notOwner");
    }
  }

  private MedicationResponse toResponse(Medication medication) {
    return new MedicationResponse(
        medication.getId(),
        medication.getMedicationType(),
        decryptOptional(medication.getNameEncrypted()),
        decryptOptional(medication.getDosageEncrypted()),
        medication.getStartDate() != null ? medication.getStartDate().toString() : null,
        medication.getEndDate() != null ? medication.getEndDate().toString() : null,
        medication.getFrequency(),
        medication.getReminderTime() != null ? medication.getReminderTime().toString() : null,
        decryptOptional(medication.getNotesEncrypted()),
        Boolean.TRUE.equals(medication.getActive()),
        medication.getCreatedAt() != null ? medication.getCreatedAt().toString() : null,
        medication.getUpdatedAt() != null ? medication.getUpdatedAt().toString() : null
    );
  }

  private DoseLogEntry toDoseLogEntry(MedicationLog medLog) {
    return new DoseLogEntry(
        medLog.getId(),
        medLog.getScheduledFor() != null ? medLog.getScheduledFor().toString() : null,
        Boolean.TRUE.equals(medLog.getTaken()),
        medLog.getLoggedAt() != null ? medLog.getLoggedAt().toString() : null,
        decryptOptional(medLog.getNotesEncrypted())
    );
  }

  /**
   * Creates a linked reminder for a medication with a reminder time.
   */
  private void createLinkedReminder(String userHash, Medication medication) {
    String repeatRule = buildRepeatRule(medication.getFrequency());

    OffsetDateTime scheduledFor = medication.getStartDate()
        .atTime(medication.getReminderTime())
        .atOffset(ZoneOffset.UTC);

    Reminder reminder = Reminder.builder()
        .userHash(userHash)
        .reminderType("MEDICATION")
        .referenceId(medication.getId())
        .titleEncrypted(medication.getNameEncrypted())
        .scheduledFor(scheduledFor)
        .repeatRule(repeatRule)
        .active(true)
        .build();

    reminderRepository.save(reminder);
    log.info("Linked reminder created for medication {}", medication.getId());
  }

  /**
   * Updates linked reminders when medication reminder time or frequency changes.
   */
  private void updateLinkedReminders(String userHash, Medication medication) {
    List<Reminder> existingReminders =
        reminderRepository.findByReferenceIdAndActiveTrueAndCompletedAtIsNull(medication.getId());

    if (medication.getReminderTime() == null) {
      // Deactivate existing reminders if reminder time was cleared
      for (Reminder reminder : existingReminders) {
        reminder.setActive(false);
        reminderRepository.save(reminder);
      }
      return;
    }

    String repeatRule = buildRepeatRule(medication.getFrequency());
    OffsetDateTime scheduledFor = LocalDate.now()
        .atTime(medication.getReminderTime())
        .atOffset(ZoneOffset.UTC);

    if (existingReminders.isEmpty()) {
      // Create new reminder
      createLinkedReminder(userHash, medication);
    } else {
      // Update existing reminders
      for (Reminder reminder : existingReminders) {
        reminder.setScheduledFor(scheduledFor);
        reminder.setRepeatRule(repeatRule);
        reminder.setTitleEncrypted(medication.getNameEncrypted());
        reminderRepository.save(reminder);
      }
    }
  }

  /**
   * Builds a repeat rule string from a frequency key.
   * Uses the catalog configuration to derive the interval.
   */
  private String buildRepeatRule(String frequency) {
    if (catalogProperties.frequencies() == null
        || !catalogProperties.frequencies().containsKey(frequency)) {
      return "FREQ=" + frequency;
    }

    HealthCatalogProperties.FrequencyConfig config =
        catalogProperties.frequencies().get(frequency);

    if (config.hours() != null) {
      return "FREQ=HOURLY;INTERVAL=" + config.hours();
    } else if (config.days() != null) {
      return "FREQ=DAILY;INTERVAL=" + config.days();
    }

    return "FREQ=" + frequency;
  }
}
