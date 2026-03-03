import { useTranslation } from 'react-i18next';
import { Syringe, Check } from 'lucide-react';
import type { VaccineSeries } from '../../lib/api';

interface VaccinationSeriesCardProps {
  series: VaccineSeries;
  onLogDose: () => void;
}

export function VaccinationSeriesCard({ series, onLogDose }: VaccinationSeriesCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.replace('_', '-');

  const typeLabel = t(`vaccinations.types.${series.vaccineType}`, series.vaccineType);

  const nextDoseFormatted = series.nextDoseDate
    ? new Date(series.nextDoseDate + 'T00:00:00').toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="journal-entry-card">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: series.complete
              ? 'rgba(22, 163, 74, 0.1)'
              : 'rgba(79, 70, 229, 0.08)',
          }}
        >
          <Syringe
            className="w-5 h-5"
            style={{
              color: series.complete ? 'var(--color-success)' : 'var(--color-primary)',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
              {typeLabel}
            </span>
            {series.complete && (
              <span className="badge badge-success">
                <Check className="w-3 h-3 mr-1" aria-hidden="true" />
                {t('vaccinations.complete')}
              </span>
            )}
          </div>

          {/* Dose progress dots */}
          <div className="flex items-center gap-1 mb-1.5">
            {Array.from({ length: series.totalDoses }).map((_, i) => {
              const filled = i < series.completedDoses;
              return (
                <div key={i} className="flex items-center">
                  {i > 0 && (
                    <div
                      className="w-3 h-0.5"
                      style={{
                        backgroundColor: filled
                          ? 'var(--color-primary)'
                          : 'var(--color-border)',
                      }}
                    />
                  )}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: filled
                        ? 'var(--color-primary)'
                        : 'transparent',
                      border: filled
                        ? 'none'
                        : '2px solid var(--color-border)',
                    }}
                    aria-label={
                      filled
                        ? t('vaccinations.doseNumber', { current: i + 1, total: series.totalDoses })
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </div>

          {/* Progress text + next dose */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
            <span>
              {t('vaccinations.doseNumber', {
                current: series.completedDoses,
                total: series.totalDoses,
              })}
            </span>
            {!series.complete && nextDoseFormatted && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span>{t('vaccinations.nextDose', { date: nextDoseFormatted })}</span>
              </>
            )}
          </div>
        </div>

        {/* Log dose button for incomplete series */}
        {!series.complete && (
          <button
            type="button"
            className="btn btn-primary btn-sm flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onLogDose();
            }}
          >
            {t('vaccinations.add')}
          </button>
        )}
      </div>
    </div>
  );
}
