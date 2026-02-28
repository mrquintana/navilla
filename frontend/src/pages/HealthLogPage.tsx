import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Lock, Plus, HelpCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHealthLogSummary } from '../hooks/useHealthLog';
import { api } from '../lib/api';
import { getConditionInfo } from '../lib/conditionInfo';
import { HealthLogStats } from '../components/health-log/HealthLogStats';
import { ConditionCard } from '../components/health-log/ConditionCard';
import { TestVisitModal } from '../components/health-log/TestVisitModal';
import { PageSkeleton, SkeletonBlock, SkeletonRows } from '../components/ui/LoadingShell';

export function HealthLogPage() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const token = session?.access_token ?? '';

  const [modalOpen, setModalOpen] = useState(false);
  const [showAllExposures, setShowAllExposures] = useState(false);
  const [showExposureInfo, setShowExposureInfo] = useState(false);

  // Health log summary (conditions, stats)
  const summaryQuery = useHealthLogSummary();

  // Exposure data (ported from HealthStatusPage)
  const exposureQuery = useQuery({
    queryKey: ['exposures'],
    queryFn: () => api.exposures.get(token),
    enabled: !!token,
  });

  const summary = summaryQuery.data;
  const exposureItems = exposureQuery.data?.exposures ?? [];
  const exposureInitialLoading = exposureQuery.isLoading && !exposureQuery.data;
  const summaryLoading = summaryQuery.isLoading && !summaryQuery.data;
  const isInitialLoading = summaryLoading && exposureInitialLoading;

  if (isInitialLoading) {
    return (
      <PageSkeleton loadingLabel={t('common.loading')}>
        <SkeletonBlock className="h-24 rounded-2xl" />
        <SkeletonBlock className="h-40 rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonBlock className="h-20 rounded-xl" />
          <SkeletonBlock className="h-20 rounded-xl" />
          <SkeletonBlock className="h-20 rounded-xl" />
          <SkeletonBlock className="h-20 rounded-xl" />
        </div>
      </PageSkeleton>
    );
  }

  const hasConditions = (summary?.conditions?.length ?? 0) > 0;

  return (
    <div className="container py-8 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">{t('healthLog.title')}</h1>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('healthLog.encrypted')}</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setModalOpen(true)}
        >
          <span className="inline-flex items-center gap-1">
            <Plus className="w-4 h-4" aria-hidden="true" />
            {t('healthLog.addVisit')}
          </span>
        </button>
      </div>

      {/* Stats bar */}
      {summary && <HealthLogStats summary={summary} />}

      {/* Exposure Overview section */}
      <div className="card card-elevated space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">{t('healthLog.exposureOverview')}</h3>
            <p className="text-xs text-muted">{t('health.exposureHint')}</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowExposureInfo(true)}
            title={t('health.moreInfoTitle')}
          >
            <HelpCircle className="nav-icon" aria-hidden="true" />
          </button>
        </div>
        {exposureInitialLoading ? (
          <div role="status" aria-live="polite">
            <span className="sr-only">{t('common.loading')}</span>
            <SkeletonRows rows={4} />
          </div>
        ) : exposureItems.length > 0 ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{t('health.exposureDetected')}</span>
              <span>
                {t('health.exposureUpdatedAt')}{' '}
                {exposureQuery.data?.computedAt
                  ? new Date(exposureQuery.data.computedAt).toLocaleDateString()
                  : '\u2014'}
              </span>
            </div>
            {(showAllExposures ? exposureItems : exposureItems.slice(0, 6)).map(
              (item) => (
                <div key={item.condition} className="exposure-item">
                  <div className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    <a
                      className="health-condition-link"
                      href={
                        getConditionInfo(item.condition, i18n.language).url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.condition}
                      <ExternalLink
                        className="nav-icon"
                        aria-hidden="true"
                      />
                    </a>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>
                      {t('health.exposureClosest', {
                        degree: item.closestDegree,
                      })}
                    </span>
                    <span>&bull;</span>
                    <span>
                      {t('health.exposureCases')} {item.count}
                    </span>
                  </div>
                  <p
                    className="text-xs text-muted cursor-help"
                    title={`${t(`dashboard.exposureStatusHint.${item.status}`)} \u00B7 ${t(`dashboard.exposureTimeframeHint.${item.timeframe}`)}`}
                  >
                    {t(`dashboard.exposureStatusLabels.${item.status}`)} &middot;{' '}
                    {t(`dashboard.exposureTimeframe.${item.timeframe}`)}
                  </p>
                </div>
              )
            )}
            {exposureItems.length > 6 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAllExposures((prev) => !prev)}
              >
                {showAllExposures
                  ? t('health.showLess')
                  : t('health.showAll')}
              </button>
            )}
          </div>
        ) : exposureQuery.data?.message ? (
          <p className="text-sm text-muted">
            {t(exposureQuery.data.message)}
          </p>
        ) : (
          <p className="text-sm text-muted">{t('health.noExposure')}</p>
        )}
      </div>

      {/* My Results section */}
      <div className="space-y-3">
        <h3 className="font-semibold">{t('healthLog.myResults')}</h3>

        {hasConditions ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {summary!.conditions.map((condition) => {
              const key =
                condition.conditionType ?? condition.customCondition ?? 'unknown';
              return <ConditionCard key={key} condition={condition} />;
            })}
          </div>
        ) : (
          <div className="card card-elevated text-center py-10 space-y-3">
            <p className="text-lg font-semibold text-foreground">
              {t('healthLog.noTests')}
            </p>
            <p className="text-sm text-muted">
              {t('healthLog.noTestsDescription')}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalOpen(true)}
            >
              <span className="inline-flex items-center gap-1">
                <Plus className="w-4 h-4" aria-hidden="true" />
                {t('healthLog.addVisit')}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Coverage text */}
      {summary && summary.conditionsCovered > 0 && (
        <p className="text-sm text-muted text-center">
          {t('healthLog.coverageDescription', {
            count: summary.conditionsCovered,
            total: summary.totalStandardConditions,
          })}
        </p>
      )}

      {/* Test Visit Modal */}
      <TestVisitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Exposure Info Modal */}
      {showExposureInfo && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-semibold">
                {t('healthLog.exposureOverview')}
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowExposureInfo(false)}
              >
                {t('common.close')}
              </button>
            </div>
            <p className="text-sm text-muted">
              {t('health.exposureInfo')
                .split(/(\*\*[^*]+\*\*)/g)
                .map((part, index) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                  }
                  return <span key={index}>{part}</span>;
                })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
