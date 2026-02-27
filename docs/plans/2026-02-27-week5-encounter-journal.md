# Encounter Journal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the encounter journal — Layer 1's first personal tracker feature. Users can log, edit, and delete private encrypted encounter entries with optional custom fields, view them as a timeline or calendar, and see monthly summaries.

**Architecture:** Two new DB tables (`encounter_journal`, `journal_field_templates`). New Spring Boot service/controller pair at `/api/journal`. New React page at `/journal` with timeline list view, calendar view (toggle), and create/edit modal. All sensitive text fields encrypted server-side with AES-256-GCM (same pattern as existing User entity). Custom fields stored as encrypted JSON blob.

**Tech Stack:** Java 25 + Spring Boot 4 (backend), React 19 + Vite + TypeScript + TailwindCSS (frontend), React Query for data layer, Supabase Auth (JWT), AES-256-GCM encryption via existing EncryptionService.

**Design doc:** `docs/plans/2026-02-27-week5-encounter-journal-design.md`

---

## Task 1: Database Migration

**Files:**
- Create: `database/migrations/008_encounter_journal.sql`

**Step 1: Write migration SQL**

```sql
-- Navilla Database Schema
-- Migration 008: Encounter Journal
-- Purpose: Create tables for Layer 1 encounter journal with encrypted fields

BEGIN;

-- Main journal entries table
CREATE TABLE encounter_journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    encounter_date DATE NOT NULL,
    partner_alias_encrypted BYTEA,
    connection_id UUID REFERENCES connections(id) ON DELETE SET NULL,
    notes_encrypted BYTEA,
    custom_fields_encrypted BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_encounter_journal_user ON encounter_journal(user_hash);
CREATE INDEX idx_encounter_journal_date ON encounter_journal(user_hash, encounter_date DESC);

COMMENT ON TABLE encounter_journal IS 'Encrypted encounter journal entries. All text fields are AES-256-GCM encrypted.';
COMMENT ON COLUMN encounter_journal.user_hash IS 'SHA-256 hashed user identity — never stores raw email or UUID.';
COMMENT ON COLUMN encounter_journal.partner_alias_encrypted IS 'AES-256-GCM encrypted freeform partner alias.';
COMMENT ON COLUMN encounter_journal.notes_encrypted IS 'AES-256-GCM encrypted freeform notes.';
COMMENT ON COLUMN encounter_journal.custom_fields_encrypted IS 'AES-256-GCM encrypted JSON array: [{label, value}], max 3.';

-- Saved custom field label templates (max 3 per user)
CREATE TABLE journal_field_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    label_encrypted BYTEA NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_template_per_user_order UNIQUE (user_hash, display_order),
    CONSTRAINT chk_display_order CHECK (display_order BETWEEN 1 AND 3)
);

CREATE INDEX idx_journal_templates_user ON journal_field_templates(user_hash);

COMMENT ON TABLE journal_field_templates IS 'User-saved custom field labels for encounter journal. Max 3 per user.';

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS journal_field_templates;
-- DROP TABLE IF EXISTS encounter_journal;
-- COMMIT;
```

**Step 2: Run migration in Supabase SQL Editor**

Paste the SQL into the Supabase SQL Editor and execute. Verify both tables are created.

**Step 3: Commit**

```bash
git add database/migrations/008_encounter_journal.sql
git commit -m "feat: add encounter journal database migration (008)"
git push
```

---

## Task 2: Backend Entity + Repository

**Files:**
- Create: `backend/src/main/java/app/navilla/entity/EncounterJournal.java`
- Create: `backend/src/main/java/app/navilla/entity/JournalFieldTemplate.java`
- Create: `backend/src/main/java/app/navilla/repository/EncounterJournalRepository.java`
- Create: `backend/src/main/java/app/navilla/repository/JournalFieldTemplateRepository.java`

**Step 1: Create EncounterJournal entity**

Reference: `HealthStatus.java` for annotation pattern.

```java
package app.navilla.entity;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "encounter_journal")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncounterJournal {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  @Column(name = "encounter_date", nullable = false)
  private LocalDate encounterDate;

  @Column(name = "partner_alias_encrypted")
  private byte[] partnerAliasEncrypted;

  @Column(name = "connection_id")
  private UUID connectionId;

  @Column(name = "notes_encrypted")
  private byte[] notesEncrypted;

  @Column(name = "custom_fields_encrypted")
  private byte[] customFieldsEncrypted;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
```

**Step 2: Create JournalFieldTemplate entity**

```java
package app.navilla.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "journal_field_templates",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_template_per_user_order",
        columnNames = {"user_hash", "display_order"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalFieldTemplate {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  @Column(name = "label_encrypted", nullable = false)
  private byte[] labelEncrypted;

  @Column(name = "display_order", nullable = false)
  private Integer displayOrder;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
```

**Step 3: Create EncounterJournalRepository**

```java
package app.navilla.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import app.navilla.entity.EncounterJournal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EncounterJournalRepository extends JpaRepository<EncounterJournal, UUID> {

  List<EncounterJournal> findByUserHashOrderByEncounterDateDesc(String userHash);

  @Query("SELECT e FROM EncounterJournal e WHERE e.userHash = :userHash "
      + "AND e.encounterDate >= :startDate AND e.encounterDate < :endDate "
      + "ORDER BY e.encounterDate DESC")
  List<EncounterJournal> findByUserHashAndMonth(
      @Param("userHash") String userHash,
      @Param("startDate") LocalDate startDate,
      @Param("endDate") LocalDate endDate);

  @Query("SELECT FUNCTION('TO_CHAR', e.encounterDate, 'YYYY-MM') AS month, COUNT(e) "
      + "FROM EncounterJournal e WHERE e.userHash = :userHash "
      + "AND EXTRACT(YEAR FROM e.encounterDate) = :year "
      + "GROUP BY FUNCTION('TO_CHAR', e.encounterDate, 'YYYY-MM') "
      + "ORDER BY month")
  List<Object[]> countByMonth(@Param("userHash") String userHash, @Param("year") int year);

  long countByUserHash(String userHash);
}
```

**Step 4: Create JournalFieldTemplateRepository**

```java
package app.navilla.repository;

import java.util.List;
import java.util.UUID;

import app.navilla.entity.JournalFieldTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JournalFieldTemplateRepository extends JpaRepository<JournalFieldTemplate, UUID> {

  List<JournalFieldTemplate> findByUserHashOrderByDisplayOrder(String userHash);

  void deleteByUserHash(String userHash);
}
```

**Step 5: Verify compilation**

Run: `cd backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

**Step 6: Commit**

```bash
git add backend/src/main/java/app/navilla/entity/EncounterJournal.java \
  backend/src/main/java/app/navilla/entity/JournalFieldTemplate.java \
  backend/src/main/java/app/navilla/repository/EncounterJournalRepository.java \
  backend/src/main/java/app/navilla/repository/JournalFieldTemplateRepository.java
