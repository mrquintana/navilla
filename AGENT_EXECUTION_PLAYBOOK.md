# Navilla Agent Execution Playbook (2026 Launch Track)

## 1. Purpose
This document is the operational source of truth for agents working on Navilla over the coming weeks.

Use it to:
- Track what is done, in progress, and blocked.
- Decide what to build next.
- Keep implementation, testing, and documentation aligned.
- Ship a product that is usable, trustworthy, and socially valuable.

This is an internal execution document for agents, not end-user marketing content.

Machine-readable companion tracker:
- `AGENT_EXECUTION_TRACKER.yaml`
- Agents must update both this playbook and the tracker when status changes.

---

## 2. Product Goal
Ship a privacy-first exposure network that users actually trust and use repeatedly.

Core value to deliver:
- Clear connection lifecycle and meaning.
- Exposure that is relevant in time (not misleading from stale history).
- Explicit privacy controls and understandable disclosure.
- Verification tiers that raise confidence in reported results.

---

## 3. Non-Negotiable Engineering Gates (For Every Feature)
For every feature/change, all of these are required before marking complete:

1. `Code` implemented and reviewed for consistency with current architecture.
2. `Tests` added/updated:
- Unit tests (Vitest + RTL) for behavior and edge cases.
- E2E updates when user flows are affected.
3. `Docs` updated if applicable:
- Docusaurus page(s) for behavior/API/product explanation.
- `README.md` / `frontend/README.md` when commands or setup change.
4. `Footer-linked content` reviewed if affected:
- `/how-it-works`
- `/privacy`
- `/security`
- `/about`
- `/contact`
- `/careers`
- `/terms`
- `/privacy-policy`
- `/cookie-policy`
- `/help`
- `/status`
- `/accessibility`
5. `Build + type-check + tests` pass locally:
- `npm run type-check`
- `npm test`
- `npm run build`

Definition of done is not met if any gate above is missing.

---

## 4. Current State Snapshot (As of 2026-02-25)

### Recently Completed
- [x] Site-wide loading UX upgrade (skeletons, reduced flicker).
- [x] Frontend unit test stack installed and running (`Vitest + RTL`).
- [x] Initial high-value UT suite across core pages/components.
- [x] Notifications UX v1:
  - Filtering/grouping/relative time/status badges/actions.
  - Header bell preview dropdown.
- [x] Notifications vs connections consistency fix:
  - Action availability reconciled with pending state.
  - Deep-link focus to `/connections?focus=<id>`.
  - Resolved-state messaging when request is no longer pending.
- [x] README + Docusaurus testing docs updated.

### Active Product Gaps
- [ ] Temporal relevance in exposure logic/UI (major trust gap).
- [ ] Verification system (provider/lab confidence tiers).
- [ ] Privacy center v1 consolidation and clarity pass.
- [ ] Connection renewal/reconfirmation lifecycle.
- [ ] Notification preferences (channel/frequency/quiet hours).
- [ ] Footer content pages alignment with new behavior language.

---

## 5. North Star Metrics and Shipping Metrics

### North Star
- Weekly active users who complete a meaningful action:
  - add/confirm connection, update status, review exposure, or complete verification.

### Trust/Utility Metrics
- % users reaching 3+ confirmed connections.
- % users with at least one recent (<=90 days) health status.
- % exposure cards with recency context shown.
- % verification-labeled statuses.
- Notification-to-action conversion (open -> action complete).

### Quality/Delivery Metrics
- Frontend UT pass rate.
- E2E pass rate for critical flows.
- Deployment success rate.
- Regression count in notifications/connections/privacy surfaces.

---

## 6. Workstreams

## WS-A: Exposure Relevance and Risk Context (Highest Priority)
Objective: Make exposure output time-relevant and interpretable.

### Scope
- Add explicit recency buckets in exposure data and UI:
  - `0-30d`, `31-90d`, `91-365d`, `365d+`.
- Keep historical data visible but visually de-emphasized.
- Update “How It Works” and transparency docs to explain recency interpretation.
- Ensure no wording implies diagnosis.

