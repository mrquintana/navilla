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
| Docs | Docusaurus | ✅ Complete |
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

```
navilla/
├── CONTEXT.md                    # This file - project tracking
├── .gitignore                    # Git ignore rules
│
├── docs/                         # Docusaurus documentation
│   ├── docs/                     # Markdown documentation
│   │   ├── getting-started/
│   │   ├── architecture/
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── development/
│   │   ├── onboarding/
│   │   ├── adrs/
│   │   └── api/
│   └── docusaurus.config.ts
│
├── database/                     # Database files
│   ├── SUPABASE_SETUP.md        # Setup guide
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_row_level_security.sql
│       └── 003_functions.sql
│
├── backend/                      # Spring Boot API
│   ├── pom.xml                  # Maven configuration
│   ├── checkstyle/              # Google Java style
│   ├── scripts/                 # Startup scripts
│   │   ├── start-production.sh
│   │   ├── start-development.sh
│   │   ├── start-troubleshooting.sh
│   │   └── STARTUP_GUIDE.md
│   └── src/
│       ├── main/
│       │   ├── java/app/navilla/
│       │   └── resources/
│       │       └── application.yaml
│       └── test/
│
└── frontend/                     # React application
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.tsx             # App entry point
        ├── App.tsx              # Root component with providers
        ├── router.tsx           # React Router configuration
        ├── queryClient.ts       # TanStack Query client
        ├── i18n.ts              # i18n configuration
        ├── index.css            # TailwindCSS setup
        ├── lib/
        │   └── supabase.ts      # Supabase client
        ├── contexts/
        │   └── AuthContext.tsx  # Auth state management
        ├── hooks/
        │   ├── useAuth.ts       # Auth hook
        │   └── useUser.ts       # User profile query
        ├── components/
        │   ├── auth/
        │   │   └── ProtectedRoute.tsx
        │   └── layout/
        │       ├── Header.tsx
        │       ├── Layout.tsx
        │       └── AuthLayout.tsx
        ├── pages/
        │   ├── HomePage.tsx
        │   ├── LoginPage.tsx
        │   ├── SignUpPage.tsx
        │   └── DashboardPage.tsx
        └── locales/
            ├── en_US.json
            └── es_MX.json
```

---

## Open Questions & Resolutions

| Question | Status | Resolution |
|----------|--------|------------|
| Degree limit for exposure calc? | Decided | 3 degrees for MVP |
| Connection deletion affects partner's graph? | Decided | Soft-delete (user removes from view, partner keeps history) |
| STI clearing removes past alerts? | Decided | "Resolved" status (alerts remain but marked resolved) |
| Email hashing algorithm? | Decided | SHA-256 with pepper for lookups |
| Backend hosting? | Open | Railway vs Fly.io vs Render |

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

---

## Running the Project

### Documentation
```bash
cd docs
npm install  # First time only
npm start    # Opens at http://localhost:3000
```

### Backend
```bash
cd backend

# Build
./mvnw clean package

# Development mode (with debug)
./scripts/start-development.sh

# Production mode
./scripts/start-production.sh

# Or via Maven directly
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Opens at http://localhost:5173
```

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
10. **Implement Health Status entity & API** - Next backend milestone
11. **Push CI/CD workflows to GitHub** - Requires commit & push
12. **Add frontend tests** - Unit tests for auth components
13. **Frontend Connections UI** - UI to manage connections

---

## Quick Commands

```bash
# Backend - run tests
cd backend && ./mvnw test

# Backend - check code style
cd backend && ./mvnw checkstyle:check

# Backend - build JAR
cd backend && ./mvnw clean package -DskipTests

# Frontend - run dev server
cd frontend && npm run dev

# Frontend - build for production
cd frontend && npm run build

# Docs - run local server
cd docs && npm start

# Docs - build for production
cd docs && npm run build
```
