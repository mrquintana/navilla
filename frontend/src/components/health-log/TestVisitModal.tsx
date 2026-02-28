import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import {
  useCreateTestVisit,
  useUpdateTestVisit,
} from '../../hooks/useHealthLog';
import type { TestVisit, TestResultInput } from '../../lib/api';
import { LabPicker } from './LabPicker';

interface TestVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  editVisit?: TestVisit | null;
}

const STANDARD_CONDITIONS = [
  'HIV',
  'CHLAMYDIA',
  'GONORRHEA',
  'SYPHILIS',
  'HSV1',
  'HSV2',
  'HPV',
  'HEPATITIS_B',
  'HEPATITIS_C',
  'TRICHOMONIASIS',
] as const;

const STATUS_OPTIONS = ['NEGATIVE', 'POSITIVE', 'PENDING', 'INDETERMINATE'] as const;

interface ConditionRow {
  checked: boolean;
  conditionType: string | null;
  customCondition: string;
  status: string;
  resultValue: string;
  referenceRange: string;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function buildInitialRows(editVisit?: TestVisit | null): ConditionRow[] {
  const rows: ConditionRow[] = STANDARD_CONDITIONS.map((ct) => {
    const existing = editVisit?.results.find(
      (r) => r.conditionType === ct
    );
    return {
      checked: !!existing,
      conditionType: ct,
      customCondition: '',
      status: existing?.status ?? '',
      resultValue: existing?.resultValue ?? '',
      referenceRange: existing?.referenceRange ?? '',
    };
  });

  // Add custom conditions from edit visit
  if (editVisit) {
    const customResults = editVisit.results.filter(
      (r) => !r.conditionType && r.customCondition
    );
    for (const cr of customResults) {
      rows.push({
        checked: true,
        conditionType: null,
        customCondition: cr.customCondition ?? '',
        status: cr.status,
        resultValue: cr.resultValue ?? '',
        referenceRange: cr.referenceRange ?? '',
      });
    }
  }

  return rows;
}

export function TestVisitModal({ isOpen, onClose, editVisit }: TestVisitModalProps) {
  // Use a key to reset form state when modal opens with different visit
  const formKey = isOpen
    ? `${editVisit?.id ?? 'new'}-${editVisit?.updatedAt ?? ''}`
    : 'closed';

  if (!isOpen) return null;

  return (
    <TestVisitForm
      key={formKey}
      editVisit={editVisit}
      onClose={onClose}
    />
  );
}

interface TestVisitFormProps {
  editVisit?: TestVisit | null;
  onClose: () => void;
}

function TestVisitForm({ editVisit, onClose }: TestVisitFormProps) {
  const { t } = useTranslation();
  const { data: userProfile } = useUser();

  const createMutation = useCreateTestVisit();
  const updateMutation = useUpdateTestVisit();

  const isEditMode = !!editVisit;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Form state
  const [testDate, setTestDate] = useState(editVisit?.testDate ?? todayISO());
  const [labId, setLabId] = useState<string | null>(editVisit?.labId ?? null);
  const [labReference, setLabReference] = useState(editVisit?.labReference ?? '');
  const [notes, setNotes] = useState(editVisit?.notes ?? '');
  const [conditionRows, setConditionRows] = useState<ConditionRow[]>(
    () => buildInitialRows(editVisit)
  );
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
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

  // Condition row handlers
  const toggleCondition = (index: number) => {
    setConditionRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, checked: !row.checked } : row
      )
    );
  };

  const updateRow = (index: number, updates: Partial<ConditionRow>) => {
    setConditionRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row))
    );
  };

  const addCustomCondition = () => {
    setConditionRows((prev) => [
      ...prev,
      {
        checked: true,
        conditionType: null,
        customCondition: '',
        status: '',
        resultValue: '',
        referenceRange: '',
      },
    ]);
  };

  const removeCustomRow = (index: number) => {
    setConditionRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!testDate.trim()) {
      setError(t('healthLog.errors.dateRequired'));
      return;
    }

    const checkedRows = conditionRows.filter((r) => r.checked);
    if (checkedRows.length === 0) {
      setError(t('healthLog.errors.resultsRequired'));
      return;
    }

    // Validate each checked row has a status
    for (const row of checkedRows) {
      if (!row.status) {
        setError(t('healthLog.errors.statusRequired'));
        return;
      }
    }

    // Build results
    const results: TestResultInput[] = checkedRows.map((row) => {
      const input: TestResultInput = {
        status: row.status,
      };
      if (row.conditionType) {
        input.conditionType = row.conditionType;
      }
      if (!row.conditionType && row.customCondition.trim()) {
        input.customCondition = row.customCondition.trim();
      }
      if (row.resultValue.trim()) {
        input.resultValue = row.resultValue.trim();
      }
      if (row.referenceRange.trim()) {
        input.referenceRange = row.referenceRange.trim();
      }
      return input;
    });

    try {
      if (isEditMode && editVisit) {
        await updateMutation.mutateAsync({
          id: editVisit.id,
          data: {
            testDate,
            labId: labId ?? undefined,
            labReference: labReference.trim() || undefined,
            results,
            notes: notes.trim() || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          testDate,
          labId: labId ?? undefined,
          labReference: labReference.trim() || undefined,
          results,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch {
      setError(t('healthLog.errors.saveFailed'));
    }
  };

  const dateOfBirth = userProfile?.dateOfBirth;

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
            {isEditMode ? t('healthLog.editVisit') : t('healthLog.addVisit')}
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
          {/* Test date */}
          <div>
            <label className="label" htmlFor="visit-date">
              {t('healthLog.date')}
            </label>
            <input
              id="visit-date"
              type="date"
              className="input"
              value={testDate}
              min={dateOfBirth || undefined}
              max={todayISO()}
              onChange={(e) => setTestDate(e.target.value)}
              required
            />
          </div>

          {/* Lab picker */}
          <LabPicker selectedLabId={labId} onSelect={setLabId} />

          {/* Lab reference */}
          <div>
            <label className="label" htmlFor="visit-lab-reference">
              {t('healthLog.labReference')}
            </label>
            <input
              id="visit-lab-reference"
              type="text"
              className="input"
              value={labReference}
              placeholder={t('healthLog.labReferencePlaceholder')}
              maxLength={200}
              onChange={(e) => setLabReference(e.target.value)}
            />
          </div>

          {/* Condition checkboxes */}
          <div>
            <span className="label">{t('healthLog.results')}</span>

            <div className="space-y-2">
              {conditionRows.map((row, index) => {
                const isCustom = !row.conditionType;
                const conditionLabel = row.conditionType
                  ? t(`healthLog.conditions.${row.conditionType}`)
                  : '';

                return (
                  <div
                    key={row.conditionType ?? `custom-${index}`}
                    className="rounded-lg border border-stone-200 p-2.5"
                  >
                    {/* Checkbox + name row */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`condition-${row.conditionType ?? `custom-${index}`}`}
                        checked={row.checked}
                        onChange={() => toggleCondition(index)}
                        className="accent-indigo-600"
                      />
                      {isCustom ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            className="input text-sm flex-1"
                            placeholder={t('healthLog.customConditionPlaceholder')}
                            value={row.customCondition}
                            maxLength={200}
                            onChange={(e) =>
                              updateRow(index, {
                                customCondition: e.target.value,
                              })
                            }
                            aria-label={t('healthLog.addCustomCondition')}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm flex-shrink-0 p-1.5"
                            onClick={() => removeCustomRow(index)}
                            aria-label={t('common.delete')}
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor={`condition-${row.conditionType}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {conditionLabel}
                        </label>
                      )}
                    </div>

                    {/* Status + optional fields when checked */}
                    {row.checked && (
                      <div className="mt-2 ml-6 space-y-2">
                        {/* Status dropdown */}
                        <select
                          className="input text-sm"
                          value={row.status}
                          onChange={(e) =>
                            updateRow(index, { status: e.target.value })
                          }
                          aria-label={`${conditionLabel || row.customCondition} ${t('healthLog.selectStatus')}`}
                        >
                          <option value="">
                            {t('healthLog.selectStatus')}
                          </option>
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {t(`healthLog.status.${s.toLowerCase()}`)}
                            </option>
                          ))}
                        </select>

                        {/* Result value + reference range */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input text-sm flex-1"
                            placeholder={t('healthLog.resultValue')}
                            value={row.resultValue}
                            maxLength={200}
                            onChange={(e) =>
                              updateRow(index, {
                                resultValue: e.target.value,
                              })
                            }
                            aria-label={t('healthLog.resultValue')}
                          />
                          <input
                            type="text"
                            className="input text-sm flex-1"
                            placeholder={t('healthLog.referenceRange')}
                            value={row.referenceRange}
                            maxLength={200}
                            onChange={(e) =>
                              updateRow(index, {
                                referenceRange: e.target.value,
                              })
                            }
                            aria-label={t('healthLog.referenceRange')}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add custom condition button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm mt-2"
              onClick={addCustomCondition}
            >
              <span className="inline-flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                {t('healthLog.addCustomCondition')}
              </span>
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="label" htmlFor="visit-notes">
              {t('healthLog.notes')}
            </label>
            <textarea
              id="visit-notes"
              className="input"
              rows={3}
              value={notes}
              placeholder={t('healthLog.notesPlaceholder')}
              maxLength={5000}
              onChange={(e) => setNotes(e.target.value)}
            />
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