### Deliverables
- Backend exposure response includes recency breakdown metadata.
- Dashboard + Health views show recency context.
- Clear explainer copy and tooltip behavior.
- Tests for bucket classification and rendering.

### Exit Criteria
- User can tell if an exposure is recent vs historical in one glance.
- No stale-only exposure appears without time label.

---

## WS-B: Verification Confidence Layers (Provider First, Lab Next)
Objective: Move from pure self-report to confidence-tiered data.

### Tier Model
- Tier 1: `Self-reported`
- Tier 2: `Provider-verified` (manual workflow by provider accounts)
- Tier 3: `Lab-verified` (direct integration)

### Phase 1 (Provider-verified v1)
- Provider account role + permissions.
- Verification request workflow from user to provider.
- Provider inbox: approve/reject/request-info.
- Audit log for every verification action.
- Status badge rendering and influence on interpretation language.

### Phase 2 (Lab-ready architecture)
- Adapter interface for integrations (Quest/Unilab/Chopo/etc).
- Identity matching + signed verification event handling.
- Keep provider-manual fallback permanently.

### Exit Criteria
- Verification status is visible and trusted.
- Audit trail exists for each verified result.

---

## WS-C: Connection Lifecycle Clarity
Objective: Make connections straightforward and state-consistent.

### Scope
- Canonical state model across pages and notifications.
- Reconfirmation/renewal for stale links.
- Connection timeline context (optional phase 2).
- Deep-link and focus reliability from notifications.

### Exit Criteria
- No action button appears for impossible state.
- Users can always understand why a request is actionable vs resolved.

---

## WS-D: Privacy Clarity and Controls
Objective: Make privacy understandable and enforceable.

### Scope
- Privacy Center page: what is shared, what is not, update cadence, limits.
- Explicit inline labels in dashboard/health/profile.
- Ensure settings and behavior match (search/visibility/data display).
- Footer content consistency pass.

### Exit Criteria
- A first-time user can explain privacy model in under 30 seconds.
- No conflict between settings and actual behavior.

---

## WS-E: Notifications and Activation
Objective: Increase useful engagement, not vanity noise.

### Scope
- Notification preferences (in-app/email, per category, quiet hours, digest).
- Action-first notifications only.
- Onboarding and activation checklist integration.

### Exit Criteria
- Notifications lead to meaningful actions, not list scanning.

---

## 7. 12-Week Execution Plan (Week-by-Week)

## Week 1: Product/Architecture Lock
- [ ] Freeze scope for WS-A through WS-D.
- [ ] Finalize verification tier definitions and legal-safe language.
- [ ] Confirm acceptance criteria for every epic.

## Week 2: Data and API Foundations
- [ ] Add schema/contracts for recency metadata and verification state.
- [ ] Add provider entities, role scaffolding, and audit records.
- [ ] Add migration and API docs.

## Week 3: Exposure Recency Backend
- [ ] Implement recency buckets and aggregation outputs.
- [ ] Add unit tests for edge cases (boundary dates/time zones).
- [ ] Add API examples in docs.

## Week 4: Exposure Recency UI
- [ ] Update dashboard and health exposure components.
- [ ] Add tooltips/disclosure text for recency relevance.
- [ ] Update `/how-it-works` copy and transparency docs.

## Week 5: Connection Lifecycle v2
- [ ] Add reconfirm/renewal states and prompts.
- [ ] Ensure notifications and connections remain state-consistent.
- [ ] Add deep-link state tests.

## Week 6: Privacy Center v1
- [ ] Build privacy center with concise explanation blocks.
- [ ] Align profile privacy controls with actual outcomes.
- [ ] Footer page copy audit pass (all linked pages).

## Week 7: Provider Accounts v1
- [ ] Provider onboarding and auth role permissions.
- [ ] Provider dashboard shell and verification inbox.
- [ ] Security checks and audit logging coverage.

## Week 8: Provider Verification Flow
- [ ] User submits verification request to provider.
- [ ] Provider approve/reject/request-info actions.
- [ ] Verification badges shown in user-facing UI.

