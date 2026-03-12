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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import app.navilla.dto.ExposureItem;
import app.navilla.dto.ExposureResponse;
import app.navilla.dto.NetworkHealthResponse;
import app.navilla.entity.Connection;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.TestVisitRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Unit tests for {@link NetworkHealthService}.
 *
 * @author Navilla Team
 * @since 2026-03-12
 */
@ExtendWith(MockitoExtension.class)
class NetworkHealthServiceTest {

  @Mock
  private ExposureService exposureService;

  @Mock
  private ConnectionRepository connectionRepository;

  @Mock
  private TestVisitRepository testVisitRepository;

  @Mock
  private EncryptionService encryptionService;

  @InjectMocks
  private NetworkHealthService networkHealthService;

  private static final String USER_EMAIL = "health@example.com";
  private static final String USER_HASH = "userhash123";

  private Jwt mockJwt() {
    Jwt jwt = mock(Jwt.class);
    when(jwt.getClaimAsString("email")).thenReturn(USER_EMAIL);
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    return jwt;
  }

  private ExposureResponse buildExposureResponse(
      int connectionCount, Integer secondDegree, Integer thirdDegree,
      Integer totalGraphNodes, Integer maxDepth,
      List<ExposureItem> exposures) {
    return new ExposureResponse(
        connectionCount, secondDegree, thirdDegree, totalGraphNodes, maxDepth,
        exposures, OffsetDateTime.now(), OffsetDateTime.now().plusDays(1),
        null, null
    );
  }

  private ExposureResponse buildReciprocityRequiredResponse() {
    return new ExposureResponse(
        0, null, null, null, null,
        List.of(), OffsetDateTime.now(), null,
        "exposure.reciprocityRequired", null
    );
  }

  private Connection buildConnection(String requesterHash, String recipientHash) {
    return Connection.builder()
        .requesterHash(requesterHash)
        .recipientHash(recipientHash)
        .build();
  }

  @Nested
  @DisplayName("getNetworkHealth - reciprocity guard")
  class ReciprocityGuard {

    @Test
    @DisplayName("should return null when reciprocity is required")
    void shouldReturnNullWhenReciprocityRequired() {
      Jwt jwt = mockJwt();
      when(exposureService.getExposureSnapshot(jwt)).thenReturn(buildReciprocityRequiredResponse());

      NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

      assertThat(result).isNull();
      verify(connectionRepository, never()).findConfirmedByUserHash(any());
    }
  }

  @Nested
  @DisplayName("getNetworkHealth - testing activity levels")
  class TestingActivityLevels {

    @Test
    @DisplayName("should return HIGH when >= 60% of connections tested recently")
    void shouldReturnHighWhenAbove60Percent() {
      Jwt jwt = mockJwt();

      // 5 connections, all tested = 100% -> HIGH
      List<Connection> connections = List.of(
          buildConnection(USER_HASH, "partner1"),
          buildConnection("partner2", USER_HASH),
          buildConnection(USER_HASH, "partner3"),
          buildConnection("partner4", USER_HASH),
          buildConnection(USER_HASH, "partner5")
      );

      ExposureResponse exposure = buildExposureResponse(
          5, 10, 5, 20, 3,
          List.of(new ExposureItem("hiv", 1, 2, "0_30d", "active"))
      );

      when(exposureService.getExposureSnapshot(jwt)).thenReturn(exposure);
      when(connectionRepository.findConfirmedByUserHash(USER_HASH)).thenReturn(connections);
      when(testVisitRepository.findUserHashesWithTestsAfter(
          eq(Set.of("partner1", "partner2", "partner3", "partner4", "partner5")),
          any(LocalDate.class)
      )).thenReturn(Set.of("partner1", "partner2", "partner3", "partner4", "partner5"));

      NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

      assertThat(result).isNotNull();
      assertThat(result.testingActivityLevel()).isEqualTo("HIGH");
      assertThat(result.testingActivityKey()).isEqualTo("networkHealth.testingActivity.HIGH");
      assertThat(result.connectionCount()).isEqualTo(5);
    }

