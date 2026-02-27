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
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import app.navilla.dto.CreateJournalEntryRequest;
import app.navilla.dto.CustomFieldDto;
import app.navilla.dto.JournalEntryResponse;
import app.navilla.dto.JournalSummaryResponse;
import app.navilla.dto.JournalTemplateResponse;
import app.navilla.dto.JournalTemplatesRequest;
import app.navilla.dto.UpdateJournalEntryRequest;
import app.navilla.entity.EncounterJournal;
import app.navilla.entity.JournalFieldTemplate;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.EncounterJournalRepository;
import app.navilla.repository.JournalFieldTemplateRepository;
import app.navilla.security.EncryptionService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing encounter journal entries.
 *
 * <p>Handles CRUD operations for journal entries with
 * end-to-end encryption of sensitive fields (partner alias,
 * notes, custom fields). Uses the user's email hash for
 * identity rather than raw email.
 *
 * @author Navilla Team
 * @since 2026-02-27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EncounterJournalService {

  private final EncounterJournalRepository journalRepository;
  private final JournalFieldTemplateRepository templateRepository;
  private final EncryptionService encryptionService;
  private final ObjectMapper objectMapper;

  /**
   * Lists journal entries for the authenticated user.
   *
   * @param jwt   the JWT token containing user info
   * @param month optional month filter in "YYYY-MM" format
   * @return list of decrypted journal entry responses
   */
  @Transactional(readOnly = true)
  public List<JournalEntryResponse> listEntries(Jwt jwt, String month) {
    String userHash = hashEmail(jwt);

    List<EncounterJournal> entries;
    if (month != null && !month.isBlank()) {
      YearMonth ym = YearMonth.parse(month);
      LocalDate startDate = ym.atDay(1);
      LocalDate endDate = ym.atEndOfMonth();
      entries = journalRepository.findByUserHashAndMonth(
          userHash, startDate, endDate);
    } else {
      entries = journalRepository
          .findByUserHashOrderByEncounterDateDesc(userHash);
    }

    return entries.stream().map(this::toResponse).toList();
  }

  /**
   * Creates a new journal entry for the authenticated user.
   *
   * @param jwt     the JWT token containing user info
   * @param request the create request
   * @return the created journal entry response
   */
  @Transactional
  public JournalEntryResponse createEntry(
      Jwt jwt, CreateJournalEntryRequest request) {
    String userHash = hashEmail(jwt);

    EncounterJournal entry = EncounterJournal.builder()
        .userHash(userHash)
        .encounterDate(request.encounterDate())
        .partnerAliasEncrypted(
            encryptOptional(request.partnerAlias()))
        .connectionId(request.connectionId())
        .notesEncrypted(encryptOptional(request.notes()))
        .customFieldsEncrypted(
            encryptCustomFields(request.customFields()))
        .build();

    EncounterJournal saved = journalRepository.save(entry);
    log.info("Journal entry created for user");
    return toResponse(saved);
  }

  /**
   * Updates an existing journal entry.
   *
   * @param jwt     the JWT token containing user info
   * @param id      the entry ID
   * @param request the update request
   * @return the updated journal entry response
   */
  @Transactional
  public JournalEntryResponse updateEntry(
      Jwt jwt, UUID id, UpdateJournalEntryRequest request) {
    String userHash = hashEmail(jwt);

    EncounterJournal entry = journalRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "journal.error.notFound"));

    if (!entry.getUserHash().equals(userHash)) {
      throw new IllegalStateException("journal.error.notOwner");
    }

    entry.setEncounterDate(request.encounterDate());
    entry.setPartnerAliasEncrypted(
        encryptOptional(request.partnerAlias()));
    entry.setConnectionId(request.connectionId());
    entry.setNotesEncrypted(encryptOptional(request.notes()));
    entry.setCustomFieldsEncrypted(
        encryptCustomFields(request.customFields()));

    EncounterJournal saved = journalRepository.save(entry);
    log.info("Journal entry updated: {}", id);
    return toResponse(saved);
  }

  /**
   * Deletes a journal entry owned by the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @param id  the entry ID
   */
  @Transactional
  public void deleteEntry(Jwt jwt, UUID id) {
    String userHash = hashEmail(jwt);

    EncounterJournal entry = journalRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "journal.error.notFound"));

    if (!entry.getUserHash().equals(userHash)) {
      throw new IllegalStateException("journal.error.notOwner");
    }

    journalRepository.delete(entry);
    log.info("Journal entry deleted: {}", id);
  }

  /**
   * Returns monthly encounter counts for a given year.
   *
   * @param jwt  the JWT token containing user info
   * @param year the year to summarize
   * @return summary with monthly counts and year total
   */
  @Transactional(readOnly = true)
  public JournalSummaryResponse getSummary(Jwt jwt, int year) {
    String userHash = hashEmail(jwt);

    List<Object[]> monthlyData =
        journalRepository.countByMonth(userHash, year);

    Map<String, Long> monthlyCounts = new LinkedHashMap<>();
    long yearTotal = 0;
    for (Object[] row : monthlyData) {
      String month = (String) row[0];
      Long count = (Long) row[1];
      monthlyCounts.put(month, count);
      yearTotal += count;
    }

    return new JournalSummaryResponse(year, monthlyCounts, yearTotal);
  }

  /**
   * Retrieves the user's custom field templates.
   *
   * @param jwt the JWT token containing user info
   * @return the template labels
   */
  @Transactional(readOnly = true)
  public JournalTemplateResponse getTemplates(Jwt jwt) {
    String userHash = hashEmail(jwt);

    List<JournalFieldTemplate> templates =
        templateRepository.findByUserHashOrderByDisplayOrder(userHash);

    List<String> labels = templates.stream()
        .map(t -> encryptionService
            .decryptFromBytes(t.getLabelEncrypted()))
        .toList();

    return new JournalTemplateResponse(labels);
  }

  /**
   * Saves custom field templates for the authenticated user.
   *
   * <p>Deletes all existing templates for the user, then saves
   * the new ones with encrypted labels and sequential display
   * order starting at 1.
   *
   * @param jwt     the JWT token containing user info
   * @param request the template labels to save
   * @return the saved template labels
   */
  @Transactional
  public JournalTemplateResponse saveTemplates(
      Jwt jwt, JournalTemplatesRequest request) {
    String userHash = hashEmail(jwt);

    templateRepository.deleteByUserHash(userHash);

    AtomicInteger order = new AtomicInteger(1);
    List<JournalFieldTemplate> templates = request.labels().stream()
        .map(label -> JournalFieldTemplate.builder()
            .userHash(userHash)
            .labelEncrypted(
                encryptionService.encryptToBytes(label))
            .displayOrder(order.getAndIncrement())
            .build())
        .toList();

    templateRepository.saveAll(templates);
    log.info("Saved {} journal templates for user", templates.size());
    return getTemplates(jwt);
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

  private byte[] encryptCustomFields(List<CustomFieldDto> fields) {
    if (fields == null || fields.isEmpty()) {
      return null;
    }
    try {
      String json = objectMapper.writeValueAsString(fields);
      return encryptionService.encryptToBytes(json);
    } catch (Exception ex) {
      throw new RuntimeException(
          "Failed to serialize custom fields", ex);
    }
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

  private JournalEntryResponse toResponse(
      EncounterJournal entry) {
    return new JournalEntryResponse(
        entry.getId(),
        entry.getEncounterDate(),
        entry.getPartnerAliasEncrypted() != null
            ? encryptionService.decryptFromBytes(
                entry.getPartnerAliasEncrypted())
            : null,
        entry.getConnectionId(),
        null, // connectionDisplayName resolved later
        entry.getNotesEncrypted() != null
            ? encryptionService.decryptFromBytes(
                entry.getNotesEncrypted())
            : null,
        decryptCustomFields(entry.getCustomFieldsEncrypted()),
        entry.getCreatedAt(),
        entry.getUpdatedAt()
    );
  }
}
