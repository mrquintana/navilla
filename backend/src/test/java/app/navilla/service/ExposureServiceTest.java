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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.dto.ExposureResponse;
import app.navilla.entity.Connection;
import app.navilla.entity.ConnectionStatus;
import app.navilla.entity.User;
import app.navilla.metrics.ExposureMetrics;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.ExposureSnapshotRepository;
import app.navilla.repository.HealthStatusRepository;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Unit tests for {@link ExposureService}.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@ExtendWith(MockitoExtension.class)
class ExposureServiceTest {

  @Mock
  private ConnectionRepository connectionRepository;

  @Mock
  private HealthStatusRepository healthStatusRepository;

  @Mock
  private ExposureSnapshotRepository exposureSnapshotRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private ObjectMapper objectMapper;

  @Mock
  private ExposureMetrics exposureMetrics;

  @InjectMocks
  private ExposureService exposureService;

  private Jwt jwt;
  private User optedInUser;
  private User notOptedInUser;

  private static final String USER_EMAIL = "exposure@example.com";
  private static final String USER_HASH = "hashed-exposure-email";

  @BeforeEach
  void setUp() {
    jwt = Jwt.withTokenValue("test-token")
        .header("alg", "RS256")
        .subject("test-subject")
        .claim("email", USER_EMAIL)
        .build();

    optedInUser = User.builder()
        .id(UUID.randomUUID())
        .emailHash(USER_HASH)
        .emailEncrypted(new byte[]{1, 2, 3})
        .exposureOptedIn(true)
        .build();

    notOptedInUser = User.builder()
        .id(UUID.randomUUID())
        .emailHash(USER_HASH)
        .emailEncrypted(new byte[]{1, 2, 3})
        .exposureOptedIn(false)
        .build();

    // Set @Value fields via reflection
    ReflectionTestUtils.setField(exposureService, "minimumConnections", 3);
    ReflectionTestUtils.setField(exposureService, "maxDepth", 3);
    ReflectionTestUtils.setField(exposureService, "snapshotTtlDays", 1);
  }

  @Nested
  @DisplayName("getExposureSnapshot - reciprocity guard")
  class GetExposureSnapshotReciprocity {

    @Test
    @DisplayName("user not opted in returns reciprocity required message")
    void getExposure_userNotOptedIn_returnsReciprocityRequiredMessage() {
      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(notOptedInUser));

      ExposureResponse response = exposureService.getExposureSnapshot(jwt);

      assertThat(response.message()).isEqualTo("exposure.reciprocityRequired");
      assertThat(response.connectionCount()).isEqualTo(0);
      assertThat(response.exposures()).isEmpty();
      assertThat(response.secondDegreeCount()).isNull();
      assertThat(response.thirdDegreeCount()).isNull();
      assertThat(response.totalGraphNodes()).isNull();
      assertThat(response.maxDepth()).isNull();
      assertThat(response.recommendation()).isNull();

      // No actual computation should happen
      verify(connectionRepository, never()).findByStatus(any());
      verify(healthStatusRepository, never()).findByUserHashInAndStatus(any(), any());
    }

    @Test
    @DisplayName("user not found returns reciprocity required message")
    void getExposure_userNotFound_returnsReciprocityRequiredMessage() {
      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.empty());

      ExposureResponse response = exposureService.getExposureSnapshot(jwt);

      assertThat(response.message()).isEqualTo("exposure.reciprocityRequired");
      assertThat(response.exposures()).isEmpty();

