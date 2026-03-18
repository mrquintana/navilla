import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, FlaskConical, PenLine, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import {
  useCreateTestVisit,
  useUpdateTestVisit,
} from '../../hooks/useHealthLog';
import { useConditionCatalog } from '../../hooks/useCatalog';
import { useLabProviders } from '../../hooks/useLabProviders';
import { useLabVerify, useLabConfirm } from '../../hooks/useLabVerification';
import type { TestVisit, TestResultInput } from '../../lib/api';
import type { LabProviderConfig, LabVerifyResponse } from '../../types/lab';
import { LabPicker } from './LabPicker';

interface TestVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  editVisit?: TestVisit | null;
}

/** Fallback conditions used when the catalog has not loaded yet */
const FALLBACK_CONDITIONS = [
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

type ModalPath = 'chooser' | 'lab' | 'manual';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function buildInitialRows(conditions: readonly string[], editVisit?: TestVisit | null): ConditionRow[] {
  const rows: ConditionRow[] = conditions.map((ct) => {
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
  const { data: catalogConditions } = useConditionCatalog();

  // Derive condition codes from catalog, falling back to hardcoded list
  const conditionCodes = useMemo(() => {
    if (catalogConditions && catalogConditions.length > 0) {
      return catalogConditions
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((c) => c.code);
    }
    return [...FALLBACK_CONDITIONS];
  }, [catalogConditions]);

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
      conditionCodes={conditionCodes}
    />
  );
}

interface TestVisitFormProps {
  editVisit?: TestVisit | null;
  onClose: () => void;
  conditionCodes: string[];
}

function TestVisitForm({ editVisit, onClose, conditionCodes }: TestVisitFormProps) {
  const { t } = useTranslation();
  const isEditMode = !!editVisit;

  // Edit mode skips chooser, goes straight to manual
  const [path, setPath] = useState<ModalPath>(isEditMode ? 'manual' : 'chooser');

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
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

        {path === 'chooser' && (
          <PathChooser onSelect={setPath} />
        )}

        {path === 'lab' && (
          <LabVerifyFlow
            onClose={onClose}
            onBack={() => setPath('chooser')}
          />
        )}

        {path === 'manual' && (
          <ManualEntryForm
            editVisit={editVisit}
            onClose={onClose}
            conditionCodes={conditionCodes}
            onBack={isEditMode ? undefined : () => setPath('chooser')}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Path Chooser ──────────────────────────────────────────────── */

function PathChooser({ onSelect }: { onSelect: (path: ModalPath) => void }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t('healthLog.pathChooser.title')}</p>

      <button
        type="button"
        className="w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors hover:bg-[var(--color-secondary)]"
        style={{ borderColor: 'var(--color-border)' }}
        onClick={() => onSelect('lab')}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 shrink-0">
          <FlaskConical className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm block">
            {t('healthLog.pathChooser.labConnect')}
          </span>
          <span className="text-xs text-muted">
            {t('healthLog.pathChooser.labConnectDescription')}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted shrink-0" />
      </button>

      <button
        type="button"
        className="w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors hover:bg-[var(--color-secondary)]"
        style={{ borderColor: 'var(--color-border)' }}
        onClick={() => onSelect('manual')}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-stone-100 shrink-0">
          <PenLine className="w-5 h-5 text-stone-600" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm block">
            {t('healthLog.pathChooser.manualEntry')}
          </span>
          <span className="text-xs text-muted">
            {t('healthLog.pathChooser.manualEntryDescription')}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted shrink-0" />
      </button>
    </div>
  );
}

/* ─── Lab Verify Flow (inline) ──────────────────────────────────── */

type LabStep = 'date-provider' | 'credentials' | 'results';

function LabVerifyFlow({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language.startsWith('es');
  const { data: userProfile } = useUser();

  const [step, setStep] = useState<LabStep>('date-provider');
  const [testDate, setTestDate] = useState(todayISO());
  const [selectedProvider, setSelectedProvider] = useState<LabProviderConfig | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [verifyResult, setVerifyResult] = useState<LabVerifyResponse | null>(null);
  const [resolvedVisitId, setResolvedVisitId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');

  const { data: providers, isLoading: providersLoading } = useLabProviders();
  const verifyMutation = useLabVerify();
  const confirmMutation = useLabConfirm();

  const dateOfBirth = userProfile?.dateOfBirth;

  const handleVerify = async () => {
    if (!selectedProvider) return;
    setError(null);

    try {
      const result = await verifyMutation.mutateAsync({
        testDate,
        labCode: selectedProvider.code,
        visitCredentials: credentials,
      });

      if (result.success && result.results) {
        setVerifyResult(result);
        if (result.visitId) setResolvedVisitId(result.visitId);
        setStep('results');
      } else {
        const errorKey = result.errorCode === 'ORDER_NOT_FOUND'
          ? 'labVerification.errorNotFound'
          : result.errorCode === 'CONNECTION_ERROR'
            ? 'labVerification.errorConnection'
            : 'labVerification.errorGeneric';
        setError(t(errorKey));
      }
    } catch {
      setError(t('labVerification.errorGeneric'));
    }
  };

  const handleConfirm = async () => {
    if (!resolvedVisitId) return;
    try {
      await confirmMutation.mutateAsync({
        visitId: resolvedVisitId,
        notes: confirmNotes.trim() || undefined,
      });
      onClose();
    } catch {
      setError(t('labVerification.errorGeneric'));
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 'credentials') {
      setStep('date-provider');
    } else if (step === 'results') {
      setStep('credentials');
    } else {
      onBack();
    }
  };

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg text-sm"
          style={{ backgroundColor: 'rgba(220, 53, 69, 0.08)', color: 'var(--color-error)' }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Date + Provider */}
      {step === 'date-provider' && (
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="lab-visit-date">
              {t('healthLog.date')}
            </label>
            <input
              id="lab-visit-date"
              type="date"
              className="input"
              value={testDate}
              min={dateOfBirth || undefined}
              max={todayISO()}
              onChange={(e) => setTestDate(e.target.value)}
              required
            />
          </div>

          <div>
            <span className="label">{t('labVerification.selectLab')}</span>
            {providersLoading ? (
              <div className="flex justify-center py-6">
                <span className="spinner" aria-label={t('common.loading')} />
              </div>
            ) : !providers || providers.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">{t('labVerification.noProviders')}</p>
            ) : (
              <div className="space-y-2">
                {providers.map((provider) => (
                  <button
                    key={provider.code}
                    type="button"
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
                      selectedProvider?.code === provider.code
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'hover:bg-[var(--color-secondary)]'
                    }`}
                    style={selectedProvider?.code !== provider.code ? { borderColor: 'var(--color-border)' } : undefined}
                    onClick={() => {
                      setSelectedProvider(provider);
                      setCredentials({});
                    }}
                  >
                    <span className="font-medium text-sm">
                      {isEs ? provider.nameEs : provider.name}
                    </span>
                    {selectedProvider?.code === provider.code ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleBack}>
              {t('labVerification.back')}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!selectedProvider || !testDate}
              onClick={() => setStep('credentials')}
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Credentials */}
      {step === 'credentials' && selectedProvider && (
        <div className="space-y-4">
          <p className="text-sm text-muted">{t('labVerification.enterCredentials')}</p>
          <div className="space-y-3">
            {selectedProvider.requiredFields.map((field) => (
              <div key={field.key}>
                <label htmlFor={`lab-field-${field.key}`} className="block text-sm font-medium mb-1">
                  {isEs ? field.labelEs : field.label}
                </label>
                <input
                  id={`lab-field-${field.key}`}
                  type="text"
                  className="input w-full"
                  maxLength={200}
                  value={credentials[field.key] ?? ''}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleBack}>
              {t('labVerification.back')}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleVerify}
              disabled={verifyMutation.isPending || selectedProvider.requiredFields.some((f) => !credentials[f.key]?.trim())}
            >
              {verifyMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner spinner-sm" />
                  {t('labVerification.verifying')}
                </span>
              ) : (
                t('labVerification.title')
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results review */}
      {step === 'results' && verifyResult?.results && (
        <div className="space-y-4">
          <p className="text-sm text-muted">{t('labVerification.reviewResults')}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="text-left py-2 pr-3 font-medium">{t('labVerification.condition')}</th>
                  <th className="text-left py-2 pr-3 font-medium">{t('labVerification.result')}</th>
                  <th className="text-left py-2 font-medium">{t('labVerification.testDate')}</th>
                </tr>
              </thead>
              <tbody>
                {verifyResult.results.map((r, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                    <td className="py-2 pr-3">{r.conditionCode}</td>
                    <td className="py-2 pr-3">
                      <span className={`inline-flex items-center gap-1 ${
                        r.result === 'NEGATIVE' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                      }`}>
                        {r.result === 'NEGATIVE' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {r.result === 'NEGATIVE'
                          ? t('labVerification.resultNegative')
                          : t('labVerification.resultPositive')}
                      </span>
                    </td>
                    <td className="py-2">{new Date(r.testDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {verifyResult.results[0]?.patientName && (
            <p className="text-xs text-muted">
              {t('labVerification.patientName')}: {verifyResult.results[0].patientName}
            </p>
          )}

          {/* Impact summary */}
          <div
            className="rounded-lg p-3 space-y-1"
            style={{ backgroundColor: 'rgba(79, 70, 229, 0.06)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
              {t('labVerification.impactSummary')}
            </p>
            {verifyResult.results.map((r, i) => (
              <p key={i} className="text-xs text-muted">
                {t('labVerification.willBeUpdated', {
                  condition: r.conditionCode,
                  status: r.result === 'NEGATIVE'
                    ? t('labVerification.resultNegative')
                    : t('labVerification.resultPositive'),
                })}
              </p>
            ))}
          </div>

          {/* Notes textarea */}
          <div>
            <label className="label" htmlFor="lab-confirm-notes">
              {t('healthLog.notes')}
            </label>
            <textarea
              id="lab-confirm-notes"
              className="input w-full"
              rows={2}
              value={confirmNotes}
              placeholder={t('labVerification.notesPlaceholder')}
              maxLength={5000}
              onChange={(e) => setConfirmNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleBack}>
              {t('labVerification.back')}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner spinner-sm" />
                  {t('labVerification.confirmResults')}
                </span>
              ) : (
                t('labVerification.confirmResults')
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Manual Entry Form (original, unchanged logic) ─────────────── */

interface ManualEntryFormProps {
  editVisit?: TestVisit | null;
  onClose: () => void;
  conditionCodes: string[];
  onBack?: () => void;
}

function ManualEntryForm({ editVisit, onClose, conditionCodes, onBack }: ManualEntryFormProps) {
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
    () => buildInitialRows(conditionCodes, editVisit)
  );
  const [error, setError] = useState<string | null>(null);

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
                        className="btn btn-secondary btn-sm flex-shrink-0 p-2"
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
      <div className="flex items-center justify-between pt-2">
        {onBack ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onBack}
            disabled={isPending}
          >
            {t('labVerification.back')}
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
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
      </div>
    </form>
  );
}
