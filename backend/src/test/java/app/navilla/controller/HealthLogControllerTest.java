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

import app.navilla.repository.HealthStatusRepository;
import app.navilla.repository.LabCredentialRepository;
import app.navilla.repository.LabRepository;
import app.navilla.repository.TestResultRepository;
import app.navilla.repository.TestVisitRepository;
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
class HealthLogControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private TestVisitRepository testVisitRepository;

  @Autowired
  private TestResultRepository testResultRepository;

  @Autowired
  private LabRepository labRepository;

  @Autowired
  private LabCredentialRepository labCredentialRepository;

  @Autowired
  private HealthStatusRepository healthStatusRepository;

  @Autowired
  private ObjectMapper objectMapper;

  private static final String USER_EMAIL = "healthlog@example.com";

  @BeforeEach
  void setup() {
    healthStatusRepository.deleteAll();
    testResultRepository.deleteAll();
    testVisitRepository.deleteAll();
    labCredentialRepository.deleteAll();
    labRepository.deleteAll();
  }

  // ---- Visit endpoints ----

  @Test
  @DisplayName("should return 401 without authentication")
  void shouldReturnUnauthorized() throws Exception {
    mockMvc.perform(get("/api/health-log/visits"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("should create and list visits")
  void shouldCreateAndListVisits() throws Exception {
    // Create visit
    mockMvc.perform(post("/api/health-log/visits")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "testDate": "2026-02-15",
                  "results": [
                    {
                      "conditionType": "HIV",
                      "status": "NEGATIVE"
                    }
                  ],
                  "notes": "Routine checkup"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.testDate").value("2026-02-15"))
        .andExpect(jsonPath("$.notes").value("Routine checkup"))
        .andExpect(jsonPath("$.results[0].conditionType").value("HIV"))
        .andExpect(jsonPath("$.results[0].status").value("NEGATIVE"));

    // List visits
    mockMvc.perform(get("/api/health-log/visits")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].testDate").value("2026-02-15"))
        .andExpect(jsonPath("$[0].results[0].conditionType").value("HIV"));
  }

  @Test
  @DisplayName("should reject visit creation without testDate")
  void shouldRejectWithoutTestDate() throws Exception {
    mockMvc.perform(post("/api/health-log/visits")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "results": [
                    {
                      "conditionType": "HIV",
                      "status": "NEGATIVE"
                    }
                  ]
                }
                """))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("should get a visit by ID")
  void shouldGetVisitById() throws Exception {
    // Create visit
    String body = mockMvc.perform(post("/api/health-log/visits")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "testDate": "2026-02-10",
                  "results": [
                    {
                      "conditionType": "SYPHILIS",
                      "status": "NEGATIVE"
                    }
                  ]
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Get visit by ID
    mockMvc.perform(get("/api/health-log/visits/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(id))
        .andExpect(jsonPath("$.testDate").value("2026-02-10"))
        .andExpect(jsonPath("$.results[0].conditionType").value("SYPHILIS"));
  }

  @Test
  @DisplayName("should update an existing visit")
  void shouldUpdateVisit() throws Exception {
    // Create visit
    String body = mockMvc.perform(post("/api/health-log/visits")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "testDate": "2026-02-10",
                  "results": [
                    {
                      "conditionType": "HIV",
                      "status": "PENDING"
                    }
                  ],
                  "notes": "Waiting for results"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Update visit
    mockMvc.perform(put("/api/health-log/visits/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "notes": "Results received",
                  "results": [
                    {
                      "conditionType": "HIV",
                      "status": "NEGATIVE"
                    }
                  ]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.notes").value("Results received"))
        .andExpect(jsonPath("$.results[0].status").value("NEGATIVE"));
  }

  @Test
  @DisplayName("should delete a visit")
  void shouldDeleteVisit() throws Exception {
    // Create visit
    String body = mockMvc.perform(post("/api/health-log/visits")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "testDate": "2026-02-05",
                  "results": [
                    {
                      "conditionType": "CHLAMYDIA",
                      "status": "NEGATIVE"
                    }
                  ]
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Delete visit
    mockMvc.perform(delete("/api/health-log/visits/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isNoContent());

    // Verify deleted - list should be empty
    mockMvc.perform(get("/api/health-log/visits")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isEmpty());
  }

  // ---- Summary & Condition History ----

  @Test
  @DisplayName("should return summary")
  void shouldReturnSummary() throws Exception {
    // Create a visit first
    mockMvc.perform(post("/api/health-log/visits")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "testDate": "2026-02-20",
                  "results": [
                    {
                      "conditionType": "HIV",
                      "status": "NEGATIVE"
                    },
                    {
                      "conditionType": "SYPHILIS",
                      "status": "NEGATIVE"
                    }
                  ]
                }
                """))
        .andExpect(status().isOk());

    // Get summary
    mockMvc.perform(get("/api/health-log/summary")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.testsThisYear").value(1))
        .andExpect(jsonPath("$.conditionsCovered").value(2))
        .andExpect(jsonPath("$.conditions").isArray());
  }

  @Test
  @DisplayName("should return empty summary when no visits exist")
  void shouldReturnEmptySummary() throws Exception {
    mockMvc.perform(get("/api/health-log/summary")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.daysSinceLastTest").value(-1))
        .andExpect(jsonPath("$.testsThisYear").value(0))
        .andExpect(jsonPath("$.conditionsCovered").value(0));
  }

  @Test
  @DisplayName("should return condition history")
  void shouldReturnConditionHistory() throws Exception {
    // Create a visit with HIV result
    mockMvc.perform(post("/api/health-log/visits")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "testDate": "2026-02-18",
                  "results": [
                    {
                      "conditionType": "HIV",
                      "status": "NEGATIVE"
                    }
                  ]
                }
                """))
        .andExpect(status().isOk());

    // Get condition history
    mockMvc.perform(get("/api/health-log/condition/HIV")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.conditionType").value("HIV"))
        .andExpect(jsonPath("$.latestStatus").value("NEGATIVE"))
        .andExpect(jsonPath("$.totalTests").value(1))
        .andExpect(jsonPath("$.entries[0].status").value("NEGATIVE"));
  }

  // ---- Lab endpoints ----

  @Test
  @DisplayName("should create and list labs")
  void shouldCreateAndListLabs() throws Exception {
    // Create lab
    mockMvc.perform(post("/api/health-log/labs")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "provider": "CHOPO",
                  "name": "Chopo Condesa"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.provider").value("CHOPO"))
        .andExpect(jsonPath("$.name").value("Chopo Condesa"));

    // List labs
    mockMvc.perform(get("/api/health-log/labs")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].provider").value("CHOPO"))
        .andExpect(jsonPath("$[0].name").value("Chopo Condesa"));
  }

  @Test
  @DisplayName("should create lab with credentials")
  void shouldCreateLabWithCredentials() throws Exception {
    mockMvc.perform(post("/api/health-log/labs")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "provider": "SALUD_DIGNA",
                  "name": "Salud Digna Roma",
                  "credentials": [
                    {"key": "patientId", "value": "12345"}
                  ]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.provider").value("SALUD_DIGNA"))
        .andExpect(jsonPath("$.name").value("Salud Digna Roma"))
        .andExpect(jsonPath("$.credentials[0].key").value("patientId"))
        .andExpect(jsonPath("$.credentials[0].value").value("12345"));
  }

  @Test
  @DisplayName("should update a lab")
  void shouldUpdateLab() throws Exception {
    // Create lab
    String body = mockMvc.perform(post("/api/health-log/labs")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "provider": "OTHER",
                  "name": "Original Lab Name"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Update lab
    mockMvc.perform(put("/api/health-log/labs/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "Updated Lab Name"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Updated Lab Name"));
  }

  @Test
  @DisplayName("should delete a lab")
  void shouldDeleteLab() throws Exception {
    // Create lab
    String body = mockMvc.perform(post("/api/health-log/labs")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "provider": "CHOPO",
                  "name": "To Delete"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = objectMapper.readTree(body).get("id").asText();

    // Delete lab
    mockMvc.perform(delete("/api/health-log/labs/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isNoContent());

    // Verify deleted - list should be empty
    mockMvc.perform(get("/api/health-log/labs")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isEmpty());
  }

  @Test
  @DisplayName("should reject lab creation without provider")
  void shouldRejectLabWithoutProvider() throws Exception {
    mockMvc.perform(post("/api/health-log/labs")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "Missing Provider"
                }
                """))
        .andExpect(status().isBadRequest());
  }
}
