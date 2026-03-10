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

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import app.navilla.dto.ConfirmLabRequest;
import app.navilla.dto.LabProviderDto;
import app.navilla.dto.VerifyLabRequest;
import app.navilla.lab.LabProviderProperties;
import app.navilla.lab.LabVerificationResult;
import app.navilla.security.EncryptionService;
import app.navilla.service.LabVerificationService;
import app.navilla.service.LabVerifyServiceResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for lab provider operations.
 *
 * <p>Provides endpoints for listing available lab providers,
 * initiating verification, and confirming results.
 *
 * @author Navilla Team
 * @since 2026-03-06
 */
@Slf4j
@RestController
@RequestMapping("/api/labs")
@RequiredArgsConstructor
public class LabProviderController {

  private final LabProviderProperties labProviderProperties;
  private final LabVerificationService labVerificationService;
  private final EncryptionService encryptionService;

  /**
   * Short-lived cache for verification results pending user confirmation.
   * Key: "userHash:visitId", Value: the verification result.
   */
  private final ConcurrentHashMap<String, LabVerificationResult> pendingResults =
      new ConcurrentHashMap<>();

  /**
   * Returns a list of enabled lab providers with their required fields.
   * This endpoint is public (no authentication required).
   *
   * @return list of enabled lab provider DTOs
   */
  @GetMapping("/providers")
  public ResponseEntity<List<LabProviderDto>> listProviders() {
    List<LabProviderDto> providers = labProviderProperties.providers().stream()
        .filter(LabProviderProperties.LabConfig::enabled)
        .map(LabProviderDto::from)
        .toList();
    return ResponseEntity.ok(providers);
  }

  /**
   * Initiates lab verification for a test visit.
   * Calls the lab provider and caches results for the confirm step.
   *
   * @param jwt     the authenticated user's JWT
   * @param request the verification request
   * @return verification result with lab data or error
   */
  @PostMapping("/verify")
  public ResponseEntity<Map<String, Object>> verifyLab(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody VerifyLabRequest request) {

    // Validate: either visitId or testDate must be provided
    if (request.visitId() == null && request.testDate() == null) {
      return ResponseEntity.badRequest().body(Map.of(
          "success", false,
          "errorCode", "INVALID_REQUEST",
          "errorMessage", "Either visitId or testDate must be provided"));
    }

    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));

    // Parse testDate if provided
    LocalDate parsedDate = null;
    if (request.testDate() != null) {
      try {
        parsedDate = LocalDate.parse(request.testDate());
      } catch (DateTimeParseException e) {
        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "errorCode", "INVALID_REQUEST",
            "errorMessage", "Invalid test date format"));
      }
    }

    try {
      LabVerifyServiceResponse response = labVerificationService.verify(
          userHash, request.visitId(), parsedDate, request.labCode(),
          request.visitCredentials(), request.labCredentials());

      UUID resolvedVisitId = response.visitId();
      LabVerificationResult result = response.result();

      if (result.success()) {
        // Cache for the confirm step using resolved visitId
        String cacheKey = userHash + ":" + resolvedVisitId;
        pendingResults.put(cacheKey, result);
        log.info("Lab verification successful, cached for confirmation: {}", resolvedVisitId);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "visitId", resolvedVisitId.toString(),
            "results", result.results()));
      } else {
        // Return 200 with success=false so frontend can read error details
        return ResponseEntity.ok(Map.of(
            "success", false,
            "errorCode", result.errorCode(),
            "errorMessage", result.errorMessage()));
      }
    } catch (IllegalArgumentException e) {
      return ResponseEntity.ok(Map.of(
          "success", false,
          "errorCode", "INVALID_REQUEST",
          "errorMessage", e.getMessage()));
    }
  }

  /**
   * Confirms lab verification results and saves them.
   * Retrieves cached results from the verify step.
   *
   * @param jwt     the authenticated user's JWT
   * @param request the confirmation request
   * @return success or error response
   */
  @PostMapping("/confirm")
  public ResponseEntity<Map<String, Object>> confirmLab(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody ConfirmLabRequest request) {

    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    String cacheKey = userHash + ":" + request.visitId();

    LabVerificationResult cached = pendingResults.remove(cacheKey);
    if (cached == null) {
      return ResponseEntity.badRequest().body(Map.of(
          "success", false,
          "errorCode", "NO_PENDING_VERIFICATION",
          "errorMessage", "No pending verification found. Please verify first."));
    }

    try {
      labVerificationService.confirm(
          userHash, request.visitId(), cached.results(), cached.rawResponse(), request.notes());

      log.info("Lab verification confirmed and saved: {}", request.visitId());
      return ResponseEntity.ok(Map.of("success", true));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of(
          "success", false,
          "errorCode", "CONFIRM_ERROR",
          "errorMessage", e.getMessage()));
    }
  }
}
