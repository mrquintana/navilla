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

import app.navilla.dto.ReminderResponse;
import app.navilla.dto.ReminderSettingsResponse;
import app.navilla.dto.SnoozeReminderRequest;
import app.navilla.dto.UpdateReminderSettingsRequest;
import app.navilla.service.ReminderService;
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
 * REST controller for reminder management operations.
 *
 * <p>Provides endpoints for listing, snoozing, completing, toggling, and
 * deleting reminders, as well as managing per-user reminder settings
 * (quiet hours, digest preferences, category toggles). All endpoints
 * require JWT authentication.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

  private final ReminderService reminderService;

  /**
   * Lists all active, incomplete reminders for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return list of reminder responses
   */
  @GetMapping
  public ResponseEntity<List<ReminderResponse>> list(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(reminderService.list(jwt));
  }

  /**
   * Returns reminders due within the given number of days.
   *
   * @param jwt  the JWT token containing user info
   * @param days the number of days ahead to look (default 7)
   * @return list of upcoming reminder responses
   */
  @GetMapping("/upcoming")
  public ResponseEntity<List<ReminderResponse>> getUpcoming(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(defaultValue = "7") int days) {
    return ResponseEntity.ok(reminderService.getUpcoming(jwt, days));
  }

  /**
   * Snoozes a reminder until the specified time.
   *
   * @param jwt     the JWT token containing user info
   * @param id      the reminder ID
   * @param request the snooze request with until datetime
   * @return the updated reminder response
   */
  @PostMapping("/{id}/snooze")
  public ResponseEntity<ReminderResponse> snooze(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @Valid @RequestBody SnoozeReminderRequest request) {
    return ResponseEntity.ok(reminderService.snooze(jwt, id, request));
  }

  /**
   * Marks a reminder as completed.
   *
   * @param jwt the JWT token containing user info
   * @param id  the reminder ID
   * @return the updated reminder response
   */
  @PostMapping("/{id}/complete")
  public ResponseEntity<ReminderResponse> complete(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    return ResponseEntity.ok(reminderService.complete(jwt, id));
  }

  /**
   * Toggles the active flag on a reminder.
   *
   * @param jwt the JWT token containing user info
   * @param id  the reminder ID
   * @return the updated reminder response
   */
  @PostMapping("/{id}/toggle")
  public ResponseEntity<ReminderResponse> toggle(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    return ResponseEntity.ok(reminderService.toggle(jwt, id));
  }

  /**
   * Deletes a reminder.
   *
   * @param jwt the JWT token containing user info
   * @param id  the reminder ID
   * @return 204 No Content on success
   */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    reminderService.delete(jwt, id);
    return ResponseEntity.noContent().build();
  }

  /**
   * Returns the reminder settings for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return the reminder settings response
   */
  @GetMapping("/settings")
  public ResponseEntity<ReminderSettingsResponse> getSettings(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(reminderService.getSettings(jwt));
  }

  /**
   * Updates the reminder settings for the authenticated user.
   *
   * @param jwt     the JWT token containing user info
   * @param request the update request with nullable fields
   * @return the updated reminder settings response
   */
  @PutMapping("/settings")
  public ResponseEntity<ReminderSettingsResponse> updateSettings(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody UpdateReminderSettingsRequest request) {
    return ResponseEntity.ok(reminderService.updateSettings(jwt, request));
  }
}
