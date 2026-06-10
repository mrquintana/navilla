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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.dto.CreateJournalEntryRequest;
import app.navilla.dto.CustomFieldDto;
import app.navilla.dto.JournalEntryResponse;
import app.navilla.dto.JournalSummaryResponse;
import app.navilla.dto.JournalTemplateResponse;
import app.navilla.dto.JournalTemplatesRequest;
import app.navilla.dto.UpdateJournalEntryRequest;
import app.navilla.entity.EncounterJournal;
import app.navilla.entity.JournalFieldTemplate;
import app.navilla.entity.JournalPartner;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.metrics.JournalMetrics;
import app.navilla.repository.EncounterJournalRepository;
import app.navilla.repository.JournalFieldTemplateRepository;
import app.navilla.repository.JournalPartnerRepository;
import app.navilla.security.EncryptionService;
import com.fasterxml.jackson.core.type.TypeReference;
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
 * Unit tests for {@link EncounterJournalService}.
 *
 * @author Navilla Team
 * @since 2026-02-27
 */
@ExtendWith(MockitoExtension.class)
class EncounterJournalServiceTest {

  @Mock
  private EncounterJournalRepository journalRepository;

  @Mock
  private JournalFieldTemplateRepository templateRepository;

  @Mock
  private JournalPartnerRepository partnerRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private ObjectMapper objectMapper;

  @Mock
  private PhoneMatchService phoneMatchService;

  @Mock
  private JournalMetrics journalMetrics;

  @Mock
  private ResourceCapService resourceCapService;

  @Mock
  private Jwt jwt;

  @InjectMocks
  private EncounterJournalService encounterJournalService;

  private static final String USER_EMAIL = "user@example.com";
  private static final String USER_HASH = "user_hash_abc123";
  private static final UUID ENTRY_ID = UUID.randomUUID();
  private static final byte[] ENCRYPTED_ALIAS = new byte[]{1, 2, 3};
  private static final byte[] ENCRYPTED_NOTES = new byte[]{4, 5, 6};
  private static final byte[] ENCRYPTED_CUSTOM = new byte[]{7, 8, 9};
  private static final byte[] ENCRYPTED_LABEL = new byte[]{10, 11, 12};

  private void stubAuth() {
    when(jwt.getClaimAsString("email")).thenReturn(USER_EMAIL);
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
  }

