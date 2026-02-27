# Symptom Filter — Guides Index Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a symptom filter bar to the STI guides index page — users select symptoms as chips, cards filter by OR match, sort by match count, and each visible card shows which selected symptoms it matches.

**Architecture:** All filter logic lives in exported pure functions in `useSymptomFilter.ts` (easy to unit-test without React) wrapped by a thin `useSymptomFilter` hook that adds `useState`. `GuidesIndexPage` stays dumb — it reads from the hook and renders. Symptom data (`SYMPTOM_LABELS` + `symptoms[]`) lives entirely in `stiContent.ts` alongside the existing `facts` chips — one file to touch when content changes.

**Tech Stack:** React 19, TypeScript, Vitest, react-i18next (lang via `i18n.language`), Lucide icons

---

## Context for the implementer

Read the design doc at `docs/plans/2026-02-26-symptom-filter-design.md` before starting.

Key files you'll touch:
- `frontend/src/lib/stiContent.ts` — single source of truth for STI data (lines 36–52 = `STIContent` interface, line 548+ = `STI_ORDER`)
- `frontend/src/lib/stiContent.test.ts` — existing STI data tests
- `frontend/src/pages/GuidesIndexPage.tsx` — the guides index page (hero + grid + CTA)
- `frontend/src/hooks/useSymptomFilter.ts` — **create new**
- `frontend/src/hooks/useSymptomFilter.test.ts` — **create new**
- `frontend/src/index.css` — global styles (search for `.guide-card` to find the existing guide card CSS)

Run tests: `cd frontend && npm test`
Run lint: `cd frontend && npm run lint`
Run build: `cd frontend && npm run build`

---

## Task 1: Add `SYMPTOM_LABELS` and `symptoms[]` to `stiContent.ts`

**Files:**
- Modify: `frontend/src/lib/stiContent.ts`
- Test: `frontend/src/lib/stiContent.test.ts`

### Step 1: Write the failing test first

Add to the bottom of `frontend/src/lib/stiContent.test.ts`:

```ts
import { STI_DATA, STI_ORDER, SYMPTOM_LABELS } from './stiContent';

// Add this describe block at the bottom of the file
describe('symptom data integrity', () => {
  it('SYMPTOM_LABELS is defined and non-empty', () => {
    expect(Object.keys(SYMPTOM_LABELS).length).toBeGreaterThan(0);
  });

  it('every condition has a symptoms array', () => {
    STI_ORDER.forEach((slug) => {
      expect(Array.isArray(STI_DATA[slug].symptoms)).toBe(true);
    });
  });

  it('every symptom key used in STI_DATA exists in SYMPTOM_LABELS', () => {
    const validKeys = new Set(Object.keys(SYMPTOM_LABELS));
    STI_ORDER.forEach((slug) => {
      STI_DATA[slug].symptoms.forEach((key) => {
        expect(validKeys.has(key), `Unknown symptom key "${key}" on ${slug}`).toBe(true);
      });
    });
  });
});
```

### Step 2: Run the test — confirm it fails

```bash
cd frontend && npm test -- --reporter=verbose 2>&1 | grep -A3 "symptom data"
```

Expected: FAIL — `SYMPTOM_LABELS` is not exported yet.

### Step 3: Add `SYMPTOM_LABELS`, update `STIContent` interface, add `symptoms[]` to all 10 STIs

**3a. Add `symptoms: string[]` to the `STIContent` interface** (around line 36 in `stiContent.ts`):

```ts
export interface STIContent {
  slug: string;
  title: { en: string; es: string };
  tagline: { en: string; es: string };
  facts: {
    type: 'bacterial' | 'viral' | 'parasitic';
    curable: boolean;
    vaccine: boolean;
  };
  symptoms: string[];   // ← ADD THIS LINE
  windowPeriod: WindowPeriod;
  guide?: GuideSection;
}
```

**3b. Add `SYMPTOM_LABELS` just before the `STI_DATA` export** (around line 54). Include the big maintainability comment:

