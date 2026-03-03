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

import app.navilla.dto.CreateVaccinationRequest;
import app.navilla.dto.UpdateVaccinationRequest;
import app.navilla.dto.VaccinationResponse;
import app.navilla.dto.VaccineSeriesResponse;
import app.navilla.service.VaccinationService;
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
 * REST controller for vaccination tracking operations.
 *
 * <p>Provides endpoints for recording vaccination doses, listing vaccine series
 * with completion status, updating dose records, and deleting doses. All
 * endpoints require JWT authentication and operate on the authenticated
 * user's data.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@RestController
@RequestMapping("/api/vaccinations")
@RequiredArgsConstructor
public class VaccinationController {

  private final VaccinationService vaccinationService;

  /**
   * Lists all vaccination series for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return list of vaccine series responses grouped by type
   */
  @GetMapping
  public ResponseEntity<List<VaccineSeriesResponse>> listSeries(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(vaccinationService.listSeries(jwt));
  }

  /**
   * Records a new vaccination dose.
   *
   * @param jwt     the JWT token containing user info
   * @param request the create request with dose details
   * @return the created vaccination response
   */
  @PostMapping
  public ResponseEntity<VaccinationResponse> create(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody CreateVaccinationRequest request) {
    return ResponseEntity.ok(vaccinationService.create(jwt, request));
  }

  /**
   * Updates an existing vaccination dose.
   *
   * @param jwt     the JWT token containing user info
   * @param id      the vaccination dose ID
   * @param request the update request with new dose details
   * @return the updated vaccination response
   */
  @PutMapping("/{id}")
  public ResponseEntity<VaccinationResponse> update(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateVaccinationRequest request) {
    return ResponseEntity.ok(vaccinationService.update(jwt, id, request));
  }

  /**
   * Deletes a vaccination dose record.
   *
   * @param jwt the JWT token containing user info
   * @param id  the vaccination dose ID
   * @return 204 No Content on success
   */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    vaccinationService.delete(jwt, id);
    return ResponseEntity.noContent().build();
  }
}
