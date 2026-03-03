# Week 7 Design: Smart Reminders + Medication Tracking

> Feature 1.3 from roadmap. Approved 2026-03-03.

---

## Scope

- Smart reminders (testing, medication, vaccination, follow-up)
- Medication tracking with adherence logging
- Vaccination series tracking
- Configuration-driven types (no hardcoded enums)
- Expand Health Log into tabbed "My Health" page
- Dashboard redesign with "Next Up" widget
- Direct partner creation from Partners tab (quick win)

---

## Architecture: Unified Reminder Engine + Config-Driven Catalog

A central `reminders` table serves as the scheduling engine for all reminder types. Separate domain tables (`medications`, `medication_logs`, `vaccinations`) store feature-specific data. A `HealthCatalogProperties` config loaded from YAML defines all available types, dose schedules, frequencies, and heuristic thresholds — no hardcoded enums, no schema changes needed to add new types.

---

## Database Schema (Migration 011)

### `medications`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_hash | VARCHAR(64) | SHA-256 |
| medication_type | VARCHAR(32) | Key from health catalog config |
| name_encrypted | BYTEA | Drug name |
| dosage_encrypted | BYTEA | Optional dosage info |
| start_date | DATE | When started |
| end_date | DATE | Nullable (ongoing = null) |
| frequency | VARCHAR(32) | Key from frequencies config |
| reminder_time | TIME | Preferred reminder time |
| notes_encrypted | BYTEA | Optional |
| active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `medication_logs`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| medication_id | UUID | FK → medications |
| user_hash | VARCHAR(64) | For direct lookups |
| logged_at | TIMESTAMPTZ | When user logged the dose |
| scheduled_for | DATE | Which day this dose was for |
| taken | BOOLEAN | Did they take it? |
| notes_encrypted | BYTEA | Optional |
| created_at | TIMESTAMPTZ | |

### `vaccinations`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_hash | VARCHAR(64) | |
| vaccine_type | VARCHAR(32) | Key from vaccine-series config |
| dose_number | INTEGER | 1, 2, 3 |
| total_doses | INTEGER | From config (but stored for history if config changes) |
| administered_date | DATE | When this dose was given |
| location_encrypted | BYTEA | Optional |
| notes_encrypted | BYTEA | |
| created_at | TIMESTAMPTZ | |

### `reminders`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_hash | VARCHAR(64) | |
| reminder_type | VARCHAR(32) | TESTING, MEDICATION, VACCINATION, FOLLOW_UP |
| reference_id | UUID | Nullable FK to medication/vaccination/etc. |
| title_encrypted | BYTEA | Display title |
| message_encrypted | BYTEA | Detailed message |
| scheduled_for | TIMESTAMPTZ | When to fire |
| repeat_rule | VARCHAR(64) | Nullable: DAILY, WEEKLY, MONTHLY, CUSTOM_DAYS:N |
| snoozed_until | TIMESTAMPTZ | Nullable |
| completed_at | TIMESTAMPTZ | Nullable |
| active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `reminder_settings`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_hash | VARCHAR(64) | UNIQUE |
| quiet_hours_start | TIME | e.g., 22:00 |
| quiet_hours_end | TIME | e.g., 08:00 |
| email_digest_enabled | BOOLEAN | Default false |
| email_digest_day | VARCHAR(12) | Day of week |
| testing_reminders_enabled | BOOLEAN | Default true |
| medication_reminders_enabled | BOOLEAN | Default true |
| vaccination_reminders_enabled | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

## Configuration-Driven Types (HealthCatalogProperties)

All medication types, vaccine series, frequencies, testing heuristics, and follow-up rules are defined in `application.yaml` under `navilla.health-catalog`. Bound to a `@ConfigurationProperties` record.

```yaml
navilla:
  health-catalog:
    medication-types:
      PREP_DAILY:
        label-key: "medications.type.prepDaily"
        default-frequency: DAILY
        ongoing: true
      PREP_INJECTABLE:
        label-key: "medications.type.prepInjectable"
        default-frequency: EVERY_2_MONTHS
        ongoing: true
      TREATMENT_COURSE:
        label-key: "medications.type.treatmentCourse"
        default-frequency: DAILY
        ongoing: false
      DOXY_PEP:
        label-key: "medications.type.doxyPep"
        default-frequency: AS_NEEDED
        ongoing: false

    frequencies:
      DAILY: { hours: 24 }
      EVERY_2_MONTHS: { days: 60 }
      WEEKLY: { days: 7 }
      AS_NEEDED: {}
      CUSTOM: {}

    vaccine-series:
      HPV:
        label-key: "vaccinations.type.hpv"
        total-doses: 3
        dose-intervals-days: [0, 60, 120]
      HEPATITIS_B:
        label-key: "vaccinations.type.hepatitisB"
        total-doses: 3
        dose-intervals-days: [0, 30, 150]
      MPOX:
        label-key: "vaccinations.type.mpox"
        total-doses: 2
        dose-intervals-days: [0, 28]
      HEPATITIS_A:
        label-key: "vaccinations.type.hepatitisA"
        total-doses: 2
        dose-intervals-days: [0, 180]

    testing-heuristics:
      high-activity-interval-days: 90
      moderate-activity-interval-days: 180
      high-activity-threshold: 3
      nudge-after-days: 180

    follow-up-rules:
      test-of-cure-days: 21
      window-period-default-days: 14
```

Adding a new vaccine or medication type = add lines to YAML. No code changes, no migration.

Frontend receives the catalog via `GET /api/catalog` (public endpoint).

---

## Backend Services