```ts
// ---------------------------------------------------------------------------
// SYMPTOM LABELS — bilingual display text for each symptom key
//
// HOW TO MAINTAIN THIS:
//
//   Add a new symptom globally:
//     1. Add one entry to SYMPTOM_LABELS below (pick a snake_case key)
//     2. Add that key to the `symptoms` array of whichever STIs apply
//     3. Done — the filter picks it up automatically
//
//   Remove a symptom from one STI only:
//     1. Delete the key from that STI's `symptoms` array below
//     2. Nothing else to touch
//
//   Add a brand new STI:
//     1. Add an entry to STI_DATA with `symptoms: [...]` using existing keys
//        (if it needs a new symptom key, add that to SYMPTOM_LABELS first)
//     2. Add the slug to STI_ORDER
//
//   Rename a symptom key:
//     1. Update the key in SYMPTOM_LABELS
//     2. Find-replace that key string across all `symptoms` arrays in STI_DATA
//
// DATA SOURCE: Derived from CDC/WHO clinical guidelines.
// ⚠️  MUST be verified against authoritative sources before public launch.
//     See UPCOMING_FEATURES_AND_ROADMAP.md → "Authoritative STI Content Sources"
// ---------------------------------------------------------------------------
export const SYMPTOM_LABELS: Record<string, { en: string; es: string }> = {
  burning_urination:   { en: 'Burning when urinating',       es: 'Ardor al orinar' },
  unusual_discharge:   { en: 'Unusual discharge',             es: 'Secreción inusual' },
  sores_or_ulcers:     { en: 'Sores or ulcers',               es: 'Llagas o úlceras' },
  rash:                { en: 'Rash or skin changes',          es: 'Sarpullido o cambios en la piel' },
  itching:             { en: 'Itching or irritation',         es: 'Comezón o irritación' },
  swollen_lymph_nodes: { en: 'Swollen lymph nodes',           es: 'Ganglios inflamados' },
  pelvic_pain:         { en: 'Pelvic or abdominal pain',      es: 'Dolor pélvico o abdominal' },
  pain_during_sex:     { en: 'Pain during sex',               es: 'Dolor durante el sexo' },
  warts_or_bumps:      { en: 'Warts or bumps',                es: 'Verrugas o bultos' },
  flu_like_symptoms:   { en: 'Flu-like symptoms',             es: 'Síntomas gripales' },
};
```

**3c. Add `symptoms` array to each STI entry** in `STI_DATA`. Add the `symptoms` field right after the `facts` field on each entry:

```ts
// chlamydia
symptoms: ['burning_urination', 'unusual_discharge', 'pelvic_pain', 'pain_during_sex'],

// gonorrhea
symptoms: ['burning_urination', 'unusual_discharge', 'pelvic_pain', 'pain_during_sex'],

// syphilis
symptoms: ['sores_or_ulcers', 'rash', 'swollen_lymph_nodes', 'flu_like_symptoms'],

// hiv
symptoms: ['flu_like_symptoms', 'rash', 'swollen_lymph_nodes'],

// herpes
symptoms: ['sores_or_ulcers', 'itching', 'pain_during_sex', 'flu_like_symptoms'],

// hpv
symptoms: ['warts_or_bumps'],

// hepatitis_b
symptoms: ['flu_like_symptoms'],

// hepatitis_c
symptoms: ['flu_like_symptoms'],

// trichomoniasis
symptoms: ['burning_urination', 'unusual_discharge', 'itching', 'pain_during_sex'],

// mycoplasma_genitalium
symptoms: ['burning_urination', 'unusual_discharge', 'pelvic_pain', 'pain_during_sex'],
```

### Step 4: Run tests — confirm they pass

```bash
cd frontend && npm test -- --reporter=verbose 2>&1 | grep -A3 "symptom data"
```

Expected: all 3 new tests PASS. Existing tests should still pass (107+ passing).

### Step 5: Commit

```bash
git add frontend/src/lib/stiContent.ts frontend/src/lib/stiContent.test.ts
git commit -m "feat: add SYMPTOM_LABELS and symptoms arrays to all 10 STI entries"
```

---

## Task 2: Create `useSymptomFilter` pure functions and tests

**Files:**
- Create: `frontend/src/hooks/useSymptomFilter.ts`
- Create: `frontend/src/hooks/useSymptomFilter.test.ts`

### Step 1: Write the failing tests first

