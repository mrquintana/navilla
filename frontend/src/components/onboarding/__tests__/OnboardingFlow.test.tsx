import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingFlow } from '../OnboardingFlow';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars) {
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

describe('OnboardingFlow', () => {
  let onComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onComplete = vi.fn();
    localStorage.clear();
  });

  it('renders step 1 initially', () => {
    render(<OnboardingFlow onComplete={onComplete} />);

    expect(screen.getByText('onboarding.step1Title')).toBeInTheDocument();
    expect(screen.getByText('onboarding.step1Body')).toBeInTheDocument();
    expect(screen.getByText('onboarding.next')).toBeInTheDocument();
  });

  it('advances to step 2 when Next is clicked', () => {
    render(<OnboardingFlow onComplete={onComplete} />);

    fireEvent.click(screen.getByText('onboarding.next'));

    expect(screen.getByText('onboarding.step2Title')).toBeInTheDocument();
    expect(screen.getByText('onboarding.step2Body')).toBeInTheDocument();
    expect(screen.queryByText('onboarding.step1Title')).not.toBeInTheDocument();
  });

  it('advances to step 3 when Next is clicked again', () => {
    render(<OnboardingFlow onComplete={onComplete} />);

    fireEvent.click(screen.getByText('onboarding.next'));
    fireEvent.click(screen.getByText('onboarding.next'));

    expect(screen.getByText('onboarding.step3Title')).toBeInTheDocument();
    expect(screen.getByText('onboarding.step3Body')).toBeInTheDocument();
    expect(screen.getByText('onboarding.getStarted')).toBeInTheDocument();
    expect(screen.queryByText('onboarding.next')).not.toBeInTheDocument();
  });

  it('calls onComplete and sets localStorage when Skip is clicked', () => {
    render(<OnboardingFlow onComplete={onComplete} />);

    fireEvent.click(screen.getByText('onboarding.skip'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('navilla_onboarding_complete')).toBe('true');
  });

  it('calls onComplete and sets localStorage when Get started is clicked on step 3', () => {
    render(<OnboardingFlow onComplete={onComplete} />);

    // Advance to step 3
    fireEvent.click(screen.getByText('onboarding.next'));
    fireEvent.click(screen.getByText('onboarding.next'));

    fireEvent.click(screen.getByText('onboarding.getStarted'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('navilla_onboarding_complete')).toBe('true');
  });

  it('shows correct active step indicator', () => {
    render(<OnboardingFlow onComplete={onComplete} />);

    const dot0 = screen.getByTestId('step-dot-0');
    const dot1 = screen.getByTestId('step-dot-1');
    const dot2 = screen.getByTestId('step-dot-2');

    // Step 1 active: dot 0 should be indigo (primary)
    expect(dot0.style.backgroundColor).toBe('var(--color-primary)');
    expect(dot1.style.backgroundColor).toBe('var(--color-border-light, #e7e5e4)');
    expect(dot2.style.backgroundColor).toBe('var(--color-border-light, #e7e5e4)');

    // Advance to step 2
    fireEvent.click(screen.getByText('onboarding.next'));

    expect(dot0.style.backgroundColor).toBe('var(--color-border-light, #e7e5e4)');
    expect(dot1.style.backgroundColor).toBe('var(--color-primary)');
    expect(dot2.style.backgroundColor).toBe('var(--color-border-light, #e7e5e4)');

    // Advance to step 3
    fireEvent.click(screen.getByText('onboarding.next'));

    expect(dot0.style.backgroundColor).toBe('var(--color-border-light, #e7e5e4)');
    expect(dot1.style.backgroundColor).toBe('var(--color-border-light, #e7e5e4)');
    expect(dot2.style.backgroundColor).toBe('var(--color-primary)');
  });

  it('has correct dialog accessibility attributes', () => {
    render(<OnboardingFlow onComplete={onComplete} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
