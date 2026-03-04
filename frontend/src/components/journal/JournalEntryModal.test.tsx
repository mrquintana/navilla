import { render, screen, fireEvent } from '@testing-library/react';
import { JournalEntryModal } from './JournalEntryModal';
import type { JournalEntry } from '../../lib/api';

// ---- Mock hooks ----
const useAuthMock = vi.fn();
const useCreateMock = vi.fn();
const useUpdateMock = vi.fn();
const useTemplatesMock = vi.fn();
const useSaveTemplatesMock = vi.fn();
const useQueryMock = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../hooks/useJournal', () => ({
  useCreateJournalEntry: () => useCreateMock(),
  useUpdateJournalEntry: () => useUpdateMock(),
  useJournalTemplates: () => useTemplatesMock(),
  useSaveJournalTemplates: () => useSaveTemplatesMock(),
  useJournalPartners: () => ({ data: [] }),
  useRecentAliases: () => ({ data: [] }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQuery: () => useQueryMock(),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en_US' },
  }),
}));

const mockEntry: JournalEntry = {
  id: '123',
  encounterDate: '2026-03-15',
  partnerAlias: 'Alex',
  connectionId: null,
  connectionDisplayName: null,
  partnerId: null,
  partnerEncounterCount: null,
  notes: 'A nice evening at a restaurant in Roma Norte.',
  customFields: [{ label: 'Location', value: 'Roma Norte' }],
  encounterTypes: null,
  protectionMethods: null,
  createdAt: '2026-03-15T10:00:00Z',
  updatedAt: '2026-03-15T10:00:00Z',
};

