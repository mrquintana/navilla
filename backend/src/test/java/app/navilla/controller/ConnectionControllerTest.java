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

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import app.navilla.entity.Connection;
import app.navilla.entity.ConnectionStatus;
import app.navilla.entity.User;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for {@link ConnectionController}.
 *
 * @author Navilla Team
 * @since 2026-01-31
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = {
    "navilla.encryption.pepper=test-pepper-for-unit-tests",
    "navilla.supabase.url=https://test.supabase.co",
    "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=https://test.supabase.co/auth/v1/.well-known/jwks.json",
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ConnectionControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ConnectionRepository connectionRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private EncryptionService encryptionService;

  private static final String USER_A_EMAIL = "usera@example.com";
  private static final String USER_B_EMAIL = "userb@example.com";
  private static final UUID USER_A_SUPABASE_ID = UUID.randomUUID();
  private static final UUID USER_B_SUPABASE_ID = UUID.randomUUID();

  private User userA;
  private User userB;

  @BeforeEach
  void setUp() {
    connectionRepository.deleteAll();
    userRepository.deleteAll();

    userA = createUser(USER_A_EMAIL, USER_A_SUPABASE_ID);
    userB = createUser(USER_B_EMAIL, USER_B_SUPABASE_ID);
  }

  private User createUser(String email, UUID supabaseId) {
    User user = User.builder()
        .supabaseId(supabaseId)
        .emailHash(encryptionService.hashEmail(email))
        .emailEncrypted(encryptionService.encryptToBytes(email))
        .verified(true)
        .build();
    return userRepository.save(user);
  }

  @Nested
  @DisplayName("POST /api/connections")
  class CreateConnectionTests {

    @Test
    @DisplayName("should create connection request with valid JWT")
    void shouldCreateConnectionRequest() throws Exception {
      mockMvc.perform(post("/api/connections")
              .with(jwt().jwt(builder -> builder
                  .subject(USER_A_SUPABASE_ID.toString())
                  .claim("email", USER_A_EMAIL)))
              .contentType(MediaType.APPLICATION_JSON)
              .content("{\"recipientEmail\": \"" + USER_B_EMAIL + "\"}"))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.id").exists())
          .andExpect(jsonPath("$.status").value("PENDING"))
          .andExpect(jsonPath("$.isRequester").value(true));
    }

    @Test
    @DisplayName("should return 401 without authentication")
    void shouldReturnUnauthorizedWithoutAuth() throws Exception {
      mockMvc.perform(post("/api/connections")
              .contentType(MediaType.APPLICATION_JSON)
              .content("{\"recipientEmail\": \"" + USER_B_EMAIL + "\"}"))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("should return 400 for invalid email")
    void shouldReturnBadRequestForInvalidEmail() throws Exception {
      mockMvc.perform(post("/api/connections")
              .with(jwt().jwt(builder -> builder
                  .subject(USER_A_SUPABASE_ID.toString())
                  .claim("email", USER_A_EMAIL)))
              .contentType(MediaType.APPLICATION_JSON)
              .content("{\"recipientEmail\": \"not-an-email\"}"))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("should return 400 when connecting to self")
    void shouldReturnBadRequestWhenConnectingToSelf() throws Exception {
      mockMvc.perform(post("/api/connections")
              .with(jwt().jwt(builder -> builder
                  .subject(USER_A_SUPABASE_ID.toString())
                  .claim("email", USER_A_EMAIL)))
              .contentType(MediaType.APPLICATION_JSON)
              .content("{\"recipientEmail\": \"" + USER_A_EMAIL + "\"}"))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("should return 409 when connection already exists")
    void shouldReturnConflictWhenConnectionExists() throws Exception {
      // Create existing connection
      Connection existing = Connection.builder()
          .requesterHash(encryptionService.hashEmail(USER_A_EMAIL))
          .recipientHash(encryptionService.hashEmail(USER_B_EMAIL))
          .status(ConnectionStatus.PENDING)
          .build();
      connectionRepository.save(existing);

      mockMvc.perform(post("/api/connections")
              .with(jwt().jwt(builder -> builder
                  .subject(USER_A_SUPABASE_ID.toString())
                  .claim("email", USER_A_EMAIL)))
              .contentType(MediaType.APPLICATION_JSON)
              .content("{\"recipientEmail\": \"" + USER_B_EMAIL + "\"}"))
          .andExpect(status().isConflict());
    }
  }

  @Nested
  @DisplayName("GET /api/connections")
  class GetConnectionsTests {

    @Test
    @DisplayName("should return all connections for authenticated user")
    void shouldReturnAllConnections() throws Exception {
      // Create a connection
      Connection connection = Connection.builder()
          .requesterHash(encryptionService.hashEmail(USER_A_EMAIL))
          .recipientHash(encryptionService.hashEmail(USER_B_EMAIL))
          .status(ConnectionStatus.CONFIRMED)
          .build();
      connectionRepository.save(connection);

      mockMvc.perform(get("/api/connections")
              .with(jwt().jwt(builder -> builder
                  .subject(USER_A_SUPABASE_ID.toString())
                  .claim("email", USER_A_EMAIL))))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$", hasSize(1)))
          .andExpect(jsonPath("$[0].status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("should return empty list when no connections")
    void shouldReturnEmptyListWhenNoConnections() throws Exception {
      mockMvc.perform(get("/api/connections")
              .with(jwt().jwt(builder -> builder
                  .subject(USER_A_SUPABASE_ID.toString())
                  .claim("email", USER_A_EMAIL))))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$", hasSize(0)));
    }
  }

  @Nested
  @DisplayName("GET /api/connections/stats")
  class GetStatsTests {

    @Test
    @DisplayName("should return connection statistics")
    void shouldReturnConnectionStats() throws Exception {
      mockMvc.perform(get("/api/connections/stats")
              .with(jwt().jwt(builder -> builder
                  .subject(USER_A_SUPABASE_ID.toString())
                  .claim("email", USER_A_EMAIL))))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.confirmedCount").value(0))
          .andExpect(jsonPath("$.pendingIncomingCount").value(0))
          .andExpect(jsonPath("$.pendingSentCount").value(0));
    }
  }

  @Nested
  @DisplayName("POST /api/connections/{id}/accept")
  class AcceptConnectionTests {

    @Test
    @DisplayName("should accept pending connection request")
    void shouldAcceptPendingConnection() throws Exception {
      Connection connection = Connection.builder()
          .requesterHash(encryptionService.hashEmail(USER_A_EMAIL))
          .recipientHash(encryptionService.hashEmail(USER_B_EMAIL))
          .status(ConnectionStatus.PENDING)
          .build();
      connection = connectionRepository.save(connection);

      mockMvc.perform(post("/api/connections/" + connection.getId() + "/accept")
              .with(jwt().jwt(builder -> builder
                  .subject(USER_B_SUPABASE_ID.toString())
                  .claim("email", USER_B_EMAIL))))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.status").value("CONFIRMED"))
          .andExpect(jsonPath("$.confirmedAt").exists());
    }

    @Test
    @DisplayName("should return 404 for non-existent connection")
    void shouldReturnNotFoundForNonExistentConnection() throws Exception {
      mockMvc.perform(post("/api/connections/" + UUID.randomUUID() + "/accept")
              .with(jwt().jwt(builder -> builder
                  .subject(USER_B_SUPABASE_ID.toString())
                  .claim("email", USER_B_EMAIL))))
          .andExpect(status().isNotFound());
    }
  }

  @Nested
  @DisplayName("POST /api/connections/{id}/deny")
  class DenyConnectionTests {

    @Test
    @DisplayName("should deny pending connection request")
    void shouldDenyPendingConnection() throws Exception {
      Connection connection = Connection.builder()
          .requesterHash(encryptionService.hashEmail(USER_A_EMAIL))
          .recipientHash(encryptionService.hashEmail(USER_B_EMAIL))
          .status(ConnectionStatus.PENDING)
          .build();
      connection = connectionRepository.save(connection);

      mockMvc.perform(post("/api/connections/" + connection.getId() + "/deny")
              .with(jwt().jwt(builder -> builder
                  .subject(USER_B_SUPABASE_ID.toString())
                  .claim("email", USER_B_EMAIL))))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.status").value("DENIED"));
    }
  }

  @Nested
  @DisplayName("DELETE /api/connections/{id}")
  class CancelConnectionTests {

    @Test
    @DisplayName("should cancel pending connection request")
    void shouldCancelPendingConnection() throws Exception {
      Connection connection = Connection.builder()
          .requesterHash(encryptionService.hashEmail(USER_A_EMAIL))
          .recipientHash(encryptionService.hashEmail(USER_B_EMAIL))
          .status(ConnectionStatus.PENDING)
          .build();
      connection = connectionRepository.save(connection);

      mockMvc.perform(delete("/api/connections/" + connection.getId())
              .with(jwt().jwt(builder -> builder
                  .subject(USER_A_SUPABASE_ID.toString())
                  .claim("email", USER_A_EMAIL))))
          .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("should return 409 when non-requester tries to cancel")
    void shouldReturnConflictWhenNonRequesterCancels() throws Exception {
      Connection connection = Connection.builder()
          .requesterHash(encryptionService.hashEmail(USER_A_EMAIL))
          .recipientHash(encryptionService.hashEmail(USER_B_EMAIL))
          .status(ConnectionStatus.PENDING)
          .build();
      connection = connectionRepository.save(connection);

      mockMvc.perform(delete("/api/connections/" + connection.getId())
              .with(jwt().jwt(builder -> builder
                  .subject(USER_B_SUPABASE_ID.toString())
                  .claim("email", USER_B_EMAIL))))
          .andExpect(status().isConflict());
    }
  }
}
