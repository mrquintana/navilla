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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import app.navilla.dto.PushPayload;
import app.navilla.entity.Notification;
import app.navilla.entity.NotificationType;
import app.navilla.metrics.NotificationMetrics;
import app.navilla.repository.NotificationRepository;
import app.navilla.security.EncryptionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link NotificationService} push notification privacy.
 *
 * <p>Verifies that web push payloads never leak the notification type
 * or message key — the push body visible on the lock screen must
 * always be a generic "You have a new update" message.
 *
 * @author Navilla Team
 * @since 2026-03-11
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

  @Mock
  private NotificationRepository notificationRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private NotificationMetrics notificationMetrics;

  @Mock
  private WebPushService webPushService;

  @Mock
  private PushSubscriptionService pushSubscriptionService;

  @Captor
  private ArgumentCaptor<PushPayload> pushPayloadCaptor;

  private NotificationService notificationService;

  private static final String USER_HASH = "testhash-abc123";

  @BeforeEach
  void setUp() {
    ObjectMapper objectMapper = new ObjectMapper();
    notificationService = new NotificationService(
        notificationRepository,
        encryptionService,
        objectMapper,
        notificationMetrics,
        webPushService,
        pushSubscriptionService
    );
  }

  /**
   * For each {@link NotificationType}, triggers a notification and asserts
   * that the push payload title and body are generic — never leaking the
   * notification type name or message key.
   */
  @ParameterizedTest(name = "push payload for {0} must be generic")
  @EnumSource(NotificationType.class)
  @DisplayName("sendPushForNotification never leaks notification type or message key")
  void pushPayloadMustBeGenericForAllTypes(NotificationType type) {
    // Arrange: stub encryption so createNotification succeeds
    when(encryptionService.encryptToBytes(any(String.class)))
        .thenReturn(new byte[]{1, 2, 3});
    when(notificationRepository.save(any(Notification.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    UUID referenceId = UUID.randomUUID();
    String messageKey = "notifications.test." + type.name().toLowerCase();

    // Act: call the public method that ultimately triggers sendPushForNotification
    notificationService.createReminderNotification(USER_HASH, type, messageKey, referenceId);

    // Assert: capture the PushPayload passed to webPushService.sendPushToUser
    verify(webPushService).sendPushToUser(
        eq(USER_HASH),
        pushPayloadCaptor.capture(),
        eq(pushSubscriptionService)
    );

    PushPayload push = pushPayloadCaptor.getValue();

    // Title must be generic "Navilla"
    assertThat(push.title())
        .as("Push title for %s must be 'Navilla'", type)
        .isEqualTo("Navilla");

    // Body must be generic "You have a new update"
    assertThat(push.body())
        .as("Push body for %s must be 'You have a new update'", type)
        .isEqualTo("You have a new update");

    // Neither title nor body should contain the notification type name
    assertThat(push.title())
        .as("Push title must not contain notification type name '%s'", type.name())
        .doesNotContain(type.name());

    assertThat(push.body())
        .as("Push body must not contain notification type name '%s'", type.name())
        .doesNotContain(type.name());

    // Body should not contain the raw message key
    assertThat(push.body())
        .as("Push body must not contain message key '%s'", messageKey)
        .doesNotContain(messageKey);
  }
}
