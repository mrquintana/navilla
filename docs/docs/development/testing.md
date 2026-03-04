---
sidebar_position: 3
title: Testing
---

# Testing Guide

## Backend Testing

### Unit Tests

Spring Boot services and components are tested using JUnit 5 and Mockito.

:::info Illustrative Example
The following unit test example is for illustrative purposes to demonstrate testing concepts. It may not directly correspond to existing code in the codebase.
:::

```java
@Test
void shouldCalculateExposureForDirectConnection() {
    // Given
    var userHash = "user123";
    var connectionHash = "conn456";
    when(connectionRepo.findConfirmedConnections(userHash))
        .thenReturn(List.of(createConnection(userHash, connectionHash)));
    when(healthRepo.findByUserHash(connectionHash))
        .thenReturn(Optional.of(createPositiveStatus("hiv")));

    // When
    var exposure = exposureService.calculateExposure(userHash);

    // Then
    assertThat(exposure.getExposures()).hasSize(1);
    assertThat(exposure.getExposures().get(0).getDegree()).isEqualTo(1);
}
```

### Integration Tests

```java
@SpringBootTest
@Testcontainers
class ConnectionControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @Test
    void shouldCreateConnection() {
        // Test full flow with real database
    }
}
```

### Running Tests

```bash
# All tests
./mvnw test

# Specific test class
./mvnw test -Dtest=ConnectionServiceTest
```

:::note JaCoCo Coverage
JaCoCo is currently disabled due to Java 25 compatibility issues. Re-enable it in `pom.xml` when a compatible version is available.
:::

:::info TODO
Maven wrapper emits JDK warnings from bundled Guava (`sun.misc.Unsafe`). Consider updating the Maven wrapper distribution when a version removes these warnings.
:::

## Frontend Testing

Frontend uses:
- **Vitest** for unit/component tests
- **React Testing Library** for behavior-focused UI assertions
- **Playwright** for end-to-end flows

### Unit / Component Test Example

```typescript
import { render, screen } from '@testing-library/react';

test('renders exposure count', () => {
  render(<ExposureCard exposures={mockExposures} />);
  expect(screen.getByText('2 potential exposures')).toBeInTheDocument();
});
```

### Running Tests

```bash
# Unit tests (run once)
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Current Frontend Unit Test Scope

Current high-value unit tests cover:
- Shared loading primitives (`LoadingShell`)
- Route auth gating (`ProtectedRoute`)
- Dashboard loading and greeting stability
- Connections loading transitions (initial load vs refetch)
- Notifications loading transitions (initial load vs refetch)
- Health Status loading transitions
- Profile loading transitions
- Header auth navigation and unread badge behavior

## E2E Testing with Playwright

End-to-end tests run against the full application using Playwright.

### Setup

```bash
cd frontend
npm install -D @playwright/test
npx playwright install chromium
```

### Test Structure

```
frontend/e2e/
├── auth.spec.ts        # Authentication flows
├── connections.spec.ts # Connection management
├── dashboard.spec.ts   # Dashboard cards and network UX
├── health-status.spec.ts
├── account.spec.ts
├── how-it-works.spec.ts
├── fixtures/
│   └── ...             # Test fixtures
├── helpers/
│   └── auth.ts         # Authentication helpers
└── README.md           # E2E test documentation
```

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test('user can see dashboard after login', async ({ page }) => {
  await login(page, 'user1');
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/exposure/i)).toBeVisible();
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts

# Run headed (see browser)
npx playwright test --headed

# Run against AWS environment
E2E_BASE_URL=https://navilla.app npm run test:e2e
```

### Test Users

10 test users are pre-seeded in the AWS environment for E2E testing:

| User | Email | Role |
|------|-------|------|
| user1-6 | testuser[1-6]@navilla.app | Primary network |
| user7 | testuser7@navilla.app | Isolated (no connections) |
| user8-9 | testuser[8-9]@navilla.app | Separate network |
| user10 | testuser10@navilla.app | Has pending requests |

See `frontend/e2e/README.md` for network graph and test scenarios.

### CI Integration

E2E tests run automatically on every PR:

```yaml
# .github/workflows/ci.yml
e2e:
  name: E2E Tests
  runs-on: ubuntu-latest
  needs: [frontend]
  steps:
    - name: Install Playwright browsers
      run: npx playwright install chromium --with-deps
    - name: Run E2E tests
      run: npm run test:e2e
```

## API Testing with Postman

The Postman collection includes tests for all API endpoints.

### Running Postman Tests

```bash
# Using Newman CLI
npm install -g newman
newman run docs/static/postman/navilla-api.postman_collection.json \
  --env-var "baseUrl=http://localhost:8080" \
  --env-var "accessToken=your-jwt-token" # Obtain this token by logging in via Supabase and inspecting network requests.
```

### Collection Location

