# Week 5 Design: Encounter Journal

> Layer 1 — Personal Tracker. First feature requiring user authentication and encrypted personal data.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Encryption model | Server-side AES-256-GCM now, E2E later | Balance of security and simplicity. BYTEA columns are compatible with future client-side encryption swap |
| Custom fields | Encrypted JSON blob (max 3 per entry) | Can't query encrypted data anyway — no benefit to EAV normalization. Single column = no joins |
| Saved templates | Separate small table (max 3 per user) | User can save custom field labels for reuse. DB-enforced uniqueness on display_order |
| Connection link | Optional FK to connections table | Alias is always freeform. Optional link enables future "encounter history with person" views |
| Timeline UX | Toggle between list and calendar views | List is default and ships first. Calendar adds pattern-spotting value |
| Architecture | Flat table + JSON custom fields | Approach A — simpler, faster reads, fully encrypted |

---

## Data Model

### `encounter_journal` table (migration `008_encounter_journal.sql`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK` | `uuid_generate_v4()` |
| `user_hash` | `VARCHAR(64) NOT NULL` | SHA-256 hashed user identity |
| `encounter_date` | `DATE NOT NULL` | When the encounter happened |
| `partner_alias_encrypted` | `BYTEA` | Nullable — AES-256-GCM encrypted freeform alias |
| `connection_id` | `UUID` | Nullable FK to `connections.id` |
| `notes_encrypted` | `BYTEA` | Nullable — encrypted freeform notes |
| `custom_fields_encrypted` | `BYTEA` | Nullable — encrypted JSON: `[{label, value}]` max 3 |
| `created_at` | `TIMESTAMPTZ DEFAULT NOW()` | Immutable |
| `updated_at` | `TIMESTAMPTZ DEFAULT NOW()` | Updated on mutation |

**Indexes:**
- `idx_encounter_journal_user(user_hash)`
- `idx_encounter_journal_date(user_hash, encounter_date DESC)`

### `journal_field_templates` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK` | `uuid_generate_v4()` |
| `user_hash` | `VARCHAR(64) NOT NULL` | |
| `label_encrypted` | `BYTEA NOT NULL` | Encrypted label text |
| `display_order` | `INTEGER NOT NULL` | 1, 2, or 3 |
| `created_at` | `TIMESTAMPTZ DEFAULT NOW()` | |

**Constraint:** `UNIQUE(user_hash, display_order)` — max 3 per user enforced at DB level.

---

## Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/journal` | List all entries (newest first) |
| `GET` | `/api/journal?month=2026-03` | Filter by month |
| `POST` | `/api/journal` | Create entry |
| `PUT` | `/api/journal/{id}` | Update entry (ownership checked) |
| `DELETE` | `/api/journal/{id}` | Delete entry (ownership checked) |
| `GET` | `/api/journal/templates` | Get saved custom field templates |
| `PUT` | `/api/journal/templates` | Save/update templates (array of up to 3 labels) |
| `GET` | `/api/journal/summary?year=2026` | Monthly summary (entry count per month) |

### Backend Classes

| Class | Package | Purpose |
|-------|---------|---------|
| `EncounterJournal.java` | `entity` | JPA entity |
| `JournalFieldTemplate.java` | `entity` | JPA entity for saved templates |
| `EncounterJournalRepository.java` | `repository` | Spring Data JPA |
| `JournalFieldTemplateRepository.java` | `repository` | Spring Data JPA |
| `EncounterJournalService.java` | `service` | Business logic, encryption, ownership |
| `EncounterJournalController.java` | `controller` | REST endpoints |
| `CreateJournalEntryRequest.java` | `dto` | Request DTO with validation |
| `UpdateJournalEntryRequest.java` | `dto` | Request DTO |
| `JournalEntryResponse.java` | `dto` | Response DTO (decrypted) |
| `JournalSummaryResponse.java` | `dto` | Monthly counts |
| `JournalTemplatesRequest.java` | `dto` | Template save request |
| `JournalTemplateResponse.java` | `dto` | Template response (decrypted) |

### Request/Response Shapes

