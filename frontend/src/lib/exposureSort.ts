import type { ExposureItem } from './api';

export type UrgencyTier = 'high' | 'medium' | 'low';

const STATUS_SCORES: Record<string, number> = {
  active: 2,
  resolved: 0,
};

const DEGREE_SCORE = (degree: number): number => Math.max(0, 4 - degree);

const RECENCY_SCORES: Record<string, number> = {
  '0_30d': 4,
  '31_90d': 3,
  '91_365d': 2,
  '365d_plus': 1,
};

export function computeExposureScore(item: ExposureItem): number {
  const statusScore = (STATUS_SCORES[item.status] ?? 0) * 4;
  const degreeScore = DEGREE_SCORE(item.closestDegree) * 3;
  const recencyScore = (RECENCY_SCORES[item.timeframe] ?? 1) * 3;
  const caseScore = Math.min(item.count, 10) * 1;
  return statusScore + degreeScore + recencyScore + caseScore;
}

export function getUrgencyTier(score: number): UrgencyTier {
  if (score >= 25) return 'high';
  if (score >= 15) return 'medium';
  return 'low';
}

const RECENCY_RANK: Record<string, number> = {
  '0_30d': 0,
  '31_90d': 1,
  '91_365d': 2,
  '365d_plus': 3,
};

export function sortExposureItems(items: ExposureItem[]): ExposureItem[] {
  return [...items].sort((a, b) => {
    const scoreA = computeExposureScore(a);
    const scoreB = computeExposureScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
    // Tiebreaker: degree ascending
    if (a.closestDegree !== b.closestDegree) return a.closestDegree - b.closestDegree;
    // Tiebreaker: recency descending (lower rank = more recent)
    return (RECENCY_RANK[a.timeframe] ?? 3) - (RECENCY_RANK[b.timeframe] ?? 3);
  });
}

export interface UrgencyConfig {
  tier: UrgencyTier;
  labelKey: string;
  borderColor: string;
  badgeColor: string;
  badgeBg: string;
  cardBg: string;
}

const URGENCY_CONFIGS: Record<UrgencyTier, Omit<UrgencyConfig, 'tier'>> = {
  high: {
    labelKey: 'dashboard.urgencyHigh',
    borderColor: '#e3a008',
    badgeColor: '#e3a008',
    badgeBg: 'rgba(227, 160, 8, 0.12)',
    cardBg: 'rgba(227, 160, 8, 0.06)',
  },
  medium: {
    labelKey: 'dashboard.urgencyMedium',
    borderColor: '#4f46e5',
    badgeColor: '#4f46e5',
    badgeBg: 'rgba(99, 102, 241, 0.12)',
    cardBg: 'rgba(99, 102, 241, 0.06)',
  },
  low: {
    labelKey: 'dashboard.urgencyLow',
    borderColor: '#78716c',
    badgeColor: '#78716c',
    badgeBg: 'rgba(120, 113, 108, 0.12)',
    cardBg: 'rgba(120, 113, 108, 0.06)',
  },
};

export function getUrgencyConfig(item: ExposureItem): UrgencyConfig {
  const score = computeExposureScore(item);
  const tier = getUrgencyTier(score);
  return { tier, ...URGENCY_CONFIGS[tier] };
}

export function getExposureCardStyle(item: ExposureItem): React.CSSProperties {
  const config = getUrgencyConfig(item);
  return {
    borderLeftWidth: '4px',
    borderLeftColor: config.borderColor,
    background: config.cardBg,
  };
}
