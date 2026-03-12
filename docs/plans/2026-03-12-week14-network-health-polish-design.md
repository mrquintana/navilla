# Week 14: Network Health Stats + Layer 2 Polish

**Date:** 2026-03-12
**Status:** Approved

---

## Part 1: Network Health Stats (Feature 2.5)

### Overview

Aggregated, anonymized view of the user's network health posture. No individual data — only qualitative labels and counts. Gated by reciprocity opt-in.

### What Users See

**Dashboard (compact card):**
```
Network Health
● High — Your network is actively testing
8 connections · 31 people in network
```

**Network page (full section below constellation):**
```
Network Health

Testing Activity
● High — Most of your network has tested recently

Network Coverage
8 direct connections
23 extended connections (2nd degree)
~31 unique people across 3 degrees

Exposure Summary
1 active condition in your network
0 conditions resolved in last 30 days
```

### Testing Activity Calculation

Percentage of 1st-degree confirmed connections who have logged at least one test visit in the last 90 days:

| Level   | Threshold        | Badge Color |
|---------|-----------------|-------------|
| High    | >=60%           | Green       |
| Medium  | 30-59%          | Amber       |
| Low     | <30%            | Red         |
| Unknown | <3 connections  | Stone/muted |

Privacy: only qualitative labels. Exact percentage is NOT exposed to prevent inference ("75% of my 4 connections = 3 people tested, I know who didn't").

### Exposure Summary

Derived from existing exposure snapshot data:
- Count of exposure items where `status = "active"`
- Count of exposure items where `status = "resolved"` and most recent report date is within last 30 days

### Backend

**New endpoint:** `GET /api/network-health`
- Requires authenticated JWT + reciprocity opt-in
- Returns `NetworkHealthResponse`:
  ```
  testingActivityLevel: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN"
  testingActivityDescription: string (i18n message key)
  connectionCount: int
  secondDegreeCount: int | null
  thirdDegreeCount: int | null
  totalNetworkSize: int | null
  maxDepth: int
  activeExposureCount: int
  recentlyResolvedCount: int
  ```
- Cached 5 minutes (Caffeine, per-user key)

**New service:** `NetworkHealthService`
- Depends on: `ConnectionRepository`, `TestVisitRepository`, `ExposureService`
- Queries confirmed 1st-degree connections, then checks which have test visits in last 90 days
- Reuses existing exposure snapshot for coverage + exposure summary counts

**New repository query:** `TestVisitRepository.findUserHashesWithTestsAfter(Set<String> userHashes, OffsetDateTime after)` — returns the subset of user hashes that have at least one test visit after the given date. Single efficient query.

### Frontend

**Dashboard:** New `NetworkHealthCard` component — compact version showing level badge, description, connection count + network size. Gated by reciprocity opt-in (hidden if not opted in).

**Network page:** New `NetworkHealthSection` below constellation — full version with testing activity, network coverage breakdown, and exposure summary. Same reciprocity gate.

**New hook:** `useNetworkHealth()` — React Query hook for `GET /api/network-health`, 5-minute stale time.

**i18n:** All labels in en_US + es_MX locale files.

### What's NOT included
- No trend lines or historical data
- No per-connection health indicators
- No "resolved in last 30 days" if it requires new queries beyond existing exposure data

---

## Part 2: Layer 2 Polish (All 11 Items)

### High Priority

#### P1. N+1 Queries in ConnectionService
**Problem:** `getConnections()`, `getPendingSent()`, `getStats()`, and `toConnectionResponse()` each call `userRepository.findByEmailHash()` per connection. 100 connections = 100+ queries.

**Fix:** Batch-fetch all partner user records upfront into a `Map<String, User>`, then pass the map to `toConnectionResponse()`. Add a repository method `findByEmailHashIn(Set<String> hashes)`.

#### P2. Hardcoded Colors → CSS Variables
**Problem:** Dashboard, HealthLog, Profile use inline `rgba(99, 102, 241, 0.08)` and similar instead of CSS variables.

**Fix:** Replace all hardcoded color values with CSS variable references. Audit every inline `style={{ color: ..., background: ... }}` across Layer 2 pages.

#### P3. Mobile Responsiveness Fixes
**Problems:**
- Dashboard quick-action button text truncates on iPhone SE (375px)
- Verification card action buttons wrap awkwardly on mobile
- Profile segmented control (Private/Connections/Public) text doesn't fit on small screens

**Fix:**
- Quick actions: reduce text or use icon-only on small screens
- Verification card buttons: stack vertically on mobile
- Segmented control: abbreviate labels on small screens or use dropdown

#### P4. Missing @Size on Verification Card Conditions List
**Problem:** `includedConditions` list in `CreateVerificationCardRequest` and `UpdateVerificationCardRequest` has no max-size constraint. User could submit 1000+ conditions.

**Fix:** Add `@Size(max = 50)` to the list itself in both DTOs. Add `@Valid` annotation.

### Medium Priority

#### P5. Race Condition in Verification Card View Counting
**Problem:** `getCurrentViews() >= getMaxViews()` check + increment is not atomic. Concurrent requests can exceed the limit.

**Fix:** Use a native SQL query: `UPDATE verification_cards SET current_views = current_views + 1 WHERE id = :id AND (max_views IS NULL OR current_views < max_views) RETURNING current_views`. If zero rows updated, throw view-limit-reached.

#### P6. Hardcoded Error Messages in VerificationCardService
**Problem:** 5 English strings thrown as exceptions instead of i18n message keys.

**Fix:** Replace with message keys (`card.error.notFound`, `user.error.notFound`, `card.error.incompleteProfile`) and throw appropriate exceptions (ResourceNotFoundException, etc.).

#### P7. Date Formatting Uses Browser Locale
**Problem:** `ConnectionsPage` and `HealthLogPage` call `.toLocaleDateString()` without passing the app's i18n locale.

**Fix:** Pass `i18n.language.replace('_', '-')` to all `.toLocaleDateString()` and `.toLocaleString()` calls. Create a shared `useLocale()` hook or utility if one doesn't exist.

#### P8. Missing ShareToken Length Validation
**Problem:** Public verification card endpoints accept unbounded string for `shareToken` path variable.

**Fix:** Add `@Size(min = 1, max = 64)` validation. Return 404 for invalid tokens instead of 500.

### Lower Priority

#### P9. Color-Only Status Indicator on Dashboard
**Problem:** Status circle is red or green based on `hasPositiveStatus` — color-only, not accessible.

**Fix:** Add a text label next to the circle ("Active exposure" / "No active exposure") or an sr-only aria-label.

#### P10. Focus Traps in Delete Modals
**Problem:** Profile delete-account modal and verification card delete confirmation don't trap keyboard focus.

**Fix:** Use `useEffect` to focus the cancel button on mount. Add `onKeyDown` handler for Escape. Trap Tab within modal bounds.

#### P11. Empty States with Icons
**Problem:** ConnectionsPage (no connections) and HealthLogPage (no exposures) show plain muted text with no visual hierarchy.

**Fix:** Add an icon (e.g., Users icon for connections, Shield icon for exposures) above the text with muted styling, matching the pattern already used on VerificationCardPage.

---

## Testing Plan

- Backend unit tests for `NetworkHealthService` (all 4 activity levels + edge cases)
- Backend integration test for `GET /api/network-health` endpoint
- Backend tests for N+1 fix (verify query count with 10+ connections)
- Backend tests for atomic view counting
- Frontend component tests for `NetworkHealthCard` and `NetworkHealthSection`
- Manual verification of all 11 polish items across mobile + desktop
- E2E tests for critical Layer 2 flows (connections, exposure, verification cards)
