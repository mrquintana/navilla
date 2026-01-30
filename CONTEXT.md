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
| Auth | Supabase Auth | Pending setup |
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
- [ ] Supabase project setup (requires manual browser login)

### Phase 2: Core Features
- [ ] User registration/login
- [ ] Connection request system
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
        └── index.css            # TailwindCSS setup
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

**Startup Scripts Created:**
- `scripts/start-production.sh` - G1GC, optimized heap, container-aware
- `scripts/start-development.sh` - Debug port 5005, verbose logging
- `scripts/start-troubleshooting.sh` - GC logging, heap dumps, JMX, Flight Recorder

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

1. **Set up Supabase project** - Go to supabase.com, create project, run migrations
2. **Configure environment files** - Copy .env.example to .env in backend and frontend
3. **Implement Security Config** - JWT validation with Supabase
4. **Create first API endpoint** - Health check / user endpoint
5. **Implement authentication flow** - Frontend Supabase integration

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