## Week 9: Anti-Abuse and Operations
- [ ] Rate limiting and abuse flags for verification endpoints.
- [ ] Manual review/admin controls (minimal set).
- [ ] Monitoring and alerting updates.

## Week 10: Hardening and Regression Lock
- [ ] E2E coverage for new core flows.
- [ ] Regression testing for notifications/connections/privacy.
- [ ] Error-state and empty-state UX polish.

## Week 11: Pilot with Small Providers
- [ ] Launch pilot with 1-3 clinics/providers.
- [ ] Collect user/provider friction and drop-off metrics.
- [ ] Prioritized fix list from pilot findings.

## Week 12: Launch Readiness + Lab Integration Prep
- [ ] Resolve pilot blockers.
- [ ] Final docs/legal pass for public launch.
- [ ] Create integration packet for large labs (tech + policy requirements).

---

## 8. Agent Workflow Checklist (Use Per Task)

Copy this block into each task/PR description and complete it:

- [ ] `Scope` defined and linked to one workstream.
- [ ] `Implementation` completed.
- [ ] `Unit tests` added/updated.
- [ ] `E2E tests` added/updated if user flow changed.
- [ ] `Docusaurus docs` updated (or explicitly N/A with reason).
- [ ] `README` updated if setup/commands changed.
- [ ] `Footer-linked pages` reviewed if content promise changed.
- [ ] `npm run type-check` pass.
- [ ] `npm test` pass.
- [ ] `npm run build` pass.
- [ ] `Release notes` updated (if externally visible behavior changed).

---

## 9. Footer Content Audit Backlog
These pages must remain aligned with product behavior and privacy guarantees:

- [ ] `/how-it-works` includes recency relevance and verification tiers.
- [ ] `/privacy` and `/privacy-policy` match actual data handling.
- [ ] `/terms` does not over-claim medical accuracy.
- [ ] `/help` FAQ updated for provider verification flows.
- [ ] `/security` mentions verification/audit controls if applicable.
- [ ] `/status` copy remains operationally accurate.
- [ ] `/accessibility` updated if new UI patterns are added.

---

## 10. Risks and Mitigations

1. `Trust risk`: stale exposure appears misleading.
- Mitigation: recency buckets, de-emphasis of old data, clear language.

2. `State inconsistency risk`: notifications/actions diverge from live state.
- Mitigation: derive actionability from canonical queries before rendering actions.

3. `Verification abuse risk`: false provider approvals or spoofing.
- Mitigation: provider identity checks, audit logs, role controls, review flags.

4. `Regulatory risk` for lab integrations.
- Mitigation: provider-manual v1 first, legal review before direct integrations.

---

## 11. Release Decision Gates (Ship/No-Ship)

No launch if any is false:
- [ ] Temporal relevance is visible in exposure UI.
- [ ] Connection/notification actions are state-consistent.
- [ ] Privacy center and footer-linked policy pages are up-to-date.
- [ ] Verification tier labeling works end-to-end.
- [ ] Critical UT/E2E suites green.
- [ ] Build/deploy pipeline stable.

---

## 12. Change Log (Update Weekly)

## 2026-02-25
- Added site-wide loading skeletons and stable hydration behavior.
- Added frontend UT stack and high-value test coverage.
- Upgraded notification UX and header preview.
- Fixed notification-to-connection state reconciliation and deep-link behavior.

---

## 13. Immediate Next Queue (Current)

1. WS-A kickoff:
- Define exposure recency bucket schema and API response shape.

2. WS-D kickoff:
- Draft Privacy Center IA and align with existing `/how-it-works` text.

3. WS-B kickoff:
- Draft provider role model and minimal verification workflow spec.

---

## 14. Agent Update Protocol

When an agent completes or modifies work:

1. Update `AGENT_EXECUTION_TRACKER.yaml`:
- Workstream status
- Milestone status
- Weekly plan status (if affected)
- Footer page audit status (if affected)
- `done_history` entry

2. Update this playbook (`AGENT_EXECUTION_PLAYBOOK.md`) if:
- Scope, sequencing, or priorities changed
- New risks were identified
- Exit criteria changed

3. In the task/PR summary, link both files so subsequent agents can continue seamlessly.
