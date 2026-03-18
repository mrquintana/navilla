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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.dto.CreatePartnerRequest;
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
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Unit tests for {@link JournalPartnerService}.
 *
 * @author Navilla Team
 * @since 2026-02-27
 */
@ExtendWith(MockitoExtension.class)
class JournalPartnerServiceTest {

  @Mock
  private JournalPartnerRepository partnerRepository;

  @Mock
  private EncounterJournalRepository journalRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private ObjectMapper objectMapper;

  @Mock
  private JournalMetrics journalMetrics;

  @Mock
  private ResourceCapService resourceCapService;

  @Mock
  private Jwt jwt;

  @InjectMocks
  private JournalPartnerService journalPartnerService;

  private static final String USER_EMAIL = "user@example.com";
  private static final String USER_HASH = "user_hash_abc123";
  private static final UUID PARTNER_ID = UUID.randomUUID();
  private static final byte[] ENCRYPTED_ALIAS = new byte[]{1, 2, 3};
  private static final byte[] ENCRYPTED_NOTES = new byte[]{4, 5, 6};

  private void stubAuth() {
    when(jwt.getClaimAsString("email")).thenReturn(USER_EMAIL);
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
  }

  private JournalPartner buildPartner(UUID id, String userHash) {
    return JournalPartner.builder()
        .id(id)
        .userHash(userHash)
        .aliasEncrypted(ENCRYPTED_ALIAS)
        .connectionId(null)
        .notesEncrypted(ENCRYPTED_NOTES)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  private EncounterJournal buildEntry(
      UUID id, String userHash, UUID partnerId, byte[] aliasBytes) {
    return EncounterJournal.builder()
        .id(id)
        .userHash(userHash)
        .encounterDate(LocalDate.of(2026, 3, 15))
        .partnerAliasEncrypted(aliasBytes)
        .partnerId(partnerId)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  @Nested
  @DisplayName("createPartner")
  class CreatePartnerTests {

    @Test
    @DisplayName("should create partner with encrypted alias and record metric")
    void shouldCreatePartnerWithEncryptedAlias() {
      stubAuth();
      CreatePartnerRequest request =
          new CreatePartnerRequest("Partner A", null, null);

      when(encryptionService.encryptToBytes("Partner A"))
          .thenReturn(ENCRYPTED_ALIAS);
      when(partnerRepository.save(any(JournalPartner.class)))
          .thenAnswer(invocation -> {
            JournalPartner saved = invocation.getArgument(0);
            saved.setId(PARTNER_ID);
            saved.setCreatedAt(OffsetDateTime.now());
            saved.setUpdatedAt(OffsetDateTime.now());
            return saved;
          });

      PartnerResponse result =
          journalPartnerService.createPartner(jwt, request);

      ArgumentCaptor<JournalPartner> captor =
          ArgumentCaptor.forClass(JournalPartner.class);
      verify(partnerRepository).save(captor.capture());
      JournalPartner captured = captor.getValue();
      assertThat(captured.getUserHash()).isEqualTo(USER_HASH);
      assertThat(captured.getAliasEncrypted()).isEqualTo(ENCRYPTED_ALIAS);
      assertThat(result.alias()).isEqualTo("Partner A");
      assertThat(result.encounterCount()).isZero();
      assertThat(result.firstEncounterDate()).isNull();
      assertThat(result.mostRecentEncounterDate()).isNull();
      verify(journalMetrics).recordPartnerCreated();
    }

    @Test
    @DisplayName("should create partner with notes and connectionId")
    void shouldCreatePartnerWithNotesAndConnectionId() {
      stubAuth();
      UUID connectionId = UUID.randomUUID();
      CreatePartnerRequest request =
          new CreatePartnerRequest("Partner B", connectionId, "Some notes");

      when(encryptionService.encryptToBytes("Partner B"))
          .thenReturn(ENCRYPTED_ALIAS);
      when(encryptionService.encryptToBytes("Some notes"))
          .thenReturn(ENCRYPTED_NOTES);
      when(partnerRepository.save(any(JournalPartner.class)))
          .thenAnswer(invocation -> {
            JournalPartner saved = invocation.getArgument(0);
            saved.setId(PARTNER_ID);
            saved.setCreatedAt(OffsetDateTime.now());
            saved.setUpdatedAt(OffsetDateTime.now());
            return saved;
          });

      PartnerResponse result =
          journalPartnerService.createPartner(jwt, request);

      ArgumentCaptor<JournalPartner> captor =
          ArgumentCaptor.forClass(JournalPartner.class);
      verify(partnerRepository).save(captor.capture());
      JournalPartner captured = captor.getValue();
      assertThat(captured.getConnectionId()).isEqualTo(connectionId);
      assertThat(captured.getNotesEncrypted()).isEqualTo(ENCRYPTED_NOTES);
      assertThat(result.alias()).isEqualTo("Partner B");
      assertThat(result.connectionId()).isEqualTo(connectionId);
    }
  }

  @Nested
  @DisplayName("listPartners")
  class ListPartnersTests {

    @Test
    @DisplayName("should return partners with encounter stats")
    void shouldReturnPartnersWithEncounterStats() {
      stubAuth();
      JournalPartner partner = buildPartner(PARTNER_ID, USER_HASH);

      when(partnerRepository.findByUserHashOrderByUpdatedAtDesc(USER_HASH))
          .thenReturn(List.of(partner));
      when(encryptionService.decryptFromBytes(ENCRYPTED_ALIAS))
          .thenReturn("Partner A");
      when(journalRepository.countByPartnerIdAndUserHash(PARTNER_ID, USER_HASH))
          .thenReturn(3L);
      when(journalRepository.findFirstEncounterDate(PARTNER_ID, USER_HASH))
          .thenReturn(LocalDate.of(2026, 1, 10));
      when(journalRepository.findMostRecentEncounterDate(PARTNER_ID, USER_HASH))
          .thenReturn(LocalDate.of(2026, 3, 15));

      List<PartnerResponse> result =
          journalPartnerService.listPartners(jwt);

      assertThat(result).hasSize(1);
      PartnerResponse resp = result.getFirst();
      assertThat(resp.alias()).isEqualTo("Partner A");
      assertThat(resp.encounterCount()).isEqualTo(3);
      assertThat(resp.firstEncounterDate())
          .isEqualTo(LocalDate.of(2026, 1, 10));
      assertThat(resp.mostRecentEncounterDate())
          .isEqualTo(LocalDate.of(2026, 3, 15));
    }

    @Test
    @DisplayName("should return empty list for user with no partners")
    void shouldReturnEmptyListWhenNoPartners() {
      stubAuth();
      when(partnerRepository.findByUserHashOrderByUpdatedAtDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      List<PartnerResponse> result =
          journalPartnerService.listPartners(jwt);

      assertThat(result).isEmpty();
    }
  }

  @Nested
  @DisplayName("getPartner")
  class GetPartnerTests {

    @Test
    @DisplayName("should return partner detail with decrypted alias and notes")
    void shouldReturnPartnerDetail() {
      stubAuth();
      JournalPartner partner = buildPartner(PARTNER_ID, USER_HASH);

      when(partnerRepository.findById(PARTNER_ID))
          .thenReturn(Optional.of(partner));
      when(encryptionService.decryptFromBytes(ENCRYPTED_ALIAS))
          .thenReturn("Partner A");
      when(encryptionService.decryptFromBytes(ENCRYPTED_NOTES))
          .thenReturn("Some notes");
      when(journalRepository.countByPartnerIdAndUserHash(PARTNER_ID, USER_HASH))
          .thenReturn(5L);
      when(journalRepository.findFirstEncounterDate(PARTNER_ID, USER_HASH))
          .thenReturn(LocalDate.of(2026, 1, 1));
      when(journalRepository.findMostRecentEncounterDate(PARTNER_ID, USER_HASH))
          .thenReturn(LocalDate.of(2026, 3, 15));

      PartnerDetailResponse result =
          journalPartnerService.getPartner(jwt, PARTNER_ID);

      assertThat(result.alias()).isEqualTo("Partner A");
      assertThat(result.notes()).isEqualTo("Some notes");
      assertThat(result.encounterCount()).isEqualTo(5);
      assertThat(result.firstEncounterDate())
          .isEqualTo(LocalDate.of(2026, 1, 1));
      assertThat(result.mostRecentEncounterDate())
          .isEqualTo(LocalDate.of(2026, 3, 15));
      assertThat(result.createdAt()).isNotNull();
      assertThat(result.updatedAt()).isNotNull();
    }

    @Test
    @DisplayName("should throw ResourceNotFoundException for non-existent ID")
    void shouldThrowNotFoundForMissingPartner() {
      stubAuth();
      when(partnerRepository.findById(PARTNER_ID))
          .thenReturn(Optional.empty());

      assertThatThrownBy(
          () -> journalPartnerService.getPartner(jwt, PARTNER_ID))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessage("journal.partner.error.notFound");
    }

    @Test
    @DisplayName("should throw IllegalStateException for partner owned by different user")
    void shouldThrowNotOwnerForDifferentUser() {
      stubAuth();
      JournalPartner partner =
          buildPartner(PARTNER_ID, "other_user_hash");

      when(partnerRepository.findById(PARTNER_ID))
          .thenReturn(Optional.of(partner));

      assertThatThrownBy(
          () -> journalPartnerService.getPartner(jwt, PARTNER_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("journal.partner.error.notOwner");
    }
  }

  @Nested
  @DisplayName("updatePartner")
  class UpdatePartnerTests {

    @Test
    @DisplayName("should update alias and notes")
    void shouldUpdateAliasAndNotes() {
      stubAuth();
      JournalPartner partner = buildPartner(PARTNER_ID, USER_HASH);

      when(partnerRepository.findById(PARTNER_ID))
          .thenReturn(Optional.of(partner));

      byte[] newAlias = new byte[]{20, 21, 22};
      byte[] newNotes = new byte[]{23, 24, 25};
      when(encryptionService.encryptToBytes("Partner B"))
          .thenReturn(newAlias);
      when(encryptionService.encryptToBytes("Updated notes"))
          .thenReturn(newNotes);
      when(partnerRepository.save(any(JournalPartner.class)))
          .thenAnswer(i -> i.getArgument(0));
      // Decryption stubs for toPartnerResponse
      when(encryptionService.decryptFromBytes(newAlias))
          .thenReturn("Partner B");
      when(journalRepository.countByPartnerIdAndUserHash(PARTNER_ID, USER_HASH))
          .thenReturn(2L);
      when(journalRepository.findFirstEncounterDate(PARTNER_ID, USER_HASH))
          .thenReturn(LocalDate.of(2026, 2, 1));
      when(journalRepository.findMostRecentEncounterDate(PARTNER_ID, USER_HASH))
          .thenReturn(LocalDate.of(2026, 3, 10));

      UpdatePartnerRequest request =
          new UpdatePartnerRequest("Partner B", null, "Updated notes", false);

      PartnerResponse result =
          journalPartnerService.updatePartner(jwt, PARTNER_ID, request);

      ArgumentCaptor<JournalPartner> captor =
          ArgumentCaptor.forClass(JournalPartner.class);
      verify(partnerRepository).save(captor.capture());
      JournalPartner captured = captor.getValue();
      assertThat(captured.getAliasEncrypted()).isEqualTo(newAlias);
      assertThat(captured.getNotesEncrypted()).isEqualTo(newNotes);
      assertThat(result.alias()).isEqualTo("Partner B");
      verify(journalMetrics).recordPartnerUpdated();
    }

    @Test
    @DisplayName("should handle unlinkConnection flag")
    void shouldHandleUnlinkConnection() {
      stubAuth();
      UUID connectionId = UUID.randomUUID();
      JournalPartner partner = buildPartner(PARTNER_ID, USER_HASH);
      partner.setConnectionId(connectionId);

      when(partnerRepository.findById(PARTNER_ID))
          .thenReturn(Optional.of(partner));
      when(partnerRepository.save(any(JournalPartner.class)))
          .thenAnswer(i -> i.getArgument(0));
      // Decryption stubs for toPartnerResponse
      when(encryptionService.decryptFromBytes(ENCRYPTED_ALIAS))
          .thenReturn("Partner A");
      when(journalRepository.countByPartnerIdAndUserHash(PARTNER_ID, USER_HASH))
          .thenReturn(0L);
      when(journalRepository.findFirstEncounterDate(PARTNER_ID, USER_HASH))
          .thenReturn(null);
      when(journalRepository.findMostRecentEncounterDate(PARTNER_ID, USER_HASH))
          .thenReturn(null);

      UpdatePartnerRequest request =
          new UpdatePartnerRequest(null, null, null, true);

      PartnerResponse result =
          journalPartnerService.updatePartner(jwt, PARTNER_ID, request);

      ArgumentCaptor<JournalPartner> captor =
          ArgumentCaptor.forClass(JournalPartner.class);
      verify(partnerRepository).save(captor.capture());
      JournalPartner captured = captor.getValue();
      assertThat(captured.getConnectionId()).isNull();
      assertThat(result.connectionId()).isNull();
    }
  }

  @Nested
  @DisplayName("deletePartner")
  class DeletePartnerTests {

    @Test
    @DisplayName("should soft delete: unlink entries and delete partner")
    void shouldSoftDeleteUnlinkingEntries() {
      stubAuth();
      JournalPartner partner = buildPartner(PARTNER_ID, USER_HASH);
      UUID entryId = UUID.randomUUID();
      EncounterJournal entry =
          buildEntry(entryId, USER_HASH, PARTNER_ID, ENCRYPTED_ALIAS);

      when(partnerRepository.findById(PARTNER_ID))
          .thenReturn(Optional.of(partner));
      when(journalRepository.findByPartnerIdAndUserHash(PARTNER_ID, USER_HASH))
          .thenReturn(List.of(entry));

      journalPartnerService.deletePartner(jwt, PARTNER_ID, false);

      assertThat(entry.getPartnerId()).isNull();
      verify(journalRepository).saveAll(List.of(entry));
      verify(journalRepository, never()).deleteAll(any());
      verify(partnerRepository).delete(partner);
      verify(journalMetrics).recordPartnerDeleted();
    }

    @Test
    @DisplayName("should destructive delete: delete entries and partner")
    void shouldDestructiveDeleteEntries() {
      stubAuth();
      JournalPartner partner = buildPartner(PARTNER_ID, USER_HASH);
      UUID entryId = UUID.randomUUID();
      EncounterJournal entry =
          buildEntry(entryId, USER_HASH, PARTNER_ID, ENCRYPTED_ALIAS);

      when(partnerRepository.findById(PARTNER_ID))
          .thenReturn(Optional.of(partner));
      when(journalRepository.findByPartnerIdAndUserHash(PARTNER_ID, USER_HASH))
          .thenReturn(List.of(entry));

      journalPartnerService.deletePartner(jwt, PARTNER_ID, true);

      verify(journalRepository).deleteAll(List.of(entry));
      verify(journalRepository, never()).saveAll(any());
      verify(partnerRepository).delete(partner);
      verify(journalMetrics).recordPartnerDeleted();
    }
  }

  @Nested
  @DisplayName("promoteAlias")
  class PromoteAliasTests {

    @Test
    @DisplayName("should create partner from alias and backfill matching entries")
    void shouldPromoteAliasAndBackfill() {
      stubAuth();
      PromoteAliasRequest request = new PromoteAliasRequest("Partner A");

      UUID entryId1 = UUID.randomUUID();
      UUID entryId2 = UUID.randomUUID();
      byte[] alias1Bytes = new byte[]{10, 11, 12};
      byte[] alias2Bytes = new byte[]{13, 14, 15};
      EncounterJournal entry1 =
          buildEntry(entryId1, USER_HASH, null, alias1Bytes);
      EncounterJournal entry2 =
          buildEntry(entryId2, USER_HASH, null, alias2Bytes);

      when(journalRepository
          .findByUserHashAndPartnerIdIsNullOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(List.of(entry1, entry2));
      when(encryptionService.decryptFromBytes(alias1Bytes))
          .thenReturn("partner a");
      when(encryptionService.decryptFromBytes(alias2Bytes))
          .thenReturn("Other Partner");
      when(encryptionService.encryptToBytes("Partner A"))
          .thenReturn(ENCRYPTED_ALIAS);
      when(partnerRepository.save(any(JournalPartner.class)))
          .thenAnswer(invocation -> {
            JournalPartner saved = invocation.getArgument(0);
            saved.setId(PARTNER_ID);
            saved.setCreatedAt(OffsetDateTime.now());
            saved.setUpdatedAt(OffsetDateTime.now());
            return saved;
          });
      // toPartnerResponse stubs
      when(encryptionService.decryptFromBytes(ENCRYPTED_ALIAS))
          .thenReturn("Partner A");
      when(journalRepository.countByPartnerIdAndUserHash(PARTNER_ID, USER_HASH))
          .thenReturn(1L);
      when(journalRepository.findFirstEncounterDate(PARTNER_ID, USER_HASH))
          .thenReturn(LocalDate.of(2026, 3, 15));
      when(journalRepository.findMostRecentEncounterDate(PARTNER_ID, USER_HASH))
          .thenReturn(LocalDate.of(2026, 3, 15));

      PartnerResponse result =
          journalPartnerService.promoteAlias(jwt, request);

      // entry1 matched (case-insensitive), entry2 did not
      assertThat(entry1.getPartnerId()).isEqualTo(PARTNER_ID);
      assertThat(entry2.getPartnerId()).isNull();
      verify(journalRepository).saveAll(List.of(entry1));
      verify(journalMetrics).recordPartnerPromoted();
      assertThat(result.alias()).isEqualTo("Partner A");
    }

    @Test
    @DisplayName("should not match entries that already have a partnerId")
    void shouldNotMatchEntriesWithExistingPartnerId() {
      stubAuth();
      PromoteAliasRequest request = new PromoteAliasRequest("Partner A");

      // No entries returned because query filters by partnerId IS NULL
      when(journalRepository
          .findByUserHashAndPartnerIdIsNullOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());
      when(encryptionService.encryptToBytes("Partner A"))
          .thenReturn(ENCRYPTED_ALIAS);
      when(partnerRepository.save(any(JournalPartner.class)))
          .thenAnswer(invocation -> {
            JournalPartner saved = invocation.getArgument(0);
            saved.setId(PARTNER_ID);
            saved.setCreatedAt(OffsetDateTime.now());
            saved.setUpdatedAt(OffsetDateTime.now());
            return saved;
          });
      // toPartnerResponse stubs
      when(encryptionService.decryptFromBytes(ENCRYPTED_ALIAS))
          .thenReturn("Partner A");
      when(journalRepository.countByPartnerIdAndUserHash(PARTNER_ID, USER_HASH))
          .thenReturn(0L);
      when(journalRepository.findFirstEncounterDate(PARTNER_ID, USER_HASH))
          .thenReturn(null);
      when(journalRepository.findMostRecentEncounterDate(PARTNER_ID, USER_HASH))
          .thenReturn(null);

      PartnerResponse result =
          journalPartnerService.promoteAlias(jwt, request);

      verify(journalRepository).saveAll(Collections.emptyList());
      assertThat(result.encounterCount()).isZero();
    }
  }

  @Nested
  @DisplayName("listRecentAliases")
  class ListRecentAliasesTests {

    @Test
    @DisplayName("should return distinct decrypted aliases limited to 8")
    void shouldReturnDistinctAliasesLimitedToEight() {
      stubAuth();
      // Create 10 entries with some duplicate aliases
      List<EncounterJournal> entries = new java.util.ArrayList<>();
      for (int i = 0; i < 10; i++) {
        byte[] aliasBytes = new byte[]{(byte) (50 + i)};
        entries.add(buildEntry(
            UUID.randomUUID(), USER_HASH, null, aliasBytes));
      }

      when(journalRepository
          .findByUserHashAndPartnerIdIsNullOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(entries);
      // First two entries have the same alias (duplicate)
      when(encryptionService.decryptFromBytes(new byte[]{50}))
          .thenReturn("Alpha");
      when(encryptionService.decryptFromBytes(new byte[]{51}))
          .thenReturn("Alpha"); // duplicate
      when(encryptionService.decryptFromBytes(new byte[]{52}))
          .thenReturn("Bravo");
      when(encryptionService.decryptFromBytes(new byte[]{53}))
          .thenReturn("Charlie");
      when(encryptionService.decryptFromBytes(new byte[]{54}))
          .thenReturn("Delta");
      when(encryptionService.decryptFromBytes(new byte[]{55}))
          .thenReturn("Echo");
      when(encryptionService.decryptFromBytes(new byte[]{56}))
          .thenReturn("Foxtrot");
      when(encryptionService.decryptFromBytes(new byte[]{57}))
          .thenReturn("Golf");
      when(encryptionService.decryptFromBytes(new byte[]{58}))
          .thenReturn("Hotel");
      // 10th entry should NOT be decrypted because limit of 8 reached
      // after 9 entries (9 entries produce 8 unique aliases)

      List<String> result =
          journalPartnerService.listRecentAliases(jwt);

      assertThat(result).hasSize(8);
      assertThat(result).containsExactly(
          "Alpha", "Bravo", "Charlie", "Delta",
          "Echo", "Foxtrot", "Golf", "Hotel");
    }

    @Test
    @DisplayName("should skip entries with partnerId (query filters them)")
    void shouldSkipEntriesWithPartnerId() {
      stubAuth();
      // The repository query already filters by partnerId IS NULL
      // so only entries without partnerId are returned
      byte[] alias1 = new byte[]{60};
      byte[] alias2 = new byte[]{61};
      EncounterJournal entry1 =
          buildEntry(UUID.randomUUID(), USER_HASH, null, alias1);
      EncounterJournal entry2 =
          buildEntry(UUID.randomUUID(), USER_HASH, null, alias2);

      when(journalRepository
          .findByUserHashAndPartnerIdIsNullOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(List.of(entry1, entry2));
      when(encryptionService.decryptFromBytes(alias1))
          .thenReturn("Solo Alias 1");
      when(encryptionService.decryptFromBytes(alias2))
          .thenReturn("Solo Alias 2");

      List<String> result =
          journalPartnerService.listRecentAliases(jwt);

      assertThat(result).hasSize(2);
      assertThat(result).containsExactly("Solo Alias 1", "Solo Alias 2");
      verify(journalRepository)
          .findByUserHashAndPartnerIdIsNullOrderByEncounterDateDesc(USER_HASH);
    }
  }
}
