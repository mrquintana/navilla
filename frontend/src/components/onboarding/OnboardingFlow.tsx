import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Bell, BarChart3 } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const STEPS = [
  { icon: Heart, titleKey: 'onboarding.step1Title', bodyKey: 'onboarding.step1Body' },
  { icon: Bell, titleKey: 'onboarding.step2Title', bodyKey: 'onboarding.step2Body' },
  { icon: BarChart3, titleKey: 'onboarding.step3Title', bodyKey: 'onboarding.step3Body' },
] as const;

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLastStep = step === STEPS.length - 1;

  function handleNext() {
    if (isLastStep) {
      localStorage.setItem('navilla_onboarding_complete', 'true');
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleSkip() {
    localStorage.setItem('navilla_onboarding_complete', 'true');
    onComplete();
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t('onboarding.stepOf', { current: step + 1, total: STEPS.length })}
    >
      <div className="modal" style={{ maxWidth: '400px', overflow: 'hidden' }}>
        {/* Skip link */}
        <div className="flex justify-end px-4 pt-3">
          <button
            type="button"
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--color-muted)' }}
            onClick={handleSkip}
          >
            {t('onboarding.skip')}
          </button>
        </div>

        {/* Icon header */}
        <div
          className="mx-4 mt-2 flex items-center justify-center rounded-xl py-8"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          }}
        >
          <Icon className="h-12 w-12 text-white" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="px-6 pt-5 pb-2 text-center">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            {t(current.titleKey)}
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
            {t(current.bodyKey)}
          </p>
        </div>

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-2 py-4" aria-label={t('onboarding.stepOf', { current: step + 1, total: STEPS.length })}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="inline-block h-2 w-2 rounded-full transition-colors"
              style={{
                backgroundColor: i === step ? 'var(--color-primary)' : 'var(--color-border-light, #e7e5e4)',
              }}
              aria-hidden="true"
              data-testid={`step-dot-${i}`}
            />
          ))}
        </div>

        {/* Action button */}
        <div className="px-6 pb-6">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={handleNext}
          >
            {isLastStep ? t('onboarding.getStarted') : t('onboarding.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
