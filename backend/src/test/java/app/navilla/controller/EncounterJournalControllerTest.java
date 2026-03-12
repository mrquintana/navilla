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

import app.navilla.repository.EncounterJournalRepository;
import app.navilla.repository.JournalFieldTemplateRepository;
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
class EncounterJournalControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private EncounterJournalRepository journalRepository;

  @Autowired
  private JournalFieldTemplateRepository templateRepository;

  @Autowired
  private ObjectMapper objectMapper;

  private static final String USER_EMAIL = "journal@example.com";

  @BeforeEach
  void setup() {
    journalRepository.deleteAll();
    templateRepository.deleteAll();
  }

  @Test
  @DisplayName("should return 401 without authentication")
  void shouldReturnUnauthorized() throws Exception {
    mockMvc.perform(get("/api/journal"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("should create and list journal entries")
  void shouldCreateAndList() throws Exception {
    // Create entry
    mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "2026-02-15",
                  "partnerAlias": "Alex",
                  "notes": "Some notes"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.encounterDate").value("2026-02-15"))
        .andExpect(jsonPath("$.partnerAlias").value("Alex"))
        .andExpect(jsonPath("$.notes").value("Some notes"))
        .andExpect(jsonPath("$.id").exists());

    // List entries
    mockMvc.perform(get("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].encounterDate").value("2026-02-15"))
        .andExpect(jsonPath("$[0].partnerAlias").value("Alex"))
        .andExpect(jsonPath("$[0].notes").value("Some notes"));
  }

  @Test
  @DisplayName("should create entry with custom fields")
  void shouldCreateWithCustomFields() throws Exception {
    mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "2026-02-20",
                  "customFields": [
                    {"label": "Location", "value": "Home"},
                    {"label": "Mood", "value": "Happy"}
                  ]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.customFields[0].label").value("Location"))
        .andExpect(jsonPath("$.customFields[1].label").value("Mood"));
  }

  @Test
  @DisplayName("should update an existing entry")
  void shouldUpdateEntry() throws Exception {
    // Create entry
    String body = mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "2026-02-10",
                  "partnerAlias": "Original",
                  "notes": "Original notes"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Update entry
    mockMvc.perform(put("/api/journal/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "2026-02-11",
                  "partnerAlias": "Updated",
                  "notes": "Updated notes"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.encounterDate").value("2026-02-11"))
        .andExpect(jsonPath("$.partnerAlias").value("Updated"))
        .andExpect(jsonPath("$.notes").value("Updated notes"));
  }

  @Test
  @DisplayName("should delete an entry")
  void shouldDeleteEntry() throws Exception {
    // Create entry
    String body = mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "2026-02-05",
                  "partnerAlias": "ToDelete"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Delete entry
    mockMvc.perform(delete("/api/journal/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isNoContent());
  }

  @Test
  @DisplayName("should create entry with encounter types and protection methods")
  void shouldCreateWithEncounterTypesAndProtection() throws Exception {
    mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "2026-02-25",
                  "encounterTypes": ["ORAL", "ANAL"],
                  "protectionMethods": ["CONDOM", "PREP"]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.encounterDate").value("2026-02-25"))
        .andExpect(jsonPath("$.encounterTypes[0]").value("ORAL"))
        .andExpect(jsonPath("$.encounterTypes[1]").value("ANAL"))
        .andExpect(jsonPath("$.protectionMethods[0]").value("CONDOM"))
        .andExpect(jsonPath("$.protectionMethods[1]").value("PREP"));
  }

  @Test
  @DisplayName("should create entry without encounter types and protection methods")
  void shouldCreateWithoutEncounterTypesAndProtection() throws Exception {
    mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "2026-02-26",
                  "partnerAlias": "NoTypes"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.encounterTypes").doesNotExist())
        .andExpect(jsonPath("$.protectionMethods").doesNotExist());
  }

  @Test
  @DisplayName("should update entry with encounter types and protection methods")
  void shouldUpdateWithEncounterTypesAndProtection() throws Exception {
    // Create entry first
    String body = mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "2026-02-27"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Update with encounter types and protection methods
    mockMvc.perform(put("/api/journal/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "2026-02-27",
                  "encounterTypes": ["VAGINAL"],
                  "protectionMethods": ["CONDOM", "DENTAL_DAM"]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.encounterTypes[0]").value("VAGINAL"))
        .andExpect(jsonPath("$.protectionMethods[0]").value("CONDOM"))
        .andExpect(jsonPath("$.protectionMethods[1]").value("DENTAL_DAM"));

    // Verify list includes the new fields
    mockMvc.perform(get("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].encounterTypes[0]").value("VAGINAL"));
  }

  @Test
  @DisplayName("should reject create without encounterDate")
  void shouldRejectWithoutDate() throws Exception {
    mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "partnerAlias": "NoDate"
                }
                """))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("should save and retrieve templates")
  void shouldSaveAndRetrieveTemplates() throws Exception {
    // Save templates
    mockMvc.perform(put("/api/journal/templates")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "labels": ["Location", "Protection Used", "Mood"]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.labels[0]").value("Location"))
        .andExpect(jsonPath("$.labels[1]").value("Protection Used"))
        .andExpect(jsonPath("$.labels[2]").value("Mood"));

    // Get templates
    mockMvc.perform(get("/api/journal/templates")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.labels[0]").value("Location"))
        .andExpect(jsonPath("$.labels[1]").value("Protection Used"))
        .andExpect(jsonPath("$.labels[2]").value("Mood"));
  }

  @Test
  @DisplayName("should return summary for year")
  void shouldReturnSummary() throws Exception {
    // Create an entry in 2026
    mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "2026-03-15",
                  "partnerAlias": "SummaryTest"
                }
                """))
        .andExpect(status().isOk());

    // Get summary
    mockMvc.perform(get("/api/journal/summary")
            .param("year", "2026")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.year").value(2026))
        .andExpect(jsonPath("$.yearTotal").value(1));
  }

  @Test
  @DisplayName("should return months with entries")
  void shouldReturnMonthsWithEntries() throws Exception {
    // Create entries in different months
    mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "2026-01-10",
                  "partnerAlias": "Jan"
                }
                """))
        .andExpect(status().isOk());

    mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "2026-03-05",
                  "partnerAlias": "Mar"
                }
                """))
        .andExpect(status().isOk());

    // Get months
    mockMvc.perform(get("/api/journal/months")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0]").value("2026-01"))
        .andExpect(jsonPath("$[1]").value("2026-03"));
  }

  @Test
  @DisplayName("should paginate journal entries")
  void shouldPaginateEntries() throws Exception {
    // Create 3 entries
    for (int i = 1; i <= 3; i++) {
      mockMvc.perform(post("/api/journal")
              .with(jwt().jwt(builder -> builder
                  .subject("test-subject")
                  .claim("email", USER_EMAIL)))
              .contentType(MediaType.APPLICATION_JSON)
              .content(String.format("""
                  {
                    "encounterDate": "2026-03-%02d",
                    "partnerAlias": "P%d"
                  }
                  """, i, i)))
          .andExpect(status().isOk());
    }

    // Get page 0 with size 2
    mockMvc.perform(get("/api/journal")
            .param("page", "0")
            .param("size", "2")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray())
        .andExpect(jsonPath("$.content.length()").value(2))
        .andExpect(jsonPath("$.totalElements").value(3))
        .andExpect(jsonPath("$.totalPages").value(2));
  }
}
