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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import app.navilla.repository.PushSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests for {@link PushSubscriptionController}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PushSubscriptionControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private PushSubscriptionRepository pushSubscriptionRepository;

  private static final String USER_EMAIL = "push-test@example.com";

  @BeforeEach
  void setup() {
    pushSubscriptionRepository.deleteAll();
  }

  @Test
  @DisplayName("should return 401 without authentication")
  void shouldReturnUnauthorized() throws Exception {
    mockMvc.perform(get("/api/push/subscriptions"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("POST /api/push/subscribe should return 201 with subscription id")
  void subscribeShouldReturn201() throws Exception {
    mockMvc.perform(post("/api/push/subscribe")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint",
                  "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8p8REfOGQ",
                  "auth": "tBHItJI5svbpC7o8Q15Zkg"
                }
                """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists());
  }

  @Test
  @DisplayName("POST /api/push/subscribe should return 400 for missing endpoint")
  void subscribeShouldReturn400ForMissingEndpoint() throws Exception {
    mockMvc.perform(post("/api/push/subscribe")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "p256dh": "some-key",
                  "auth": "some-auth"
                }
                """))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("GET /api/push/subscriptions should return 200 with list")
  void listSubscriptionsShouldReturn200() throws Exception {
    // Subscribe first
    mockMvc.perform(post("/api/push/subscribe")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint",
                  "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8p8REfOGQ",
                  "auth": "tBHItJI5svbpC7o8Q15Zkg"
                }
                """))
        .andExpect(status().isCreated());

    // List subscriptions
    mockMvc.perform(get("/api/push/subscriptions")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$[0].id").exists())
        .andExpect(jsonPath("$[0].createdAt").exists());
  }

  @Test
  @DisplayName("DELETE /api/push/subscriptions/{id} should return 204")
  void unsubscribeShouldReturn204() throws Exception {
    // Subscribe first
    String responseBody = mockMvc.perform(post("/api/push/subscribe")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint",
                  "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8p8REfOGQ",
                  "auth": "tBHItJI5svbpC7o8Q15Zkg"
                }
                """))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();

    // Extract the subscription id
    String subscriptionId = new com.fasterxml.jackson.databind.ObjectMapper()
        .readTree(responseBody).get("id").asText();

    // Delete subscription
    mockMvc.perform(delete("/api/push/subscriptions/" + subscriptionId)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isNoContent());

    // Verify it's gone
    mockMvc.perform(get("/api/push/subscriptions")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$").isEmpty());
  }

  @Test
  @DisplayName("DELETE /api/push/subscriptions/{id} should return 404 for non-existent id")
  void unsubscribeShouldReturn404ForNonExistent() throws Exception {
    mockMvc.perform(delete("/api/push/subscriptions/" + UUID.randomUUID())
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("GET /api/push/vapid-public-key should return 200 without authentication")
  void vapidPublicKeyShouldBePublic() throws Exception {
    mockMvc.perform(get("/api/push/vapid-public-key"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.publicKey").exists());
  }

  @Test
  @DisplayName("GET /api/push/vapid-public-key should return configured key")
  void vapidPublicKeyShouldReturnConfiguredKey() throws Exception {
    mockMvc.perform(get("/api/push/vapid-public-key"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.publicKey").value("test-vapid-public-key"));
  }
}