git commit -m "feat: add encounter journal and field template entities + repositories"
git push
```

---

## Task 3: Backend DTOs

**Files:**
- Create: `backend/src/main/java/app/navilla/dto/CreateJournalEntryRequest.java`
- Create: `backend/src/main/java/app/navilla/dto/UpdateJournalEntryRequest.java`
- Create: `backend/src/main/java/app/navilla/dto/JournalEntryResponse.java`
- Create: `backend/src/main/java/app/navilla/dto/JournalSummaryResponse.java`
- Create: `backend/src/main/java/app/navilla/dto/JournalTemplatesRequest.java`
- Create: `backend/src/main/java/app/navilla/dto/JournalTemplateResponse.java`
- Create: `backend/src/main/java/app/navilla/dto/CustomFieldDto.java`

**Step 1: Create shared CustomFieldDto**

```java
package app.navilla.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomFieldDto(
    @NotBlank(message = "{journal.error.customFieldLabelRequired}")
    @Size(max = 100, message = "{journal.error.customFieldLabelTooLong}")
    String label,

    @NotBlank(message = "{journal.error.customFieldValueRequired}")
    @Size(max = 500, message = "{journal.error.customFieldValueTooLong}")
    String value
) {}
```

**Step 2: Create request DTOs**

```java
// CreateJournalEntryRequest.java
package app.navilla.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateJournalEntryRequest(
    @NotNull(message = "{journal.error.dateRequired}")
    LocalDate encounterDate,

    @Size(max = 200, message = "{journal.error.aliasTooLong}")
    String partnerAlias,

    UUID connectionId,

    @Size(max = 5000, message = "{journal.error.notesTooLong}")
    String notes,

    @Valid
    @Size(max = 3, message = "{journal.error.tooManyCustomFields}")
    List<CustomFieldDto> customFields
) {}
```

```java
// UpdateJournalEntryRequest.java
package app.navilla.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateJournalEntryRequest(
    @NotNull(message = "{journal.error.dateRequired}")
    LocalDate encounterDate,

    @Size(max = 200, message = "{journal.error.aliasTooLong}")
    String partnerAlias,

    UUID connectionId,

    @Size(max = 5000, message = "{journal.error.notesTooLong}")
    String notes,

    @Valid
    @Size(max = 3, message = "{journal.error.tooManyCustomFields}")
    List<CustomFieldDto> customFields
) {}
```

**Step 3: Create response DTOs**

```java
// JournalEntryResponse.java
package app.navilla.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record JournalEntryResponse(
    UUID id,
    LocalDate encounterDate,
    String partnerAlias,
    UUID connectionId,
    String connectionDisplayName,
    String notes,
    List<CustomFieldDto> customFields,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
```

```java
// JournalSummaryResponse.java
package app.navilla.dto;

import java.util.Map;

public record JournalSummaryResponse(
    int year,
    Map<String, Long> monthlyCounts,
    long yearTotal
) {}
```

**Step 4: Create template DTOs**

```java
// JournalTemplatesRequest.java
package app.navilla.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JournalTemplatesRequest(
    @Size(max = 3, message = "{journal.error.tooManyTemplates}")
    List<@NotBlank(message = "{journal.error.templateLabelRequired}")
         @Size(max = 100, message = "{journal.error.templateLabelTooLong}")
         String> labels
) {}
```

```java
// JournalTemplateResponse.java
package app.navilla.dto;

import java.util.List;

public record JournalTemplateResponse(
    List<String> labels
) {}
```

**Step 5: Verify compilation**

Run: `cd backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

**Step 6: Commit**

```bash
git add backend/src/main/java/app/navilla/dto/CustomFieldDto.java \
  backend/src/main/java/app/navilla/dto/CreateJournalEntryRequest.java \
  backend/src/main/java/app/navilla/dto/UpdateJournalEntryRequest.java \
  backend/src/main/java/app/navilla/dto/JournalEntryResponse.java \
  backend/src/main/java/app/navilla/dto/JournalSummaryResponse.java \
  backend/src/main/java/app/navilla/dto/JournalTemplatesRequest.java \
  backend/src/main/java/app/navilla/dto/JournalTemplateResponse.java
git commit -m "feat: add encounter journal request/response DTOs"
git push
```

---

## Task 4: Backend i18n Messages

**Files:**
- Modify: `backend/src/main/resources/messages.properties`
- Modify: `backend/src/main/resources/messages_es_MX.properties`

**Step 1: Add journal error messages to both files**

Add to `messages.properties`:
```properties
# Journal
journal.error.notFound=Journal entry not found
journal.error.notOwner=You can only modify your own journal entries
journal.error.dateRequired=Encounter date is required
journal.error.aliasTooLong=Partner alias must be 200 characters or fewer
journal.error.notesTooLong=Notes must be 5000 characters or fewer
journal.error.tooManyCustomFields=Maximum 3 custom fields per entry
journal.error.customFieldLabelRequired=Custom field label is required
journal.error.customFieldLabelTooLong=Custom field label must be 100 characters or fewer
journal.error.customFieldValueRequired=Custom field value is required
journal.error.customFieldValueTooLong=Custom field value must be 500 characters or fewer
journal.error.tooManyTemplates=Maximum 3 saved templates
journal.error.templateLabelRequired=Template label is required
journal.error.templateLabelTooLong=Template label must be 100 characters or fewer
```

Add the same keys to `messages_es_MX.properties` (English placeholders for now — same as existing pattern).

**Step 2: Verify compilation**

Run: `cd backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add backend/src/main/resources/messages.properties \
  backend/src/main/resources/messages_es_MX.properties
git commit -m "feat: add journal i18n error messages"
git push
```

---

## Task 5: Backend Service — Write Tests First

**Files:**
- Create: `backend/src/test/java/app/navilla/service/EncounterJournalServiceTest.java`

**Step 1: Write unit tests**

Reference: `ConnectionServiceTest.java` for test setup pattern. Use `@ExtendWith(MockitoExtension.class)`, `@Mock` all dependencies, `@InjectMocks` service.

```java
package app.navilla.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.dto.CreateJournalEntryRequest;
import app.navilla.dto.CustomFieldDto;
import app.navilla.dto.JournalEntryResponse;
import app.navilla.dto.JournalTemplatesRequest;
import app.navilla.dto.UpdateJournalEntryRequest;
import app.navilla.entity.EncounterJournal;
import app.navilla.entity.JournalFieldTemplate;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.EncounterJournalRepository;
import app.navilla.repository.JournalFieldTemplateRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

@ExtendWith(MockitoExtension.class)
class EncounterJournalServiceTest {

  @Mock private EncounterJournalRepository journalRepository;
  @Mock private JournalFieldTemplateRepository templateRepository;
  @Mock private EncryptionService encryptionService;
  @Mock private Jwt jwt;

  @InjectMocks
  private EncounterJournalService journalService;

  private static final String USER_EMAIL = "test@example.com";
  private static final String USER_HASH = "abc123hash";

  private void stubAuth() {
    when(jwt.getClaimAsString("email")).thenReturn(USER_EMAIL);
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
  }

  @Nested
  @DisplayName("listEntries")
  class ListEntries {

    @Test
    @DisplayName("should return decrypted entries for authenticated user")
    void shouldReturnDecryptedEntries() {
      stubAuth();
      EncounterJournal entry = buildEntry("Alex", "Fun evening", null);
      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(List.of(entry));
      when(encryptionService.decryptFromBytes(entry.getPartnerAliasEncrypted())).thenReturn("Alex");
      when(encryptionService.decryptFromBytes(entry.getNotesEncrypted())).thenReturn("Fun evening");

      List<JournalEntryResponse> result = journalService.listEntries(jwt, null);

      assertThat(result).hasSize(1);
      assertThat(result.get(0).partnerAlias()).isEqualTo("Alex");
      assertThat(result.get(0).notes()).isEqualTo("Fun evening");
    }

    @Test
    @DisplayName("should return empty list when no entries")
    void shouldReturnEmptyList() {
      stubAuth();
      when(journalRepository.findByUserHashOrderByEncounterDateDesc(USER_HASH))
          .thenReturn(List.of());

      List<JournalEntryResponse> result = journalService.listEntries(jwt, null);

      assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("should filter by month when month parameter provided")
    void shouldFilterByMonth() {
      stubAuth();
      when(journalRepository.findByUserHashAndMonth(
          eq(USER_HASH),
          eq(LocalDate.of(2026, 3, 1)),
          eq(LocalDate.of(2026, 4, 1))))
          .thenReturn(List.of());

      journalService.listEntries(jwt, "2026-03");

      verify(journalRepository).findByUserHashAndMonth(
          USER_HASH, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 4, 1));
    }
  }

  @Nested
  @DisplayName("createEntry")
  class CreateEntry {

    @Test
    @DisplayName("should encrypt and save entry")
    void shouldEncryptAndSave() {
      stubAuth();
      byte[] aliasBytes = new byte[]{1, 2, 3};
      byte[] notesBytes = new byte[]{4, 5, 6};
      when(encryptionService.encryptToBytes("Alex")).thenReturn(aliasBytes);
      when(encryptionService.encryptToBytes("Fun evening")).thenReturn(notesBytes);
      when(journalRepository.save(any())).thenAnswer(inv -> {
        EncounterJournal e = inv.getArgument(0);
        e.setId(UUID.randomUUID());
        e.setCreatedAt(OffsetDateTime.now());
        e.setUpdatedAt(OffsetDateTime.now());
        return e;
      });
      when(encryptionService.decryptFromBytes(aliasBytes)).thenReturn("Alex");
      when(encryptionService.decryptFromBytes(notesBytes)).thenReturn("Fun evening");

      CreateJournalEntryRequest request = new CreateJournalEntryRequest(
          LocalDate.of(2026, 3, 15), "Alex", null, "Fun evening", null);

      JournalEntryResponse result = journalService.createEntry(jwt, request);

      assertThat(result.partnerAlias()).isEqualTo("Alex");
      assertThat(result.encounterDate()).isEqualTo(LocalDate.of(2026, 3, 15));

      ArgumentCaptor<EncounterJournal> captor = ArgumentCaptor.forClass(EncounterJournal.class);
      verify(journalRepository).save(captor.capture());
      assertThat(captor.getValue().getUserHash()).isEqualTo(USER_HASH);
      assertThat(captor.getValue().getPartnerAliasEncrypted()).isEqualTo(aliasBytes);
    }

    @Test
    @DisplayName("should handle null optional fields")
    void shouldHandleNullOptionalFields() {
      stubAuth();
      when(journalRepository.save(any())).thenAnswer(inv -> {
        EncounterJournal e = inv.getArgument(0);
        e.setId(UUID.randomUUID());
        e.setCreatedAt(OffsetDateTime.now());
        e.setUpdatedAt(OffsetDateTime.now());
        return e;
      });

      CreateJournalEntryRequest request = new CreateJournalEntryRequest(
          LocalDate.of(2026, 3, 15), null, null, null, null);

      JournalEntryResponse result = journalService.createEntry(jwt, request);

      assertThat(result.partnerAlias()).isNull();
      assertThat(result.notes()).isNull();
      assertThat(result.customFields()).isNull();
    }

    @Test
    @DisplayName("should encrypt custom fields as JSON")
    void shouldEncryptCustomFieldsAsJson() {
      stubAuth();
      byte[] cfBytes = new byte[]{7, 8, 9};
      when(encryptionService.encryptToBytes(any(String.class))).thenReturn(cfBytes);
      when(journalRepository.save(any())).thenAnswer(inv -> {
        EncounterJournal e = inv.getArgument(0);
        e.setId(UUID.randomUUID());
        e.setCreatedAt(OffsetDateTime.now());
        e.setUpdatedAt(OffsetDateTime.now());
        return e;
      });
      when(encryptionService.decryptFromBytes(cfBytes))
          .thenReturn("[{\"label\":\"Location\",\"value\":\"Roma Norte\"}]");

      List<CustomFieldDto> fields = List.of(new CustomFieldDto("Location", "Roma Norte"));
      CreateJournalEntryRequest request = new CreateJournalEntryRequest(
          LocalDate.of(2026, 3, 15), null, null, null, fields);

      JournalEntryResponse result = journalService.createEntry(jwt, request);

      assertThat(result.customFields()).hasSize(1);
      assertThat(result.customFields().get(0).label()).isEqualTo("Location");
    }
  }

  @Nested
  @DisplayName("updateEntry")
  class UpdateEntry {

    @Test
    @DisplayName("should update owned entry")
    void shouldUpdateOwnedEntry() {
      stubAuth();
      UUID entryId = UUID.randomUUID();
      EncounterJournal existing = buildEntry("Alex", "Old notes", null);
      existing.setId(entryId);
      existing.setUserHash(USER_HASH);
      when(journalRepository.findById(entryId)).thenReturn(Optional.of(existing));
      when(encryptionService.encryptToBytes("Jordan")).thenReturn(new byte[]{1});
      when(encryptionService.encryptToBytes("New notes")).thenReturn(new byte[]{2});
      when(journalRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
      when(encryptionService.decryptFromBytes(new byte[]{1})).thenReturn("Jordan");
      when(encryptionService.decryptFromBytes(new byte[]{2})).thenReturn("New notes");

      UpdateJournalEntryRequest request = new UpdateJournalEntryRequest(
          LocalDate.of(2026, 3, 20), "Jordan", null, "New notes", null);

      JournalEntryResponse result = journalService.updateEntry(jwt, entryId, request);

      assertThat(result.partnerAlias()).isEqualTo("Jordan");
    }

    @Test
    @DisplayName("should reject update for non-owner")
    void shouldRejectNonOwner() {
      stubAuth();
      UUID entryId = UUID.randomUUID();
      EncounterJournal existing = buildEntry("Alex", null, null);
      existing.setId(entryId);
      existing.setUserHash("different_hash");
      when(journalRepository.findById(entryId)).thenReturn(Optional.of(existing));

      UpdateJournalEntryRequest request = new UpdateJournalEntryRequest(
          LocalDate.of(2026, 3, 20), null, null, null, null);

      assertThatThrownBy(() -> journalService.updateEntry(jwt, entryId, request))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("journal.error.notOwner");
    }

    @Test
    @DisplayName("should throw not found for missing entry")
    void shouldThrowNotFoundForMissing() {
      stubAuth();
      UUID entryId = UUID.randomUUID();
      when(journalRepository.findById(entryId)).thenReturn(Optional.empty());

      UpdateJournalEntryRequest request = new UpdateJournalEntryRequest(
          LocalDate.of(2026, 3, 20), null, null, null, null);

      assertThatThrownBy(() -> journalService.updateEntry(jwt, entryId, request))
          .isInstanceOf(ResourceNotFoundException.class);
    }
  }

  @Nested
  @DisplayName("deleteEntry")
  class DeleteEntry {

    @Test
    @DisplayName("should delete owned entry")
    void shouldDeleteOwnedEntry() {
      stubAuth();
      UUID entryId = UUID.randomUUID();
      EncounterJournal existing = buildEntry("Alex", null, null);
      existing.setId(entryId);
      existing.setUserHash(USER_HASH);
      when(journalRepository.findById(entryId)).thenReturn(Optional.of(existing));

      journalService.deleteEntry(jwt, entryId);

      verify(journalRepository).delete(existing);
    }

    @Test
    @DisplayName("should reject delete for non-owner")
    void shouldRejectDeleteNonOwner() {
      stubAuth();
      UUID entryId = UUID.randomUUID();
      EncounterJournal existing = buildEntry("Alex", null, null);
      existing.setId(entryId);
      existing.setUserHash("different_hash");
      when(journalRepository.findById(entryId)).thenReturn(Optional.of(existing));

      assertThatThrownBy(() -> journalService.deleteEntry(jwt, entryId))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("journal.error.notOwner");
    }
  }

  @Nested
  @DisplayName("templates")
  class Templates {

    @Test
    @DisplayName("should save encrypted templates")
    void shouldSaveEncryptedTemplates() {
      stubAuth();
      when(encryptionService.encryptToBytes("Location")).thenReturn(new byte[]{1});
      when(encryptionService.encryptToBytes("Mood")).thenReturn(new byte[]{2});

      JournalTemplatesRequest request = new JournalTemplatesRequest(List.of("Location", "Mood"));

      journalService.saveTemplates(jwt, request);

      verify(templateRepository).deleteByUserHash(USER_HASH);
      verify(templateRepository).saveAll(any());
    }

    @Test
    @DisplayName("should return decrypted templates")
    void shouldReturnDecryptedTemplates() {
      stubAuth();
      JournalFieldTemplate t1 = JournalFieldTemplate.builder()
          .userHash(USER_HASH).labelEncrypted(new byte[]{1}).displayOrder(1).build();
      JournalFieldTemplate t2 = JournalFieldTemplate.builder()
          .userHash(USER_HASH).labelEncrypted(new byte[]{2}).displayOrder(2).build();
      when(templateRepository.findByUserHashOrderByDisplayOrder(USER_HASH))
          .thenReturn(List.of(t1, t2));
      when(encryptionService.decryptFromBytes(new byte[]{1})).thenReturn("Location");
      when(encryptionService.decryptFromBytes(new byte[]{2})).thenReturn("Mood");

      var result = journalService.getTemplates(jwt);

      assertThat(result.labels()).containsExactly("Location", "Mood");
    }
  }

  // --- helpers ---

  private EncounterJournal buildEntry(String alias, String notes, List<CustomFieldDto> fields) {
    EncounterJournal entry = EncounterJournal.builder()
        .id(UUID.randomUUID())
        .userHash(USER_HASH)
        .encounterDate(LocalDate.of(2026, 3, 15))
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
    if (alias != null) {
      entry.setPartnerAliasEncrypted(new byte[]{1, 2, 3});
    }
    if (notes != null) {
      entry.setNotesEncrypted(new byte[]{4, 5, 6});
    }
    return entry;
  }
}
```

**Step 2: Run tests — expect failures (service doesn't exist yet)**

Run: `cd backend && ./mvnw test -pl . -Dtest=EncounterJournalServiceTest -q`
Expected: COMPILATION FAILURE (class not found)

**Step 3: Commit test file**

```bash
git add backend/src/test/java/app/navilla/service/EncounterJournalServiceTest.java
git commit -m "test: add encounter journal service unit tests (red)"
git push
```

---

## Task 6: Backend Service — Implementation

**Files:**
- Create: `backend/src/main/java/app/navilla/service/EncounterJournalService.java`

**Step 1: Implement the service**

Reference: `HealthStatusService.java` for pattern (hashEmail from JWT, ownership check, toResponse).

```java
package app.navilla.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;

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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EncounterJournalService {

  private final EncounterJournalRepository journalRepository;
  private final JournalFieldTemplateRepository templateRepository;
  private final EncryptionService encryptionService;
  private final ObjectMapper objectMapper;

  @Transactional(readOnly = true)
  public List<JournalEntryResponse> listEntries(Jwt jwt, String month) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));

    List<EncounterJournal> entries;
    if (month != null && !month.isBlank()) {
      YearMonth ym = YearMonth.parse(month);
      LocalDate start = ym.atDay(1);
      LocalDate end = ym.plusMonths(1).atDay(1);
      entries = journalRepository.findByUserHashAndMonth(userHash, start, end);
    } else {
      entries = journalRepository.findByUserHashOrderByEncounterDateDesc(userHash);
    }

    return entries.stream().map(this::toResponse).toList();
  }

  @Transactional
  public JournalEntryResponse createEntry(Jwt jwt, CreateJournalEntryRequest request) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));

    EncounterJournal entry = EncounterJournal.builder()
        .userHash(userHash)
        .encounterDate(request.encounterDate())
        .partnerAliasEncrypted(encryptOptional(request.partnerAlias()))
        .connectionId(request.connectionId())
        .notesEncrypted(encryptOptional(request.notes()))
        .customFieldsEncrypted(encryptCustomFields(request.customFields()))
        .build();

    EncounterJournal saved = journalRepository.save(entry);
    log.info("Journal entry created for date {}", request.encounterDate());
    return toResponse(saved);
  }

  @Transactional
  public JournalEntryResponse updateEntry(Jwt jwt, UUID id, UpdateJournalEntryRequest request) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    EncounterJournal entry = journalRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("journal.error.notFound"));

    if (!entry.getUserHash().equals(userHash)) {
      throw new IllegalStateException("journal.error.notOwner");
    }

    entry.setEncounterDate(request.encounterDate());
    entry.setPartnerAliasEncrypted(encryptOptional(request.partnerAlias()));
    entry.setConnectionId(request.connectionId());
    entry.setNotesEncrypted(encryptOptional(request.notes()));
    entry.setCustomFieldsEncrypted(encryptCustomFields(request.customFields()));

    EncounterJournal saved = journalRepository.save(entry);
    log.info("Journal entry updated: {}", id);
    return toResponse(saved);
  }

  @Transactional
  public void deleteEntry(Jwt jwt, UUID id) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    EncounterJournal entry = journalRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("journal.error.notFound"));

    if (!entry.getUserHash().equals(userHash)) {
      throw new IllegalStateException("journal.error.notOwner");
    }

    journalRepository.delete(entry);
    log.info("Journal entry deleted: {}", id);
  }

  @Transactional(readOnly = true)
  public JournalSummaryResponse getSummary(Jwt jwt, int year) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    List<Object[]> rows = journalRepository.countByMonth(userHash, year);

    Map<String, Long> monthlyCounts = new LinkedHashMap<>();
    long yearTotal = 0;
    for (Object[] row : rows) {
      String monthKey = (String) row[0];
      long count = (Long) row[1];
      monthlyCounts.put(monthKey, count);
      yearTotal += count;
    }

    return new JournalSummaryResponse(year, monthlyCounts, yearTotal);
  }

  @Transactional(readOnly = true)
  public JournalTemplateResponse getTemplates(Jwt jwt) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    List<JournalFieldTemplate> templates =
        templateRepository.findByUserHashOrderByDisplayOrder(userHash);

    List<String> labels = templates.stream()
        .map(t -> encryptionService.decryptFromBytes(t.getLabelEncrypted()))
        .toList();

    return new JournalTemplateResponse(labels);
  }

  @Transactional
  public JournalTemplateResponse saveTemplates(Jwt jwt, JournalTemplatesRequest request) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    templateRepository.deleteByUserHash(userHash);

    if (request.labels() != null && !request.labels().isEmpty()) {
      List<JournalFieldTemplate> templates = IntStream.range(0, request.labels().size())
          .mapToObj(i -> JournalFieldTemplate.builder()
              .userHash(userHash)
              .labelEncrypted(encryptionService.encryptToBytes(request.labels().get(i)))
              .displayOrder(i + 1)
              .build())
          .toList();
      templateRepository.saveAll(templates);
    }

    return getTemplates(jwt);
  }

  // --- private helpers ---

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
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Failed to serialize custom fields", e);
    }
  }

  private List<CustomFieldDto> decryptCustomFields(byte[] encrypted) {
    if (encrypted == null) {
      return null;
    }
    try {
      String json = encryptionService.decryptFromBytes(encrypted);
      return objectMapper.readValue(json, new TypeReference<>() {});
    } catch (JsonProcessingException e) {
      log.warn("Failed to parse custom fields JSON", e);
      return null;
    }
  }

  private JournalEntryResponse toResponse(EncounterJournal entry) {
    return new JournalEntryResponse(
        entry.getId(),
        entry.getEncounterDate(),
        entry.getPartnerAliasEncrypted() != null
            ? encryptionService.decryptFromBytes(entry.getPartnerAliasEncrypted()) : null,
        entry.getConnectionId(),
        null, // connectionDisplayName resolved in controller or future enhancement
        entry.getNotesEncrypted() != null
            ? encryptionService.decryptFromBytes(entry.getNotesEncrypted()) : null,
        decryptCustomFields(entry.getCustomFieldsEncrypted()),
        entry.getCreatedAt(),
        entry.getUpdatedAt()
    );
  }
}
```

**Step 2: Run tests — expect them to pass**

Run: `cd backend && ./mvnw test -pl . -Dtest=EncounterJournalServiceTest -q`
Expected: All tests GREEN

**Step 3: Commit**

```bash
git add backend/src/main/java/app/navilla/service/EncounterJournalService.java
git commit -m "feat: implement encounter journal service with encryption"
git push
```

---

## Task 7: Backend Controller — Write Tests First

**Files:**
- Create: `backend/src/test/java/app/navilla/controller/EncounterJournalControllerTest.java`

**Step 1: Write integration tests**

Reference: `HealthStatusControllerTest.java` for pattern.

```java
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EncounterJournalControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private EncounterJournalRepository journalRepository;
  @Autowired private JournalFieldTemplateRepository templateRepository;

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
  @DisplayName("should create and list journal entry")
  void shouldCreateAndList() throws Exception {
    mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"encounterDate\":\"2026-03-15\",\"partnerAlias\":\"Alex\",\"notes\":\"Fun evening\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.encounterDate").value("2026-03-15"))
        .andExpect(jsonPath("$.partnerAlias").value("Alex"))
        .andExpect(jsonPath("$.notes").value("Fun evening"));

    mockMvc.perform(get("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].partnerAlias").value("Alex"));
  }

  @Test
  @DisplayName("should create entry with custom fields")
  void shouldCreateWithCustomFields() throws Exception {
    String body = """
        {
          "encounterDate": "2026-03-15",
          "customFields": [
            {"label": "Location", "value": "Roma Norte"},
            {"label": "Mood", "value": "Great"}
          ]
        }
        """;

    mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.customFields[0].label").value("Location"))
        .andExpect(jsonPath("$.customFields[1].label").value("Mood"));
  }

  @Test
  @DisplayName("should update journal entry")
  void shouldUpdateEntry() throws Exception {
    String createResult = mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"encounterDate\":\"2026-03-15\",\"partnerAlias\":\"Alex\"}"))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = com.fasterxml.jackson.databind.ObjectMapper
        .class.getDeclaredConstructor().newInstance()
        .readTree(createResult).get("id").asText();

    mockMvc.perform(put("/api/journal/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"encounterDate\":\"2026-03-20\",\"partnerAlias\":\"Jordan\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.partnerAlias").value("Jordan"))
        .andExpect(jsonPath("$.encounterDate").value("2026-03-20"));
  }

  @Test
  @DisplayName("should delete journal entry")
  void shouldDeleteEntry() throws Exception {
    String createResult = mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"encounterDate\":\"2026-03-15\"}"))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String id = com.fasterxml.jackson.databind.ObjectMapper
        .class.getDeclaredConstructor().newInstance()
        .readTree(createResult).get("id").asText();

    mockMvc.perform(delete("/api/journal/" + id)
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isNoContent());
  }

  @Test
  @DisplayName("should reject entry without date")
  void shouldRejectWithoutDate() throws Exception {
    mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"partnerAlias\":\"Alex\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("should save and retrieve templates")
  void shouldSaveAndRetrieveTemplates() throws Exception {
    mockMvc.perform(put("/api/journal/templates")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"labels\":[\"Location\",\"Mood\"]}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.labels[0]").value("Location"))
        .andExpect(jsonPath("$.labels[1]").value("Mood"));

    mockMvc.perform(get("/api/journal/templates")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.labels[0]").value("Location"));
  }

  @Test
  @DisplayName("should return summary")
  void shouldReturnSummary() throws Exception {
    mockMvc.perform(post("/api/journal")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"encounterDate\":\"2026-03-15\"}"))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/journal/summary?year=2026")
            .with(jwt().jwt(builder -> builder
                .subject("test-subject")
                .claim("email", USER_EMAIL))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.year").value(2026))
        .andExpect(jsonPath("$.yearTotal").value(1));
  }
}
```

**Step 2: Commit test file**

```bash
git add backend/src/test/java/app/navilla/controller/EncounterJournalControllerTest.java
git commit -m "test: add encounter journal controller integration tests (red)"
git push
```

---

## Task 8: Backend Controller — Implementation

**Files:**
- Create: `backend/src/main/java/app/navilla/controller/EncounterJournalController.java`

**Step 1: Implement the controller**

```java
package app.navilla.controller;

import java.util.UUID;

import app.navilla.dto.CreateJournalEntryRequest;
import app.navilla.dto.JournalEntryResponse;
import app.navilla.dto.JournalSummaryResponse;
import app.navilla.dto.JournalTemplateResponse;
import app.navilla.dto.JournalTemplatesRequest;
import app.navilla.dto.UpdateJournalEntryRequest;
import app.navilla.service.EncounterJournalService;
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

@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
public class EncounterJournalController {

  private final EncounterJournalService journalService;

  @GetMapping
  public ResponseEntity<java.util.List<JournalEntryResponse>> listEntries(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(required = false) String month) {
    return ResponseEntity.ok(journalService.listEntries(jwt, month));
  }

  @PostMapping
  public ResponseEntity<JournalEntryResponse> createEntry(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody CreateJournalEntryRequest request) {
    return ResponseEntity.ok(journalService.createEntry(jwt, request));
  }

  @PutMapping("/{id}")
  public ResponseEntity<JournalEntryResponse> updateEntry(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateJournalEntryRequest request) {
    return ResponseEntity.ok(journalService.updateEntry(jwt, id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteEntry(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID id) {
    journalService.deleteEntry(jwt, id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/templates")
  public ResponseEntity<JournalTemplateResponse> getTemplates(
      @AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok(journalService.getTemplates(jwt));
  }

  @PutMapping("/templates")
  public ResponseEntity<JournalTemplateResponse> saveTemplates(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody JournalTemplatesRequest request) {
    return ResponseEntity.ok(journalService.saveTemplates(jwt, request));
  }

  @GetMapping("/summary")
  public ResponseEntity<JournalSummaryResponse> getSummary(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(defaultValue = "2026") int year) {
    return ResponseEntity.ok(journalService.getSummary(jwt, year));
  }
}
```

**Step 2: Run ALL backend tests**

Run: `cd backend && ./mvnw test -q`
Expected: All tests GREEN (including new service + controller tests)

**Step 3: Commit**

```bash
git add backend/src/main/java/app/navilla/controller/EncounterJournalController.java
git commit -m "feat: implement encounter journal REST controller"
git push
```

---

## Task 9: Frontend API Client + Types + Hook

**Files:**
- Modify: `frontend/src/lib/api.ts` — add `api.journal.*` group + interfaces + E2E mock
- Create: `frontend/src/hooks/useJournal.ts` — React Query hooks

**Step 1: Add types and API group to `api.ts`**

Add these interfaces near the existing type definitions:

```typescript
export interface CustomField {
  label: string;
  value: string;
}

export interface JournalEntry {
  id: string;
  encounterDate: string;
  partnerAlias: string | null;
  connectionId: string | null;
  connectionDisplayName: string | null;
  notes: string | null;
  customFields: CustomField[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryRequest {
  encounterDate: string;
  partnerAlias?: string;
  connectionId?: string;
  notes?: string;
  customFields?: CustomField[];
}

export interface UpdateJournalEntryRequest {
  encounterDate: string;
  partnerAlias?: string;
  connectionId?: string;
  notes?: string;
  customFields?: CustomField[];
}

export interface JournalSummary {
  year: number;
  monthlyCounts: Record<string, number>;
  yearTotal: number;
}

export interface JournalTemplates {
  labels: string[];
}
```

Add to the `api` object:

```typescript
journal: {
  list: (token: string, month?: string) =>
    apiRequest<JournalEntry[]>(month ? `/api/journal?month=${month}` : '/api/journal', token),
  create: (token: string, data: CreateJournalEntryRequest) =>
    apiRequest<JournalEntry>('/api/journal', token, { method: 'POST', body: data }),
  update: (token: string, id: string, data: UpdateJournalEntryRequest) =>
    apiRequest<JournalEntry>(`/api/journal/${id}`, token, { method: 'PUT', body: data }),
  delete: (token: string, id: string) =>
    apiRequest<void>(`/api/journal/${id}`, token, { method: 'DELETE' }),
  summary: (token: string, year: number) =>
    apiRequest<JournalSummary>(`/api/journal/summary?year=${year}`, token),
  templates: {
    get: (token: string) =>
      apiRequest<JournalTemplates>('/api/journal/templates', token),
    save: (token: string, labels: string[]) =>
      apiRequest<JournalTemplates>('/api/journal/templates', token, { method: 'PUT', body: { labels } }),
  },
},
```

Add E2E mock in the `apiRequest` function's E2E block:

```typescript
if (endpoint.startsWith('/api/journal/templates')) return { labels: [] } as T;
if (endpoint.startsWith('/api/journal/summary')) return { year: 2026, monthlyCounts: {}, yearTotal: 0 } as T;
if (endpoint.startsWith('/api/journal')) return [] as T;
```

**Step 2: Create useJournal hook**

```typescript
// frontend/src/hooks/useJournal.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  api,
  type JournalEntry,
  type CreateJournalEntryRequest,
  type UpdateJournalEntryRequest,
  type JournalSummary,
  type JournalTemplates,
} from '../lib/api';

export type { JournalEntry, CreateJournalEntryRequest, UpdateJournalEntryRequest, JournalSummary, JournalTemplates };

export function useJournalEntries(month?: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'list', month ?? 'all'],
    queryFn: () => api.journal.list(session!.access_token, month),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useJournalSummary(year: number) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'summary', year],
    queryFn: () => api.journal.summary(session!.access_token, year),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useJournalTemplates() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'templates'],
    queryFn: () => api.journal.templates.get(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateJournalEntry() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJournalEntryRequest) =>
      api.journal.create(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useUpdateJournalEntry() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJournalEntryRequest }) =>
      api.journal.update(session!.access_token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useDeleteJournalEntry() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.journal.delete(session!.access_token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useSaveJournalTemplates() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (labels: string[]) =>
      api.journal.templates.save(session!.access_token, labels),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'templates'] });
    },
  });
}
```

**Step 3: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: No new errors

**Step 4: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/hooks/useJournal.ts
git commit -m "feat: add journal API client, types, and React Query hooks"
git push
```

---

## Task 10: Frontend i18n Keys

**Files:**
- Modify: `frontend/src/locales/en_US.json`
- Modify: `frontend/src/locales/es_MX.json`

**Step 1: Add journal keys to en_US.json**

Add under the top-level `journal` key:

```json
"nav": {
  "journal": "Journal"
},
"journal": {
  "title": "My Journal",
  "addEntry": "New Entry",
  "editEntry": "Edit Entry",
  "encounterDate": "Date",
  "partnerAlias": "Partner alias",
  "partnerAliasPlaceholder": "Name or nickname (optional)",
  "notes": "Notes",
  "notesPlaceholder": "Add notes about this encounter (optional)",
  "linkConnection": "Link to connection",
  "selectConnection": "Select a connection...",
  "noConnection": "None",
  "customFields": "Custom fields",
  "addField": "Add field",
  "saveForFuture": "Save \"{label}\" for future entries",
  "maxFields": "Maximum 3 custom fields",
  "fieldLabel": "Label",
  "fieldValue": "Value",
  "fieldLabelPlaceholder": "e.g., Location",
  "fieldValuePlaceholder": "e.g., Roma Norte",
  "timeline": "Timeline",
  "calendar": "Calendar",
  "monthSummary": "This month: {{count}} entries",
  "yearTotal": "Year total: {{count}} entries",
  "empty": {
    "title": "Start your private journal",
    "description": "Your entries are encrypted and only visible to you. Log encounters to track your sexual health history privately.",
    "cta": "Log your first entry"
  },
  "encrypted": "Encrypted",
  "encryptedTooltip": "Your journal entries are encrypted with AES-256. Only you can see them.",
  "deleteConfirm": "Are you sure you want to delete this entry? This cannot be undone.",
  "deleteTitle": "Delete entry",
  "anonymous": "Anonymous",
  "customFieldCount": "{{count}} custom fields",
  "save": "Save",
  "cancel": "Cancel",
  "noEntries": "No entries this month"
}
```

**Step 2: Add journal keys to es_MX.json**

Same structure with Spanish translations:

```json
"nav": {
  "journal": "Diario"
},
"journal": {
  "title": "Mi Diario",
  "addEntry": "Nueva Entrada",
  "editEntry": "Editar Entrada",
  "encounterDate": "Fecha",
  "partnerAlias": "Alias de pareja",
  "partnerAliasPlaceholder": "Nombre o apodo (opcional)",
  "notes": "Notas",
  "notesPlaceholder": "Agrega notas sobre este encuentro (opcional)",
  "linkConnection": "Vincular a conexión",
  "selectConnection": "Selecciona una conexión...",
  "noConnection": "Ninguna",
  "customFields": "Campos personalizados",
  "addField": "Agregar campo",
  "saveForFuture": "Guardar \"{label}\" para futuras entradas",
  "maxFields": "Máximo 3 campos personalizados",
  "fieldLabel": "Etiqueta",
  "fieldValue": "Valor",
  "fieldLabelPlaceholder": "ej., Ubicación",
  "fieldValuePlaceholder": "ej., Roma Norte",
  "timeline": "Cronología",
  "calendar": "Calendario",
  "monthSummary": "Este mes: {{count}} entradas",
  "yearTotal": "Total del año: {{count}} entradas",
  "empty": {
    "title": "Comienza tu diario privado",
    "description": "Tus entradas están encriptadas y solo tú puedes verlas. Registra encuentros para llevar un historial privado de tu salud sexual.",
    "cta": "Registra tu primera entrada"
  },
  "encrypted": "Encriptado",
  "encryptedTooltip": "Tus entradas están encriptadas con AES-256. Solo tú puedes verlas.",
  "deleteConfirm": "¿Estás seguro de que quieres eliminar esta entrada? Esta acción no se puede deshacer.",
  "deleteTitle": "Eliminar entrada",
  "anonymous": "Anónimo",
  "customFieldCount": "{{count}} campos personalizados",
  "save": "Guardar",
  "cancel": "Cancelar",
  "noEntries": "Sin entradas este mes"
}
```

Note: Merge `nav.journal` into the existing `nav` object — don't create a duplicate `nav` key.

**Step 3: Commit**

```bash
git add frontend/src/locales/en_US.json frontend/src/locales/es_MX.json
git commit -m "feat: add journal i18n keys (en_US + es_MX)"
git push
```

---

## Task 11: Frontend — Journal Page + Timeline View

**Files:**
- Create: `frontend/src/pages/JournalPage.tsx`
- Create: `frontend/src/components/journal/JournalTimeline.tsx`
- Create: `frontend/src/components/journal/JournalEntryCard.tsx`
- Create: `frontend/src/components/journal/JournalEmptyState.tsx`
- Modify: `frontend/src/router.tsx` — add `/journal` route
- Modify: `frontend/src/components/layout/Header.tsx` — add nav link

This is the largest frontend task. Use the `@frontend-design` skill for UI implementation.

**Step 1: Create JournalEntryCard component**

A card showing: date, partner alias (or "Anonymous"), notes preview (truncated to ~100 chars), custom field count badge, edit/delete icon buttons. Uses existing `.card` CSS class pattern.

**Step 2: Create JournalTimeline component**

Receives `entries: JournalEntry[]`. Groups entries by month (`YYYY-MM`). Renders month headers + JournalEntryCard for each entry. Newest first.

**Step 3: Create JournalEmptyState component**

Lock icon + warm title + description + CTA button. Uses `t('journal.empty.*')` keys.

**Step 4: Create JournalPage**

- Toolbar: page title with lock badge, "+ New Entry" button, view toggle (Timeline/Calendar), month navigator arrows
- Uses `useJournalEntries()` for data
- Uses `useJournalSummary()` for monthly/yearly counts
- Shows `<PageSkeleton>` while loading
- Shows `<JournalEmptyState>` when no entries
- Shows `<JournalTimeline>` by default
- Monthly summary card at bottom
- State: `activeView` ('timeline' | 'calendar'), `currentMonth` (string | null for all)

**Step 5: Add route to router.tsx**

Add to the protected routes children array:

```typescript
import { JournalPage } from './pages/JournalPage';
// ...
{ path: 'journal', element: (<ProtectedRoute><JournalPage /></ProtectedRoute>) }
```

**Step 6: Add nav link to Header.tsx**

Add between Dashboard and Connections in both desktop and mobile nav:

```tsx
import { BookOpen } from 'lucide-react';
// ...
<Link to="/journal" className={`nav-link${pathname === '/journal' ? ' nav-link-active' : ''}`}>
  <BookOpen className="nav-icon" aria-hidden="true" />
  {t('nav.journal')}
</Link>
```

**Step 7: Run frontend lint + build**

Run: `cd frontend && npm run lint && npm run build`
Expected: No errors

**Step 8: Commit**

```bash
git add frontend/src/pages/JournalPage.tsx \
  frontend/src/components/journal/JournalTimeline.tsx \
  frontend/src/components/journal/JournalEntryCard.tsx \
  frontend/src/components/journal/JournalEmptyState.tsx \
  frontend/src/router.tsx \
  frontend/src/components/layout/Header.tsx
git commit -m "feat: add journal page with timeline view, nav link, and routing"
git push
```

---

## Task 12: Frontend — Create/Edit Modal

**Files:**
- Create: `frontend/src/components/journal/JournalEntryModal.tsx`
- Modify: `frontend/src/pages/JournalPage.tsx` — wire modal open/close + create/edit/delete mutations

**Step 1: Create JournalEntryModal component**

Props: `isOpen`, `onClose`, `entry?: JournalEntry` (null = create, defined = edit), `onSave`, `isPending`.

Form fields:
- Date picker (required, defaults to today for create, entry date for edit)
- Partner alias text input
- Connection dropdown (uses `api.connections.confirmed()` to populate)
- Notes textarea
- Custom fields section (uses `useJournalTemplates()` to pre-populate)
  - Each field: label input + value input + remove button
  - "+ Add field" button (disabled at 3)
  - Checkbox per field: "Save [label] for future entries"
- Cancel / Save buttons (Save shows spinner when `isPending`)

Uses existing modal pattern: `.modal-backdrop` + `.modal` with `role="dialog" aria-modal="true"`.

**Step 2: Wire modal to JournalPage**

- State: `isModalOpen`, `editingEntry: JournalEntry | null`
- "+ New Entry" button → opens modal with `editingEntry = null`
- Edit button on card → opens modal with `editingEntry = entry`
- Delete button on card → shows confirm dialog, calls `useDeleteJournalEntry().mutateAsync(id)`
- Save → calls `useCreateJournalEntry` or `useUpdateJournalEntry` depending on `editingEntry`
- On save, also check "save for future" checkboxes and call `useSaveJournalTemplates` if any are checked

**Step 3: Run frontend lint + build**

Run: `cd frontend && npm run lint && npm run build`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/components/journal/JournalEntryModal.tsx frontend/src/pages/JournalPage.tsx
git commit -m "feat: add journal entry create/edit modal with custom fields"
git push
```

---

## Task 13: Frontend — Calendar View

**Files:**
- Create: `frontend/src/components/journal/JournalCalendar.tsx`
- Modify: `frontend/src/pages/JournalPage.tsx` — wire calendar toggle

**Step 1: Create JournalCalendar component**

Props: `entries: JournalEntry[]`, `currentMonth: string` (YYYY-MM), `onDayClick: (date: string) => void`.

- Render a monthly grid (Mo-Su header row + day cells)
- Days with entries get an indigo dot indicator
- Tapping a day with entries calls `onDayClick` — parent shows filtered entries below
- Current day gets a subtle ring highlight
- Uses CSS Grid for the calendar layout

**Step 2: Wire calendar into JournalPage**

- When `activeView === 'calendar'`, show `<JournalCalendar>` above a filtered entry list
- `onDayClick` sets `selectedDate` state → filters entries for that date → shows JournalEntryCards below calendar
- Month navigator arrows also control the calendar month

**Step 3: Run frontend lint + build**

Run: `cd frontend && npm run lint && npm run build`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/components/journal/JournalCalendar.tsx frontend/src/pages/JournalPage.tsx
git commit -m "feat: add journal calendar view with day-entry indicators"
git push
```

---

## Task 14: Frontend Tests

**Files:**
- Create: `frontend/src/pages/JournalPage.test.tsx`
- Create: `frontend/src/components/journal/JournalEntryModal.test.tsx`

**Step 1: Write JournalPage tests**

Test cases:
- Renders page title and "New Entry" button
- Shows empty state when no entries
- Shows timeline view with entries
- Toggles between timeline and calendar views
- Shows monthly summary

**Step 2: Write JournalEntryModal tests**

Test cases:
- Renders create form with empty fields
- Renders edit form with pre-populated fields
- Date field is required — submit disabled without it
- Can add custom fields (up to 3)
- "+ Add field" disabled at 3 custom fields
- Calls onSave with form data

**Step 3: Run frontend tests**

Run: `cd frontend && npm test`
Expected: All tests GREEN

**Step 4: Commit**

```bash
git add frontend/src/pages/JournalPage.test.tsx \
  frontend/src/components/journal/JournalEntryModal.test.tsx
git commit -m "test: add journal page and modal component tests"
git push
```

---

## Task 15: Update Postman Collection + Docs

**Files:**
- Modify: `docs/static/postman/navilla-api.postman_collection.json` — add Journal folder
- Modify: `CONTEXT.md` — add session notes

**Step 1: Add Journal endpoints to Postman collection**

Add a "Journal" folder with requests for all 8 endpoints:
- GET /api/journal
- GET /api/journal?month=2026-03
- POST /api/journal
- PUT /api/journal/:id
- DELETE /api/journal/:id
- GET /api/journal/templates
- PUT /api/journal/templates
- GET /api/journal/summary?year=2026

**Step 2: Update CONTEXT.md**

Add session notes for Week 5 work:
- New tables: `encounter_journal`, `journal_field_templates`
- New API: `/api/journal` (8 endpoints)
- New frontend: `/journal` page with timeline + calendar views
- New components: JournalTimeline, JournalCalendar, JournalEntryCard, JournalEntryModal, JournalEmptyState
- New hooks: useJournalEntries, useJournalSummary, useJournalTemplates, and mutation hooks
- Encryption: server-side AES-256-GCM for all text fields
- Custom fields: encrypted JSON blob, max 3 per entry, saveable templates

**Step 3: Commit**

```bash
git add docs/static/postman/navilla-api.postman_collection.json CONTEXT.md
git commit -m "docs: update Postman collection and CONTEXT.md for encounter journal"
git push
```

---

## Task 16: Full Test Suite Verification

**Step 1: Run all backend tests**

Run: `cd backend && ./mvnw test`
Expected: All tests GREEN

**Step 2: Run all frontend tests + lint**

Run: `cd frontend && npm run lint && npm test`
Expected: All passing

**Step 3: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Final commit if any fixes needed**

---

## Summary

| Task | Description | Estimated Steps |
|------|-------------|-----------------|
| 1 | Database migration | 3 |
| 2 | Entities + repositories | 6 |
| 3 | DTOs | 6 |
| 4 | Backend i18n messages | 3 |
| 5 | Service tests (red) | 3 |
| 6 | Service implementation (green) | 3 |
| 7 | Controller tests (red) | 2 |
| 8 | Controller implementation (green) | 3 |
| 9 | Frontend API + types + hooks | 4 |
| 10 | Frontend i18n keys | 3 |
| 11 | Journal page + timeline view + routing + nav | 8 |
| 12 | Create/edit modal | 4 |
| 13 | Calendar view | 4 |
| 14 | Frontend tests | 4 |
| 15 | Postman + docs | 3 |
| 16 | Full test verification | 4 |
| **Total** | | **~63 steps, 16 tasks** |
