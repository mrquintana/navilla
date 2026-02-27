# Symptom Filter — Guides Index Design

**Date:** 2026-02-26
**Status:** Approved

---

## Goal

Add a symptom filter to the STI guides index page. Users select symptoms as chips; the guides grid filters and sorts by match count in real time. This replaces the originally planned standalone symptom guide, which added no value over AI chatbots.

## Why This Approach

A separate symptom checker page (select symptoms → see results) is redundant — ChatGPT and Gemini already do this conversationally and better. What they can't do is link the result directly to our calculator, guide detail pages, and future personal tracker.

The filter is lightweight: it's just a smarter way to navigate content that already exists.

---

## Data Layer

### Symptom keys (canonical, language-agnostic)

All keys live in `SYMPTOM_LABELS` in `stiContent.ts`. Each key maps to bilingual display text.

```ts
export const SYMPTOM_LABELS: Record<string, { en: string; es: string }> = {
  burning_urination:   { en: 'Burning when urinating', es: 'Ardor al orinar' },
  unusual_discharge:   { en: 'Unusual discharge',      es: 'Secreción inusual' },
  sores_or_ulcers:     { en: 'Sores or ulcers',        es: 'Llagas o úlceras' },
  rash:                { en: 'Rash or skin changes',   es: 'Sarpullido o cambios en la piel' },
  itching:             { en: 'Itching or irritation',  es: 'Comezón o irritación' },
  swollen_lymph_nodes: { en: 'Swollen lymph nodes',    es: 'Ganglios inflamados' },
  pelvic_pain:         { en: 'Pelvic or abdominal pain', es: 'Dolor pélvico o abdominal' },
  pain_during_sex:     { en: 'Pain during sex',        es: 'Dolor durante el sexo' },
  warts_or_bumps:      { en: 'Warts or bumps',         es: 'Verrugas o bultos' },
  flu_like_symptoms:   { en: 'Flu-like symptoms',      es: 'Síntomas gripales' },
};
```

### Adding / removing symptoms — how to maintain this

**To add a new symptom globally:**
1. Add one entry to `SYMPTOM_LABELS` in `stiContent.ts`
2. Add the key to whichever STI `symptoms` arrays apply
3. That's it — the filter picks it up automatically

**To remove a symptom from one STI:**
1. Delete the key from that STI's `symptoms` array in `stiContent.ts`
2. Nothing else to touch

**To add a new STI:**
1. Add an entry to `STI_DATA` with a `symptoms: string[]` using existing keys
2. If it has a symptom not in `SYMPTOM_LABELS`, add that key there first
3. Add the slug to `STI_ORDER`

**To rename a symptom key:**
1. Update the key in `SYMPTOM_LABELS`
2. Find-replace the key string across all `symptoms` arrays in `STI_DATA`

### STI → symptom mapping

Derived from CDC/WHO guidelines (training data). **Must be verified against authoritative sources before public launch** — see roadmap for source list.

| STI | Symptoms |
|-----|---------|
| Chlamydia | burning_urination, unusual_discharge, pelvic_pain, pain_during_sex |
| Gonorrhea | burning_urination, unusual_discharge, pelvic_pain, pain_during_sex |
| Syphilis | sores_or_ulcers, rash, swollen_lymph_nodes, flu_like_symptoms |
| HIV | flu_like_symptoms, rash, swollen_lymph_nodes |
| Herpes (HSV) | sores_or_ulcers, itching, pain_during_sex, flu_like_symptoms |
| HPV | warts_or_bumps |
| Hepatitis B | flu_like_symptoms |
| Hepatitis C | flu_like_symptoms |
| Trichomoniasis | burning_urination, unusual_discharge, itching, pain_during_sex |
| Mycoplasma genitalium | burning_urination, unusual_discharge, pelvic_pain, pain_during_sex |

---

## Filter Logic (OR + sort)

- **No symptoms selected:** show all cards in original `STI_ORDER`
- **≥1 symptom selected:** show only cards where `sti.symptoms` intersects the selected set (at least 1 match)
- **Sort:** most matched symptoms first; ties keep original order
- **availableSymptoms:** symptoms not yet selected that would bring at least 1 currently-hidden card into view. When this is empty, hide `[+ Add symptom]`
- **Clear:** reset to unfiltered, original order, no matched chips on cards

---

## UI

### Filter bar (between hero and grid)

```
[ × Burning when urinating ] [ × Unusual discharge ]  [ + Add symptom ▾ ]   Clear all
```

- Appears above the guides grid at all times (even with 0 symptoms selected, shows just the `[+ Add symptom]` button quietly)
- Selected symptoms: indigo chips with `×` to remove
- `[+ Add symptom]` opens a dropdown of `availableSymptoms` only
- `[+ Add symptom]` hidden when `availableSymptoms` is empty
- `Clear all` link appears once ≥1 symptom is selected
- Dropdown closes after each selection

### Guide cards when filter active

Below `FactChips`, a "Matches:" row shows which selected symptoms apply to that card as small indigo-tinted chips (no `×`). Cards with 0 matches are hidden. When filter is cleared, matched chips disappear.

### Mobile

- Chips wrap naturally; `[+ Add symptom]` stays at end of chip row
- Dropdown becomes native `<select>` on mobile to avoid positioning issues
- Chips truncate with ellipsis below 380px

---

## Architecture

### `useSymptomFilter` hook

All filter logic lives here. `GuidesIndexPage` stays dumb.

```ts
interface UseSymptomFilterResult {
  selectedSymptoms: string[];
  visibleStis: string[];          // slugs, filtered + sorted
  availableSymptoms: string[];    // symptoms that would add new cards
  matchCounts: Record<string, number>; // slug → matched count
  addSymptom: (key: string) => void;
  removeSymptom: (key: string) => void;
  clearAll: () => void;
}
```

### Files touched

- `src/lib/stiContent.ts` — add `SYMPTOM_LABELS` + `symptoms[]` to `STIContent` and all 10 STI entries
- `src/hooks/useSymptomFilter.ts` — new hook (pure logic, no React deps beyond useState)
- `src/hooks/useSymptomFilter.test.ts` — unit tests
- `src/pages/GuidesIndexPage.tsx` — wire up hook + render filter bar + matched chips on cards
- `src/lib/stiContent.test.ts` — extend with symptom key integrity check

---

## Tests

### `stiContent.test.ts` additions
- Every key in every STI's `symptoms[]` exists in `SYMPTOM_LABELS` (typo guard)

### `useSymptomFilter.test.ts`
- OR logic: selecting `burning_urination` returns only STIs that have it
- Match count sort: 2-match cards sort above 1-match cards
- `availableSymptoms` excludes already-selected symptoms
- `availableSymptoms` only includes symptoms that would add ≥1 new card
- `availableSymptoms` is empty when all matchable cards are already visible
- `clearAll` resets to original `STI_ORDER`
- Edge case: symptom shared only by cards already visible does not appear in `availableSymptoms`
