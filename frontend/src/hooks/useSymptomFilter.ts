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
