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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import app.navilla.dto.ConnectionResponse;
import app.navilla.dto.ConnectionStatsResponse;
import app.navilla.dto.CreateConnectionRequest;
import app.navilla.entity.Connection;
import app.navilla.entity.ConnectionStatus;
import app.navilla.entity.ConnectionType;
import app.navilla.entity.ProfileVisibility;
import app.navilla.entity.User;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.metrics.ConnectionMetrics;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Unit tests for {@link ConnectionService}.
 *
 * @author Navilla Team
 * @since 2026-01-31
 */
@ExtendWith(MockitoExtension.class)
class ConnectionServiceTest {

  @Mock
  private ConnectionRepository connectionRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private NotificationService notificationService;

  @Mock
  private ConnectionMetrics connectionMetrics;

  @Mock
  private Jwt jwt;

  @InjectMocks
  private ConnectionService connectionService;

  private static final String REQUESTER_EMAIL = "requester@example.com";
  private static final String RECIPIENT_EMAIL = "recipient@example.com";
  private static final String REQUESTER_HASH = "requester_hash_123";
  private static final String RECIPIENT_HASH = "recipient_hash_456";
  private static final UUID CONNECTION_ID = UUID.randomUUID();

  private void stubRequesterAuth() {
    when(jwt.getClaimAsString("email")).thenReturn(REQUESTER_EMAIL);
    when(encryptionService.hashEmail(REQUESTER_EMAIL)).thenReturn(REQUESTER_HASH);
  }

  private void stubRecipientAuth() {
    when(jwt.getClaimAsString("email")).thenReturn(RECIPIENT_EMAIL);
    when(encryptionService.hashEmail(RECIPIENT_EMAIL)).thenReturn(RECIPIENT_HASH);
  }

  @Nested
  @DisplayName("createConnection")
  class CreateConnectionTests {

    @Test
    @DisplayName("should create connection request successfully")
    void shouldCreateConnectionSuccessfully() {
      stubRequesterAuth();
      when(encryptionService.hashEmail(RECIPIENT_EMAIL)).thenReturn(RECIPIENT_HASH);
      User recipient = User.builder()
          .emailHash(RECIPIENT_HASH)
          .profileVisibility(ProfileVisibility.PRIVATE)
          .build();
      when(userRepository.findByEmailHash(RECIPIENT_HASH)).thenReturn(Optional.of(recipient));
      when(connectionRepository.findBetweenUsers(REQUESTER_HASH, RECIPIENT_HASH))
          .thenReturn(Optional.empty());
      when(connectionRepository.save(any(Connection.class))).thenAnswer(invocation -> {
        Connection conn = invocation.getArgument(0);
        conn.setId(CONNECTION_ID);
        conn.setRequestedAt(OffsetDateTime.now());
        return conn;
      });

      CreateConnectionRequest request = new CreateConnectionRequest(RECIPIENT_EMAIL);
      connectionService.createConnection(jwt, request);

      ArgumentCaptor<Connection> captor = ArgumentCaptor.forClass(Connection.class);
      verify(connectionRepository).save(captor.capture());
      assertThat(captor.getValue().getRequesterHash()).isEqualTo(REQUESTER_HASH);
      assertThat(captor.getValue().getRecipientHash()).isEqualTo(RECIPIENT_HASH);
    }

