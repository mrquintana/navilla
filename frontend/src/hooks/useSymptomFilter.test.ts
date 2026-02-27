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
    // Note: pain_during_sex IS available here because herpes (hidden) has it — correctly omitted
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
