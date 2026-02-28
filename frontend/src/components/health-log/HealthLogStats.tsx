import { useTranslation } from 'react-i18next';
import type { HealthLogSummary } from '../../hooks/useHealthLog';

interface HealthLogStatsProps {
  summary: HealthLogSummary;
}

export function HealthLogStats({ summary }: HealthLogStatsProps) {
  const { t } = useTranslation();

  const coveragePercent =
    summary.totalStandardConditions > 0
      ? Math.round(
          (summary.conditionsCovered / summary.totalStandardConditions) * 100
        )
      : 0;

  const neverTested = summary.daysSinceLastTest < 0;

  return (
    <div className="card" style={{ background: 'var(--color-background-secondary)' }}>
      {/* Days since last test — large number */}
      <div className="text-center mb-3">
        {neverTested ? (
          <p className="text-lg font-semibold text-muted">
            {t('healthLog.neverTested')}
          </p>
        ) : (
          <>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              {summary.daysSinceLastTest}
            </p>
            <p className="text-sm text-muted">{t('healthLog.daysSinceTest')}</p>
          </>
        )}
      </div>

      {/* Row: tests this year + coverage */}
      <div className="flex items-center justify-center gap-4 text-sm text-muted">
        <span>
          {t('healthLog.testsThisYear')}: <strong className="text-foreground">{summary.testsThisYear}</strong>
        </span>
        <span aria-hidden="true" className="w-px h-4 bg-stone-300" />
        <span>
          {t('healthLog.coverage')}: <strong className="text-foreground">{summary.conditionsCovered}/{summary.totalStandardConditions}</strong>
        </span>
      </div>

      {/* Coverage bar */}
      <div className="mt-3">
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--color-border-light)' }}
          role="progressbar"
          aria-valuenow={coveragePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('healthLog.coverageDescription', {
            count: summary.conditionsCovered,
            total: summary.totalStandardConditions,
          })}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${coveragePercent}%`,
              background: 'var(--color-primary)',
            }}
          />
        </div>
        <p className="text-xs text-muted mt-1 text-center">
          {t('healthLog.coverageDescription', {
            count: summary.conditionsCovered,
            total: summary.totalStandardConditions,
          })}
        </p>
      </div>
    </div>
  );
}