    @Test
    @DisplayName("should return MEDIUM when 30-59% of connections tested recently")
    void shouldReturnMediumWhenBetween30And59Percent() {
      Jwt jwt = mockJwt();

      // 5 connections, 2 tested = 40% -> MEDIUM
      List<Connection> connections = List.of(
          buildConnection(USER_HASH, "partner1"),
          buildConnection("partner2", USER_HASH),
          buildConnection(USER_HASH, "partner3"),
          buildConnection("partner4", USER_HASH),
          buildConnection(USER_HASH, "partner5")
      );

      ExposureResponse exposure = buildExposureResponse(5, 10, 5, 20, 3, List.of());

      when(exposureService.getExposureSnapshot(jwt)).thenReturn(exposure);
      when(connectionRepository.findConfirmedByUserHash(USER_HASH)).thenReturn(connections);
      when(testVisitRepository.findUserHashesWithTestsAfter(
          eq(Set.of("partner1", "partner2", "partner3", "partner4", "partner5")),
          any(LocalDate.class)
      )).thenReturn(Set.of("partner1", "partner2"));

      NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

      assertThat(result).isNotNull();
      assertThat(result.testingActivityLevel()).isEqualTo("MEDIUM");
      assertThat(result.testingActivityKey()).isEqualTo("networkHealth.testingActivity.MEDIUM");
    }

    @Test
    @DisplayName("should return LOW when < 30% of connections tested recently")
    void shouldReturnLowWhenBelow30Percent() {
      Jwt jwt = mockJwt();

      // 5 connections, 1 tested = 20% -> LOW
      List<Connection> connections = List.of(
          buildConnection(USER_HASH, "partner1"),
          buildConnection("partner2", USER_HASH),
          buildConnection(USER_HASH, "partner3"),
          buildConnection("partner4", USER_HASH),
          buildConnection(USER_HASH, "partner5")
      );

      ExposureResponse exposure = buildExposureResponse(5, 10, 5, 20, 3, List.of());

      when(exposureService.getExposureSnapshot(jwt)).thenReturn(exposure);
      when(connectionRepository.findConfirmedByUserHash(USER_HASH)).thenReturn(connections);
      when(testVisitRepository.findUserHashesWithTestsAfter(
          eq(Set.of("partner1", "partner2", "partner3", "partner4", "partner5")),
          any(LocalDate.class)
      )).thenReturn(Set.of("partner1"));

      NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

      assertThat(result).isNotNull();
      assertThat(result.testingActivityLevel()).isEqualTo("LOW");
      assertThat(result.testingActivityKey()).isEqualTo("networkHealth.testingActivity.LOW");
    }

    @Test
    @DisplayName("should return UNKNOWN when fewer than 3 connections (privacy threshold)")
    void shouldReturnUnknownWhenBelowPrivacyThreshold() {
      Jwt jwt = mockJwt();

      // 2 connections -> below PRIVACY_THRESHOLD of 3
      List<Connection> connections = List.of(
          buildConnection(USER_HASH, "partner1"),
          buildConnection("partner2", USER_HASH)
      );

      ExposureResponse exposure = buildExposureResponse(2, null, null, 2, 3, List.of());

      when(exposureService.getExposureSnapshot(jwt)).thenReturn(exposure);
      when(connectionRepository.findConfirmedByUserHash(USER_HASH)).thenReturn(connections);

      NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

      assertThat(result).isNotNull();
      assertThat(result.testingActivityLevel()).isEqualTo("UNKNOWN");
      assertThat(result.testingActivityKey()).isEqualTo("networkHealth.testingActivity.UNKNOWN");
      // Should NOT call testVisitRepository for privacy
      verify(testVisitRepository, never()).findUserHashesWithTestsAfter(any(), any());
    }

    @Test
    @DisplayName("should return UNKNOWN when 0 connections")
    void shouldReturnUnknownWhenZeroConnections() {
      Jwt jwt = mockJwt();

      ExposureResponse exposure = buildExposureResponse(0, null, null, 0, 3, List.of());

      when(exposureService.getExposureSnapshot(jwt)).thenReturn(exposure);
      when(connectionRepository.findConfirmedByUserHash(USER_HASH)).thenReturn(Collections.emptyList());

      NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

      assertThat(result).isNotNull();
      assertThat(result.testingActivityLevel()).isEqualTo("UNKNOWN");
      assertThat(result.connectionCount()).isZero();
      verify(testVisitRepository, never()).findUserHashesWithTestsAfter(any(), any());
    }
  }

