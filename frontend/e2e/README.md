# E2E Tests

Comprehensive Playwright test suite covering all MVP flows and Phase 3 features.

## Mode

The CI workflow sets `VITE_E2E_MODE=true`. In this mode, the frontend uses in-app mocks for auth and API calls so tests do not depend on Supabase or backend availability.

## Running Tests

Run all tests (headless):

```bash
npx playwright test
```

Run a specific test file:

```bash
npx playwright test e2e/auth.spec.ts
```

Run with the browser visible (headed mode):

```bash
npx playwright test --headed
```

Run in Playwright UI mode (interactive, with time-travel debugging):

```bash
npx playwright test --ui
```

View the HTML report from the last run:

```bash
npx playwright show-report
```

Run against production (real backend, real auth):

```bash
E2E_BASE_URL=https://www.navilla.app npx playwright test --headed
```

The Playwright config automatically starts a dev server on port 5174 with `VITE_E2E_MODE=true`, so no extra setup is needed for local development.

## Test Files

### MVP Specs

| File | Coverage |
|------|----------|
| `auth.spec.ts` | Login, signup, logout, forgot password, protected routes |
| `connections.spec.ts` | Connections page, add connection form, sections |
| `health-status.spec.ts` | Health page, exposure overview, report form |
| `dashboard.spec.ts` | Dashboard cards, network size, threshold UX, navigation |
| `how-it-works.spec.ts` | All 8 content sections, navigation links |
| `account.spec.ts` | Delete account flow, confirmation modal |

### Phase 3 Specs (Week 10+)

| File | Coverage | Status |
|------|----------|--------|
| `reciprocity.spec.ts` | Opt-in card, opt-in/out flow, cooldown state, exposure guard | Planned |
| `journal-phone.spec.ts` | Phone input field in journal modal, maxLength, tel type | Planned |
| `catalog.spec.ts` | Catalog-driven condition checkboxes, network stage badges | Planned |

### Integration / Seed Data

| File | Coverage |
|------|----------|
| `seed-data.spec.ts` | Creates realistic demo data (partners, journal entries, health log visits), screenshots |

## Test Users

| Key | Email | Connections | Use For |
|-----|-------|-------------|---------|
| `user1` | testuser1@navilla.app | 1 | Below privacy threshold |
| `user2` | testuser2@navilla.app | 3 | Meets threshold |
| `user7` | testuser7@navilla.app | 0 | New user |

Password for all: `TestPassword123!`

## Phase 3 Testing Guide

### Reciprocity Opt-In/Out

Test the exposure network reciprocity flow:

1. Login as any user → Dashboard shows `ReciprocityOptInCard`
2. Click "Opt In" → card changes to opted-in state
3. Navigate to Health Status → exposure data visible
4. Dashboard → click "Leave" → confirm opt-out
5. Health Status shows "opt-in required" message
6. Try re-opting in → cooldown message (15 days default)

### Journal Phone Field

Test the phone number input on journal entries:

1. Login → Journal → "New Entry"
2. Phone input field is visible (type=tel, maxLength=20)
3. Enter phone number → Save → entry persists
4. Edit entry → phone number preserved

### Phone Auto-Match

Test mutual phone matching (requires two browser sessions):

1. Browser 1: User A creates journal entry with User B's phone
2. Browser 2: User B creates journal entry with User A's phone (same day ±2 days)
3. Both users see a new confirmed connection (type: PHONE_MATCH)

### Catalog-Driven Conditions

Test DB-driven condition selector:

1. Login → Health Log → "Add Test Visit"
2. Condition checkboxes load from `/api/catalog/conditions`
3. All 10 conditions visible in display_order
4. Deactivating a condition in DB removes it from the dropdown

### Network Stage Badges

Test constellation stage display:

1. Login → Dashboard shows network stage badge
2. Stage matches user's total node count against `network_stages` thresholds

### Anti-Abuse

Test rate limiting and phone blocking:

1. Create 5+ journal entries with phone numbers → 6th returns rate limit error
2. Block a phone from notification match → no future matches from that phone
3. Report a phone → auto-blocks + creates abuse report

## Database Prerequisites (Phase 3)

Before testing Phase 3 features against a real backend, run migration 014:

```sql
-- Copy database/migrations/014_phase3_connections_config.sql
-- Paste into Supabase SQL Editor → Run
```

Verify seed data:

```sql
SELECT count(*) FROM condition_catalog;  -- 10
SELECT count(*) FROM app_config;         -- 10
SELECT count(*) FROM network_stages;     -- 6
```
