import { render, screen } from '@testing-library/react';
import { JournalPartnersTab } from './JournalPartnersTab';
import * as useJournalModule from '../../hooks/useJournal';
import type { JournalPartner } from '../../lib/api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en_US' },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('./CreatePartnerModal', () => ({
  CreatePartnerModal: () => null,
}));

function makePartner(overrides: Partial<JournalPartner> = {}): JournalPartner {
  return {
    id: 'p1',
    alias: 'Alex',
    connectionId: null,
    connectionDisplayName: null,
    encounterCount: 3,
    firstEncounterDate: '2026-01-15',
    mostRecentEncounterDate: '2026-02-27',
    ...overrides,
  };
}

describe('JournalPartnersTab', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows empty state when no partners', () => {
    vi.spyOn(useJournalModule, 'useJournalPartners').mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useJournalModule.useJournalPartners>);

    render(<JournalPartnersTab />);

    expect(screen.getByText('journal.noPartners')).toBeInTheDocument();
    expect(screen.getByText('journal.noPartnersDescription')).toBeInTheDocument();
  });

  it('renders partner cards when data exists', () => {
    vi.spyOn(useJournalModule, 'useJournalPartners').mockReturnValue({
      data: [
        makePartner({ id: 'p1', alias: 'Alex' }),
        makePartner({ id: 'p2', alias: 'Jordan' }),
      ],
      isLoading: false,
    } as ReturnType<typeof useJournalModule.useJournalPartners>);

    render(<JournalPartnersTab />);

    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Jordan')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.spyOn(useJournalModule, 'useJournalPartners').mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useJournalModule.useJournalPartners>);

    render(<JournalPartnersTab />);

    expect(screen.getByLabelText('common.loading')).toBeInTheDocument();
  });
});