```java
// Create/Update request
public record CreateJournalEntryRequest(
    @NotNull LocalDate encounterDate,
    String partnerAlias,          // optional
    UUID connectionId,            // optional FK
    String notes,                 // optional
    List<CustomField> customFields // optional, max 3
) {
    public record CustomField(
        @NotBlank String label,
        @NotBlank String value
    ) {}
}

// Response (decrypted)
public record JournalEntryResponse(
    UUID id,
    LocalDate encounterDate,
    String partnerAlias,          // decrypted, nullable
    UUID connectionId,            // nullable
    String connectionDisplayName, // resolved from connection, nullable
    String notes,                 // decrypted, nullable
    List<CustomField> customFields, // decrypted, nullable
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public record CustomField(String label, String value) {}
}
```

---

## Frontend Design

### Navigation & Routing

- Route: `/journal` (protected)
- Nav label: "Journal" / "Diario"
- Position: after Dashboard in nav order

### Page Structure

**Toolbar:** Page title + "+ New Entry" button + view toggle (Timeline / Calendar) + month navigator

**Timeline View (default):**
- Vertical list, newest first
- Entries grouped by month headers
- Each entry card: date, alias (or "Anonymous"), notes preview (truncated), custom field count badge, edit/delete actions
- Monthly summary card at bottom: "This month: X entries | Year total: Y"

**Calendar View:**
- Monthly grid with dots on days that have entries
- Tap a day with entries → shows entry cards for that day below the calendar
- Month navigation arrows

### Create/Edit Modal

- Date picker (required, defaults to today)
- Partner alias text input (optional)
- "Link to connection" dropdown (optional, populated from confirmed connections)
- Notes textarea (optional)
- Custom fields section: add up to 3 key-value pairs
  - Pre-populated with saved template labels (values empty)
  - "+ Add field" button (disabled at 3)
  - Checkbox: "Save [label] for future entries"
- Cancel / Save buttons

### Empty State

Warm, encouraging message: "Start your private journal. Your entries are encrypted and only visible to you." with a prominent "+ Log your first entry" CTA.

### Privacy Signals

- Lock icon + "Encrypted" badge in page header
- Tooltip: "Your journal entries are encrypted with AES-256. Only you can see them."

---

## Frontend Files

| File | Purpose |
|------|---------|
| `pages/JournalPage.tsx` | Main page with toolbar, view toggle, timeline/calendar |
| `components/journal/JournalTimeline.tsx` | Timeline list view |
| `components/journal/JournalCalendar.tsx` | Calendar grid view |
| `components/journal/JournalEntryCard.tsx` | Single entry card |
| `components/journal/JournalEntryModal.tsx` | Create/edit modal form |
| `components/journal/JournalEmptyState.tsx` | Empty state illustration |
| `hooks/useJournal.ts` | React Query hooks (list, create, update, delete, templates, summary) |
| `lib/api.ts` | New `api.journal.*` group + interfaces |
| `locales/en_US.json` | `journal.*` keys |
| `locales/es_MX.json` | `journal.*` keys |

---

## Testing Strategy

### Backend
- `EncounterJournalServiceTest.java` — unit tests: CRUD, encryption/decryption, ownership checks, custom field validation (max 3), template save/load
- `EncounterJournalControllerTest.java` — integration tests: all endpoints, validation errors, 404s, auth

### Frontend
- `JournalPage.test.tsx` — page renders, view toggle, empty state
- `JournalEntryModal.test.tsx` — form validation, create/edit flows
- `useJournal.test.ts` — hook behavior with mocked API
- E2E mock data added to `api.ts` for `E2E_MODE`

---

## i18n Keys (new)

All under `journal.*` namespace:
- `journal.title`, `journal.addEntry`, `journal.editEntry`
- `journal.encounterDate`, `journal.partnerAlias`, `journal.notes`
- `journal.linkConnection`, `journal.selectConnection`
- `journal.customFields`, `journal.addField`, `journal.saveForFuture`, `journal.maxFields`
- `journal.timeline`, `journal.calendar`
- `journal.monthSummary`, `journal.yearTotal`
- `journal.empty.title`, `journal.empty.description`, `journal.empty.cta`
- `journal.encrypted`, `journal.encryptedTooltip`
- `journal.deleteConfirm`, `journal.deleteTitle`
- `journal.anonymous` (when no alias provided)
- Nav: `nav.journal`