Create `frontend/src/hooks/useSymptomFilter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  computeMatchCounts,
  computeVisibleSlugs,
  computeAvailableSymptoms,
} from './useSymptomFilter';
import { STI_DATA, STI_ORDER, SYMPTOM_LABELS } from '../lib/stiContent';

const ALL_SYMPTOM_KEYS = Object.keys(SYMPTOM_LABELS);

// ─── computeMatchCounts ───────────────────────────────────────────────────────

describe('computeMatchCounts', () => {
  it('returns 0 for every STI when nothing is selected', () => {
    const counts = computeMatchCounts([], STI_ORDER, STI_DATA);
    STI_ORDER.forEach((slug) => expect(counts[slug]).toBe(0));
  });

  it('counts 1 for STIs that have the selected symptom', () => {
    const counts = computeMatchCounts(['warts_or_bumps'], STI_ORDER, STI_DATA);
    expect(counts['hpv']).toBe(1);
    expect(counts['chlamydia']).toBe(0);
  });

  it('counts correctly when multiple symptoms are selected', () => {
    // chlamydia has: burning_urination, unusual_discharge, pelvic_pain, pain_during_sex
    // selecting 3 of those + 1 it doesn't have
    const counts = computeMatchCounts(
      ['burning_urination', 'unusual_discharge', 'pelvic_pain', 'sores_or_ulcers'],
      STI_ORDER,
      STI_DATA
    );
    expect(counts['chlamydia']).toBe(3);
    expect(counts['syphilis']).toBe(1); // only sores_or_ulcers
    expect(counts['hpv']).toBe(0);
  });
});

// ─── computeVisibleSlugs ─────────────────────────────────────────────────────

describe('computeVisibleSlugs', () => {
  it('returns all slugs in original STI_ORDER when nothing is selected', () => {
    const result = computeVisibleSlugs([], STI_ORDER, STI_DATA);
    expect(result).toEqual([...STI_ORDER]);
  });

  it('filters out STIs with zero matches', () => {
    const result = computeVisibleSlugs(['warts_or_bumps'], STI_ORDER, STI_DATA);
    expect(result).toEqual(['hpv']);
  });

  it('includes all STIs that match at least one symptom', () => {
    // flu_like_symptoms: syphilis, hiv, herpes, hepatitis_b, hepatitis_c
    const result = computeVisibleSlugs(['flu_like_symptoms'], STI_ORDER, STI_DATA);
    expect(result).toContain('syphilis');
    expect(result).toContain('hiv');
    expect(result).toContain('herpes');
    expect(result).toContain('hepatitis_b');
    expect(result).toContain('hepatitis_c');
    expect(result).not.toContain('chlamydia');
    expect(result).not.toContain('hpv');
  });

  it('sorts cards by match count descending', () => {
    // chlamydia + gonorrhea have both burning_urination and sores_or_ulcers? No —
    // burning_urination: chlamydia, gonorrhea, trichomoniasis, mycoplasma_genitalium (2 each with sores)
    // sores_or_ulcers: syphilis, herpes (1 each)
    const selected = ['burning_urination', 'sores_or_ulcers'];
    const result = computeVisibleSlugs(selected, STI_ORDER, STI_DATA);
    const counts = computeMatchCounts(selected, STI_ORDER, STI_DATA);

    // All visible cards must have count > 0
    result.forEach((slug) => expect(counts[slug]).toBeGreaterThan(0));

    // Sorted descending: no card has a higher count than the card before it
    for (let i = 0; i < result.length - 1; i++) {
      expect(counts[result[i]]).toBeGreaterThanOrEqual(counts[result[i + 1]]);
    }
  });
});

// ─── computeAvailableSymptoms ─────────────────────────────────────────────────

describe('computeAvailableSymptoms', () => {
  it('returns all symptom keys when nothing is selected (all cards visible)', () => {
    const visibleSlugs = computeVisibleSlugs([], STI_ORDER, STI_DATA);
    const available = computeAvailableSymptoms(
      [],
      visibleSlugs,
      STI_ORDER,
      STI_DATA,
      ALL_SYMPTOM_KEYS
    );
    expect(available).toEqual(ALL_SYMPTOM_KEYS);
  });

  it('excludes already-selected symptoms', () => {
    const selected = ['burning_urination'];
    const visibleSlugs = computeVisibleSlugs(selected, STI_ORDER, STI_DATA);
    const available = computeAvailableSymptoms(
      selected,
      visibleSlugs,
      STI_ORDER,
      STI_DATA,
      ALL_SYMPTOM_KEYS
    );
    expect(available).not.toContain('burning_urination');
  });

  it('excludes symptoms whose matching STIs are already all visible', () => {
    // After selecting burning_urination:
    //   visible: chlamydia, gonorrhea, trichomoniasis, mycoplasma_genitalium
    //   unusual_discharge is ONLY in those same four → adding it adds no new cards
    const selected = ['burning_urination'];
    const visibleSlugs = computeVisibleSlugs(selected, STI_ORDER, STI_DATA);
    const available = computeAvailableSymptoms(
      selected,
      visibleSlugs,
      STI_ORDER,
      STI_DATA,
      ALL_SYMPTOM_KEYS
    );
    expect(available).not.toContain('unusual_discharge');
    expect(available).not.toContain('pelvic_pain');
    expect(available).not.toContain('pain_during_sex');
  });

  it('includes symptoms that would reveal at least one hidden card', () => {
    // After selecting burning_urination:
    //   hidden: syphilis, hiv, herpes, hpv, hepatitis_b, hepatitis_c
    //   flu_like_symptoms appears in syphilis, hiv, herpes, hep_b, hep_c → adds cards
    //   warts_or_bumps appears in hpv → adds a card
    const selected = ['burning_urination'];
    const visibleSlugs = computeVisibleSlugs(selected, STI_ORDER, STI_DATA);
    const available = computeAvailableSymptoms(
      selected,
      visibleSlugs,
      STI_ORDER,
      STI_DATA,
      ALL_SYMPTOM_KEYS
    );
    expect(available).toContain('flu_like_symptoms');
    expect(available).toContain('warts_or_bumps');
    expect(available).toContain('sores_or_ulcers');
  });

  it('returns empty array when all cards are already visible', () => {
    // burning_urination covers: chlamydia, gonorrhea, trichomoniasis, mycoplasma_genitalium
    // flu_like_symptoms covers: syphilis, hiv, herpes, hepatitis_b, hepatitis_c
    // warts_or_bumps covers: hpv
    // Together: all 10 STIs visible → no symptom can add more
    const selected = ['burning_urination', 'flu_like_symptoms', 'warts_or_bumps'];
    const visibleSlugs = computeVisibleSlugs(selected, STI_ORDER, STI_DATA);
    expect(visibleSlugs).toHaveLength(10); // guard: all visible
    const available = computeAvailableSymptoms(
      selected,
      visibleSlugs,
      STI_ORDER,
      STI_DATA,
      ALL_SYMPTOM_KEYS
    );
    expect(available).toEqual([]);
  });
});
```

