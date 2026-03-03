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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.navilla.repository.ReminderRepository;
import app.navilla.repository.VaccinationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VaccinationControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private VaccinationRepository vaccinationRepository;

  @Autowired
  private ReminderRepository reminderRepository;

  @Autowired
  private ObjectMapper objectMapper;

  private static final String USER_EMAIL = "vaccination@example.com";

  @BeforeEach
  void setup() {
    reminderRepository.deleteAll();
    vaccinationRepository.deleteAll();
  }

  @Test
  @DisplayName("should return 401 without authentication")
  void shouldReturnUnauthorized() throws Exception {
    mockMvc.perform(get("/api/vaccinations"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("should create vaccination dose and return 200")
  void shouldCreateVaccination() throws Exception {
    mockMvc.perform(post("/api/vaccinations")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "vaccineType": "HPV",
                  "doseNumber": 1,
                  "administeredDate": "2026-03-01",
                  "location": "Clinic Roma",
                  "notes": "First dose"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.vaccineType").value("HPV"))
        .andExpect(jsonPath("$.doseNumber").value(1))
        .andExpect(jsonPath("$.totalDoses").value(3))
        .andExpect(jsonPath("$.administeredDate").value("2026-03-01"))
        .andExpect(jsonPath("$.location").value("Clinic Roma"))
        .andExpect(jsonPath("$.notes").value("First dose"));
  }

  @Test
  @DisplayName("should list vaccine series")
  void shouldListVaccineSeries() throws Exception {
    // Create a dose
    mockMvc.perform(post("/api/vaccinations")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "vaccineType": "MPOX",
                  "doseNumber": 1,
                  "administeredDate": "2026-02-15"
                }
                """))
        .andExpect(status().isOk());

    // List series
    mockMvc.perform(get("/api/vaccinations")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].vaccineType").value("MPOX"))
        .andExpect(jsonPath("$[0].totalDoses").value(2))
        .andExpect(jsonPath("$[0].completedDoses").value(1))
        .andExpect(jsonPath("$[0].complete").value(false))
        .andExpect(jsonPath("$[0].doses[0].doseNumber").value(1));
  }

  @Test
  @DisplayName("should update vaccination dose")
  void shouldUpdateVaccination() throws Exception {
    // Create a dose
    String body = mockMvc.perform(post("/api/vaccinations")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "vaccineType": "HPV",
                  "doseNumber": 1,
                  "administeredDate": "2026-03-01",
                  "location": "Original clinic"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Update dose
    mockMvc.perform(put("/api/vaccinations/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "location": "Updated clinic",
                  "notes": "Added notes"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.location").value("Updated clinic"))
        .andExpect(jsonPath("$.notes").value("Added notes"));
  }

  @Test
  @DisplayName("should delete vaccination dose and return 204")
  void shouldDeleteVaccination() throws Exception {
    // Create a dose
    String body = mockMvc.perform(post("/api/vaccinations")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "vaccineType": "HEPATITIS_A",
                  "doseNumber": 1,
                  "administeredDate": "2026-02-20"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Delete
    mockMvc.perform(delete("/api/vaccinations/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isNoContent());

    // Verify deleted - list should be empty
    mockMvc.perform(get("/api/vaccinations")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isEmpty());
  }
}
