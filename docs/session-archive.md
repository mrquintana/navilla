# Navilla — Session Archive

> Historical session notes archived from CONTEXT.md. These are preserved for reference but not loaded every session.
> For recent sessions, see `CONTEXT.md`.

---

## Session Notes (2026-03-05 — Lab Integration Framework)

### Accomplished

**Lab Integration Framework (41 files, 2496 insertions):**
- Pluggable LabProvider interface — `app.navilla.lab.LabProvider` with `getProviderCode()`, `validateInput()`, `verify()`. Same strategy pattern as visualization engine
- LabProviderRegistry — Spring auto-discovers all `@Component` LabProvider implementations, routes by provider code
- LabVerificationService — two-step flow: `verify()` calls lab API (no DB writes), `confirm()` saves results + syncs health_status
- MockDemoMxProvider — mock lab with orderId + patientId, returns 4 conditions (deterministic results)
- MockExpressProvider — mock lab with orderId only, returns 2 conditions
- MockLabController — dev-only endpoints at `/api/dev/mock-labs/` simulating external lab APIs
- LabProviderController — `GET /api/labs/providers`, `POST /api/labs/verify`, `POST /api/labs/confirm`
- Configuration — `application.yml` lab provider config with required fields per lab
- Migration 015 — `raw_lab_response_encrypted` column on test_visits, widened labs.provider to varchar(50)
- Lab.provider refactored — from enum (`LabProvider.CHOPO`) to plain String for pluggable architecture
- Frontend — types, API hooks (`useLabProviders`, `useLabVerify`, `useLabConfirm`), LabVerificationModal (3-step)
- i18n — 20 locale keys in both en_US and es_MX
- Documentation — `docs/docs/architecture/lab-integration.md` + `docs/docs/api/lab-verification.md`
- 395 backend tests passing (26 new tests)

---

## Session Notes (2026-03-04 — Week 10 Phase 3: Network Constellation + Profile Polish)

### Accomplished

**Network Constellation Visualization (16 files, 1279 insertions):**
- Pluggable visualization engine — `VisualizationEngine` interface in `lib/visualization/types.ts`
- Canvas 2D engine — `Canvas2DEngine.ts` (~440 lines): seeded PRNG, 3-layer rendering, constellation lines, twinkle animation
- useNetworkVisualization hook — composes `/api/exposures` + `/api/catalog/stages` into `NetworkData`
- NetworkVisualizationHost — React wrapper bridging imperative engine to declarative lifecycle
- ShareConstellationModal — identity picker with Web Share API + download fallback
- NetworkPage — full-screen immersive dark page, reciprocity gate, overlay UI
- Dashboard preview card — 200px tall canvas preview with stage badge
- Navigation — "Network" link in header nav
- i18n — 14 locale keys in both en_US and es_MX

**Profile Page Consolidation:**
- Moved Language switcher from Settings → Preferences
- Removed old Settings card entirely
- Sign Out button between Preferences and Danger Zone
- Segmented control for visibility settings
- Header initials avatar CSS

---

## Session Notes (2026-03-04 — Week 10 Phase 3: Network Foundation)

- Migration `014_network_foundation.sql`: 6 new tables + 3 ALTER TABLE
- DB-driven condition catalog replacing hardcoded `ConditionType` enum
- Runtime app config (AppConfig key-value store)
- Network stages (configurable constellation thresholds)
- Reciprocity system (opt-in/opt-out with 15-day cooldown)
- Phone matching (SHA-256 + pepper, mutual match detection)
- ConnectionType enum (PHONE_MATCH, NOTIFICATION_MATCH, EXPLICIT, LINK)
- Frontend: Reciprocity card, phone field, catalog-driven dropdowns
- 370 backend tests passing

---

## Session Notes (2026-03-04 — Week 9 Continued: Email Delivery Validation)

- Email delivery validated end-to-end via SendGrid HTTP API on Railway
- SMTP → SendGrid HTTP API migration (Railway blocks ALL SMTP ports)
- DevTestController kept at `/api/dev/*` for email testing
- Sender: `no-reply@navilla.app`
- 299 backend tests passing

---

## Session Notes (2026-03-03 — Week 9: PWA + Push Notifications + Caching + Email)

- Caffeine cache setup (4 named caches)
- Push subscription backend (migration 013)
- Web Push service (VAPID/RFC 8030 via jose4j)
- Email infrastructure (SendGrid HTTP API v3, Thymeleaf templates)
- Email digest job (weekly digest)
- PWA manifest + icons (vite-plugin-pwa, injectManifest)
- Custom service worker (Workbox precaching + runtime caching)
- Install prompt + offline indicator + update prompt
- 299 backend tests passing

---

## Session Notes (2026-03-03 — Week 8: Personal Insights + Onboarding + Quick Wins)

- Toast notification system (global ToastContext)
- Route-level code splitting (31 lazy-loaded pages, 58 JS chunks)
- Encounter type + protection fields (migration 012)
- Personal Insights API + page (3-card layout)
- Guided onboarding flow (3-step modal)
- PrEP adherence streaks
- 258 backend + 273 frontend = 531 tests passing

---

## Session Notes (2026-03-03 — Week 7: Smart Reminders + Medication Tracking)

