import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { useHealthLogLabs, useCreateLab } from '../../hooks/useHealthLog';

interface LabPickerProps {
  selectedLabId: string | null;
  onSelect: (labId: string | null) => void;
  onCreateNew?: (lab: {
    provider: string;
    name: string;
    credentials: { key: string; value: string }[];
  }) => void;
}

const PROVIDERS = ['CHOPO', 'SALUD_DIGNA', 'OTHER'] as const;

interface CredentialField {
  key: string;
  value: string;
}

export function LabPicker({ selectedLabId, onSelect, onCreateNew }: LabPickerProps) {
  const { t } = useTranslation();
  const { data: labs, isLoading } = useHealthLogLabs();
  const createLabMutation = useCreateLab();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newProvider, setNewProvider] = useState<string>('OTHER');
  const [newName, setNewName] = useState('');
  const [credentials, setCredentials] = useState<CredentialField[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSelectChange = (value: string) => {
    if (value === '__new__') {
      setShowNewForm(true);
      onSelect(null);
    } else {
      setShowNewForm(false);
      onSelect(value || null);
    }
  };

  const addCredential = () => {
    setCredentials((prev) => [...prev, { key: '', value: '' }]);
  };

  const removeCredential = (index: number) => {
    setCredentials((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCredential = (index: number, field: Partial<CredentialField>) => {
    setCredentials((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...field } : c))
    );
  };

  const handleCreateLab = async () => {
    if (!newName.trim()) return;
    setError(null);

    const filteredCreds = credentials.filter(
      (c) => c.key.trim() && c.value.trim()
    );

    try {
      const created = await createLabMutation.mutateAsync({
        provider: newProvider,
        name: newName.trim(),
        credentials: filteredCreds.length > 0 ? filteredCreds : undefined,
      });

      onSelect(created.id);
      onCreateNew?.({
        provider: newProvider,
        name: newName.trim(),
        credentials: filteredCreds,
      });

      // Reset form
      setShowNewForm(false);
      setNewProvider('OTHER');
      setNewName('');
      setCredentials([]);
    } catch {
      setError(t('healthLog.errors.saveFailed'));
    }
  };

  return (
    <div className="space-y-3">
      {/* Lab select dropdown */}
      <div>
        <label className="label" htmlFor="lab-picker-select">
          {t('healthLog.lab')}
        </label>
        <select
          id="lab-picker-select"
          className="input"
          value={showNewForm ? '__new__' : selectedLabId ?? ''}
          onChange={(e) => handleSelectChange(e.target.value)}
          disabled={isLoading}
        >
          <option value="">{t('healthLog.labPicker.selectLab')}</option>
          {(labs ?? []).map((lab) => (
            <option key={lab.id} value={lab.id}>
              {lab.name} ({t(`healthLog.providers.${lab.provider}`)})
            </option>
          ))}
          <option value="__new__">{t('healthLog.labPicker.newLab')}</option>
        </select>
      </div>

      {/* Inline new lab form */}
      {showNewForm && (
        <div className="space-y-3 p-3 rounded-lg border border-stone-200 bg-stone-50">
          {/* Provider */}
          <div>
            <label className="label" htmlFor="lab-new-provider">
              {t('healthLog.labPicker.provider')}
            </label>
            <select
              id="lab-new-provider"
              className="input"
              value={newProvider}
              onChange={(e) => setNewProvider(e.target.value)}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {t(`healthLog.providers.${p}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="label" htmlFor="lab-new-name">
              {t('healthLog.labPicker.labName')}
            </label>
            <input
              id="lab-new-name"
              type="text"
              className="input"
              placeholder={t('healthLog.labPicker.labNamePlaceholder')}
              value={newName}
              maxLength={200}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          {/* Credentials */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label mb-0">
                {t('healthLog.labPicker.credentials')}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addCredential}
              >
                <span className="inline-flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('healthLog.labPicker.addCredential')}
                </span>
              </button>
            </div>

            {credentials.length > 0 && (
              <div className="space-y-2">
                {credentials.map((cred, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="input"
                      placeholder={t('healthLog.labPicker.credentialKeyPlaceholder')}
                      value={cred.key}
                      maxLength={100}
                      onChange={(e) =>
                        updateCredential(index, { key: e.target.value })
                      }
                      aria-label={t('healthLog.labPicker.credentialKey')}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder={t('healthLog.labPicker.credentialValue')}
                      value={cred.value}
                      maxLength={500}
                      onChange={(e) =>
                        updateCredential(index, { value: e.target.value })
                      }
                      aria-label={t('healthLog.labPicker.credentialValue')}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm flex-shrink-0 p-2"
                      onClick={() => removeCredential(index)}
                      aria-label={t('common.delete')}
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Save new lab button */}
          <button
            type="button"
            className="btn btn-primary btn-sm w-full"
            onClick={handleCreateLab}
            disabled={!newName.trim() || createLabMutation.isPending}
          >
            {createLabMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="spinner" aria-hidden="true" />
                {t('common.loading')}
              </span>
            ) : (
              t('common.save')
            )}
          </button>
        </div>
      )}
    </div>
  );
}
