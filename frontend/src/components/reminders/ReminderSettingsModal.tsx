import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
  useReminderSettings,
  useUpdateReminderSettings,
} from '../../hooks/useReminders';
import type { ReminderSettings } from '../../lib/api';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

export function ReminderSettingsModal({ isOpen, onClose }: ReminderSettingsModalProps) {
  if (!isOpen) return null;
  return createPortal(<ReminderSettingsLoader onClose={onClose} />, document.body);
}

/** Loader that fetches settings then renders the form once data is ready */
function ReminderSettingsLoader({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useReminderSettings();

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

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div
        className="modal overflow-y-auto"
        style={{ maxWidth: '460px', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold">{t('reminders.settings')}</h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {isLoading || !settings ? (
          <div className="flex items-center justify-center py-8">
            <span className="spinner" aria-label={t('common.loading')} />
          </div>
        ) : (
          <ReminderSettingsForm settings={settings} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

/** Form that initializes state from settings props (no useEffect sync needed) */
function ReminderSettingsForm({ settings, onClose }: { settings: ReminderSettings; onClose: () => void }) {
  const { t } = useTranslation();
  const updateMutation = useUpdateReminderSettings();

  const [quietHoursStart, setQuietHoursStart] = useState(settings.quietHoursStart ?? '');
  const [quietHoursEnd, setQuietHoursEnd] = useState(settings.quietHoursEnd ?? '');
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(settings.emailDigestEnabled);
  const [emailDigestDay, setEmailDigestDay] = useState(settings.emailDigestDay ?? 'MONDAY');
  const [testingRemindersEnabled, setTestingRemindersEnabled] = useState(settings.testingRemindersEnabled);
  const [medicationRemindersEnabled, setMedicationRemindersEnabled] = useState(settings.medicationRemindersEnabled);
  const [vaccinationRemindersEnabled, setVaccinationRemindersEnabled] = useState(settings.vaccinationRemindersEnabled);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await updateMutation.mutateAsync({
        quietHoursStart: quietHoursStart || null,
        quietHoursEnd: quietHoursEnd || null,
        emailDigestEnabled,
        emailDigestDay: emailDigestEnabled ? emailDigestDay : null,
        testingRemindersEnabled,
        medicationRemindersEnabled,
        vaccinationRemindersEnabled,
      });
      onClose();
    } catch {
      setError(t('common.error', 'Failed to save settings'));
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Quiet Hours */}
      <fieldset>
        <legend className="label mb-2">{t('reminders.quietHours')}</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs" style={{ color: 'var(--color-muted)' }} htmlFor="quiet-start">
              {t('reminders.quietHoursStart')}
            </label>
            <input
              id="quiet-start"
              type="time"
              className="input"
              value={quietHoursStart}
              onChange={(e) => setQuietHoursStart(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--color-muted)' }} htmlFor="quiet-end">
              {t('reminders.quietHoursEnd')}
            </label>
            <input
              id="quiet-end"
              type="time"
              className="input"
              value={quietHoursEnd}
              onChange={(e) => setQuietHoursEnd(e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {/* Email Digest */}
      <fieldset className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="label mb-0" htmlFor="email-digest">
            {t('reminders.emailDigest')}
          </label>
          <input
            id="email-digest"
            type="checkbox"
            checked={emailDigestEnabled}
            onChange={(e) => setEmailDigestEnabled(e.target.checked)}
            className="accent-indigo-600 w-5 h-5"
          />
        </div>
        {emailDigestEnabled && (
          <div>
            <label className="text-xs" style={{ color: 'var(--color-muted)' }} htmlFor="digest-day">
              {t('reminders.emailDigestDay')}
            </label>
            <select
              id="digest-day"
              className="input"
              value={emailDigestDay}
              onChange={(e) => setEmailDigestDay(e.target.value)}
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day} value={day}>
                  {t(`common.days.${day}`, day.charAt(0) + day.slice(1).toLowerCase())}
                </option>
              ))}
            </select>
          </div>
        )}
      </fieldset>

      {/* Per-type toggles */}
      <fieldset className="space-y-3">
        <ToggleRow
          label={t('reminders.testingReminders')}
          id="toggle-testing"
          checked={testingRemindersEnabled}
          onChange={setTestingRemindersEnabled}
        />
        <ToggleRow
          label={t('reminders.medicationReminders')}
          id="toggle-medication"
          checked={medicationRemindersEnabled}
          onChange={setMedicationRemindersEnabled}
        />
        <ToggleRow
          label={t('reminders.vaccinationReminders')}
          id="toggle-vaccination"
          checked={vaccinationRemindersEnabled}
          onChange={setVaccinationRemindersEnabled}
        />
      </fieldset>

      {/* Error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={updateMutation.isPending}
        >
          {t('healthLog.cancel')}
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
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
  );
}

function ToggleRow({
  label,
  id,
  checked,
  onChange,
}: {
  label: string;
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-indigo-600 w-5 h-5"
      />
    </div>
  );
}
