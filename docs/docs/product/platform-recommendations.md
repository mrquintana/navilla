---
title: Platform Recommendations
---

# Platform Recommendations

**Date:** 2026-02-05
**Author:** Codebase review + architectural analysis
**Purpose:** Honest assessment of where Navilla stands, what to ship for MVP, and what to prioritize next. Separated into what to keep, what to change, what to add, and what to cut.

---

## Assessment of Current ADRs

### ADR-001: Documentation Platform (Docusaurus)
**Verdict: Keep as-is.** Docusaurus is the right choice. It's React-based, lives with the code, and the docs are already well-structured. No changes needed.

### ADR-002: Technology Stack
**Verdict: Keep as-is, with one note.** Java + Spring Boot is solid for this domain — the encryption libraries, type safety, and graph algorithm support are genuine advantages. The concern is Java verbosity slowing iteration speed, but Spring Boot 4 with records helps. PostgreSQL via Supabase is the right call — recursive CTEs will be valuable when BFS moves to the database layer.

**One thing to watch:** Supabase free tier limits (500MB DB, 50K MAU). Plan the migration path to self-hosted PostgreSQL or Supabase Pro before hitting these limits. Don't let this become an emergency.

### ADR-005: Design System
**Verdict: Mostly keep, with refinement.** Blue-primary is correct for a health/trust product. The Infima-inspired styling works. Two suggestions:

1. **Consider a secondary accent color** for engagement features (network size, milestones). A warm color like amber or teal would differentiate "health/safety" (blue) from "engagement/growth" (accent) without clashing.
2. **Dark mode** is expected by users. Not MVP, but should be planned. The CSS custom property approach already supports it.

### ADR-006: Email Confirmation Handling
**Verdict: Keep as-is.** The dynamic detection approach is clean and avoids configuration coupling. No changes needed.

### ADR-007: Icon Set (Lucide)
**Verdict: Keep as-is.** Lucide is lightweight, tree-shakeable, and the icons are clean. No changes needed.

### ADR-008: Network Graph Engine (merged)
**Verdict: Covered in the new ADR-008.** The merged document addresses all gaps. Ship MVP without temporal edges, add them post-launch.

---

## What to Ship for MVP (Do Not Over-Engineer)

These are the things that must work reliably before launch. Nothing else matters until these are solid.

### Must-Have (Launch Blockers)

1. **Sign up / sign in flow** — works end-to-end, handles errors gracefully, email confirmation when enabled.
2. **Connection flow** — send, accept, deny, remove. Masked partner info (username, avatar). Clear status indicators.
3. **Health status reporting** — report positive/negative for 10 conditions. Clear and reactivate. Test date.
4. **Exposure overview** — aggregated by condition, closest degree, count, timeframe, status. Privacy threshold enforced.
5. **Network size on dashboard** — the number, with a "What does this mean?" link.
6. **User-facing disclosure** — the "How It Works" page from ADR-008 must be live at launch. Non-negotiable for trust and legal.
7. **Account deletion** — GDPR/CCPA require this. Already implemented (soft delete with anonymization).

### Should-Have (Ship Within First Week)

8. **Notification system** — at least in-app notifications for connection events. Email can wait.
9. **Profile privacy controls** — visibility settings already exist. Ensure they actually work end-to-end (search respects visibility, etc.).
10. **Spanish locale** — finish the `es_MX.json` translations. Placeholder English in a Spanish locale is worse than not offering Spanish.

### Explicitly Defer

- Temporal edges (post-MVP, per ADR-008)
- Lab verification
- Email batch notifications (Sunday cadence)
- Network visualization graph
- Dark mode
- Data export (GDPR portability)
- Avatar upload

---

## What to Change

### 1. Exposure Algorithm: Load the Full Graph? Really?

**Current state:** `ExposureService.buildConnectionGraph()` loads ALL confirmed connections into memory for every computation.

