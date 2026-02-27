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

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.navilla.repository.EncounterJournalRepository;
import app.navilla.repository.JournalPartnerRepository;
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
class JournalPartnerControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private JournalPartnerRepository partnerRepository;

  @Autowired
  private EncounterJournalRepository journalRepository;

  private static final String USER_EMAIL = "partner-test@example.com";

  @BeforeEach
  void setup() {
    journalRepository.deleteAll();
    partnerRepository.deleteAll();
  }

  // ---- Helper methods ----

  /**
   * Creates a journal entry via the API and returns the response body.
   */
  private String createEntry(String date, String alias) throws Exception {
    return mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "%s",
                  "partnerAlias": "%s"
                }
                """.formatted(date, alias)))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
  }

  /**
   * Creates a journal entry with a partnerId via the API.
   */
  private String createEntryWithPartner(
      String date, String alias, String partnerId) throws Exception {
    return mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "encounterDate": "%s",
                  "partnerAlias": "%s",
                  "partnerId": "%s"
                }
                """.formatted(date, alias, partnerId)))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
  }

  /**
   * Creates a partner via the API and returns the response body.
   */
  private String createPartner(String alias) throws Exception {
    return mockMvc.perform(post("/api/journal/partners")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "alias": "%s"
                }
                """.formatted(alias)))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
  }

  private String extractId(String responseBody) throws Exception {
    return objectMapper.readTree(responseBody).get("id").asText();
  }

  // ---- Tests ----

  @Test
  @DisplayName("POST /api/journal/partners - should create partner")
  void shouldCreatePartner() throws Exception {
    mockMvc.perform(post("/api/journal/partners")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "alias": "Alex"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.alias").value("Alex"));
  }

  @Test
  @DisplayName("GET /api/journal/partners - should list partners with encounter counts")
  void shouldListPartnersWithCounts() throws Exception {
    // Create 2 partners
    String partnerBody1 = createPartner("Alex");
    String partnerId1 = extractId(partnerBody1);
    createPartner("Jordan");

    // Create 2 entries linked to partner 1
    createEntryWithPartner("2026-02-10", "Alex", partnerId1);
    createEntryWithPartner("2026-02-12", "Alex", partnerId1);

    // List partners
    mockMvc.perform(get("/api/journal/partners")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[?(@.alias == 'Alex')].encounterCount")
            .value(2))
        .andExpect(jsonPath("$[?(@.alias == 'Jordan')].encounterCount")
            .value(0));
  }

  @Test
  @DisplayName("GET /api/journal/partners/{id} - should return partner detail")
  void shouldGetPartnerDetail() throws Exception {
    // Create partner with notes
    String body = mockMvc.perform(post("/api/journal/partners")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "alias": "Sam",
                  "notes": "Met at the park"
                }
                """))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = extractId(body);

    // Get detail
    mockMvc.perform(get("/api/journal/partners/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.alias").value("Sam"))
        .andExpect(jsonPath("$.notes").value("Met at the park"))
        .andExpect(jsonPath("$.id").value(id));
  }

  @Test
  @DisplayName("PUT /api/journal/partners/{id} - should update partner alias")
  void shouldUpdatePartner() throws Exception {
    String body = createPartner("OriginalName");
    String id = extractId(body);

    // Update alias
    mockMvc.perform(put("/api/journal/partners/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "alias": "UpdatedName",
                  "unlinkConnection": false
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.alias").value("UpdatedName"));
  }

  @Test
  @DisplayName("DELETE /api/journal/partners/{id} - soft delete preserves entries")
  void shouldSoftDeletePartnerPreservingEntries() throws Exception {
    // Create partner
    String partnerBody = createPartner("ToRemove");
    String partnerId = extractId(partnerBody);

    // Create entry linked to the partner
    String entryBody = createEntryWithPartner(
        "2026-02-15", "ToRemove", partnerId);
    String entryId = extractId(entryBody);

    // Soft delete the partner (default deleteEntries=false)
    mockMvc.perform(delete("/api/journal/partners/" + partnerId)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk());

    // Verify partner is gone
    mockMvc.perform(get("/api/journal/partners/" + partnerId)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isNotFound());

    // Verify entry still exists with null partnerId
    mockMvc.perform(get("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(entryId))
        .andExpect(jsonPath("$[0].partnerId").doesNotExist());
  }

  @Test
  @DisplayName("DELETE /api/journal/partners/{id}?deleteEntries=true - destructive delete")
  void shouldDestructiveDeletePartnerAndEntries() throws Exception {
    // Create partner
    String partnerBody = createPartner("ToDestroy");
    String partnerId = extractId(partnerBody);

    // Create entry linked to the partner
    createEntryWithPartner("2026-02-16", "ToDestroy", partnerId);

    // Destructive delete
    mockMvc.perform(delete("/api/journal/partners/" + partnerId)
            .param("deleteEntries", "true")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk());

    // Verify partner is gone
    mockMvc.perform(get("/api/journal/partners/" + partnerId)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isNotFound());

    // Verify entry is also gone
    mockMvc.perform(get("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));
  }

  @Test
  @DisplayName("POST /api/journal/partners/promote - should promote alias and link entries")
  void shouldPromoteAlias() throws Exception {
    // Create 3 entries with the same alias (no partner)
    createEntry("2026-01-10", "Robin");
    createEntry("2026-01-15", "Robin");
    createEntry("2026-01-20", "Robin");

    // Promote the alias
    String body = mockMvc.perform(post("/api/journal/partners/promote")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "alias": "Robin"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.alias").value("Robin"))
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.encounterCount").value(3))
        .andReturn().getResponse().getContentAsString();

    String partnerId = extractId(body);

    // Verify entries are now linked to the partner
    mockMvc.perform(get("/api/journal/partners/" + partnerId + "/entries")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(3)));
  }

  @Test
  @DisplayName("GET /api/journal/recent-aliases - should return unlinked aliases only")
  void shouldListRecentAliases() throws Exception {
    // Create partner and linked entry
    String partnerBody = createPartner("LinkedPerson");
    String partnerId = extractId(partnerBody);
    createEntryWithPartner("2026-02-01", "LinkedPerson", partnerId);

    // Create unlinked entries with different aliases
    createEntry("2026-02-05", "UnlinkedOne");
    createEntry("2026-02-06", "UnlinkedTwo");

    // Get recent aliases - should only return unlinked ones
    mockMvc.perform(get("/api/journal/recent-aliases")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[0]").value("UnlinkedTwo"))
        .andExpect(jsonPath("$[1]").value("UnlinkedOne"));
  }

  @Test
  @DisplayName("GET /api/journal/partners/{id}/entries - should list partner entries")
  void shouldListPartnerEntries() throws Exception {
    // Create partner
    String partnerBody = createPartner("EntriesPerson");
    String partnerId = extractId(partnerBody);

    // Create 2 entries linked to partner
    createEntryWithPartner("2026-03-01", "EntriesPerson", partnerId);
    createEntryWithPartner("2026-03-05", "EntriesPerson", partnerId);

    // List entries for partner
    mockMvc.perform(get("/api/journal/partners/" + partnerId + "/entries")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[0].partnerAlias").value("EntriesPerson"))
        .andExpect(jsonPath("$[1].partnerAlias").value("EntriesPerson"));
  }

  @Test
  @DisplayName("should return 401 for unauthenticated access to partner endpoints")
  void shouldReturn401ForUnauthenticated() throws Exception {
    mockMvc.perform(get("/api/journal/partners"))
        .andExpect(status().isUnauthorized());

    mockMvc.perform(post("/api/journal/partners")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"alias": "Test"}
                """))
        .andExpect(status().isUnauthorized());

    mockMvc.perform(get("/api/journal/recent-aliases"))
        .andExpect(status().isUnauthorized());
  }
}
