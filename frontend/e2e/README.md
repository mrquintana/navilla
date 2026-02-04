# E2E Testing

This directory contains end-to-end tests using Playwright.

## Test Users

The E2E tests require 10 test users pre-seeded in the AWS environment. See `fixtures/test-users.ts` for details.

### User Network Graph

```
Primary Network:
  user1 <---> user2 <---> user3 <---> user4
                |
                v
              user5 <---> user6

Isolated:
  user7 (no connections)

Separate Network:
  user8 <---> user9

Pending Requests:
  user10 (has pending incoming requests)
```

### Setting Up Test Users

1. Create 10 users in Supabase Auth with these emails:
   - testuser1@navilla.app through testuser10@navilla.app
   - All with password: `TestPassword123!`

2. Create connections via API or SQL. Ensure to use the `user_a_hash` and `user_b_hash` values for the respective users:
   ```sql
   -- Example: Create confirmed connection between user1 and user2
   INSERT INTO connections (user_a_hash, user_b_hash, status, created_at)
   VALUES ('user1_hashed_email', 'user2_hashed_email', 'CONFIRMED', NOW());
   ```

3. Required connections:
   - user1 <-> user2 (CONFIRMED)
   - user2 <-> user3 (CONFIRMED)
   - user2 <-> user5 (CONFIRMED)
   - user3 <-> user4 (CONFIRMED)
   - user5 <-> user6 (CONFIRMED)
   - user8 <-> user9 (CONFIRMED)
   - Some pending requests to user10

## Running Tests

### Local Development

First, ensure the frontend is built:
```bash
cd frontend && npm run build
```

Then, run the E2E tests:
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts

# Run tests headed (see browser)
npx playwright test --headed
```

### Against AWS Environment
```bash
# Set the base URL to your AWS deployment
E2E_BASE_URL=https://navilla.app npm run test:e2e
```

### CI/CD
Tests run automatically on every PR. The CI workflow:
1. Builds the frontend
2. Serves it with `vite preview`
3. Runs Playwright tests
4. Uploads reports as artifacts

## Test Structure

```
e2e/
├── auth.spec.ts        # Authentication flows (login, signup, forgot password)
├── connections.spec.ts # Connection management (add, accept, deny, remove)
├── exposure.spec.ts    # Exposure calculations and health status
├── fixtures/
│   └── test-users.ts   # Test user definitions and expected states
├── helpers/
│   └── auth.ts         # Authentication helper functions
└── README.md           # This file
```

## Writing Tests

### Best Practices

1. **Use test users from fixtures** - Don't hardcode credentials
2. **Tests should be independent** - Each test should set up its own state
3. **Use semantic locators** - `getByRole`, `getByLabel`, `getByText`
4. **Support i18n** - Use regex patterns that match both EN and ES

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test('user can see their connections', async ({ page }) => {
  await login(page, 'user2');

  const connectionCard = page.locator('.card').filter({ hasText: /connections/i });
  await expect(connectionCard).toBeVisible();
});
```

## Test Coverage

### Implemented
- [x] Login page form and validation
- [x] Signup page form and validation
- [x] Forgot password flow
- [x] Protected routes redirect
- [x] Navigation between pages
- [x] Dashboard connection count display

### Pending (marked with test.skip)
- [ ] Connection management UI
- [ ] Accept/deny connection requests
- [ ] Exposure calculations (1st, 2nd, 3rd degree)
- [ ] Health status reporting
- [ ] Privacy verification (numbers not names)

Tests marked with `test.skip` will be enabled as the corresponding features are implemented.
