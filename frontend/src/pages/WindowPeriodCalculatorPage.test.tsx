import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WindowPeriodCalculatorPage } from './WindowPeriodCalculatorPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en_US' },
  }),
}));

function renderCalculator() {
  return render(
    <MemoryRouter>
      <WindowPeriodCalculatorPage />
    </MemoryRouter>
  );
}

function pastDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

describe('WindowPeriodCalculatorPage', () => {
  it('renders without crashing', () => {
    renderCalculator();
    expect(screen.getByText('Window Period Calculator')).toBeInTheDocument();
  });

  it('shows the date picker input', () => {
    renderCalculator();
    const input = screen.getByLabelText(/when did the encounter happen/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'date');
  });

  it('hides results table before a date is entered', () => {
    renderCalculator();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    // results region not present
    expect(screen.queryByText('Testing readiness')).not.toBeInTheDocument();
  });

  it('shows empty state prompt before date is entered', () => {
    renderCalculator();
    expect(
      screen.getByText('Select a date above to see your testing timeline.')
    ).toBeInTheDocument();
  });

  it('shows disclaimer text', () => {
    renderCalculator();
    expect(
      screen.getByText(/informational purposes only/i)
    ).toBeInTheDocument();
  });

  it('shows sources section', () => {
    renderCalculator();
    expect(screen.getByText('Sources')).toBeInTheDocument();
    expect(screen.getByText(/CDC/)).toBeInTheDocument();
  });

  describe('after entering a date 60 days ago', () => {
    it('shows testing readiness results', () => {
      renderCalculator();
      const input = screen.getByLabelText(/when did the encounter happen/i);
      fireEvent.change(input, { target: { value: pastDateString(60) } });

      expect(screen.getByText('Testing readiness')).toBeInTheDocument();
    });

    it('shows testable badge for chlamydia (window 5–14 days)', () => {
      renderCalculator();
      const input = screen.getByLabelText(/when did the encounter happen/i);
      fireEvent.change(input, { target: { value: pastDateString(60) } });

      const testableBadges = screen.getAllByText('Testable now');
      expect(testableBadges.length).toBeGreaterThan(0);
    });

    it('shows "No standard test" badge for HPV', () => {
      renderCalculator();
      const input = screen.getByLabelText(/when did the encounter happen/i);
      fireEvent.change(input, { target: { value: pastDateString(60) } });

      expect(screen.getByText('No standard test')).toBeInTheDocument();
    });

    it('shows all 10 condition names', () => {
      renderCalculator();
      const input = screen.getByLabelText(/when did the encounter happen/i);
      fireEvent.change(input, { target: { value: pastDateString(60) } });

      expect(screen.getByText('Chlamydia')).toBeInTheDocument();
      expect(screen.getByText('Gonorrhea')).toBeInTheDocument();
      expect(screen.getByText('Syphilis')).toBeInTheDocument();
      expect(screen.getByText('HIV')).toBeInTheDocument();
      expect(screen.getByText('Herpes (HSV)')).toBeInTheDocument();
      expect(screen.getByText('HPV')).toBeInTheDocument();
      expect(screen.getByText('Hepatitis B')).toBeInTheDocument();
      expect(screen.getByText('Hepatitis C')).toBeInTheDocument();
      expect(screen.getByText('Trichomoniasis')).toBeInTheDocument();
      expect(screen.getByText('Mycoplasma genitalium')).toBeInTheDocument();
    });

    it('hides empty state after date is entered', () => {
      renderCalculator();
      const input = screen.getByLabelText(/when did the encounter happen/i);
      fireEvent.change(input, { target: { value: pastDateString(60) } });

      expect(
        screen.queryByText('Select a date above to see your testing timeline.')
      ).not.toBeInTheDocument();
    });
  });

  describe('after entering today\'s date', () => {
    it('shows "wait" status badges for conditions with window > 0 days', () => {
      renderCalculator();
      const input = screen.getByLabelText(/when did the encounter happen/i);
      fireEvent.change(input, { target: { value: pastDateString(0) } });

      // Syphilis has 21-day window, gonorrhea has 1-day — at day 0, most show wait
      const waitBadges = screen.getAllByText(/Ready /);
      expect(waitBadges.length).toBeGreaterThan(0);
    });
  });

  it('shows find a clinic CTA', () => {
    renderCalculator();
    expect(screen.getByText('Find a clinic near you')).toBeInTheDocument();
  });
});
