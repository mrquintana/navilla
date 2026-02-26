# Claude Code Project Instructions

## Commit Preferences

- **No Co-Authored-By signature** - Do not add "Co-Authored-By: Claude" lines to commits
- **Commit frequently** - After completing 3-5 related changes or every 15-20 minutes of work, commit and push
- **Don't accumulate changes** - Large uncommitted changesets are risky. Commit early and often
- **Push after commit** - Always push to remote after committing to keep Railway environment up-to-date
- **Commit package-lock.json** - Whenever `npm install` runs (adding/removing packages), always stage and commit `package-lock.json` alongside `package.json`. Railway uses `npm ci` which fails if they are out of sync

## Post-Implementation Checklist

After completing any significant work, **always update the following**:

### 1. CONTEXT.md (Required)
- Add session notes with what was accomplished
- Update Progress Tracker checkboxes
- Update "Next Steps" section
- Add any new decisions to Decision Log
- Update Project Structure if new directories/files added

### 2. Documentation in /docs (Required for feature work)
- Update relevant docs in `docs/docs/` for any:
  - New components → `docs/docs/frontend/components.md`
  - New API endpoints → `docs/docs/api/`
  - Architecture changes → `docs/docs/architecture/`
  - New hooks/contexts → `docs/docs/frontend/state-management.md`
  - Project structure changes → `docs/docs/frontend/project-structure.md`

### 3. GitHub Issues (Required for milestones)
- **All milestones must be tracked as GitHub issues**
- Close completed issues with `gh issue close <number> --comment "details"`
- Add comments on progress with `gh issue comment <number> -b "message"`
- Create new issues for discovered work/next milestones with `gh issue create`
- Check open issues before starting work: `gh issue list`
- Use labels: `backend`, `frontend`, `phase-2`, `enhancement`

### 4. Locale Files (For UI text changes)
- Update both locale files when adding UI text:
  - `frontend/src/locales/en_US.json`
  - `frontend/src/locales/es_MX.json` (Spanish translations or English placeholders)

### 5. Tests (Required for code changes)
- **All new code must have unit and integration tests**
- Run backend tests: `cd backend && ./mvnw test`
- Run frontend lint: `cd frontend && npm run lint` # Use `npm test` for unit tests once configured
- Backend test locations:
  - Unit tests: `backend/src/test/java/app/navilla/service/`
  - Integration tests: `backend/src/test/java/app/navilla/controller/`

### 6. Postman Collection (For API changes)
- Update Postman collection when adding/modifying API endpoints
- Location: `docs/static/postman/navilla-api.postman_collection.json`

## Quick Reference

```bash
# Check open GitHub issues
gh issue list

# Close an issue
gh issue close <number> --comment "Completed in session"

# View issue details
gh issue view <number>

# Create new issue
gh issue create --title "Title" --body "Description"
```

## Testing Requirements

### Before Every Commit (Required)
- **Run local tests before committing** - Never commit without verifying tests pass
- Frontend: `cd frontend && npm run lint` # Use `npm test` for unit tests once configured
- Backend: `cd backend && ./mvnw test`
- Fix any errors before committing

### E2E Testing
- E2E tests run on production environment after deployment
- Run with: `cd frontend && npm run test:e2e`

### Database Migrations
- Migration files: `database/migrations/` (numbered SQL files, e.g., `008_encounter_journal.sql`)
- Run migrations via Supabase SQL Editor or Supabase CLI
- **Every new table or schema change requires a migration file** — never modify the database directly
- Include both the migration AND rollback SQL in comments at the top of each file
- Update `database/SUPABASE_SETUP.md` if setup steps change
- Backend JPA entities must match the migration schema exactly

## Project Context
- Main tracking file: `/CONTEXT.md`
- Product roadmap: `/UPCOMING_FEATURES_AND_ROADMAP.md` (source of truth for what to build)
- Documentation site: `/docs` (Docusaurus)
- Backend: Java 25 + Spring Boot 4.0.2
- Frontend: React 19 + Vite + TypeScript + TailwindCSS
- Auth: Supabase Auth
- Email: SendGrid (SMTP via Supabase)
- Hosting: Railway (backend + frontend)
- i18n: react-i18next (en_US, es_MX)
- Primary language: English (en_US)
- Secondary language: Spanish (es_MX) — Mexico is the first target market but English is the main language

## Development Workflow

### How Sessions Work
- The user is the **product owner** — they review, test, and provide design direction
- The agent does implementation, testing, documentation, and code review
- Always read `UPCOMING_FEATURES_AND_ROADMAP.md` at session start to understand current priorities
- When the user says "Build [feature]" or "Start Week X", find the relevant section in the roadmap

### Session Pattern
1. Read the roadmap to understand scope and requirements
2. Enter plan mode — propose implementation approach for user approval
3. Build using TDD: write tests first, then implementation
4. Commit frequently (every 3-5 changes) and push
5. Flag feature for user review: "Ready for review — check [URL]"
6. Iterate based on user feedback until approved
7. Move to next feature

