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
- [ ] Health status reporting
- [ ] Basic exposure calculation

### Phase 3: Graph & Alerts
- [ ] Multi-degree exposure calculation
- [ ] Notification queue
- [ ] Weekly batch processing

### Phase 4-6: Frontend, Polish, Launch
- [ ] (Details to be added as we progress)

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
| Backend hosting? | Open | Railway vs Fly.io vs Render |
| Email provider? | Decided | SendGrid (SMTP for Supabase Auth) |

---

## Architecture Decisions Records (ADRs)

### ADR-001: Documentation Platform
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

For a quick start and a list of development commands, please refer to the main `README.md` file or run `./run.sh help`.

---

## Next Steps

1. ~~**Set up Supabase project**~~ ✅ Done
2. ~~**Configure environment files**~~ ✅ Done
3. ~~**Implement Security Config**~~ ✅ Done (JWT, CORS, encryption)
4. ~~**Create first API endpoint**~~ ✅ Done (health check)
5. ~~**Implement User Entity & API**~~ ✅ Done (GitHub Issue #4)
6. ~~**Add i18n infrastructure**~~ ✅ Done (en_US, es_MX with placeholders)
7. ~~**Create README & CONTRIBUTING**~~ ✅ Done
8. ~~**Implement authentication flow**~~ ✅ Done - Frontend Supabase integration
9. ~~**Implement Connection entity & API**~~ ✅ Done - Full CRUD with tests
10. ~~**Set up E2E testing**~~ ✅ Done - Playwright with CI integration
11. ~~**Fix API URL configuration**~~ ✅ Done - Centralized API client
12. ~~**Add UI background styling**~~ ✅ Done - Pattern backgrounds
13. **Implement Health Status entity & API** - GitHub Issue #10
14. **Comprehensive E2E test suite** - 10 test users, all edge cases (GitHub Issue #15)
15. **Frontend Connections UI** - GitHub Issue #11
16. **Frontend Unit Tests** - GitHub Issue #12
