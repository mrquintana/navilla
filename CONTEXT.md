# Navilla - Project Context & Decision Log

> Active project context. For full session history see `docs/session-archive.md`.
> For detailed feature specs see `docs/plans/full-roadmap.md`.

---

## Project Overview

**Navilla** is a privacy-preserving sexual health platform — "Your private sexual health companion."

- **Domain:** navilla.app
- **Core Principle:** "Numbers, not names" — users see statistics, never identities
- **Target market:** LGBTQ+ community in CDMX, then broader Mexico

---

## Tech Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | React 19 + Vite + TypeScript + TailwindCSS | ✅ Production |
| Backend | Java 25 + Spring Boot 4.0.2 + Maven | ✅ Production |
| Database | PostgreSQL (Supabase) | ✅ 17 migrations |
| Auth | Supabase Auth | ✅ Integrated |
| Email | SendGrid HTTP API v3 | ✅ Validated |
| Push | VAPID/RFC 8030 via jose4j | ✅ Working |
| PWA | vite-plugin-pwa + Workbox | ✅ Installable |
| Caching | Caffeine (4 named caches) | ✅ Active |
| Docs | Docusaurus (internal dev docs) | ✅ Maintained |
| Hosting | Railway (backend + frontend) | ✅ Deployed |

---

## Open Questions

| Question | Status | Resolution |
|----------|--------|------------|
| Degree limit for exposure calc? | Decided | 3 degrees for MVP |
| Connection deletion? | Decided | Soft-delete |
| Backend hosting? | Decided | Railway (AWS tried, Terraform kept for future) |
| Email provider? | Decided | SendGrid HTTP API (not SMTP — Railway blocks SMTP ports) |

---

## Key References

| What | Where |
|------|-------|
| Full roadmap + feature specs | `docs/plans/full-roadmap.md` |
| Roadmap summary (current status) | `ROADMAP_SUMMARY.md` |
| Session history archive | `docs/session-archive.md` |
| Design system + coding standards | `CLAUDE.md` |
| Project memory | `.claude/projects/.../memory/MEMORY.md` |
| Database migrations | `database/migrations/` (next: 018) |
| Plan docs | `docs/plans/` |

---

## Session Notes (2026-03-10 — Week 11: Exposure Recency Buckets + Verification Cards)

### What was done
- **Exposure Recency Buckets**: Changed binary recent/older to 4 buckets (0-30d, 31-90d, 91-365d, 365d+) with visual opacity de-emphasis
- **Migration 016**: `verification_cards` table with encrypted display names, share tokens, view tracking, expiry
- **Verification Card Backend**: Entity, repository, service (CRUD + public endpoint), controller at `/api/verification-cards` and `/api/public/cards/{shareToken}`
- **Verification Card Builder Page**: `/verification-card` with card list, create/edit modal, condition checkboxes, QR codes
- **Public Card View Page**: `/v/:shareToken` with indigo header, trust footer, expired state handling
- **QR Code**: `qrcode` package for real scannable SVG QR codes
- **Tests**: 429 backend + 17 new frontend tests pass

---

## Session Notes (2026-03-10 continued — Verification Card Redesign + Profile Refactor)

### What was done
- **Profile refactor**: firstName/lastName replacing displayName/fullName across entire stack (migration 017)
- **Verification card hardening**: Identity auto-resolved from profile (no free-text), lab-verified conditions only, HMAC verification endpoint
- **Anti-forgery public card**: Holographic shimmer CSS, animated gradient border, watermark overlay, live server verification badge (60s polling)
- 436 backend tests, 285 frontend tests passing

### Key decisions
- **No free-text names on cards** — identity always from profile firstName + lastName + @username
- **Lab-verified only** — self-reported conditions excluded from verification cards
- **showTestDates always true** — removed toggle
- **HMAC verification** — public cards call `/verify` endpoint on load + every 60s
- **Holographic CSS** — five visual anti-forgery layers

---

## Session Notes (2026-03-09 — Visit History List + Lab Review Improvements)

### Accomplished
- `ConfirmLabRequest` accepts optional `@Size(max = 5000) String notes`
- Visit History section on Health Log page (last 5 with "Show all")
- Lab review step: impact summary + notes textarea
- 397 backend tests passing

