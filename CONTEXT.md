# Navilla - Project Context & Decision Log

> This file tracks all development progress, decisions, and context for the Navilla project.
> Updated continuously as work progresses.

---

## Project Overview

**Navilla** is a privacy-preserving sexual health platform that helps users understand their potential STI exposure through an anonymized connection network.

- **Domain:** navilla.app
- **Core Principle:** "Numbers, not names" - users see statistics, never identities

---

## Tech Stack (Decided)

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | React + Vite + TypeScript + TailwindCSS | ✅ Scaffolded |
| Backend | Java 25 + Spring Boot 4.0.2 + Maven | ✅ Scaffolded |
| Database | PostgreSQL (Supabase) | ✅ Migrations ready |
| Auth | Supabase Auth | ✅ Frontend integrated |
| Docs | Docusaurus | ✅ Maintained |
| Hosting | Vercel (FE + Docs), TBD (BE) | Docs ready |

---

## Decision Log

### 2026-01-30: Project Initialization

**Decision:** Use Docusaurus for documentation
- **Why:** React-based (matches frontend), free hosting on GitHub Pages/Vercel, supports Mermaid diagrams, built-in search, versioning support
- **Alternatives considered:** Confluence (paid), Notion (limited export), MkDocs (Python-based, less React integration)
- **Status:** ✅ Implemented

**Decision:** Create CONTEXT.md for session continuity
- **Why:** Track all decisions, progress, and reasoning across development sessions
- **Format:** Single markdown file with dated entries, decision rationale, and status tracking
- **Status:** ✅ Implemented

**Decision:** Use Maven over Gradle for backend build
- **Why:** User preference, historically fewer issues, better IDE support
- **Status:** ✅ Implemented

**Decision:** Use Java 25 + Spring Boot 4.0.2
- **Why:** Latest LTS Java, latest Spring Boot for modern features
- **Status:** ✅ Implemented

**Decision:** Use Google Java Style with Checkstyle
- **Why:** Industry standard, well documented, enforces consistency
- **Config:** `backend/checkstyle/google_checks.xml`
- **Status:** ✅ Implemented

---

## Progress Tracker

### Phase 1: Foundation
- [x] Project directory created
- [x] Context tracking file created (CONTEXT.md)
- [x] Git repository initialized
- [x] Docusaurus documentation site setup
- [x] Documentation structure created (30+ docs)
- [x] ADRs documented
- [x] Database migrations created (SQL files)
- [x] Supabase setup guide created
- [x] Spring Boot project scaffolded (Maven, Java 25)
- [x] React + Vite + TypeScript project scaffolded
- [x] TailwindCSS configured
- [x] Startup scripts created (prod/dev/troubleshoot)
- [x] Supabase project setup (migrations run)
- [x] Security configuration (JWT, CORS, encryption)
- [x] GitHub Actions CI/CD workflows
- [x] Docker configuration (multi-stage builds)
- [x] Security scanning (Gitleaks, OWASP, CodeQL)
- [x] i18n infrastructure (frontend: react-i18next, backend: MessageSource)
- [x] README.md and CONTRIBUTING.md created

### Phase 2: Core Features
- [x] User Entity & API (backend) - GitHub Issue #4
- [x] User registration/login (frontend) - Auth system implemented
- [x] Connection request system - Full API with tests and docs
- [x] Health status reporting
- [x] Basic exposure calculation
- [x] Multi-degree exposure calculation (BFS, up to 5 degrees)

### Phase 3: MVP Launch Readiness
- [x] How It Works page (8 sections from ADR-008 user-facing disclosure)
- [x] Account deletion UI (GDPR/CCPA - type DELETE to confirm)
- [x] Dashboard threshold UX (progress bar, "X of 3 needed" message)
- [x] Comprehensive E2E test suite (auth, connections, health, dashboard, how-it-works, account)
- [ ] Landing page polish (deferred — functional but not blocking)
- [ ] Notification improvements (polling added, more features post-MVP)

### Phase 3: Layer 2 — Network Enhancements
- [x] Week 10: DB-driven condition catalog (replacing ConditionType enum)
- [x] Week 10: Runtime app config (AppConfig key-value store)
- [x] Week 10: Network stage thresholds (configurable via DB)
- [x] Week 10: Reciprocity opt-in/opt-out system (15-day cooldown)
- [x] Week 10: Phone matching service (SHA-256 hashing, mutual match detection)
- [x] Week 10: ConnectionType enum (PHONE_MATCH, NOTIFICATION_MATCH, EXPLICIT, LINK)
- [x] Week 10: Catalog API endpoints (GET /api/catalog/conditions, GET /api/catalog/stages)
- [x] Week 10: Reciprocity API (GET status, POST opt-in, POST opt-out)
- [x] Week 10: Frontend reciprocity opt-in card + dashboard integration
- [x] Week 10: Frontend phone field in journal entries + catalog-driven dropdowns
- [x] Week 10: Network Constellation Visualization (pluggable engine + Canvas 2D + share card)
- [x] Week 10: Profile page consolidation (Settings → Preferences, segmented visibility control)
- [x] Week 11: Verified test badges / Exposure recency buckets
- [ ] Week 12: Vault + app lock + notification privacy
- [ ] Week 13: Data retention + connection staleness
- [ ] Week 14: Network health stats + Layer 2 polish

### Phase 4-6: Post-MVP
- [ ] Temporal edges for exposure relevance
- [ ] Verified test results
- [ ] Spanish locale completion

---

## Project Structure

A detailed breakdown of the project's directory layout and key files can be found in the [Codebase Tour](docs/docs/onboarding/codebase-tour.md) documentation.

---

## Open Questions & Resolutions

| Question | Status | Resolution |
|----------|--------|------------|
| Degree limit for exposure calc? | Decided | 3 degrees for MVP |
| Connection deletion affects partner's graph? | Decided | Soft-delete (user removes from view, partner keeps history) |
| STI clearing removes past alerts? | Decided | "Resolved" status (alerts remain but marked resolved) |
| Email hashing algorithm? | Decided | SHA-256 with pepper for lookups |
| Backend hosting? | Decided | Railway for MVP (AWS/EC2 was tried first; see ADR-010). Terraform infra destroyed — `.tf` files kept for future AWS return. |
| Email provider? | Decided | SendGrid (SMTP for Supabase Auth) |

---

## Architecture Decisions Records (ADRs)

### ADR-001: Documentation Platform

---

## Session Notes (2026-03-10 — Week 11: Exposure Recency Buckets + Verification Cards)

### What was done
- **Exposure Recency Buckets**: Changed binary recent/older timeframes to 4 buckets (0-30d, 31-90d, 91-365d, 365d+) with visual opacity de-emphasis on Dashboard, HealthLog, and HealthStatus pages
- **Migration 016**: `verification_cards` table with encrypted display names, share tokens, view tracking, expiry
- **Verification Card Backend**: Entity, repository, service (CRUD + public endpoint), controller at `/api/verification-cards` and `/api/public/cards/{shareToken}`
- **Verification Card Builder Page**: `/verification-card` with card list, create/edit modal, condition checkboxes, view limits, expiry, QR code display, copy/share actions
- **Public Card View Page**: `/v/:shareToken` with indigo header, trust footer, expired state handling, verification badges
- **QR Code**: Installed `qrcode` package for real scannable SVG QR codes
- **Navigation**: Added "Verification" link with ShieldCheck icon to header
- **Tests**: 8 recency bucket boundary tests, 17 VerificationCardService unit tests, 7 controller integration tests, 11 card builder tests, 6 public card view tests — 429 backend + 17 new frontend tests pass
- **i18n**: Full en_US + es_MX locale coverage for all new features

### Key files created
- `database/migrations/016_verification_cards.sql`
- `backend/.../entity/VerificationCard.java`, `repository/VerificationCardRepository.java`
- `backend/.../service/VerificationCardService.java`, `controller/VerificationCardController.java`
- `backend/.../dto/Create|Update|VerificationCardResponse.java`, `PublicVerificationCardResponse.java`
- `frontend/src/pages/VerificationCardPage.tsx`, `PublicVerificationCardPage.tsx`
- `frontend/src/hooks/useVerificationCards.ts`

### Next Steps
- Week 12: Check `UPCOMING_FEATURES_AND_ROADMAP.md` for next milestone

## Session Notes (2026-03-10 continued — Verification Card Redesign + Profile Refactor)

### What was done
- **Profile refactor**: Replaced displayName/fullName with firstName/lastName across entire stack (migration 017, entity, DTOs, services, frontend)
- **Verification card hardening**: Identity auto-resolved from profile (no free-text), lab-verified conditions only (verified=true + testDate required), HMAC verification endpoint, showTestDates always true
- **Card builder redesign**: Read-only identity display, verified-only condition picker, profile-incomplete guard blocks card creation
- **Anti-forgery public card**: Holographic shimmer CSS, animated gradient border, watermark overlay, live server verification badge (60s polling), mouse-tracking effects
- **Nav bar**: Added verification card link to header navigation
- Migration 017: first_name_encrypted, last_name_encrypted replacing display_name_encrypted, full_name_encrypted, display_name_public dropped
- 436 backend tests, 285 frontend tests passing
- Next migration: 018

### Key decisions
- **No free-text names on cards** — identity always auto-resolved from profile firstName + lastName + @username
- **Lab-verified only** — self-reported conditions excluded from verification cards entirely
- **showTestDates always true** — removed toggle, test dates are always shown for trust
- **HMAC verification** — public cards call `/verify` endpoint on load + every 60s, returns cryptographic signature
- **Holographic CSS** — five visual anti-forgery layers make screenshots immediately distinguishable from live cards

## Session Notes (2026-03-09 — Visit History List + Lab Review Improvements)

### Accomplished

