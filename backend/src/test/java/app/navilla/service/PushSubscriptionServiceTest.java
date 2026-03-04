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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.dto.PushSubscriptionRequest;
import app.navilla.dto.PushSubscriptionResponse;
import app.navilla.entity.PushSubscription;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.PushSubscriptionRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Unit tests for {@link PushSubscriptionService}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@ExtendWith(MockitoExtension.class)
class PushSubscriptionServiceTest {

  @Mock
  private PushSubscriptionRepository pushSubscriptionRepository;

  @Mock
  private EncryptionService encryptionService;

  @InjectMocks
  private PushSubscriptionService pushSubscriptionService;

  private static final String USER_EMAIL = "push@example.com";
  private static final String USER_HASH = "pushhash123";
  private static final UUID SUBSCRIPTION_ID = UUID.randomUUID();
  private static final byte[] ENCRYPTED_ENDPOINT = new byte[]{1, 2, 3};
  private static final byte[] ENCRYPTED_P256DH = new byte[]{4, 5, 6};
  private static final byte[] ENCRYPTED_AUTH = new byte[]{7, 8, 9};

  private Jwt mockJwt() {
    Jwt jwt = mock(Jwt.class);
    when(jwt.getClaimAsString("email")).thenReturn(USER_EMAIL);
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    return jwt;
  }

