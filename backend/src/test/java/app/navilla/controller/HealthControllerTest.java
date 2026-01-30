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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests for {@link HealthController}.
 *
 * <p>Tests verify both public and authenticated health endpoints
 * respond correctly with expected status and content.
 *
 * @author Navilla Team
 * @since 2026-01-30
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "navilla.encryption.pepper=test-pepper-for-unit-tests",
    "navilla.supabase.url=https://test.supabase.co",
    "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=https://test.supabase.co/auth/v1/.well-known/jwks.json",
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class HealthControllerTest {

  @Autowired
  private MockMvc mockMvc;

  /**
   * Tests that the public health endpoint returns UP status.
   *
   * @throws Exception if request fails
   */
  @Test
  @DisplayName("GET /api/health should return UP status without authentication")
  void healthEndpointShouldReturnUpStatus() throws Exception {
    mockMvc.perform(get("/api/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"))
        .andExpect(jsonPath("$.service").exists())
        .andExpect(jsonPath("$.timestamp").exists());
  }

  /**
   * Tests that the authenticated health endpoint requires authentication.
   *
   * @throws Exception if request fails
   */
  @Test
  @DisplayName("GET /api/auth/health should require authentication")
  void authenticatedHealthEndpointShouldRequireAuth() throws Exception {
    mockMvc.perform(get("/api/auth/health"))
        .andExpect(status().isUnauthorized());
  }

  /**
   * Tests that the authenticated health endpoint works with valid JWT.
   *
   * @throws Exception if request fails
   */
  @Test
  @DisplayName("GET /api/auth/health should return UP status when authenticated with JWT")
  void authenticatedHealthEndpointShouldReturnUpStatusWhenAuthenticated() throws Exception {
    mockMvc.perform(get("/api/auth/health")
            .with(jwt()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"))
        .andExpect(jsonPath("$.authenticated").value(true))
        .andExpect(jsonPath("$.service").exists())
        .andExpect(jsonPath("$.timestamp").exists());
  }
}
