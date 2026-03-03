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
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import app.navilla.config.HealthCatalogProperties;
import app.navilla.config.HealthCatalogProperties.VaccineSeriesConfig;
import app.navilla.dto.CreateVaccinationRequest;
import app.navilla.dto.UpdateVaccinationRequest;
import app.navilla.dto.VaccinationResponse;
import app.navilla.dto.VaccineSeriesResponse;
import app.navilla.entity.Reminder;
import app.navilla.entity.Vaccination;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.ReminderRepository;
import app.navilla.repository.VaccinationRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing vaccination series tracking, dose recording, and auto-reminders.
 *
 * <p>Handles creation, retrieval, update, and deletion of vaccination doses.
 * Sensitive fields (location, notes) are encrypted at rest. When a dose is recorded
 * for an incomplete series, a next-dose reminder is automatically created based on
 * the catalog-defined dose intervals.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VaccinationService {

  private final VaccinationRepository vaccinationRepository;
  private final ReminderRepository reminderRepository;
  private final EncryptionService encryptionService;
  private final HealthCatalogProperties catalogProperties;

  /**
   * Records a vaccination dose with encrypted fields and auto-creates a next-dose reminder
   * if the series is incomplete.
   *
   * @param jwt     the authenticated user's JWT
   * @param request the create request with dose details
   * @return the created vaccination response with decrypted fields
   * @throws IllegalArgumentException if the vaccine type is not in the catalog
   */
  @Transactional
  public VaccinationResponse create(Jwt jwt, CreateVaccinationRequest request) {
    String userHash = hashEmail(jwt);

    // Validate vaccine type against catalog
    Map<String, VaccineSeriesConfig> series = catalogProperties.vaccineSeries();
    if (!series.containsKey(request.vaccineType())) {
      throw new IllegalArgumentException("vaccination.error.invalidType");
    }

    VaccineSeriesConfig config = series.get(request.vaccineType());

    Vaccination vaccination = Vaccination.builder()
        .userHash(userHash)
        .vaccineType(request.vaccineType())
        .doseNumber(request.doseNumber())
        .totalDoses(config.totalDoses())
        .administeredDate(LocalDate.parse(request.administeredDate()))
        .locationEncrypted(encryptOptional(request.location()))
        .notesEncrypted(encryptOptional(request.notes()))
        .build();

    Vaccination saved = vaccinationRepository.save(vaccination);
    log.info("Vaccination dose created: {} (type={}, dose {}/{})",
        saved.getId(), saved.getVaccineType(), saved.getDoseNumber(), saved.getTotalDoses());

    // Create next-dose reminder if series is incomplete
    if (saved.getDoseNumber() < config.totalDoses()) {
      createNextDoseReminder(userHash, saved, config);
    }

    return toResponse(saved);
  }

  /**
   * Lists all vaccination series for the authenticated user, grouped by vaccine type
   * with completion status and next-dose calculations.
   *
   * @param jwt the authenticated user's JWT
   * @return list of vaccine series responses
   */
  @Transactional(readOnly = true)
  public List<VaccineSeriesResponse> listSeries(Jwt jwt) {
    String userHash = hashEmail(jwt);

    List<Vaccination> allDoses =
        vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(userHash);

    Map<String, VaccineSeriesConfig> seriesConfigs = catalogProperties.vaccineSeries();

    // Group by vaccine type preserving order
    Map<String, List<Vaccination>> grouped = new LinkedHashMap<>();
    for (Vaccination dose : allDoses) {
      grouped.computeIfAbsent(dose.getVaccineType(), k -> new ArrayList<>()).add(dose);
    }

    List<VaccineSeriesResponse> result = new ArrayList<>();
    for (Map.Entry<String, List<Vaccination>> entry : grouped.entrySet()) {
      String vaccineType = entry.getKey();
      List<Vaccination> doses = entry.getValue();

      VaccineSeriesConfig config = seriesConfigs.get(vaccineType);
      String labelKey = config != null ? config.labelKey() : vaccineType;
      int totalDoses = config != null ? config.totalDoses() : doses.getFirst().getTotalDoses();

      int completedDoses = doses.size();
      boolean complete = completedDoses >= totalDoses;

      String nextDoseDate = null;
      if (!complete && config != null) {
        // Find the last dose by dose number (list is sorted by doseNumber ascending)
        Vaccination lastDose = doses.getLast();
        int nextDoseIndex = lastDose.getDoseNumber();
        if (nextDoseIndex < config.doseIntervalsDays().size()) {
          int intervalDays = config.doseIntervalsDays().get(nextDoseIndex);
          LocalDate next = lastDose.getAdministeredDate().plusDays(intervalDays);
          nextDoseDate = next.toString();
        }
      }

      List<VaccinationResponse> doseResponses = doses.stream()
          .map(this::toResponse)
          .toList();

      result.add(new VaccineSeriesResponse(
          vaccineType, labelKey, totalDoses, completedDoses,
          complete, nextDoseDate, doseResponses));
    }

    return result;
  }

  /**
   * Updates an existing vaccination dose with partial fields and recalculates reminders.
   *
   * @param jwt     the authenticated user's JWT
   * @param id      the vaccination dose ID
   * @param request the update request with nullable fields
   * @return the updated vaccination response with decrypted fields
   * @throws ResourceNotFoundException if the vaccination does not exist
   * @throws IllegalStateException     if the vaccination belongs to another user
   */
  @Transactional
  public VaccinationResponse update(Jwt jwt, UUID id, UpdateVaccinationRequest request) {
    String userHash = hashEmail(jwt);

    Vaccination vaccination = vaccinationRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("vaccination.error.notFound"));

    verifyOwnership(vaccination, userHash);

    // Apply non-null fields
    if (request.vaccineType() != null) {
      vaccination.setVaccineType(request.vaccineType());
    }
    if (request.doseNumber() != null) {
      vaccination.setDoseNumber(request.doseNumber());
    }
    if (request.administeredDate() != null) {
      vaccination.setAdministeredDate(LocalDate.parse(request.administeredDate()));
    }
    if (request.location() != null) {
      vaccination.setLocationEncrypted(encryptOptional(request.location()));
    }
    if (request.notes() != null) {
      vaccination.setNotesEncrypted(encryptOptional(request.notes()));
    }

    vaccinationRepository.save(vaccination);
    log.info("Vaccination dose updated: {}", id);

    // Delete old reminders and recalculate
    reminderRepository.deleteByReferenceId(id);

    Map<String, VaccineSeriesConfig> series = catalogProperties.vaccineSeries();
    VaccineSeriesConfig config = series.get(vaccination.getVaccineType());
    if (config != null && vaccination.getDoseNumber() < config.totalDoses()) {
      createNextDoseReminder(userHash, vaccination, config);
    }

    return toResponse(vaccination);
  }

  /**
   * Deletes a vaccination dose and cleans up any linked reminders.
   *
   * @param jwt the authenticated user's JWT
   * @param id  the vaccination dose ID
   * @throws ResourceNotFoundException if the vaccination does not exist
   * @throws IllegalStateException     if the vaccination belongs to another user
   */
  @Transactional
  public void delete(Jwt jwt, UUID id) {
    String userHash = hashEmail(jwt);

    Vaccination vaccination = vaccinationRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("vaccination.error.notFound"));

    verifyOwnership(vaccination, userHash);

    vaccinationRepository.delete(vaccination);
    reminderRepository.deleteByReferenceId(id);
    log.info("Vaccination dose deleted: {}", id);
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

  private void verifyOwnership(Vaccination vaccination, String userHash) {
    if (!vaccination.getUserHash().equals(userHash)) {
      throw new IllegalStateException("vaccination.error.notOwner");
    }
  }

  private VaccinationResponse toResponse(Vaccination vaccination) {
    return new VaccinationResponse(
        vaccination.getId(),
        vaccination.getVaccineType(),
        vaccination.getDoseNumber(),
        vaccination.getTotalDoses(),
        vaccination.getAdministeredDate() != null
            ? vaccination.getAdministeredDate().toString() : null,
        decryptOptional(vaccination.getLocationEncrypted()),
        decryptOptional(vaccination.getNotesEncrypted()),
        vaccination.getCreatedAt() != null ? vaccination.getCreatedAt().toString() : null
    );
  }

  /**
   * Creates a next-dose reminder for an incomplete vaccination series.
   * The scheduled date is computed as: administeredDate + doseIntervalsDays[doseNumber].
   */
  private void createNextDoseReminder(String userHash, Vaccination vaccination,
                                      VaccineSeriesConfig config) {
    int currentDose = vaccination.getDoseNumber();
    List<Integer> intervals = config.doseIntervalsDays();

    if (currentDose >= intervals.size()) {
      return;
    }

    int intervalDays = intervals.get(currentDose);
    LocalDate nextDoseDate = vaccination.getAdministeredDate().plusDays(intervalDays);

    int nextDoseNumber = currentDose + 1;
    String title = vaccination.getVaccineType() + " Dose " + nextDoseNumber;

    OffsetDateTime scheduledFor = nextDoseDate.atTime(LocalTime.of(9, 0))
        .atOffset(ZoneOffset.UTC);

    Reminder reminder = Reminder.builder()
        .userHash(userHash)
        .reminderType("VACCINATION")
        .referenceId(vaccination.getId())
        .titleEncrypted(encryptionService.encryptToBytes(title))
        .scheduledFor(scheduledFor)
        .active(true)
        .build();

    reminderRepository.save(reminder);
    log.info("Next-dose reminder created for vaccination {} (dose {} on {})",
        vaccination.getId(), nextDoseNumber, nextDoseDate);
  }
}
