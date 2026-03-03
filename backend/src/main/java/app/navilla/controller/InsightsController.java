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

import app.navilla.dto.InsightsResponse;
import app.navilla.service.InsightsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for personal insights aggregation.
 *
 * <p>Provides a single endpoint that aggregates activity, testing,
 * and prevention data for the authenticated user's insights dashboard.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class InsightsController {

  private final InsightsService insightsService;

  /**
   * Returns aggregated insights data for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return the insights response with activity, testing, and prevention summaries
   */
  @GetMapping
  public ResponseEntity<InsightsResponse> getInsights(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(insightsService.getInsights(jwt));
  }
}
