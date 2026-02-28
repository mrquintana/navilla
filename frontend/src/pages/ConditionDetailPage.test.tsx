import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ConditionDetailPage } from './ConditionDetailPage';
import type { ConditionHistory } from '../lib/api';

// ---- Hoisted mock fns ----
const useConditionHistoryMock = vi.fn();

vi.mock('../hooks/useHealthLog', () => ({
  useConditionHistory: (type: string) => useConditionHistoryMock(type),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    session: { access_token: 'token' },
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'defaultValue' in opts) return opts.defaultValue as string;
      return key;
    },
    i18n: { language: 'en_US' },
  }),
}));

const mockParams: Record<string, string> = { condition: 'HIV' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...actual,
    useParams: () => mockParams,
  };
});

function makeHistory(overrides: Partial<ConditionHistory> = {}): ConditionHistory {
  return {
    conditionType: 'HIV',
    latestStatus: 'NEGATIVE',
    totalTests: 3,
    lastTestDate: '2026-02-15',
    entries: [
      {
        visitId: 'v1',
        testDate: '2026-02-15',
        status: 'NEGATIVE',
        resultValue: null,
        referenceRange: null,
        labName: 'Clínica Condesa',
        labProvider: null,
        verified: false,
        clearedAt: null,
      },
      {
        visitId: 'v2',
        testDate: '2025-11-20',
        status: 'NEGATIVE',
        resultValue: null,
        referenceRange: null,
        labName: null,
        labProvider: 'QUEST',
        verified: true,
        clearedAt: null,
      },
    ],
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ConditionDetailPage />
    </MemoryRouter>
  );
}

describe('ConditionDetailPage', () => {
  beforeEach(() => {
    useConditionHistoryMock.mockReset();
    mockParams.condition = 'HIV';
  });

  it('renders loading skeleton while data loads', () => {
    useConditionHistoryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = renderPage();

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('renders error state when query fails', () => {
    useConditionHistoryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderPage();

    expect(screen.getByText('healthLog.errors.loadFailed')).toBeInTheDocument();
  });

  it('shows back link to /health-log', () => {
    useConditionHistoryMock.mockReturnValue({
      data: makeHistory(),
      isLoading: false,
      isError: false,
    });

    renderPage();

    const backLink = screen.getByText('healthLog.backToHealthLog');
    expect(backLink.closest('a')).toHaveAttribute('href', '/health-log');
  });

  it('renders condition name in heading', () => {
    useConditionHistoryMock.mockReturnValue({
      data: makeHistory({ conditionType: 'HIV' }),
      isLoading: false,
      isError: false,
    });

    renderPage();

    // The heading includes conditionType (via t() with defaultValue) and "testHistory"
    expect(screen.getByText(/HIV/)).toBeInTheDocument();
    expect(screen.getByText(/healthLog\.testHistory/)).toBeInTheDocument();
  });

  it('renders current status badge', () => {
    useConditionHistoryMock.mockReturnValue({
      data: makeHistory({ latestStatus: 'NEGATIVE' }),
      isLoading: false,
      isError: false,
    });

    renderPage();

    // Multiple "negative" badges: one for current status + one per entry
    const badges = screen.getAllByText('healthLog.status.negative');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders test count', () => {
    useConditionHistoryMock.mockReturnValue({
      data: makeHistory({ totalTests: 3 }),
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(screen.getByText('3 healthLog.tests')).toBeInTheDocument();
  });

  it('renders singular test label for 1 test', () => {
    useConditionHistoryMock.mockReturnValue({
      data: makeHistory({
        totalTests: 1,
        entries: [
          {
            visitId: 'v1',
            testDate: '2026-02-15',
            status: 'NEGATIVE',
            resultValue: null,
            referenceRange: null,
            labName: null,
            labProvider: null,
            verified: false,
            clearedAt: null,
          },
        ],
      }),
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(screen.getByText('1 healthLog.test')).toBeInTheDocument();
  });

  it('renders history entries with dates and statuses', () => {
    useConditionHistoryMock.mockReturnValue({
      data: makeHistory(),
      isLoading: false,
      isError: false,
    });

    renderPage();

    // Both entries render status badges
    const negativeBadges = screen.getAllByText('healthLog.status.negative');
    expect(negativeBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('shows lab name when present on entry', () => {
    useConditionHistoryMock.mockReturnValue({
      data: makeHistory(),
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(screen.getByText('Clínica Condesa')).toBeInTheDocument();
  });

  it('shows verified badge when entry is verified', () => {
    useConditionHistoryMock.mockReturnValue({
      data: makeHistory(),
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(screen.getByText('healthLog.verified')).toBeInTheDocument();
  });

  it('shows allClear text when no positive entries', () => {
    useConditionHistoryMock.mockReturnValue({
      data: makeHistory(),
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(screen.getByText('healthLog.allClear')).toBeInTheDocument();
  });

  it('does not show allClear when there is a positive entry', () => {
    useConditionHistoryMock.mockReturnValue({
      data: makeHistory({
        entries: [
          {
            visitId: 'v1',
            testDate: '2026-02-15',
            status: 'POSITIVE',
            resultValue: null,
            referenceRange: null,
            labName: null,
            labProvider: null,
            verified: false,
            clearedAt: null,
          },
        ],
      }),
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(screen.queryByText('healthLog.allClear')).not.toBeInTheDocument();
  });

  it('shows back link in error state', () => {
    useConditionHistoryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderPage();

    const backLink = screen.getByText('healthLog.backToHealthLog');
    expect(backLink.closest('a')).toHaveAttribute('href', '/health-log');
  });
});
