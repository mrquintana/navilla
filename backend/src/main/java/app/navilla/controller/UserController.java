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

import app.navilla.dto.UpdateProfileRequest;
import app.navilla.dto.UserResponse;
import app.navilla.dto.UserSearchResult;
import app.navilla.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for user profile operations.
 *
 * <p>All endpoints require authentication via Supabase JWT.
 * Implements lazy sync: users are automatically created on first API access.
 *
 * @author Navilla Team
 * @since 2026-01-30
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  /**
   * Gets the current authenticated user's profile.
   *
   * <p>If the user doesn't exist in our database, they are automatically
   * created using information from their JWT token (lazy sync).
   *
   * @param jwt the JWT token containing user information
   * @return the user's profile
   */
  @GetMapping("/me")
  public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
    UserResponse user = userService.getOrCreateCurrentUser(jwt);
    return ResponseEntity.ok(user);
  }

  /**
   * Searches for a public user profile by email or username.
   *
   * @param q the email or username
   * @return public profile info or null if not found/visible
   */
  @GetMapping("/search")
  public ResponseEntity<UserSearchResult> searchPublicUser(
      @RequestParam("q") String q) {
    return ResponseEntity.ok(userService.searchPublicUser(q));
  }

  /**
   * Updates the current authenticated user's profile.
   *
   * @param jwt the JWT token containing the user ID
   * @param request the profile update request
   * @return the updated user profile
   */
  @PutMapping("/me")
  public ResponseEntity<UserResponse> updateProfile(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody UpdateProfileRequest request) {

    UserResponse user = userService.updateProfile(jwt, request);
    return ResponseEntity.ok(user);
  }

  /**
   * Deletes the current authenticated user's account.
   *
   * <p>This is a soft delete that removes the user from the application
   * but preserves anonymized connection data for partner statistics.
   *
   * @param jwt the JWT token containing the user ID
   * @return 204 No Content on success
   */
  @DeleteMapping("/me")
  public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal Jwt jwt) {
    userService.deleteUser(jwt);
    return ResponseEntity.noContent().build();
  }
}
