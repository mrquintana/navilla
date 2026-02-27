import { render, screen, fireEvent } from '@testing-library/react';
import { JournalCalendar } from './JournalCalendar';
import type { JournalEntry } from '../../lib/api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en_US' },
  }),
}));

function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: '1',
    encounterDate: '2026-03-15',
    partnerAlias: 'Alex',
    connectionId: null,
    connectionDisplayName: null,
    notes: null,
    customFields: null,
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    ...overrides,
  };
}

describe('JournalCalendar', () => {
  const onDayClick = vi.fn();

  beforeEach(() => {
    onDayClick.mockReset();
  });

  // March 2026: 1st is a Sunday. In our Mon-start calendar that means the 1st
  // falls in column index 6 (Sun). The grid has 7 day headers.
  const march2026 = new Date(2026, 2, 1); // Month 2 = March

  it('renders day headers', () => {
    render(
      <JournalCalendar
        entries={[]}
        currentMonth={march2026}
        onDayClick={onDayClick}
        selectedDate={null}
      />
    );

    // The component uses i18n keys, which return the keys themselves (e.g. "journal.dayMon").
    // Since t(key) === key (no translation), it falls back to ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('shows dots on days with entries', () => {
    const entries = [
      makeEntry({ id: '1', encounterDate: '2026-03-15' }),
      makeEntry({ id: '2', encounterDate: '2026-03-20' }),
    ];

    const { container } = render(
      <JournalCalendar
        entries={entries}
        currentMonth={march2026}
        onDayClick={onDayClick}
        selectedDate={null}
      />
    );

    // Days with entries get the class 'journal-calendar-day--has-entries'
    const daysWithEntries = container.querySelectorAll('.journal-calendar-day--has-entries');
    expect(daysWithEntries).toHaveLength(2);

    // Each day with entries has a dot element
    const dots = container.querySelectorAll('.journal-calendar-dot');
    expect(dots).toHaveLength(2);
  });

  it('calls onDayClick when a day with entries is clicked', () => {
    const entries = [makeEntry({ id: '1', encounterDate: '2026-03-15' })];

    render(
      <JournalCalendar
        entries={entries}
        currentMonth={march2026}
        onDayClick={onDayClick}
        selectedDate={null}
      />
    );

    // Day 15 should be clickable
    const day15 = screen.getByLabelText('15');
    fireEvent.click(day15);

    expect(onDayClick).toHaveBeenCalledTimes(1);
    expect(onDayClick).toHaveBeenCalledWith('2026-03-15');
  });

  it('does not call onDayClick when a day without entries is clicked', () => {
    render(
      <JournalCalendar
        entries={[]}
        currentMonth={march2026}
        onDayClick={onDayClick}
        selectedDate={null}
      />
    );

    // Day 10 has no entries, clicking it should not fire the callback
    const day10 = screen.getByLabelText('10');
    fireEvent.click(day10);

    expect(onDayClick).not.toHaveBeenCalled();
  });

  it('highlights today with special class', () => {
    // Use the current real date so that "today" logic works
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { container } = render(
      <JournalCalendar
        entries={[]}
        currentMonth={currentMonth}
        onDayClick={onDayClick}
        selectedDate={null}
      />
    );

    const todayCell = container.querySelector('.journal-calendar-day--today');
    expect(todayCell).toBeInTheDocument();
  });

  it('marks selected date with selected class', () => {
    const entries = [makeEntry({ id: '1', encounterDate: '2026-03-15' })];

    const { container } = render(
      <JournalCalendar
        entries={entries}
        currentMonth={march2026}
        onDayClick={onDayClick}
        selectedDate="2026-03-15"
      />
    );

    const selectedCell = container.querySelector('.journal-calendar-day--selected');
    expect(selectedCell).toBeInTheDocument();

    // Verify ARIA attribute
    const day15 = screen.getByLabelText('15');
    expect(day15).toHaveAttribute('aria-selected', 'true');
  });

  it('renders correct number of day cells for March 2026', () => {
    const { container } = render(
      <JournalCalendar
        entries={[]}
        currentMonth={march2026}
        onDayClick={onDayClick}
        selectedDate={null}
      />
    );

    // March 2026 has 31 days. 7 header cells + day cells + empty padding.
    // The non-empty day cells should contain numbers 1 through 31.
    const numberSpans = container.querySelectorAll('.journal-calendar-day-number');
    expect(numberSpans).toHaveLength(31);
  });

  it('supports keyboard activation on days with entries', () => {
    const entries = [makeEntry({ id: '1', encounterDate: '2026-03-15' })];

    render(
      <JournalCalendar
        entries={entries}
        currentMonth={march2026}
        onDayClick={onDayClick}
        selectedDate={null}
      />
    );

    const day15 = screen.getByLabelText('15');
    fireEvent.keyDown(day15, { key: 'Enter' });

    expect(onDayClick).toHaveBeenCalledTimes(1);
    expect(onDayClick).toHaveBeenCalledWith('2026-03-15');
  });
});
