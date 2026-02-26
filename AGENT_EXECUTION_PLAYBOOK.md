# Navilla Agent Execution Playbook

## 1. Purpose

Operational source of truth for agents working on Navilla.

Use it to:
- Know what is done, in progress, and next.
- Implement features consistently with the architecture.
- Keep code, tests, and docs aligned.
- Ship a product that is usable, trustworthy, and socially valuable.

Full product vision and 20-week roadmap: **`UPCOMING_FEATURES_AND_ROADMAP.md`**
Machine-readable tracker: **`AGENT_EXECUTION_TRACKER.yaml`**

---

## 2. Product Goal

A privacy-first sexual health companion that gives users value from day one — before any network exists.

Four product layers (see roadmap for full detail):
- **Layer 0**: Public tools — no account needed (calculator, STI guides, clinic finder, cost estimator)
- **Layer 1**: Personal tracker — private journal, testing history, reminders, insights
- **Layer 2**: Connection network — exposure signals, privacy controls, vault, retention
- **Layer 3**: Anonymous notifications — lightweight, optional, altruistic

---

## 3. Non-Negotiable Engineering Gates

Every feature/change requires all of these before marking complete:

1. `Code` — implemented, consistent with architecture, reviewed.
2. `Tests` — unit tests (Vitest + RTL) for behavior and edge cases; E2E updated if user flow changed.
3. `Docs` — Docusaurus updated if applicable (internal dev docs only, not for public content).
4. `Locale files` — both `en_US.json` and `es_MX.json` updated for any new UI text.
5. `Build gates` — all three pass locally:
   - `npm run type-check`
   - `npm test`
   - `npm run build`

Definition of done is not met if any gate above is missing.

---

## 4. Current State (as of 2026-02-26)

### Completed

- [x] Full auth system (login, signup, password reset, email confirmation).
- [x] User entity + profile API.
- [x] Connection CRUD (request, accept, deny, remove, pending/confirmed views).
- [x] Health status reporting (positive/negative, clear, activate, delete).
- [x] Exposure calculation (BFS, up to 5 degrees, 3-connection threshold).
- [x] Notifications UX v1 (filter, group, relative time, badges, actions, header preview).
- [x] Notification-to-connection state reconciliation and deep-link focus.
- [x] Site-wide loading UX (skeletons, reduced flicker).
- [x] Frontend unit test stack (Vitest + RTL, 19 tests passing).
- [x] React 19 native meta tags on all public pages (no react-helmet-async needed).
- [x] Layer 0 SSR prerender infrastructure (`scripts/prerender.ts`, `npm run build:full`).
- [x] All frontend lint errors resolved (12 errors → 0).

### Week 1 Status — Foundation ✅ COMPLETE

- [x] Codebase cleanup: lint errors fixed, tests green, build clean.
- [x] SEO infrastructure: React 19 native meta tags + prerender script.
- [x] Playbook aligned with new layer-based roadmap.

### Next: Week 2 — Layer 0, Phase 1

- [ ] Window period calculator (interactive, no account needed).
- [ ] First 5 STI guides (chlamydia, gonorrhea, syphilis, HIV, herpes).
- [ ] Basic page layout with disclaimers and source citations.
- [ ] Add completed pages to `scripts/prerender.ts` ROUTES array.

---

## 5. Architecture Quick Reference

| Concern | Answer |
|---------|--------|
| Backend | Java 25 + Spring Boot 4.0.2 + Maven + PostgreSQL (Supabase) |
| Frontend | React 19 + Vite 7 + TypeScript + TailwindCSS |
| Auth | Supabase Auth (JWT) |
| Hosting | Railway (backend + frontend) |
| i18n | react-i18next — English (en_US) primary, Spanish (es_MX) alongside |
| Testing | Vitest + RTL (frontend), JUnit + Mockito (backend), Playwright (E2E) |
| DB migrations | Numbered SQL files in `database/migrations/` |
| Meta tags | React 19 native `<title>` / `<meta>` hoisting — no helmet library |
| Prerendering | `npm run build:full` → `scripts/prerender.ts` (react-dom/server + StaticRouter) |
| Mobile prep | Web → PWA → React Native (Expo) in separate repo `navilla-mobile` |

### React Native Prep Rules (enforced every session)

Never put business logic inside UI components. Keep these portable:
- API calls → `lib/api.ts` only
- Types → `types/`
- Validation → `lib/validators.ts`
- Hooks → `hooks/`
- Locale files → `locales/*.json`

### Layer 0 Page Rules (for SSR compatibility)

Layer 0 components must be renderable in Node.js via `scripts/prerender.ts`:
- No `import.meta.env` — not available in Node
- No auth hooks — public pages only
- No React Query — static content only
- No CSS file imports — use Tailwind classes only
- Use hardcoded English for SSR output (i18n applies at runtime in the browser)

---

## 6. 20-Week Roadmap Summary

Full detail in `UPCOMING_FEATURES_AND_ROADMAP.md`.

| Phase | Weeks | Focus |
|-------|-------|-------|
| 0 — Foundation | 1 | Architecture lock, cleanup, SEO infra ✅ |
| 1 — Layer 0 | 2–4 | Public tools: calculator, guides, clinics, cost estimator |
| 2 — Layer 1 | 5–9 | Personal tracker: journal, testing history, reminders, insights, PWA |
| 3 — Layer 2 | 10–14 | Network: share links, recency, vault, retention, network health |
| 4 — Layer 3 + Launch | 15–16 | Anonymous notifications, final testing, security audit |
| 5 — Soft Launch | 17–20 | LGBTQ+ CDMX launch, iterate, content marketing |

---

## 7. Agent Workflow Checklist (copy into each task)

- [ ] Scope defined and linked to a layer and week.
- [ ] Implementation completed.
- [ ] Unit tests added/updated.
- [ ] E2E tests added/updated if user flow changed.
- [ ] Docusaurus docs updated (or N/A with reason).
- [ ] Both locale files updated for any new UI text.
- [ ] `npm run type-check` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `AGENT_EXECUTION_TRACKER.yaml` updated.
- [ ] `UPCOMING_FEATURES_AND_ROADMAP.md` progress updated if week completed.

---

## 8. Agent Update Protocol

When an agent completes work:

1. Update `AGENT_EXECUTION_TRACKER.yaml`:
   - Weekly plan status
   - `done_history` entry with date and items

2. Update `UPCOMING_FEATURES_AND_ROADMAP.md`:
   - Mark week deliverables complete if the week is done

3. Update this playbook (`AGENT_EXECUTION_PLAYBOOK.md`):
   - Move completed items under "Completed"
   - Update "Next" section
   - Only if scope or priorities changed meaningfully

---

## 9. Change Log

### 2026-02-26
- Rewrote playbook to align with layer-based 20-week roadmap.
- Completed Week 1: lint cleanup, SEO infrastructure, prerender script.

### 2026-02-25
- Added site-wide loading skeletons and stable hydration behavior.
- Added frontend unit test stack (Vitest + RTL).
- Upgraded notification UX v1.
- Fixed notification-to-connection state reconciliation and deep-link behavior.