### Step 2: Run tests — confirm they fail

```bash
cd frontend && npm test -- --reporter=verbose 2>&1 | grep -A3 "computeMatch\|computeVisible\|computeAvailable"
```

Expected: FAIL — module not found.

### Step 3: Create `useSymptomFilter.ts` with the pure functions

Create `frontend/src/hooks/useSymptomFilter.ts`:

```ts
import { useState } from 'react';
import { STI_DATA, STI_ORDER, SYMPTOM_LABELS, type STIContent } from '../lib/stiContent';

// ─── Pure functions (exported for testing) ───────────────────────────────────

export function computeMatchCounts(
  selectedSymptoms: string[],
  stiOrder: readonly string[],
  stiData: Record<string, STIContent>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const slug of stiOrder) {
    counts[slug] = selectedSymptoms.filter((s) => stiData[slug].symptoms.includes(s)).length;
  }
  return counts;
}

export function computeVisibleSlugs(
  selectedSymptoms: string[],
  stiOrder: readonly string[],
  stiData: Record<string, STIContent>
): string[] {
  if (selectedSymptoms.length === 0) return [...stiOrder];
  const counts = computeMatchCounts(selectedSymptoms, stiOrder, stiData);
  return [...stiOrder]
    .filter((slug) => counts[slug] > 0)
    .sort((a, b) => counts[b] - counts[a]);
}

export function computeAvailableSymptoms(
  selectedSymptoms: string[],
  visibleSlugs: string[],
  stiOrder: readonly string[],
  stiData: Record<string, STIContent>,
  allSymptomKeys: string[]
): string[] {
  // When nothing is selected, all symptoms are available
  if (selectedSymptoms.length === 0) return allSymptomKeys;

  const visibleSet = new Set(visibleSlugs);
  const selectedSet = new Set(selectedSymptoms);

  return allSymptomKeys.filter((key) => {
    if (selectedSet.has(key)) return false;
    // Include only if adding this symptom would reveal at least one currently-hidden card
    return stiOrder.some(
      (slug) => !visibleSet.has(slug) && stiData[slug].symptoms.includes(key)
    );
  });
}

// ─── React hook ───────────────────────────────────────────────────────────────

export interface UseSymptomFilterResult {
  selectedSymptoms: string[];
  visibleSlugs: string[];
  availableSymptoms: string[];
  matchCounts: Record<string, number>;
  addSymptom: (key: string) => void;
  removeSymptom: (key: string) => void;
  clearAll: () => void;
}

export function useSymptomFilter(): UseSymptomFilterResult {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const allSymptomKeys = Object.keys(SYMPTOM_LABELS);
  const matchCounts = computeMatchCounts(selectedSymptoms, STI_ORDER, STI_DATA);
  const visibleSlugs = computeVisibleSlugs(selectedSymptoms, STI_ORDER, STI_DATA);
  const availableSymptoms = computeAvailableSymptoms(
    selectedSymptoms,
    visibleSlugs,
    STI_ORDER,
    STI_DATA,
    allSymptomKeys
  );

  return {
    selectedSymptoms,
    visibleSlugs,
    availableSymptoms,
    matchCounts,
    addSymptom: (key) =>
      setSelectedSymptoms((prev) => (prev.includes(key) ? prev : [...prev, key])),
    removeSymptom: (key) =>
      setSelectedSymptoms((prev) => prev.filter((s) => s !== key)),
    clearAll: () => setSelectedSymptoms([]),
  };
}
```