`docs/static/postman/navilla-api.postman_collection.json`

## Phase 3 Testing Guide (Week 10)

Phase 3 Week 10 introduces reciprocity, phone matching, DB-driven catalogs, and anti-abuse protections. This section covers how to test every feature end-to-end.

### Prerequisites

**1. Run migration 014:**

```sql
-- Copy contents of database/migrations/014_phase3_connections_config.sql
-- Paste into Supabase SQL Editor → Run
```

This creates 6 new tables (`condition_catalog`, `network_stages`, `app_config`, `connection_phone_entries`, `phone_blocks`, `phone_reports`) and alters `connections`, `encounter_journal`, and `users`.

**2. Verify seed data:**

```sql
SELECT count(*) FROM condition_catalog;  -- Should be 10
SELECT count(*) FROM app_config;         -- Should be 10
SELECT count(*) FROM network_stages;     -- Should be 6
```

**3. Deploy or run locally:**

```bash
# Local
cd backend && ./mvnw spring-boot:run &
cd frontend && npm run dev
```

---

### Feature 1: Reciprocity Opt-In/Out

Users must opt into the exposure network to see exposure data. The dashboard shows an opt-in card when not opted in.

**Manual test flow:**

1. Login → go to Dashboard
2. See `ReciprocityOptInCard` prompting to opt in
3. Click "Opt In" → card changes to "You're opted in" with a "Leave" option
4. Navigate to Health Status → exposure data should be visible (not blocked)
5. Go back to Dashboard → click "Leave" → confirm
6. Health Status should now show "You need to opt in" message
7. Try opting in again immediately → should see cooldown message (15-day default)

**API verification:**

```bash
# Check status
curl -H "Authorization: Bearer $TOKEN" https://api.navilla.app/api/reciprocity/status

# Opt in
curl -X POST -H "Authorization: Bearer $TOKEN" https://api.navilla.app/api/reciprocity/opt-in

# Opt out
curl -X POST -H "Authorization: Bearer $TOKEN" https://api.navilla.app/api/reciprocity/opt-out
```

**DB verification:**

```sql
SELECT exposure_opted_in, exposure_opted_in_at, exposure_opted_out_at
FROM users WHERE email = 'your-test-email';
```

**Configurable settings:**

| Key | Default | Description |
|-----|---------|-------------|
| `reciprocity.cooldown_days` | `15` | Days before re-opt-in after opt-out |
| `exposure.min_connections` | `3` | Minimum connections to see exposure data |

---

### Feature 2: Journal Phone Field

Journal entries now have an optional phone number field. When saved, the phone is hashed and stored for matching.

**Manual test flow:**

1. Login → Journal → click "New Entry"
2. Fill in date, alias, notes
3. Locate the phone input field (type=tel, maxLength=20)
4. Enter a phone number like `+52 614 235 1234`
5. Save → entry saves successfully
6. Edit the entry → phone field preserves the entered number

**DB verification:**

```sql
-- Check phone_hash was stored
SELECT id, phone_hash FROM encounter_journal WHERE phone_hash IS NOT NULL;

-- Check connection_phone_entries was created
SELECT * FROM connection_phone_entries ORDER BY created_at DESC;
```

---

### Feature 3: Phone Auto-Match

If User A logs an encounter with User B's phone **and** User B logs with User A's phone within ±2 days, a CONFIRMED connection is auto-created with type `PHONE_MATCH`.

**Manual test flow (two browser sessions):**

1. **Browser 1:** Login as user A, create journal entry for today with phone `+52 614 111 2222`
2. **Browser 2:** Login as user B, create journal entry for today with user A's phone number
3. Wait up to 5 minutes (PhoneMatchJob interval) or match is created immediately on mutual detection
4. **Both users:** Go to Connections → see a new confirmed connection

**DB verification:**

```sql
-- Check both phone entries matched
SELECT * FROM connection_phone_entries WHERE matched = true;

-- Check connection was created
SELECT * FROM connections WHERE connection_type = 'PHONE_MATCH' ORDER BY created_at DESC;
```

**Edge cases to test:**

| Scenario | Expected Result |
|----------|-----------------|
| Same day | Match ✓ |
| ±1 day | Match ✓ |
| ±2 days | Match ✓ (default window) |
| ±3 days | No match ✗ |
| One user has blocked the other's phone | No match ✗ |
| Connection already exists between users | No duplicate created |

**Configurable settings:**

| Key | Default | Description |
|-----|---------|-------------|
| `phone_match.window_days` | `2` | ±N days tolerance for date matching |
| `phone_match.max_attempts_per_week` | `5` | Rate limit per user per week |

---

### Feature 4: Phone Notification Match

If a user has `receive_match_notifications = true` and someone logs their phone, they get a notification asking "do you remember this person?"

**Manual test flow:**

