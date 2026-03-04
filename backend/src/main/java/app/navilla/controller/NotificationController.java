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

import app.navilla.dto.NotificationResponse;
import app.navilla.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

  private final NotificationService notificationService;

  @GetMapping
  public ResponseEntity<List<NotificationResponse>> listNotifications(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(notificationService.listNotifications(jwt));
  }

  @PostMapping("/{id}/read")
  public ResponseEntity<Void> markRead(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    notificationService.markRead(jwt, id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/read-all")
  public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal Jwt jwt) {
    notificationService.markAllRead(jwt);
    return ResponseEntity.noContent().build();
  }
}