  @Nested
  @DisplayName("getNetworkHealth - threshold boundaries")
  class ThresholdBoundaries {

    @Test
    @DisplayName("should return HIGH at exactly 60% boundary")
    void shouldReturnHighAtExactly60Percent() {
      Jwt jwt = mockJwt();

      // 5 connections, 3 tested = 60% -> HIGH (>= 0.60)
      List<Connection> connections = List.of(
          buildConnection(USER_HASH, "partner1"),
          buildConnection("partner2", USER_HASH),
          buildConnection(USER_HASH, "partner3"),
          buildConnection("partner4", USER_HASH),
          buildConnection(USER_HASH, "partner5")
      );

      ExposureResponse exposure = buildExposureResponse(5, 10, 5, 20, 3, List.of());

      when(exposureService.getExposureSnapshot(jwt)).thenReturn(exposure);
      when(connectionRepository.findConfirmedByUserHash(USER_HASH)).thenReturn(connections);
      when(testVisitRepository.findUserHashesWithTestsAfter(
          eq(Set.of("partner1", "partner2", "partner3", "partner4", "partner5")),
          any(LocalDate.class)
      )).thenReturn(Set.of("partner1", "partner2", "partner3"));

      NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

      assertThat(result).isNotNull();
      assertThat(result.testingActivityLevel()).isEqualTo("HIGH");
    }

    @Test
    @DisplayName("should return MEDIUM at exactly 30% boundary")
    void shouldReturnMediumAtExactly30Percent() {
      Jwt jwt = mockJwt();

      // 10 connections, 3 tested = 30% -> MEDIUM (>= 0.30)
      List<Connection> connections = List.of(
          buildConnection(USER_HASH, "partner1"),
          buildConnection("partner2", USER_HASH),
          buildConnection(USER_HASH, "partner3"),
          buildConnection("partner4", USER_HASH),
          buildConnection(USER_HASH, "partner5"),
          buildConnection("partner6", USER_HASH),
          buildConnection(USER_HASH, "partner7"),
          buildConnection("partner8", USER_HASH),
          buildConnection(USER_HASH, "partner9"),
          buildConnection("partner10", USER_HASH)
      );

      ExposureResponse exposure = buildExposureResponse(10, 20, 10, 40, 3, List.of());

      when(exposureService.getExposureSnapshot(jwt)).thenReturn(exposure);
      when(connectionRepository.findConfirmedByUserHash(USER_HASH)).thenReturn(connections);
      when(testVisitRepository.findUserHashesWithTestsAfter(
          eq(Set.of("partner1", "partner2", "partner3", "partner4", "partner5",
              "partner6", "partner7", "partner8", "partner9", "partner10")),
          any(LocalDate.class)
      )).thenReturn(Set.of("partner1", "partner2", "partner3"));

      NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

      assertThat(result).isNotNull();
      assertThat(result.testingActivityLevel()).isEqualTo("MEDIUM");
    }

    @Test
    @DisplayName("should return LOW just below 30% boundary")
    void shouldReturnLowJustBelow30Percent() {
      Jwt jwt = mockJwt();

      // 10 connections, 2 tested = 20% -> LOW (< 0.30)
      List<Connection> connections = List.of(
          buildConnection(USER_HASH, "partner1"),
          buildConnection("partner2", USER_HASH),
          buildConnection(USER_HASH, "partner3"),
          buildConnection("partner4", USER_HASH),
          buildConnection(USER_HASH, "partner5"),
          buildConnection("partner6", USER_HASH),
          buildConnection(USER_HASH, "partner7"),
          buildConnection("partner8", USER_HASH),
          buildConnection(USER_HASH, "partner9"),
          buildConnection("partner10", USER_HASH)
      );

      ExposureResponse exposure = buildExposureResponse(10, 20, 10, 40, 3, List.of());

      when(exposureService.getExposureSnapshot(jwt)).thenReturn(exposure);
      when(connectionRepository.findConfirmedByUserHash(USER_HASH)).thenReturn(connections);
      when(testVisitRepository.findUserHashesWithTestsAfter(
          eq(Set.of("partner1", "partner2", "partner3", "partner4", "partner5",
              "partner6", "partner7", "partner8", "partner9", "partner10")),
          any(LocalDate.class)
      )).thenReturn(Set.of("partner1", "partner2"));

      NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

      assertThat(result).isNotNull();
      assertThat(result.testingActivityLevel()).isEqualTo("LOW");
    }
  }