1. Login as user B → enable "Receive match notifications" in notification settings
2. Login as user A → create journal entry with user B's phone number
3. User B receives notification showing partial phone `614235*****`
4. User B clicks "Yes, I remember" → connection created with type `NOTIFICATION_MATCH`
5. User B clicks "No" → no connection, denial tracked

:::caution Work in Progress
`PhoneNotificationMatchService.processOneSidedEntry()` has a TODO — the notification delivery path needs `phone_hash` on the users table to look up recipients. The mutual auto-match path (Feature 3) works fully. Confirmation/denial/block/report actions are implemented.
:::

---

### Feature 5: Catalog-Driven Conditions

The condition dropdown in TestVisitModal now pulls from the `condition_catalog` DB table instead of the hardcoded `ConditionType` enum.

**Manual test flow:**

1. Login → Health Log → click "Add Test Visit"
2. Condition checkboxes should show all 10 conditions from the catalog
3. Verify order matches `display_order` from the catalog
4. Select conditions, fill in results, save
5. Deactivate a condition in DB → refresh → condition disappears from dropdown

**API verification:**

```bash
# Public endpoint — no auth needed
curl https://api.navilla.app/api/catalog/conditions | jq '.[0]'
# Expected: { code, displayName, displayNameEs, description, displayOrder, icon }
```

**Admin test (dynamic catalog):**

```sql
-- Deactivate Trichomoniasis
UPDATE condition_catalog SET active = false WHERE code = 'TRICHOMONIASIS';
-- Refresh health log → Trichomoniasis disappears from dropdown

-- Re-enable
UPDATE condition_catalog SET active = true WHERE code = 'TRICHOMONIASIS';
```

---

### Feature 6: Network Stages

Network constellation stages are now DB-driven with configurable thresholds.

**API verification:**

```bash
curl https://api.navilla.app/api/catalog/stages | jq '.[] | {code, displayName, minNodes, maxNodes}'
```

**Expected stages:**

| Stage | Min Nodes | Max Nodes |
|-------|-----------|-----------|
| Empty Sky | 0 | 0 |
| Spark | 1 | 50 |
| Cluster | 51 | 500 |
| Constellation | 501 | 2,000 |
| Galaxy | 2,001 | 10,000 |
| Supercluster | 10,001 | ∞ |

**Dashboard verification:** Login → Dashboard shows network stage badge matching the user's node count.

---

### Feature 7: Anti-Abuse Protections

**Rate limiting test:**

1. Login as a test user
2. Create 5 journal entries with different phone numbers rapidly
3. The 6th should return HTTP 429 (Too Many Requests)
4. Wait for weekly window to reset, or update config:
   ```sql
   UPDATE app_config SET config_value = '10' WHERE config_key = 'phone_match.max_attempts_per_week';
   ```

**Block phone test:**

1. Receive a phone notification match
2. Click "Block" on the notification
3. That phone hash should never trigger matches again
4. Verify: `SELECT * FROM phone_blocks WHERE user_hash = '<your_hash>';`

**Report phone test:**

1. Click "Report" on a notification match, enter reason
2. Verify: `SELECT * FROM phone_reports ORDER BY created_at DESC;`
3. Reporting auto-blocks the phone

---

### Feature 8: App Config (Runtime Settings)

All configurable settings live in the `app_config` table and can be changed without redeployment.

**Verify all settings:**

```sql
SELECT config_key, config_value, description FROM app_config ORDER BY config_key;
```

**Test changing a setting:**

```sql
-- Change phone match window from 2 days to 1 day
UPDATE app_config SET config_value = '1' WHERE config_key = 'phone_match.window_days';
-- Test phone matching — should now require dates within ±1 day
-- Reset
UPDATE app_config SET config_value = '2' WHERE config_key = 'phone_match.window_days';
```

:::note Cache
AppConfig is cached. After updating a value via the `AppConfigService.set()` method, the cache is automatically evicted. Direct SQL updates may require a backend restart to pick up changes.
:::

---

### Automated E2E Test Coverage

The existing Playwright suite uses `VITE_E2E_MODE=true` (mock mode). For Phase 3, the following spec files should be added:

| Spec File | Tests |
|-----------|-------|
| `e2e/reciprocity.spec.ts` | Opt-in card renders, opt-in/out buttons, cooldown state |
| `e2e/journal-phone.spec.ts` | Phone field visible in journal modal, accepts input, maxLength |
| `e2e/catalog.spec.ts` | Condition checkboxes render from catalog, stages display |

For production integration testing (real API, not mocks):

```bash
# Run against production after deploying
E2E_BASE_URL=https://www.navilla.app npx playwright test --headed
```

## Test Coverage Requirements

| Area | Minimum Coverage |
|------|------------------|
| Services | 80% |
| Controllers | 70% |
| Repositories | 60% |
| Frontend | 70% |
| E2E | Critical paths |