### Step 4: Run tests — confirm they pass

```bash
cd frontend && npm test -- --reporter=verbose 2>&1 | grep -E "computeMatch|computeVisible|computeAvailable|PASS|FAIL"
```

Expected: all tests in `useSymptomFilter.test.ts` PASS.

### Step 5: Commit

```bash
git add frontend/src/hooks/useSymptomFilter.ts frontend/src/hooks/useSymptomFilter.test.ts
git commit -m "feat: add useSymptomFilter hook with pure logic and tests"
```

---

## Task 3: Wire up `GuidesIndexPage` with filter bar and matched chips

**Files:**
- Modify: `frontend/src/pages/GuidesIndexPage.tsx`

### Step 1: Read the current file before editing

Read `frontend/src/pages/GuidesIndexPage.tsx` in full before touching it.

### Step 2: Add the filter bar and matched chips

**3a. Add imports** at the top of `GuidesIndexPage.tsx`:

```ts
import { X } from 'lucide-react';
import { useSymptomFilter } from '../hooks/useSymptomFilter';
import { SYMPTOM_LABELS } from '../lib/stiContent';
```

**3b. Add hook call** inside `GuidesIndexPage()`, right after the `const lang` line:

```ts
const {
  selectedSymptoms,
  visibleSlugs,
  availableSymptoms,
  matchCounts,
  addSymptom,
  removeSymptom,
  clearAll,
} = useSymptomFilter();
```

**3c. Add the filter bar JSX** between the closing `</section>` of the hero and the opening `<section>` of the guides grid:

```tsx
{/* Symptom filter bar */}
<section className="container">
  <div className="symptom-filter-bar">
    <span className="symptom-filter-label">
      {lang === 'es' ? 'Filtrar por síntoma' : 'Filter by symptom'}
    </span>
    <div className="symptom-filter-chips">
      {selectedSymptoms.map((key) => (
        <button
          key={key}
          type="button"
          className="symptom-filter-chip"
          onClick={() => removeSymptom(key)}
          aria-label={`${lang === 'es' ? 'Quitar' : 'Remove'} ${SYMPTOM_LABELS[key]?.[lang]}`}
        >
          {SYMPTOM_LABELS[key]?.[lang]}
          <X className="w-3 h-3" aria-hidden="true" />
        </button>
      ))}

      {availableSymptoms.length > 0 && (
        <select
          className="symptom-add-select"
          value=""
          onChange={(e) => { if (e.target.value) addSymptom(e.target.value); }}
          aria-label={lang === 'es' ? 'Agregar síntoma' : 'Add symptom'}
        >
          <option value="">
            {lang === 'es' ? '+ Agregar síntoma' : '+ Add symptom'}
          </option>
          {availableSymptoms.map((key) => (
            <option key={key} value={key}>
              {SYMPTOM_LABELS[key]?.[lang]}
            </option>
          ))}
        </select>
      )}

      {selectedSymptoms.length > 0 && (
        <button
          type="button"
          className="symptom-clear-btn"
          onClick={clearAll}
        >
          {lang === 'es' ? 'Limpiar todo' : 'Clear all'}
        </button>
      )}
    </div>
  </div>
</section>
```

**3d. Replace the guides grid map** to use `visibleSlugs` instead of `STI_ORDER`, and pass `matchedSymptoms` to `GuideCardContent`:

Replace:
```tsx
{STI_ORDER.map((slug) => {
  const sti = STI_DATA[slug];
  const hasGuide = !!sti.guide;
  const isNoTest = sti.windowPeriod.noStandardTest;

  return (
    <div key={slug} role="listitem">
      {hasGuide ? (
        <Link
          to={`/guide/${slug}`}
          className="guide-card"
          aria-label={`${sti.title[lang]} guide`}
        >
          <GuideCardContent sti={sti} lang={lang} hasGuide={hasGuide} isNoTest={isNoTest} />
        </Link>
      ) : (
        <div
          className="guide-card guide-card--disabled"
          aria-label={`${sti.title[lang]} — ${lang === 'es' ? 'próximamente' : 'coming soon'}`}
        >
          <GuideCardContent sti={sti} lang={lang} hasGuide={hasGuide} isNoTest={isNoTest} />
        </div>
      )}
    </div>
  );
})}
```

With:
```tsx
{visibleSlugs.map((slug) => {
  const sti = STI_DATA[slug];
  const hasGuide = !!sti.guide;
  const isNoTest = sti.windowPeriod.noStandardTest;
  const matchedSymptoms = selectedSymptoms.length > 0
    ? selectedSymptoms.filter((s) => sti.symptoms.includes(s))
    : [];

  return (
    <div key={slug} role="listitem">
      {hasGuide ? (
        <Link
          to={`/guide/${slug}`}
          className="guide-card"
          aria-label={`${sti.title[lang]} guide`}
        >
          <GuideCardContent
            sti={sti}
            lang={lang}
            hasGuide={hasGuide}
            isNoTest={isNoTest}
            matchedSymptoms={matchedSymptoms}
          />
        </Link>
      ) : (
        <div
          className="guide-card guide-card--disabled"
          aria-label={`${sti.title[lang]} — ${lang === 'es' ? 'próximamente' : 'coming soon'}`}
        >
          <GuideCardContent
            sti={sti}
            lang={lang}
            hasGuide={hasGuide}
            isNoTest={isNoTest}
            matchedSymptoms={matchedSymptoms}
          />
        </div>
      )}
    </div>
  );
})}
```

**3e. Update `GuideCardContentProps`** to accept `matchedSymptoms`:

```ts
interface GuideCardContentProps {
  sti: typeof STI_DATA[keyof typeof STI_DATA];
  lang: Lang;
  hasGuide: boolean;
  isNoTest: boolean | undefined;
  matchedSymptoms: string[];   // ← ADD
}
```

**3f. Update `GuideCardContent`** to render matched chips below `<FactChips>`:

