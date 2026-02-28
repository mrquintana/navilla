import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ConditionSummary } from '../../lib/api';

interface ConditionCardProps {
  condition: ConditionSummary;
}

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

export function ConditionCard({ condition }: ConditionCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language.replace('_', '-');

  const isCustom = !condition.conditionType;
  const conditionName = condition.conditionType
    ? t(`healthLog.conditions.${condition.conditionType}`)
    : condition.customCondition ?? t('healthLog.addCustomCondition');

  const statusLabel = t(`healthLog.status.${condition.latestStatus.toLowerCase()}`);

  const lastTestFormatted = new Date(condition.lastTestDate + 'T00:00:00').toLocaleDateString(
    locale,
    { month: 'short', day: 'numeric' }
  );

  const testCountLabel =
    condition.totalTests === 1
      ? `${condition.totalTests} ${t('healthLog.test')}`
      : `${condition.totalTests} ${t('healthLog.tests')}`;

  const handleClick = () => {
    if (!isCustom) {
      navigate(`/health-log/${condition.conditionType}`);
    }
  };

  const Tag = isCustom ? 'div' : 'button';

  return (
    <Tag
      type={isCustom ? undefined : 'button'}
      className={`journal-entry-card w-full text-left${isCustom ? '' : ' cursor-pointer'}`}
      onClick={handleClick}
      aria-label={`${conditionName} - ${statusLabel}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: condition name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">
              {conditionName}
            </span>
            <span className={statusBadgeClass(condition.latestStatus)}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>
              {t('healthLog.lastTested')}: {lastTestFormatted}
            </span>
            <span aria-hidden="true">·</span>
            <span>{testCountLabel}</span>
          </div>
        </div>

        {/* Right: chevron (only for standard conditions with detail page) */}
        {!isCustom && (
          <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" aria-hidden="true" />
        )}
      </div>
    </Tag>
  );
}