### MedicationService
- `create(jwt, request)` — Create medication + auto-generate linked reminder
- `update(jwt, id, request)` — Update medication, recalculate reminder
- `delete(jwt, id)` — Soft-deactivate medication + linked reminders
- `list(jwt)` — All medications (active first, then inactive)
- `logDose(jwt, medicationId, request)` — Log taken/missed dose
- `getAdherence(jwt, medicationId, month)` — Adherence stats (taken/total, percentage)

### VaccinationService
- `create(jwt, request)` — Log dose, auto-generate next-dose reminder if series incomplete
- `update(jwt, id, request)` — Edit dose record
- `delete(jwt, id)` — Remove dose, recalculate series + reminders
- `listSeries(jwt)` — Grouped by vaccine type with completion status

### ReminderService
- `list(jwt)` — All active reminders ordered by scheduled_for
- `getUpcoming(jwt, days)` — Due within N days
- `snooze(jwt, id, until)` — Snooze
- `complete(jwt, id)` — Mark done
- `toggle(jwt, id)` — Enable/disable
- `delete(jwt, id)` — Remove

### ReminderCalculationEngine
Analyzes journal + health-log data, generates/updates reminders using config thresholds:
- **Testing reminders**: Encounter count since last test → CDC heuristics from config
- **Follow-up reminders**: Positive result → test-of-cure schedule; unprotected encounter → window period nudge

### ReminderSchedulerJob
- `@Scheduled(cron = "0 0 6 * * *")` — daily at 6 AM
- Checks reminders table for due items
- Creates Notifications via existing NotificationService
- Respects quiet hours
- Advances repeating reminders to next occurrence

### New NotificationType values
- MEDICATION_REMINDER, VACCINATION_REMINDER, TESTING_REMINDER, FOLLOW_UP_REMINDER

---

## API Endpoints

### CatalogController — `GET /api/catalog`
Public. Returns medication types, vaccine series, frequencies.

### MedicationController — `/api/medications`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/medications` | List medications |
| POST | `/api/medications` | Create + auto-reminder |
| GET | `/api/medications/{id}` | Get with adherence |
| PUT | `/api/medications/{id}` | Update + recalculate |
| DELETE | `/api/medications/{id}` | Deactivate |
| POST | `/api/medications/{id}/log` | Log dose |
| GET | `/api/medications/{id}/adherence?month=` | Monthly adherence |

### VaccinationController — `/api/vaccinations`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/vaccinations` | List series |
| POST | `/api/vaccinations` | Log dose + auto-reminder |
| PUT | `/api/vaccinations/{id}` | Update dose |
| DELETE | `/api/vaccinations/{id}` | Remove dose |

### ReminderController — `/api/reminders`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reminders` | List active |
| GET | `/api/reminders/upcoming?days=7` | Due within N days |
| POST | `/api/reminders/{id}/snooze` | Snooze |
| POST | `/api/reminders/{id}/complete` | Complete |
| POST | `/api/reminders/{id}/toggle` | Toggle |
| DELETE | `/api/reminders/{id}` | Delete |

### ReminderSettingsController — `/api/reminders/settings`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reminders/settings` | Get preferences |
| PUT | `/api/reminders/settings` | Update preferences |

---

## Frontend Structure

### Page Rename
"Health Log" → "My Health" (route stays `/health-log` for URL stability).

### My Health Page Layout

```
┌─────────────────────────────┐
│  My Health                  │
├─────────────────────────────┤
│ ⏰ Upcoming                 │
│ ┌─────────┐ ┌─────────────┐│
│ │PrEP dose│ │Test due Mar8││
│ │ Today   │ │ in 5 days   ││
│ └─────────┘ └─────────────┘│
│                          ⚙ │
├─────────────────────────────┤
│ [Tests] [Meds] [Vaccines]  │
├─────────────────────────────┤
│  (active tab content)       │
└─────────────────────────────┘
```

- **Upcoming card**: Horizontally scrollable reminder chips. Tap → quick action (done/snooze). Gear → settings modal. Collapses if empty.
- **Tests tab**: Existing Health Log content (unchanged).
- **Medications tab**: Active medications with quick "Log Dose" button, adherence bar, past medications section.
- **Vaccines tab**: Series cards with visual dose progress (dots + connecting line), completion status.

### Medication Detail Page (`/health-log/medication/{id}`)
Full adherence calendar (monthly grid), dose history, edit medication.

### New Components (`/components/reminders/`)
- ReminderCard, UpcomingReminders, MedicationModal, MedicationCard, MedicationAdherenceChart, DoseLogButton, VaccinationModal, VaccinationSeriesCard, ReminderSettingsModal

### New Hooks (`/hooks/`)
- useReminders, useMedications, useVaccinations, useCatalog, useReminderSettings

### Partner Creation (Quick Win)
- CreatePartnerModal in `/components/journal/`
- "Add Partner" button in JournalPartnersTab
- Uses existing useCreatePartner() hook

### Dashboard Redesign
- Add "Next Up" widget showing nearest 2-3 reminders
- Broader redesign of Dashboard layout (details TBD during implementation)

### i18n
~80-100 new keys in en_US.json + es_MX.json.

---

## Testing Strategy

### Backend (~60-80 new tests)
- Unit: MedicationServiceTest, VaccinationServiceTest, ReminderServiceTest, ReminderCalculationEngineTest, HealthCatalogPropertiesTest
- Integration: MedicationControllerTest, VaccinationControllerTest, ReminderControllerTest, CatalogControllerTest, ReminderSettingsControllerTest

### Frontend (~40-50 new tests)
- Component tests for all new components
- Hook tests for mutations/queries
- Tab switching in expanded Health Log page

---

## Out of Scope
- Push notifications (Week 9 — PWA)
- Email digest sending (infrastructure only — toggle + day stored, sending in Week 9)
- E2E tests for scheduler
- Document upload (Week 9)
