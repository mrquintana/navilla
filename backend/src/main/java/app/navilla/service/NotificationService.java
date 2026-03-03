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

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import app.navilla.dto.NotificationPayload;
import app.navilla.dto.NotificationResponse;
import app.navilla.entity.Notification;
import app.navilla.entity.NotificationType;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.metrics.NotificationMetrics;
import app.navilla.repository.NotificationRepository;
import app.navilla.security.EncryptionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

  private final NotificationRepository notificationRepository;
  private final EncryptionService encryptionService;
  private final ObjectMapper objectMapper;
  private final NotificationMetrics notificationMetrics;

  /**
   * Creates a connection request notification.
   *
   * @param recipientHash recipient user hash
   * @param connectionId connection id
   */
  @Transactional
  public void createConnectionRequestNotification(String recipientHash, UUID connectionId) {
    createNotification(recipientHash, NotificationType.CONNECTION_REQUEST,
        new NotificationPayload("notifications.connectionRequest", connectionId));
  }

  /**
   * Creates a connection confirmed notification.
   *
   * @param requesterHash requester user hash
   * @param connectionId connection id
   */
  @Transactional
  public void createConnectionConfirmedNotification(String requesterHash, UUID connectionId) {
    createNotification(requesterHash, NotificationType.CONNECTION_CONFIRMED,
        new NotificationPayload("notifications.connectionConfirmed", connectionId));
  }

  /**
   * Creates a connection denied notification.
   *
   * @param requesterHash requester user hash
   * @param connectionId connection id
   */
  @Transactional
  public void createConnectionDeniedNotification(String requesterHash, UUID connectionId) {
    createNotification(requesterHash, NotificationType.CONNECTION_DENIED,
        new NotificationPayload("notifications.connectionDenied", connectionId));
  }

  /**
   * Creates a reminder notification for the given user.
   *
   * @param userHash        recipient user hash
   * @param type            notification type (e.g., MEDICATION_REMINDER)
   * @param messageKey      i18n message key for the notification
   * @param referenceId     the reminder or related entity ID (stored as connectionId in payload)
   */
  @Transactional
  public void createReminderNotification(String userHash, NotificationType type,
                                          String messageKey, UUID referenceId) {
    createNotification(userHash, type,
        new NotificationPayload(messageKey, referenceId));
  }

  /**
   * Lists notifications for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return list of notifications
   */
  @Transactional(readOnly = true)
  public List<NotificationResponse> listNotifications(Jwt jwt) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));

    return notificationRepository.findByUserHashOrderByCreatedAtDesc(userHash).stream()
        .map(this::toResponse)
        .toList();
  }

  /**
   * Marks a notification as read for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @param notificationId notification id
   */
  @Transactional
  public void markRead(Jwt jwt, UUID notificationId) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    Notification notification = notificationRepository.findById(notificationId)
        .orElseThrow(() -> new ResourceNotFoundException("notification.error.notFound"));

    if (!notification.getUserHash().equals(userHash)) {
      throw new IllegalStateException("notification.error.notOwner");
    }

    if (notification.getReadAt() == null) {
      notification.setReadAt(OffsetDateTime.now());
      notificationRepository.save(notification);
      notificationMetrics.recordRead();
    }
  }

  private void createNotification(String userHash, NotificationType type, NotificationPayload payload) {
    try {
      String json = objectMapper.writeValueAsString(payload);
      byte[] encrypted = encryptionService.encryptToBytes(json);

      Notification notification = Notification.builder()
          .userHash(userHash)
          .notificationType(type)
          .payloadEncrypted(encrypted)
          .scheduledFor(OffsetDateTime.now())
          .build();

      notificationRepository.save(notification);
      notificationMetrics.recordCreated(type);
    } catch (Exception ex) {
      log.error("Failed to create notification", ex);
      notificationMetrics.recordCreationFailed(type);
    }
  }

  private NotificationResponse toResponse(Notification notification) {
    NotificationPayload payload = null;
    try {
      String json = encryptionService.decryptFromBytes(notification.getPayloadEncrypted());
      payload = objectMapper.readValue(json, NotificationPayload.class);
    } catch (Exception ex) {
      log.warn("Failed to decrypt notification payload for {}", notification.getId(), ex);
    }

    return new NotificationResponse(
        notification.getId(),
        notification.getNotificationType().name(),
        payload != null ? payload.messageKey() : "notifications.generic",
        payload != null ? payload.connectionId() : null,
        notification.getCreatedAt(),
        notification.getReadAt()
    );
  }
}
