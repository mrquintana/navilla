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

package app.navilla.controller;

import java.util.List;
import java.util.UUID;

import app.navilla.dto.CreateMedicationRequest;
import app.navilla.dto.DoseLogEntry;
import app.navilla.dto.LogDoseRequest;
import app.navilla.dto.MedicationAdherenceResponse;
import app.navilla.dto.MedicationResponse;
import app.navilla.dto.UpdateMedicationRequest;
import app.navilla.service.MedicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for medication tracking operations.
 *
 * <p>Provides CRUD endpoints for medications, dose logging, and adherence
 * statistics. All endpoints require JWT authentication and operate on
 * the authenticated user's data.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@RestController
@RequestMapping("/api/medications")
@RequiredArgsConstructor
public class MedicationController {

  private final MedicationService medicationService;

  /**
   * Lists all medications for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return list of medication responses
   */
  @GetMapping
  public ResponseEntity<List<MedicationResponse>> list(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(medicationService.list(jwt));
  }

  /**
   * Creates a new medication.
   *
   * @param jwt     the JWT token containing user info
   * @param request the create request with medication details
   * @return the created medication response
   */
  @PostMapping
  public ResponseEntity<MedicationResponse> create(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody CreateMedicationRequest request) {
    return ResponseEntity.ok(medicationService.create(jwt, request));
  }

  /**
   * Retrieves a single medication by ID.
   *
   * @param jwt the JWT token containing user info
   * @param id  the medication ID
   * @return the medication response
   */
  @GetMapping("/{id}")
  public ResponseEntity<MedicationResponse> get(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    return ResponseEntity.ok(medicationService.get(jwt, id));
  }

  /**
   * Updates an existing medication.
   *
   * @param jwt     the JWT token containing user info
   * @param id      the medication ID
   * @param request the update request with new medication details
   * @return the updated medication response
   */
  @PutMapping("/{id}")
  public ResponseEntity<MedicationResponse> update(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateMedicationRequest request) {
    return ResponseEntity.ok(medicationService.update(jwt, id, request));
  }

  /**
   * Deactivates a medication.
   *
   * @param jwt the JWT token containing user info
   * @param id  the medication ID
   * @return 204 No Content on success
   */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deactivate(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    medicationService.deactivate(jwt, id);
    return ResponseEntity.noContent().build();
  }

  /**
   * Logs a dose for a medication.
   *
   * @param jwt     the JWT token containing user info
   * @param id      the medication ID
   * @param request the dose log request
   * @return the dose log entry response
   */
  @PostMapping("/{id}/log")
  public ResponseEntity<DoseLogEntry> logDose(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @Valid @RequestBody LogDoseRequest request) {
    return ResponseEntity.ok(medicationService.logDose(jwt, id, request));
  }

  /**
   * Returns adherence statistics for a medication over a given month.
   *
   * @param jwt   the JWT token containing user info
   * @param id    the medication ID
   * @param month the month in YYYY-MM format
   * @return the adherence response
   */
  @GetMapping("/{id}/adherence")
  public ResponseEntity<MedicationAdherenceResponse> getAdherence(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @RequestParam String month) {
    return ResponseEntity.ok(medicationService.getAdherence(jwt, id, month));
  }
}
