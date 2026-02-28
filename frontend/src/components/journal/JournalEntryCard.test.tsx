import { render, screen, fireEvent } from '@testing-library/react';
import { JournalEntryCard } from './JournalEntryCard';
import type { JournalEntry } from '../../lib/api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'count' in opts) return `${key}:${opts.count}`;
      return key;
    },
    i18n: { language: 'en_US' },
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: '1',
    encounterDate: '2026-03-15',
    partnerAlias: 'Alex',
    connectionId: null,
    connectionDisplayName: null,
    partnerId: null,
    partnerEncounterCount: null,
    notes: null,
    customFields: null,
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    ...overrides,
  };
}

describe('JournalEntryCard', () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    onEdit.mockReset();
    onDelete.mockReset();
    mockNavigate.mockReset();
  });

  it('renders entry date', () => {
    render(
      <JournalEntryCard entry={makeEntry()} onEdit={onEdit} onDelete={onDelete} />
    );

    // The card formats the date using toLocaleDateString with month: 'short', day: 'numeric'
    // In en-US locale this renders something like "Mar 15"
    const dateEl = screen.getByTitle(/march 15, 2026/i);
    expect(dateEl).toBeInTheDocument();
  });

  it('renders partner alias', () => {
    render(
      <JournalEntryCard
        entry={makeEntry({ partnerAlias: 'Jordan' })}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Jordan')).toBeInTheDocument();
  });

  it('shows anonymous text when no alias or connection display name', () => {
    render(
      <JournalEntryCard
        entry={makeEntry({ partnerAlias: null, connectionDisplayName: null })}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('journal.anonymous')).toBeInTheDocument();
  });

  it('shows connectionDisplayName when partnerAlias is null', () => {
    render(
      <JournalEntryCard
        entry={makeEntry({ partnerAlias: null, connectionDisplayName: 'Connected User' })}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Connected User')).toBeInTheDocument();
  });

  it('truncates long notes to 120 characters with ellipsis', () => {
    const longNotes = 'A'.repeat(200);
    render(
      <JournalEntryCard
        entry={makeEntry({ notes: longNotes })}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const truncated = 'A'.repeat(120) + '...';
    expect(screen.getByText(truncated)).toBeInTheDocument();
  });

  it('shows full notes when under 120 characters', () => {
    const shortNotes = 'A short note.';
    render(
      <JournalEntryCard
        entry={makeEntry({ notes: shortNotes })}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText(shortNotes)).toBeInTheDocument();
  });

  it('shows custom field label-value chips', () => {
    render(
      <JournalEntryCard
        entry={makeEntry({
          customFields: [
            { label: 'Location', value: 'Roma Norte' },
            { label: 'Mood', value: 'Good' },
          ],
        })}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Roma Norte')).toBeInTheDocument();
    expect(screen.getByText('Mood')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('does not show custom field chips when no custom fields', () => {
    render(
      <JournalEntryCard
        entry={makeEntry({ customFields: null })}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByText(/journal\.customFieldCount/)).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const entry = makeEntry();
    render(
      <JournalEntryCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
    );

    const editBtn = screen.getByLabelText('common.edit');
    fireEvent.click(editBtn);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(entry);
  });

  it('calls onDelete when delete button clicked', () => {
    const entry = makeEntry({ id: 'entry-42' });
    render(
      <JournalEntryCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
    );

    const deleteBtn = screen.getByLabelText('common.delete');
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('entry-42');
  });

  it('shows bookmark icon when partnerId is set', () => {
    render(
      <JournalEntryCard
        entry={makeEntry({ partnerId: 'p1', partnerEncounterCount: 3 })}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    // The Bookmark icon is rendered with aria-hidden="true"
    const bookmarkIcon = document.querySelector('svg.lucide-bookmark');
    expect(bookmarkIcon).toBeInTheDocument();
  });

  it('shows encounter count link when partnerId set and partnerEncounterCount > 1', () => {
    render(
      <JournalEntryCard
        entry={makeEntry({ partnerId: 'p1', partnerEncounterCount: 3 })}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('journal.encountersWith:3')).toBeInTheDocument();
  });

  it('does not show encounter link when partnerId is null', () => {
    render(
      <JournalEntryCard
        entry={makeEntry()}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByText(/journal\.encountersWith/)).not.toBeInTheDocument();
  });
});
