import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, type HealthStatusRequest, type HealthStatus } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { queryClient } from '../queryClient';

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
  const { t } = useTranslation();
  const { session } = useAuth();
  const token = session?.access_token ?? '';

  const [form, setForm] = useState<HealthStatusRequest>({
    condition: '',
    status: 'unknown',
    testDate: '',
  });
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('health.title')}</h1>
        <p className="text-muted">{t('health.subtitle')}</p>
      </div>

      <div className="card card-elevated space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold">{t('health.reportStatus')}</h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsFormOpen((prev) => !prev)}
          >
            {isFormOpen ? t('common.close') : t('common.open')}
          </button>
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
              {reportMutation.isPending ? t('common.loading') : t('health.reportStatus')}
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
                  <p className="text-sm font-medium">{status.condition.toUpperCase()}</p>
                  <p className="text-xs text-muted">
                    {status.status} · {status.testDate ?? t('health.noTestDate')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => clearMutation.mutate(status.id)}>
                    {t('health.clear')}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => deleteMutation.mutate(status.id)}>
                    {t('common.delete')}
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
