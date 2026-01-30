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

import java.time.Instant;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check controller for the Navilla API.
 *
 * <p>Provides endpoints for:
 * <ul>
 *   <li>Basic health check (public, for load balancers)</li>
 *   <li>Authenticated health check (for verifying JWT configuration)</li>
 * </ul>
 *
 * @author Navilla Team
 * @since 2026-01-30
 */
@RestController
public class HealthController {

  @Value("${spring.application.name:navilla-backend}")
  private String applicationName;

  @Value("${navilla.version:1.0.0}")
  private String version;

  /**
   * Public health check endpoint.
   *
   * <p>This endpoint is accessible without authentication and is used by
   * load balancers and monitoring systems to verify the service is running.
   *
   * @return health status with timestamp
   */
  @GetMapping("/api/health")
  public ResponseEntity<Map<String, Object>> health() {
    return ResponseEntity.ok(Map.of(
        "status", "UP",
        "service", applicationName,
        "version", version,
        "timestamp", Instant.now().toString()
    ));
  }

  /**
   * Authenticated health check endpoint.
   *
   * <p>This endpoint requires a valid JWT token. It's useful for verifying
   * that the authentication configuration is working correctly.
   *
   * @return health status with authentication confirmation
   */
  @GetMapping("/api/auth/health")
  public ResponseEntity<Map<String, Object>> authenticatedHealth() {
    return ResponseEntity.ok(Map.of(
        "status", "UP",
        "authenticated", true,
        "service", applicationName,
        "version", version,
        "timestamp", Instant.now().toString()
    ));
  }
}
