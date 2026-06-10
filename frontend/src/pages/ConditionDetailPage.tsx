import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BadgeCheck, ShieldCheck } from 'lucide-react';
import { useConditionHistory } from '../hooks/useHealthLog';
import { useLabProviders } from '../hooks/useLabProviders';
import { LabVerificationModal } from '../components/health/LabVerificationModal';
import { PageSkeleton, SkeletonBlock, SkeletonRows } from '../components/ui/LoadingShell';

function statusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case 'NEGATIVE':
      return 'badge badge-info';
    case 'POSITIVE':
      return 'badge badge-error';
    case 'PENDING':
      return 'badge badge-warning';
    case 'INDETERMINATE':
      return 'badge badge-warning';
    default:
      return 'badge';
  }
}

export function ConditionDetailPage() {
  const { t, i18n } = useTranslation();
  const { condition } = useParams<{ condition: string }>();
  const locale = i18n.language.replace('_', '-');
  const [verifyVisitId, setVerifyVisitId] = useState<string | null>(null);

  const historyQuery = useConditionHistory(condition ?? '');
  const history = historyQuery.data;

  // No lab providers are enabled in production yet (mocks are dev-only), so
  // the verify CTA must disappear rather than open a dead-end modal.
  const labProvidersQuery = useLabProviders();
  const canVerify = (labProvidersQuery.data?.length ?? 0) > 0;

  if (historyQuery.isLoading && !history) {
    return (
      <PageSkeleton loadingLabel={t('common.loading')}>
        <SkeletonBlock className="h-6 w-40 rounded-full" />
        <SkeletonBlock className="h-16 rounded-2xl" />
        <SkeletonRows rows={4} />
      </PageSkeleton>
    );
  }

  if (historyQuery.isError || !history) {
    return (
      <div className="container py-8 space-y-4">
        <Link
          to="/health-log"
          className="inline-flex items-center gap-1 text-sm text-primary font-medium"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('healthLog.backToHealthLog')}
        </Link>
        <p className="text-sm text-muted">{t('healthLog.errors.loadFailed')}</p>
      </div>
    );
  }

  const conditionName = t(`healthLog.conditions.${history.conditionType}`, {
    defaultValue: history.conditionType,
  });

  const statusLabel = t(
    `healthLog.status.${history.latestStatus.toLowerCase()}`
  );

  const lastTestFormatted = new Date(
    history.lastTestDate + 'T00:00:00'
  ).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const hasPositive = history.entries.some(
    (e) => e.status.toUpperCase() === 'POSITIVE'
  );

  const testCountLabel =
    history.totalTests === 1
      ? `${history.totalTests} ${t('healthLog.test')}`
      : `${history.totalTests} ${t('healthLog.tests')}`;

  return (
    <div className="container py-8 space-y-6">
      {/* Back link */}
      <Link
        to="/health-log"
        className="inline-flex items-center gap-1 text-sm text-primary font-medium"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t('healthLog.backToHealthLog')}
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">
          {conditionName} &mdash; {t('healthLog.testHistory')}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>
            {t('healthLog.current')}:{' '}
            <span className={statusBadgeClass(history.latestStatus)}>
              {statusLabel}
            </span>
          </span>
        </div>
      </div>

      {/* Stats line */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <span>{testCountLabel}</span>
        <span aria-hidden="true">&middot;</span>
        <span>
          {hasPositive
            ? ''
            : t('healthLog.allClear')}
        </span>
        {!hasPositive && <span aria-hidden="true">&middot;</span>}
        <span>
          {t('healthLog.lastTested')}: {lastTestFormatted}
        </span>
      </div>

      {/* Timeline */}
      {history.entries.length > 0 ? (
        <div className="space-y-3">
          {history.entries.map((entry, index) => {
            const dateFormatted = new Date(
              entry.testDate + 'T00:00:00'
            ).toLocaleDateString(locale, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            const entryStatusLabel = t(
              `healthLog.status.${entry.status.toLowerCase()}`
            );

            return (
              <div
                key={`${entry.visitId}-${index}`}
                className="journal-entry-card"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: date + status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{dateFormatted}</span>
                    <span className={statusBadgeClass(entry.status)}>
                      {entryStatusLabel}
                    </span>
                    {entry.resultValue && (
                      <span className="text-xs text-muted">
                        {entry.resultValue}
                        {entry.referenceRange && (
                          <span className="ml-1 text-muted">
                            ({entry.referenceRange})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Right: lab + verified */}
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {entry.labName && <span>{entry.labName}</span>}
                    {entry.labProvider && entry.labName && (
                      <span aria-hidden="true">&middot;</span>
                    )}
                    {entry.labProvider && !entry.labName && (
                      <span>
                        {t(`healthLog.providers.${entry.labProvider}`, {
                          defaultValue: entry.labProvider,
                        })}
                      </span>
                    )}
                    {entry.verified ? (
                      <span className="inline-flex items-center gap-0.5 text-green-600 font-medium">
                        <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        {t('healthLog.verified')}
                      </span>
                    ) : canVerify ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors hover:bg-[var(--color-secondary)]"
                        style={{ color: 'var(--color-primary)' }}
                        onClick={() => setVerifyVisitId(entry.visitId)}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        {t('labVerification.verifyButton')}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">{t('healthLog.noTests')}</p>
      )}

      {/* Lab Verification Modal */}
      {verifyVisitId && (
        <LabVerificationModal
          visitId={verifyVisitId}
          onClose={() => setVerifyVisitId(null)}
          onVerified={() => {
            historyQuery.refetch();
            setVerifyVisitId(null);
          }}
        />
      )}
    </div>
  );
}
