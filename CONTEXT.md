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
| Frontend | React + Vite + TypeScript | Not started |
| Backend | Java 21 + Spring Boot 3.x | Not started |
| Database | PostgreSQL (Supabase) | Not started |
| Auth | Supabase Auth | Not started |
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

**Decision:** Technology stack (ADR-002)
- **Frontend:** React + Vite + TypeScript
- **Backend:** Java 21 + Spring Boot 3.x
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth
- **Why:** Type safety, mature security libraries, free tiers for MVP
- **Status:** ✅ Documented

---

## Progress Tracker

### Phase 1: Foundation
- [x] Project directory created
- [x] Context tracking file created (CONTEXT.md)
- [x] Docusaurus documentation site setup
- [x] Documentation structure created (30+ docs)
- [x] ADRs documented
- [ ] Git repository initialized
- [ ] Database schema implementation (SQL files)
- [ ] Supabase project setup
- [ ] Spring Boot project scaffolding
- [ ] React + Vite project scaffolding

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

## Documentation Structure

```
docs/
├── getting-started/
│   ├── overview.md
│   ├── setup.md
│   └── quick-start.md
├── architecture/
│   ├── overview.md (with Mermaid diagrams)
│   ├── system-design.md
│   ├── data-model.md (full schema)
│   ├── privacy-model.md
│   └── security.md
├── backend/
│   ├── overview.md
│   ├── project-structure.md
│   ├── authentication.md
│   ├── database.md
│   └── services.md
├── frontend/
│   ├── overview.md
│   ├── project-structure.md
│   ├── components.md
│   ├── state-management.md
│   └── styling.md
├── development/
│   ├── contributing.md
│   ├── code-style.md
│   ├── testing.md
│   └── deployment.md
├── onboarding/
│   ├── new-hire.md
│   ├── codebase-tour.md
│   └── first-task.md
├── adrs/
│   ├── index.md
│   ├── adr-001-documentation-platform.md
│   └── adr-002-tech-stack.md
└── api/
    ├── overview.md
    ├── authentication.md
    ├── users.md
    ├── connections.md
    ├── health-status.md
    └── exposures.md
```

---

## Open Questions & Resolutions

| Question | Status | Resolution |
|----------|--------|------------|
| Degree limit for exposure calc? | Open | Considering 3 degrees for MVP |
| Connection deletion affects partner's graph? | Open | Leaning toward soft-delete (user removes from their view, partner keeps history) |
| STI clearing removes past alerts? | Open | Leaning toward "resolved" status (alerts remain but marked resolved) |
| Email hashing algorithm? | Open | SHA-256 with pepper for lookups, need to decide for password-like hashing |
| Backend hosting? | Open | Railway vs Fly.io vs Render |

---

## Architecture Decisions Records (ADRs)

### ADR-001: Documentation Platform
- **Status:** Accepted
- **Decision:** Use Docusaurus
- **Full details:** `/docs/docs/adrs/adr-001-documentation-platform.md`

### ADR-002: Technology Stack
- **Status:** Accepted
- **Decision:** React/Vite (FE), Java/Spring Boot (BE), Supabase (Auth/DB)
- **Full details:** `/docs/docs/adrs/adr-002-tech-stack.md`

---

## Session Notes

### Session 1 - 2026-01-30
**Duration:** Initial setup session

**Accomplished:**
- Reviewed requirements document from `/Users/miguelramos/Downloads/Navilla_Requirements.md`
- Identified technical considerations:
  - Graph traversal efficiency (recursive CTEs vs application-level BFS)
  - Encryption strategy (AES-256-GCM, per-user keys)
  - Inference attack prevention (3-connection minimum, batched notifications)
- Created project structure (`docs/`, `backend/`, `frontend/`)
- Set up Docusaurus with Mermaid support
- Created comprehensive documentation (30+ documents):
  - Getting started guides
  - Architecture documentation with diagrams
  - API reference
  - New hire onboarding
  - Development guidelines
  - ADRs

**Key Technical Insights:**
1. Email hashing: Use SHA-256 with application pepper for lookups, store encrypted copy for recovery
2. Graph traversal: Start with application-level BFS, consider PostgreSQL recursive CTEs for performance
3. Encryption: Derive per-user keys from application secret + user ID (since we don't have password access via Supabase)
4. RLS: Use as defense-in-depth, primary authorization in application layer

**Next Steps:**
1. Initialize Git repository
2. Set up Supabase project
3. Create database migrations (SQL files)
4. Scaffold Spring Boot backend
5. Scaffold React frontend

---

## Quick Links

- **Requirements:** `/Users/miguelramos/Downloads/Navilla_Requirements.md`
- **Documentation:** `docs/` (run `cd docs && npm start`)
- **Backend:** `backend/` (Spring Boot - not yet created)
- **Frontend:** `frontend/` (React + Vite - not yet created)
- **This file:** `CONTEXT.md`

---

## Running the Project

### Documentation
```bash
cd docs
npm install  # First time only
npm start    # Opens at http://localhost:3000
```

### Backend (when ready)
```bash
cd backend
./gradlew bootRun  # Opens at http://localhost:8080
```

### Frontend (when ready)
```bash
cd frontend
npm install
npm run dev  # Opens at http://localhost:5173
```
