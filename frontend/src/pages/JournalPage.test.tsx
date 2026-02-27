import { render, screen } from '@testing-library/react';
import { JournalPage } from './JournalPage';

// ---- Mock fns (hoisted before vi.mock) ----
const useJournalEntriesMock = vi.fn();
const useJournalSummaryMock = vi.fn();
const useDeleteJournalEntryMock = vi.fn();

const defaultMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
};

vi.mock('../hooks/useJournal', () => ({
  useJournalEntries: () => useJournalEntriesMock(),
  useJournalSummary: () => useJournalSummaryMock(),
  useDeleteJournalEntry: () => useDeleteJournalEntryMock(),
  useCreateJournalEntry: () => defaultMutation,
  useUpdateJournalEntry: () => defaultMutation,
  useJournalTemplates: () => ({ data: { labels: [] } }),
  useSaveJournalTemplates: () => defaultMutation,
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    session: { access_token: 'token' },
  }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQuery: () => ({ data: [], isLoading: false }),
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

describe('JournalPage', () => {
  const defaultDeleteMutation = {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    useJournalEntriesMock.mockReset();
    useJournalSummaryMock.mockReset();
    useDeleteJournalEntryMock.mockReset();

    useDeleteJournalEntryMock.mockReturnValue(defaultDeleteMutation);
  });

  function renderLoaded(
    entries: unknown[] = [],
    summary: { year: number; monthlyCounts: Record<string, number>; yearTotal: number } | undefined = undefined
  ) {
    useJournalEntriesMock.mockReturnValue({
      data: entries,
      isLoading: false,
    });
    useJournalSummaryMock.mockReturnValue({
      data: summary ?? { year: 2026, monthlyCounts: {}, yearTotal: 0 },
    });
    return render(<JournalPage />);
  }

  it('shows loading skeleton during initial load', () => {
    useJournalEntriesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    useJournalSummaryMock.mockReturnValue({ data: undefined });

    const { container } = render(<JournalPage />);

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByText('journal.title')).not.toBeInTheDocument();
  });

  it('renders page title', () => {
    renderLoaded();

    expect(screen.getByText('journal.title')).toBeInTheDocument();
  });

  it('shows encrypted badge', () => {
    renderLoaded();

    expect(screen.getByText('journal.encrypted')).toBeInTheDocument();
  });

  it('shows New Entry button', () => {
    renderLoaded();

    expect(screen.getByText('journal.addEntry')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    renderLoaded([]);

    expect(screen.getByText('journal.empty.title')).toBeInTheDocument();
    expect(screen.getByText('journal.empty.description')).toBeInTheDocument();
  });

  it('shows timeline with entries', () => {
    const mockEntries = [
      {
        id: '1',
        encounterDate: '2026-03-15',
        partnerAlias: 'Alex',
        connectionId: null,
        connectionDisplayName: null,
        partnerId: null,
        partnerEncounterCount: null,
        notes: 'A nice evening.',
        customFields: null,
        createdAt: '2026-03-15T10:00:00Z',
        updatedAt: '2026-03-15T10:00:00Z',
      },
      {
        id: '2',
        encounterDate: '2026-03-10',
        partnerAlias: 'Jordan',
        connectionId: null,
        connectionDisplayName: null,
        partnerId: null,
        partnerEncounterCount: null,
        notes: null,
        customFields: null,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z',
      },
    ];

    renderLoaded(mockEntries);

    // Entries rendered through JournalTimeline → JournalEntryCard
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Jordan')).toBeInTheDocument();
  });

  it('shows summary bar when entries exist', () => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const monthKey = `${now.getFullYear()}-${m < 10 ? '0' : ''}${m}`;

    const mockEntry = {
      id: '1',
      encounterDate: '2026-02-15',
      partnerAlias: 'Alex',
      connectionId: null,
      connectionDisplayName: null,
      partnerId: null,
      partnerEncounterCount: null,
      notes: null,
      customFields: null,
      createdAt: '2026-02-15T10:00:00Z',
      updatedAt: '2026-02-15T10:00:00Z',
    };

    renderLoaded([mockEntry], {
      year: 2026,
      monthlyCounts: { [monthKey]: 5 },
      yearTotal: 12,
    });

    expect(screen.getByText('journal.monthSummary:5')).toBeInTheDocument();
    expect(screen.getByText('journal.yearTotal:12')).toBeInTheDocument();
  });

  it('renders view toggle buttons for Timeline and Calendar', () => {
    renderLoaded();

    expect(screen.getByText('journal.timeline')).toBeInTheDocument();
    expect(screen.getByText('journal.calendar')).toBeInTheDocument();
  });

  it('does not show summary bar when no entries', () => {
    renderLoaded([]);

    expect(screen.queryByText(/journal\.monthSummary/)).not.toBeInTheDocument();
    expect(screen.queryByText(/journal\.yearTotal/)).not.toBeInTheDocument();
  });
});
