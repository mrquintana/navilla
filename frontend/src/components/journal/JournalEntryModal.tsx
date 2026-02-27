import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { X, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useJournalTemplates,
  useSaveJournalTemplates,
} from '../../hooks/useJournal';
import { api } from '../../lib/api';
import type { JournalEntry, CustomField, Connection } from '../../lib/api';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry | null; // null = create mode, defined = edit mode
}

interface CustomFieldState {
  label: string;
  value: string;
  saveForFuture: boolean;
}

const MAX_CUSTOM_FIELDS = 3;

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function buildInitialCustomFields(
  entry: JournalEntry | null,
  savedLabels: string[]
): CustomFieldState[] {
  if (entry) {
    return (entry.customFields ?? []).map((cf: CustomField) => ({
      label: cf.label,
      value: cf.value,
      saveForFuture: false,
    }));
  }
  return savedLabels.slice(0, MAX_CUSTOM_FIELDS).map((label) => ({
    label,
    value: '',
    saveForFuture: false,
  }));
}

export function JournalEntryModal({ isOpen, onClose, entry }: JournalEntryModalProps) {
  const { session } = useAuth();
  const { data: templates } = useJournalTemplates();

  const connectionsQuery = useQuery({
    queryKey: ['connections', 'confirmed'],
    queryFn: () => api.connections.confirmed(session!.access_token),
    enabled: isOpen && !!session?.access_token,
  });

  const savedLabels = useMemo(() => templates?.labels ?? [], [templates?.labels]);

  // Use a key to reset the inner form when modal opens with different entry
  // This avoids calling setState in useEffect
  const formKey = isOpen ? `${entry?.id ?? 'new'}-${entry?.updatedAt ?? ''}` : 'closed';

  if (!isOpen) return null;

  return (
    <JournalEntryForm
      key={formKey}
      entry={entry}
      onClose={onClose}
      savedLabels={savedLabels}
      connections={connectionsQuery.data ?? []}
    />
  );
}

interface JournalEntryFormProps {
  entry: JournalEntry | null;
  onClose: () => void;
  savedLabels: string[];
  connections: Connection[];
}

