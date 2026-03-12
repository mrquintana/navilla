# Exposure Card Urgency Redesign

**Date:** 2026-03-11
**Status:** Approved

## Problem

1. Exposure cards use only a thin 3px left border to signal urgency tier — users can't tell what the color means
2. The stone/grey color for low urgency is invisible against the card background
3. Exposure Overview is buried in the right column of Health Status page — should be top priority
4. Health Status page has inconsistent loading UX — some sections pop in without skeletons

## Design

### Urgency badge + tinted backgrounds on exposure cards

Each exposure card gets 3 visual layers based on urgency tier:

| Tier | Badge label | Badge colors | Card background | Left border |
|------|-------------|-------------|-----------------|-------------|
| High | "High" | Amber text `#e3a008` on `rgba(227, 160, 8, 0.12)` | `rgba(227, 160, 8, 0.06)` | 4px `#e3a008` |
| Medium | "Medium" | Indigo text `#4f46e5` on `rgba(99, 102, 241, 0.12)` | `rgba(99, 102, 241, 0.06)` | 4px `#4f46e5` |
| Low | "Low" | Stone text `#78716c` on `rgba(120, 113, 108, 0.12)` | `rgba(120, 113, 108, 0.06)` | 4px `#78716c` |

Badge placement: top-right of card, inline with condition name.
Badge style: `text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full`

Stone border color bumped from `#d6d3d1` to `#78716c` to be actually visible.

### Exposure Overview moved to top of Health Status page

- Currently: right column in `grid lg:grid-cols-[1.4fr_1fr]` alongside "My Results"
- New: full-width card above the results section — most important data gets top position
- "My Results" section goes below as full-width

### Consistent skeleton loading on Health Status page

- Each section shows its own shimmer skeleton while its query is loading
- Uses existing `SkeletonBlock` / `SkeletonRows` components
- No content shift — skeleton dimensions match real content

## Files to change

- `frontend/src/lib/exposureSort.ts` — add `getUrgencyConfig()` returning label key, colors, background
- `frontend/src/pages/DashboardPage.tsx` — add urgency badge + background to exposure cards
- `frontend/src/pages/HealthStatusPage.tsx` — reorder sections, add urgency treatment, fix loading skeletons
- `frontend/src/index.css` — update `.exposure-item` (4px border, remove hardcoded bg)
- `frontend/src/locales/en_US.json` — add urgency tier labels
- `frontend/src/locales/es_MX.json` — add urgency tier labels (Spanish)

## What doesn't change

- Scoring algorithm (exposureSort.ts scoring logic)
- Card content layout (condition, degree, count, status/timeframe)
- Sort order
- Dashboard page layout (exposure cards stay in the status card)
