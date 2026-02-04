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

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';

test('renders exposure count', () => {
  render(<ExposureCard exposures={mockExposures} />);
  expect(screen.getByText('2 potential exposures')).toBeInTheDocument();
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

:::info TODO
Unit tests for frontend components are not yet configured. The `npm test` script currently echoes a placeholder message.
:::

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
├── exposure.spec.ts    # Exposure calculations
├── fixtures/
│   └── test-users.ts   # Test user definitions
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

## Test Coverage Requirements

| Area | Minimum Coverage |
|------|------------------|
| Services | 80% |
| Controllers | 70% |
| Repositories | 60% |
| Frontend | 70% |
| E2E | Critical paths |
