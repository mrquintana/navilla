import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConditionCard } from './ConditionCard';
import type { ConditionSummary } from '../../lib/api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en_US' },
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

function makeCondition(overrides: Partial<ConditionSummary> = {}): ConditionSummary {
  return {
    conditionType: 'HIV',
    customCondition: null,
    latestStatus: 'NEGATIVE',
    latestResultValue: null,
    lastTestDate: '2026-02-15',
    totalTests: 3,
    hasPositive: false,
    ...overrides,
  };
}

describe('ConditionCard', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders condition name from translation key', () => {
    render(<ConditionCard condition={makeCondition()} />);

    expect(screen.getByText('healthLog.conditions.HIV')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<ConditionCard condition={makeCondition({ latestStatus: 'NEGATIVE' })} />);

    expect(screen.getByText('healthLog.status.negative')).toBeInTheDocument();
  });

  it('renders last test date formatted', () => {
    render(<ConditionCard condition={makeCondition({ lastTestDate: '2026-02-15' })} />);

    expect(screen.getByText(/healthLog\.lastTested/)).toBeInTheDocument();
  });

  it('renders test count', () => {
    render(<ConditionCard condition={makeCondition({ totalTests: 5 })} />);

    expect(screen.getByText(/5 healthLog\.tests/)).toBeInTheDocument();
  });

  it('renders singular test label for 1 test', () => {
    render(<ConditionCard condition={makeCondition({ totalTests: 1 })} />);

    expect(screen.getByText(/1 healthLog\.test$/)).toBeInTheDocument();
  });

  it('navigates to condition detail on click', () => {
    render(<ConditionCard condition={makeCondition({ conditionType: 'SYPHILIS' })} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/health-log/SYPHILIS');
  });

  it('does not navigate for custom conditions (no detail page)', () => {
    render(
      <ConditionCard
        condition={makeCondition({
          conditionType: null,
          customCondition: 'Mycoplasma',
        })}
      />
    );

    // Custom conditions render as a div, not a button
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    // Verify no navigation happens
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('renders custom condition name when conditionType is null', () => {
    render(
      <ConditionCard
        condition={makeCondition({
          conditionType: null,
          customCondition: 'Mycoplasma',
        })}
      />
    );

    expect(screen.getByText('Mycoplasma')).toBeInTheDocument();
  });

  it('shows positive badge with error badge class', () => {
    render(
      <ConditionCard condition={makeCondition({ latestStatus: 'POSITIVE' })} />
    );

    const badge = screen.getByText('healthLog.status.positive');
    expect(badge.className).toContain('badge-error');
  });

  it('shows pending badge with warning badge class', () => {
    render(
      <ConditionCard condition={makeCondition({ latestStatus: 'PENDING' })} />
    );

    const badge = screen.getByText('healthLog.status.pending');
    expect(badge.className).toContain('badge-warning');
  });

  it('has accessible aria-label with condition name and status', () => {
    render(<ConditionCard condition={makeCondition()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute(
      'aria-label',
      'healthLog.conditions.HIV - healthLog.status.negative'
    );
  });
});
