import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, type HealthStatusRequest, type HealthStatus } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { queryClient } from '../queryClient';
import { DEV_MODE } from '../lib/devMode';
import { getConditionInfo } from '../lib/conditionInfo';
import { ExternalLink } from 'lucide-react';

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
    status: 'negative',
    testDate: '',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fillRandomStatus = () => {
    const randomCondition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
    const statuses: HealthStatusRequest['status'][] = ['positive', 'negative'];
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

  const exposureQuery = useQuery({
    queryKey: ['exposures'],
    queryFn: () => api.exposures.get(token),
    enabled: !!token,
  });

  const reportMutation = useMutation({
    mutationFn: (data: HealthStatusRequest) => api.health.report(token, data),
    onSuccess: () => {
      setMessage(t('health.statusUpdated'));
      setError(null);
      setForm({ condition: '', status: 'negative', testDate: '' });
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

  const statuses = listQuery.data ?? [];

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('health.title')}</h1>
        <p className="text-muted">{t('health.subtitle')}</p>
      </div>

      <div className="card card-elevated">
        <h3 className="font-semibold mb-2">{t('health.whatItMeans')}</h3>
        <p className="text-sm text-muted">{t('health.whatItMeansBody')}</p>
      </div>

      <div className="card card-elevated space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">{t('health.exposureOverview')}</h3>
            <p className="text-xs text-muted">{t('health.exposureHint')}</p>
          </div>
        </div>
        {exposureQuery.isLoading ? (
          <p className="text-sm text-muted">{t('common.loading')}</p>
        ) : (exposureQuery.data?.exposures?.length ?? 0) > 0 ? (
          <div className="space-y-2 text-sm">
            <p className="text-muted">{t('health.exposureDetected')}</p>
            {exposureQuery.data?.exposures?.slice(0, 3).map((item) => (
              <div key={item.condition} className="rounded-md border border-border-light bg-white/70 px-3 py-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  <a
                    className="inline-flex items-center gap-1 text-primary"
                    href={getConditionInfo(item.condition, i18n.language).url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.condition}
                    <ExternalLink className="nav-icon" aria-hidden="true" />
                  </a>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{t('health.exposureClosest', { degree: item.closestDegree })}</span>
                  <span>•</span>
                  <span>{t('health.exposureCases')} {item.count}</span>
                </div>
                <p className="text-xs text-muted">
                  {t(`dashboard.exposureStatusLabels.${item.status}`)} · {t(`dashboard.exposureTimeframe.${item.timeframe}`)}
                </p>
              </div>
            ))}
          </div>
        ) : exposureQuery.data?.message ? (
          <p className="text-sm text-muted">{t(exposureQuery.data.message)}</p>
        ) : (
          <p className="text-sm text-muted">{t('health.noExposure')}</p>
        )}
      </div>

      <div className="card card-elevated">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-semibold">{t('health.myResults')}</h3>
              <p className="text-xs text-muted">{t('health.myResultsSubtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
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
              className="btn btn-primary btn-sm"
              onClick={() => setIsFormOpen(true)}
            >
              {t('health.addResult')}
            </button>
          </div>
        </div>
        {statuses.length > 0 ? (
          <div className="space-y-3">
            {statuses.map((status: HealthStatus) => {
              const exposureMatch = exposureQuery.data?.exposures?.some(
                (item) => item.condition.toLowerCase() === status.condition.toLowerCase()
              );

              return (
                <div key={status.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <div className="health-row-header">
                      <a
                        className="health-condition-link"
                        href={getConditionInfo(status.condition, i18n.language).url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {status.condition.toUpperCase()}
                        <ExternalLink className="nav-icon" aria-hidden="true" />
                      </a>
                    </div>
                    {exposureMatch && (
                      <p className="text-xs text-muted">{t('health.exposureMatchNote')}</p>
                    )}
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
                      title={status.clearedAt ? t('health.clearedTooltip') : t('health.clearTooltip')}
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
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">{t('health.noStatus')}</p>
        )}
      </div>

      {isFormOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-semibold">{t('health.reportStatus')}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsFormOpen(false)}
              >
                {t('common.close')}
              </button>
            </div>
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
              <div className="grid gap-4">
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
          </div>
        </div>
      )}
    </div>
  );
}