  private PushSubscription buildSubscription(UUID id, String userHash) {
    return PushSubscription.builder()
        .id(id)
        .userHash(userHash)
        .endpointEncrypted(ENCRYPTED_ENDPOINT)
        .p256dhEncrypted(ENCRYPTED_P256DH)
        .authEncrypted(ENCRYPTED_AUTH)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  @Nested
  @DisplayName("subscribe")
  class Subscribe {

    @Test
    @DisplayName("should encrypt fields and save subscription")
    void subscribe_shouldEncryptFieldsAndSave() {
      Jwt jwt = mockJwt();

      when(encryptionService.encryptToBytes("https://push.example.com/endpoint"))
          .thenReturn(ENCRYPTED_ENDPOINT);
      when(encryptionService.encryptToBytes("p256dh-key-value"))
          .thenReturn(ENCRYPTED_P256DH);
      when(encryptionService.encryptToBytes("auth-secret-value"))
          .thenReturn(ENCRYPTED_AUTH);

      when(pushSubscriptionRepository.save(any(PushSubscription.class)))
          .thenAnswer(invocation -> {
            PushSubscription saved = invocation.getArgument(0);
            saved.setId(SUBSCRIPTION_ID);
            saved.setCreatedAt(OffsetDateTime.now());
            return saved;
          });

      PushSubscriptionRequest request = new PushSubscriptionRequest(
          "https://push.example.com/endpoint",
          "p256dh-key-value",
          "auth-secret-value"
      );

      PushSubscriptionResponse response = pushSubscriptionService.subscribe(jwt, request);

      // Verify encryption was called for each field
      verify(encryptionService).encryptToBytes("https://push.example.com/endpoint");
      verify(encryptionService).encryptToBytes("p256dh-key-value");
      verify(encryptionService).encryptToBytes("auth-secret-value");

      // Verify entity saved with correct data
      ArgumentCaptor<PushSubscription> captor = ArgumentCaptor.forClass(PushSubscription.class);
      verify(pushSubscriptionRepository).save(captor.capture());
      PushSubscription saved = captor.getValue();
      assertThat(saved.getUserHash()).isEqualTo(USER_HASH);
      assertThat(saved.getEndpointEncrypted()).isEqualTo(ENCRYPTED_ENDPOINT);
      assertThat(saved.getP256dhEncrypted()).isEqualTo(ENCRYPTED_P256DH);
      assertThat(saved.getAuthEncrypted()).isEqualTo(ENCRYPTED_AUTH);

      // Verify response
      assertThat(response.id()).isEqualTo(SUBSCRIPTION_ID);
      assertThat(response.createdAt()).isNotNull();
    }
  }

  @Nested
  @DisplayName("unsubscribe")
  class Unsubscribe {

    @Test
    @DisplayName("should delete subscription owned by user")
    void unsubscribe_shouldDeleteOwnedSubscription() {
      Jwt jwt = mockJwt();

      PushSubscription subscription = buildSubscription(SUBSCRIPTION_ID, USER_HASH);
      when(pushSubscriptionRepository.findById(SUBSCRIPTION_ID))
          .thenReturn(Optional.of(subscription));

      pushSubscriptionService.unsubscribe(jwt, SUBSCRIPTION_ID);

      verify(pushSubscriptionRepository).delete(subscription);
    }

    @Test
    @DisplayName("should throw when subscription not found")
    void unsubscribe_shouldThrowWhenNotFound() {
      Jwt jwt = mockJwt();

      when(pushSubscriptionRepository.findById(SUBSCRIPTION_ID))
          .thenReturn(Optional.empty());

      assertThatThrownBy(() -> pushSubscriptionService.unsubscribe(jwt, SUBSCRIPTION_ID))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessage("push.error.subscriptionNotFound");
    }

    @Test
    @DisplayName("should throw when subscription not owned by user")
    void unsubscribe_shouldThrowWhenNotOwned() {
      Jwt jwt = mockJwt();

      PushSubscription otherSubscription = buildSubscription(SUBSCRIPTION_ID, "other_hash");
      when(pushSubscriptionRepository.findById(SUBSCRIPTION_ID))
          .thenReturn(Optional.of(otherSubscription));

      assertThatThrownBy(() -> pushSubscriptionService.unsubscribe(jwt, SUBSCRIPTION_ID))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessage("push.error.subscriptionNotFound");
    }
  }

  @Nested
  @DisplayName("listForUser")
  class ListForUser {

    @Test
    @DisplayName("should return mapped list of subscriptions")
    void listForUser_shouldReturnMappedList() {
      Jwt jwt = mockJwt();

      PushSubscription sub1 = buildSubscription(UUID.randomUUID(), USER_HASH);
      PushSubscription sub2 = buildSubscription(UUID.randomUUID(), USER_HASH);

      when(pushSubscriptionRepository.findByUserHash(USER_HASH))
          .thenReturn(List.of(sub1, sub2));

      List<PushSubscriptionResponse> result = pushSubscriptionService.listForUser(jwt);

      assertThat(result).hasSize(2);
      assertThat(result.get(0).id()).isEqualTo(sub1.getId());
      assertThat(result.get(0).createdAt()).isEqualTo(sub1.getCreatedAt());
      assertThat(result.get(1).id()).isEqualTo(sub2.getId());
    }

    @Test
    @DisplayName("should return empty list when no subscriptions exist")
    void listForUser_shouldReturnEmptyList() {
      Jwt jwt = mockJwt();

      when(pushSubscriptionRepository.findByUserHash(USER_HASH))
          .thenReturn(List.of());

      List<PushSubscriptionResponse> result = pushSubscriptionService.listForUser(jwt);

      assertThat(result).isEmpty();
    }
  }

  @Nested
  @DisplayName("getSubscriptionsForUserHash")
  class GetSubscriptionsForUserHash {

    @Test
    @DisplayName("should return raw entity list")
    void getSubscriptionsForUserHash_shouldReturnRawEntities() {
      PushSubscription sub1 = buildSubscription(UUID.randomUUID(), USER_HASH);
      PushSubscription sub2 = buildSubscription(UUID.randomUUID(), USER_HASH);

      when(pushSubscriptionRepository.findByUserHash(USER_HASH))
          .thenReturn(List.of(sub1, sub2));

      List<PushSubscription> result =
          pushSubscriptionService.getSubscriptionsForUserHash(USER_HASH);

      assertThat(result).hasSize(2);
      assertThat(result.get(0).getEndpointEncrypted()).isEqualTo(ENCRYPTED_ENDPOINT);
    }
  }
}
