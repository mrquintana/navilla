import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import {
  useCreateMedication,
  useUpdateMedication,
  type Medication,
} from '../../hooks/useMedications';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  medication?: Medication | null;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function MedicationModal({ isOpen, onClose, medication }: MedicationModalProps) {
  const formKey = isOpen
    ? `${medication?.id ?? 'new'}-${medication?.updatedAt ?? ''}`
    : 'closed';

  if (!isOpen) return null;

  return (
    <MedicationForm
      key={formKey}
      medication={medication}
      onClose={onClose}
    />
  );
}

interface MedicationFormProps {
  medication?: Medication | null;
  onClose: () => void;
}

function MedicationForm({ medication, onClose }: MedicationFormProps) {
  const { t } = useTranslation();
  const { data: catalog } = useCatalog();

  const createMutation = useCreateMedication();
  const updateMutation = useUpdateMedication();

  const isEditMode = !!medication;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Form state
  const [medicationType, setMedicationType] = useState(medication?.medicationType ?? '');
  const [name, setName] = useState(medication?.name ?? '');
  const [dosage, setDosage] = useState(medication?.dosage ?? '');
  const [frequency, setFrequency] = useState(medication?.frequency ?? '');
  const [startDate, setStartDate] = useState(medication?.startDate ?? todayISO());
  const [endDate, setEndDate] = useState(medication?.endDate ?? '');
  const [reminderTime, setReminderTime] = useState(medication?.reminderTime ?? '');
  const [notes, setNotes] = useState(medication?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  // Handle medication type change — auto-set default frequency from catalog
  const handleMedicationTypeChange = (newType: string) => {
    setMedicationType(newType);
    if (!isEditMode && newType && catalog?.medicationTypes) {
      const typeInfo = catalog.medicationTypes[newType];
      if (typeInfo?.defaultFrequency) {
        setFrequency(typeInfo.defaultFrequency);
      }
    }
  };

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

    if (!medicationType) {
      setError(t('medications.errors.typeRequired'));
      return;
    }

    if (!name.trim()) {
      setError(t('medications.errors.nameRequired'));
      return;
    }

    const payload = {
      medicationType,
      name: name.trim(),
      dosage: dosage.trim() || undefined,
      startDate,
      endDate: endDate || undefined,
      frequency: frequency || 'DAILY',
      reminderTime: reminderTime || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (isEditMode && medication) {
        await updateMutation.mutateAsync({
          id: medication.id,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      setError(t('medications.errors.saveFailed'));
    }
  };

  const medicationTypes = catalog?.medicationTypes
    ? Object.entries(catalog.medicationTypes)
    : [];

  const frequencies = catalog?.frequencies
    ? Object.keys(catalog.frequencies)
    : ['DAILY', 'WEEKLY', 'EVERY_2_MONTHS', 'AS_NEEDED', 'CUSTOM'];

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div
        className="modal overflow-y-auto"
        style={{ maxWidth: '520px', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold">
            {isEditMode ? t('medications.edit') : t('medications.add')}
          </h3>
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
          {/* Medication Type */}
          <div>
            <label className="label" htmlFor="med-type">
              {t('medications.type')}
            </label>
            <select
              id="med-type"
              className="input"
              value={medicationType}
              onChange={(e) => handleMedicationTypeChange(e.target.value)}
            >
              <option value="">{t('medications.type')}</option>
              {medicationTypes.map(([key]) => (
                <option key={key} value={key}>
                  {t(`medications.types.${key}`, key)}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="label" htmlFor="med-name">
              {t('medications.name')}
            </label>
            <input
              id="med-name"
              type="text"
              className="input"
              value={name}
              maxLength={200}
              placeholder={t('medications.namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Dosage */}
          <div>
            <label className="label" htmlFor="med-dosage">
              {t('medications.dosage')}
            </label>
            <input
              id="med-dosage"
              type="text"
              className="input"
              value={dosage}
              maxLength={200}
              placeholder={t('medications.dosagePlaceholder')}
              onChange={(e) => setDosage(e.target.value)}
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="label" htmlFor="med-frequency">
              {t('medications.frequency')}
            </label>
            <select
              id="med-frequency"
              className="input"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="">{t('medications.frequency')}</option>
              {frequencies.map((key) => (
                <option key={key} value={key}>
                  {t(`medications.frequencies.${key}`, key)}
                </option>
              ))}
            </select>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="med-start-date">
                {t('medications.startDate')}
              </label>
              <input
                id="med-start-date"
                type="date"
                className="input"
                value={startDate}
                max={todayISO()}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="med-end-date">
                {t('medications.endDate')}
              </label>
              <input
                id="med-end-date"
                type="date"
                className="input"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Reminder Time */}
          <div>
            <label className="label" htmlFor="med-reminder-time">
              {t('medications.reminderTime')}
            </label>
            <input
              id="med-reminder-time"
              type="time"
              className="input"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label" htmlFor="med-notes">
              {t('medications.notes')}
            </label>
            <textarea
              id="med-notes"
              className="input"
              rows={3}
              value={notes}
              maxLength={5000}
              placeholder={t('medications.notesPlaceholder')}
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
              disabled={isPending}
            >
              {t('healthLog.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending ? (
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
