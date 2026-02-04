import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, type HealthStatusRequest, type HealthStatus } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { queryClient } from '../queryClient';
import { DEV_MODE } from '../lib/devMode';
import { getConditionInfo } from '../lib/conditionInfo';

const CONDITIONS = [
  'chlamydia',
  'gonorrhea',
  'syphilis',
  'hiv',
  'hsv1',
  'hsv2',
  'hpv',
  'hepatitis_b',
  'hepatitis_c',
  'trichomoniasis',
];

export function HealthStatusPage() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const token = session?.access_token ?? '';
  const [pendingHealthId, setPendingHealthId] = useState<string | null>(null);
  const [pendingHealthAction, setPendingHealthAction] = useState<'clear' | 'delete' | null>(null);

  const [form, setForm] = useState<HealthStatusRequest>({
    condition: '',
    status: 'unknown',
    testDate: '',
  });
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fillRandomStatus = () => {
    const randomCondition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
    const statuses: HealthStatusRequest['status'][] = ['positive', 'negative', 'unknown'];
    setForm({
      condition: randomCondition,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      testDate: `202${Math.floor(Math.random() * 4)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
    });
    setIsFormOpen(true);
  };

  const listQuery = useQuery({
    queryKey: ['health', 'list'],
    queryFn: () => api.health.list(token),
    enabled: !!token,
  });

  const reportMutation = useMutation({
    mutationFn: (data: HealthStatusRequest) => api.health.report(token, data),
    onSuccess: () => {
      setMessage(t('health.statusUpdated'));
      setError(null);
      setForm({ condition: '', status: 'unknown', testDate: '' });
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['health'] });
    },
    onError: (err: any) => {
      setError(err.message || t('common.error'));
      setMessage(null);
    },
  });

  const clearMutation = useMutation({
    mutationFn: (id: string) => api.health.clear(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.health.delete(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
    },
  });

  const runHealthAction = async (id: string, action: 'clear' | 'delete') => {
    setPendingHealthId(id);
    setPendingHealthAction(action);
    try {
      if (action === 'clear') {
        await clearMutation.mutateAsync(id);
      } else {
        await deleteMutation.mutateAsync(id);
      }
    } finally {
      setPendingHealthId(null);
      setPendingHealthAction(null);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('health.title')}</h1>
        <p className="text-muted">{t('health.subtitle')}</p>
      </div>

      <div className="card card-elevated space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold">{t('health.reportStatus')}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {DEV_MODE && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={fillRandomStatus}
              >
                {t('common.fillRandom')}
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsFormOpen((prev) => !prev)}
            >
              {isFormOpen ? t('common.close') : t('common.open')}
            </button>
          </div>
        </div>

        {isFormOpen && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const cleaned: HealthStatusRequest = {
                ...form,
                testDate: form.testDate?.trim() || undefined,
              };
              setForm(cleaned);
              reportMutation.mutate(cleaned);
            }}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="label">{t('health.condition')}</label>
                <select
                  className="input"
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  required
                >
                  <option value="">{t('common.select')}</option>
                  {CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">{t('health.status')}</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="positive">{t('health.statusPositive')}</option>
                  <option value="negative">{t('health.statusNegative')}</option>
                  <option value="unknown">{t('health.statusUnknown')}</option>
                </select>
              </div>

              <div>
                <label className="label">{t('health.testDate')}</label>
                <input
                  type="date"
                  className="input"
                  value={form.testDate ?? ''}
                  onChange={(e) => setForm({ ...form, testDate: e.target.value })}
                />
              </div>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <button className="btn btn-primary" type="submit" disabled={reportMutation.isPending}>
              {reportMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner" aria-hidden="true" />
                  {t('common.loading')}
                </span>
              ) : t('health.reportStatus')}
            </button>
          </form>
        )}
      </div>

      <div className="card card-elevated">
        <h3 className="font-semibold mb-4">{t('health.currentStatus')}</h3>
        {listQuery.data && listQuery.data.length > 0 ? (
          <div className="space-y-3">
            {listQuery.data.map((status: HealthStatus) => (
              <div key={status.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{status.condition.toUpperCase()}</p>
                    <a
                      className="text-xs text-primary font-medium"
                      href={getConditionInfo(status.condition, i18n.language).url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('common.moreInfo')}
                    </a>
                  </div>
                  <p className="text-xs text-muted">
                    {status.status} · {status.testDate ?? t('health.noTestDate')}
                  </p>
                  {status.clearedAt && (
                    <p className="text-xs text-muted">
                      {t('health.clearedOn')} {new Date(status.clearedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => runHealthAction(status.id, 'clear')}
                    disabled={status.clearedAt != null
                      || (pendingHealthId === status.id && pendingHealthAction === 'clear')}
                    title={status.clearedAt ? t('health.cleared') : t('health.clear')}
                  >
                    {pendingHealthId === status.id && pendingHealthAction === 'clear' ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="spinner" aria-hidden="true" />
                        {t('common.loading')}
                      </span>
                    ) : status.clearedAt ? t('health.cleared') : t('health.clear')}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => runHealthAction(status.id, 'delete')}
                    disabled={pendingHealthId === status.id && pendingHealthAction === 'delete'}
                  >
                    {pendingHealthId === status.id && pendingHealthAction === 'delete' ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="spinner" aria-hidden="true" />
                        {t('common.loading')}
                      </span>
                    ) : t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{t('health.noStatus')}</p>
        )}
      </div>
    </div>
  );
}
