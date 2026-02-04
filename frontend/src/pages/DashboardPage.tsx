import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { DEV_MODE } from '../lib/devMode';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { getConditionInfo } from '../lib/conditionInfo';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [showStatus, setShowStatus] = useState(true);
  const [showExposureHelp, setShowExposureHelp] = useState(false);
  const { user, session } = useAuth();
  const { data: profile, isLoading, error } = useUser();
  const token = session?.access_token ?? '';

  const statsQuery = useQuery({
    queryKey: ['connections', 'stats'],
    queryFn: () => api.connections.stats(token),
    enabled: !!token,
  });

  const exposureQuery = useQuery({
    queryKey: ['exposures'],
    queryFn: () => api.exposures.get(token),
    enabled: !!token,
  });

  const healthQuery = useQuery({
    queryKey: ['health', 'list'],
    queryFn: () => api.health.list(token),
    enabled: !!token,
  });

  const hasPositiveStatus = (healthQuery.data ?? []).some(
    (status) => status.status === 'positive' && !status.clearedAt
  );

  const recomputeMutation = useMutation({
    mutationFn: () => api.exposures.recompute(token),
    onSuccess: (data) => {
      exposureQuery.refetch();
      if (DEV_MODE) {
        const exposureCount = data.exposures?.length ?? 0;
        console.info('[dev] Exposure recompute', {
          connectionCount: data.connectionCount,
          secondDegreeCount: data.secondDegreeCount,
          thirdDegreeCount: data.thirdDegreeCount,
          exposureCount,
        });
      }
    },
  });

  // Get display name or first part of email
  const displayName = profile?.displayName || user?.email?.split('@')[0] || '';

  const formatDegree = (degree: number) => {
    if (i18n.language.startsWith('es')) {
      return `${degree}º`;
    }
    const suffix = degree === 1 ? 'st' : degree === 2 ? 'nd' : degree === 3 ? 'rd' : 'th';
    return `${degree}${suffix}`;
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {t('dashboard.welcome')}, {displayName}
        </h1>
        <p className="text-muted text-lg">
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Card - Most Important */}
        <div className="card card-elevated">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                hasPositiveStatus ? 'bg-red-100' : 'bg-green-100'
              }`}
            >
              <svg
                className={`w-5 h-5 ${hasPositiveStatus ? 'text-red-600' : 'text-green-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{t('dashboard.exposureStatus')}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowStatus((prev) => !prev)}
                title={showStatus ? t('dashboard.hideStatus') : t('dashboard.showStatus')}
              >
                {showStatus ? (
                  <EyeOff className="nav-icon" aria-hidden="true" />
                ) : (
                  <Eye className="nav-icon" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          {!showStatus ? (
            <span className="badge badge-warning text-sm">{t('dashboard.statusHidden')}</span>
          ) : healthQuery.isLoading || exposureQuery.isLoading ? (
            <span className="badge badge-warning text-sm">{t('common.loading')}</span>
          ) : hasPositiveStatus ? (
            <span className="badge badge-error text-sm">{t('dashboard.selfPositive')}</span>
          ) : (exposureQuery.data?.exposures?.length ?? 0) > 0 ? (
            <div className="flex items-center gap-2">
              <span className="badge badge-warning text-sm">{t('dashboard.potentialExposure')}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowExposureHelp((prev) => !prev)}
                title={t('dashboard.exposureHelpTitle')}
              >
                <HelpCircle className="nav-icon" aria-hidden="true" />
              </button>
            </div>
          ) : exposureQuery.data?.message ? (
            <span className="badge badge-warning text-sm">{t(exposureQuery.data.message)}</span>
          ) : (
            <span className="badge badge-success text-sm">{t('dashboard.noExposure')}</span>
          )}
          {showExposureHelp && (
            <div className="mt-3 rounded-md border border-border-light bg-white/70 p-3 text-xs text-muted">
              <p className="font-semibold text-foreground mb-1">{t('dashboard.exposureHelpTitle')}</p>
              <p>{t('dashboard.exposureHelpBody')}</p>
            </div>
          )}
          {showStatus && (exposureQuery.data?.exposures?.length ?? 0) > 0 && (
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-xs text-muted">{t('dashboard.exposureSummary')}</p>
              <div className="space-y-2">
                {exposureQuery.data?.exposures?.slice(0, 3).map((item) => {
                  const info = getConditionInfo(item.condition, i18n.language);
                  return (
                    <div
                      key={item.condition}
                      className="rounded-md border border-border-light bg-white/70 px-3 py-3"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-foreground">
                        <span>{item.condition}</span>
                        <a
                          className="text-xs text-primary font-medium normal-case"
                          href={info.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('common.moreInfo')}
                        </a>
                      </div>
                      <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                        <div className="space-y-1">
                          <div className="text-muted">{t('dashboard.exposureLabelDegree')}</div>
                          <div className="font-medium">{formatDegree(item.closestDegree)}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted">{t('dashboard.exposureLabelCount')}</div>
                          <div className="font-medium">{item.count}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted">{t('dashboard.exposureLabelStatus')}</div>
                          <div className="font-medium">
                            {t(`dashboard.exposureStatusLabels.${item.status}`)} · {t(`dashboard.exposureTimeframe.${item.timeframe}`)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link to="/health" className="text-sm text-primary font-medium">
              {t('dashboard.viewHealthStatus')}
            </Link>
            {DEV_MODE && (
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={() => recomputeMutation.mutate()}
                disabled={recomputeMutation.isPending}
              >
                {recomputeMutation.isPending ? t('common.loading') : t('dashboard.recomputeExposure')}
              </button>
            )}
          </div>
          {DEV_MODE && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <div className="font-semibold mb-1">{t('dashboard.devExposureDebug')}</div>
              <div>{t('dashboard.devConnectionCount')}: {exposureQuery.data?.connectionCount ?? '—'}</div>
              <div>{t('dashboard.devSecondDegree')}: {exposureQuery.data?.secondDegreeCount ?? '—'}</div>
              <div>{t('dashboard.devThirdDegree')}: {exposureQuery.data?.thirdDegreeCount ?? '—'}</div>
              <div>{t('dashboard.devExposureCount')}: {exposureQuery.data?.exposures?.length ?? 0}</div>
            </div>
          )}
        </div>

        {/* Connections Card */}
        <div className="card card-elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold">{t('dashboard.connectionCount')}</h3>
          </div>
          <p className="text-4xl font-bold text-primary mb-1">
            {statsQuery.data?.confirmedCount ?? 0}
          </p>
          <p className="text-sm text-muted">{t('dashboard.connectionDescription')}</p>
          <div className="mt-3">
            <Link to="/connections" className="text-sm text-primary font-medium">
              {t('dashboard.manageConnections')}
            </Link>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card card-elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-semibold">{t('dashboard.yourProfile')}</h3>
          </div>
          {isLoading ? (
            <p className="text-muted">{t('common.loading')}</p>
          ) : error ? (
            <p className="text-error">{t('common.error')}</p>
          ) : profile ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted truncate">{profile.email}</p>
              {profile.displayName && (
                <p className="font-medium">{profile.displayName}</p>
              )}
              {profile.username && (
                <p className="text-muted text-xs">@{profile.username}</p>
              )}
              {profile.showAge && profile.age !== undefined && (
                <p className="text-muted text-xs">{t('profile.age', { age: profile.age })}</p>
              )}
              {(profile.country || profile.location) && (
                <p className="text-muted text-xs">
                  {[profile.location, profile.country].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="pt-2">
                <Link to="/profile" className="text-sm text-primary font-medium">
                  {t('dashboard.editProfile')}
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-muted">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
