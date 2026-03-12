import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, type HealthStatusRequest, type HealthStatus } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser';
import { queryClient } from '../queryClient';
import { DEV_MODE } from '../lib/devMode';
import { getConditionInfo } from '../lib/conditionInfo';
import { sortExposureItems, getExposureBorderStyle } from '../lib/exposureSort';
import { ExternalLink, HelpCircle, Plus, Trash2 } from 'lucide-react';
import { PageSkeleton, SkeletonBlock, SkeletonRows } from '../components/ui/LoadingShell';

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
  const { data: userProfile } = useUser();

  const dobMin = userProfile?.dateOfBirth ?? undefined;
  const todayMax = new Date().toISOString().split('T')[0];
  const [pendingHealthId, setPendingHealthId] = useState<string | null>(null);
  const [pendingHealthAction, setPendingHealthAction] = useState<'clear' | 'activate' | 'delete' | null>(null);

  const [form, setForm] = useState<HealthStatusRequest>({
    condition: '',
    status: 'negative',
    testDate: '',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showAllExposures, setShowAllExposures] = useState(false);
  const [showResultsInfo, setShowResultsInfo] = useState(false);
  const [showExposureInfo, setShowExposureInfo] = useState(false);
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
    onError: (err: Error) => {
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

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.health.activate(token, id),
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

  const runHealthAction = async (id: string, action: 'clear' | 'activate' | 'delete') => {
    setPendingHealthId(id);
    setPendingHealthAction(action);
    try {
      if (action === 'clear') {
        await clearMutation.mutateAsync(id);
      } else if (action === 'activate') {
        await activateMutation.mutateAsync(id);
      } else {
        await deleteMutation.mutateAsync(id);
      }
    } finally {
      setPendingHealthId(null);
      setPendingHealthAction(null);
    }
  };

  const statuses = listQuery.data ?? [];
  const latestStatus = statuses[0];
  const activePositives = statuses.filter((status) => status.status === 'positive' && !status.clearedAt);
  const exposureItems = sortExposureItems(exposureQuery.data?.exposures ?? []);
  const listInitialLoading = listQuery.isLoading && !listQuery.data;
  const exposureInitialLoading = exposureQuery.isLoading && !exposureQuery.data;
  const isInitialLoading = listInitialLoading && exposureInitialLoading;

  const renderWithBold = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (isInitialLoading) {
    return (
      <PageSkeleton loadingLabel={t('common.loading')}>
        <SkeletonBlock className="h-20 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="card card-elevated space-y-4">
            <SkeletonBlock className="h-5 w-56 rounded-full" />
            <SkeletonRows rows={4} />
          </div>
          <div className="card card-elevated space-y-4">
            <SkeletonBlock className="h-5 w-48 rounded-full" />
            <SkeletonRows rows={4} />
          </div>
        </div>
      </PageSkeleton>
    );
  }

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

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card card-elevated space-y-4">
          <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">{t('health.myResults')}</h3>
            <p className="text-xs text-muted">{t('health.myResultsSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowResultsInfo(true)}
              title={t('health.moreInfoTitle')}
            >
              <HelpCircle className="nav-icon" aria-hidden="true" />
            </button>
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
                <span className="inline-flex items-center gap-1">
                  <Plus className="nav-icon" aria-hidden="true" />
                  {t('health.addResult')}
                </span>
              </button>
            </div>
          </div>
          <div className="grid gap-2 text-xs text-muted sm:grid-cols-3">
            <div>
              <span className="block text-xs text-muted">{t('health.totalReports')}</span>
              <span className="text-sm font-semibold text-foreground">{statuses.length}</span>
            </div>
            <div>
              <span className="block text-xs text-muted">{t('health.activePositives')}</span>
              <span className="text-sm font-semibold text-foreground">{activePositives.length}</span>
            </div>
            <div>
              <span className="block text-xs text-muted">{t('health.lastReport')}</span>
              <span className="text-sm font-semibold text-foreground">
                {latestStatus ? new Date(latestStatus.reportedAt).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
          {statuses.length > 0 ? (
            <div className="space-y-3 pt-2">
              {statuses.map((status: HealthStatus) => {
                const exposureMatch = exposureItems.some(
                  (item) => item.condition.toLowerCase() === status.condition.toLowerCase()
                );

                return (
                  <div key={status.id} className="health-row-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span
                          className={`badge text-xs ${
                            status.clearedAt
                              ? 'badge-warning'
                              : status.status === 'positive'
                                ? 'badge-error'
                                : 'badge-info'
                          }`}
                        >
                          {status.clearedAt
                            ? t('health.cleared')
                            : status.status === 'positive'
                              ? t('health.statusPositive')
                              : t('health.statusNegative')}
                        </span>
                        <span>·</span>
                        <span>
                          {status.clearedAt
                            ? `${t('health.clearedOn')} ${new Date(status.clearedAt).toLocaleDateString()}`
                            : status.testDate ?? t('health.noTestDate')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => runHealthAction(status.id, status.clearedAt ? 'activate' : 'clear')}
                        disabled={pendingHealthId === status.id
                          && (pendingHealthAction === 'clear' || pendingHealthAction === 'activate')}
                        title={status.clearedAt ? t('health.activateTooltip') : t('health.clearTooltip')}
                      >
                        {pendingHealthId === status.id
                        && (pendingHealthAction === 'clear' || pendingHealthAction === 'activate') ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="spinner" aria-hidden="true" />
                            {t('common.loading')}
                          </span>
                        ) : status.clearedAt ? t('health.markActive') : t('health.clear')}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => runHealthAction(status.id, 'delete')}
                        disabled={pendingHealthId === status.id && pendingHealthAction === 'delete'}
                        title={t('health.deleteTooltip')}
                        aria-label={t('health.deleteTooltip')}
                      >
                        {pendingHealthId === status.id && pendingHealthAction === 'delete' ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="spinner" aria-hidden="true" />
                            {t('common.loading')}
                          </span>
                        ) : (
                          <Trash2 className="nav-icon" aria-hidden="true" />
                        )}
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

        <div className="card card-elevated space-y-3">
          <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">{t('health.exposureOverview')}</h3>
            <p className="text-xs text-muted">{t('health.exposureHint')}</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowExposureInfo(true)}
            title={t('health.moreInfoTitle')}
          >
            <HelpCircle className="nav-icon" aria-hidden="true" />
          </button>
        </div>
          {exposureInitialLoading ? (
            <div role="status" aria-live="polite">
              <span className="sr-only">{t('common.loading')}</span>
              <SkeletonRows rows={4} />
            </div>
          ) : exposureItems.length > 0 ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{t('health.exposureDetected')}</span>
                <span>{t('health.exposureUpdatedAt')} {exposureQuery.data?.computedAt
                  ? new Date(exposureQuery.data.computedAt).toLocaleDateString()
                  : '—'}</span>
              </div>
              {(showAllExposures ? exposureItems : exposureItems.slice(0, 6)).map((item) => (
                <div key={item.condition} className="exposure-item" style={getExposureBorderStyle(item)}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    <a
                      className="health-condition-link"
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
                  <p
                    className="text-xs text-muted cursor-help"
                    title={`${t(`dashboard.exposureStatusHint.${item.status}`)} · ${t(`dashboard.exposureTimeframeHint.${item.timeframe}`)}`}
                  >
                    {t(`dashboard.exposureStatusLabels.${item.status}`)} · {t(`dashboard.exposureTimeframe.${item.timeframe}`)}
                  </p>
                </div>
              ))}
              {exposureItems.length > 6 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAllExposures((prev) => !prev)}
                >
                  {showAllExposures ? t('health.showLess') : t('health.showAll')}
                </button>
              )}
            </div>
          ) : exposureQuery.data?.message ? (
            <p className="text-sm text-muted">{t(exposureQuery.data.message)}</p>
          ) : (
            <p className="text-sm text-muted">{t('health.noExposure')}</p>
          )}
        </div>
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
                const testDate = form.testDate?.trim() || undefined;
                if (testDate) {
                  if (dobMin && testDate < dobMin) {
                    setError(t('health.testDateBeforeDob'));
                    return;
                  }
                  if (testDate > todayMax) {
                    setError(t('health.testDateInFuture'));
                    return;
                  }
                }
                const cleaned: HealthStatusRequest = { ...form, testDate };
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
                    min={dobMin}
                    max={todayMax}
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

      {showResultsInfo && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-semibold">{t('health.myResults')}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowResultsInfo(false)}
              >
                {t('common.close')}
              </button>
            </div>
            <p className="text-sm text-muted">{renderWithBold(t('health.myResultsInfo'))}</p>
          </div>
        </div>
      )}

      {showExposureInfo && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-semibold">{t('health.exposureOverview')}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowExposureInfo(false)}
              >
                {t('common.close')}
              </button>
            </div>
            <p className="text-sm text-muted">{renderWithBold(t('health.exposureInfo'))}</p>
          </div>
        </div>
      )}
    </div>
  );
}