      verify(connectionRepository, never()).findByStatus(any());
    }

    @Test
    @DisplayName("opted-in user with no snapshot triggers computation")
    void getExposure_userOptedIn_computesNormally() {
      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(optedInUser));
      when(exposureSnapshotRepository.findByUserHash(USER_HASH)).thenReturn(Optional.empty());
      when(connectionRepository.findByStatus(ConnectionStatus.CONFIRMED)).thenReturn(List.of());
      when(exposureMetrics.timeComputation(any())).thenAnswer(invocation -> {
        var supplier = invocation.getArgument(0, java.util.function.Supplier.class);
        return supplier.get();
      });

      ExposureResponse response = exposureService.getExposureSnapshot(jwt);

      // Should have attempted computation (cache miss)
      verify(exposureMetrics).recordCacheMiss();
      // Message should be insufficientConnections since there are no connections
      assertThat(response.message()).isEqualTo("exposure.message.insufficientConnections");
    }
  }

  @Nested
  @DisplayName("recomputeExposureSnapshot - reciprocity guard")
  class RecomputeReciprocity {

    @Test
    @DisplayName("recompute with user not opted in returns reciprocity required message")
    void recompute_notOptedIn_returnsReciprocityRequired() {
      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(notOptedInUser));

      ExposureResponse response = exposureService.recomputeExposureSnapshot(jwt);

      assertThat(response.message()).isEqualTo("exposure.reciprocityRequired");
      assertThat(response.exposures()).isEmpty();

      verify(connectionRepository, never()).findByStatus(any());
    }
  }

  @Nested
  @DisplayName("exposure computation filters non-opted-in users")
  class FilterNonOptedInUsers {

    @Test
    @DisplayName("health statuses from non-opted-in users are excluded from computation")
    void exposureComputation_excludesNonOptedInUsers() {
      // Need 3+ connections to pass minimumConnections threshold
      String hash1 = "hash1";
      String hash2 = "hash2";
      String hash3 = "hash3";
      User notOptedIn1 = User.builder().emailHash(hash1).exposureOptedIn(false).build();
      User notOptedIn2 = User.builder().emailHash(hash2).exposureOptedIn(false).build();
      User notOptedIn3 = User.builder().emailHash(hash3).exposureOptedIn(false).build();

      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(optedInUser));
      when(exposureSnapshotRepository.findByUserHash(USER_HASH)).thenReturn(Optional.empty());

      // Build graph with 3 connections (all non-opted-in)
      Connection c1 = Connection.builder()
          .requesterHash(USER_HASH).recipientHash(hash1)
          .status(ConnectionStatus.CONFIRMED).build();
      Connection c2 = Connection.builder()
          .requesterHash(USER_HASH).recipientHash(hash2)
          .status(ConnectionStatus.CONFIRMED).build();
      Connection c3 = Connection.builder()
          .requesterHash(USER_HASH).recipientHash(hash3)
          .status(ConnectionStatus.CONFIRMED).build();
      when(connectionRepository.findByStatus(ConnectionStatus.CONFIRMED))
          .thenReturn(List.of(c1, c2, c3));

      // All connected users are NOT opted in — their health data should be filtered out
      when(userRepository.findByEmailHashIn(any()))
          .thenReturn(List.of(notOptedIn1, notOptedIn2, notOptedIn3));

      when(exposureMetrics.timeComputation(any())).thenAnswer(invocation -> {
        var supplier = invocation.getArgument(0, java.util.function.Supplier.class);
        return supplier.get();
      });

      ExposureResponse response = exposureService.getExposureSnapshot(jwt);

      // Health statuses should NOT be queried because no opted-in users remain after filtering
      verify(healthStatusRepository, never()).findByUserHashInAndStatus(any(), any());
    }

    @Test
    @DisplayName("health statuses from opted-in users are included in computation")
    void exposureComputation_includesOptedInUsers() {
      String otherHash = "other-user-hash";
      User otherUser = User.builder()
          .emailHash(otherHash)
          .exposureOptedIn(true)
          .build();

      // Need 3+ connections to pass the minimumConnections threshold
      String hash2 = "hash2";
      String hash3 = "hash3";
      User user2 = User.builder().emailHash(hash2).exposureOptedIn(true).build();
      User user3 = User.builder().emailHash(hash3).exposureOptedIn(true).build();

      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(optedInUser));
      when(exposureSnapshotRepository.findByUserHash(USER_HASH)).thenReturn(Optional.empty());

      Connection c1 = Connection.builder()
          .requesterHash(USER_HASH).recipientHash(otherHash)
          .status(ConnectionStatus.CONFIRMED).build();
      Connection c2 = Connection.builder()
          .requesterHash(USER_HASH).recipientHash(hash2)
          .status(ConnectionStatus.CONFIRMED).build();
      Connection c3 = Connection.builder()
          .requesterHash(USER_HASH).recipientHash(hash3)
          .status(ConnectionStatus.CONFIRMED).build();
      when(connectionRepository.findByStatus(ConnectionStatus.CONFIRMED))
          .thenReturn(List.of(c1, c2, c3));

      // All other users are opted in
      when(userRepository.findByEmailHashIn(any()))
          .thenReturn(List.of(otherUser, user2, user3));

      when(healthStatusRepository.findByUserHashInAndStatus(any(), any()))
          .thenReturn(List.of());

      when(exposureMetrics.timeComputation(any())).thenAnswer(invocation -> {
        var supplier = invocation.getArgument(0, java.util.function.Supplier.class);
        return supplier.get();
      });

      ExposureResponse response = exposureService.getExposureSnapshot(jwt);

      // Health statuses should be queried for opted-in users
      verify(healthStatusRepository).findByUserHashInAndStatus(any(), any());
    }
  }
}