- Migration 011: 5 new tables (medications, medication_logs, vaccinations, reminders, reminder_settings)
- Configuration-driven health catalog (YAML, no hardcoded enums)
- Backend: MedicationService, VaccinationService, ReminderService, ReminderCalculationEngine, ReminderSchedulerJob
- Frontend: 15 DTO types, 14 API methods, 10 new components
- Health Log → "My Health" tabbed page
- Dashboard redesign: "Next Up" widget, quick actions
- 234 backend + 237 frontend = 471 tests passing

---

## Session Notes (2026-02-28 — Landing Page Polish + Week 7 Prep)

- Landing page: real screenshots in feature showcase cards
- Security page: full i18n rewrite (40+ locale keys)
- How It Works page: complete rewrite (8 sections)
- ContentPage.tsx: fixed hardcoded "Back to Home" → i18n
- Pre-rendering: extended from 13→25 routes

---

## Session Notes (2026-02-27 — Week 6: Health Log)

- Migration 010: 4 new tables (labs, lab_credentials, test_visits, test_results)
- HealthLogService (visit CRUD, summary, condition history, write-through sync)
- 11 REST endpoints under `/api/health-log/`
- 159 backend tests, 236 frontend tests

---

## Session Notes (2026-02-27 — Week 5: Journal UX Polish)

- Calendar smart skip navigation
- Encounter date validation (DOB + future)
- View toggle hierarchy
- 196 frontend tests passing

---

## Session Notes (2026-02-27 — Week 5: Encounter Journal + Partners)

- Migration 008 + 009: encounter_journal, journal_field_templates, journal_partners tables
- Backend: EncounterJournalService, JournalPartnerService, 16+ REST endpoints
- Frontend: JournalPage (timeline/calendar), JournalEntryModal, JournalCalendar, partners feature
- 105 backend + 196 frontend tests

---

## Session Notes (2026-02-26 — Week 4: SEO + Cost Estimator)

- Testing cost estimator with real MXN pricing (CAPASITS, Chopo, Salud Digna, Marie Stopes)
- JSON-LD structured data on all Layer 0 pages
- OG/social meta tags, sitemap (22 URLs)
- SignUpCTA component on all Layer 0 pages
- 148 tests passing

---

## Session Notes (2026-02-26 — Week 2-3: Layer 0 Polish + Symptom Filter)

- renderMarkdown micro-renderer utility
- FactChips component (type/curable/vaccine)
- All 10 STI guide content objects
- Guide cards enriched with taglines, fact chips, window period
- Calculator progress bars
- Symptom filter on guides index (useSymptomFilter hook, chip UI)
- 106 tests passing

---

## Session Notes (2026-02-24)

- Removed infrastructure names from public pages
- Fixed Mixed Content error (ip-api.com → Intl.DateTimeFormat)
- Extended geolocation to drive i18n language
- Plus Jakarta Sans web font loaded site-wide
- Micrometer OTLP observability (NavillaMetrics, domain metric beans)

---

## Session Notes (2026-02-12 — Seed Script Overhaul)

- Rewrote seed-users.mjs into 5-phase modular system
- `--size=N` flag, `.seed-state.json` resumability
- Supabase free tier rate-limits signups (~30/hr) — use Admin API

---

## Session Notes (2026-02-05 — MVP Launch Blockers)

- How It Works page (8 sections from ADR-008)
- Account deletion UI (type DELETE to confirm)
- Dashboard threshold UX (progress bar, X/3 message)
- E2E test suite rebuilt (6 spec files, ~40 tests)

---

## Session Notes (2026-02-05)

- Health Status UX overhaul (two-column layout, in-app help modals)
- Notifications polling (30s interval)

---

## Session Notes (2026-02-04)

- Seed SQL for 7 dev users + connections + health status
- Dev-only tooling (/api/exposures/recompute, /api/dev/users/hash, /api/dev/exposures/inspect)
- E2E tests reset to minimal smoke suite

---

## Session Notes (2026-02-02 — AWS IPv6 Fix)

- Diagnosed Supabase IPv6-only database + EC2 IPv4-only issue
- Enabled IPv6 on AWS via Terraform
- Docker `network_mode: host` for IPv6

---

## Session Notes (2026-02-01 — Frontend Auth + Connections)

- Complete frontend auth system (Supabase)
- Connection entity + API (15 unit + 12 integration tests)
- Postman collection created
- Multi-step signup form
- Playwright E2E framework

---

## Session Notes (2026-01-30 — Project Initialization)

- Docusaurus docs (30+ docs), Git repo, database migrations
- Spring Boot 4.0.2 backend scaffolded (Maven, Java 25)
- React + Vite + TypeScript frontend scaffolded
- Security config (JWT, CORS, encryption), GitHub Actions CI/CD
- Docker multi-stage builds, Gitleaks + OWASP scanning
- i18n infrastructure (react-i18next, MessageSource)
- User entity + API

---

## MVP Checklist (Completed)

- [x] Sign up / sign in end-to-end
- [x] Profile basics (display name, username, avatar, visibility)
- [x] Connection flow (send, accept, deny, remove)
- [x] Health report flow (add positive/negative, clear/delete)
- [x] Exposure overview (conditions + degree + refresh)
- [x] How It Works page (ADR-008)
- [x] Account deletion (GDPR/CCPA)
- [x] Network size + threshold UX
- [x] Clear explanations on Health/Exposure
- [x] Loading states, error messages
- [x] Notifications polling
- [x] Dashboard threshold progress bar
- [x] Seed data for testing
- [x] Dev tools (recompute + inspect)
- [x] E2E tests (auth, connections, health, dashboard)
- [x] No identity leakage
- [x] Private profiles protected
