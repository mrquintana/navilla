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

import app.navilla.repository.MedicationLogRepository;
import app.navilla.repository.MedicationRepository;
import app.navilla.repository.ReminderRepository;
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
class MedicationControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private MedicationRepository medicationRepository;

  @Autowired
  private MedicationLogRepository medicationLogRepository;

  @Autowired
  private ReminderRepository reminderRepository;

  @Autowired
  private ObjectMapper objectMapper;

  private static final String USER_EMAIL = "medication@example.com";

  @BeforeEach
  void setup() {
    medicationLogRepository.deleteAll();
    reminderRepository.deleteAll();
    medicationRepository.deleteAll();
  }

  @Test
  @DisplayName("should return 401 without authentication")
  void shouldReturnUnauthorized() throws Exception {
    mockMvc.perform(get("/api/medications"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("should create medication and return 200")
  void shouldCreateMedication() throws Exception {
    mockMvc.perform(post("/api/medications")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "medicationType": "PREP_DAILY",
                  "name": "Truvada",
                  "dosage": "200mg/300mg",
                  "startDate": "2026-03-01",
                  "frequency": "DAILY",
                  "notes": "Take with food"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.medicationType").value("PREP_DAILY"))
        .andExpect(jsonPath("$.name").value("Truvada"))
        .andExpect(jsonPath("$.dosage").value("200mg/300mg"))
        .andExpect(jsonPath("$.startDate").value("2026-03-01"))
        .andExpect(jsonPath("$.frequency").value("DAILY"))
        .andExpect(jsonPath("$.notes").value("Take with food"))
        .andExpect(jsonPath("$.active").value(true));
  }

  @Test
  @DisplayName("should reject missing required fields")
  void shouldRejectMissingFields() throws Exception {
    mockMvc.perform(post("/api/medications")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "dosage": "200mg"
                }
                """))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("should list user medications")
  void shouldListMedications() throws Exception {
    // Create medication
    mockMvc.perform(post("/api/medications")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "medicationType": "PREP_DAILY",
                  "name": "Truvada",
                  "startDate": "2026-03-01",
                  "frequency": "DAILY"
                }
                """))
        .andExpect(status().isOk());

    // List medications
    mockMvc.perform(get("/api/medications")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].medicationType").value("PREP_DAILY"))
        .andExpect(jsonPath("$[0].name").value("Truvada"));
  }

  @Test
  @DisplayName("should get medication by ID")
  void shouldGetMedicationById() throws Exception {
    // Create medication
    String body = mockMvc.perform(post("/api/medications")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "medicationType": "TREATMENT_COURSE",
                  "name": "Doxycycline",
                  "startDate": "2026-03-01",
                  "frequency": "DAILY"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Get by ID
    mockMvc.perform(get("/api/medications/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(id))
        .andExpect(jsonPath("$.medicationType").value("TREATMENT_COURSE"))
        .andExpect(jsonPath("$.name").value("Doxycycline"));
  }

  @Test
  @DisplayName("should update medication")
  void shouldUpdateMedication() throws Exception {
    // Create medication
    String body = mockMvc.perform(post("/api/medications")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "medicationType": "PREP_DAILY",
                  "name": "Truvada",
                  "startDate": "2026-03-01",
                  "frequency": "DAILY",
                  "notes": "Original notes"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Update medication
    mockMvc.perform(put("/api/medications/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "notes": "Updated notes",
                  "dosage": "New dosage"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.notes").value("Updated notes"))
        .andExpect(jsonPath("$.dosage").value("New dosage"))
        .andExpect(jsonPath("$.name").value("Truvada"));
  }

  @Test
  @DisplayName("should deactivate medication and return 204")
  void shouldDeactivateMedication() throws Exception {
    // Create medication
    String body = mockMvc.perform(post("/api/medications")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "medicationType": "PREP_DAILY",
                  "name": "To Deactivate",
                  "startDate": "2026-03-01",
                  "frequency": "DAILY"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Deactivate
    mockMvc.perform(delete("/api/medications/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isNoContent());
  }

  @Test
  @DisplayName("should log a dose for a medication")
  void shouldLogDose() throws Exception {
    // Create medication
    String body = mockMvc.perform(post("/api/medications")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "medicationType": "PREP_DAILY",
                  "name": "Truvada",
                  "startDate": "2026-03-01",
                  "frequency": "DAILY"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Log dose
    mockMvc.perform(post("/api/medications/" + id + "/log")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "scheduledFor": "2026-03-03",
                  "taken": true,
                  "notes": "Taken on time"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.scheduledFor").value("2026-03-03"))
        .andExpect(jsonPath("$.taken").value(true))
        .andExpect(jsonPath("$.notes").value("Taken on time"));
  }
}