function JournalEntryForm({
  entry,
  onClose,
  savedLabels,
  connections,
}: JournalEntryFormProps) {
  const { t } = useTranslation();

  // Mutations
  const createMutation = useCreateJournalEntry();
  const updateMutation = useUpdateJournalEntry();
  const templatesMutation = useSaveJournalTemplates();

  const isEditMode = entry !== null;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Form state — initialized from props (no useEffect needed thanks to key-based reset)
  const [formDate, setFormDate] = useState(entry?.encounterDate ?? todayISO());
  const [formAlias, setFormAlias] = useState(entry?.partnerAlias ?? '');
  const [formConnectionId, setFormConnectionId] = useState<string>(entry?.connectionId ?? '');
  const [formNotes, setFormNotes] = useState(entry?.notes ?? '');
  const [customFields, setCustomFields] = useState<CustomFieldState[]>(
    () => buildInitialCustomFields(entry, savedLabels)
  );
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Custom fields handlers
  const addCustomField = () => {
    if (customFields.length >= MAX_CUSTOM_FIELDS) return;
    setCustomFields((prev) => [...prev, { label: '', value: '', saveForFuture: false }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: Partial<CustomFieldState>) => {
    setCustomFields((prev) =>
      prev.map((cf, i) => (i === index ? { ...cf, ...field } : cf))
    );
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formDate.trim()) {
      setError(t('journal.dateRequired'));
      return;
    }

    // Build custom fields (only include non-empty ones)
    const filteredCustomFields: CustomField[] = customFields
      .filter((cf) => cf.label.trim() && cf.value.trim())
      .map((cf) => ({ label: cf.label.trim(), value: cf.value.trim() }));

    const data = {
      encounterDate: formDate,
      partnerAlias: formAlias.trim() || undefined,
      connectionId: formConnectionId || undefined,
      notes: formNotes.trim() || undefined,
      customFields: filteredCustomFields.length > 0 ? filteredCustomFields : undefined,
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: entry.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }

      // Save templates if any "save for future" checkboxes are checked
      const newLabelsToSave = customFields
        .filter((cf) => cf.saveForFuture && cf.label.trim())
        .map((cf) => cf.label.trim());

      if (newLabelsToSave.length > 0) {
        const combined = [...new Set([...savedLabels, ...newLabelsToSave])].slice(
          0,
          MAX_CUSTOM_FIELDS
        );
        await templatesMutation.mutateAsync(combined);
      }

      onClose();
    } catch {
      setError(t('journal.saveFailed'));
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="modal" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold">
            {isEditMode ? t('journal.editEntry') : t('journal.addEntry')}
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            {t('common.close')}
          </button>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Encounter date */}
          <div>
            <label className="label" htmlFor="journal-date">
              {t('journal.encounterDate')}
            </label>
            <input
              id="journal-date"
              type="date"
              className="input"
              value={formDate}
              max={todayISO()}
              onChange={(e) => setFormDate(e.target.value)}
              required
            />
          </div>

          {/* Partner alias */}
          <div>
            <label className="label" htmlFor="journal-alias">
              {t('journal.partnerAlias')}
            </label>
            <input
              id="journal-alias"
              type="text"
              className="input"
              value={formAlias}
              placeholder={t('journal.partnerAliasPlaceholder')}
              maxLength={200}
              onChange={(e) => setFormAlias(e.target.value)}
            />
          </div>

          {/* Link to connection */}
          <div>
            <label className="label" htmlFor="journal-connection">
              {t('journal.linkConnection')}
            </label>
            <select
              id="journal-connection"
              className="input"
              value={formConnectionId}
              onChange={(e) => setFormConnectionId(e.target.value)}
            >
              <option value="">{t('journal.noConnection')}</option>
              {connections.map((conn) => (
                <option key={conn.id} value={conn.id}>
                  {conn.partnerDisplayName ?? conn.partnerUsername ?? conn.id}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="label" htmlFor="journal-notes">
              {t('journal.notes')}
            </label>
            <textarea
              id="journal-notes"
              className="input"
              rows={3}
              value={formNotes}
              placeholder={t('journal.notesPlaceholder')}
              maxLength={5000}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          {/* Custom fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label mb-0">{t('journal.customFields')}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addCustomField}
                disabled={customFields.length >= MAX_CUSTOM_FIELDS}
                title={
                  customFields.length >= MAX_CUSTOM_FIELDS
                    ? t('journal.maxFields')
                    : undefined
                }
              >
                <span className="inline-flex items-center gap-1">
                  <Plus className="nav-icon" aria-hidden="true" />
                  {t('journal.addField')}
                </span>
              </button>
            </div>

            {customFields.length > 0 && (
              <div className="space-y-3">
                {customFields.map((cf, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="input"
                        placeholder={t('journal.fieldLabelPlaceholder')}
                        value={cf.label}
                        maxLength={100}
                        onChange={(e) =>
                          updateCustomField(index, { label: e.target.value })
                        }
                        aria-label={t('journal.fieldLabel')}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder={t('journal.fieldValuePlaceholder')}
                        value={cf.value}
                        maxLength={500}
                        onChange={(e) =>
                          updateCustomField(index, { value: e.target.value })
                        }
                        aria-label={t('journal.fieldValue')}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm flex-shrink-0"
                        onClick={() => removeCustomField(index)}
                        aria-label={t('journal.removeField')}
                        title={t('journal.removeField')}
                      >
                        <X className="nav-icon" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Save for future checkbox — only if label non-empty and not already saved */}
                    {cf.label.trim() &&
                      !savedLabels.includes(cf.label.trim()) && (
                        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cf.saveForFuture}
                            onChange={(e) =>
                              updateCustomField(index, {
                                saveForFuture: e.target.checked,
                              })
                            }
                          />
                          {t('journal.saveForFuture', { label: cf.label.trim() })}
                        </label>
                      )}
                  </div>
                ))}
              </div>
            )}

            {customFields.length >= MAX_CUSTOM_FIELDS && (
              <p className="text-xs text-muted mt-1">{t('journal.maxFields')}</p>
            )}
          </div>

          {/* Error message */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isPending}
            >
              {t('journal.cancel')}
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
                t('journal.save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
