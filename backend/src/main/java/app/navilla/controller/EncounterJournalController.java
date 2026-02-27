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

import java.util.List;
import java.util.UUID;

import app.navilla.dto.CreateJournalEntryRequest;
import app.navilla.dto.JournalEntryResponse;
import app.navilla.dto.JournalSummaryResponse;
import app.navilla.dto.JournalTemplateResponse;
import app.navilla.dto.JournalTemplatesRequest;
import app.navilla.dto.UpdateJournalEntryRequest;
import app.navilla.service.EncounterJournalService;
import app.navilla.service.JournalPartnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for encounter journal operations.
 *
 * <p>Provides CRUD endpoints for journal entries, custom field
 * templates, and yearly summary statistics. All endpoints require
 * JWT authentication and operate on the authenticated user's data.
 *
 * @author Navilla Team
 * @since 2026-02-27
 */
@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
public class EncounterJournalController {

  private final EncounterJournalService journalService;
  private final JournalPartnerService partnerService;

  /**
   * Lists journal entries for the authenticated user.
   *
   * @param jwt   the JWT token containing user info
   * @param month optional month filter in "YYYY-MM" format
   * @return list of journal entry responses
   */
  @GetMapping
  public ResponseEntity<List<JournalEntryResponse>> listEntries(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(required = false) String month) {
    return ResponseEntity.ok(journalService.listEntries(jwt, month));
  }

  /**
   * Creates a new journal entry.
   *
   * @param jwt     the JWT token containing user info
   * @param request the create request with entry details
   * @return the created journal entry response
   */
  @PostMapping
  public ResponseEntity<JournalEntryResponse> createEntry(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody CreateJournalEntryRequest request) {
    return ResponseEntity.ok(journalService.createEntry(jwt, request));
  }

  /**
   * Updates an existing journal entry.
   *
   * @param jwt     the JWT token containing user info
   * @param id      the entry ID
   * @param request the update request with new entry details
   * @return the updated journal entry response
   */
  @PutMapping("/{id}")
  public ResponseEntity<JournalEntryResponse> updateEntry(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateJournalEntryRequest request) {
    return ResponseEntity.ok(journalService.updateEntry(jwt, id, request));
  }

  /**
   * Deletes a journal entry.
   *
   * @param jwt the JWT token containing user info
   * @param id  the entry ID
   * @return 204 No Content on success
   */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteEntry(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    journalService.deleteEntry(jwt, id);
    return ResponseEntity.noContent().build();
  }

  /**
   * Retrieves the user's custom field templates.
   *
   * @param jwt the JWT token containing user info
   * @return the template labels
   */
  @GetMapping("/templates")
  public ResponseEntity<JournalTemplateResponse> getTemplates(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(journalService.getTemplates(jwt));
  }

  /**
   * Saves custom field templates for the authenticated user.
   *
   * @param jwt     the JWT token containing user info
   * @param request the template labels to save
   * @return the saved template labels
   */
  @PutMapping("/templates")
  public ResponseEntity<JournalTemplateResponse> saveTemplates(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody JournalTemplatesRequest request) {
    return ResponseEntity.ok(journalService.saveTemplates(jwt, request));
  }

  /**
   * Returns monthly encounter counts for a given year.
   *
   * @param jwt  the JWT token containing user info
   * @param year the year to summarize (defaults to 2026)
   * @return summary with monthly counts and year total
   */
  @GetMapping("/summary")
  public ResponseEntity<JournalSummaryResponse> getSummary(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(defaultValue = "2026") int year) {
    return ResponseEntity.ok(journalService.getSummary(jwt, year));
  }

  /**
   * Returns recent distinct aliases from entries without a partner.
   *
   * @param jwt the JWT token containing user info
   * @return up to 8 recent distinct aliases
   */
  @GetMapping("/recent-aliases")
  public ResponseEntity<List<String>> listRecentAliases(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(partnerService.listRecentAliases(jwt));
  }
}
