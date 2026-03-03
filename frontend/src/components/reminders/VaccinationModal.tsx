import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import { useCreateVaccination } from '../../hooks/useVaccinations';
import type { VaccineSeries } from '../../lib/api';

interface VaccinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, pre-fills vaccine type and auto-calculates next dose number */
  existingSeries?: VaccineSeries | null;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function VaccinationModal({ isOpen, onClose, existingSeries }: VaccinationModalProps) {
  const formKey = isOpen
    ? `${existingSeries?.vaccineType ?? 'new'}-${existingSeries?.completedDoses ?? 0}`
    : 'closed';

  if (!isOpen) return null;

  return (
    <VaccinationForm
      key={formKey}
      existingSeries={existingSeries}
      onClose={onClose}
    />
  );
}

interface VaccinationFormProps {
  existingSeries?: VaccineSeries | null;
  onClose: () => void;
}

function VaccinationForm({ existingSeries, onClose }: VaccinationFormProps) {
  const { t } = useTranslation();
  const { data: catalog } = useCatalog();
  const createMutation = useCreateVaccination();

  const [vaccineType, setVaccineType] = useState(existingSeries?.vaccineType ?? '');
  const [administeredDate, setAdministeredDate] = useState(todayISO());
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Compute dose number from existing series or default to 1
  const nextDoseNumber = existingSeries ? existingSeries.completedDoses + 1 : 1;
  const totalDoses = existingSeries?.totalDoses
    ?? (catalog?.vaccineSeries?.[vaccineType]?.totalDoses ?? 0);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vaccineType) {
      setError(t('vaccinations.errors.typeRequired'));
      return;
    }

    try {
      await createMutation.mutateAsync({
        vaccineType,
        doseNumber: nextDoseNumber,
        administeredDate,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch {
      setError(t('vaccinations.errors.saveFailed'));
    }
  };

  const vaccineTypes = catalog?.vaccineSeries
    ? Object.entries(catalog.vaccineSeries)
    : [];

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="modal">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold">{t('vaccinations.add')}</h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Vaccine Type */}
          <div>
            <label className="label" htmlFor="vax-type">
              {t('medications.type')}
            </label>
            <select
              id="vax-type"
              className="input"
              value={vaccineType}
              onChange={(e) => setVaccineType(e.target.value)}
              disabled={!!existingSeries}
            >
              <option value="">{t('medications.type')}</option>
              {vaccineTypes.map(([key]) => (
                <option key={key} value={key}>
                  {t(`vaccinations.types.${key}`, key)}
                </option>
              ))}
            </select>
          </div>

          {/* Dose number (read-only) */}
          {vaccineType && totalDoses > 0 && (
            <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {t('vaccinations.doseNumber', {
                current: nextDoseNumber,
                total: totalDoses,
              })}
            </div>
          )}

          {/* Administered Date */}
          <div>
            <label className="label" htmlFor="vax-date">
              {t('vaccinations.administeredDate')}
            </label>
            <input
              id="vax-date"
              type="date"
              className="input"
              value={administeredDate}
              max={todayISO()}
              onChange={(e) => setAdministeredDate(e.target.value)}
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="label" htmlFor="vax-location">
              {t('vaccinations.location')}
            </label>
            <input
              id="vax-location"
              type="text"
              className="input"
              value={location}
              maxLength={150}
              placeholder={t('vaccinations.locationPlaceholder')}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label" htmlFor="vax-notes">
              {t('vaccinations.notes')}
            </label>
            <textarea
              id="vax-notes"
              className="input"
              rows={3}
              value={notes}
              maxLength={5000}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              {t('healthLog.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner" aria-hidden="true" />
                  {t('common.loading')}
                </span>
              ) : (
                t('healthLog.save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
