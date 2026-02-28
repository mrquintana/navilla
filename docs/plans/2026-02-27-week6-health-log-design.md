# Week 6 Design: Health Log (formerly Health Status)

> Replaces the existing Health Status page with a full testing history tracker.
> Designed for mobile-first UX. Schema supports future lab verification (Chopo, Salud Digna).

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Relationship to Health Status | Rebuild from scratch, better UX | Current page is MVP-quality, not Layer 1 quality |
| Naming | "Health Log" | Warm, broad, not clinical. Pairs with "Journal" |
| Data model | Parent-child (visits → results) | A test visit is ONE event with multiple results. Better UX than flat |
| Lab storage | Normalized: labs + lab_credentials EAV | Decoupled from any specific provider. Chopo, Salud Digna, future labs all fit |
| Encryption | Notes, facility names, result values, lab creds encrypted. Reference ranges plaintext | Reference ranges are public medical knowledge |
| Condition detail | Separate page `/health-log/:condition` | Mobile-native pattern: tap to drill in. Full screen for history. Maps to React Native nav stack |
| Custom conditions | Supported | Users test for things outside our 10 standard STIs |
| Numeric results | Optional value + reference range per result | Real lab results are numeric. Makes the app a real health tool, not a toy |
| Document upload | Deferred to Week 9 | Schema has `document_ref_encrypted` column ready. No upload infra yet |
| Chopo verification | Deferred (schema ready) | Store order_id + patient_id now, build verification endpoint later |
| Exposure sync | Write-through to `health_status` table | Keeps existing BFS exposure calculation working with zero changes |
| Old endpoints | Keep `/api/health-status` alive | Dashboard and exposure pages read from them. Deprecate later |

---

## Data Model

### New Tables (Migration 010)

```sql
-- User's saved lab profiles
CREATE TABLE labs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    provider VARCHAR(32) NOT NULL,          -- CHOPO, SALUD_DIGNA, OTHER
    name_encrypted BYTEA NOT NULL,          -- "Chopo Polanco", "Clínica Roma"
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EAV for lab-level persistent identifiers (encrypted)
CREATE TABLE lab_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    credential_key VARCHAR(64) NOT NULL,    -- "patient_id", "account_number"
    value_encrypted BYTEA NOT NULL,
    UNIQUE (lab_id, credential_key)
);

-- One row per test visit (parent)
CREATE TABLE test_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    test_date DATE NOT NULL,
    lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
    lab_reference_encrypted BYTEA,          -- visit-specific ref (order_id, folio)
    notes_encrypted BYTEA,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per condition tested in a visit (child)
CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES test_visits(id) ON DELETE CASCADE,
    condition_type VARCHAR(32),             -- standard enum value, NULL if custom
    custom_condition_encrypted BYTEA,       -- encrypted name for custom conditions
    status VARCHAR(16) NOT NULL,            -- positive, negative, pending, indeterminate
    result_value_encrypted BYTEA,           -- "1.2 IgG", "1:4", "200 copies/mL"
    reference_range VARCHAR(200),           -- "<0.9 neg, >1.1 pos" (public knowledge, not encrypted)
    cleared_at TIMESTAMPTZ,
    document_ref_encrypted BYTEA,           -- future: storage path for image/PDF
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_labs_user ON labs(user_hash);
CREATE INDEX idx_test_visits_user ON test_visits(user_hash);
CREATE INDEX idx_test_visits_date ON test_visits(user_hash, test_date DESC);
CREATE INDEX idx_test_results_visit ON test_results(visit_id);
CREATE INDEX idx_test_results_condition ON test_results(condition_type);
```

### Existing Table: `health_status` (unchanged)

Write-through sync: when a test visit is saved, the service updates `health_status` with the latest result per condition. Exposure BFS continues reading from `health_status` with zero changes.

---

## API Endpoints

### Visits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health-log/visits` | List all visits (newest first) |
| POST | `/api/health-log/visits` | Log a new visit + results |
| GET | `/api/health-log/visits/:id` | Get visit detail with results |
| PUT | `/api/health-log/visits/:id` | Update visit + results |
| DELETE | `/api/health-log/visits/:id` | Delete visit and its results |

### Dashboard & Condition Detail

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health-log/summary` | Stats: days since last test, tests this year, coverage count, latest status per condition |
| GET | `/api/health-log/condition/:type` | Per-condition history across all visits |

### Labs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health-log/labs` | List saved labs with credentials |
| POST | `/api/health-log/labs` | Create lab + credentials |
| PUT | `/api/health-log/labs/:id` | Update lab name/credentials |
| DELETE | `/api/health-log/labs/:id` | Delete lab |