### Quality Standards (Enforced Every Session)
- **UI/UX**: Use the frontend-design skill for all UI work. Design must be warm, modern, non-clinical, and mobile-first. Never produce generic or template-looking interfaces. The app should feel like a premium consumer product, not a government health site. **Trust is the #1 asset** — if the app looks janky, nobody will trust it with their health data. UX polish and privacy signaling deserve as much effort as features
- **Security**: Privacy-by-design. Encrypt sensitive data. OWASP top 10 checks. Never expose user health data in API responses to other users. Follow the privacy model in the roadmap exactly
- **Architecture**: SOLID principles. Clean separation of concerns. Service layer pattern in backend. Custom hooks + context in frontend. No god components or god services
- **Performance**: Lazy load routes. Optimize bundle size. Cache Layer 0 content. Minimize API calls. Use React Query effectively
- **Testing**: Unit tests for all backend services. Frontend component tests for interactive features. E2E tests for critical user flows. Tests MUST pass before commit
- **Documentation**: Update Docusaurus docs for new features. Update Postman for new endpoints. Keep locale files in sync
- **i18n**: All UI text in locale files, never hardcoded. English (en_US) is primary. Spanish (es_MX) must always be updated alongside
- **Accessibility**: WCAG 2.1 AA compliance. Semantic HTML. Keyboard navigation. Screen reader support. This is a health app — accessibility is non-negotiable

### React Native Prep (Enforce Now)
All frontend code must be structured for future portability to React Native:
- **Never put business logic inside UI components** — extract into hooks or `lib/` utilities
- **API calls live in `lib/api.ts` only** — components never contain fetch calls or endpoint URLs
- **Types live in `types/`** — every API response shape, form shape, and enum in dedicated type files
- **Validation lives in `lib/validators.ts`** — pure functions, no DOM, no React
- **Use React Query hooks as the data layer** — all data access through custom hooks in `hooks/`
- **Locale files are JSON** — shareable as-is with React Native

### Design Principles
- **Warm, not clinical**: The app should feel like a trusted friend, not a doctor's office
- **Empowering, not scary**: Every screen should make users feel in control, not alarmed
- **Private by default**: Every feature assumes maximum privacy until the user explicitly opts to share
- **Mobile-first**: Design for phone screens first, desktop is secondary (most users will use PWA)
- **Non-judgmental**: No shame-inducing language, colors, or patterns. Neutral data presentation
- **Bilingual from day one**: Every string in both en_US and es_MX

### Design System (Enforced — do not deviate)

**Brand typography:**
- **"Navilla" the brand name**: Always rendered in Fraunces (`--font-display`) — header logo, hero, marketing headings. The ONE exception: when "Navilla" appears inside a body-text sentence, it stays in the body font
- **Display headings** (h1, h2 on marketing/landing pages): Fraunces
- **Everything else** (nav labels, body text, buttons, forms, inputs): Plus Jakarta Sans
- **Never introduce a third font** without explicit product owner approval

**Color palette — Indigo + Warm Stone:**
- **Primary**: `#4f46e5` (indigo-600) — buttons, interactive elements, brand accent
- **Primary light**: `#6366f1` (indigo-500) — links, decorative accents, eyebrows
- **Primary dark**: `#4338ca` (indigo-700) — hover states, pressed buttons
- **Primary darkest**: `#312e81` (indigo-900) — dark section backgrounds (hero, CTA)
- **Surfaces**: Warm stone neutrals (`#fafaf9` background, `#f5f5f4` secondary, `#1c1917` foreground)
- **Borders**: Warm stone (`#d6d3d1` border, `#e7e5e4` border-light)
- **Semantic colors stay fixed**: success green `#16a34a`, warning amber `#e3a008`, error red `#dc3545`

**Why indigo (for stakeholders):**
> Blue signals trust — every bank and hospital uses it. But pure blue signals *institution*. Indigo keeps the trust while adding warmth and personality. It says: we're serious about your health AND we have taste. Combined with warm stone neutrals, it positions Navilla as a premium consumer product — closer to Headspace than to a government health portal.

**Color consistency rules:**
- NEVER introduce colors outside the palette without checking the design system first
- ALL interactive elements (buttons, links, focus rings, active states) use the indigo primary palette
- ALL neutral surfaces (backgrounds, cards, borders) use the warm stone palette
- Dark sections (hero, CTA, footer) use `--color-foreground` → `--color-primary-darkest` gradients
- If something "looks off" against the rest of the site, it's probably using an off-palette color — fix it, don't add a new one

**Landing page rhythm:**
- DARK hero (indigo gradient) → LIGHT content sections (warm white) → DARK CTA → DARK footer
- Header: transparent with white text on dark hero, warm off-white (#fafaf9) on app pages

**Favicon:** Indigo circle with white serif "N" (Georgia fallback for Fraunces in SVG)
