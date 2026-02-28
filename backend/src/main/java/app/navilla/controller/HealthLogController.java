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

import app.navilla.dto.ConditionHistoryResponse;
import app.navilla.dto.CreateLabRequest;
import app.navilla.dto.CreateTestVisitRequest;
import app.navilla.dto.HealthLogSummaryResponse;
import app.navilla.dto.LabResponse;
import app.navilla.dto.TestVisitResponse;
import app.navilla.dto.UpdateLabRequest;
import app.navilla.dto.UpdateTestVisitRequest;
import app.navilla.service.HealthLogService;
import app.navilla.service.LabService;
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
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for health log operations.
 *
 * <p>Provides CRUD endpoints for test visits, labs, health log summaries,
 * and condition histories. All endpoints require JWT authentication and
 * operate on the authenticated user's data.
 *
 * @author Navilla Team
 * @since 2026-02-27
 */
@RestController
@RequestMapping("/api/health-log")
@RequiredArgsConstructor
public class HealthLogController {

  private final HealthLogService healthLogService;
  private final LabService labService;

  // ---- Visits ----

  /**
   * Lists all test visits for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return list of test visit responses
   */
  @GetMapping("/visits")
  public ResponseEntity<List<TestVisitResponse>> listVisits(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(healthLogService.listVisits(jwt));
  }

  /**
   * Creates a new test visit with results.
   *
   * @param jwt     the JWT token containing user info
   * @param request the create request with visit details and results
   * @return the created test visit response
   */
  @PostMapping("/visits")
  public ResponseEntity<TestVisitResponse> createVisit(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody CreateTestVisitRequest request) {
    return ResponseEntity.ok(healthLogService.createVisit(jwt, request));
  }

  /**
   * Retrieves a single test visit by ID.
   *
   * @param jwt the JWT token containing user info
   * @param id  the visit ID
   * @return the test visit response
   */
  @GetMapping("/visits/{id}")
  public ResponseEntity<TestVisitResponse> getVisit(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    return ResponseEntity.ok(healthLogService.getVisit(jwt, id));
  }

  /**
   * Updates an existing test visit.
   *
   * @param jwt     the JWT token containing user info
   * @param id      the visit ID
   * @param request the update request with new visit details
   * @return the updated test visit response
   */
  @PutMapping("/visits/{id}")
  public ResponseEntity<TestVisitResponse> updateVisit(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateTestVisitRequest request) {
    return ResponseEntity.ok(healthLogService.updateVisit(jwt, id, request));
  }

  /**
   * Deletes a test visit.
   *
   * @param jwt the JWT token containing user info
   * @param id  the visit ID
   * @return 204 No Content on success
   */
  @DeleteMapping("/visits/{id}")
  public ResponseEntity<Void> deleteVisit(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    healthLogService.deleteVisit(jwt, id);
    return ResponseEntity.noContent().build();
  }

  // ---- Summary & Condition History ----

  /**
   * Returns the health log summary for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return the health log summary response
   */
  @GetMapping("/summary")
  public ResponseEntity<HealthLogSummaryResponse> getSummary(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(healthLogService.getSummary(jwt));
  }

  /**
   * Returns the testing history for a specific condition type.
   *
   * @param jwt  the JWT token containing user info
   * @param type the condition type identifier
   * @return the condition history response
   */
  @GetMapping("/condition/{type}")
  public ResponseEntity<ConditionHistoryResponse> getConditionHistory(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String type) {
    return ResponseEntity.ok(healthLogService.getConditionHistory(jwt, type));
  }

  // ---- Labs ----

  /**
   * Lists all lab connections for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return list of lab responses
   */
  @GetMapping("/labs")
  public ResponseEntity<List<LabResponse>> listLabs(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(labService.listLabs(jwt));
  }

  /**
   * Creates a new lab connection.
   *
   * @param jwt     the JWT token containing user info
   * @param request the create request with provider and name
   * @return the created lab response
   */
  @PostMapping("/labs")
  public ResponseEntity<LabResponse> createLab(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody CreateLabRequest request) {
    return ResponseEntity.ok(labService.createLab(jwt, request));
  }

  /**
   * Updates an existing lab connection.
   *
   * @param jwt     the JWT token containing user info
   * @param id      the lab ID
   * @param request the update request with new lab details
   * @return the updated lab response
   */
  @PutMapping("/labs/{id}")
  public ResponseEntity<LabResponse> updateLab(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateLabRequest request) {
    return ResponseEntity.ok(labService.updateLab(jwt, id, request));
  }

  /**
   * Deletes a lab connection.
   *
   * @param jwt the JWT token containing user info
   * @param id  the lab ID
   * @return 204 No Content on success
   */
  @DeleteMapping("/labs/{id}")
  public ResponseEntity<Void> deleteLab(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    labService.deleteLab(jwt, id);
    return ResponseEntity.noContent().build();
  }
}
