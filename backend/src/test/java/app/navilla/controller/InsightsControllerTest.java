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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests for {@link InsightsController}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InsightsControllerTest {

  @Autowired
  private MockMvc mockMvc;

  private static final String USER_EMAIL = "insights-test@example.com";

  @Test
  @DisplayName("GET /api/insights should return 200 with authenticated user")
  void shouldReturn200WithAuthentication() throws Exception {
    mockMvc.perform(get("/api/insights")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.activity").exists())
        .andExpect(jsonPath("$.activity.totalEncounters").isNumber())
        .andExpect(jsonPath("$.activity.encountersThisMonth").isNumber())
        .andExpect(jsonPath("$.activity.encountersByMonth").isMap())
        .andExpect(jsonPath("$.activity.protectionRate").isNumber())
        .andExpect(jsonPath("$.testing").exists())
        .andExpect(jsonPath("$.testing.daysSinceLastTest").isNumber())
        .andExpect(jsonPath("$.testing.testsThisYear").isNumber())
        .andExpect(jsonPath("$.testing.conditionsCovered").isNumber())
        .andExpect(jsonPath("$.testing.totalStandardConditions").isNumber())
        .andExpect(jsonPath("$.testing.coverageMap").isMap())
        .andExpect(jsonPath("$.prevention").exists())
        .andExpect(jsonPath("$.prevention.currentPrepStreakDays").isNumber())
        .andExpect(jsonPath("$.prevention.longestPrepStreakDays").isNumber())
        .andExpect(jsonPath("$.prevention.completedVaccines").isArray())
        .andExpect(jsonPath("$.prevention.pendingVaccines").isArray())
        .andExpect(jsonPath("$.prevention.activeReminders").isNumber());
  }

  @Test
  @DisplayName("GET /api/insights should return 401 without authentication")
  void shouldReturn401WithoutAuthentication() throws Exception {
    mockMvc.perform(get("/api/insights"))
        .andExpect(status().isUnauthorized());
  }
}