---

## Session Notes (2026-03-12 — Week 14: Network Health Stats + Layer 2 Polish)

### What was done
- **Network Health Stats**: New `GET /api/network-health` endpoint with `NetworkHealthService` — aggregated testing activity levels (High/Medium/Low/Unknown) based on % of connections tested in last 90 days. Privacy threshold: <3 connections = Unknown
- **Network Health UI**: Compact `NetworkHealthCard` on Dashboard + full `NetworkHealthSection` on Network page (testing activity, network coverage, exposure summary)
- **N+1 query fix**: Batch-fetch users in `ConnectionService` via `findByEmailHashIn()` — eliminates 100+ queries for users with many connections
- **Verification card fixes**: `@Size(max=50)` on conditions list, atomic view counting via `incrementViewsIfAllowed()`, i18n error message keys, shareToken length validation
- **CSS variables**: Replaced 9 hardcoded `rgba()` colors with `var(--color-primary-light-bg)`
- **Date locale**: Fixed `.toLocaleDateString()` calls in ConnectionsPage and HealthLogPage to use i18n locale
- **Accessibility**: Status indicator text label + sr-only on Dashboard, focus traps in delete modals
- **Mobile**: Icon-only quick actions on small screens, stacked verification card buttons, abbreviated profile segmented control
- **Empty states**: Icon + text pattern on ConnectionsPage and HealthLogPage
- **Cache**: Added `networkHealth` Caffeine cache (5min TTL, 500 max)
- **i18n**: ~25 new keys in en_US + es_MX for network health
- **Tests**: 471 backend (was 471, +14 new network health tests offset by test consolidation), frontend lint clean

### Key decisions
- Network health gated by reciprocity opt-in (same as exposure data)
- Testing activity uses qualitative labels only (High/Medium/Low) to prevent inference
- Privacy threshold: fewer than 3 connections = "Unknown" level

---

## Session Notes (2026-03-12 continued — Polish Fixes + Connections Pagination)

### What was done
- **Network page health cards**: Upgraded from plain white to `card-elevated` (indigo gradient overlay), matching constellation card
- **Missing locale**: Added `network.constellation` key in both en_US and es_MX
- **Pluralization fix**: Renamed `activeConditions_plural` → `activeConditions_one`/`activeConditions_other` (i18next v25 format)
- **Exposure summary readability**: Replaced yellow text on white with amber badge (dark text + tinted background)
- **Network coverage layout**: Changed from spread-out `justify-between` to compact number-first format
- **Dashboard cleanup**: Removed useless "You reported a positive status" self-status badge — card now purely shows network exposure data
- **Dashboard duplicate link**: Removed redundant "More" link (same destination as "View Health Status")
- **Connections pagination**: Server-side pagination for confirmed connections (page size 10)
  - Backend: `findConfirmedByUserHashPaged` repo query, `getConfirmedConnectionsPaged` service method, controller accepts `?page=0&size=10&search=`
  - Frontend: `PageResponse<T>` type, paginated React Query, page controls footer, search resets to page 1
- **Tests**: 476 backend (+5 new pagination tests), frontend lint clean

---

## Session Notes (2026-03-18 — Weeks 15-16: Launch Readiness Sprint)

