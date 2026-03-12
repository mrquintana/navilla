import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
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

export function NetworkHealthCard({ data }: Props) {
  const { t } = useTranslation();
  const config = levelConfig[data.testingActivityLevel];

  return (
    <div className="card card-elevated">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(99, 102, 241, 0.08)' }}
        >
          <Activity className="w-5 h-5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
          {t('networkHealth.title')}
        </h3>
      </div>

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

      <p className="text-sm text-muted mb-2">
        {t(config.descKey)}
      </p>

      <p className="text-xs text-muted">
        {t('networkHealth.compactSummary', {
          connections: data.connectionCount,
          network: data.totalNetworkSize ?? data.connectionCount,
        })}
      </p>
    </div>
  );
}
