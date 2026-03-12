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

import app.navilla.dto.NetworkHealthResponse;
import app.navilla.service.NetworkHealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for network health statistics.
 *
 * <p>Exposes aggregated, privacy-preserving network health data
 * for authenticated users who have opted in to reciprocity.
 *
 * @author Navilla Team
 * @since 2026-03-12
 */
@RestController
@RequestMapping("/api/network-health")
public class NetworkHealthController {

  private final NetworkHealthService networkHealthService;

  public NetworkHealthController(NetworkHealthService networkHealthService) {
    this.networkHealthService = networkHealthService;
  }

  /**
   * Returns network health stats for the authenticated user.
   *
   * @param jwt the authenticated user's JWT token
   * @return 200 with stats, or 204 if user has not opted in to reciprocity
   */
  @GetMapping
  public ResponseEntity<NetworkHealthResponse> getNetworkHealth(
      @AuthenticationPrincipal Jwt jwt) {
    NetworkHealthResponse response = networkHealthService.getNetworkHealth(jwt);
    if (response == null) {
      return ResponseEntity.noContent().build();
    }
    return ResponseEntity.ok(response);
  }
}
