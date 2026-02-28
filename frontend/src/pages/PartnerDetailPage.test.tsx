import { render, screen, fireEvent } from '@testing-library/react';
import { PartnerDetailPage } from './PartnerDetailPage';
import type { JournalPartnerDetail, JournalEntry } from '../lib/api';

const mockNavigate = vi.fn();

// ---- Mock fns (hoisted before vi.mock) ----
const useJournalPartnerMock = vi.fn();
const useJournalPartnerEntriesMock = vi.fn();
const useUpdatePartnerMock = vi.fn();
const useDeletePartnerMock = vi.fn();
const useDeleteJournalEntryMock = vi.fn();

const defaultMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  isIdle: true,
  error: null,
  data: undefined,
  variables: undefined,
  reset: vi.fn(),
  context: undefined,
  failureCount: 0,
  failureReason: null,
  status: 'idle' as const,
  submittedAt: 0,
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'count' in opts) return `${key}:${opts.count}`;
      if (opts && 'alias' in opts) return `${key}:${opts.alias}`;
      return key;
    },
    i18n: { language: 'en_US' },
  }),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'p1' }),
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
}));

vi.mock('../hooks/useJournal', () => ({
  useJournalPartner: () => useJournalPartnerMock(),
  useJournalPartnerEntries: () => useJournalPartnerEntriesMock(),
  useUpdatePartner: () => useUpdatePartnerMock(),
  useDeletePartner: () => useDeletePartnerMock(),
  useDeleteJournalEntry: () => useDeleteJournalEntryMock(),
  // Mocks needed for JournalEntryModal (rendered inside PartnerDetailPage)
  useCreateJournalEntry: () => defaultMutation,
  useUpdateJournalEntry: () => defaultMutation,
  useJournalTemplates: () => ({ data: { labels: [] } }),
  useRecentAliases: () => ({ data: [] }),
  useJournalPartners: () => ({ data: [] }),
  usePromoteAlias: () => defaultMutation,
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

function makePartnerDetail(overrides: Partial<JournalPartnerDetail> = {}): JournalPartnerDetail {
  return {
    id: 'p1',
    alias: 'Alex',
    connectionId: null,
    connectionDisplayName: null,
    notes: 'Some notes about Alex',
    encounterCount: 5,
    firstEncounterDate: '2026-01-15',
    mostRecentEncounterDate: '2026-02-27',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-27T10:00:00Z',
    ...overrides,
  };
}

function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'e1',
    encounterDate: '2026-02-15',
    partnerAlias: 'Alex',
    connectionId: null,
    connectionDisplayName: null,
    partnerId: 'p1',
    partnerEncounterCount: 5,
    notes: null,
    customFields: null,
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
    ...overrides,
  };
}

function setupMocks(options: {
  partner?: JournalPartnerDetail | undefined;
  partnerLoading?: boolean;
  entries?: JournalEntry[];
  entriesLoading?: boolean;
} = {}) {
  const {
    partner = makePartnerDetail(),
    partnerLoading = false,
    entries = [],
    entriesLoading = false,
  } = options;

  useJournalPartnerMock.mockReturnValue({
    data: partner,
    isLoading: partnerLoading,
  });

  useJournalPartnerEntriesMock.mockReturnValue({
    data: entries,
    isLoading: entriesLoading,
  });

  useUpdatePartnerMock.mockReturnValue(defaultMutation);
  useDeletePartnerMock.mockReturnValue(defaultMutation);
  useDeleteJournalEntryMock.mockReturnValue(defaultMutation);
}

describe('PartnerDetailPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    useJournalPartnerMock.mockReset();
    useJournalPartnerEntriesMock.mockReset();
    useUpdatePartnerMock.mockReset();
    useDeletePartnerMock.mockReset();
    useDeleteJournalEntryMock.mockReset();
  });

  it('shows partner alias as heading', () => {
    setupMocks();
    render(<PartnerDetailPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Alex');
  });

  it('shows encounter stats (count, first/last dates)', () => {
    setupMocks();
    render(<PartnerDetailPage />);

    // Count
    expect(screen.getByText('journal.partnerEncounterCount:5')).toBeInTheDocument();

    // First encounter date label
    expect(screen.getByText('journal.partnerFirstEncounter')).toBeInTheDocument();

    // Last encounter date label
    expect(screen.getByText('journal.partnerLastEncounter')).toBeInTheDocument();

    // First date formatted: Jan 15, 2026
    expect(screen.getByText(/Jan 15, 2026/)).toBeInTheDocument();

    // Last date formatted: Feb 27, 2026
    expect(screen.getByText(/Feb 27, 2026/)).toBeInTheDocument();
  });

  it('renders partner notes as read-only text', () => {
    setupMocks();
    render(<PartnerDetailPage />);

    // Notes display as plain text by default (inline-edit pattern)
    expect(screen.getByText('Some notes about Alex')).toBeInTheDocument();
    // No textarea visible until edit mode is activated
    expect(screen.queryByPlaceholderText('journal.partnerNotesPlaceholder')).not.toBeInTheDocument();
  });

  it('shows encounter timeline when entries exist', () => {
    const entries = [
      makeEntry({ id: 'e1', encounterDate: '2026-02-15' }),
      makeEntry({ id: 'e2', encounterDate: '2026-01-20' }),
    ];
    setupMocks({ entries });
    render(<PartnerDetailPage />);

    // The timeline section heading shows encounter count
    // There are two instances: one in the stats row and one as the timeline heading
    const headings = screen.getAllByText('journal.partnerEncounterCount:5');
    expect(headings.length).toBeGreaterThanOrEqual(2);

    // Partner name appears only in the h1 heading (hidden on entry cards via hidePartnerName)
    const alexElements = screen.getAllByText('Alex');
    expect(alexElements).toHaveLength(1);
  });

  it('shows delete modal on delete button click', () => {
    setupMocks();
    render(<PartnerDetailPage />);

    const deleteBtn = screen.getByLabelText('journal.deletePartner');
    fireEvent.click(deleteBtn);

    expect(screen.getByText('journal.deletePartnerTitle')).toBeInTheDocument();
    expect(screen.getByText('journal.deletePartnerSoftLabel')).toBeInTheDocument();
    expect(screen.getByText('journal.deletePartnerDestructiveLabel')).toBeInTheDocument();
  });
});