  private EncounterJournal buildEntry(UUID id, String userHash) {
    return EncounterJournal.builder()
        .id(id)
        .userHash(userHash)
        .encounterDate(LocalDate.of(2026, 3, 15))
        .partnerAliasEncrypted(ENCRYPTED_ALIAS)
        .connectionId(null)
        .notesEncrypted(ENCRYPTED_NOTES)
        .customFieldsEncrypted(ENCRYPTED_CUSTOM)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  @Nested
  @DisplayName("listEntries")
  class ListEntriesTests {

    @Test
    @DisplayName("should return decrypted entries for authenticated user")
    void shouldReturnDecryptedEntries() throws Exception {
      stubAuth();
      EncounterJournal entry = buildEntry(ENTRY_ID, USER_HASH);

      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(List.of(entry));
      when(encryptionService.decryptFromBytes(ENCRYPTED_ALIAS)).thenReturn("Partner A");
      when(encryptionService.decryptFromBytes(ENCRYPTED_NOTES)).thenReturn("Some notes");
      String customJson = "[{\"label\":\"Location\",\"value\":\"Home\"}]";
      when(encryptionService.decryptFromBytes(ENCRYPTED_CUSTOM))
          .thenReturn(customJson);
      when(objectMapper.readValue(eq(customJson), any(TypeReference.class)))
          .thenReturn(List.of(new CustomFieldDto("Location", "Home")));

      @SuppressWarnings("unchecked")
      List<JournalEntryResponse> result =
          (List<JournalEntryResponse>) encounterJournalService
              .listEntries(jwt, null, null, null);

      assertThat(result).hasSize(1);
      assertThat(result.getFirst().partnerAlias()).isEqualTo("Partner A");
      assertThat(result.getFirst().notes()).isEqualTo("Some notes");
      assertThat(result.getFirst().customFields()).hasSize(1);
      assertThat(result.getFirst().customFields().getFirst().label()).isEqualTo("Location");
      verify(encryptionService).decryptFromBytes(ENCRYPTED_ALIAS);
      verify(encryptionService).decryptFromBytes(ENCRYPTED_NOTES);
    }

    @Test
    @DisplayName("should return empty list when no entries")
    void shouldReturnEmptyListWhenNoEntries() {
      stubAuth();
      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      @SuppressWarnings("unchecked")
      List<JournalEntryResponse> result =
          (List<JournalEntryResponse>) encounterJournalService
              .listEntries(jwt, null, null, null);

      assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("should filter by month when month parameter provided")
    void shouldFilterByMonth() throws Exception {
      stubAuth();
      EncounterJournal entry = buildEntry(ENTRY_ID, USER_HASH);
      LocalDate startDate = LocalDate.of(2026, 3, 1);
      LocalDate endDate = LocalDate.of(2026, 3, 31);

      when(journalRepository.findByUserHashAndMonth(USER_HASH, startDate, endDate))
          .thenReturn(List.of(entry));
      when(encryptionService.decryptFromBytes(ENCRYPTED_ALIAS)).thenReturn("Partner A");
      when(encryptionService.decryptFromBytes(ENCRYPTED_NOTES)).thenReturn("Some notes");
      String customJson = "[{\"label\":\"Location\",\"value\":\"Home\"}]";
      when(encryptionService.decryptFromBytes(ENCRYPTED_CUSTOM))
          .thenReturn(customJson);
      when(objectMapper.readValue(eq(customJson), any(TypeReference.class)))
          .thenReturn(List.of(new CustomFieldDto("Location", "Home")));

      @SuppressWarnings("unchecked")
      List<JournalEntryResponse> result =
          (List<JournalEntryResponse>) encounterJournalService
              .listEntries(jwt, "2026-03", null, null);

      assertThat(result).hasSize(1);
      verify(journalRepository).findByUserHashAndMonth(USER_HASH, startDate, endDate);
      verify(journalRepository, never()).findByUserHashOrderByEncounterDateDesc(anyString());
    }
  }

  @Nested
  @DisplayName("createEntry")
  class CreateEntryTests {

    @Test
    @DisplayName("should encrypt alias, notes, and save with userHash")
    void shouldEncryptAndSave() throws Exception {
      stubAuth();
      List<CustomFieldDto> customFields = List.of(new CustomFieldDto("Location", "Home"));
      CreateJournalEntryRequest request = new CreateJournalEntryRequest(
          LocalDate.of(2026, 3, 15), "Partner A", null, "Some notes", customFields, null, null, null, null, null);

      when(encryptionService.encryptToBytes("Partner A")).thenReturn(ENCRYPTED_ALIAS);
      when(encryptionService.encryptToBytes("Some notes")).thenReturn(ENCRYPTED_NOTES);
      String customJson = "[{\"label\":\"Location\",\"value\":\"Home\"}]";
      when(objectMapper.writeValueAsString(customFields)).thenReturn(customJson);
      when(encryptionService.encryptToBytes(customJson)).thenReturn(ENCRYPTED_CUSTOM);
      when(journalRepository.save(any(EncounterJournal.class))).thenAnswer(invocation -> {
        EncounterJournal saved = invocation.getArgument(0);
        saved.setId(ENTRY_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });
      // Decryption stubs for toResponse
      when(encryptionService.decryptFromBytes(ENCRYPTED_ALIAS)).thenReturn("Partner A");
      when(encryptionService.decryptFromBytes(ENCRYPTED_NOTES)).thenReturn("Some notes");
      when(encryptionService.decryptFromBytes(ENCRYPTED_CUSTOM)).thenReturn(customJson);
      when(objectMapper.readValue(eq(customJson), any(TypeReference.class)))
          .thenReturn(customFields);

      JournalEntryResponse result = encounterJournalService.createEntry(jwt, request);

      ArgumentCaptor<EncounterJournal> captor = ArgumentCaptor.forClass(EncounterJournal.class);
      verify(journalRepository).save(captor.capture());
      EncounterJournal captured = captor.getValue();
      assertThat(captured.getUserHash()).isEqualTo(USER_HASH);
      assertThat(captured.getEncounterDate()).isEqualTo(LocalDate.of(2026, 3, 15));
      assertThat(captured.getPartnerAliasEncrypted()).isEqualTo(ENCRYPTED_ALIAS);
      assertThat(captured.getNotesEncrypted()).isEqualTo(ENCRYPTED_NOTES);
      assertThat(captured.getCustomFieldsEncrypted()).isEqualTo(ENCRYPTED_CUSTOM);
      assertThat(result.partnerAlias()).isEqualTo("Partner A");
    }

    @Test
    @DisplayName("should handle null optional fields")
    void shouldHandleNullOptionalFields() throws Exception {
      stubAuth();
      CreateJournalEntryRequest request = new CreateJournalEntryRequest(
          LocalDate.of(2026, 3, 15), null, null, null, null, null, null, null, null, null);

      when(journalRepository.save(any(EncounterJournal.class))).thenAnswer(invocation -> {
        EncounterJournal saved = invocation.getArgument(0);
        saved.setId(ENTRY_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      JournalEntryResponse result = encounterJournalService.createEntry(jwt, request);

      ArgumentCaptor<EncounterJournal> captor = ArgumentCaptor.forClass(EncounterJournal.class);
      verify(journalRepository).save(captor.capture());
      EncounterJournal captured = captor.getValue();
      assertThat(captured.getPartnerAliasEncrypted()).isNull();
      assertThat(captured.getNotesEncrypted()).isNull();
      assertThat(captured.getCustomFieldsEncrypted()).isNull();
      assertThat(captured.getEncounterTypesEncrypted()).isNull();
      assertThat(captured.getProtectionMethodsEncrypted()).isNull();
      assertThat(result.partnerAlias()).isNull();
      assertThat(result.notes()).isNull();
      assertThat(result.customFields()).isNull();
      assertThat(result.encounterTypes()).isNull();
      assertThat(result.protectionMethods()).isNull();
      verify(encryptionService, never()).encryptToBytes(anyString());
    }

    @Test
    @DisplayName("should encrypt custom fields as JSON blob")
    void shouldEncryptCustomFieldsAsJsonBlob() throws Exception {
      stubAuth();
      List<CustomFieldDto> customFields = List.of(
          new CustomFieldDto("Location", "Home"),
          new CustomFieldDto("Mood", "Happy"));
      CreateJournalEntryRequest request = new CreateJournalEntryRequest(
          LocalDate.of(2026, 3, 15), null, null, null, customFields, null, null, null, null, null);

      String customJson = "[{\"label\":\"Location\",\"value\":\"Home\"},{\"label\":\"Mood\",\"value\":\"Happy\"}]";
      when(objectMapper.writeValueAsString(customFields)).thenReturn(customJson);
      when(encryptionService.encryptToBytes(customJson)).thenReturn(ENCRYPTED_CUSTOM);
      when(journalRepository.save(any(EncounterJournal.class))).thenAnswer(invocation -> {
        EncounterJournal saved = invocation.getArgument(0);
        saved.setId(ENTRY_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });
      // Decryption stubs for toResponse
      when(encryptionService.decryptFromBytes(ENCRYPTED_CUSTOM)).thenReturn(customJson);
      when(objectMapper.readValue(eq(customJson), any(TypeReference.class)))
          .thenReturn(customFields);

      JournalEntryResponse result = encounterJournalService.createEntry(jwt, request);

      verify(objectMapper).writeValueAsString(customFields);
      verify(encryptionService).encryptToBytes(customJson);
      assertThat(result.customFields()).hasSize(2);
    }

    @Test
    @DisplayName("should encrypt encounter types and protection methods")
    void shouldEncryptEncounterTypesAndProtectionMethods() throws Exception {
      stubAuth();
      List<String> encounterTypes = List.of("ORAL", "ANAL");
      List<String> protectionMethods = List.of("CONDOM", "PREP");
      CreateJournalEntryRequest request = new CreateJournalEntryRequest(
          LocalDate.of(2026, 3, 15), null, null, null, null, null, null, null,
          encounterTypes, protectionMethods);

      byte[] encTypes = new byte[]{50, 51, 52};
      byte[] encProtection = new byte[]{60, 61, 62};
      String typesJson = "[\"ORAL\",\"ANAL\"]";
      String protectionJson = "[\"CONDOM\",\"PREP\"]";
      when(objectMapper.writeValueAsString(encounterTypes)).thenReturn(typesJson);
      when(encryptionService.encryptToBytes(typesJson)).thenReturn(encTypes);
      when(objectMapper.writeValueAsString(protectionMethods)).thenReturn(protectionJson);
      when(encryptionService.encryptToBytes(protectionJson)).thenReturn(encProtection);
      when(journalRepository.save(any(EncounterJournal.class))).thenAnswer(invocation -> {
        EncounterJournal saved = invocation.getArgument(0);
        saved.setId(ENTRY_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });
      // Decryption stubs for toResponse
      when(encryptionService.decryptFromBytes(encTypes)).thenReturn(typesJson);
      when(encryptionService.decryptFromBytes(encProtection)).thenReturn(protectionJson);
      when(objectMapper.readValue(eq(typesJson), any(TypeReference.class)))
          .thenReturn(encounterTypes);
      when(objectMapper.readValue(eq(protectionJson), any(TypeReference.class)))
          .thenReturn(protectionMethods);

      JournalEntryResponse result = encounterJournalService.createEntry(jwt, request);

      ArgumentCaptor<EncounterJournal> captor = ArgumentCaptor.forClass(EncounterJournal.class);
      verify(journalRepository).save(captor.capture());
      EncounterJournal captured = captor.getValue();
      assertThat(captured.getEncounterTypesEncrypted()).isEqualTo(encTypes);
      assertThat(captured.getProtectionMethodsEncrypted()).isEqualTo(encProtection);
      assertThat(result.encounterTypes()).containsExactly("ORAL", "ANAL");
      assertThat(result.protectionMethods()).containsExactly("CONDOM", "PREP");
    }

    @Test
    @DisplayName("should hash phone and register phone match when phone provided")
    void shouldHashPhoneAndRegisterPhoneMatch() throws Exception {
      stubAuth();
      String rawPhone = "+52 55 1234 5678";
      String phoneHash = "phone_hash_abc123";
      CreateJournalEntryRequest request = new CreateJournalEntryRequest(
          LocalDate.of(2026, 3, 15), null, null, null, null, null, rawPhone, null, null, null);

      when(encryptionService.hashPhone(rawPhone, null)).thenReturn(phoneHash);
      when(journalRepository.save(any(EncounterJournal.class))).thenAnswer(invocation -> {
        EncounterJournal saved = invocation.getArgument(0);
        if (saved.getId() == null) {
          saved.setId(ENTRY_ID);
        }
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      encounterJournalService.createEntry(jwt, request);

      // Verify phone hash was set on the entity
      ArgumentCaptor<EncounterJournal> captor = ArgumentCaptor.forClass(EncounterJournal.class);
      verify(journalRepository, org.mockito.Mockito.atLeast(2)).save(captor.capture());
      EncounterJournal lastSaved = captor.getAllValues().getLast();
      assertThat(lastSaved.getPhoneHash()).isEqualTo(phoneHash);

      // Verify phone match registration was called
      verify(phoneMatchService).registerPhoneEntry(
          eq(USER_HASH), eq(rawPhone), eq(null),
          eq(LocalDate.of(2026, 3, 15)), eq(ENTRY_ID));
    }

    @Test
    @DisplayName("should not register phone match when phone is null")
    void shouldNotRegisterPhoneMatchWhenPhoneNull() throws Exception {
      stubAuth();
      CreateJournalEntryRequest request = new CreateJournalEntryRequest(
          LocalDate.of(2026, 3, 15), null, null, null, null, null, null, null, null, null);

      when(journalRepository.save(any(EncounterJournal.class))).thenAnswer(invocation -> {
        EncounterJournal saved = invocation.getArgument(0);
        saved.setId(ENTRY_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        saved.setUpdatedAt(OffsetDateTime.now());
        return saved;
      });

      encounterJournalService.createEntry(jwt, request);

      verify(phoneMatchService, never()).registerPhoneEntry(any(), any(), any(), any(), any());
      verify(encryptionService, never()).hashPhone(any(), any());
    }

    @Test
    @DisplayName("should copy alias from owned partner when partnerId provided")
    void shouldCopyAliasFromOwnedPartner() {
      stubAuth();
      UUID partnerId = UUID.randomUUID();
      JournalPartner partner = JournalPartner.builder()
          .id(partnerId)
          .userHash(USER_HASH)
          .aliasEncrypted(ENCRYPTED_ALIAS)
          .build();
      when(partnerRepository.findByIdAndUserHash(partnerId, USER_HASH))
          .thenReturn(Optional.of(partner));
      when(journalRepository.save(any(EncounterJournal.class))).thenAnswer(invocation -> {
        EncounterJournal saved = invocation.getArgument(0);
        saved.setId(ENTRY_ID);
        return saved;
      });
      when(encryptionService.decryptFromBytes(ENCRYPTED_ALIAS)).thenReturn("Alex");

      CreateJournalEntryRequest request = new CreateJournalEntryRequest(
          LocalDate.of(2026, 3, 15), null, null, null, null,
          partnerId, null, null, null, null);

      JournalEntryResponse response = encounterJournalService.createEntry(jwt, request);

      ArgumentCaptor<EncounterJournal> captor = ArgumentCaptor.forClass(EncounterJournal.class);
      verify(journalRepository).save(captor.capture());
      assertThat(captor.getValue().getPartnerAliasEncrypted()).isEqualTo(ENCRYPTED_ALIAS);
      assertThat(captor.getValue().getPartnerId()).isEqualTo(partnerId);
      assertThat(response.partnerAlias()).isEqualTo("Alex");
    }

    @Test
    @DisplayName("should reject create when partnerId belongs to another user")
    void shouldRejectCreateForForeignPartner() {
      stubAuth();
      UUID foreignPartnerId = UUID.randomUUID();
      when(partnerRepository.findByIdAndUserHash(foreignPartnerId, USER_HASH))
          .thenReturn(Optional.empty());

      CreateJournalEntryRequest request = new CreateJournalEntryRequest(
          LocalDate.of(2026, 3, 15), null, null, null, null,
          foreignPartnerId, null, null, null, null);

      // A partnerId the user does not own must read as "not found" — resolving
      // it would copy (and later decrypt) another user's partner alias.
      assertThatThrownBy(() -> encounterJournalService.createEntry(jwt, request))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessage("journal.partner.error.notFound");

      verify(journalRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("updateEntry")
  class UpdateEntryTests {

    @Test
    @DisplayName("should update owned entry with new encrypted values")
    void shouldUpdateOwnedEntry() throws Exception {
      stubAuth();
      EncounterJournal existing = buildEntry(ENTRY_ID, USER_HASH);
      when(journalRepository.findById(ENTRY_ID)).thenReturn(Optional.of(existing));

      byte[] newAlias = new byte[]{20, 21, 22};
      byte[] newNotes = new byte[]{23, 24, 25};
      when(encryptionService.encryptToBytes("Partner B")).thenReturn(newAlias);
      when(encryptionService.encryptToBytes("Updated notes")).thenReturn(newNotes);
      when(journalRepository.save(any(EncounterJournal.class))).thenAnswer(i -> i.getArgument(0));
      // Decryption stubs for toResponse
      when(encryptionService.decryptFromBytes(newAlias)).thenReturn("Partner B");
      when(encryptionService.decryptFromBytes(newNotes)).thenReturn("Updated notes");

      UpdateJournalEntryRequest request = new UpdateJournalEntryRequest(
          LocalDate.of(2026, 4, 1), "Partner B", null, "Updated notes", null, null, null, null, null, null);

      JournalEntryResponse result = encounterJournalService.updateEntry(jwt, ENTRY_ID, request);

      ArgumentCaptor<EncounterJournal> captor = ArgumentCaptor.forClass(EncounterJournal.class);
      verify(journalRepository).save(captor.capture());
      EncounterJournal captured = captor.getValue();
      assertThat(captured.getEncounterDate()).isEqualTo(LocalDate.of(2026, 4, 1));
      assertThat(captured.getPartnerAliasEncrypted()).isEqualTo(newAlias);
      assertThat(captured.getNotesEncrypted()).isEqualTo(newNotes);
      assertThat(captured.getCustomFieldsEncrypted()).isNull();
      assertThat(result.partnerAlias()).isEqualTo("Partner B");
    }

    @Test
    @DisplayName("should update encounter types and protection methods")
    void shouldUpdateEncounterTypesAndProtectionMethods() throws Exception {
      stubAuth();
      EncounterJournal existing = buildEntry(ENTRY_ID, USER_HASH);
      when(journalRepository.findById(ENTRY_ID)).thenReturn(Optional.of(existing));

      List<String> encounterTypes = List.of("VAGINAL");
      List<String> protectionMethods = List.of("CONDOM", "DENTAL_DAM");
      byte[] encTypes = new byte[]{50, 51, 52};
      byte[] encProtection = new byte[]{60, 61, 62};
      byte[] newAlias = new byte[]{20, 21, 22};
      String typesJson = "[\"VAGINAL\"]";
      String protectionJson = "[\"CONDOM\",\"DENTAL_DAM\"]";

      when(encryptionService.encryptToBytes("Partner B")).thenReturn(newAlias);
      when(objectMapper.writeValueAsString(encounterTypes)).thenReturn(typesJson);
      when(encryptionService.encryptToBytes(typesJson)).thenReturn(encTypes);
      when(objectMapper.writeValueAsString(protectionMethods)).thenReturn(protectionJson);
      when(encryptionService.encryptToBytes(protectionJson)).thenReturn(encProtection);
      when(journalRepository.save(any(EncounterJournal.class))).thenAnswer(i -> i.getArgument(0));
      // Decryption stubs for toResponse
      when(encryptionService.decryptFromBytes(newAlias)).thenReturn("Partner B");
      when(encryptionService.decryptFromBytes(encTypes)).thenReturn(typesJson);
      when(encryptionService.decryptFromBytes(encProtection)).thenReturn(protectionJson);
      when(objectMapper.readValue(eq(typesJson), any(TypeReference.class)))
          .thenReturn(encounterTypes);
      when(objectMapper.readValue(eq(protectionJson), any(TypeReference.class)))
          .thenReturn(protectionMethods);

      UpdateJournalEntryRequest request = new UpdateJournalEntryRequest(
          LocalDate.of(2026, 4, 1), "Partner B", null, null, null, null, null, null,
          encounterTypes, protectionMethods);

      JournalEntryResponse result = encounterJournalService.updateEntry(jwt, ENTRY_ID, request);

      ArgumentCaptor<EncounterJournal> captor = ArgumentCaptor.forClass(EncounterJournal.class);
      verify(journalRepository).save(captor.capture());
      EncounterJournal captured = captor.getValue();
      assertThat(captured.getEncounterTypesEncrypted()).isEqualTo(encTypes);
      assertThat(captured.getProtectionMethodsEncrypted()).isEqualTo(encProtection);
      assertThat(result.encounterTypes()).containsExactly("VAGINAL");
      assertThat(result.protectionMethods()).containsExactly("CONDOM", "DENTAL_DAM");
    }

    @Test
    @DisplayName("should reject update for non-owner")
    void shouldRejectUpdateForNonOwner() {
      stubAuth();
      EncounterJournal existing = buildEntry(ENTRY_ID, "other_user_hash");
      when(journalRepository.findById(ENTRY_ID)).thenReturn(Optional.of(existing));

      UpdateJournalEntryRequest request = new UpdateJournalEntryRequest(
          LocalDate.of(2026, 4, 1), "Partner B", null, "Updated notes", null, null, null, null, null, null);

      assertThatThrownBy(() -> encounterJournalService.updateEntry(jwt, ENTRY_ID, request))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("journal.error.notOwner");

      verify(journalRepository, never()).save(any());
    }

    @Test
    @DisplayName("should throw ResourceNotFoundException for missing entry")
    void shouldThrowNotFoundForMissingEntry() {
      stubAuth();
      when(journalRepository.findById(ENTRY_ID)).thenReturn(Optional.empty());

      UpdateJournalEntryRequest request = new UpdateJournalEntryRequest(
          LocalDate.of(2026, 4, 1), "Partner B", null, "Updated notes", null, null, null, null, null, null);

      assertThatThrownBy(() -> encounterJournalService.updateEntry(jwt, ENTRY_ID, request))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessage("journal.error.notFound");

      verify(journalRepository, never()).save(any());
    }

    @Test
    @DisplayName("should hash phone with country code, consistent with createEntry")
    void shouldHashPhoneWithCountryCodeOnUpdate() {
      stubAuth();
      EncounterJournal existing = buildEntry(ENTRY_ID, USER_HASH);
      when(journalRepository.findById(ENTRY_ID)).thenReturn(Optional.of(existing));
      when(journalRepository.save(any(EncounterJournal.class))).thenAnswer(i -> i.getArgument(0));
      // A phone logged at create time as "+52 55..." must produce the same hash
      // when the entry is edited, or phone auto-matching silently breaks.
      when(encryptionService.hashPhone("5512345678", "52")).thenReturn("cc_aware_hash");

      UpdateJournalEntryRequest request = new UpdateJournalEntryRequest(
          LocalDate.of(2026, 4, 1), null, null, null, null, null,
          "5512345678", "52", null, null);

      encounterJournalService.updateEntry(jwt, ENTRY_ID, request);

      ArgumentCaptor<EncounterJournal> captor = ArgumentCaptor.forClass(EncounterJournal.class);
      verify(journalRepository).save(captor.capture());
      assertThat(captor.getValue().getPhoneHash()).isEqualTo("cc_aware_hash");
      // The country-code-blind overload must never be used for journal phones.
      verify(encryptionService, never()).hashPhone(any());
    }

    @Test
    @DisplayName("should preserve existing phone hash when update omits phone")
    void shouldPreservePhoneHashWhenUpdateOmitsPhone() {
      stubAuth();
      EncounterJournal existing = buildEntry(ENTRY_ID, USER_HASH);
      existing.setPhoneHash("existing_hash");
      when(journalRepository.findById(ENTRY_ID)).thenReturn(Optional.of(existing));
      when(journalRepository.save(any(EncounterJournal.class))).thenAnswer(i -> i.getArgument(0));

      UpdateJournalEntryRequest request = new UpdateJournalEntryRequest(
          LocalDate.of(2026, 4, 1), null, null, null, null, null, null, null, null, null);

      encounterJournalService.updateEntry(jwt, ENTRY_ID, request);

      ArgumentCaptor<EncounterJournal> captor = ArgumentCaptor.forClass(EncounterJournal.class);
      verify(journalRepository).save(captor.capture());
      // The raw phone is never returned to clients (only its hash is stored),
      // so the edit form cannot re-submit it. A blank phone on update must mean
      // "unchanged" — clearing would destroy the match hash on every edit.
      assertThat(captor.getValue().getPhoneHash()).isEqualTo("existing_hash");
    }

    @Test
    @DisplayName("should reject update when partnerId belongs to another user")
    void shouldRejectUpdateForForeignPartner() {
      stubAuth();
      EncounterJournal existing = buildEntry(ENTRY_ID, USER_HASH);
      when(journalRepository.findById(ENTRY_ID)).thenReturn(Optional.of(existing));
      UUID foreignPartnerId = UUID.randomUUID();
      when(partnerRepository.findByIdAndUserHash(foreignPartnerId, USER_HASH))
          .thenReturn(Optional.empty());

      UpdateJournalEntryRequest request = new UpdateJournalEntryRequest(
          LocalDate.of(2026, 4, 1), null, null, null, null,
          foreignPartnerId, null, null, null, null);

      assertThatThrownBy(() -> encounterJournalService.updateEntry(jwt, ENTRY_ID, request))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessage("journal.partner.error.notFound");

      verify(journalRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("deleteEntry")
  class DeleteEntryTests {

    @Test
    @DisplayName("should delete owned entry")
    void shouldDeleteOwnedEntry() {
      stubAuth();
      EncounterJournal existing = buildEntry(ENTRY_ID, USER_HASH);
      when(journalRepository.findById(ENTRY_ID)).thenReturn(Optional.of(existing));

      encounterJournalService.deleteEntry(jwt, ENTRY_ID);

      verify(journalRepository).delete(existing);
    }

    @Test
    @DisplayName("should reject delete for non-owner")
    void shouldRejectDeleteForNonOwner() {
      stubAuth();
      EncounterJournal existing = buildEntry(ENTRY_ID, "other_user_hash");
      when(journalRepository.findById(ENTRY_ID)).thenReturn(Optional.of(existing));

      assertThatThrownBy(() -> encounterJournalService.deleteEntry(jwt, ENTRY_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("journal.error.notOwner");

      verify(journalRepository, never()).delete(any());
    }
  }

  @Nested
  @DisplayName("templates")
  class TemplateTests {

    @Test
    @DisplayName("should save encrypted templates")
    void shouldSaveEncryptedTemplates() {
      stubAuth();
      JournalTemplatesRequest request = new JournalTemplatesRequest(
          List.of("Location", "Mood", "Protection"));

      byte[] encLabel1 = new byte[]{30, 31};
      byte[] encLabel2 = new byte[]{32, 33};
      byte[] encLabel3 = new byte[]{34, 35};
      when(encryptionService.encryptToBytes("Location")).thenReturn(encLabel1);
      when(encryptionService.encryptToBytes("Mood")).thenReturn(encLabel2);
      when(encryptionService.encryptToBytes("Protection")).thenReturn(encLabel3);
      when(templateRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
      // For getTemplates call after save
      when(templateRepository.findByUserHashOrderByDisplayOrder(USER_HASH))
          .thenReturn(List.of(
              JournalFieldTemplate.builder().userHash(USER_HASH).labelEncrypted(encLabel1).displayOrder(1).build(),
              JournalFieldTemplate.builder().userHash(USER_HASH).labelEncrypted(encLabel2).displayOrder(2).build(),
              JournalFieldTemplate.builder().userHash(USER_HASH).labelEncrypted(encLabel3).displayOrder(3).build()
          ));
      when(encryptionService.decryptFromBytes(encLabel1)).thenReturn("Location");
      when(encryptionService.decryptFromBytes(encLabel2)).thenReturn("Mood");
      when(encryptionService.decryptFromBytes(encLabel3)).thenReturn("Protection");

      JournalTemplateResponse result = encounterJournalService.saveTemplates(jwt, request);

      verify(templateRepository).deleteByUserHash(USER_HASH);
      verify(templateRepository).saveAll(any());
      assertThat(result.labels()).containsExactly("Location", "Mood", "Protection");
    }

    @Test
    @DisplayName("should return decrypted template labels")
    void shouldReturnDecryptedTemplateLabels() {
      stubAuth();
      byte[] encLabel1 = new byte[]{30, 31};
      byte[] encLabel2 = new byte[]{32, 33};
      when(templateRepository.findByUserHashOrderByDisplayOrder(USER_HASH))
          .thenReturn(List.of(
              JournalFieldTemplate.builder().userHash(USER_HASH).labelEncrypted(encLabel1).displayOrder(1).build(),
              JournalFieldTemplate.builder().userHash(USER_HASH).labelEncrypted(encLabel2).displayOrder(2).build()
          ));
      when(encryptionService.decryptFromBytes(encLabel1)).thenReturn("Location");
      when(encryptionService.decryptFromBytes(encLabel2)).thenReturn("Mood");

      JournalTemplateResponse result = encounterJournalService.getTemplates(jwt);

      assertThat(result.labels()).containsExactly("Location", "Mood");
    }
  }

  @Nested
  @DisplayName("getMonthsWithEntries")
  class GetMonthsWithEntries {

    @Test
    @DisplayName("returns distinct months")
    void returnsDistinctMonths() {
      stubAuth();
      List<String> months = List.of("2025-11", "2026-01", "2026-03");
      when(journalRepository.findDistinctMonthsByUserHash(USER_HASH))
          .thenReturn(months);

      List<String> result =
          encounterJournalService.getMonthsWithEntries(jwt);

      assertThat(result)
          .containsExactly("2025-11", "2026-01", "2026-03");
    }
  }

  @Nested
  @DisplayName("summary")
  class SummaryTests {

    @Test
    @DisplayName("should return monthly counts for given year")
    void shouldReturnMonthlyCounts() {
      stubAuth();
      List<Object[]> monthlyData = List.of(
          new Object[]{"2026-01", 3L},
          new Object[]{"2026-02", 5L},
          new Object[]{"2026-03", 2L}
      );
      when(journalRepository.countByMonth(USER_HASH, 2026)).thenReturn(monthlyData);

      JournalSummaryResponse result = encounterJournalService.getSummary(jwt, 2026);

      assertThat(result.year()).isEqualTo(2026);
      assertThat(result.monthlyCounts()).containsEntry("2026-01", 3L);
      assertThat(result.monthlyCounts()).containsEntry("2026-02", 5L);
      assertThat(result.monthlyCounts()).containsEntry("2026-03", 2L);
      assertThat(result.yearTotal()).isEqualTo(10L);
    }
  }
}
