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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import app.navilla.dto.CreateVerificationCardRequest;
import app.navilla.dto.PublicVerificationCardResponse;
import app.navilla.dto.UpdateVerificationCardRequest;
import app.navilla.dto.VerificationCardResponse;
import app.navilla.security.EncryptionService;
import app.navilla.service.VerificationCardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests for {@link VerificationCardController}.
 *
 * <p>Uses {@code @MockitoBean} for service-layer mocking to avoid H2 compatibility
 * issues with PostgreSQL array column types.
 *
 * @author Navilla Team
 * @since 2026-03-10
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VerificationCardControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockitoBean
  private VerificationCardService verificationCardService;

  @MockitoBean
  private EncryptionService encryptionService;

  private static final String USER_EMAIL = "verification-card@example.com";
  private static final String USER_HASH = "hashed-verification-card";
  private static final String CARD_ID = UUID.randomUUID().toString();
  private static final String SHARE_TOKEN = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";

  private VerificationCardResponse buildCardResponse() {
    return new VerificationCardResponse(
        CARD_ID,
        "Test User",
        List.of("hiv", "chlamydia"),
        true,
        true,
        SHARE_TOKEN,
        "https://navilla.app/v/" + SHARE_TOKEN,
        "PRIVATE",
        50,
        0,
        null,
        OffsetDateTime.now(),
        OffsetDateTime.now()
    );
  }

  @Test
  @DisplayName("POST /api/verification-cards should return 201 with created card")
  void createCard_shouldReturn201() throws Exception {
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    when(verificationCardService.createCard(eq(USER_HASH), any(CreateVerificationCardRequest.class)))
        .thenReturn(buildCardResponse());

    mockMvc.perform(post("/api/verification-cards")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "displayName": "Test User",
                  "includedConditions": ["hiv", "chlamydia"],
                  "showTestDates": true,
                  "showVerificationLevel": true,
                  "maxViews": 50
                }
                """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(CARD_ID))
        .andExpect(jsonPath("$.shareToken").value(SHARE_TOKEN))
        .andExpect(jsonPath("$.shareUrl").exists())
        .andExpect(jsonPath("$.includedConditions[0]").value("hiv"))
        .andExpect(jsonPath("$.includedConditions[1]").value("chlamydia"))
        .andExpect(jsonPath("$.showTestDates").value(true))
        .andExpect(jsonPath("$.showVerificationLevel").value(true))
        .andExpect(jsonPath("$.maxViews").value(50))
        .andExpect(jsonPath("$.currentViews").value(0));
  }

  @Test
  @DisplayName("GET /api/verification-cards should return 200 with list of cards")
  void listCards_shouldReturn200() throws Exception {
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    when(verificationCardService.getUserCards(USER_HASH))
        .thenReturn(List.of(buildCardResponse()));

    mockMvc.perform(get("/api/verification-cards")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$[0].id").value(CARD_ID))
        .andExpect(jsonPath("$[0].shareToken").value(SHARE_TOKEN));
  }

  @Test
  @DisplayName("PUT /api/verification-cards/{id} should return 200 with updated card")
  void updateCard_shouldReturn200() throws Exception {
    VerificationCardResponse updatedResponse = new VerificationCardResponse(
        CARD_ID,
        "Updated Name",
        List.of("hiv", "chlamydia"),
        true,
        true,
        SHARE_TOKEN,
        "https://navilla.app/v/" + SHARE_TOKEN,
        "PRIVATE",
        25,
        0,
        null,
        OffsetDateTime.now(),
        OffsetDateTime.now()
    );

    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    when(verificationCardService.updateCard(
        eq(USER_HASH), eq(CARD_ID), any(UpdateVerificationCardRequest.class)))
        .thenReturn(updatedResponse);

    mockMvc.perform(put("/api/verification-cards/" + CARD_ID)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "displayName": "Updated Name",
                  "showTestDates": true,
                  "maxViews": 25
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.displayName").value("Updated Name"))
        .andExpect(jsonPath("$.showTestDates").value(true))
        .andExpect(jsonPath("$.maxViews").value(25));
  }

  @Test
  @DisplayName("DELETE /api/verification-cards/{id} should return 204")
  void deleteCard_shouldReturn204() throws Exception {
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    doNothing().when(verificationCardService).deleteCard(USER_HASH, CARD_ID);

    mockMvc.perform(delete("/api/verification-cards/" + CARD_ID)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isNoContent());
  }

  @Test
  @DisplayName("GET /api/public/cards/{shareToken} should return 200 without auth")
  void getPublicCard_validToken_shouldReturn200() throws Exception {
    PublicVerificationCardResponse publicResponse = new PublicVerificationCardResponse(
        "Public User",
        List.of(new PublicVerificationCardResponse.PublicConditionStatus(
            "hiv", "NEGATIVE", "LAB_VERIFIED", "2026-01-15")),
        null,
        null
    );

    when(verificationCardService.getPublicCard(SHARE_TOKEN)).thenReturn(publicResponse);

    mockMvc.perform(get("/api/public/cards/" + SHARE_TOKEN))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.displayName").value("Public User"))
        .andExpect(jsonPath("$.conditions").isArray())
        .andExpect(jsonPath("$.conditions[0].condition").value("hiv"))
        .andExpect(jsonPath("$.conditions[0].status").value("NEGATIVE"))
        .andExpect(jsonPath("$.conditions[0].verificationLevel").value("LAB_VERIFIED"));
  }

  @Test
  @DisplayName("GET /api/public/cards/invalid should return 400 for non-existent token")
  void getPublicCard_invalidToken_shouldReturn400() throws Exception {
    when(verificationCardService.getPublicCard("nonexistent-token-abc123"))
        .thenThrow(new IllegalArgumentException("Card not found"));

    mockMvc.perform(get("/api/public/cards/nonexistent-token-abc123"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400));
  }

  @Test
  @DisplayName("should return 401 without authentication for protected endpoints")
  void protectedEndpoints_shouldReturn401WithoutAuth() throws Exception {
    mockMvc.perform(get("/api/verification-cards"))
        .andExpect(status().isUnauthorized());

    mockMvc.perform(post("/api/verification-cards")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isUnauthorized());
  }
}
