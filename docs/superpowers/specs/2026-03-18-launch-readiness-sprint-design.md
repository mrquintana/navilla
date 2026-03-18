# Launch Readiness Sprint — Design Spec

> **Scope:** Weeks 15-16 (Phase 4). Security hardening + polish + verification before soft launch.
> **Approach:** Security-first (Week 15), then polish + verify (Week 16).
> **Timeline:** No rush — thoroughness over speed.

---

## Context

Layer 3 (anonymous notifications) has been cut — probably won't do, reconsider post-launch. This frees Weeks 15-16 to focus entirely on making the existing product launch-ready.

### Current State (as of 2026-03-18)

**Already solid:**
- Input validation: 96% of DTOs have `@Size` constraints, frontend 100% `maxLength`
- Error handling: no stack traces leak, i18n message keys only
- Actuator: locked to `health` + `info`, production suppresses details
- Auth: Supabase JWT with ES256, CORS configured, CSP/HSTS/X-Frame-Options headers set
- Encryption: AES-256-GCM on sensitive fields
- E2E: core flows covered (auth, dashboard, connections, health, account deletion, seed data)
- Tests: 476 backend, 285 frontend
- Auth rate limiting: handled by Supabase (login/signup brute-force protection is Supabase's responsibility, not the backend)

**Gaps:**
- No rate limiting (except phone matching)
- No per-user resource caps
- 2 DTOs missing validation (`SnoozeReminderRequest`, `UpdateReminderSettingsRequest`)
- No request body size limits configured
- Missing security headers (`Referrer-Policy`, `Permissions-Policy`)
- No abuse detection alerting
- No E2E for verification cards, phone matching, journal lifecycle, reminders, health log
- Content not audited against official sources
- Mobile polish not verified across all screens
- Stale CORS origin (`http://54.159.90.88` — old AWS IP) in `application.yaml`
- `server.error.include-message: always` in dev profile — must verify production profile overrides this

---

## Week 15: Security Hardening

### 1. Rate Limiting (Bucket4j + Spring Boot)

Token bucket algorithm with Caffeine-backed in-memory storage.

**Dependency:** Add `bucket4j-spring-boot-starter` to `pom.xml` (not currently present).

**Implementation:** A `RateLimitFilter` (servlet filter) running after CORS and Spring Security filters but before controllers (filter order ~10). Extracts user identity from `SecurityContextHolder` (already populated by OAuth2 resource server filter at that point). For unauthenticated requests, uses client IP from `X-Forwarded-For` header (Railway runs behind a reverse proxy — `request.getRemoteAddr()` returns the LB IP, not the client).

**Important:** The filter writes 429 responses directly (not via `GlobalExceptionHandler`, which only handles exceptions thrown from controllers). The response body must match the existing `ApiError` JSON format for consistency. Include `Retry-After` header in seconds format (e.g., `Retry-After: 60`).

**IP extraction:** Add `server.forward-headers-strategy: framework` to `application.yaml` (not currently configured — verified 2026-03-18). Required for Railway's reverse proxy — without this, all clients share a single IP bucket.

**Three tiers:**

| Tier | HTTP Methods | Limit | Endpoints |
|------|-------------|-------|-----------|
| Write | POST, PUT, PATCH, DELETE | 30 req/min per user | All `/api/**` write operations |
| Read | GET | 120 req/min per user | All `/api/**` read operations |
| Sensitive | All | 10 req/min per user | See list below |

**Sensitive tier endpoint paths:**
- `POST /api/connections` (create connection request)
- `POST /api/connections/phone-match` (phone matching)
- `POST /api/connections/respond` (accept/deny)
- `POST /api/push/subscribe` (push subscription)

**Global fallback:** 300 req/min per IP (catches unauthenticated abuse on public endpoints).

**Response:** `429 Too Many Requests` with `Retry-After` header (seconds format). The filter writes this directly. Separately, update `GlobalExceptionHandler`'s existing `RateLimitException` handler to also include `Retry-After` — this covers the phone-match rate limit that throws from the service layer.

**Configuration:** All limits in `application.yaml` so they can be tuned without code changes.

**Public endpoints** (`/api/catalog`, `/api/public/**`): IP-based limiting only (no JWT available).

**Scaling note:** Rate limit state is per-instance (Caffeine is in-memory). This is fine for soft launch with a single Railway instance. If the app scales to multiple replicas, rate limiting would need to move to Redis. No action needed now.

**i18n:** Add rate limit message keys to both `en_US.json` and `es_MX.json`.

**Testing:** Unit tests for `RateLimitFilter` (all three tiers + IP fallback + Retry-After header). Integration test confirming 429 response on exceeding limits.

### 2. Per-User Resource Caps

Hard limits checked on every create operation via a `ResourceCapService`. Each service calls it at the top of its create method. Returns `409 Conflict` with i18n message if cap exceeded.

**Exception:** Use a dedicated `ResourceCapExceededException` (extends `RuntimeException`) with its own handler in `GlobalExceptionHandler`, to distinguish from other 409 conflicts (like duplicate connections).

| Resource | Cap | Rationale |
|----------|-----|-----------|
| Journal entries | 10,000 | ~7/week for 27 years |
| Partners | 500 | Generous upper bound |
| Test visits | 5,000 | ~1/week for 96 years |
| Labs | 50 | Lab providers |
| Connections | 500 | Matches partners cap |
| Custom field templates | 10 | Per roadmap spec |
| Verification cards | 20 | Practical limit |
| Reminders | 50 | Practical limit |
| Medications | 50 | Practical limit |

All caps configurable in `application.yaml`.

No frontend changes needed — API error responses surface through existing error handling.

**i18n:** Add resource cap message keys to both `en_US.json` and `es_MX.json`.

**Testing:** Unit tests for `ResourceCapService` (each resource type at cap, below cap, over cap). Integration test confirming 409 response.

### 3. Validation Sweep

**Fix 2 DTOs:**

| DTO | Field | Fix |
|-----|-------|-----|
| `SnoozeReminderRequest` | `until` | Change type from `String` to `Instant` (let Jackson parse ISO-8601). Add `@NotNull` + `@Future`. If String type must stay, add `@Size(max = 30)` + `@Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}.*")` |
| `UpdateReminderSettingsRequest` | `quietHoursStart`, `quietHoursEnd` | Add `@Size(max = 5)` + `@Pattern(regexp = "^\\d{2}:\\d{2}$")` for HH:mm format |

**Request body size limits (application.yaml):**
```yaml
server:
  tomcat:
    max-http-form-post-size: 1048576  # 1MB — NOTE: property renamed in Spring Boot 3.x+
spring:
  servlet:
    multipart:
      max-file-size: 1MB
```

**Note:** Verify the correct property name for Spring Boot 4.0.2. The old `max-http-post-size` was renamed to `max-http-form-post-size` in Spring Boot 3.x. Using the wrong name will be silently ignored.

**Full pass:** Verify all ~26 request DTOs + 2 nested DTOs (`CustomFieldDto`, `LabCredentialDto`) have constraints. Fix any gaps found.

### 4. OWASP Review + Security Headers

**Verify existing protections:**
- SQL injection: JPA parameterized queries (already safe)
- XSS: React auto-escaping (already safe)
- CSRF: stateless JWT (N/A)
- Auth: Supabase JWT verification (already solid). Supabase handles login/signup rate limiting
- Encryption: AES-256-GCM (already in place)

**IDOR (Insecure Direct Object Reference) review:**
- Verify every authenticated endpoint checks resource ownership (user A cannot access user B's journal entries by guessing UUIDs)
- Audit all service methods that take a resource ID — confirm they filter by authenticated user's hash
- This is critical for a health app with sensitive personal data

**Check/tighten:**
- CSP header: currently `default-src 'self'` — audit what external resources the app loads. Known external resources to account for: `fonts.gstatic.com` (font files), `fonts.googleapis.com` (font CSS), `*.supabase.co` (auth + storage API). Use `Content-Security-Policy-Report-Only` first to detect violations before enforcing changes. Add appropriate `font-src`, `style-src`, `img-src`, `connect-src` directives
- Error responses: confirm no endpoint leaks user data in error payloads. Verify `server.error.include-message` is `never` in production profile (dev profile currently has `always`)
- Actuator: confirm production profile suppresses details
- CORS: verify production config only allows `navilla.app` origin. Remove stale `http://54.159.90.88` (old AWS IP) from allowed origins in `application.yaml`. Add `Retry-After` to CORS `exposedHeaders` so the frontend can read it from 429 responses
- Add `Referrer-Policy: strict-origin-when-cross-origin` if missing
- Add `Permissions-Policy` header if missing

**Log audit for PII:**
- Scan existing log statements for inadvertent PII (phone numbers, email addresses, health data)
- Ensure new rate limit / abuse detection logs use user hashes, not identifiable information

**Dependency vulnerability scan:**
- Backend: `mvn dependency:tree` + check against known CVEs (or use `mvn org.owasp:dependency-check-maven:check`)
- Frontend: `npm audit`
- Fix critical/high vulnerabilities. Document accepted risks for medium/low.

### 5. Abuse Detection (Grafana/Loki)

Structured log entries from rate limit filter and resource cap service, with Loki LogQL queries powering Grafana alert rules.

| Alert | Trigger |
|-------|---------|
| High write volume | >100 writes/hour from single user |
| High request volume | >1,000 requests/hour from single IP |
| Auth failures | >20 failed auth attempts/hour from single IP (if observable from backend logs — auth is delegated to Supabase, so this may require Supabase webhook or log forwarding) |
| Resource cap hits | Any user hitting a resource cap |

Non-blocking: if alerting setup takes longer than expected, rate limiting + caps are the actual protection layer.

---

## Week 16: Polish + Verify

### 6. Content Verification

Audit all Layer 0 health content against CDC/WHO/CENSIDA sources.

**Scope:**
| Content | Source File | Check Against |
|---------|------------|---------------|
| 10 STI guides | `stiContent.ts` | CDC fact sheets + WHO data |
| Symptom-to-STI mappings | `SYMPTOM_LABELS` + `symptoms[]` | CDC symptom guides |
| Window period calculator | Calculator logic + data | CDC/WHO testing window recommendations |
| Cost estimator | Cost data source | Current Mexico pricing |

**Process:**
1. Extract claims/data points from code
2. Cross-reference against official sources
3. Fix discrepancies directly where possible
4. Flag anything needing medical judgment for user review

**Note:** This is the first pass. A thorough medical accuracy review with authoritative sources is a separate pre-launch gate (see below).

### 7. Mobile Polish Pass

Thorough walkthrough at 375px (iPhone SE) and 390px (iPhone 14) viewports.

**Checklist per screen:**
- Touch targets minimum 44x44px
- Text readability — no truncation, no overflow
- Forms usable with mobile keyboard (proper input types)
- Modals/drawers don't overflow screen
- Tables/data views degrade gracefully
- Navigation works with thumb reach

**Scope:** All authenticated pages (dashboard, journal, health log, network, connections, notifications, insights, verification card, profile) + landing page + Layer 0 public pages.

**PWA:** Verify install experience, splash screen, standalone mode.

Fix issues directly. Flag design-decision items with screenshots for user review.

### 8. E2E Test Expansion

| Priority | Flow | Rationale |
|----------|------|-----------|
| High | Verification cards (create, share, public view) | Public-facing — breakage visible to non-users |
| High | Phone matching flow | Core connection mechanism |
| High | Journal entry lifecycle (create, edit, delete) | Most-used daily feature |
| Medium | Reminders (create, snooze, quiet hours) | Users depend on these |
| Medium | Health log (add test visit, add lab result) | Core Layer 1 value |
| Low | Medication tracking | Smaller feature |
| Low | Negative/boundary tests | Server-side validation already handles most abuse |

**Test data:** E2E tests run against production. Ensure test accounts are isolated and test data cleanup is handled (extend existing seed-data pattern).

### 9. Performance Check

Informational pass — results inform optimization priorities but do not block launch unless critical issues are found (e.g., >3s page load, >2MB bundle).

| Area | Action | Concern threshold |
|------|--------|-------------------|
| Bundle size | `npm run build`, check gzipped output | >500KB gzipped |
| Lazy loading | Verify all auth routes are code-split | Any auth route in main bundle |
| API response times | Spot-check key endpoints | >500ms |
| N+1 queries | Scan services for batch-fetch opportunities | Any unbounded loop query |
| Cache effectiveness | Verify 6 Caffeine caches are being hit | Cache miss rate >50% |
| Assets | Check for large uncompressed images/assets | Any asset >200KB |

---

## Pre-Launch Gates (Before Week 17)

| Gate | Action |
|------|--------|
| `/api/dev/**` endpoints | `MockLabController` (`/api/dev/mock-labs/**`) is `permitAll()` in SecurityConfig — fully public, no auth. `DevTestController` (`/api/dev/test-email`, `/api/dev/email-status`) already requires JWT but can send arbitrary emails via SendGrid. Both must be disabled or removed before production. Note: MockLabController is also gated by `NAVILLA_DEV_MODE` env var, but the controller still responds — env var alone is insufficient |
| Medical accuracy review | Thorough review of all health content against CDC/WHO/CENSIDA de facto sources. Consider whether a medical professional should review before launch |
| Dependency vulnerabilities | All critical/high CVEs resolved |

---

## Post-Implementation Checklist

Per CLAUDE.md, after completing this sprint:
- Update `CONTEXT.md` with session notes
- Update Docusaurus API docs for new 429 responses and rate limit headers
- Update Postman collection with rate limit behavior
- Update both locale files (`en_US.json`, `es_MX.json`) with new i18n keys
- All new code has unit and integration tests
- Backend tests pass: `cd backend && ./mvnw test`
- Frontend lint passes: `cd frontend && npm run lint`

---

## Out of Scope

- Layer 3 anonymous notifications (probably won't do)
- CDN setup / infrastructure scaling (post-launch)
- Full database query optimization (post-launch, needs real traffic data)
- Native mobile (separate project)
- New features of any kind
- Grafana/Loki infrastructure setup (already exists)
- Auth rate limiting (Supabase's responsibility)
