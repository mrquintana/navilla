# Week 2 Layer 0 Polish — Design Doc

**Date:** 2026-02-26
**Scope:** Remaining Week 2 deliverables + UX enrichment of calculator and STI guide pages
**Approach:** B — Richer Cards + Quick Stats + Calculator Depth

---

## Problem

The window period calculator and STI guide pages are functional but visually plain:
- Guide index cards show only title + window range + availability tag — no context about what each condition is
- Guide detail sections are single dense paragraphs — walls of text, hard to scan on mobile
- All 6 guide section icons use the same `Activity` icon (oversight)
- Calculator results table is static — a date badge tells you when you can test but not how close you are
- 5 of 10 guide cards are "coming soon" — half the grid is dead

---

## Data Model Changes (`stiContent.ts`)

Two new fields on `STIContent`:

```ts
/** One plain-language sentence shown on cards and detail hero */
tagline: { en: string; es: string };

/** Quick facts for chip display */
facts: {
  type: 'bacterial' | 'viral' | 'parasitic';
  curable: boolean;   // true = antibiotics/antivirals resolve infection; false = lifelong management
  vaccine: boolean;   // widely recommended vaccine exists
};
```

Guide section text stays as `string` type but uses markdown-style formatting:
- `- item` → bullet list items
- `**text**` → bold emphasis

A micro-renderer utility (`src/lib/renderMarkdown.tsx`) handles display — no external dependency.

---

## Micro-renderer

Small utility (~25 lines) that converts authored markdown-style strings to React elements:
- Groups consecutive `- ` lines into `<ul><li>` lists
- Renders `**text**` spans as `<strong>`
- Plain text lines become `<p>`

Used only in `GuideDetailPage` section bodies. Zero bundle cost.

---

## Component Changes

### Guide Index Cards (`GuidesIndexPage`)

**Before:** Title + "Window: X–Y days" + Available/Coming soon tag

**After:**
- Title (unchanged)
- Tagline sentence (muted, 0.85rem)
- 3 fact chips: type chip (Bacterial/Viral/Parasitic with color tint) + curable chip (Curable green / Lifelong stone) + vaccine chip (teal, only rendered if `vaccine: true`)
- Window period as subtle footer line
- "Coming soon" cards keep tagline + chips — informative even without a full guide

### Guide Detail Page (`GuideDetailPage`)

**Quick Stats block** replaces current `WindowPeriodCallout`:
- Horizontal chip row: fact chips + window period pill + "Calculate my dates" button
- Wraps cleanly on mobile
- Tagline added to hero subtitle

**Section grid:**
- Text rendered through micro-renderer (bullets, bold)
- Unique icon per section:
  - What → `BookOpen`
  - Transmission → `ArrowUpDown`
  - Symptoms → `Thermometer`
  - Testing → `FlaskConical`
  - Treatment → `Pill`
  - Prevention → `ShieldCheck`

### Calculator Results (`WindowPeriodCalculatorPage`)

Each row gains a progress indicator between condition name and status badge:
- Thin bar: fills `daysWaited / minDays`, capped at 100%
- Color: indigo while waiting, green when testable, stone for no-standard-test
- Micro-label above bar: `"14 / 90 days"` (hidden for no-standard-test rows)
- Mobile: bar spans full width under the condition name (stacked layout already exists)

---

## Content Work

### Existing 5 guides — validation pass
- Confirm citations link to condition-specific CDC pages (not just `/cdc.gov/std/`)
- Rewrite section text with `- bullets` for lists, `**bold**` for key terms
- No factual changes expected — content is medically accurate

### New 5 guides (Week 3 content, written now)
Full 6-section guide objects for: `hpv`, `hepatitis_b`, `hepatitis_c`, `trichomoniasis`, `mycoplasma_genitalium`
- Same structure: what, transmission, symptoms, testing, treatment, prevention + sources
- Sources: condition-specific CDC URLs + WHO fact sheets + CENSIDA
- Bilingual (en + es)

---

## Files Affected

| File | Change |
|------|--------|
| `src/lib/stiContent.ts` | Add `tagline`, `facts` to all 10 entries; reformat guide text with markdown; add 5 new guide objects |
| `src/lib/renderMarkdown.tsx` | New — micro-renderer utility |
| `src/lib/renderMarkdown.test.ts` | New — unit tests for micro-renderer |
| `src/pages/GuidesIndexPage.tsx` | Render tagline + fact chips on cards |
| `src/pages/GuideDetailPage.tsx` | Quick Stats block, unique section icons, micro-renderer for body text |
| `src/pages/WindowPeriodCalculatorPage.tsx` | Per-row progress bar in results table |
| `src/index.css` | Styles for fact chips, progress bar, Quick Stats block |
| `src/locales/en_US.json` | Chip label keys |
| `src/locales/es_MX.json` | Spanish chip labels |

---

## What is NOT in scope

- Symptom guide flow (Week 3)
- Clinic finder (Week 3)
- Calculator visual timeline layout (Approach C — deferred)
- Sticky jump-nav on guide detail (Approach C — deferred)
