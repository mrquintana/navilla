import { render, screen, fireEvent } from '@testing-library/react';
import { JournalPartnerCard } from './JournalPartnerCard';
import type { JournalPartner } from '../../lib/api';

const mockNavigate = vi.fn();

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
  useNavigate: () => mockNavigate,
}));

function makePartner(overrides: Partial<JournalPartner> = {}): JournalPartner {
  return {
    id: 'p1',
    alias: 'Alex',
    connectionId: null,
    connectionDisplayName: null,
    encounterCount: 5,
    firstEncounterDate: '2026-01-15',
    mostRecentEncounterDate: '2026-02-27',
    ...overrides,
  };
}

describe('JournalPartnerCard', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders alias and encounter count', () => {
    render(<JournalPartnerCard partner={makePartner()} />);

    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('journal.partnerEncounterCount:5')).toBeInTheDocument();
  });

  it('renders most recent date in locale-aware format', () => {
    render(<JournalPartnerCard partner={makePartner()} />);

    // en-US locale renders "Feb 27" for 2026-02-27
    const dateText = screen.getByText(/Feb 27/);
    expect(dateText).toBeInTheDocument();
  });

  it('shows connection badge when connectionDisplayName is present', () => {
    render(
      <JournalPartnerCard
        partner={makePartner({ connectionDisplayName: 'Connected User' })}
      />
    );

    expect(screen.getByText('Connected User')).toBeInTheDocument();
  });

  it('navigates to partner detail on click', () => {
    render(<JournalPartnerCard partner={makePartner({ id: 'p42' })} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/journal/partner/p42');
  });
});
