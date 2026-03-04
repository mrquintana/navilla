import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Check, Clock } from 'lucide-react';
import { useReciprocityStatus, useOptIn, useOptOut } from '../../hooks/useReciprocity';

export function ReciprocityOptInCard() {
  const { t } = useTranslation();
  const { data: status, isLoading } = useReciprocityStatus();
  const optInMutation = useOptIn();
  const optOutMutation = useOptOut();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  if (isLoading || !status) {
    return null;
  }

  // User is opted in — show active status with option to leave
  if (status.optedIn) {
    return (
      <div className="card card-elevated">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(22, 163, 74, 0.1)' }}
          >
            <Check className="w-5 h-5 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              {t('reciprocity.title')}
            </h3>
            <p className="text-sm font-medium text-green-700">
              {t('reciprocity.active')}
            </p>
          </div>
        </div>

        {!showLeaveConfirm ? (
          <button
            type="button"
            className="text-xs text-muted hover:text-red-600 transition-colors"
            onClick={() => setShowLeaveConfirm(true)}
          >
            {t('reciprocity.optOut')}
          </button>
        ) : (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 space-y-3">
            <p className="text-sm text-red-800">
              {t('reciprocity.leaveWarning')}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowLeaveConfirm(false)}
                disabled={optOutMutation.isPending}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-sm text-white"
                style={{ background: '#dc3545' }}
                onClick={() => {
                  optOutMutation.mutate(undefined, {
                    onSuccess: () => setShowLeaveConfirm(false),
                  });
                }}
                disabled={optOutMutation.isPending}
              >
                {optOutMutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="spinner" aria-hidden="true" />
                    {t('common.loading')}
                  </span>
                ) : (
                  t('reciprocity.optOut')
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // User is not opted in — show invitation card
  const inCooldown = status.cooldownDaysRemaining !== null && status.cooldownDaysRemaining > 0;

  return (
    <div className="card card-elevated">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(99, 102, 241, 0.08)' }}
        >
          <Shield className="w-5 h-5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
          {t('reciprocity.title')}
        </h3>
      </div>

      <p className="text-sm text-muted mb-4">
        {t('reciprocity.description')}
      </p>

      <ul className="space-y-2 mb-5">
        <li className="flex items-start gap-2 text-sm">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <span>{t('reciprocity.benefit1')}</span>
        </li>
        <li className="flex items-start gap-2 text-sm">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <span>{t('reciprocity.benefit2')}</span>
        </li>
        <li className="flex items-start gap-2 text-sm">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <span>{t('reciprocity.benefit3')}</span>
        </li>
      </ul>

      {inCooldown ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{t('reciprocity.cooldown', { days: status.cooldownDaysRemaining })}</span>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={() => optInMutation.mutate()}
          disabled={optInMutation.isPending}
        >
          {optInMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="spinner" aria-hidden="true" />
              {t('common.loading')}
            </span>
          ) : (
            t('reciprocity.optIn')
          )}
        </button>
      )}

      {optInMutation.isError && (
        <div className="alert alert-error mt-3">
          {t('common.error')}
        </div>
      )}
    </div>
  );
}
