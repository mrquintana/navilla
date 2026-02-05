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

import app.navilla.dto.ClearHealthStatusRequest;
import app.navilla.dto.HealthStatusRequest;
import app.navilla.dto.HealthStatusResponse;
import app.navilla.service.HealthStatusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health-status")
@RequiredArgsConstructor
public class HealthStatusController {

  private final HealthStatusService healthStatusService;

  @GetMapping
  public ResponseEntity<List<HealthStatusResponse>> listMyStatuses(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(healthStatusService.listMyStatuses(jwt));
  }

  @PostMapping
  public ResponseEntity<HealthStatusResponse> reportStatus(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody HealthStatusRequest request) {
    return ResponseEntity.ok(healthStatusService.reportStatus(jwt, request));
  }

  @PostMapping("/{id}/clear")
  public ResponseEntity<HealthStatusResponse> clearStatus(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @Valid @RequestBody(required = false) ClearHealthStatusRequest request) {
    return ResponseEntity.ok(healthStatusService.clearStatus(jwt, id, request));
  }

  /**
   * Reactivates a cleared health status record.
   *
   * @param jwt the JWT token containing user info
   * @param id the health status record id
   * @return the updated health status record
   */
  @PostMapping("/{id}/activate")
  public ResponseEntity<HealthStatusResponse> activateStatus(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    return ResponseEntity.ok(healthStatusService.activateStatus(jwt, id));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteStatus(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    healthStatusService.deleteStatus(jwt, id);
    return ResponseEntity.noContent().build();
  }
}
