import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, HelpCircle, Users, Shield } from 'lucide-react';
import type { NetworkHealth } from '../../hooks/useNetworkHealth';

interface Props {
  data: NetworkHealth;
}

const levelConfig = {
  HIGH: {
    labelKey: 'networkHealth.levelHigh',
    descKey: 'networkHealth.activity.high',
    color: 'var(--color-success)',
    bg: 'rgba(22, 163, 74, 0.1)',
  },
  MEDIUM: {
    labelKey: 'networkHealth.levelMedium',
    descKey: 'networkHealth.activity.medium',
    color: 'var(--color-warning)',
    bg: 'rgba(227, 160, 8, 0.1)',
  },
  LOW: {
    labelKey: 'networkHealth.levelLow',
    descKey: 'networkHealth.activity.low',
    color: 'var(--color-error)',
    bg: 'rgba(220, 53, 69, 0.1)',
  },
  UNKNOWN: {
    labelKey: 'networkHealth.levelUnknown',
    descKey: 'networkHealth.activity.unknown',
    color: 'var(--color-muted)',
    bg: 'var(--color-background-secondary)',
  },
} as const;

export function NetworkHealthSection({ data }: Props) {
  const { t } = useTranslation();
  const config = levelConfig[data.testingActivityLevel];
  const [showActivityHelp, setShowActivityHelp] = useState(false);
  const [showCoverageHelp, setShowCoverageHelp] = useState(false);

  const extendedCount = (data.secondDegreeCount ?? 0) + (data.thirdDegreeCount ?? 0);

  return (
    <div className="space-y-4">
      {/* Testing Activity */}
      <div className="card card-elevated p-4">
        <div className="flex items-center gap-3 mb-3">
          <Activity className="w-5 h-5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            {t('networkHealth.testingActivity')}
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm p-1"
            onClick={() => setShowActivityHelp((prev) => !prev)}
            aria-label={t('networkHealth.activityHelpTitle')}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
        {showActivityHelp && (
          <div className="mb-3 rounded-md border border-border-light p-3 text-xs text-muted" style={{ background: 'var(--color-background-secondary)' }}>
            <p className="font-semibold text-foreground mb-1">{t('networkHealth.activityHelpTitle')}</p>
            <p>{t('networkHealth.activityHelpBody')}</p>
          </div>
        )}
        <div className="flex items-center gap-2 mb-1">
          <span
            role="status"
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-0.5 rounded-full"
            style={{ color: config.color, background: config.bg }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: config.color }}
              aria-hidden="true"
            />
            {t(config.labelKey)}
          </span>
        </div>
        <p className="text-sm text-muted">
          {t(config.descKey)}
        </p>
      </div>

      {/* Network Coverage */}
      <div className="card card-elevated p-4">
        <div className="flex items-center gap-3 mb-3">
          <Users className="w-5 h-5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            {t('networkHealth.networkCoverage')}
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm p-1"
            onClick={() => setShowCoverageHelp((prev) => !prev)}
            aria-label={t('networkHealth.coverageHelpTitle')}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
        {showCoverageHelp && (
          <div className="mb-3 rounded-md border border-border-light p-3 text-xs text-muted" style={{ background: 'var(--color-background-secondary)' }}>
            <p className="font-semibold text-foreground mb-1">{t('networkHealth.coverageHelpTitle')}</p>
            <p>{t('networkHealth.coverageHelpBody')}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="font-semibold text-lg" style={{ color: 'var(--color-foreground)' }}>
              {data.connectionCount}
            </span>
            <span className="text-muted ml-1.5">{t('networkHealth.directConnections')}</span>
          </div>
          <div>
            <span className="font-semibold text-lg" style={{ color: 'var(--color-foreground)' }}>
              {extendedCount}
            </span>
            <span className="text-muted ml-1.5">{t('networkHealth.extendedConnections')}</span>
          </div>
        </div>
        {data.totalNetworkSize != null && (
          <p className="text-xs text-muted mt-2">
            {t('networkHealth.uniquePeople', {
              count: data.totalNetworkSize,
              degrees: data.maxDepth,
            })}
          </p>
        )}
      </div>

      {/* Exposure Summary */}
      <div className="card card-elevated p-4">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            {t('networkHealth.exposureSummary')}
          </h3>
        </div>
        <div className="space-y-2 text-sm">
          {data.activeExposureCount > 0 ? (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium"
              style={{ color: '#92400e', background: 'rgba(227, 160, 8, 0.12)' }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: 'var(--color-warning)' }}
                aria-hidden="true"
              />
              {t('networkHealth.activeConditions', { count: data.activeExposureCount })}
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium"
              style={{ color: '#166534', background: 'rgba(22, 163, 74, 0.1)' }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: 'var(--color-success)' }}
                aria-hidden="true"
              />
              {t('networkHealth.noActiveExposures')}
            </div>
          )}
          {data.recentlyResolvedCount > 0 && (
            <p className="text-muted text-xs">
              {t('networkHealth.resolvedRecently', { count: data.recentlyResolvedCount })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
