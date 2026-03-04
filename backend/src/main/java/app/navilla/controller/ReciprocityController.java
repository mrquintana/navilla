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

import app.navilla.dto.ReciprocityStatusResponse;
import app.navilla.service.ReciprocityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for the reciprocity (exposure network) opt-in/opt-out lifecycle.
 *
 * <p>All endpoints require authentication. Users can check their status,
 * opt in, or opt out of the exposure matching network.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@RestController
@RequestMapping("/api/reciprocity")
@RequiredArgsConstructor
public class ReciprocityController {

  private final ReciprocityService reciprocityService;

  /**
   * Returns the current reciprocity status for the authenticated user.
   *
   * @param jwt the authenticated user's JWT
   * @return the reciprocity status
   */
  @GetMapping("/status")
  public ResponseEntity<ReciprocityStatusResponse> getStatus(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(reciprocityService.getStatus(jwt));
  }

  /**
   * Opts the user into the exposure network.
   *
   * @param jwt the authenticated user's JWT
   * @return the updated reciprocity status
   */
  @PostMapping("/opt-in")
  public ResponseEntity<ReciprocityStatusResponse> optIn(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(reciprocityService.optIn(jwt));
  }

  /**
   * Opts the user out of the exposure network.
   *
   * @param jwt the authenticated user's JWT
   * @return the updated reciprocity status
   */
  @PostMapping("/opt-out")
  public ResponseEntity<ReciprocityStatusResponse> optOut(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(reciprocityService.optOut(jwt));
  }
}
