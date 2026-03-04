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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import app.navilla.config.PushProperties;
import app.navilla.dto.PushPayload;
import app.navilla.entity.PushSubscription;
import app.navilla.security.EncryptionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link WebPushService}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@ExtendWith(MockitoExtension.class)
class WebPushServiceTest {

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private PushSubscriptionService pushSubscriptionService;

  private ObjectMapper objectMapper;

  private static final String USER_HASH = "testhash123";
  private static final byte[] ENCRYPTED_ENDPOINT = new byte[]{1, 2, 3};
  private static final byte[] ENCRYPTED_P256DH = new byte[]{4, 5, 6};
  private static final byte[] ENCRYPTED_AUTH = new byte[]{7, 8, 9};

  private PushSubscription buildSubscription() {
    return PushSubscription.builder()
        .id(UUID.randomUUID())
        .userHash(USER_HASH)
        .endpointEncrypted(ENCRYPTED_ENDPOINT)
        .p256dhEncrypted(ENCRYPTED_P256DH)
        .authEncrypted(ENCRYPTED_AUTH)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  @BeforeEach
  void setUp() {
    objectMapper = new ObjectMapper();
  }

  @Nested
  @DisplayName("sendPush — when VAPID keys are NOT configured")
  class SendPushNotConfigured {

    @Test
    @DisplayName("should return false without attempting delivery")
    void shouldReturnFalseWhenNotConfigured() {
      PushProperties props = new PushProperties("", "", "mailto:test@navilla.app");
      WebPushService service = new WebPushService(props, encryptionService, objectMapper);
      service.init();

      PushSubscription subscription = buildSubscription();
      PushPayload payload = PushPayload.withDefaults("Test", "Body", "/", "test");

      boolean result = service.sendPush(subscription, payload);

      assertThat(result).isFalse();
      // Encryption should never be called when not configured
      verify(encryptionService, never()).decryptFromBytes(any());
    }

    @Test
    @DisplayName("should return false when VAPID public key is null")
    void shouldReturnFalseWhenVapidKeyNull() {
      PushProperties props = new PushProperties(null, null, "mailto:test@navilla.app");
      WebPushService service = new WebPushService(props, encryptionService, objectMapper);
      service.init();

      PushSubscription subscription = buildSubscription();
      PushPayload payload = PushPayload.withDefaults("Test", "Body", "/", "test");

      boolean result = service.sendPush(subscription, payload);

      assertThat(result).isFalse();
    }
  }

  @Nested
  @DisplayName("sendPush — when VAPID keys ARE configured")
  class SendPushConfigured {

    @Test
    @DisplayName("should decrypt endpoint, p256dh, and auth from subscription")
    void shouldDecryptSubscriptionFields() {
      PushProperties props = new PushProperties(
          "test-public-key", "test-private-key", "mailto:test@navilla.app");
      WebPushService service = new WebPushService(props, encryptionService, objectMapper);
      service.init();

      PushSubscription subscription = buildSubscription();
      PushPayload payload = PushPayload.withDefaults("Test", "Body", "/", "test");

      // The endpoint decryption returns an invalid URL, so the push will fail
      // but we verify that decryption was called
      when(encryptionService.decryptFromBytes(ENCRYPTED_ENDPOINT))
          .thenReturn("https://push.example.com/endpoint");
      when(encryptionService.decryptFromBytes(ENCRYPTED_P256DH))
          .thenReturn("p256dh-key-value");
      when(encryptionService.decryptFromBytes(ENCRYPTED_AUTH))
          .thenReturn("auth-secret-value");

      // This will fail at the VAPID signing or HTTP send step, but that's OK
      // — we're verifying decryption was called
      boolean result = service.sendPush(subscription, payload);

      // Verify all three fields were decrypted
      verify(encryptionService).decryptFromBytes(ENCRYPTED_ENDPOINT);
      verify(encryptionService).decryptFromBytes(ENCRYPTED_P256DH);
      verify(encryptionService).decryptFromBytes(ENCRYPTED_AUTH);

      // The result will be false because the private key "test-private-key"
      // isn't a valid EC key, but that's expected — no exception should be thrown
      assertThat(result).isFalse();
    }

    @Test
    @DisplayName("should not throw exceptions (fire-and-forget)")
    void shouldNotThrowExceptions() {
      PushProperties props = new PushProperties(
          "test-public-key", "test-private-key", "mailto:test@navilla.app");
      WebPushService service = new WebPushService(props, encryptionService, objectMapper);
      service.init();

      PushSubscription subscription = buildSubscription();
      PushPayload payload = PushPayload.withDefaults("Test", "Body", "/", "test");

      // Simulate decryption that returns bad data — should not throw
      when(encryptionService.decryptFromBytes(ENCRYPTED_ENDPOINT))
          .thenReturn("not-a-valid-url");
      when(encryptionService.decryptFromBytes(ENCRYPTED_P256DH))
          .thenReturn("p256dh");
      when(encryptionService.decryptFromBytes(ENCRYPTED_AUTH))
          .thenReturn("auth");

      // Should NOT throw — fire and forget
      boolean result = service.sendPush(subscription, payload);
      assertThat(result).isFalse();
    }

    @Test
    @DisplayName("should handle decryption failure gracefully")
    void shouldHandleDecryptionFailure() {
      PushProperties props = new PushProperties(
          "test-public-key", "test-private-key", "mailto:test@navilla.app");
      WebPushService service = new WebPushService(props, encryptionService, objectMapper);
      service.init();

      PushSubscription subscription = buildSubscription();
      PushPayload payload = PushPayload.withDefaults("Test", "Body", "/", "test");

      // Simulate decryption failure
      when(encryptionService.decryptFromBytes(ENCRYPTED_ENDPOINT))
          .thenThrow(new RuntimeException("Decryption failed"));

      // Should NOT throw — fire and forget
      boolean result = service.sendPush(subscription, payload);
      assertThat(result).isFalse();
    }
  }

  @Nested
  @DisplayName("sendPushToUser")
  class SendPushToUser {

    @Test
    @DisplayName("should send to all user subscriptions")
    void shouldSendToAllSubscriptions() {
      PushProperties props = new PushProperties("", "", "mailto:test@navilla.app");
      WebPushService service = new WebPushService(props, encryptionService, objectMapper);
      service.init();

      PushSubscription sub1 = buildSubscription();
      PushSubscription sub2 = buildSubscription();
      PushPayload payload = PushPayload.withDefaults("Test", "Body", "/", "test");

      when(pushSubscriptionService.getSubscriptionsForUserHash(USER_HASH))
          .thenReturn(List.of(sub1, sub2));

      // Not configured, so both will return false
      int result = service.sendPushToUser(USER_HASH, payload, pushSubscriptionService);

      assertThat(result).isZero();
      verify(pushSubscriptionService).getSubscriptionsForUserHash(USER_HASH);
    }

    @Test
    @DisplayName("should return 0 when user has no subscriptions")
    void shouldReturnZeroForNoSubscriptions() {
      PushProperties props = new PushProperties("", "", "mailto:test@navilla.app");
      WebPushService service = new WebPushService(props, encryptionService, objectMapper);
      service.init();

      PushPayload payload = PushPayload.withDefaults("Test", "Body", "/", "test");

      when(pushSubscriptionService.getSubscriptionsForUserHash(USER_HASH))
          .thenReturn(List.of());

      int result = service.sendPushToUser(USER_HASH, payload, pushSubscriptionService);

      assertThat(result).isZero();
    }
  }

  @Nested
  @DisplayName("isConfigured")
  class IsConfigured {

    @Test
    @DisplayName("should return true when VAPID keys are present")
    void shouldReturnTrueWhenConfigured() {
      PushProperties props = new PushProperties(
          "public-key", "private-key", "mailto:test@navilla.app");
      WebPushService service = new WebPushService(props, encryptionService, objectMapper);
      service.init();

      assertThat(service.isConfigured()).isTrue();
    }

    @Test
    @DisplayName("should return false when VAPID public key is blank")
    void shouldReturnFalseWhenNotConfigured() {
      PushProperties props = new PushProperties("", "", "mailto:test@navilla.app");
      WebPushService service = new WebPushService(props, encryptionService, objectMapper);
      service.init();

      assertThat(service.isConfigured()).isFalse();
    }

    @Test
    @DisplayName("should return false when VAPID keys are null")
    void shouldReturnFalseWhenKeysNull() {
      PushProperties props = new PushProperties(null, null, "mailto:test@navilla.app");
      WebPushService service = new WebPushService(props, encryptionService, objectMapper);
      service.init();

      assertThat(service.isConfigured()).isFalse();
    }
  }
}
