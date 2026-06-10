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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests for {@link ClientErrorController}.
 *
 * <p>The endpoint is public (errors also happen on login/signup pages where
 * no session exists) and write-only: it logs and returns 204.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ClientErrorControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  @DisplayName("POST /api/public/client-errors accepts a report without authentication")
  void acceptsReportWithoutAuth() throws Exception {
    mockMvc.perform(post("/api/public/client-errors")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "message": "TypeError: x is undefined",
                  "stack": "TypeError: x is undefined\\n  at App.tsx:10",
                  "url": "https://www.navilla.app/dashboard",
                  "userAgent": "Mozilla/5.0"
                }
                """))
        .andExpect(status().isNoContent());
  }

  @Test
  @DisplayName("rejects a blank message")
  void rejectsBlankMessage() throws Exception {
    mockMvc.perform(post("/api/public/client-errors")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"message\": \"\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("rejects an oversized stack")
  void rejectsOversizedStack() throws Exception {
    String hugeStack = "x".repeat(5001);
    mockMvc.perform(post("/api/public/client-errors")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"message\": \"boom\", \"stack\": \"" + hugeStack + "\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("sanitize collapses newlines and control chars to block log forging")
  void sanitizeBlocksLogForging() {
    String forged = "boom\n2026-06-09 WARN fake-line\r\n\tmore";
    assertThat(ClientErrorController.sanitize(forged))
        .isEqualTo("boom 2026-06-09 WARN fake-line more")
        .doesNotContain("\n");
  }
}
