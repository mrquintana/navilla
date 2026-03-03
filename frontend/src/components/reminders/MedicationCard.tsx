import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Pill, ChevronRight } from 'lucide-react';
import type { Medication } from '../../lib/api';
import { DoseLogButton } from './DoseLogButton';

interface MedicationCardProps {
  medication: Medication;
}

export function MedicationCard({ medication }: MedicationCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const typeLabel = t(`medications.types.${medication.medicationType}`, medication.medicationType);
  const frequencyLabel = t(`medications.frequencies.${medication.frequency}`, medication.frequency);

  return (
    <div
      className={`journal-entry-card ${!medication.active ? 'opacity-60' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/health-log/medication/${medication.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/health-log/medication/${medication.id}`);
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(79, 70, 229, 0.08)' }}
        >
          <Pill className="w-5 h-5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm truncate" style={{ color: 'var(--color-foreground)' }}>
              {medication.name}
            </span>
            {medication.active && (
              <span className="badge badge-success">{t('medications.active')}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
            <span>{typeLabel}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{frequencyLabel}</span>
            {medication.dosage && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span>{medication.dosage}</span>
              </>
            )}
          </div>
        </div>

        {/* Right side: dose log or chevron */}
        <div className="flex-shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {medication.active && <DoseLogButton medicationId={medication.id} />}
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
