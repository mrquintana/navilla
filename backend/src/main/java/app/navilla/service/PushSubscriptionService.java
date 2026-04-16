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

package app.navilla.service;

import java.util.List;
import java.util.UUID;

import app.navilla.dto.PushSubscriptionRequest;
import app.navilla.dto.PushSubscriptionResponse;
import app.navilla.entity.PushSubscription;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.PushSubscriptionRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing web push notification subscriptions.
 *
 * <p>Handles registration, removal, and retrieval of push subscriptions.
 * All subscription data (endpoint, keys) is encrypted at rest via
 * {@link EncryptionService}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PushSubscriptionService {

  private final PushSubscriptionRepository pushSubscriptionRepository;
  private final EncryptionService encryptionService;

  /**
   * Registers a new push subscription for the authenticated user.
   *
   * <p>Encrypts the endpoint, p256dh key, and auth secret before storage.
   *
   * @param jwt the JWT token containing user info
   * @param request the push subscription data
   * @return the created subscription response
   */
  @Transactional
  public PushSubscriptionResponse subscribe(Jwt jwt, PushSubscriptionRequest request) {
    String userHash = hashEmail(jwt);

    PushSubscription subscription = PushSubscription.builder()
        .userHash(userHash)
        .endpointEncrypted(encryptionService.encryptToBytes(request.endpoint()))
        .p256dhEncrypted(encryptionService.encryptToBytes(request.p256dh()))
        .authEncrypted(encryptionService.encryptToBytes(request.auth()))
        .build();

    PushSubscription saved = pushSubscriptionRepository.save(subscription);
    log.debug("Push subscription registered for user hash: {}", userHash);

    return new PushSubscriptionResponse(saved.getId(), saved.getCreatedAt());
  }

  /**
   * Removes a push subscription for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @param id the subscription id to remove
   * @throws ResourceNotFoundException if the subscription is not found
   */
  @Transactional
  public void unsubscribe(Jwt jwt, UUID id) {
    String userHash = hashEmail(jwt);

    PushSubscription subscription = pushSubscriptionRepository.findById(id)
        .filter(sub -> sub.getUserHash().equals(userHash))
        .orElseThrow(() -> new ResourceNotFoundException("push.error.subscriptionNotFound"));

    pushSubscriptionRepository.delete(subscription);
    log.debug("Push subscription {} removed for user hash: {}", id, userHash);
  }

  /**
   * Lists all push subscriptions for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return list of subscription responses
   */
  @Transactional(readOnly = true)
  public List<PushSubscriptionResponse> listForUser(Jwt jwt) {
    String userHash = hashEmail(jwt);

    return pushSubscriptionRepository.findByUserHash(userHash).stream()
        .map(sub -> new PushSubscriptionResponse(sub.getId(), sub.getCreatedAt()))
        .toList();
  }

  /**
   * Retrieves raw push subscription entities for a given user hash.
   *
   * <p>Used internally by the push notification sender to obtain
   * encrypted subscription data for delivery.
   *
   * @param userHash the hashed user identifier
   * @return list of push subscription entities
   */
  @Transactional(readOnly = true)
  public List<PushSubscription> getSubscriptionsForUserHash(String userHash) {
    return pushSubscriptionRepository.findByUserHash(userHash);
  }

  private String hashEmail(Jwt jwt) {
    return encryptionService.hashEmail(jwt.getClaimAsString("email"));
  }
}