### What was done
- **Rate Limiting**: Bucket4j token bucket filter with 3 tiers (write 30/min, read 120/min, sensitive 10/min) + IP fallback (300/min). Retry-After header support in backend + frontend
- **Resource Caps**: ResourceCapService with 9 configurable per-user limits (journal 10K, partners 500, visits 5K, labs 50, connections 500, templates 10, cards 20, reminders 50, medications 50). Wired into all service create methods
- **Validation Sweep**: SnoozeReminderRequest upgraded to OffsetDateTime with @Future. Quiet hours @Pattern(HH:mm). Request body 1MB max. Full DTO sweep — all string fields capped across 10 request DTOs
- **OWASP Review**: Enhanced CSP (font-src, style-src, connect-src, img-src). Referrer-Policy + Permissions-Policy headers. CORS cleanup (removed stale AWS IP). Dead spring.mail config removed. PII log audit — fixed 7 email/username leaks. IDOR audit — all clear
- **Abuse Detection**: Structured logging for rate limits + resource caps. Grafana/Loki alert documentation
- **Content Verification**: 4 treatment updates per CDC 2021 guidelines (chlamydia doxycycline first-line, syphilis removed tetracycline, trichomoniasis anatomy-specific dosing, mycoplasma doxycycline-first approach). All 10 STIs verified accurate
- **Mobile Polish**: Touch target fixes in 5 components (UpcomingReminders, NetworkHealthSection, Pagination, LabPicker, TestVisitModal)
- **E2E Tests**: 4 new spec files (verification cards, journal lifecycle, health log CRUD, reminders/notifications)
- **Performance**: Bundle 696KB/214KB gzip (no chunk >500KB gzip). All pages lazy-loaded. No large assets. TypeScript pagination type fixes
- **N+1 Query Fixes**: HealthLogService.getSummary() (2 N+1s → Map lookup), HealthLogService.getConditionHistory() (batch findAllById for visits + labs), InsightsService.buildTestingSummary() (Map lookup)
- **Tests**: 488 backend (was 476), frontend lint clean
- **i18n**: Rate limit + resource cap error keys in both en_US and es_MX

### Key decisions
- Rate limiting disabled in test context via `enabled` property to avoid interference with controller tests
- Resource caps share "medications" cap between medications and vaccinations
- CDC 2021 STI Treatment Guidelines used as authoritative source for content updates
- Remaining npm audit vulnerabilities (4 high) are all in build-time dependencies (vite/rollup/workbox), not runtime

---

## Session Notes (2026-04-16 — Pre-launch hardening)

### What was done
Comprehensive pre-launch audit across frontend, backend, DB, tests,
deployment. 5 CRITICAL items fixed, plus 4 HIGH items. Test count went
488→493 backend, 286→304 frontend (15 broken page tests fixed).

- **Security**: Removed `DevTestController` (allowed any logged-in user
  to abuse SendGrid). `EncryptionService` now fails-fast at startup if
  `ENCRYPTION_PEPPER` is missing, too short, or the placeholder default.
- **Resilience**: Added top-level `ErrorBoundary` so the app no longer
  white-screens on unhandled render errors.
- **CI**: Dropped `continue-on-error: true` from frontend lint /
  type-check / tests. CI is now actually a gate.
- **Tests**: Fixed 15 broken page tests (missing hook mocks from
  refactors — `useJournalEntriesPaginated`, `useReminderSettings`,
  `useReciprocity`, etc.). Suite is now fully green again.
- **Privacy logging**: Dropped per-user identifiers from INFO logs in
  `UserService`, `ReciprocityService`, `PhoneMatchService`,
  `PhoneNotificationMatchService`, `PushSubscriptionService`.
- **Auth**: Supabase `createClient` now sets `persistSession`,
  `autoRefreshToken`, `detectSessionInUrl` explicitly.
- **Locales**: Added missing `connections.requestQueued` Spanish key.
- **Docs**: New `docs/operations/disaster-recovery.md` runbook;
  rewrote env-vars section of `docs/development/deployment.md` to
  match what the backend actually reads.
- **CHANGELOG.md**: Created with `[Unreleased]` section for this work.

### Key decisions
- Hikari pool stays at 5/1 in production for soft launch. Raise after
  observing real traffic.
- `DevController` (the other dev endpoint, gated by `NAVILLA_DEV_MODE`)
  stays — used for ops troubleshooting; protected by env flag + auth.
- ErrorBoundary fallback uses hardcoded English because i18next may
  not be initialized when the boundary catches.

### Next session
- User does sanity check, then we tag + create GitHub release.

---

## Next Steps

| Priority | Item | Notes |
|----------|------|-------|
| **Next** | User sanity check | Verify the pre-launch hardening locally |
| **Then** | GitHub release | Tag v0.1.0 and publish release notes from CHANGELOG |
| **Then** | Week 17 | Soft launch — LGBTQ+ CDMX |
| **Then** | Weeks 18-20 | Iterate, content marketing, growth assessment |