**Backend — Lab confirm notes (1 commit, 4 files):**
- ✅ `ConfirmLabRequest` now accepts optional `@Size(max = 5000) String notes`
- ✅ `LabVerificationService.confirm()` encrypts and saves notes on the visit (uses existing `notes_encrypted` column)
- ✅ Controller passes notes through to service
- ✅ 397 backend tests passing (1 new test for blank notes)

**Frontend — Visit History + Review enhancements (3 commits, 5 files):**
- ✅ **Visit History section** on Health Log page, positioned below stats bar
  - Uses existing `useHealthLogVisits()` hook (was unused)
  - Reverse chronological cards: date, lab name, result count badge, verified checkmark, edit button
  - Shows last 5 with "Show all" expandable toggle
  - Edit button opens TestVisitModal in edit mode
- ✅ **Lab review step enhanced** — "What will change" impact summary (indigo-tinted box showing per-condition status updates) + notes textarea
- ✅ `LabConfirmRequest` type updated with optional `notes`
- ✅ 7 new i18n keys in both en_US and es_MX
- ✅ Fixed `toLocaleDateString()` crash — `en_US` → `en-US` (BCP 47 format)

### Next Steps
- [ ] Run migration 015 on Supabase (carried over)
- [ ] Test verification flow end-to-end with dev mode enabled
- [ ] Begin Chopo/Salud Digna partnership analysis
- [ ] Implement recency buckets once verified data flows through

---

## Session Notes (2026-03-05 — Lab Integration Framework)

### Accomplished

**Lab Integration Framework (41 files, 2496 insertions):**
- ✅ **Pluggable LabProvider interface** — `app.navilla.lab.LabProvider` with `getProviderCode()`, `validateInput()`, `verify()`. Same strategy pattern as visualization engine
- ✅ **LabProviderRegistry** — Spring auto-discovers all `@Component` LabProvider implementations, routes by provider code
- ✅ **LabVerificationService** — two-step flow: `verify()` calls lab API (no DB writes), `confirm()` saves results + syncs health_status
- ✅ **MockDemoMxProvider** — mock lab with orderId + patientId, returns 4 conditions (deterministic results)
- ✅ **MockExpressProvider** — mock lab with orderId only, returns 2 conditions
- ✅ **MockLabController** — dev-only endpoints at `/api/dev/mock-labs/` simulating external lab APIs
- ✅ **LabProviderController** — `GET /api/labs/providers`, `POST /api/labs/verify`, `POST /api/labs/confirm`
- ✅ **Configuration** — `application.yml` lab provider config with required fields per lab
- ✅ **Migration 015** — `raw_lab_response_encrypted` column on test_visits, widened labs.provider to varchar(50)
- ✅ **Lab.provider refactored** — from enum (`LabProvider.CHOPO`) to plain String for pluggable architecture
- ✅ **Frontend** — types, API hooks (`useLabProviders`, `useLabVerify`, `useLabConfirm`), LabVerificationModal (3-step: select lab → credentials → review results)
- ✅ **i18n** — 20 locale keys in both en_US and es_MX
- ✅ **Documentation** — `docs/docs/architecture/lab-integration.md` + `docs/docs/api/lab-verification.md`
- ✅ **395 backend tests passing** (26 new tests)

