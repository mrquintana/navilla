import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthLogPage } from './HealthLogPage';
import type { HealthLogSummary } from '../lib/api';

function clickTab(label: string) {
  const tab = screen.getByRole('tab', { name: label });
  fireEvent.click(tab);
}

// ---- Hoisted mock fns ----
const useHealthLogSummaryMock = vi.fn();
const useHealthLogVisitsMock = vi.fn();
const useCreateTestVisitMock = vi.fn();
const useUpdateTestVisitMock = vi.fn();

const defaultMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
};

vi.mock('../hooks/useHealthLog', () => ({
  useHealthLogSummary: () => useHealthLogSummaryMock(),
  useHealthLogVisits: () => useHealthLogVisitsMock(),
  useCreateTestVisit: () => useCreateTestVisitMock(),
  useUpdateTestVisit: () => useUpdateTestVisitMock(),
  useHealthLogLabs: () => ({ data: [] }),
  useCreateLab: () => defaultMutation,
  useUpdateLab: () => defaultMutation,
  useDeleteLab: () => defaultMutation,
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    session: { access_token: 'token' },
  }),
}));

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({
    data: { display_name: 'Test User', preferred_language: 'en_US' },
  }),
}));

const useQueryMock = vi.fn();
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query'
  );
  return {
    ...actual,
    useQuery: () => useQueryMock(),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'count' in opts) return `${key}:${opts.count}`;
      return key;
    },
    i18n: { language: 'en_US' },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../lib/conditionInfo', () => ({
  getConditionInfo: () => ({ label: 'HIV', url: 'https://example.com' }),
}));

vi.mock('../hooks/useMedications', () => ({
  useMedications: () => ({ data: [], isLoading: false }),
}));

vi.mock('../hooks/useVaccinations', () => ({
  useVaccinations: () => ({ data: [], isLoading: false }),
}));

vi.mock('../components/reminders/UpcomingReminders', () => ({
  UpcomingReminders: () => null,
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

describe('HealthLogPage', () => {
  beforeEach(() => {
    useHealthLogSummaryMock.mockReset();
    useHealthLogVisitsMock.mockReset();
    useCreateTestVisitMock.mockReset();
    useUpdateTestVisitMock.mockReset();
    useQueryMock.mockReset();

    useCreateTestVisitMock.mockReturnValue(defaultMutation);
    useUpdateTestVisitMock.mockReturnValue(defaultMutation);
    useHealthLogVisitsMock.mockReturnValue({ data: [], isLoading: false });
    useQueryMock.mockReturnValue({ data: undefined, isLoading: false });
  });

  it('shows loading skeleton during initial load', () => {
    useHealthLogSummaryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    // Exposure query also needs to be loading for isInitialLoading to be true
    useQueryMock.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = render(<HealthLogPage />);

    // Page header is always visible; skeleton appears inside the active tab content
    expect(screen.getByText('myHealth.title')).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('renders page title when loaded', () => {
    useHealthLogSummaryMock.mockReturnValue({
      data: makeSummary(),
      isLoading: false,
    });

    render(<HealthLogPage />);

    expect(screen.getByText('myHealth.title')).toBeInTheDocument();
  });

  it('shows encrypted badge', () => {
    useHealthLogSummaryMock.mockReturnValue({
      data: makeSummary(),
      isLoading: false,
    });

    render(<HealthLogPage />);

    expect(screen.getByText('healthLog.encrypted')).toBeInTheDocument();
  });

  it('shows empty state when no tests', () => {
    useHealthLogSummaryMock.mockReturnValue({
      data: makeSummary({ conditions: [] }),
      isLoading: false,
    });

    render(<HealthLogPage />);

    expect(screen.getByText('healthLog.noTests')).toBeInTheDocument();
  });

  it('renders stats component with summary data', () => {
    useHealthLogSummaryMock.mockReturnValue({
      data: makeSummary({ daysSinceLastTest: 42 }),
      isLoading: false,
    });

    render(<HealthLogPage />);
    clickTab('myHealth.tabs.tests');

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('healthLog.daysSinceTest')).toBeInTheDocument();
  });

  it('renders condition cards when conditions exist', () => {
    useHealthLogSummaryMock.mockReturnValue({
      data: makeSummary({
        conditions: [
          {
            conditionType: 'HIV',
            customCondition: null,
            latestStatus: 'NEGATIVE',
            latestResultValue: null,
            lastTestDate: '2026-02-15',
            totalTests: 2,
            hasPositive: false,
          },
          {
            conditionType: 'SYPHILIS',
            customCondition: null,
            latestStatus: 'NEGATIVE',
            latestResultValue: null,
            lastTestDate: '2026-01-10',
            totalTests: 1,
            hasPositive: false,
          },
        ],
      }),
      isLoading: false,
    });

    render(<HealthLogPage />);

    // ConditionCards render their condition names via t() key
    expect(screen.getByText('healthLog.conditions.HIV')).toBeInTheDocument();
    expect(screen.getByText('healthLog.conditions.SYPHILIS')).toBeInTheDocument();
  });

  it('shows Add Visit button', () => {
    useHealthLogSummaryMock.mockReturnValue({
      data: makeSummary(),
      isLoading: false,
    });

    render(<HealthLogPage />);
    clickTab('myHealth.tabs.tests');

    const buttons = screen.getAllByText('healthLog.addVisit');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows My Results section heading', () => {
    useHealthLogSummaryMock.mockReturnValue({
      data: makeSummary(),
      isLoading: false,
    });

    render(<HealthLogPage />);

    expect(screen.getByText('healthLog.myResults')).toBeInTheDocument();
  });

  it('shows exposure overview section', () => {
    useHealthLogSummaryMock.mockReturnValue({
      data: makeSummary(),
      isLoading: false,
    });

    render(<HealthLogPage />);

    expect(screen.getByText('healthLog.exposureOverview')).toBeInTheDocument();
  });
});
