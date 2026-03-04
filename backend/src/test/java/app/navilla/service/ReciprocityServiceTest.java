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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import app.navilla.dto.ReciprocityStatusResponse;
import app.navilla.entity.User;
import app.navilla.exception.CooldownActiveException;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Unit tests for {@link ReciprocityService}.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@ExtendWith(MockitoExtension.class)
class ReciprocityServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private AppConfigService appConfigService;

  @InjectMocks
  private ReciprocityService reciprocityService;

  private Jwt jwt;
  private User user;

  private static final String USER_EMAIL = "reciprocity@example.com";
  private static final String USER_EMAIL_HASH = "hashed-email";

  @BeforeEach
  void setUp() {
    jwt = Jwt.withTokenValue("test-token")
        .header("alg", "RS256")
        .subject("test-subject")
        .claim("email", USER_EMAIL)
        .build();

    user = User.builder()
        .id(UUID.randomUUID())
        .emailHash(USER_EMAIL_HASH)
        .emailEncrypted(new byte[]{1, 2, 3})
        .exposureOptedIn(false)
        .receiveMatchNotifications(false)
        .build();
  }

  private void stubUserLookup() {
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_EMAIL_HASH);
    when(userRepository.findByEmailHash(USER_EMAIL_HASH)).thenReturn(Optional.of(user));
  }

  @Nested
  @DisplayName("getStatus")
  class GetStatus {

    @Test
    @DisplayName("returns correct status for user not opted in")
    void returnsStatusNotOptedIn() {
      stubUserLookup();

      ReciprocityStatusResponse response = reciprocityService.getStatus(jwt);

      assertThat(response.optedIn()).isFalse();
      assertThat(response.optedInAt()).isNull();
      assertThat(response.optedOutAt()).isNull();
      assertThat(response.cooldownDaysRemaining()).isNull();
    }

    @Test
    @DisplayName("returns correct status for opted-in user")
    void returnsStatusOptedIn() {
      stubUserLookup();
      OffsetDateTime optedInAt = OffsetDateTime.now().minusDays(5);
      user.setExposureOptedIn(true);
      user.setExposureOptedInAt(optedInAt);

      ReciprocityStatusResponse response = reciprocityService.getStatus(jwt);

      assertThat(response.optedIn()).isTrue();
      assertThat(response.optedInAt()).isEqualTo(optedInAt);
      assertThat(response.cooldownDaysRemaining()).isNull();
    }

    @Test
    @DisplayName("returns cooldown days remaining after opt-out")
    void returnsCooldownAfterOptOut() {
      stubUserLookup();
      user.setExposureOptedIn(false);
      user.setExposureOptedOutAt(OffsetDateTime.now().minusDays(5));
      when(appConfigService.getInt("reciprocity.cooldown_days", 15)).thenReturn(15);

      ReciprocityStatusResponse response = reciprocityService.getStatus(jwt);

      assertThat(response.optedIn()).isFalse();
      assertThat(response.cooldownDaysRemaining()).isEqualTo(10);
    }

    @Test
    @DisplayName("throws ResourceNotFoundException for unknown user")
    void throwsForUnknownUser() {
      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_EMAIL_HASH);
      when(userRepository.findByEmailHash(USER_EMAIL_HASH)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> reciprocityService.getStatus(jwt))
          .isInstanceOf(ResourceNotFoundException.class);
    }
  }

  @Nested
  @DisplayName("optIn")
  class OptIn {

    @Test
    @DisplayName("happy path — sets fields correctly")
    void optInHappyPath() {
      stubUserLookup();
      when(userRepository.save(any(User.class))).thenReturn(user);

      ReciprocityStatusResponse response = reciprocityService.optIn(jwt);

      assertThat(response.optedIn()).isTrue();
      assertThat(user.getExposureOptedIn()).isTrue();
      assertThat(user.getExposureOptedInAt()).isNotNull();
      verify(userRepository).save(user);
    }

    @Test
    @DisplayName("already opted in — throws IllegalStateException")
    void optInAlreadyOptedIn() {
      stubUserLookup();
      user.setExposureOptedIn(true);

      assertThatThrownBy(() -> reciprocityService.optIn(jwt))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("reciprocity.error.alreadyOptedIn");
    }

    @Test
    @DisplayName("in cooldown — throws CooldownActiveException")
    void optInInCooldown() {
      stubUserLookup();
      user.setExposureOptedIn(false);
      user.setExposureOptedOutAt(OffsetDateTime.now().minusDays(3));
      when(appConfigService.getInt("reciprocity.cooldown_days", 15)).thenReturn(15);

      assertThatThrownBy(() -> reciprocityService.optIn(jwt))
          .isInstanceOf(CooldownActiveException.class);
    }

    @Test
    @DisplayName("cooldown expired — succeeds")
    void optInCooldownExpired() {
      stubUserLookup();
      user.setExposureOptedIn(false);
      user.setExposureOptedOutAt(OffsetDateTime.now().minusDays(20));
      when(appConfigService.getInt("reciprocity.cooldown_days", 15)).thenReturn(15);
      when(userRepository.save(any(User.class))).thenReturn(user);

      ReciprocityStatusResponse response = reciprocityService.optIn(jwt);

      assertThat(response.optedIn()).isTrue();
      verify(userRepository).save(user);
    }
  }

  @Nested
  @DisplayName("optOut")
  class OptOut {

    @Test
    @DisplayName("happy path — sets fields correctly")
    void optOutHappyPath() {
      stubUserLookup();
      user.setExposureOptedIn(true);
      user.setExposureOptedInAt(OffsetDateTime.now().minusDays(10));
      when(userRepository.save(any(User.class))).thenReturn(user);

      ReciprocityStatusResponse response = reciprocityService.optOut(jwt);

      assertThat(response.optedIn()).isFalse();
      assertThat(user.getExposureOptedIn()).isFalse();
      assertThat(user.getExposureOptedOutAt()).isNotNull();
      verify(userRepository).save(user);
    }

    @Test
    @DisplayName("not opted in — throws IllegalStateException")
    void optOutNotOptedIn() {
      stubUserLookup();
      user.setExposureOptedIn(false);

      assertThatThrownBy(() -> reciprocityService.optOut(jwt))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("reciprocity.error.notOptedIn");
    }
  }
}
