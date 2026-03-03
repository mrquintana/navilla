import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { useLogDose } from '../../hooks/useMedications';

interface DoseLogButtonProps {
  medicationId: string;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function DoseLogButton({ medicationId }: DoseLogButtonProps) {
  const { t } = useTranslation();
  const logDose = useLogDose();
  const [showCheck, setShowCheck] = useState(false);

  const handleLog = async () => {
    try {
      await logDose.mutateAsync({
        id: medicationId,
        data: { scheduledFor: todayISO(), taken: true },
      });
      setShowCheck(true);
      setTimeout(() => setShowCheck(false), 2000);
    } catch {
      // Error handled by mutation state
    }
  };

  if (showCheck) {
    return (
      <span
        className="inline-flex items-center gap-1 text-sm font-medium"
        style={{ color: 'var(--color-success)' }}
      >
        <Check className="w-4 h-4" aria-hidden="true" />
        {t('medications.taken')}
      </span>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-primary btn-sm"
      onClick={handleLog}
      disabled={logDose.isPending}
    >
      {logDose.isPending ? (
        <span className="spinner" aria-hidden="true" />
      ) : (
        <span className="inline-flex items-center gap-1">
          <Check className="w-4 h-4" aria-hidden="true" />
          {t('medications.logDose')}
        </span>
      )}
    </button>
  );
}
