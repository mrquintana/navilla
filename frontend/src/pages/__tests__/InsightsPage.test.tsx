import { render, screen } from '@testing-library/react';
import { InsightsPage } from '../InsightsPage';
import type { InsightsResponse } from '../../hooks/useInsights';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars && typeof vars === 'object') {
        return Object.entries(vars).reduce(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
          key,
        );
      }
      return key;
    },
    i18n: { language: 'en_US' },
  }),
}));

// Mock useInsights hook
const mockUseInsights = vi.fn();
vi.mock('../../hooks/useInsights', () => ({
  useInsights: () => mockUseInsights(),
}));

// Full mock data
const fullData: InsightsResponse = {
  activity: {
    totalEncounters: 15,
    encountersThisMonth: 3,
    encountersByMonth: { '2026-03': 3, '2026-02': 5 },
    protectionRate: 0.73,
    encounterTypeCounts: { ORAL: 5, ANAL: 8, VAGINAL: 2 },
    protectionMethodCounts: { CONDOM: 10, PREP: 5 },
  },
  testing: {
    daysSinceLastTest: 42,
    testsThisYear: 3,
    conditionsCovered: 7,
    totalStandardConditions: 10,
    lastTestDate: '2026-01-20',
    coverageMap: {
      HIV: 'NEGATIVE',
      CHLAMYDIA: 'NEGATIVE',
      GONORRHEA: 'POSITIVE',
      SYPHILIS: 'NOT_TESTED',
    },
  },
  prevention: {
    prepAdherenceRate: 0.92,
    currentPrepStreakDays: 14,
    longestPrepStreakDays: 45,
    completedVaccines: ['HPV'],
    pendingVaccines: ['HEPATITIS_B'],
    activeReminders: 2,
  },
};

// Empty / zero data
const emptyData: InsightsResponse = {
  activity: {
    totalEncounters: 0,
    encountersThisMonth: 0,
    encountersByMonth: {},
    protectionRate: 0,
    encounterTypeCounts: {},
    protectionMethodCounts: {},
  },
  testing: {
    daysSinceLastTest: -1,
    testsThisYear: 0,
    conditionsCovered: 0,
    totalStandardConditions: 10,
    lastTestDate: null,
    coverageMap: {},
  },
  prevention: {
    prepAdherenceRate: null,
    currentPrepStreakDays: 0,
    longestPrepStreakDays: 0,
    completedVaccines: [],
    pendingVaccines: [],
    activeReminders: 0,
  },
};

describe('InsightsPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state (PageSkeleton)', () => {
    mockUseInsights.mockReturnValue({ data: undefined, isLoading: true });

    render(<InsightsPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders all three section headers', () => {
    mockUseInsights.mockReturnValue({ data: fullData, isLoading: false });

    render(<InsightsPage />);

    expect(screen.getByText('insights.activity')).toBeInTheDocument();
    expect(screen.getByText('insights.testing')).toBeInTheDocument();
    expect(screen.getByText('insights.prevention')).toBeInTheDocument();
  });

  it('displays protection rate as percentage', () => {
    mockUseInsights.mockReturnValue({ data: fullData, isLoading: false });

    render(<InsightsPage />);

    // 0.73 -> 73%
    expect(screen.getByText('73%')).toBeInTheDocument();
  });

  it('displays days since last test', () => {
    mockUseInsights.mockReturnValue({ data: fullData, isLoading: false });

    render(<InsightsPage />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('insights.daysSinceTest')).toBeInTheDocument();
  });

  it('shows PrEP streak when data available', () => {
    mockUseInsights.mockReturnValue({ data: fullData, isLoading: false });

    render(<InsightsPage />);

    // Current streak and longest streak both show "insights.days"
    const dayLabels = screen.getAllByText('insights.days');
    expect(dayLabels).toHaveLength(2);
    expect(screen.getByText('insights.currentStreak')).toBeInTheDocument();
    expect(screen.getByText('insights.longestStreak')).toBeInTheDocument();
    // Adherence: 92%
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('shows empty states when no data', () => {
    mockUseInsights.mockReturnValue({ data: emptyData, isLoading: false });

    render(<InsightsPage />);

    expect(screen.getByText('insights.noEncounters')).toBeInTheDocument();
    expect(screen.getByText('insights.noPrepData')).toBeInTheDocument();
    expect(screen.getByText('insights.noVaccines')).toBeInTheDocument();
  });

  it('shows page title and subtitle', () => {
    mockUseInsights.mockReturnValue({ data: fullData, isLoading: false });

    render(<InsightsPage />);

    expect(screen.getByText('insights.title')).toBeInTheDocument();
    expect(screen.getByText('insights.subtitle')).toBeInTheDocument();
  });

  it('shows encounter type breakdown', () => {
    mockUseInsights.mockReturnValue({ data: fullData, isLoading: false });

    render(<InsightsPage />);

    expect(screen.getByText('journal.encounterTypes.ORAL')).toBeInTheDocument();
    expect(screen.getByText('journal.encounterTypes.ANAL')).toBeInTheDocument();
  });

  it('shows vaccination status with completed and pending', () => {
    mockUseInsights.mockReturnValue({ data: fullData, isLoading: false });

    render(<InsightsPage />);

    expect(screen.getByText('vaccinations.types.HPV')).toBeInTheDocument();
    expect(screen.getByText('vaccinations.types.HEPATITIS_B')).toBeInTheDocument();
  });

  it('shows coverage badges for tested conditions', () => {
    mockUseInsights.mockReturnValue({ data: fullData, isLoading: false });

    render(<InsightsPage />);

    expect(screen.getByText('healthLog.conditions.HIV')).toBeInTheDocument();
    expect(screen.getByText('healthLog.conditions.GONORRHEA')).toBeInTheDocument();
  });

  it('shows streak milestones with correct styling', () => {
    mockUseInsights.mockReturnValue({ data: fullData, isLoading: false });

    render(<InsightsPage />);

    // longestStreak = 45, so 7d and 30d achieved, 90d not
    const milestone7 = screen.getByText('7d');
    const milestone30 = screen.getByText('30d');
    const milestone90 = screen.getByText('90d');

    expect(milestone7).toHaveClass('bg-indigo-100', 'text-indigo-700');
    expect(milestone30).toHaveClass('bg-indigo-100', 'text-indigo-700');
    expect(milestone90).toHaveClass('bg-stone-100', 'text-stone-400');
  });
});
