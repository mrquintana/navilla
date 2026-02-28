import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HealthLogStats } from './HealthLogStats';
import type { HealthLogSummary } from '../../lib/api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'count' in opts && 'total' in opts)
        return `${key}:${opts.count}/${opts.total}`;
      if (opts && 'count' in opts) return `${key}:${opts.count}`;
      return key;
    },
    i18n: { language: 'en_US' },
  }),
}));

function makeSummary(overrides: Partial<HealthLogSummary> = {}): HealthLogSummary {
  return {
    daysSinceLastTest: 14,
    testsThisYear: 3,
    conditionsCovered: 5,
    totalStandardConditions: 10,
    conditions: [],
    ...overrides,
  };
}

describe('HealthLogStats', () => {
  it('renders days since last test when > 0', () => {
    render(<HealthLogStats summary={makeSummary({ daysSinceLastTest: 30 })} />);

    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('healthLog.daysSinceTest')).toBeInTheDocument();
  });

  it('renders "never tested" when daysSinceLastTest is -1', () => {
    render(<HealthLogStats summary={makeSummary({ daysSinceLastTest: -1 })} />);

    expect(screen.getByText('healthLog.neverTested')).toBeInTheDocument();
    expect(screen.queryByText('healthLog.daysSinceTest')).not.toBeInTheDocument();
  });

  it('renders tests this year count', () => {
    render(<HealthLogStats summary={makeSummary({ testsThisYear: 7 })} />);

    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/healthLog\.testsThisYear/)).toBeInTheDocument();
  });

  it('renders coverage count (X/total)', () => {
    render(
      <HealthLogStats
        summary={makeSummary({ conditionsCovered: 4, totalStandardConditions: 10 })}
      />
    );

    expect(screen.getByText('4/10')).toBeInTheDocument();
    // Use getAllByText since "coverage" text appears in both the stat row and the description
    const coverageElements = screen.getAllByText(/healthLog\.coverage/);
    expect(coverageElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders coverage progress bar with correct aria values', () => {
    render(
      <HealthLogStats
        summary={makeSummary({ conditionsCovered: 5, totalStandardConditions: 10 })}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('renders 0% coverage when totalStandardConditions is 0', () => {
    render(
      <HealthLogStats
        summary={makeSummary({ conditionsCovered: 0, totalStandardConditions: 0 })}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders coverage description text', () => {
    render(
      <HealthLogStats
        summary={makeSummary({ conditionsCovered: 3, totalStandardConditions: 10 })}
      />
    );

    expect(screen.getByText('healthLog.coverageDescription:3/10')).toBeInTheDocument();
  });
});