describe('JournalEntryModal', () => {
  const defaultMutationValue = {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    useAuthMock.mockReset();
    useCreateMock.mockReset();
    useUpdateMock.mockReset();
    useTemplatesMock.mockReset();
    useSaveTemplatesMock.mockReset();
    useQueryMock.mockReset();

    useAuthMock.mockReturnValue({
      session: { access_token: 'token' },
    });

    useCreateMock.mockReturnValue(defaultMutationValue);
    useUpdateMock.mockReturnValue(defaultMutationValue);
    useSaveTemplatesMock.mockReturnValue(defaultMutationValue);

    useTemplatesMock.mockReturnValue({
      data: { labels: [] },
    });

    // Connections query
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
    });
  });

  it('does not render when closed', () => {
    const { container } = render(
      <JournalEntryModal isOpen={false} onClose={vi.fn()} entry={null} />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('renders create form with date field', () => {
    render(
      <JournalEntryModal isOpen={true} onClose={vi.fn()} entry={null} />
    );

    // Modal is open — verify the dialog exists
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Verify the header says "Add Entry" (i18n key)
    expect(screen.getByText('journal.addEntry')).toBeInTheDocument();

    // Verify date input exists
    const dateInput = screen.getByLabelText('journal.encounterDate');
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('type', 'date');
  });

  it('renders edit form with pre-populated fields', () => {
    render(
      <JournalEntryModal isOpen={true} onClose={vi.fn()} entry={mockEntry} />
    );

    // Verify header says "Edit Entry"
    expect(screen.getByText('journal.editEntry')).toBeInTheDocument();

    // Verify date is pre-filled
    const dateInput = screen.getByLabelText('journal.encounterDate') as HTMLInputElement;
    expect(dateInput.value).toBe('2026-03-15');

    // Verify alias is pre-filled
    const aliasInput = screen.getByLabelText('journal.partnerAlias') as HTMLInputElement;
    expect(aliasInput.value).toBe('Alex');

    // Verify notes are pre-filled
    const notesInput = screen.getByLabelText('journal.notes') as HTMLTextAreaElement;
    expect(notesInput.value).toBe('A nice evening at a restaurant in Roma Norte.');
  });

  it('shows validation error when date is cleared and form submitted', async () => {
    render(
      <JournalEntryModal isOpen={true} onClose={vi.fn()} entry={null} />
    );

    // Clear the date field
    const dateInput = screen.getByLabelText('journal.encounterDate') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '' } });

    // Submit the form programmatically (bypasses HTML5 required validation in jsdom)
    const form = dateInput.closest('form')!;
    fireEvent.submit(form);

    // Expect error message from the manual validation in handleSubmit
    expect(screen.getByText('journal.dateRequired')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();

    render(
      <JournalEntryModal isOpen={true} onClose={onClose} entry={null} />
    );

    const cancelBtn = screen.getByText('journal.cancel');
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders custom fields from an existing entry', () => {
    render(
      <JournalEntryModal isOpen={true} onClose={vi.fn()} entry={mockEntry} />
    );

    // The custom field label and value should be pre-populated
    const labelInputs = screen.getAllByLabelText('journal.fieldLabel');
    const valueInputs = screen.getAllByLabelText('journal.fieldValue');

    expect(labelInputs).toHaveLength(1);
    expect(valueInputs).toHaveLength(1);
    expect((labelInputs[0] as HTMLInputElement).value).toBe('Location');
    expect((valueInputs[0] as HTMLInputElement).value).toBe('Roma Norte');
  });

  it('renders encounter type chips that toggle on/off when clicked', () => {
    render(
      <JournalEntryModal isOpen={true} onClose={vi.fn()} entry={null} />
    );

    const oralChip = screen.getByText('journal.encounterTypes.ORAL');
    const analChip = screen.getByText('journal.encounterTypes.ANAL');

    // Initially unselected — white bg
    expect(oralChip.className).toContain('bg-white');
    expect(analChip.className).toContain('bg-white');

    // Click to select
    fireEvent.click(oralChip);
    expect(oralChip.className).toContain('bg-indigo-100');

    // Click again to deselect
    fireEvent.click(oralChip);
    expect(oralChip.className).toContain('bg-white');
  });

  it('renders protection method chips that toggle on/off when clicked', () => {
    render(
      <JournalEntryModal isOpen={true} onClose={vi.fn()} entry={null} />
    );

    const condomChip = screen.getByText('journal.protectionLabels.CONDOM');
    const prepChip = screen.getByText('journal.protectionLabels.PREP');

    // Initially unselected
    expect(condomChip.className).toContain('bg-white');
    expect(prepChip.className).toContain('bg-white');

    // Click to select
    fireEvent.click(condomChip);
    expect(condomChip.className).toContain('bg-indigo-100');

    fireEvent.click(prepChip);
    expect(prepChip.className).toContain('bg-indigo-100');

    // Click condom again to deselect
    fireEvent.click(condomChip);
    expect(condomChip.className).toContain('bg-white');
    // PrEP should stay selected
    expect(prepChip.className).toContain('bg-indigo-100');
  });

  it('pre-selects encounter types and protection methods when editing an entry', () => {
    const entryWithSelections: JournalEntry = {
      ...mockEntry,
      encounterTypes: ['ORAL', 'VAGINAL'],
      protectionMethods: ['CONDOM', 'PREP'],
    };

    render(
      <JournalEntryModal isOpen={true} onClose={vi.fn()} entry={entryWithSelections} />
    );

    // Selected chips should have indigo background
    expect(screen.getByText('journal.encounterTypes.ORAL').className).toContain('bg-indigo-100');
    expect(screen.getByText('journal.encounterTypes.VAGINAL').className).toContain('bg-indigo-100');
    expect(screen.getByText('journal.protectionLabels.CONDOM').className).toContain('bg-indigo-100');
    expect(screen.getByText('journal.protectionLabels.PREP').className).toContain('bg-indigo-100');

    // Non-selected chips should have white background
    expect(screen.getByText('journal.encounterTypes.ANAL').className).toContain('bg-white');
    expect(screen.getByText('journal.encounterTypes.MANUAL').className).toContain('bg-white');
    expect(screen.getByText('journal.protectionLabels.NONE').className).toContain('bg-white');
  });
});