```tsx
function GuideCardContent({ sti, lang, hasGuide, isNoTest, matchedSymptoms }: GuideCardContentProps) {
  return (
    <>
      <h2 className="guide-card-title">{sti.title[lang]}</h2>
      <p className="guide-card-tagline">{sti.tagline[lang]}</p>
      <FactChips facts={sti.facts} />
      {matchedSymptoms.length > 0 && (
        <div className="symptom-matched-row" aria-label={lang === 'es' ? 'Síntomas coincidentes' : 'Matched symptoms'}>
          {matchedSymptoms.map((key) => (
            <span key={key} className="symptom-matched-chip">
              {SYMPTOM_LABELS[key]?.[lang]}
            </span>
          ))}
        </div>
      )}
      <div className="guide-card-footer">
        {!isNoTest && (
          <p className="guide-card-window">
            {lang === 'es' ? 'Ventana: ' : 'Window: '}
            {sti.windowPeriod.minDays}–{sti.windowPeriod.maxDays}{' '}
            {lang === 'es' ? 'días' : 'days'}
          </p>
        )}
        <div className="guide-card-tags">
          {!hasGuide && (
            <span className="guide-tag guide-tag--coming-soon">
              {lang === 'es' ? 'Próximamente' : 'Coming soon'}
            </span>
          )}
          {isNoTest && (
            <span className="guide-tag guide-tag--no-test">
              {lang === 'es' ? 'Sin prueba rutinaria' : 'No routine test'}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
```

### Step 3: Check build passes (TypeScript check)

```bash
cd frontend && npm run build 2>&1 | tail -10
```

Expected: `✓ built in ...` with no TypeScript errors.

### Step 4: Commit

```bash
git add frontend/src/pages/GuidesIndexPage.tsx
git commit -m "feat: wire symptom filter into GuidesIndexPage"
```

---

## Task 4: Add CSS for filter bar and matched chips

**Files:**
- Modify: `frontend/src/index.css`

### Step 1: Find where to insert

Search for `.guide-card {` in `frontend/src/index.css` to find the guides section. Add the new rules immediately after the existing guide card rules.

### Step 2: Add the CSS

```css
/* ── Symptom filter bar ────────────────────────────────────────────────── */

.symptom-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  margin-bottom: 0.5rem;
}

.symptom-filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.symptom-filter-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
}

/* Selected symptom chip (removable, indigo) */
.symptom-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.symptom-filter-chip:hover {
  background: var(--color-primary-dark);
}

/* "Add symptom" select */
.symptom-add-select {
  appearance: none;
  -webkit-appearance: none;
  padding: 0.25rem 0.75rem;
  border: 1.5px dashed var(--color-primary);
  border-radius: 9999px;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.symptom-add-select:hover,
.symptom-add-select:focus {
  background: rgba(99, 102, 241, 0.06);
  outline: none;
}

/* "Clear all" button */
.symptom-clear-btn {
  background: none;
  border: none;
  padding: 0.25rem 0.25rem;
  font-size: 0.75rem;
  color: var(--color-muted);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.15s ease;
}

.symptom-clear-btn:hover {
  color: var(--color-foreground);
}

/* ── Matched symptom chips on guide cards ──────────────────────────────── */

.symptom-matched-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.symptom-matched-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 500;
}

@media (max-width: 380px) {
  .symptom-filter-chip,
  .symptom-matched-chip {
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
```

### Step 3: Run full test + build

```bash
cd frontend && npm test && npm run build 2>&1 | tail -8
```

Expected: all tests pass, build succeeds.

### Step 4: Commit

```bash
git add frontend/src/index.css
git commit -m "feat: add CSS for symptom filter bar and matched chips"
git push
```

---

## Final verification checklist

Before declaring done:

- [ ] `npm test` — all tests pass (no regressions)
- [ ] `npm run build` — clean TypeScript build
- [ ] `npm run lint` — no lint errors
- [ ] Manual smoke test on `localhost`:
  - [ ] Guides page loads showing all 10 cards and "Filter by symptom" label with `[+ Add symptom]`
  - [ ] Selecting "Burning when urinating" → 4 cards visible, all with "Burning when urinating" matched chip
  - [ ] Adding "Sores or ulcers" → 6 cards visible, syphilis/herpes show 1 match chip, chlamydia etc. show 2 match chips (burning + second if applicable — actually chlamydia doesn't have sores, so it still shows only the burning chip; syphilis/herpes show sores chip)
  - [ ] `[+ Add symptom]` dropdown excludes `unusual_discharge` and `pelvic_pain` (already covered by visible cards)
  - [ ] Selecting symptoms that cover all 10 STIs → `[+ Add symptom]` disappears
  - [ ] `Clear all` → all 10 cards back in original order, no matched chips
  - [ ] Spanish language: filter bar label, chips, and "Clear all" all show in Spanish
