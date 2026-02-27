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

package app.navilla.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

import app.navilla.dto.CreatePartnerRequest;
import app.navilla.dto.CustomFieldDto;
import app.navilla.dto.JournalEntryResponse;
import app.navilla.dto.PartnerDetailResponse;
import app.navilla.dto.PartnerResponse;
import app.navilla.dto.PromoteAliasRequest;
import app.navilla.dto.UpdatePartnerRequest;
import app.navilla.entity.EncounterJournal;
import app.navilla.entity.JournalPartner;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.metrics.JournalMetrics;
import app.navilla.repository.EncounterJournalRepository;
import app.navilla.repository.JournalPartnerRepository;
import app.navilla.security.EncryptionService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing journal partners.
 *
 * <p>Handles CRUD operations for journal partners with
 * end-to-end encryption of sensitive fields (alias, notes).
 * Partners are linked to journal entries via partner ID.
 *
 * @author Navilla Team
 * @since 2026-02-27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JournalPartnerService {

  private final JournalPartnerRepository partnerRepository;
  private final EncounterJournalRepository journalRepository;
  private final EncryptionService encryptionService;
  private final ObjectMapper objectMapper;
  private final JournalMetrics journalMetrics;

  /**
   * Lists all partners for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return list of partner responses with encounter stats
   */
  @Transactional(readOnly = true)
  public List<PartnerResponse> listPartners(Jwt jwt) {
    String userHash = hashEmail(jwt);

    List<JournalPartner> partners =
        partnerRepository.findByUserHashOrderByUpdatedAtDesc(userHash);

    return partners.stream()
        .map(p -> toPartnerResponse(p, userHash))
        .toList();
  }

  /**
   * Creates a new journal partner.
   *
   * @param jwt     the JWT token containing user info
   * @param request the create request
   * @return the created partner response
   */
  @Transactional
  public PartnerResponse createPartner(
      Jwt jwt, CreatePartnerRequest request) {
    String userHash = hashEmail(jwt);

    JournalPartner partner = JournalPartner.builder()
        .userHash(userHash)
        .aliasEncrypted(
            encryptionService.encryptToBytes(request.alias()))
        .connectionId(request.connectionId())
        .notesEncrypted(encryptOptional(request.notes()))
        .build();

    JournalPartner saved = partnerRepository.save(partner);
    log.info("Journal partner created for user");
    journalMetrics.recordPartnerCreated();

    return new PartnerResponse(
        saved.getId(),
        request.alias(),
        saved.getConnectionId(),
        null,
        0,
        null,
        null
    );
  }

  /**
   * Gets a partner detail view.
   *
   * @param jwt the JWT token containing user info
   * @param id  the partner ID
   * @return the partner detail response
   */
  @Transactional(readOnly = true)
  public PartnerDetailResponse getPartner(Jwt jwt, UUID id) {
    String userHash = hashEmail(jwt);

    JournalPartner partner = partnerRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "journal.partner.error.notFound"));

    if (!partner.getUserHash().equals(userHash)) {
      throw new IllegalStateException(
          "journal.partner.error.notOwner");
    }

    String alias = encryptionService
        .decryptFromBytes(partner.getAliasEncrypted());
    String notes = partner.getNotesEncrypted() != null
        ? encryptionService.decryptFromBytes(
            partner.getNotesEncrypted())
        : null;
    long count = journalRepository
        .countByPartnerIdAndUserHash(id, userHash);
    LocalDate firstDate = journalRepository
        .findFirstEncounterDate(id, userHash);
    LocalDate lastDate = journalRepository
        .findMostRecentEncounterDate(id, userHash);

    return new PartnerDetailResponse(
        partner.getId(),
        alias,
        partner.getConnectionId(),
        null,
        notes,
        count,
        firstDate,
        lastDate,
        partner.getCreatedAt(),
        partner.getUpdatedAt()
    );
  }

  /**
   * Updates an existing partner.
   *
   * @param jwt     the JWT token containing user info
   * @param id      the partner ID
   * @param request the update request
   * @return the updated partner response
   */
  @Transactional
  public PartnerResponse updatePartner(
      Jwt jwt, UUID id, UpdatePartnerRequest request) {
    String userHash = hashEmail(jwt);

    JournalPartner partner = partnerRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "journal.partner.error.notFound"));

    if (!partner.getUserHash().equals(userHash)) {
      throw new IllegalStateException(
          "journal.partner.error.notOwner");
    }

    if (request.alias() != null && !request.alias().isBlank()) {
      partner.setAliasEncrypted(
          encryptionService.encryptToBytes(request.alias()));
    }

    if (request.notes() != null) {
      partner.setNotesEncrypted(encryptOptional(request.notes()));
    }

    if (request.unlinkConnection()) {
      partner.setConnectionId(null);
    } else if (request.connectionId() != null) {
      partner.setConnectionId(request.connectionId());
    }

    JournalPartner saved = partnerRepository.save(partner);
    log.info("Journal partner updated: {}", id);
    journalMetrics.recordPartnerUpdated();

    return toPartnerResponse(saved, userHash);
  }

  /**
   * Deletes a partner and handles linked entries.
   *
   * @param jwt           the JWT token containing user info
   * @param id            the partner ID
   * @param deleteEntries if true, delete linked entries; otherwise unlink them
   */
  @Transactional
  public void deletePartner(Jwt jwt, UUID id, boolean deleteEntries) {
    String userHash = hashEmail(jwt);

    JournalPartner partner = partnerRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "journal.partner.error.notFound"));

    if (!partner.getUserHash().equals(userHash)) {
      throw new IllegalStateException(
          "journal.partner.error.notOwner");
    }

    List<EncounterJournal> linkedEntries =
        journalRepository.findByPartnerIdAndUserHash(id, userHash);

    if (deleteEntries) {
      journalRepository.deleteAll(linkedEntries);
    } else {
      for (EncounterJournal entry : linkedEntries) {
        entry.setPartnerId(null);
      }
      journalRepository.saveAll(linkedEntries);
    }

    partnerRepository.delete(partner);
    log.info("Journal partner deleted: {}", id);
    journalMetrics.recordPartnerDeleted();
  }

  /**
   * Lists journal entries for a specific partner.
   *
   * @param jwt       the JWT token containing user info
   * @param partnerId the partner ID
   * @return list of journal entry responses
   */
  @Transactional(readOnly = true)
  public List<JournalEntryResponse> listPartnerEntries(
      Jwt jwt, UUID partnerId) {
    String userHash = hashEmail(jwt);

    JournalPartner partner = partnerRepository.findById(partnerId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "journal.partner.error.notFound"));

    if (!partner.getUserHash().equals(userHash)) {
      throw new IllegalStateException(
          "journal.partner.error.notOwner");
    }

    List<EncounterJournal> entries = journalRepository
        .findByUserHashAndPartnerIdOrderByEncounterDateDesc(
            userHash, partnerId);

    return entries.stream()
        .map(e -> toEntryResponse(e, userHash))
        .toList();
  }

  /**
   * Promotes a freeform alias to a partner, backfilling
   * entries that match the alias (case-insensitive).
   *
   * @param jwt     the JWT token containing user info
   * @param request the promote request
   * @return the created partner response with stats
   */
  @Transactional
  public PartnerResponse promoteAlias(
      Jwt jwt, PromoteAliasRequest request) {
    String userHash = hashEmail(jwt);

    List<EncounterJournal> unlinkedEntries = journalRepository
        .findByUserHashAndPartnerIdIsNullOrderByEncounterDateDesc(
            userHash);

    List<EncounterJournal> matching = new ArrayList<>();
    for (EncounterJournal entry : unlinkedEntries) {
      if (entry.getPartnerAliasEncrypted() != null) {
        String decrypted = encryptionService
            .decryptFromBytes(entry.getPartnerAliasEncrypted());
        if (decrypted != null
            && decrypted.trim().equalsIgnoreCase(
                request.alias().trim())) {
          matching.add(entry);
        }
      }
    }

    JournalPartner partner = JournalPartner.builder()
        .userHash(userHash)
        .aliasEncrypted(
            encryptionService.encryptToBytes(request.alias()))
        .build();

    JournalPartner saved = partnerRepository.save(partner);

    for (EncounterJournal entry : matching) {
      entry.setPartnerId(saved.getId());
    }
    journalRepository.saveAll(matching);

    log.info("Alias promoted to partner with {} entries linked",
        matching.size());
    journalMetrics.recordPartnerPromoted();

    return toPartnerResponse(saved, userHash);
  }

  /**
   * Lists recent distinct aliases from entries without a partner.
   *
   * @param jwt the JWT token containing user info
   * @return up to 8 recent distinct aliases
   */
  @Transactional(readOnly = true)
  public List<String> listRecentAliases(Jwt jwt) {
    String userHash = hashEmail(jwt);

    List<EncounterJournal> entries = journalRepository
        .findByUserHashAndPartnerIdIsNullOrderByEncounterDateDesc(
            userHash);

    LinkedHashSet<String> aliases = new LinkedHashSet<>();
    for (EncounterJournal entry : entries) {
      if (aliases.size() >= 8) {
        break;
      }
      if (entry.getPartnerAliasEncrypted() != null) {
        String alias = encryptionService
            .decryptFromBytes(entry.getPartnerAliasEncrypted());
        if (alias != null && !alias.isBlank()) {
          aliases.add(alias);
        }
      }
    }

    return new ArrayList<>(aliases);
  }

  // ---- Private helpers ----

  private String hashEmail(Jwt jwt) {
    return encryptionService
        .hashEmail(jwt.getClaimAsString("email"));
  }

  private byte[] encryptOptional(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return encryptionService.encryptToBytes(value);
  }

  private PartnerResponse toPartnerResponse(
      JournalPartner partner, String userHash) {
    String alias = encryptionService
        .decryptFromBytes(partner.getAliasEncrypted());
    long count = journalRepository
        .countByPartnerIdAndUserHash(partner.getId(), userHash);
    LocalDate firstDate = journalRepository
        .findFirstEncounterDate(partner.getId(), userHash);
    LocalDate lastDate = journalRepository
        .findMostRecentEncounterDate(partner.getId(), userHash);

    return new PartnerResponse(
        partner.getId(),
        alias,
        partner.getConnectionId(),
        null,
        count,
        firstDate,
        lastDate
    );
  }

  private JournalEntryResponse toEntryResponse(
      EncounterJournal entry, String userHash) {
    Long partnerEncounterCount = null;
    if (entry.getPartnerId() != null) {
      partnerEncounterCount = journalRepository
          .countByPartnerIdAndUserHash(
              entry.getPartnerId(), userHash);
    }

    return new JournalEntryResponse(
        entry.getId(),
        entry.getEncounterDate(),
        entry.getPartnerAliasEncrypted() != null
            ? encryptionService.decryptFromBytes(
                entry.getPartnerAliasEncrypted())
            : null,
        entry.getConnectionId(),
        null,
        entry.getNotesEncrypted() != null
            ? encryptionService.decryptFromBytes(
                entry.getNotesEncrypted())
            : null,
        decryptCustomFields(entry.getCustomFieldsEncrypted()),
        entry.getPartnerId(),
        partnerEncounterCount,
        entry.getCreatedAt(),
        entry.getUpdatedAt()
    );
  }

  private List<CustomFieldDto> decryptCustomFields(
      byte[] encrypted) {
    if (encrypted == null) {
      return null;
    }
    try {
      String json =
          encryptionService.decryptFromBytes(encrypted);
      return objectMapper.readValue(
          json, new TypeReference<List<CustomFieldDto>>() {});
    } catch (Exception ex) {
      throw new RuntimeException(
          "Failed to deserialize custom fields", ex);
    }
  }
}