    @Test
    @DisplayName("should throw exception when connecting to self")
    void shouldThrowExceptionWhenConnectingToSelf() {
      stubRequesterAuth();
      when(userRepository.findByEmailHash(REQUESTER_HASH)).thenReturn(
          Optional.of(User.builder().emailHash(REQUESTER_HASH).build()));
      CreateConnectionRequest request = new CreateConnectionRequest(REQUESTER_EMAIL);

      assertThatThrownBy(() -> connectionService.createConnection(jwt, request))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("connection.error.selfConnection");

      verify(connectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("should throw exception when connection already exists")
    void shouldThrowExceptionWhenConnectionExists() {
      stubRequesterAuth();
      when(encryptionService.hashEmail(RECIPIENT_EMAIL)).thenReturn(RECIPIENT_HASH);
      when(userRepository.findByEmailHash(RECIPIENT_HASH)).thenReturn(
          Optional.of(User.builder().emailHash(RECIPIENT_HASH).build()));
      Connection existing = Connection.builder()
          .id(CONNECTION_ID)
          .requesterHash(REQUESTER_HASH)
          .recipientHash(RECIPIENT_HASH)
          .status(ConnectionStatus.PENDING)
          .build();
      when(connectionRepository.findBetweenUsers(REQUESTER_HASH, RECIPIENT_HASH))
          .thenReturn(Optional.of(existing));
      CreateConnectionRequest request = new CreateConnectionRequest(RECIPIENT_EMAIL);

      assertThatThrownBy(() -> connectionService.createConnection(jwt, request))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("connection.error.alreadyExists");

      verify(connectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("should not create connection for unknown recipient")
    void shouldIgnoreUnknownRecipient() {
      stubRequesterAuth();
      when(encryptionService.hashEmail(RECIPIENT_EMAIL)).thenReturn(RECIPIENT_HASH);
      when(userRepository.findByEmailHash(RECIPIENT_HASH)).thenReturn(Optional.empty());
      CreateConnectionRequest request = new CreateConnectionRequest(RECIPIENT_EMAIL);

      connectionService.createConnection(jwt, request);

      verify(connectionRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("acceptConnection")
  class AcceptConnectionTests {

    @Test
    @DisplayName("should accept pending connection successfully")
    void shouldAcceptConnectionSuccessfully() {
      stubRecipientAuth();

      Connection connection = Connection.builder()
          .id(CONNECTION_ID)
          .requesterHash(REQUESTER_HASH)
          .recipientHash(RECIPIENT_HASH)
          .status(ConnectionStatus.PENDING)
          .requestedAt(OffsetDateTime.now())
          .build();

      when(connectionRepository.findById(CONNECTION_ID)).thenReturn(Optional.of(connection));
      when(connectionRepository.save(any(Connection.class))).thenAnswer(i -> i.getArgument(0));

      ConnectionResponse response = connectionService.acceptConnection(jwt, CONNECTION_ID);

      assertThat(response.status()).isEqualTo(ConnectionStatus.CONFIRMED);
      assertThat(response.connectionType()).isEqualTo(ConnectionType.EXPLICIT.name());
      assertThat(response.confirmedAt()).isNotNull();
    }

    @Test
    @DisplayName("should throw exception when connection not found")
    void shouldThrowExceptionWhenConnectionNotFound() {
      stubRecipientAuth();
      when(connectionRepository.findById(CONNECTION_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> connectionService.acceptConnection(jwt, CONNECTION_ID))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessage("connection.error.notFound");
    }

    @Test
    @DisplayName("should throw exception when user is not recipient")
    void shouldThrowExceptionWhenNotRecipient() {
      stubRecipientAuth();
      Connection connection = Connection.builder()
          .id(CONNECTION_ID)
          .requesterHash(REQUESTER_HASH)
          .recipientHash("other_user_hash")
          .status(ConnectionStatus.PENDING)
          .build();

      when(connectionRepository.findById(CONNECTION_ID)).thenReturn(Optional.of(connection));

      assertThatThrownBy(() -> connectionService.acceptConnection(jwt, CONNECTION_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("connection.error.notRecipient");
    }

    @Test
    @DisplayName("should throw exception when connection not pending")
    void shouldThrowExceptionWhenNotPending() {
      stubRecipientAuth();

      Connection connection = Connection.builder()
          .id(CONNECTION_ID)
          .requesterHash(REQUESTER_HASH)
          .recipientHash(RECIPIENT_HASH)
          .status(ConnectionStatus.CONFIRMED)
          .build();

      when(connectionRepository.findById(CONNECTION_ID)).thenReturn(Optional.of(connection));

      assertThatThrownBy(() -> connectionService.acceptConnection(jwt, CONNECTION_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("connection.error.notPending");
    }
  }

  @Nested
  @DisplayName("denyConnection")
  class DenyConnectionTests {

    @Test
    @DisplayName("should deny pending connection successfully")
    void shouldDenyConnectionSuccessfully() {
      stubRecipientAuth();

      Connection connection = Connection.builder()
          .id(CONNECTION_ID)
          .requesterHash(REQUESTER_HASH)
          .recipientHash(RECIPIENT_HASH)
          .status(ConnectionStatus.PENDING)
          .requestedAt(OffsetDateTime.now())
          .build();

      when(connectionRepository.findById(CONNECTION_ID)).thenReturn(Optional.of(connection));
      when(connectionRepository.save(any(Connection.class))).thenAnswer(i -> i.getArgument(0));

      ConnectionResponse response = connectionService.denyConnection(jwt, CONNECTION_ID);

      assertThat(response.status()).isEqualTo(ConnectionStatus.DENIED);
    }
  }

  @Nested
  @DisplayName("cancelConnection")
  class CancelConnectionTests {

    @Test
    @DisplayName("should cancel pending connection successfully")
    void shouldCancelConnectionSuccessfully() {
      stubRequesterAuth();
      Connection connection = Connection.builder()
          .id(CONNECTION_ID)
          .requesterHash(REQUESTER_HASH)
          .recipientHash(RECIPIENT_HASH)
          .status(ConnectionStatus.PENDING)
          .build();

      when(connectionRepository.findById(CONNECTION_ID)).thenReturn(Optional.of(connection));

      connectionService.cancelConnection(jwt, CONNECTION_ID);

      verify(connectionRepository).delete(connection);
    }

    @Test
    @DisplayName("should throw exception when user is not requester")
    void shouldThrowExceptionWhenNotRequester() {
      stubRequesterAuth();
      Connection connection = Connection.builder()
          .id(CONNECTION_ID)
          .requesterHash("other_user_hash")
          .recipientHash(REQUESTER_HASH)
          .status(ConnectionStatus.PENDING)
          .build();

      when(connectionRepository.findById(CONNECTION_ID)).thenReturn(Optional.of(connection));

      assertThatThrownBy(() -> connectionService.cancelConnection(jwt, CONNECTION_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("connection.error.notRequester");

      verify(connectionRepository, never()).delete(any());
    }
  }

  @Nested
  @DisplayName("getConnections")
  class GetConnectionsTests {

    @Test
    @DisplayName("should return all connections for user")
    void shouldReturnAllConnectionsForUser() {
      stubRequesterAuth();
      Connection conn1 = Connection.builder()
          .id(UUID.randomUUID())
          .requesterHash(REQUESTER_HASH)
          .recipientHash("other1")
          .status(ConnectionStatus.CONFIRMED)
          .requestedAt(OffsetDateTime.now())
          .build();

      Connection conn2 = Connection.builder()
          .id(UUID.randomUUID())
          .requesterHash("other2")
          .recipientHash(REQUESTER_HASH)
          .status(ConnectionStatus.PENDING)
          .requestedAt(OffsetDateTime.now())
          .build();

      when(connectionRepository.findAllByUserHash(REQUESTER_HASH))
          .thenReturn(List.of(conn1, conn2));

      List<ConnectionResponse> connections = connectionService.getConnections(jwt);

      assertThat(connections).hasSize(2);
      assertThat(connections.get(0).isRequester()).isTrue();
      assertThat(connections.get(0).connectionType()).isEqualTo(ConnectionType.EXPLICIT.name());
      assertThat(connections.get(1).isRequester()).isFalse();
      assertThat(connections.get(1).connectionType()).isEqualTo(ConnectionType.EXPLICIT.name());
    }
  }

  @Nested
  @DisplayName("getConfirmedConnectionsPaged")
  class GetConfirmedConnectionsPagedTests {

    @Test
    @DisplayName("should return paginated results")
    void shouldReturnPaginatedResults() {
      stubRequesterAuth();

      Connection conn = Connection.builder()
          .id(UUID.randomUUID())
          .requesterHash(REQUESTER_HASH)
          .recipientHash("other_hash")
          .status(ConnectionStatus.CONFIRMED)
          .requestedAt(OffsetDateTime.now())
          .confirmedAt(OffsetDateTime.now())
          .build();

      Page<Connection> page = new PageImpl<>(List.of(conn), PageRequest.of(0, 10), 1);
      when(connectionRepository.findConfirmedByUserHashPaged(REQUESTER_HASH, PageRequest.of(0, 10)))
          .thenReturn(page);
      when(userRepository.findByEmailHashIn(any())).thenReturn(List.of());

      Page<ConnectionResponse> result = connectionService.getConfirmedConnectionsPaged(jwt, 0, 10, null);

      assertThat(result.getContent()).hasSize(1);
      assertThat(result.getTotalElements()).isEqualTo(1);
      assertThat(result.getNumber()).isEqualTo(0);
    }
  }

  @Nested
  @DisplayName("getStats")
  class GetStatsTests {

    @Test
    @DisplayName("should return correct connection statistics")
    void shouldReturnCorrectStats() {
      stubRequesterAuth();
      when(connectionRepository.countConfirmedByUserHash(REQUESTER_HASH)).thenReturn(5L);
      when(connectionRepository.countByRecipientHashAndStatus(
          REQUESTER_HASH, ConnectionStatus.PENDING)).thenReturn(3L);
      when(connectionRepository.findByRequesterHashAndStatus(
          REQUESTER_HASH, ConnectionStatus.PENDING)).thenReturn(List.of(
          Connection.builder()
              .requesterHash(REQUESTER_HASH)
              .recipientHash("recipient-a")
              .status(ConnectionStatus.PENDING)
              .requestedAt(OffsetDateTime.now())
              .build(),
          Connection.builder()
              .requesterHash(REQUESTER_HASH)
              .recipientHash("recipient-b")
              .status(ConnectionStatus.PENDING)
              .requestedAt(OffsetDateTime.now())
              .build()
      ));

      User recipientA = User.builder()
          .emailHash("recipient-a")
          .profileVisibility(ProfileVisibility.PUBLIC)
          .build();
      User recipientB = User.builder()
          .emailHash("recipient-b")
          .profileVisibility(ProfileVisibility.PUBLIC)
          .build();
      when(userRepository.findByEmailHashIn(Set.of("recipient-a", "recipient-b")))
          .thenReturn(List.of(recipientA, recipientB));

      ConnectionStatsResponse stats = connectionService.getStats(jwt);

      assertThat(stats.confirmedCount()).isEqualTo(5);
      assertThat(stats.pendingIncomingCount()).isEqualTo(3);
      assertThat(stats.pendingSentCount()).isEqualTo(2);
    }
  }
}