**Problem:** This works for hundreds of users. It will break at tens of thousands. And it's wasteful — most of the graph is irrelevant to any single user's BFS.

**Recommendation (not for MVP, but soon):**
- **Short term:** Add a node-count cap to BFS. If the traversal visits > 50,000 nodes, stop and note the result as "approximate." This prevents runaway computation without changing the architecture.
- **Medium term:** Move BFS to a PostgreSQL recursive CTE. The database is better at this — it can filter, join, and traverse without shipping the entire graph over the wire.
- **Long term:** If user base exceeds ~500K, consider a dedicated graph processing layer (batch job that materializes each user's reachable set nightly).

### 2. Snapshot Invalidation Is Too Passive

**Current state:** Snapshots expire after 5 days. No event-driven invalidation.

**Problem:** A user adds 10 connections and their network size doesn't change for 5 days. This kills the engagement loop.

**Recommendation:**
- **MVP fix:** When a user accepts or creates a connection, mark their snapshot as expired (set `expiresAt` to now). Next dashboard load triggers recomputation. This is a one-line change.
- **Don't invalidate on others' health status changes.** That would enable timing attacks (add connection → see if exposure changes). Health-related data should only refresh on the natural TTL cycle.
- This gives users immediate feedback on connection changes (engagement) while preserving privacy for health data (safety).

### 3. The "3 Connection" Threshold Needs Better UX

**Current state:** Below 3 connections, users get a flat message: "You need at least 3 connections."

**Problem:** This is a dead end for new users. They signed up expecting to see something. They see nothing.

**Recommendation:**
- Show network size even below the threshold. "Your network: 2 people. Add 1 more connection to see exposure data."
- Show a progress indicator: "2 of 3 connections needed."
- This turns a dead-end into a growth funnel.

### 4. i18n Is Incomplete

**Current state:** `es_MX.json` has many English placeholder strings.

**Problem:** Shipping a half-translated Spanish locale is worse than not offering it. Users who select Spanish and see English strings will lose trust.

**Recommendation:**
- Either finish the translations before launch, or remove the language switcher from MVP and launch English-only. Add Spanish as a polished update.

### 5. The Landing Page Needs to Sell, Not Just Inform

**Current state:** The HomePage is a standard hero + CTA layout.

**Problem:** For a sensitive health product, the landing page must immediately answer: "Is this safe? Is this private? Why should I trust this?"

**Recommendation:**
- Lead with the privacy promise: "Numbers, not names."
- Show a mock dashboard screenshot (anonymized) so users know what to expect before signing up.
- Add a "How It Works" summary (3 steps, with icons) above the fold.
- Add social proof or trust signals (encryption badge, "no identity shared" badge, open-source mention if applicable).
- Keep it simple — don't add testimonials or blog posts for MVP.

---

## What to Add

### Phase 1: Engagement Without Over-Engineering

These are low-effort, high-impact additions that make users want to come back.

#### 1. Network Growth Indicator
Show users how their network has changed since last visit. "Your network grew by 23 people since Jan 15." This is trivial — store the previous `totalGraphNodes` in the snapshot and compare.

**Effort:** Small (one field addition to snapshot, one line in dashboard).

#### 2. Connection Degree Breakdown on Dashboard
The data already exists (`connectionCount`, `secondDegreeCount`, `thirdDegreeCount`). Show it visually — a simple horizontal bar or ring chart showing 1st/2nd/3rd degree distribution.

**Effort:** Small (frontend only, data already in API response).

#### 3. "Last Updated" and "Next Update" Visibility
Already in the API response (`computedAt`, `nextUpdateAt`). Make sure it's prominently displayed so users understand the refresh cycle and come back to check.

**Effort:** Tiny (frontend display).

#### 4. Onboarding Checklist
New users should see a guided checklist:
- Create account
- Complete profile
- Add first connection
- Add 3 connections (unlock exposure data)
- Report first health status

This drives activation and teaches the product simultaneously.

**Effort:** Medium (frontend component, track completion in localStorage or user profile).

#### 5. Anonymous Exposure Comparison
"In networks similar to yours (size and region), the average exposure rate is X." This is aggregate statistical data — no individual disclosure. It gives context and makes the data more interesting.

**Effort:** Medium (backend aggregation query, new endpoint).

### Phase 2: Trust and Retention

#### 6. Verified Test Results
Partner with lab APIs (e.g., Health Gorilla, Particle Health) to allow users to import verified results. Verified results carry more weight in exposure calculations and could be badged differently.

**Effort:** Large (API integration, HIPAA implications, new entity fields).
**Impact:** Transforms the platform from self-reported to clinically backed. Major trust signal.

#### 7. Periodic Check-In Reminders
Nudge users to update their health status periodically: "It's been 6 months since your last report. Consider getting tested." This is a retention loop and a genuine health benefit.

**Effort:** Small (scheduled notification, new notification type).

#### 8. Connection Renewal (for Temporal Edges)
When temporal edges ship, add a "Reconnect" action on dormant connections. "You haven't confirmed this connection in 2 years. Tap to renew."

**Effort:** Small (new endpoint, frontend button). Depends on temporal edge implementation.

#### 9. Exposure Trends Over Time
Store historical snapshots (or just summary stats per snapshot) and show a timeline: "Your network has grown from 50 to 847 people over 6 months. Active exposures: 2 → 1."

**Effort:** Medium (store snapshot summaries, chart component).

#### 10. Anonymous Network Insights
Aggregate, anonymized insights about the broader Navilla network: "X users on Navilla. Average network size: Y. Most common conditions reported." This is interesting data that makes the platform feel alive and growing.

**Effort:** Medium (aggregate queries, public endpoint or static page).

### Phase 3: Growth and Differentiation

#### 11. Invite System
Let users invite connections via a unique link or code. The invitee signs up and the connection is pre-staged for confirmation. This is the core growth loop — each user recruits their own contacts.

**Effort:** Medium (invitation entity, link generation, signup flow modification).

#### 12. Partner/Clinic Dashboard
A separate read-only dashboard for clinics or health organizations to see aggregate (fully anonymized) trends in their region. This opens a B2B revenue path and provides public health value.

**Effort:** Large (separate app or role, aggregate reporting, privacy review).

#### 13. Public Health Data Feed
Aggregate, anonymized, regional exposure trends published as an open data API. Think "Google Flu Trends" but for STIs, built from bottom-up user data. This could attract institutional partnerships and press coverage.

**Effort:** Large (data pipeline, anonymization guarantees, API design).

---

## What to Remove or Simplify

### 1. Dev-Only Endpoints Should Not Ship to Production
`/api/dev/users/hash` and `/api/dev/exposures/inspect` are guarded by `NAVILLA_DEV_MODE`, but the code still compiles into the production binary. Consider moving these to a separate Spring profile that is completely excluded from production builds. This is a security best practice — the code should not exist in production, not just be disabled.

### 2. Simplify Notification Types for MVP
The `NotificationType` enum has: `connection_request`, `connection_confirmed`, `connection_denied`, `exposure_alert`, `exposure_cleared`, `account_security`. For MVP, only `connection_request` and `connection_confirmed` are truly needed. Exposure alerts via notification can wait until the email batch system is built. Shipping half-baked notification types creates UX confusion.

### 3. Don't Over-Invest in the Seed Data
`dev-7-users.sql` is useful for development. Don't spend time maintaining seed data for every new feature. Instead, invest in the E2E mock system (`e2eMocks.ts`) which is already set up and more maintainable.

### 4. Remove Unused Exposure Depth Display
The API returns `maxDepth` (5), but exposure items are only shown up to 3rd degree. Showing "Max depth: 5" in any user-facing context is confusing — users see 3 degrees of exposure but are told the system goes to 5. Either show consistent numbers or don't show the depth at all. Use the depth internally.

### 5. CONTEXT.md Is Getting Unwieldy
At ~588 lines with session notes dating back to project creation, `CONTEXT.md` is becoming hard to navigate. Consider:
- Archiving session notes older than 2 weeks into a `CONTEXT-archive.md`.
- Keeping `CONTEXT.md` focused on: current status, open decisions, and next steps.
- The ADRs and docs already capture the permanent decisions.

---

## Performance Considerations

### What Matters Now
- **API response time < 200ms** for cached data (snapshot retrieval + decryption). Currently met.
- **Snapshot computation < 5s** for graphs up to ~10K nodes. Needs measurement but likely met.
- **Frontend bundle size < 500KB gzipped.** TanStack Query + React + i18n + Supabase is already significant. Monitor this.

### What Will Matter Later
- **BFS at scale:** At 100K+ users, loading the full graph into Java heap will be the bottleneck. The recursive CTE migration is the fix.
- **Snapshot storage:** At 100K users with 5-day TTL, that's 100K encrypted blobs in PostgreSQL. This is fine for Supabase but monitor storage usage.
- **Connection fan-out:** Some users may have hundreds of direct connections. BFS from these users will be expensive. The node-count cap is the safeguard.

### What Will Never Matter
- **Sub-second snapshot computation.** The cache handles this. Don't optimize the BFS for speed — optimize it for correctness and resource consumption.
- **Real-time graph updates.** The cache TTL is a feature, not a bug. Don't add WebSocket-based live updates to the graph.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Self-reported data is inaccurate | High | Medium | Clearly disclose limitations. Add verified results later. |
| Users game the system (false reports) | Medium | High | Rate limiting on reports. Flagging of anomalous patterns. Verified results. |
| Inference attacks despite privacy threshold | Low | High | 3-connection minimum, batched notifications, snapshot TTL, no real-time updates. |
| Graph computation becomes too slow | Low (now), High (at scale) | Medium | Node cap, recursive CTE migration, scheduled batch computation. |
| Legal challenge on health data handling | Low | Critical | DPIA before launch, DPO at scale, clear Terms of Service, user-facing disclosure. |
| Supabase outage or limit hit | Medium | High | Plan migration path to self-hosted PostgreSQL. Monitor free tier limits. |
| Low adoption / empty networks | High | Critical | Invest in invite system, onboarding checklist, and landing page trust signals. Network effects require critical mass. |

---

## Prioritized Roadmap Suggestion

### Pre-Launch (Now)
1. Finish MVP must-haves (see list above)
2. Publish user-facing disclosure ("How It Works" page)
3. Fix the 3-connection UX dead end
4. Decision on Spanish locale: finish or defer

### Post-Launch Week 1–2
5. Snapshot invalidation on connection changes
6. Network growth indicator
7. Onboarding checklist
8. Degree breakdown visualization

### Post-Launch Month 1
9. Invite system (core growth loop)
10. Periodic check-in reminders
11. Exposure trends over time

### Post-Launch Month 2–3
12. Temporal edges (ADR-008 post-MVP)
13. Connection renewal UX
14. Anonymous network insights

### Post-Launch Month 4+
15. Verified test results (lab integration)
16. Anonymous exposure comparison
17. Partner/clinic dashboard exploration
18. Public health data feed exploration

---

## Final Thought

Navilla's biggest risk is not technical — it's adoption. The privacy-first architecture is well-designed. The exposure algorithm works. The encryption is solid. But none of it matters with an empty network.

Every feature decision should be filtered through: **"Does this help get the next user to sign up and add their first 3 connections?"** Network size as a vanity metric? Yes — it makes the product stickier. Onboarding checklist? Yes — it gets users past the dead zone. Temporal edges? Not yet — ship the simpler version and improve accuracy once you have users.

The platform has good bones. Ship it.
