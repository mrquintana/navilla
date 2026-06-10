# Changelog

All notable changes to Navilla will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Journal `updateEntry` now hashes phones with the country-code-aware
  overload (matching `createEntry`); editing an entry no longer breaks
  phone auto-matching. `UpdateJournalEntryRequest` gained `countryCode`.
- Editing a journal entry no longer silently wipes its stored phone
  hash: a blank phone on update now means "unchanged" (the raw phone is
  never returned to clients, so the edit form cannot re-submit it).
- Service worker (`sw.js`) was cached for 1 year by the generic asset
  rule; the no-cache location now precedes it.
- SPA routes (e.g. `/dashboard`) were served without any security
  headers due to nginx `add_header` inheritance; headers now ship on
  every response class via a shared snippet.

### Security
- `partnerId` (journal entries) and `labId` (test visits) lookups are
  now ownership-scoped; foreign UUIDs read as 404 instead of copying or
  decrypting another user's partner alias / lab name.
- `/api/users/search` moved to the sensitive rate-limit tier (10/min)
  to slow account enumeration; introduced `SENSITIVE_READ_PATHS`.
- Removed wildcard `*.railway.app` CORS origin patterns from default
  and production profiles (staging-only now); pinned by
  `CorsConfigurationPolicyTest`.
- Frontend CSP tightened: `script-src 'self'` (dropped `unsafe-inline`
  and `unsafe-eval`), added `object-src 'none'`, `base-uri 'self'`,
  and HSTS (1 year, includeSubDomains) on the frontend domain.
- `npm audit fix`: react-router 7.17.0, i18next-http-backend, postcss,
  ws — clears all production-dependency advisories.

### Added
- Client error reporting: uncaught frontend errors and unhandled
  rejections POST to public `POST /api/public/client-errors`, which
  logs a sanitized WARN line (Loki-visible). Deduped, capped at 10 per
  session, disabled in dev/E2E.
- Lab-verify CTA on condition detail pages now hides itself when no
  lab providers are configured (production has none at launch) instead
  of opening a dead-end modal.

## [0.1.0] - 2026-04-16

First tagged pre-launch release. Closes the launch-readiness audit
(CRITICAL #1–#5, HIGH #6–#10) and wraps weeks 1–16 of the roadmap.

### Security
- Removed `DevTestController`, a temporary endpoint that allowed any
  authenticated user to send arbitrary emails through SendGrid.
- `EncryptionService` now refuses to start if `ENCRYPTION_PEPPER` is
  unset, shorter than 16 characters, or matches the previous insecure
  default `change-this-in-production`. The default value was removed
  from `application.yaml`.
- Dropped per-user identifiers (`emailHash`, `userHash`, `phoneHash`,
  `supabase_id`) from INFO-level logs in `UserService`,
  `ReciprocityService`, `PhoneMatchService`,
  `PhoneNotificationMatchService`, and `PushSubscriptionService`. The
  identifier-bearing log lines were moved to DEBUG.

### Added
- App-level `ErrorBoundary` wraps `QueryClientProvider` /
  `AuthProvider` / `ToastProvider` so unhandled render errors show a
  friendly fallback (reload + go-home + contact link) instead of a
  white screen.
- New disaster-recovery runbook
  (`docs/docs/operations/disaster-recovery.md`) with restore
  procedures, contacts, and a pre-launch checklist.
- 5 unit tests covering encryption-pepper validation
  (`EncryptionServiceTest`).
- 3 unit tests for `ErrorBoundary` (no error / error / contact link).

### Changed
- Frontend CI gates (`lint`, `type-check`, `test`) no longer have
  `continue-on-error: true`. Broken builds now block PR merges.
- Supabase client is created with explicit auth options
  (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`) so
  token refresh and session restoration are deterministic.
- Updated `docs/docs/development/deployment.md` with the complete
  list of Railway env vars actually consumed by the backend.
- Hikari connection pool capped at 5/1 in production. Soft-launch
  default; raise once we observe real traffic.

### Fixed
- 15 broken page tests (`JournalPage`, `HealthLogPage`, `ProfilePage`,
  `DashboardPage`) caused by missing hook mocks after recent
  refactors. Test suite is now 304/304 passing.
- Added missing `connections.requestQueued` translation in `es_MX.json`
  to keep locales in sync.
