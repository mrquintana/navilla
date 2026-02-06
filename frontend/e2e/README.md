# E2E Tests

Comprehensive Playwright test suite covering all MVP flows.

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

The Playwright config automatically starts a dev server on port 5174 with `VITE_E2E_MODE=true`, so no extra setup is needed.

## Test Files

| File | Coverage |
|------|----------|
| `auth.spec.ts` | Login, signup, logout, forgot password, protected routes |
| `connections.spec.ts` | Connections page, add connection form, sections |
| `health-status.spec.ts` | Health page, exposure overview, report form |
| `dashboard.spec.ts` | Dashboard cards, network size, threshold UX, navigation |
| `how-it-works.spec.ts` | All 8 content sections, navigation links |
| `account.spec.ts` | Delete account flow, confirmation modal |

## Test Users

| Key | Email | Connections | Use For |
|-----|-------|-------------|---------|
| `user1` | testuser1@navilla.app | 1 | Below privacy threshold |
| `user2` | testuser2@navilla.app | 3 | Meets threshold |
| `user7` | testuser7@navilla.app | 0 | New user |

Password for all: `TestPassword123!`