---

## Frontend

### Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/health-log` | HealthLogPage | Dashboard: stats bar, exposure overview, condition cards |
| `/health-log/:condition` | ConditionDetailPage | Per-condition history timeline |

Old `/health` route redirects to `/health-log`.

### Components

- **HealthLogPage.tsx** — main dashboard (replaces HealthStatusPage)
- **HealthLogStats.tsx** — hero stats: days since last test, tests this year, coverage bar
- **ConditionCard.tsx** — per-condition card: status, last tested, test count, tap → detail
- **ConditionDetailPage.tsx** — full history for one condition with values and lab info
- **TestVisitModal.tsx** — log/edit a visit: date, lab, condition checkboxes + custom, results, notes
- **LabPicker.tsx** — autocomplete from saved labs + "New lab" inline creation

### Dashboard Layout (mobile-first)

```
Health Log                            [+ Log Test Visit]
🔒 Encrypted

┌─────────────────────────────────────────────┐
│  Days since last test: 23                   │
│  Tests this year: 4  ·  Coverage: 8/10     │
└─────────────────────────────────────────────┘

── Exposure Overview ──────────────────────────
(existing exposure cards — carried over from Health Status)

── My Results ─────────────────────────────────
┌──────────────────────────┐
│ HIV              Negative │
│ Last: Feb 4  ·  4 tests   │
│                        →  │
└──────────────────────────┘
┌──────────────────────────┐
│ Chlamydia        Negative │
│ Last: Feb 4  ·  3 tests   │
│                        →  │
└──────────────────────────┘
(... one card per condition that has been tested)

Coverage: "Tested for 8 of 10 common STIs this year"
```

### Test Visit Modal

```
Log Test Visit

Date:        [2026-02-27       ]
Lab:         [Chopo Polanco   ▾]  [+ New lab]
Reference:   [Order #12345     ]

Results:
  ☑ HIV         [Negative ▾]  Value: [      ] Ref: [       ]
  ☑ Chlamydia   [Negative ▾]  Value: [      ] Ref: [       ]
  ☑ Syphilis    [Positive ▾]  Value: [1:4   ] Ref: [<1:1   ]
  ☐ Gonorrhea
  ☐ HPV
  ...
  [+ Add custom condition]

Notes:       [Routine quarterly                ]

                              [Cancel]  [Save]
```

### Condition Detail Page

```
← Health Log

HIV — Test History
Current: Negative
4 tests · All clear · Last: Feb 4, 2026

  Feb 4, 2026    Negative              Chopo Polanco    ✓ Verified
  Nov 12, 2025   Negative              Salud Digna
  Aug 3, 2025    Negative   0.3 IgG    Chopo Polanco    ✓ Verified
  Mar 20, 2025   Negative              Clínica Roma
```

---

## Exposure Sync (Write-Through)

When a test visit is saved:

1. For each `test_result` in the visit:
   - If `condition_type` is a standard condition (not custom):
     - Find or create the `health_status` row for `(user_hash, condition_type)`
     - Update `status`, `test_date`, `reported_at` from the latest result
     - If result is "positive" and existing row was cleared → reset `cleared_at` to null
     - If result status is "pending" or "indeterminate" → don't update health_status (not actionable for exposure)
2. When a visit is deleted:
   - Re-derive health_status from remaining test_results for affected conditions
   - If no results remain for a condition → delete the health_status row

This keeps exposure calculation working with zero changes to the BFS algorithm.

---

## What's In Scope (Week 6)

- Migration 010: `labs`, `lab_credentials`, `test_visits`, `test_results`
- Backend: entities, repositories, service (with encryption + write-through), controller, DTOs, tests
- Frontend: HealthLogPage, ConditionDetailPage, TestVisitModal, LabPicker, HealthLogStats, ConditionCard
- Nav: rename Health Status → Health Log, redirect `/health` → `/health-log`
- i18n: full en_US + es_MX
- Tests: backend unit + integration, frontend component tests

## What's Deferred

- Document upload infrastructure (Week 9 — `document_ref_encrypted` column ready)
- Chopo/Salud Digna verification endpoint (future — schema supports it)
- Smart prompts: "consider testing", "set treatment reminder" (Week 7 reminders)
- Verified badge UI (needs verification endpoint)
- Old HealthStatusPage removal (keep both routes working during transition)
