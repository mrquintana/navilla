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
import java.util.Map;
import java.util.UUID;

import app.navilla.config.PushProperties;
import app.navilla.dto.PushSubscriptionRequest;
import app.navilla.dto.PushSubscriptionResponse;
import app.navilla.service.PushSubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

/**
 * REST controller for managing web push notification subscriptions.
 *
 * <p>Provides endpoints to subscribe, unsubscribe, and list push
 * subscriptions for the authenticated user.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushSubscriptionController {

  private final PushSubscriptionService pushSubscriptionService;
  private final PushProperties pushProperties;

  /**
   * Registers a new push subscription for the authenticated user.
   *
   * @param jwt the JWT token
   * @param request the push subscription data
   * @return the created subscription (201 Created)
   */
  @PostMapping("/subscribe")
  public ResponseEntity<PushSubscriptionResponse> subscribe(
      @AuthenticationPrincipal Jwt jwt,
      @RequestBody @Valid PushSubscriptionRequest request) {
    PushSubscriptionResponse response = pushSubscriptionService.subscribe(jwt, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  /**
   * Removes a push subscription for the authenticated user.
   *
   * @param jwt the JWT token
   * @param id the subscription id to remove
   * @return 204 No Content
   */
  @DeleteMapping("/subscriptions/{id}")
  public ResponseEntity<Void> unsubscribe(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    pushSubscriptionService.unsubscribe(jwt, id);
    return ResponseEntity.noContent().build();
  }

  /**
   * Lists all push subscriptions for the authenticated user.
   *
   * @param jwt the JWT token
   * @return list of subscription responses (200 OK)
   */
  @GetMapping("/subscriptions")
  public ResponseEntity<List<PushSubscriptionResponse>> listSubscriptions(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(pushSubscriptionService.listForUser(jwt));
  }

  /**
   * Returns the VAPID public key for client-side push subscription registration.
   *
   * <p>This endpoint is <strong>public</strong> (no authentication required)
   * because the client needs the VAPID public key before the user is authenticated,
   * e.g. to call {@code PushManager.subscribe()} in the service worker.
   *
   * @return the VAPID public key as a JSON object (200 OK)
   */
  @GetMapping("/vapid-public-key")
  public ResponseEntity<Map<String, String>> getVapidPublicKey() {
    String publicKey = pushProperties.vapidPublicKey();
    if (publicKey == null || publicKey.isBlank()) {
      return ResponseEntity.ok(Map.of("publicKey", ""));
    }
    return ResponseEntity.ok(Map.of("publicKey", publicKey));
  }
}
