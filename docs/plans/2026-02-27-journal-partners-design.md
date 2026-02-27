# Journal Partners ("Regulars") Design

## Goal

Allow users to save recurring encounter partners as first-class entities with their own notes, encounter stats, and detail pages — making repeat logging faster and giving historical context at a glance.

## Core Principles

- **Partners are optional** — creating a partner record is never required to log an encounter
- **Organic discovery** — after the 3rd encounter with the same alias, prompt the user to save as a partner
- **Entries are snapshots** — the alias on an entry records what the name was at that moment; renaming a partner doesn't rewrite history
- **Privacy preserved** — partner aliases and notes are AES-256-GCM encrypted, same as all journal data

---

## Data Model

### New table: `journal_partners`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Default uuid_generate_v4() |
| `user_hash` | VARCHAR(64) NOT NULL | Owner identity (SHA-256 hashed email) |
| `alias_encrypted` | BYTEA NOT NULL | Encrypted partner name |
| `connection_id` | UUID FK → connections(id) | Optional link to Navilla user, ON DELETE SET NULL |
| `notes_encrypted` | BYTEA | Partner-level notes (not tied to any encounter) |
| `created_at` | TIMESTAMPTZ NOT NULL | |
| `updated_at` | TIMESTAMPTZ NOT NULL | |

Index on `(user_hash)`.

### Modify `encounter_journal`

- Add column: `partner_id UUID REFERENCES journal_partners(id) ON DELETE SET NULL`
- Keep existing `partner_alias_encrypted` (snapshot of alias at time of entry)
- Keep existing `connection_id` (backwards compat for entries without a partner)

### Relationships

- A partner has many entries (via `partner_id`)
- An entry optionally belongs to one partner
- `partner_alias_encrypted` on the entry = alias at time of encounter (snapshot)
- `alias_encrypted` on the partner = current canonical name
- `connection_id` lives on the partner for saved partners; on the entry for one-off encounters

### Computed stats (derived, not stored)

- Encounter count: `COUNT(*) WHERE partner_id = ?`
- First encounter: `MIN(encounter_date) WHERE partner_id = ?`
- Most recent encounter: `MAX(encounter_date) WHERE partner_id = ?`

---

## Backend API

### New endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/journal/partners` | List all saved partners (alias, encounter count, first/last date) |
| `POST` | `/api/journal/partners` | Create a partner (alias, optional connection_id, optional notes) |
| `GET` | `/api/journal/partners/:id` | Partner detail (alias, notes, connection info, stats) |
| `PUT` | `/api/journal/partners/:id` | Update partner (rename, edit notes, link/unlink connection) |
| `DELETE` | `/api/journal/partners/:id` | Delete partner; query param `?deleteEntries=true` for destructive mode |
| `GET` | `/api/journal/partners/:id/entries` | List all entries for a partner |
| `POST` | `/api/journal/partners/promote` | Promote an alias to a partner + backfill `partner_id` on matching entries |
| `GET` | `/api/journal/recent-aliases` | Distinct recent aliases not linked to a partner (limit 8) |

### Changes to existing endpoints

- `POST /api/journal` — accept optional `partnerId`. When present, snapshot `partnerAliasEncrypted` from the partner's current alias.
- `PUT /api/journal/:id` — accept optional `partnerId`. Same snapshot behavior.
- `GET /api/journal` — response includes `partnerId` and `partnerEncounterCount` for entries that have a partner.

### Partner list response shape

```json
{
  "id": "uuid",
  "alias": "Alex",
  "connectionId": "uuid | null",
  "connectionDisplayName": "string | null",
  "encounterCount": 5,
  "firstEncounterDate": "2026-01-15",
  "mostRecentEncounterDate": "2026-02-27"
}
```

### Promote endpoint

- Body: `{ "alias": "Alex" }`
- Decrypts user's entries, finds those matching alias (case-insensitive trim)
- Creates `journal_partners` record
- Sets `partner_id` on all matched entries
- Returns the new partner

### Delete partner

Two modes:
1. **Soft** (default): sets `partner_id = null` on linked entries, deletes partner record. Entries survive.
2. **Destructive** (`?deleteEntries=true`): deletes partner AND all linked entries.

---

## Frontend: Entry Modal Changes

### Partner picker (replaces separate alias + connection fields)

1. **Recent partners section** — top of modal, shows last 5-8 partners. Saved partners first (with subtle indicator), then recent unsaved aliases. Tap to select.
2. **Alias input with autocomplete** — typing filters/suggests from saved partners and previous entry aliases. Case-insensitive matching.
3. Picking a saved partner auto-fills alias and locks connection link (inherited from partner).
4. Typing a new name with no match → freeform alias, no partner created.
5. For entries with a saved partner, connection dropdown is hidden (lives on partner). For entries without, connection dropdown still appears.

### 3rd encounter prompt

After saving an entry where the alias matches 3+ previous entries without a `partner_id`:
- Show a toast/banner: "You've logged 3 encounters with Alex. Save as a partner?"
- **Yes** → calls `/api/journal/partners/promote`, backfills all matching entries
- **Not now** → dismiss, don't re-prompt this session

---

## Frontend: Entry Card Changes

- Entry cards with a saved partner show alias + clickable text "5 encounters · View all" → navigates to partner detail page. Only shown when count > 1.
- Saved partner indicator: subtle icon next to alias to distinguish from one-off aliases.
- Cards without a partner show alias or "Anonymous" as today.
- Cards stay clean — detailed stats live on the partner detail page.

---

## Frontend: Journal Page — Partners Tab

Third tab alongside Timeline and Calendar: **Partners**.

- List of saved partner cards, sorted by most recent encounter date
- Each card shows: alias, encounter count, last encounter date, linked connection badge (if any)
- Tap → partner detail page (`/journal/partner/:id`)
- Empty state: "Partners you see regularly will appear here"

---

## Frontend: Partner Detail Page

**Route:** `/journal/partner/:id`

### Content

- Partner alias (large heading)
- Linked connection badge (if linked to a Navilla user)
- Stats row: first encounter date | most recent date | total encounters count
- **Partner notes** — freeform encrypted text area, editable inline with save button. For notes about the person not tied to any specific encounter.
- **Encounter timeline** — all entries linked to this partner, newest-first, reusing `JournalEntryCard`

### Partner management

- Rename alias (updates partner record, does NOT change historical entry snapshots)
- Edit partner notes
- Link/unlink a Navilla connection
- Delete partner → modal with two options:
  1. **Remove partner only** — unlinks entries, deletes partner record
  2. **Delete partner AND all entries** — red destructive modal, shows count ("This will permanently delete Alex and 12 encounter entries"), user must type "DELETE" to confirm

---

## Migration Strategy

- Existing entries with `partner_alias_encrypted` but no `partner_id` continue to work unchanged
- The "promote" flow handles retroactive linking when users opt in
- No forced migration — partners are discovered organically through usage
