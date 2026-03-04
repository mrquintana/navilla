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

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import app.navilla.entity.User;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for {@link ReciprocityController}.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class ReciprocityControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private EncryptionService encryptionService;

  private static final String USER_EMAIL = "reciprocity-test@example.com";
  private static final UUID USER_SUPABASE_ID = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    userRepository.deleteAll();

    User user = User.builder()
        .supabaseId(USER_SUPABASE_ID)
        .emailHash(encryptionService.hashEmail(USER_EMAIL))
        .emailEncrypted(encryptionService.encryptToBytes(USER_EMAIL))
        .verified(true)
        .build();
    userRepository.save(user);
  }

  @Test
  @DisplayName("should return 401 without authentication")
  void shouldReturnUnauthorizedWithoutAuth() throws Exception {
    mockMvc.perform(get("/api/reciprocity/status"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("GET /status returns 200 with reciprocity status")
  void shouldReturnStatus() throws Exception {
    mockMvc.perform(get("/api/reciprocity/status")
            .with(jwt().jwt(builder -> builder
                .subject(USER_SUPABASE_ID.toString())
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.optedIn").value(false))
        .andExpect(jsonPath("$.optedInAt").doesNotExist())
        .andExpect(jsonPath("$.optedOutAt").doesNotExist());
  }

  @Test
  @DisplayName("POST /opt-in returns 200 and sets optedIn to true")
  void shouldOptIn() throws Exception {
    mockMvc.perform(post("/api/reciprocity/opt-in")
            .with(jwt().jwt(builder -> builder
                .subject(USER_SUPABASE_ID.toString())
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.optedIn").value(true))
        .andExpect(jsonPath("$.optedInAt").exists());
  }

  @Test
  @DisplayName("POST /opt-out returns 200 after opting in first")
  void shouldOptOut() throws Exception {
    // First opt in
    mockMvc.perform(post("/api/reciprocity/opt-in")
            .with(jwt().jwt(builder -> builder
                .subject(USER_SUPABASE_ID.toString())
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk());

    // Then opt out
    mockMvc.perform(post("/api/reciprocity/opt-out")
            .with(jwt().jwt(builder -> builder
                .subject(USER_SUPABASE_ID.toString())
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.optedIn").value(false))
        .andExpect(jsonPath("$.optedOutAt").exists());
  }

  @Test
  @DisplayName("POST /opt-in returns 409 when already opted in")
  void shouldReturn409WhenAlreadyOptedIn() throws Exception {
    // First opt in
    mockMvc.perform(post("/api/reciprocity/opt-in")
            .with(jwt().jwt(builder -> builder
                .subject(USER_SUPABASE_ID.toString())
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk());

    // Try to opt in again
    mockMvc.perform(post("/api/reciprocity/opt-in")
            .with(jwt().jwt(builder -> builder
                .subject(USER_SUPABASE_ID.toString())
                .claim("email", USER_EMAIL))))
        .andExpect(status().isConflict());
  }

  @Test
  @DisplayName("POST /opt-out returns 409 when not opted in")
  void shouldReturn409WhenNotOptedIn() throws Exception {
    mockMvc.perform(post("/api/reciprocity/opt-out")
            .with(jwt().jwt(builder -> builder
                .subject(USER_SUPABASE_ID.toString())
                .claim("email", USER_EMAIL))))
        .andExpect(status().isConflict());
  }
}
