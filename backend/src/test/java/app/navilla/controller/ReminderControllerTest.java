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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.navilla.repository.MedicationLogRepository;
import app.navilla.repository.MedicationRepository;
import app.navilla.repository.ReminderRepository;
import app.navilla.repository.ReminderSettingsRepository;
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
class ReminderControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ReminderRepository reminderRepository;

  @Autowired
  private ReminderSettingsRepository reminderSettingsRepository;

  @Autowired
  private MedicationRepository medicationRepository;

  @Autowired
  private MedicationLogRepository medicationLogRepository;

  @Autowired
  private ObjectMapper objectMapper;

  private static final String USER_EMAIL = "reminder@example.com";

  @BeforeEach
  void setup() {
    medicationLogRepository.deleteAll();
    reminderRepository.deleteAll();
    reminderSettingsRepository.deleteAll();
    medicationRepository.deleteAll();
  }

  @Test
  @DisplayName("should return 401 without authentication")
  void shouldReturnUnauthorized() throws Exception {
    mockMvc.perform(get("/api/reminders"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("should list reminders")
  void shouldListReminders() throws Exception {
    // Create a medication with reminder time — this auto-creates a reminder
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
                  "frequency": "DAILY",
                  "reminderTime": "09:00"
                }
                """))
        .andExpect(status().isOk());

    // List reminders
    mockMvc.perform(get("/api/reminders")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].reminderType").value("MEDICATION"))
        .andExpect(jsonPath("$[0].active").value(true));
  }

  @Test
  @DisplayName("should return upcoming reminders")
  void shouldReturnUpcomingReminders() throws Exception {
    // Create a medication with reminder time
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
                  "frequency": "DAILY",
                  "reminderTime": "09:00"
                }
                """))
        .andExpect(status().isOk());

    // Get upcoming reminders (within 30 days to ensure it captures our reminder)
    mockMvc.perform(get("/api/reminders/upcoming")
            .param("days", "30")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
  }

  @Test
  @DisplayName("should snooze a reminder")
  void shouldSnoozeReminder() throws Exception {
    // Create medication with reminder
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
                  "frequency": "DAILY",
                  "reminderTime": "09:00"
                }
                """))
        .andExpect(status().isOk());

    // Get the reminder ID from list
    String listBody = mockMvc.perform(get("/api/reminders")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String reminderId = objectMapper.readTree(listBody).get(0).get("id").asText();

    // Snooze the reminder
    mockMvc.perform(post("/api/reminders/" + reminderId + "/snooze")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "until": "2026-03-04T09:00:00Z"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.snoozedUntil").exists())
        .andExpect(jsonPath("$.id").value(reminderId));
  }

  @Test
  @DisplayName("should return default reminder settings")
  void shouldReturnDefaultSettings() throws Exception {
    mockMvc.perform(get("/api/reminders/settings")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.emailDigestEnabled").value(false))
        .andExpect(jsonPath("$.testingRemindersEnabled").value(true))
        .andExpect(jsonPath("$.medicationRemindersEnabled").value(true))
        .andExpect(jsonPath("$.vaccinationRemindersEnabled").value(true));
  }

  @Test
  @DisplayName("should update reminder settings")
  void shouldUpdateSettings() throws Exception {
    mockMvc.perform(put("/api/reminders/settings")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "quietHoursStart": "22:00",
                  "quietHoursEnd": "08:00",
                  "emailDigestEnabled": true,
                  "emailDigestDay": "MONDAY",
                  "testingRemindersEnabled": false
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.quietHoursStart").value("22:00"))
        .andExpect(jsonPath("$.quietHoursEnd").value("08:00"))
        .andExpect(jsonPath("$.emailDigestEnabled").value(true))
        .andExpect(jsonPath("$.emailDigestDay").value("MONDAY"))
        .andExpect(jsonPath("$.testingRemindersEnabled").value(false))
        .andExpect(jsonPath("$.medicationRemindersEnabled").value(true))
        .andExpect(jsonPath("$.vaccinationRemindersEnabled").value(true));
  }
}
