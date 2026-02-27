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

import app.navilla.dto.CreatePartnerRequest;
import app.navilla.dto.JournalEntryResponse;
import app.navilla.dto.PartnerDetailResponse;
import app.navilla.dto.PartnerResponse;
import app.navilla.dto.PromoteAliasRequest;
import app.navilla.dto.UpdatePartnerRequest;
import app.navilla.service.JournalPartnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
 * REST controller for journal partner operations.
 *
 * <p>Provides CRUD endpoints for managing journal partners,
 * alias promotion, and partner-entry relationships. All
 * endpoints require JWT authentication and operate on the
 * authenticated user's data.
 *
 * @author Navilla Team
 * @since 2026-02-27
 */
@RestController
@RequestMapping("/api/journal/partners")
@RequiredArgsConstructor
public class JournalPartnerController {

  private final JournalPartnerService partnerService;

  /**
   * Lists all partners for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return list of partner responses with encounter stats
   */
  @GetMapping
  public List<PartnerResponse> listPartners(
      @AuthenticationPrincipal Jwt jwt) {
    return partnerService.listPartners(jwt);
  }

  /**
   * Creates a new journal partner.
   *
   * @param jwt     the JWT token containing user info
   * @param request the create request with alias and optional notes
   * @return the created partner response
   */
  @PostMapping
  public PartnerResponse createPartner(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody CreatePartnerRequest request) {
    return partnerService.createPartner(jwt, request);
  }

  /**
   * Promotes a freeform alias into a partner, backfilling
   * matching entries.
   *
   * @param jwt     the JWT token containing user info
   * @param request the promote request with alias
   * @return the created partner response with stats
   */
  @PostMapping("/promote")
  public PartnerResponse promoteAlias(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody PromoteAliasRequest request) {
    return partnerService.promoteAlias(jwt, request);
  }

  /**
   * Gets a partner detail view.
   *
   * @param jwt the JWT token containing user info
   * @param id  the partner ID
   * @return the partner detail response
   */
  @GetMapping("/{id}")
  public PartnerDetailResponse getPartner(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    return partnerService.getPartner(jwt, id);
  }

  /**
   * Updates an existing partner.
   *
   * @param jwt     the JWT token containing user info
   * @param id      the partner ID
   * @param request the update request
   * @return the updated partner response
   */
  @PutMapping("/{id}")
  public PartnerResponse updatePartner(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @Valid @RequestBody UpdatePartnerRequest request) {
    return partnerService.updatePartner(jwt, id, request);
  }

  /**
   * Deletes a partner.
   *
   * <p>By default, linked entries are unlinked (partnerId set to null).
   * If {@code deleteEntries=true}, linked entries are also deleted.
   *
   * @param jwt           the JWT token containing user info
   * @param id            the partner ID
   * @param deleteEntries if true, also delete linked entries
   */
  @DeleteMapping("/{id}")
  public void deletePartner(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "false") boolean deleteEntries) {
    partnerService.deletePartner(jwt, id, deleteEntries);
  }

  /**
   * Lists journal entries for a specific partner.
   *
   * @param jwt the JWT token containing user info
   * @param id  the partner ID
   * @return list of journal entry responses
   */
  @GetMapping("/{id}/entries")
  public List<JournalEntryResponse> listPartnerEntries(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    return partnerService.listPartnerEntries(jwt, id);
  }
}
