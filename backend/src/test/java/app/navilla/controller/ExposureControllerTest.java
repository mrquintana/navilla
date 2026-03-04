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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExposureControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  @DisplayName("should return reciprocity required message for user not opted in")
  void shouldReturnReciprocityRequiredForNonOptedInUser() throws Exception {
    mockMvc.perform(get("/api/exposures")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", "exposure@example.com"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.connectionCount").value(0))
        .andExpect(jsonPath("$.message").value("exposure.reciprocityRequired"))
        .andExpect(jsonPath("$.exposures").isEmpty());
  }
}