  @Nested
  @DisplayName("getNetworkHealth - exposure counting")
  class ExposureCounting {

    @Test
    @DisplayName("should count active and resolved exposures separately")
    void shouldCountActiveAndResolvedExposures() {
      Jwt jwt = mockJwt();

      List<ExposureItem> exposures = List.of(
          new ExposureItem("hiv", 2, 1, "0_30d", "active"),
          new ExposureItem("syphilis", 1, 2, "31_90d", "active"),
          new ExposureItem("chlamydia", 3, 1, "91_365d", "resolved"),
          new ExposureItem("gonorrhea", 1, 3, "0_30d", "resolved")
      );

      // 4 connections to get past privacy threshold
      List<Connection> connections = List.of(
          buildConnection(USER_HASH, "partner1"),
          buildConnection("partner2", USER_HASH),
          buildConnection(USER_HASH, "partner3"),
          buildConnection("partner4", USER_HASH)
      );

      ExposureResponse exposure = buildExposureResponse(4, 8, 4, 16, 3, exposures);

      when(exposureService.getExposureSnapshot(jwt)).thenReturn(exposure);
      when(connectionRepository.findConfirmedByUserHash(USER_HASH)).thenReturn(connections);
      when(testVisitRepository.findUserHashesWithTestsAfter(
          eq(Set.of("partner1", "partner2", "partner3", "partner4")),
          any(LocalDate.class)
      )).thenReturn(Set.of("partner1", "partner2", "partner3"));

      NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

      assertThat(result).isNotNull();
      assertThat(result.activeExposureCount()).isEqualTo(2);
      assertThat(result.recentlyResolvedCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("should return zero exposure counts when no exposures")
    void shouldReturnZeroExposureCountsWhenNone() {
      Jwt jwt = mockJwt();

      List<Connection> connections = List.of(
          buildConnection(USER_HASH, "partner1"),
          buildConnection("partner2", USER_HASH),
          buildConnection(USER_HASH, "partner3")
      );

      ExposureResponse exposure = buildExposureResponse(3, 6, 3, 12, 3, List.of());

      when(exposureService.getExposureSnapshot(jwt)).thenReturn(exposure);
      when(connectionRepository.findConfirmedByUserHash(USER_HASH)).thenReturn(connections);
      when(testVisitRepository.findUserHashesWithTestsAfter(
          eq(Set.of("partner1", "partner2", "partner3")),
          any(LocalDate.class)
      )).thenReturn(Set.of("partner1", "partner2"));

      NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

      assertThat(result).isNotNull();
      assertThat(result.activeExposureCount()).isZero();
      assertThat(result.recentlyResolvedCount()).isZero();
    }
  }

  @Nested
  @DisplayName("getNetworkHealth - network size fields")
  class NetworkSizeFields {

    @Test
    @DisplayName("should propagate network size fields from exposure snapshot")
    void shouldPropagateNetworkSizeFields() {
      Jwt jwt = mockJwt();

      List<Connection> connections = List.of(
          buildConnection(USER_HASH, "partner1"),
          buildConnection("partner2", USER_HASH),
          buildConnection(USER_HASH, "partner3"),
          buildConnection("partner4", USER_HASH)
      );

      ExposureResponse exposure = buildExposureResponse(4, 12, 8, 24, 3, List.of());

      when(exposureService.getExposureSnapshot(jwt)).thenReturn(exposure);
      when(connectionRepository.findConfirmedByUserHash(USER_HASH)).thenReturn(connections);
      when(testVisitRepository.findUserHashesWithTestsAfter(
          eq(Set.of("partner1", "partner2", "partner3", "partner4")),
          any(LocalDate.class)
      )).thenReturn(Set.of("partner1"));

      NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

      assertThat(result).isNotNull();
      assertThat(result.connectionCount()).isEqualTo(4);
      assertThat(result.secondDegreeCount()).isEqualTo(12);
      assertThat(result.thirdDegreeCount()).isEqualTo(8);
      assertThat(result.totalNetworkSize()).isEqualTo(24);
      assertThat(result.maxDepth()).isEqualTo(3);
      assertThat(result.computedAt()).isNotNull();
    }
  }
}
