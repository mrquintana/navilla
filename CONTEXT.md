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

## Next Steps

| Priority | Item | Notes |
|----------|------|-------|
| **Next** | Week 12 | Notification privacy + polish (vault + app lock DEFERRED) |
| **Then** | Week 13 | Data retention + connection staleness |
| **Then** | Week 14 | Network health stats + Layer 2 polish |
| **Action** | Run migrations 014-017 on Supabase | If not already done |