**Decisions:**
- Exposure Recency Buckets **deferred** — no value without verified lab data
- Lab integration framework built now so real Chopo/Salud Digna integration = one class + one YAML entry
- No separate ResultParser interface — each provider owns its own parsing (every lab's response format is different)

### Next Steps
- [ ] Run migration 015 on Supabase
- [ ] Test verification flow end-to-end with dev mode enabled
- [ ] Begin Chopo/Salud Digna partnership analysis
- [ ] Implement recency buckets once verified data flows through

---

## Session Notes (2026-03-04 — Week 10 Phase 3: Network Constellation + Profile Polish)

### Accomplished

**Network Constellation Visualization (16 files, 1279 insertions):**
- ✅ **Pluggable visualization engine** — `VisualizationEngine` interface in `lib/visualization/types.ts` decouples rendering from app code. Entire engine replaceable by implementing interface + changing one import in `index.ts`
- ✅ **Canvas 2D engine** — `Canvas2DEngine.ts` (~440 lines): seeded PRNG for deterministic star positions, 3-layer rendering (1st/2nd/3rd degree at different radii/brightness), constellation lines, twinkle animation, deep space gradient background, stardust particles. PNG export at 1080×1920 with Fraunces + Plus Jakarta Sans overlays
- ✅ **useNetworkVisualization hook** — composes `/api/exposures` + `/api/catalog/stages` into `NetworkData`, resolves stage client-side, i18n-aware (`displayNameEs` when language starts with 'es')
- ✅ **NetworkVisualizationHost** — React wrapper bridging imperative engine to declarative lifecycle
- ✅ **ShareConstellationModal** — identity picker (Display name, @Username, Full name, Anonymous) with disabled options for empty profile fields. Web Share API with download fallback
- ✅ **NetworkPage** — full-screen immersive dark page, reciprocity gate, overlay UI (stage badge, stats, share button), cold start message for 0 nodes
- ✅ **Dashboard preview card** — 200px tall canvas preview with stage badge + "View constellation" link
- ✅ **Navigation** — "Network" link (Sparkles icon) in header nav between Insights and Notifications
- ✅ **Routing** — `/network` lazy-loaded ProtectedRoute
- ✅ **i18n** — 14 locale keys in both en_US and es_MX
- ✅ **Docusaurus** — `docs/docs/frontend/visualization-engine.md` documenting the pluggable engine contract
- ✅ **Engine README** — `engines/canvas2d/README.md` documenting internals

**Profile Page Consolidation:**
- ✅ Moved Language switcher from Settings → Preferences (with Globe icon)
- ✅ Removed old Settings card entirely
- ✅ Sign Out button placed between Preferences and Danger Zone
- ✅ Moved Profile Visibility + Search Visibility from About You → Preferences
- ✅ Replaced plain `<select>` with segmented control (`.segmented-control` CSS) for visibility
- ✅ Removed redundant Match Notifications "Coming soon" row
- ✅ Header initials avatar CSS completed (`.nav-avatar-initials`)

**Decisions:**
- Verified Test Badges **deferred** — needs 1-2 weeks of lab website analysis (Chopo, Salud Digna) before implementation
- Share card uses **profile fields only** (no free text) — card is a credibility artifact, must show verified data
- Pluggable engine = **full replacement** (technology, algorithm, style), not just skin swap

**Nice-to-have / Future consideration:**
- **Journal partners in constellation** — optional toggle to include encounter journal partners as a distinct visual layer (amber-toned stars, no constellation lines). Personal view only — share card and stage progression remain network-only to preserve credibility. Prevents empty-sky discouragement for users who track encounters but haven't connected via the network yet

### Key Commits
- `8446ad6` feat: implement Canvas2D visualization engine
- `ff90a46` feat: add useNetworkVisualization hook
- `36f0709` feat: add NetworkVisualizationHost wrapper component
- `25832b6` feat: add ShareConstellationModal with identity picker and export
- `9f92c6e` feat: add immersive /network page with constellation visualization
- `7770cf3` feat: add constellation preview card to dashboard
- `63c14b4` feat: add /network route, nav link, and i18n keys
- `03eea09` docs: add Visualization Engine guide to Docusaurus
- `6313cea` merge: Network Constellation Visualization feature

### Next Steps
- [ ] Shareable Connection Links (growth engine)
- [ ] Exposure Recency Buckets
- [ ] Vault + App Lock
- [ ] Data Retention + Connection Staleness
- [ ] Cold Start / Estimated Network

---

## Session Notes (2026-03-04 — Week 10 Phase 3: Network Foundation — Reciprocity, Catalog, Phone Matching)

- ✅ **Migration 014** — `014_network_foundation.sql`: 6 new tables (`condition_catalog`, `network_stages`, `app_config`, `connection_phone_entries`, `phone_blocks`, `phone_reports`) + 3 ALTER TABLE (users: `receive_match_notifications`, `exposure_opted_in`, `exposure_opted_in_at`, `exposure_opted_out_at`; connections: `connection_type`; encounter_journal: `phone_hash_encrypted`)
- ✅ **DB-driven condition catalog** — `ConditionCatalogEntry` entity + `ConditionCatalogService` replacing hardcoded `ConditionType` enum. All services now use `String` + catalog validation instead of Java enum references. Public API: `GET /api/catalog/conditions`, `GET /api/catalog/stages`
- ✅ **Runtime configuration** — `AppConfig` entity + `AppConfigService` for key-value runtime config (e.g., reciprocity cooldown days, phone match window days). No redeployment needed to change thresholds
- ✅ **Network stages** — `NetworkStage` entity + service for configurable constellation stage thresholds (replacing hardcoded constants)
- ✅ **Reciprocity system** — `ReciprocityService` + `ReciprocityController`: opt-in/opt-out with 15-day configurable cooldown. `GET /api/reciprocity/status`, `POST /api/reciprocity/opt-in`, `POST /api/reciprocity/opt-out`. `ExposureService` now guards with reciprocity check — only opted-in users see exposure data
- ✅ **Phone matching** — `ConnectionPhoneEntry`, `PhoneBlock`, `PhoneReport` entities. `PhoneMatchService`: phone hashing (SHA-256 + pepper), `registerPhoneEntry` with rate limiting, mutual match detection within configurable date window. `PhoneMatchJob`: scheduled background job for processing unmatched entries. `PhoneNotificationMatchService`: confirm/deny/block/report phone matches
- ✅ **ConnectionType enum** — `PHONE_MATCH`, `NOTIFICATION_MATCH`, `EXPLICIT`, `LINK` on `Connection` entity for tracking how connections were established
- ✅ **Journal phone field** — Phone hash + `PhoneMatchService` integration in encounter journal entries
- ✅ **New exceptions** — `RateLimitException` (429), `CooldownActiveException` (403) for reciprocity cooldown enforcement
- ✅ **Frontend: Reciprocity** — API client + `useReciprocityStatus`, `useOptIn`, `useOptOut` hooks. `ReciprocityOptInCard` component (3 states: not opted in, cooldown, opted in). DashboardPage shows opt-in card when not opted in
- ✅ **Frontend: Phone matching** — API client + `usePendingPhoneMatches`, `useConfirmPhoneMatch`, `useDenyPhoneMatch`, `useBlockPhoneNumber` hooks. Phone field (type=tel, maxLength=20) in `JournalEntryModal`
- ✅ **Frontend: Catalog-driven UI** — `useConditionCatalog`, `useNetworkStages` hooks. `TestVisitModal` condition dropdown now catalog-driven (with hardcoded fallback)
- ✅ i18n: ~20 new keys in en_US + es_MX (reciprocity, phone matching, catalog)
- ✅ Full test suite: **370 backend tests passing** (was 299), frontend lint + build clean
- **Branch:** `feature/phase3-week10`
- **Design docs:** `docs/plans/2026-03-04-phase3-redesign-design.md`, `docs/plans/2026-03-04-phase3-implementation.md`
- **Needs manual action:** Run migration `014_network_foundation.sql` on Supabase
- **Key architecture decisions:**
  - DB-driven catalog instead of Java enums — conditions, stages, and config are all database-managed for runtime flexibility
  - Reciprocity cooldown is configurable via `app_config` table (default 15 days) — no redeployment needed
  - Phone matching uses SHA-256 + application pepper for hashing — phones are never stored in plaintext
  - Phone match job runs on schedule to detect mutual matches asynchronously
  - ConnectionType enum tracks provenance of every connection (phone match, notification match, explicit, link)
- **Next:** Week 11 (Verified Test Badges / Exposure Recency Buckets)

---

## Session Notes (2026-03-04 — Week 9 Continued: Email Delivery Validation)

- ✅ **Email delivery validated end-to-end** — Test email sent and received via SendGrid HTTP API on Railway
- ✅ **SMTP → SendGrid HTTP API migration** — Railway blocks ALL outbound SMTP ports (587, 2525, 465). Rewrote `EmailService` to use `HttpClient` + SendGrid v3 REST API over HTTPS (port 443). Removed `spring-boot-starter-mail` dependency on SMTP
- ✅ **EmailProperties updated** — Added `sendgridApiKey` field for HTTP API auth (replaces SMTP password)
- ✅ **DevTestController** — Kept as permanent dev tool (`/api/dev/email-status`, `/api/dev/test-email`), JWT-protected, uses direct SendGrid HTTP API for clear error reporting
- ✅ **Email template fix** — "Manage notification preferences" link changed from nonexistent `/settings` to `/notifications`
- ✅ **Docusaurus updated** — 3 new docs (push-notifications, caching, pwa), 5 updated docs
- ✅ **Sender address corrected** — `no-reply@navilla.app` (with hyphen), not `noreply@navilla.app`
- ✅ 299 backend tests passing
- **Railway env vars set:** `SENDGRID_API_KEY`, `EMAIL_ENABLED=true`
- **Key lesson:** Railway blocks all outbound SMTP ports — always use HTTP APIs for email on Railway

---

## Session Notes (2026-03-03 — Week 9: PWA + Push Notifications + Caching + Email)

- ✅ **Caffeine cache setup** — `@EnableCaching` with 4 named caches: catalog (1hr), healthLogSummary (5min), insights (5min), prepStreak (10min). `@Cacheable` on read paths, `@CacheEvict` on write paths
- ✅ **Push subscription backend** — Migration `013_push_subscriptions.sql`, `PushSubscription` entity with AES-256-GCM encrypted endpoint/p256dh/auth, CRUD controller at `/api/push/*`
- ✅ **Web Push service (VAPID/RFC 8030)** — jose4j for JWT signing (Java 25 compatible), `WebPushService` sends fire-and-forget push via HttpClient, handles 404/410 stale subscription cleanup
- ✅ **Email infrastructure** — SendGrid HTTP API v3, Thymeleaf email templates (en/es), `EmailService` with fire-and-forget delivery, configurable `navilla.email.enabled` flag
- ✅ **Email digest job** — `@Scheduled` daily at batch-hour, sends weekly digest with PrEP adherence, testing status, upcoming reminders, vaccine due dates. Day-of-week filtering per user settings
- ✅ **Push wired into notification system** — `NotificationService.createNotification()` sends push after persisting notification. Single push point (no duplication). Maps all 10 NotificationType values to click URLs
- ✅ **PWA manifest + icons** — vite-plugin-pwa with `injectManifest` strategy, manifest.webmanifest (theme_color #4f46e5, standalone display), Apple meta tags, generated icons (192/512/512-maskable)
- ✅ **Custom service worker** — Workbox precaching (66 entries) + runtime caching: API (NetworkFirst 10s), Catalog (StaleWhileRevalidate 1hr), Google Fonts (CacheFirst 1yr), Images (CacheFirst 30d)
- ✅ **Install prompt + offline indicator** — PWA install banner with 7-day dismiss, offline amber top bar, update prompt (SKIP_WAITING flow)
- ✅ **Push subscription frontend** — `usePushNotifications` hook, `pushNotifications.ts` utility (urlBase64ToUint8Array, subscribe/unsubscribe), push API in `api.ts`
- ✅ **SW push handler** — `push` event shows notification with icon/badge/tag, `notificationclick` focuses existing window or opens new
- ✅ **Push toggle in settings UI** — Toggle in ReminderSettingsModal, permission-denied warning with BellOff icon
- ✅ **nginx.conf updated** — CSP: added `worker-src 'self'`, `manifest-src 'self'`. No-cache rules for sw.js and manifest.webmanifest
- ✅ **Postman collection updated** — Push Notifications folder (4 endpoints: VAPID key, subscribe, list, unsubscribe)
- ✅ i18n: ~15 new keys in en_US + es_MX (pwa.*, reminders.push*, notifications.*)
- ✅ Full test suite: 299 backend tests passing, frontend lint + build:full clean
- **Branch:** `feature/week9-pwa-push-notifications` (merged to develop)
- **Needs manual action:** Run migration `013_push_subscriptions.sql` on Supabase
- **Railway env vars needed:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `SENDGRID_API_KEY`, `EMAIL_ENABLED`
- **Key architecture decisions:**
  - jose4j instead of webpush-java (Java 25 compatibility)
  - Push sending centralized in NotificationService (not scattered across schedulers)
  - injectManifest strategy for custom service worker (more control than generateSW)
  - Email delivery uses SendGrid HTTP API v3 (not SMTP — Railway blocks all SMTP ports)
  - Email digest is fire-and-forget with `enabled=false` as safe default

---

## Session Notes (2026-03-03 — Week 8: Personal Insights + Onboarding + Quick Wins)

- ✅ **Toast notification system** — global `ToastContext` + `ToastContainer` with auto-dismiss (4s), slide-in animation, `prefers-reduced-motion` support, `aria-live="polite"` accessibility
- ✅ **Route-level code splitting** — all 31 page components converted to `React.lazy()` with `<Suspense>` wrappers. Build produces 58 JS chunks (down from monolithic bundle)
- ✅ **Encounter type + protection fields** — Migration `012_encounter_fields.sql` adds encrypted BYTEA columns. Backend: new DTO fields, service encryption, catalog endpoint with 5 encounter types + 7 protection methods. Frontend: multi-select chip UI in JournalEntryModal, badges in JournalEntryCard
- ✅ **Personal Insights API** — `InsightsService` aggregates data from 7 repositories. `InsightsController` at `GET /api/insights`. Response: ActivitySummary (encounters/month, protection rate, type/method breakdowns), TestingSummary (days since test, coverage map, tests/year), PreventionSummary (PrEP adherence, streaks, vaccines, reminders)
- ✅ **Personal Insights page** — 3-card layout (Activity, Testing, Prevention) with progress bars, color-coded indicators, milestone badges, loading skeleton
- ✅ **Guided onboarding flow** — 3-step modal ("Log your first test" → "Set up reminders" → "Explore your dashboard") with indigo gradient header, step dots, localStorage persistence
- ✅ **PrEP adherence streaks** — Backend: `MedicationService.getPrepStreak()` with current/longest streak calculation, milestones (7d/30d/90d). Frontend: `usePrepStreak()` hook, `PrepStreak` types
- ✅ **Navigation updated** — Insights link added to mobile + desktop nav with BarChart3 icon
- ✅ i18n: ~50 new keys in en_US + es_MX (toast, onboarding, insights, encounter types, protection methods, nav)
- ✅ Full test suite: 258 backend + 273 frontend = **531 tests passing**
- **Branch:** `feature/week-8-insights-onboarding`
- **Needs manual action:** Run migration `012_encounter_fields.sql` on Supabase

---

## Session Notes (2026-03-03 — Week 7: Smart Reminders + Medication Tracking)

- ✅ **Feature 1.3 fully implemented** — smart reminders, medication tracking, vaccination tracking, dashboard redesign
- ✅ Migration `011_reminders_medications.sql`: 5 new tables (`medications`, `medication_logs`, `vaccinations`, `reminders`, `reminder_settings`) with AES-256-GCM encryption, 8 indexes
- ✅ **Configuration-driven health catalog** — all medication types, vaccine series, frequencies, heuristic thresholds defined in YAML (`navilla.health-catalog` in application.yaml). No hardcoded enums. Adding new types = YAML changes only, no migrations
- ✅ Backend: `MedicationService` (CRUD + dose logging + adherence + auto-reminder), `VaccinationService` (dose tracking + series completion + auto-reminder), `ReminderService` (list/snooze/complete/toggle/delete + settings CRUD), `ReminderCalculationEngine` (testing + follow-up heuristics from config), `ReminderSchedulerJob` (`@Scheduled` daily cron at 6 AM)
- ✅ Backend: 4 controllers (`CatalogController` public, `MedicationController` 7 endpoints, `VaccinationController` 4 endpoints, `ReminderController` 8 endpoints), 234 backend tests passing
- ✅ Frontend: 15 new DTO types + 14 API client methods, 4 React Query hook files (`useCatalog`, `useMedications`, `useVaccinations`, `useReminders`)
- ✅ Frontend: 10 new components — `MedicationModal`, `MedicationCard`, `DoseLogButton`, `VaccinationModal`, `VaccinationSeriesCard`, `UpcomingReminders`, `ReminderSettingsModal`, `MedicationDetailPage`, `CreatePartnerModal`
- ✅ **Health Log → "My Health" tabbed page**: Upcoming Reminders card + Tests/Medications/Vaccines tabs, mobile-first horizontal scroll
- ✅ **Dashboard redesign**: Removed profile card, added "Next Up" reminders widget, quick action buttons (My Health/Journal/Network), 2-col Status + Connections layout, snapshot notice moved to bottom
- ✅ i18n: ~100 new keys in en_US + es_MX (medications, vaccinations, reminders, partner creation, dashboard)
- ✅ Full test suite: 234 backend tests + 237 frontend tests = **471 tests passing**
- **Key architecture decisions:**
  - Configuration-driven types (user requested: "don't hardcode anything") — YAML catalog + `@ConfigurationProperties` + VARCHAR columns, not Java enums
  - Unified reminder engine — single `reminders` table as scheduling surface for all types (TESTING, MEDICATION, VACCINATION, FOLLOW_UP)
  - Tabbed My Health page (user preferred over separate pages for mobile UX)
  - Dashboard focused on actionable health info (removed profile card)
- **Deferred:** Push notifications (Week 9 — PWA), email digest sending (toggle stored, sending in Week 9), E2E tests for scheduler
- **Needs manual action:** Run migration `011_reminders_medications.sql` on Supabase

---

## Session Notes (2026-02-28 — Landing Page Polish + Week 7 Prep)

- ✅ Landing page: Added real screenshots (journal timeline, health log) to feature showcase cards, cropped nav headers
- ✅ Security page: Full i18n rewrite (was English-only), 40+ locale keys added
- ✅ How It Works page: Complete rewrite — 8 sections covering all features
- ✅ ContentPage.tsx: Fixed hardcoded "Back to Home" → i18n
- ✅ Pre-rendering: Extended `scripts/prerender.ts` from 13→25 routes, added i18n SSR support

---

## Session Notes (2026-02-27 — Week 6: Health Log)

- ✅ **Full Health Log feature implemented** — complete rebuild of Health Status page as a testing history tracker
- ✅ Migration `010_health_log.sql`: 4 new tables (`labs`, `lab_credentials`, `test_visits`, `test_results`) with AES-256-GCM encryption
- ✅ Backend: `LabService` (CRUD for saved labs + credentials), `HealthLogService` (visit CRUD, summary, condition history, write-through sync to `health_status`)
- ✅ Backend: `HealthLogController` with 11 REST endpoints under `/api/health-log/`
- ✅ Backend: 159 tests passing (15 LabService + 24 HealthLogService + 14 controller integration tests + existing)
- ✅ Frontend: 6 new components — `HealthLogStats`, `ConditionCard`, `LabPicker`, `TestVisitModal`, `HealthLogPage`, `ConditionDetailPage`
- ✅ Frontend: React Query hooks (`useHealthLog.ts`) for all 11 endpoints
- ✅ Frontend: 236 tests passing (40 new Health Log component tests)
- ✅ Frontend: Full i18n (70+ keys in en_US + es_MX)
- ✅ Routing: `/health-log` and `/health-log/:condition` routes, `/health` redirects to `/health-log`
- ✅ Nav updated: "Health Status" → "Health Log" in header and dashboard links
- **Key architecture decisions:**
  - Parent-child data model: visits → results (one test visit = multiple results)
  - Normalized lab storage: `labs` + `lab_credentials` EAV (decoupled from Chopo/Salud Digna)
  - Write-through sync: POSITIVE/NEGATIVE results update `health_status`, PENDING/INDETERMINATE skipped
  - Re-derive on delete: health_status rebuilt from remaining results when visits are deleted
  - Custom conditions supported (conditionType=null + customConditionEncrypted)
- **Deferred:** Document upload (Week 9), Chopo/Salud Digna verification endpoint, verified badge UI

---

## Session Notes (2026-02-24)

- ✅ Removed infrastructure/vendor names from public pages (StatusPage, SecurityPage, PrivacyPolicyPage) — no more "Railway", "Supabase", "SendGrid", "Spring Boot", "nginx" in user-facing content.
- ✅ Fixed Mixed Content error: replaced `http://ip-api.com/json/` with browser-native detection using `Intl.DateTimeFormat().resolvedOptions().timeZone` + `navigator.language`.
- ✅ Extended geolocation detection to drive i18n language (not just signup country dropdown). Priority: `localStorage` → `timezoneLocale` custom detector → `en_US` fallback.
- ✅ Documented i18n + language detection in Docusaurus (`docs/docs/frontend/i18n.md`) and ADR-012.
- ✅ Fixed cross-platform font rendering inconsistency by loading Plus Jakarta Sans (weights 400–800) as site-wide web font.
- ✅ Implemented Micrometer OTLP observability (backend):
  - `NavillaMetrics.java` — central constants class (Names, TagKeys, TagValues); no inline string literals.
  - Domain metric beans: `HealthStatusMetrics`, `ConnectionMetrics`, `ExposureMetrics`, `NotificationMetrics`.
  - All four services instrumented with tagged counters, a Timer (exposure BFS computation), and a DistributionSummary (graph node count).
  - `pom.xml`: added `micrometer-registry-otlp` (Spring Boot BOM managed).
  - `application.yaml`: common tags (`application`, `environment`) + OTLP export block (disabled by default).
  - `application-production.yaml`: OTLP export enabled via `OTLP_METRICS_ENABLED` / `OTLP_METRICS_URL` / `OTLP_METRICS_AUTH` env vars.
  - Grafana Cloud (free tier) is the recommended OTLP target — set Railway env vars once account is created.
  - Fixed `ConnectionServiceTest` to mock `ConnectionMetrics` (was causing NPE after service refactor).
- 📝 TODO: Set `OTLP_METRICS_ENABLED=true`, `OTLP_METRICS_URL`, and `OTLP_METRICS_AUTH` Railway env vars once Grafana Cloud account is provisioned.

---

## Session Notes (2026-02-04)

- ✅ KIS direction: store enum values as `varchar` in DB and use `@Enumerated(EnumType.STRING)` in backend.
- ✅ Added seed SQL for 7 dev users + connections + health status:
  - `database/seeds/dev-7-users.sql`
  - `database/seeds/dev-7-users-revert.sql`
- ⚠️ Pending Incoming UI shows a UUID instead of name/username/avatar. Needs UI + API support to show requester profile data.
- ⚠️ Notifications and Pending Incoming require manual refresh; add lightweight polling.
- ✅ E2E tests reset to a minimal smoke suite; legacy specs removed.
- ✅ Added `VITE_E2E_MODE` to use in-app auth/API mocks for stable CI and fast smoke tests.
- ✅ New smoke coverage: homepage load, signup step 1 → step 2, login → dashboard, logout.
- ✅ Dev-only tooling:
  - `POST /api/exposures/recompute` for forcing exposure snapshot recompute.
  - `GET /api/dev/users/hash?username=...|email=...` to retrieve user hashes.
  - `GET /api/dev/exposures/inspect?username=...|email=...` to inspect exposure graph and results.
  - Guarded by `NAVILLA_DEV_MODE=true` / `navilla.dev-mode` (default false).
- 📝 TODO: Decide between hard-delete vs soft-delete for connections.
  - Soft-delete benefits: auditability, undo, analytics, explainable exposure history.
  - Hard-delete benefits: simpler logic, stronger privacy, cleaner graph.

## MVP Checklist (Draft)

### Core Flow (Must-have)
- [x] Sign up / sign in works end-to-end without confusion.
- [x] Profile basics: display name, username, avatar, visibility settings.
- [x] Connection flow: send request, accept/deny/remove, and show who's who (name/username/avatar).
- [x] Health report flow: add positive/negative, clear/delete.
- [x] Exposure overview: specific conditions + closest degree + predictable refresh behavior.
- [x] How It Works page with full user-facing disclosure (ADR-008).
- [x] Account deletion with confirmation modal (GDPR/CCPA).
- [x] Network size on dashboard with threshold UX.

### UX & Trust (Should-have)
- [x] Clear "What this means" explanation on Health/Exposure.
- [x] Loading states for all mutations.
- [x] Human-readable error messages.
- [x] Notifications update (polling or refresh button).
- [x] Dashboard threshold progress bar ("X of 3 connections needed").

### Dev/Testing (Stability)
- [x] Seed data for local testing.
- [x] Dev tools: recompute exposure + inspect graph.
- [x] Comprehensive E2E tests in CI (auth, connections, health, dashboard, how-it-works, account).

### Security/Privacy (Baseline)
- [x] No identity leakage in search/invites.
- [x] Private profiles accept requests without revealing existence.
- [x] External links disclaimer in Terms.
- **Status:** Accepted
- **Decision:** Use Docusaurus
- **Full details:** `docs/docs/adrs/adr-001-documentation-platform.md`

### ADR-002: Technology Stack
- **Status:** Accepted
- **Decision:** React/Vite (FE), Java/Spring Boot (BE), Supabase (Auth/DB)
- **Full details:** `docs/docs/adrs/adr-002-tech-stack.md`

### ADR-003: Build Tool
- **Status:** Accepted
- **Decision:** Maven for backend (over Gradle)
- **Why:** User preference, fewer compatibility issues historically

### ADR-004: Code Style
- **Status:** Accepted
- **Decision:** Google Java Style with Checkstyle enforcement
- **Config:** `backend/checkstyle/google_checks.xml`

### ADR-005: Design System
- **Status:** Accepted
- **Decision:** Blue primary color (#2563eb) with Infima-inspired styling
- **Why:** Matches Docusaurus docs, conveys trust for health app
- **Full details:** `docs/docs/adrs/adr-005-design-system.md`

### ADR-006: Email Confirmation
- **Status:** Accepted
- **Decision:** Dynamic detection of email confirmation requirement
- **Why:** Works with any Supabase config, no code changes needed
- **Full details:** `docs/docs/adrs/adr-006-auth-email-confirmation.md`

## Session Notes (2026-02-05 - MVP Launch Blockers)

### MVP Implementation Session
- ✅ **How It Works page** (`HowItWorksPage.tsx`):
  - 8 sections from ADR-008 user-facing disclosure: what we show, what we never show, data source, connections, exposure calculation, accuracy, what you can do, data rights
  - Full i18n support (en_US + es_MX)
  - Replaced placeholder InfoPage at `/how-it-works` with dedicated component
- ✅ **Account deletion UI** (ProfilePage):
  - "Danger Zone" section with red-bordered card below settings
  - Confirmation modal requires typing "DELETE" to enable button
  - Calls `DELETE /api/users/me` → signs out → redirects to home
  - Added `api.users.delete()` with E2E mock
  - Full i18n for all new strings
- ✅ **Dashboard threshold UX** (DashboardPage):
  - Progress bar showing X/3 when below privacy threshold
  - "X of 3 connections needed to see exposure data" message
  - "What does this mean?" link to `/how-it-works` next to network size
- ✅ **E2E test suite rebuilt** (6 spec files, ~40 tests):
  - `auth.spec.ts` — login, signup, logout, forgot password, protected routes
  - `connections.spec.ts` — page rendering, add form, sections
  - `health-status.spec.ts` — page, exposure overview, report form
  - `dashboard.spec.ts` — cards, threshold UX, navigation links
  - `how-it-works.spec.ts` — all 8 sections, navigation
  - `account.spec.ts` — delete flow, confirmation modal, typing "DELETE"
  - Updated test users with `confirmedCount` for threshold testing
  - Playwright config auto-sets `VITE_E2E_MODE=true` for dev server

---

## Session Notes (2026-02-05)

- ✅ Health Status UX overhaul:
  - Two-column layout on large screens: left = "My confirmed results", right = "Exposure overview".
  - "My confirmed results" now includes summary stats (total reports, active positives, last report).
  - Exposure overview shows last updated, list with "Cases: #" alignment, and "Show all/less".
  - Added in-app help modals with detailed explanations and examples (bold emphasis supported).
  - Disease names now link directly to external info (MedlinePlus) with external icon.
- ✅ Softened external link styling with shared `.health-condition-link` class.
- ✅ Notifications polling added (30s interval) for fresher UX.
- 📝 TODO: Move CORS allowlists to env vars (e.g., NAVILLA_CORS_ALLOWED_ORIGINS / NAVILLA_CORS_ALLOWED_ORIGIN_PATTERNS).

---

## Session Notes

### Session 1 - 2026-01-30
**Accomplished:**
1. Reviewed requirements document
2. Set up Docusaurus documentation (30+ docs)
3. Initialized Git repository
4. Created database migrations (3 SQL files)
5. Scaffolded Spring Boot backend:
   - Java 25 + Spring Boot 4.0.2
   - Maven build
   - Google Java Style + Checkstyle
   - Lombok, DevTools
   - YAML configuration
   - JaCoCo code coverage
   - Startup scripts (prod/dev/troubleshoot)
6. Scaffolded React frontend:
   - Vite + TypeScript
   - TailwindCSS configured
   - Supabase client
   - TanStack Query
   - React Router
7. Set up Supabase project & ran migrations
8. Created GitHub issues for milestone tracking

**Startup Scripts Created:**
- `scripts/start-production.sh` - G1GC, optimized heap, container-aware
- `scripts/start-development.sh` - Debug port 5005, verbose logging
- `scripts/start-troubleshooting.sh` - GC logging, heap dumps, JMX, Flight Recorder

### Session 2 - 2026-01-30 (continued)
**Accomplished:**
1. Implemented security configuration:
   - `SecurityConfig.java` - JWT auth with Supabase, CORS, CSP headers
   - `EncryptionService.java` - AES-256-GCM encryption, SHA-256 hashing
   - `HealthController.java` - Public & authenticated health endpoints
2. Created comprehensive unit tests (29 tests passing):
   - `EncryptionServiceTest.java` - 25 tests for encryption/hashing
   - `HealthControllerTest.java` - 3 integration tests
3. Set up GitHub Actions CI/CD:
   - `ci.yml` - Backend tests, frontend build, DB migration validation
   - `security.yml` - Gitleaks, OWASP dependency check, CodeQL, Trivy
   - `docker-publish.yml` - Multi-arch images to GitHub Container Registry
4. Created Docker configuration:
   - `backend/Dockerfile` - Multi-stage build, non-root user, health check
   - `frontend/Dockerfile` - Nginx with SPA routing, security headers
   - `.dockerignore` files for optimized builds
5. Added security tooling:
   - `.gitleaks.toml` - Secret scanning configuration
   - `.dependency-check-suppression.xml` - OWASP false positive handling

**Note:** Spring Boot 4 moved test packages:
- `@WebMvcTest` → `org.springframework.boot.webmvc.test.autoconfigure`
- `@AutoConfigureMockMvc` → same new package

### Session 3 - 2026-01-30 (continued)
**Accomplished:**
1. Added i18n infrastructure:
   - Frontend: react-i18next with en_US and es_MX locales
   - Backend: Spring MessageSource with messages.properties files
   - es_MX files contain English placeholders for future translation
2. Created root documentation:
   - `README.md` - Project overview, quick start, tech stack
   - `CONTRIBUTING.md` - Contribution guidelines, code style, PR process
3. Implemented User Entity & API (GitHub Issue #4):
   - `User.java` - JPA entity with encrypted fields
   - `UserRepository.java` - Spring Data JPA repository
   - `UserService.java` - Business logic with encryption handling
   - `UserController.java` - REST endpoints (/api/users/me)
   - `UpdateProfileRequest.java`, `UserResponse.java` - DTOs
   - `ApiError.java` - Standard error response format
   - `ResourceNotFoundException.java` - Custom exception
   - `GlobalExceptionHandler.java` - i18n error handling
   - `MessageConfig.java` - i18n configuration

**New Packages Created:**
- `app.navilla.entity` - JPA entities
- `app.navilla.repository` - Spring Data repositories
- `app.navilla.service` - Business logic services
- `app.navilla.dto` - Data transfer objects
- `app.navilla.exception` - Exception classes and handlers

### Session 4 - 2026-01-31
**Accomplished:**
1. Implemented complete frontend authentication system:
   - `src/lib/supabase.ts` - Supabase client initialization
   - `src/queryClient.ts` - TanStack Query client (5-min stale time)
   - `src/contexts/AuthContext.tsx` - Session management, signIn/signUp/signOut
   - `src/hooks/useAuth.ts` - Re-export of auth hook
   - `src/hooks/useUser.ts` - TanStack Query hook for /api/users/me
   - `src/components/auth/ProtectedRoute.tsx` - Route guard component
   - `src/components/layout/Header.tsx` - Nav with auth state
   - `src/components/layout/Layout.tsx` - Main layout wrapper
   - `src/components/layout/AuthLayout.tsx` - Centered auth pages layout
   - `src/pages/HomePage.tsx` - Landing page
   - `src/pages/LoginPage.tsx` - Email/password login form
   - `src/pages/SignUpPage.tsx` - Registration with email confirmation
   - `src/pages/DashboardPage.tsx` - Protected dashboard
   - `src/router.tsx` - React Router v7 configuration
   - Updated `src/App.tsx` - Added providers (QueryClient, Auth, Router)

2. Created CLAUDE.md for project instructions and post-implementation checklist

**Routes Configured:**
| Path | Component | Protected |
|------|-----------|-----------|
| `/` | HomePage | No |
| `/login` | LoginPage | No (redirects if logged in) |
| `/signup` | SignUpPage | No (redirects if logged in) |
| `/dashboard` | DashboardPage | Yes |

**Key Patterns Used:**
- Auth token: `session?.access_token` passed to API calls
- Protected routes: Check `isLoading` first, then `session`
- i18n: All UI text uses `t('key')` from useTranslation
- Styling: Uses existing `.btn`, `.btn-primary`, `.card`, `.input` classes
- Query keys: `['user', 'me']` with 5-min stale time

### Session 5 - 2026-01-31 (continued)
**Accomplished:**
1. Updated frontend UI theme from green to blue (Docusaurus-style)
2. Fixed i18n - added missing translation keys for auth prompts
3. Implemented Connection entity & API (backend):
   - `ConnectionStatus.java` - Enum (PENDING, CONFIRMED, DENIED, EXPIRED)
   - `Connection.java` - JPA entity with privacy-preserving hashed user IDs
   - `ConnectionRepository.java` - Spring Data JPA with custom queries
   - `ConnectionService.java` - Business logic for connection management
   - `ConnectionController.java` - REST endpoints for connections
   - DTOs: `ConnectionResponse`, `CreateConnectionRequest`, `ConnectionStatsResponse`
   - Updated `GlobalExceptionHandler.java` - Added IllegalArgumentException/IllegalStateException handlers
   - Added i18n messages for connection errors

4. Created comprehensive tests:
   - `ConnectionServiceTest.java` - 15 unit tests with Mockito
   - `ConnectionControllerTest.java` - 12 integration tests

5. Created Postman collection:
   - `docs/static/postman/navilla-api.postman_collection.json`
   - Includes all Health, Users, and Connections endpoints

6. Updated documentation:
   - `docs/docs/api/connections.md` - Full API reference

**Connection API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/connections` | Create connection request |
| GET | `/api/connections` | Get all connections |
| GET | `/api/connections/confirmed` | Get confirmed only |
| GET | `/api/connections/pending/incoming` | Pending incoming |
| GET | `/api/connections/pending/sent` | Pending sent |
| GET | `/api/connections/stats` | Connection statistics |
| POST | `/api/connections/{id}/accept` | Accept request |
| POST | `/api/connections/{id}/deny` | Deny request |
| DELETE | `/api/connections/{id}` | Cancel request |

### Session 5 (continued) - Theme and Auth Fixes
**Accomplished:**
1. Fixed CSS theme - changed from `@theme` to `:root` for CSS custom properties
2. Updated Docusaurus docs to use same blue theme (#2563eb)
3. Improved Infima-like styling:
   - Pill-shaped buttons (border-radius: 50px)
   - More prominent hero section
   - Better navbar styling
4. Fixed signup flow to detect if email confirmation is required
5. Created ADRs:
   - ADR-005: Design System
   - ADR-006: Email Confirmation Handling
6. Closed GitHub issue #6 (Connection API)
7. Created new GitHub issues: #10, #11, #12 for next milestones

### Session 6 - 2026-02-01
**Accomplished:**
1. Fixed API URL configuration bug causing "Profile An error occurred":
   - Created centralized API client (`frontend/src/lib/api.ts`)
   - Uses `VITE_API_URL` environment variable properly
   - Includes `ApiError` class for proper error handling
   - Updated `useUser` hook to use the new API client

2. Set up Playwright E2E testing framework:
   - Installed Playwright and Chromium browser
   - Created `playwright.config.ts` with CI support
   - Added npm scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:report`
   - Added Playwright artifacts to `.gitignore`

3. Created E2E tests for auth flows (`frontend/e2e/auth.spec.ts`):
   - Login page rendering and form validation
   - Signup page rendering and password validation
   - Forgot password flow
   - Protected routes redirect to login
   - Navigation between pages

4. Updated CI workflow with E2E job:
   - Runs Playwright tests on every PR
   - Uses preview server for built assets
   - Uploads test reports and screenshots as artifacts

5. Added UI background styling improvements:
   - Added `.bg-pattern` with radial gradients
   - Added `.bg-gradient-subtle` and `.bg-mesh` options
   - Enhanced hero section with glow effects
   - Applied pattern background to AuthLayout

6. Created GitHub issues:
   - #15: E2E Automated Testing with Playwright
   - #16: UI Background Styling Improvements
   - #17: Fix API URL configuration causing 'Profile error'

**Files Added:**
- `frontend/src/lib/api.ts` - Centralized API client
- `frontend/playwright.config.ts` - Playwright configuration
- `frontend/e2e/auth.spec.ts` - E2E test suite

**Files Modified:**
- `frontend/src/hooks/useUser.ts` - Uses new API client
- `frontend/src/index.css` - Background patterns and hero styling
- `frontend/src/components/layout/AuthLayout.tsx` - Applied bg-pattern
- `frontend/package.json` - Added E2E test scripts
- `frontend/.gitignore` - Added Playwright artifacts
- `.github/workflows/ci.yml` - Added E2E test job

**Pending:**
- Create 10 test users in AWS Supabase
- Seed connection relationships for test scenarios

### Session 6 (continued)
**Additional Accomplishments:**

7. Created comprehensive E2E test structure:
   - `frontend/e2e/fixtures/test-users.ts` - 10 test users with network graph
   - `frontend/e2e/helpers/auth.ts` - Authentication helpers
   - `frontend/e2e/connections.spec.ts` - Connection tests (some skipped pending UI)
   - `frontend/e2e/exposure.spec.ts` - Exposure tests (some skipped pending health UI)
   - `frontend/e2e/README.md` - E2E testing documentation

8. Updated Postman collection with comprehensive tests:
   - Added test scripts to all endpoints
   - Added Error Cases folder for error handling tests
   - Tests verify response status, body structure, data types
   - Location: `docs/static/postman/navilla-api.postman_collection.json`

9. Updated documentation:
   - `docs/docs/development/testing.md` - Added E2E testing section
   - `docs/docs/api/authentication.md` - Added forgot password and reset password
   - `docs/docs/frontend/state-management.md` - Added API client documentation
   - Fixed Maven commands (was incorrectly showing Gradle)

10. Created GitHub issues:
    - #18: Update Postman collection with comprehensive tests
    - #19: Create user guide documentation with screenshots (open for later)

### Session 7 - 2026-02-01 (continued)
**Accomplished:**
1. Enhanced signup form with user profile fields:
   - Multi-step form (Step 1: Account, Step 2: About You)
   - Added fields: username (required), full name (optional), DOB (required), sex (required), country (auto-detect), location (optional)
   - IP-based country detection via ip-api.com (`frontend/src/lib/geolocation.ts`)
   - Age validation (18+ required)
   - Username validation (letters, numbers, underscores only)

2. Added UserMetadata interface to AuthContext:
   - Extended signUp to pass metadata to Supabase

3. Fixed site title from "frontend" to "Navilla":
   - Updated `frontend/index.html`

4. Added Spanish translations for new signup fields:
   - Updated `frontend/src/locales/es_MX.json`

5. Fixed TypeScript and lint errors:
   - Fixed ApiError class parameter properties in `api.ts`
   - Removed unused imports in E2E test files
   - Added eslint-disable comment for AuthContext export

6. Updated CLAUDE.md with local testing requirements:
   - Added rule: run `npm run build && npm run lint` before committing

**Files Added:**
- `frontend/src/lib/geolocation.ts` - IP geolocation and country list

**Files Modified:**
- `frontend/index.html` - Fixed title
- `frontend/src/pages/SignUpPage.tsx` - Multi-step signup form
- `frontend/src/contexts/AuthContext.tsx` - UserMetadata interface
- `frontend/src/locales/en_US.json` - New auth translation keys
- `frontend/src/locales/es_MX.json` - Spanish translations
- `frontend/src/lib/api.ts` - Fixed TypeScript error
- `frontend/e2e/connections.spec.ts` - Fixed lint errors
- `frontend/e2e/exposure.spec.ts` - Fixed lint errors
- `CLAUDE.md` - Added local testing requirement

### Session 8 - 2026-02-02
**Problem:** Backend on AWS returning 502 Bad Gateway - database connection failing

**Root Cause:**
- Supabase database only has IPv6 address
- EC2 instance only had IPv4 connectivity
- Docker containers couldn't resolve IPv6 hostnames

**Accomplished:**
1. Diagnosed database connectivity issue:
   - Backend container couldn't connect to Supabase PostgreSQL
   - Supabase `db.xxx.supabase.co` resolves to IPv6 only
   - EC2 default VPC had no IPv6 support

2. Enabled IPv6 on AWS infrastructure via Terraform:
   - Added IPv6 CIDR block to default VPC
   - Created new subnet (172.31.128.0/24) with IPv6
   - Added IPv6 route to internet gateway
   - Recreated EC2 instance in IPv6-enabled subnet

3. Fixed Docker IPv6 connectivity:
   - Used `network_mode: host` for backend container
   - Allows container to use host's IPv6 address
   - Backend now connects directly to Supabase via IPv6

4. Updated deployment configuration:
   - Updated docker-compose.yml with proper environment variables
   - Created docker-compose.prod.yml for production deployments
   - Added DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD to terraform
   - Added GitHub secrets for database credentials

5. Created GitHub issue #20 for scheduled EC2 start/stop (cost saving)

**Key Learnings:**
- IPv6 on AWS EC2 is FREE
- Supabase free tier databases are IPv6-only
- Docker containers need `network_mode: host` for IPv6

**Files Added:**
- `docker-compose.prod.yml` - Production docker-compose override

**Files Modified:**
- `docker-compose.yml` - Updated environment variables
- `terraform/staging/main.tf` - Added IPv6 VPC, subnet, routes
- `terraform/staging/variables.tf` - Added database variables
- `terraform/staging/user-data.sh` - Updated with host networking and env vars
- `terraform/staging/terraform.tfvars.example` - Added database examples

---

## Running the Project & Quick Commands

For a quick start and a list of development commands, please refer to the main `README.md` file or run `./start.sh help`.

---

## Next Steps

Week 9 (PWA + Push Notifications + Caching + Email) complete. Moving to Week 10 next.

| Priority | Item | GitHub Issue | Notes |
|----------|------|-------------|-------|
| **Next** | Week 10: Per roadmap | — | Check `UPCOMING_FEATURES_AND_ROADMAP.md` |
| **Action** | Run migration 013 on Supabase | — | `013_push_subscriptions.sql` — push_subscriptions table |
| **Action** | Set Railway env vars | — | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `SENDGRID_API_KEY`, `EMAIL_ENABLED` |
| **Action** | Merge `feature/week9-pwa-push-notifications` → `develop` | — | All tests passing |
| **Action** | Generate VAPID key pair | — | `npx web-push generate-vapid-keys` or openssl |
| High | Backend Spanish translations | #8 | Frontend done, backend messages_es_MX.properties still English |
| Medium | User guide documentation | #19 | Screenshots + walkthrough for end users |
| Medium | Lighthouse PWA audit | — | Run after deployment to verify installability |

Run `gh issue list` for the full list.

---

## Session Notes (2026-02-12 — Seed Script Overhaul)

### Accomplished
- Rewrote `frontend/scripts/seed-users.mjs` into a modular 5-phase system:
  - Phase 1: Create users (Supabase Admin API or UI signup, with login verification)
  - Phase 2: Update profiles (PUBLIC / CONNECTIONS_ONLY / PRIVATE)
  - Phase 3: Build connection topology (multi-tier + pending + denied)
  - Phase 4: Report health across all 10 STI types (active, cleared, negative)
  - Phase 5: migue1990 self-report (HPV negative)
- New files: `seed-config.mjs` (topology/data), `seed-helpers.mjs` (Playwright interactions), `seed-revert.sql` (cleanup SQL)
- Added `--size=N` flag for scalable topology (tested with 50 users)
- Added `.seed-state.json` for resumability and per-phase CLI flags
- Multiple fixes to handle: Supabase signup rate limits, silent signup failures, session loss during logout (switched to localStorage.clear()), slow profile loads

### Lessons Learned
- Supabase free tier rate-limits client signups (~30/hr) — use Admin API with service role key instead
- UI signup can fail silently — always verify login works after signup before marking as "created"
- Clicking UI buttons for logout is fragile (toasts/overlays block clicks) — clearing localStorage is more reliable
- Backend must be running for connections and health to work (Supabase Auth is hosted, but `/api/*` hits local backend)

### Seed Script Quick Reference
```bash
# Full seed (default 131 users)
cd frontend && npm run seed:users -- --headed

# Smaller test run
npm run seed:users -- --size=50 --headed

# With Supabase Admin API (bypasses rate limits)
npm run seed:users -- --supabase-url=$SUPABASE_URL --supabase-key=$SUPABASE_SERVICE_ROLE_KEY

# Single phase
npm run seed:users -- --phase=connections --headed

# Clean slate
rm -f scripts/.seed-state.json

# Revert all seed data (run in Supabase SQL Editor)
# → database/seeds/seed-revert.sql
```

### Next Steps (continue tomorrow)
- [ ] Verify full 131-user seed against Railway production URL
- [ ] Investigate: user048 wasn't created (rate limit) — retry or use Admin API
- [ ] Remove DEBUG logging from seed-helpers once stable
- [ ] Update docs for seed script usage
- [ ] Adjust seed health data to demonstrate all 4 exposure combos:
  - "Active - Recent" (already works)
  - "Resolved - Recent" → need a condition with only 1 reporter who clears it
  - "Active - Older" → need a condition where all reports are >30 days old, not cleared
  - "Resolved - Older" → need a condition >30 days old where reporter also clears it
- [ ] Add tooltip/info icon next to exposure status badges explaining what Active/Resolved and Recent/Older mean (keep cards clean, show detail on hover/tap)

---

## Open Decisions / Notes

- **Login "Keep me signed in" checkbox** (Sign In page):
  - Option 1: UI-only checkbox (no behavior change; Supabase already persists sessions).
  - Option 2: Real behavior: when unchecked, store session in `sessionStorage`; when checked, use `localStorage` (requires updating Supabase client init).
- **SEO / Discoverability**:
  - Add metadata (title/description/keywords), Open Graph, sitemap, robots, and structured data to improve search ranking.

### Exposure Display Notes
- **"Exposure Overview" vs "In Your Network"**: Same data source (`exposureQuery.data?.exposures`), different display limits. Dashboard shows top 3, Health page shows 6 (expandable with "Show all").
- **Status labels**: `active` (clearedAt is null) vs `resolved` (clearedAt set). Timeframe: `recent` (≤30 days) vs `older` (>30 days). Four possible combos: "Active - Recent", "Active - Older", "Resolved - Recent", "Resolved - Older".

---

## Session Notes (2026-02-27 — Week 5: Journal UX Polish)

### Accomplished
UX polish pass on the encounter journal — navigation improvements, date validation, and view hierarchy.

**Calendar Smart Skip Navigation:**
- Added `«` / `»` double-chevron buttons that jump to the nearest month with entries (not just +/- 1 month)
- `monthsWithEntries` computed from client-side entry data — no extra API calls
- Skip buttons disabled at boundaries with inline feedback text ("No encounters before this month")
- "Today" pill button appears when not viewing the current month
- Both en_US and es_MX locales updated
- Files: `JournalPage.tsx`, `index.css` (4 new CSS classes), locale files

**Encounter Date Validation (DOB + future):**
- Date input now constrained: `min={dateOfBirth}` and `max={today}`
- Submit handler validates both boundaries with clear error messages
- Uses `useUser()` hook to fetch DOB from user profile — same pattern as HealthStatusPage
- Files: `JournalEntryModal.tsx`, locale files (2 new keys per language)

**View Toggle Hierarchy:**
- Timeline and Calendar buttons grouped under a "VIEW" label (uppercase, muted, small)
- Partners button separated by a vertical divider — makes clear it's a different section, not an alternate view
- Wraps gracefully on mobile via `flex-wrap`
- Files: `JournalPage.tsx`, locale files (1 new key per language)

**Test Results:** 196 frontend tests passing, lint clean. No backend changes.

### Where We Are in the Roadmap

**Completed:**
- Weeks 1-4: Foundation + Layer 0 ✅
- Week 5: Encounter journal (core) ✅
- Week 5 (extra): Journal partners / regulars feature ✅
- Week 5 (extra): Journal UX polish (this session) ✅

**Current position: End of Week 5, ahead of schedule.**
The journal has more features than the roadmap specced (partners, smart skip nav, DOB validation, view grouping — none of these were in the Week 5 deliverables).

### Key Decision: Protection + Encounter Type Fields Deferred to Week 8
Feature 1.1 spec includes "Protection used" (multi-select) and "Type of encounter" (multi-select) as structured fields. These exist to power computed insights like "83% of encounters were protected" in Week 8. Decision: defer adding them until Week 8 (Personal Insights), when we actually need the data. Rationale:
- Custom fields already let users note protection freeform if they want
- No real users logging entries yet → no backfill problem when we add later
- Adding two dropdowns + a migration is a half-day task, not a blocker
- Structured data without a consumer (the insights dashboard) is premature
- Product owner approved 2026-02-27

**Up next (Week 6):** Testing History Tracker
- Backend: `test_records` + `test_record_results` tables, API
- Frontend: testing log UI, per-condition history, "days since last test" counter
- Document upload (encrypted storage)
- This extends the existing Health Status system rather than building from scratch

**Weeks 7-9 remaining in Phase 2:**
- Week 7: Smart reminders + medication tracking (PrEP, DoxyPEP, vaccination)
- Week 8: Personal insights + doctor visit prep + saved clinics
- Week 9: PWA + Layer 1 polish

### Notes
- `gh` CLI not authenticated — can't manage GitHub issues from this session
- No backend changes this session — all frontend UX improvements

---

## Session Notes (2026-02-27 — Week 5: Encounter Journal)

### Accomplished
Complete Week 5 Layer 1: Encounter journal — first personal tracker feature.

**Database:**
- Migration `008_encounter_journal.sql`: two new tables (`encounter_journal`, `journal_field_templates`)
- All sensitive text fields encrypted as BYTEA (AES-256-GCM)
- Custom fields stored as encrypted JSON blob (max 3 per entry)
- Optional FK to connections table for linking entries to network contacts

**Backend (Java 25 + Spring Boot 4):**
- `EncounterJournal` + `JournalFieldTemplate` JPA entities
- `EncounterJournalRepository` with month filtering and monthly summary queries
- 7 DTOs (request/response records with Jakarta validation)
- `EncounterJournalService` with full CRUD, encryption, ownership checks, custom field JSON serialization
- `EncounterJournalController` — 8 REST endpoints at `/api/journal`
- `JournalMetrics` — Micrometer counters for create/update/delete/templates-saved
- Backend i18n messages (messages.properties + messages_es_MX.properties)
- 14 service unit tests + 8 controller integration tests (all passing)

**Frontend (React 19 + TypeScript):**
- `api.journal.*` API client group with types + E2E mocks
- 7 React Query hooks in `useJournal.ts`
- `JournalPage.tsx` — main page with timeline/calendar toggle, summary bar, encrypted badge
- `JournalTimeline.tsx` — chronological list grouped by month
- `JournalEntryCard.tsx` — entry card with date, alias, notes preview, custom field badge
- `JournalEmptyState.tsx` — warm empty state with privacy messaging
- `JournalEntryModal.tsx` — create/edit form with custom fields, connection linking, save-for-future templates
- `JournalCalendar.tsx` — monthly grid with entry dot indicators, day selection
- Protected route at `/journal`, nav link with BookOpen icon
- 33 frontend component tests (all passing)
- Full i18n (en_US + es_MX) for all journal strings

**Tests:** 80 backend + 181 frontend = 261 total tests, all passing

### Key Decisions
- Server-side AES-256-GCM encryption (compatible with future client-side E2E upgrade)
- Custom fields as encrypted JSON blob (not EAV) — simpler, no query benefit since data is encrypted
- Optional connection FK — entries can exist independently of the network
- Calendar view uses native Date API (no date library dependency)

### Next Steps
- Week 6: Testing history tracker (test records, per-condition history, document upload)

---

## Session Notes (2026-02-27 — Journal Partners / Regulars Feature)

### Accomplished
Designed and implemented the full Journal Partners ("Regulars") feature — allowing users to save recurring partners with notes, stats, and encounter history.

**Database:**
- Migration `009_journal_partners.sql`: new `journal_partners` table with encrypted alias/notes, optional FK to connections, soft-delete support
- Added `partner_id` FK on `encounter_journal` table linking entries to saved partners
- RLS policies for owner-only access

**Backend (Java 25 + Spring Boot 4):**
- `JournalPartner` JPA entity with encrypted fields
- `JournalPartnerRepository` with owner-scoped queries
- 6 DTOs: `JournalPartnerResponse`, `JournalPartnerDetailResponse`, `CreatePartnerRequest`, `UpdatePartnerRequest`, `PromoteAliasRequest`, `RecentAliasResponse`
- `JournalPartnerService` — full CRUD + promote alias + recent aliases + soft/destructive delete
- Updated `EncounterJournalService` to include `partnerId` and `partnerEncounterCount` in entry responses
- 8 new REST endpoints on `EncounterJournalController`
- `JournalMetrics` — added partner counters (create/update/delete/promote)
- Backend i18n messages for partner validation errors
- 25+ new service unit tests + controller integration tests (105 total backend tests passing)

**Frontend (React 19 + TypeScript):**
- `JournalPartner` and `JournalPartnerDetail` types in `api.ts`
- 9 new API client methods in `api.journal.partners.*`
- 7 new React Query hooks in `useJournal.ts`
- `JournalPartnerCard.tsx` — partner card with alias, encounter count, last date, connection badge
- `JournalPartnersTab.tsx` — partners list tab on journal page with empty/loading states
- `PartnerDetailPage.tsx` — partner detail with rename, notes, stats, encounter timeline, soft/destructive delete modal
- `JournalEntryCard.tsx` — updated with bookmark icon and encounter count link for partnered entries
- `JournalEntryModal.tsx` — partner picker autocomplete with saved partners + recent aliases, 3rd-encounter promotion prompt
- Protected route at `/journal/partner/:id`
- 15 new frontend component tests (196 total frontend tests passing)
- Full i18n (en_US + es_MX) for all partner strings

**New API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/journal/partners` | List saved partners |
| POST | `/api/journal/partners` | Create partner |
| GET | `/api/journal/partners/:id` | Get partner detail |
| PUT | `/api/journal/partners/:id` | Update partner |
| DELETE | `/api/journal/partners/:id` | Delete partner (soft default, `?deleteEntries=true` for destructive) |
| GET | `/api/journal/partners/:id/entries` | List entries for partner |
| POST | `/api/journal/partners/promote` | Promote alias to saved partner |
| GET | `/api/journal/recent-aliases` | Recent aliases without a partner |

**New Frontend Route:**
| Path | Component | Protected |
|------|-----------|-----------|
| `/journal/partner/:id` | PartnerDetailPage | Yes |

**Migration Required:** Run `database/migrations/009_journal_partners.sql` in Supabase SQL Editor

### Key Decisions
- Partner alias stored encrypted (same AES-256-GCM as journal entries)
- Soft delete by default (preserves entries, nulls partner_id); destructive delete requires explicit parameter
- 3rd-encounter promotion prompt is client-side heuristic (no server-side counter)
- Partner picker autocomplete combines saved partners + recent unlinked aliases

---

## Session Notes (2026-02-26 — Week 4 Complete)

### Accomplished
Complete Week 4 Layer 0: SEO infrastructure, cost estimator, conversion CTAs, deploy.

**New files:**
- `frontend/src/pages/TestingCostPage.tsx` — STI testing cost estimator at `/testing-cost`. Desktop table + mobile cards. Provider tiers: CAPASITS, IMSS, private lab, private clinic, specialist.
- `frontend/src/components/layer0/SignUpCTA.tsx` — Shared auth-gated CTA component. Reuses `.guide-cta` CSS.
- `frontend/src/lib/structuredData.ts` — JSON-LD schema builders (MedicalWebPage, WebApplication, CollectionPage, WebPage).
- `frontend/public/images/og-default.svg` — 1200x630 brand image for social sharing.

**Data model additions (stiContent.ts):**
- `CostTier` type, `ProviderKey` union, `ProviderTier` interface, `PROVIDER_TIERS` constant
- `costTiers` field added to all 10 STI entries

**SEO changes:**
- JSON-LD structured data injected on all 4 Layer 0 pages
- `og:image`, `twitter:image`, `twitter:card=summary_large_image` added to `index.html`
- `og:type=article` override on all guide detail pages
- `sitemap.xml` updated: 9 → 22 URLs (all Layer 0 tools + 10 guides)
- Prerender script: 7 → 13 routes; OG tags now injected per-page

**Conversion CTAs:**
- `<SignUpCTA />` added to Calculator, Guides Index, Cost Estimator pages
- `GuideDetailPage` refactored to use shared `<SignUpCTA />`
- Cross-tool navigation links: Calculator ↔ Cost, Guides ↔ Cost

**Locale:**
- `cost.*` keys added to `en_US.json` + `es_MX.json`

### Test Results
- 145 tests passing across 17 test files (vitest run — all green)

### Key Commits (in order)
- feat: add cost tier data and provider tiers to stiContent
- fix: tighten CostTier ordering and ProviderKey type, add cost tier tests
- feat: add TestingCostPage with provider tier cost table
- feat: add cost estimator locale keys (en_US + es_MX)
- feat: add shared SignUpCTA component for Layer 0 pages
- feat: add SignUpCTA and cross-tool links to all Layer 0 pages
- feat: add JSON-LD structured data to all Layer 0 pages
- feat: add OG image SVG and social meta tags
- feat: update sitemap with all 22 Layer 0 URLs
- fix: add missing guide slugs + testing-cost to prerender, inject OG tags

**Late-session redesign — /testing-cost:**
After initial implementation, user feedback: "right now it just says go to a public service is cheap, go to a private clinic is more expensive — what value are we adding?" Researched real MXN prices from Chopo, Salud Digna, Marie Stopes, CAPASITS, Clínica Condesa, AHF Mexico. Completely rewrote `TestingCostPage.tsx` with:
- Three sections: Free (CAPASITS/SAI, Clínica Condesa, AHF Mexico), Affordable (Marie Stopes $369 rapid ITS pack, Salud Digna with real prices per test), Comprehensive (Chopo PCR panels $476–$5,054)
- Card layout replaces table — each provider is a card with colored left-border accent
- Every price has a `sourceUrl` + `sourceLabel` link and a `verifiedDate` badge ("Verified Feb 2026")
- Old tier matrix CSS (~205 lines) replaced with card-based CSS system
- Tests updated (148 passing)
- Committed: `feat: redesign /testing-cost with real sourced MXN pricing`

### Test Results (final)
- 148 tests passing across 17 test files (all green)

### Next Steps
- Week 5: Layer 1 — Personal tracker (test log, reminder system)
- Add `/testing-cost` to nav or footer (currently only reachable via direct URL or cross-tool links from `/calculator` and `/guides`)

---

## Session Notes (2026-02-26 — Week 2 Layer 0 Polish)

### Accomplished
Complete Week 2 Layer 0 polish across all STI guide and calculator pages:

**New files:**
- `frontend/src/lib/renderMarkdown.tsx` — Zero-dependency micro-renderer: `- bullets` → `<ul><li>`, `**bold**` → `<strong>`, plain text → `<p>`
- `frontend/src/lib/renderMarkdown.test.tsx` — 8 unit tests
- `frontend/src/components/layer0/FactChips.tsx` — Shared chip component: type (bacterial/viral/parasitic) + curable/lifelong + vaccine chips
- `docs/plans/2026-02-26-week2-layer0-polish-design.md` — Design doc (Approach B chosen)
- `docs/plans/2026-02-26-week2-layer0-polish.md` — 12-task implementation plan

**Data model additions (`stiContent.ts`):**
- `tagline: {en, es}` — One-liner on every guide card and detail hero
- `facts: {type, curable, vaccine}` — Type union + two booleans for chip display
- 5 new full guide objects: HPV, Hepatitis B, Hepatitis C, Trichomoniasis, Mycoplasma genitalium
- All 10 guide section texts reformatted with markdown bullets/bold for scannability

**UI changes:**
- Guide index cards: tagline + 3 fact chips (type/curable/vaccine) + window period footer
- Guide detail page: QuickStatsBlock (FactChips + window period + CTA) replaces WindowPeriodCallout; unique icon per section; renderMarkdown for body text
- Calculator: per-row progress bar showing `daysWaited / minDays` ratio with color states (indigo=waiting, green=testable)

**Locale:** `en_US.json` + `es_MX.json` updated with `guide.*` keys

### Test Results
- 106/107 tests passing (1 pre-existing Header.test.tsx failure unrelated to this work)
- TypeScript: clean

### Key Commits (in order)
1. `d3bc20e` feat: add renderMarkdown micro-renderer utility
2. `84a792e` fix: guard whitespace-only strings in renderMarkdown
3. `a30d1ec` feat: add tagline and facts fields to all 10 STI entries
4. `45f40f4` test: add coverage for STI tagline and facts fields
5. `29b614b` feat: add Week 3 guide content + reformat existing guide sections
6. `4192686` test: update stiContent and GuideDetailPage tests for Week 3 content
7. `4524b7f` feat: add guide fact chip locale keys
8. `82beddb` feat: add shared FactChips component
9. `15655b5` feat: add CSS for fact chips, Quick Stats block, progress bar, markdown body
10. `6654376` feat: add tagline and fact chips to guide index cards
11. `0909a73` feat: add Quick Stats block, unique section icons, renderMarkdown to guide detail
12. `5f94265` feat: add per-row progress bar to calculator results

### Next Steps
- [ ] Week 2 done — move to Week 3: Symptom guide flow + clinic finder
- [ ] Pre-existing Header.test.tsx failure needs investigation (navbar--transparent class)
- [ ] Pre-existing lint error in CookieNoticeBanner.tsx (react-hooks/set-state-in-effect)
