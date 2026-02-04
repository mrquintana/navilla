# E2E Smoke Tests

This is a minimal smoke suite meant to stay stable while the product evolves.

## Mode

The CI workflow sets `VITE_E2E_MODE=true`. In this mode, the frontend uses in-app mocks for auth and API calls so tests do not depend on Supabase or backend availability.

To run locally:

```bash
VITE_E2E_MODE=true npm run test:e2e
```

## Scope

These tests only verify:
- The app boots
- Signup step 1 renders and advances
- Login reaches the dashboard
- Logout works

Expand only when flows stabilize.
