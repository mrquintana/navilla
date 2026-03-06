import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLabProviders } from '../../hooks/useLabProviders';
import { useLabVerify, useLabConfirm } from '../../hooks/useLabVerification';
import type { LabProviderConfig, LabVerifyResponse } from '../../types/lab';

interface LabVerificationModalProps {
  visitId: string;
  onClose: () => void;
  onVerified: () => void;
}

type Step = 'select' | 'credentials' | 'results';

export function LabVerificationModal({ visitId, onClose, onVerified }: LabVerificationModalProps) {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language.startsWith('es');

  const [step, setStep] = useState<Step>('select');
  const [selectedProvider, setSelectedProvider] = useState<LabProviderConfig | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [verifyResult, setVerifyResult] = useState<LabVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: providers, isLoading: providersLoading } = useLabProviders();
  const verifyMutation = useLabVerify();
  const confirmMutation = useLabConfirm();

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleSelectProvider = (provider: LabProviderConfig) => {
    setSelectedProvider(provider);
    setCredentials({});
    setError(null);
    setStep('credentials');
  };

  const handleVerify = async () => {
    if (!selectedProvider) return;
    setError(null);

    try {
      const result = await verifyMutation.mutateAsync({
        visitId,
        labCode: selectedProvider.code,
        visitCredentials: credentials,
      });

      if (result.success && result.results) {
        setVerifyResult(result);
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
    try {
      await confirmMutation.mutateAsync({ visitId });
      onVerified();
      onClose();
    } catch {
      setError(t('labVerification.errorGeneric'));
    }
  };

  const handleBack = () => {
    if (step === 'credentials') {
      setSelectedProvider(null);
      setStep('select');
    } else if (step === 'results') {
      setStep('credentials');
    }
  };

  const modal = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t('labVerification.title')}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal overflow-y-auto" style={{ maxWidth: '32rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('labVerification.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--color-secondary)]"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-lg text-sm"
            style={{ backgroundColor: 'rgba(220, 53, 69, 0.08)', color: 'var(--color-error)' }}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step: Select Lab */}
        {step === 'select' && (
          <div className="space-y-3">
            <p className="text-sm text-muted">{t('labVerification.selectLab')}</p>
            {providersLoading ? (
              <div className="flex justify-center py-8">
                <span className="spinner" aria-label={t('common.loading')} />
              </div>
            ) : !providers || providers.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">{t('labVerification.noProviders')}</p>
            ) : (
              <div className="space-y-2">
                {providers.map((provider) => (
                  <button
                    key={provider.code}
                    type="button"
                    className="w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors hover:bg-[var(--color-secondary)]"
                    style={{ borderColor: 'var(--color-border)' }}
                    onClick={() => handleSelectProvider(provider)}
                  >
                    <span className="font-medium text-sm">
                      {isEs ? provider.nameEs : provider.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                {t('labVerification.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Step: Credentials */}
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

        {/* Step: Results */}
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
    </div>
  );

  return createPortal(modal, document.body);
}
