import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { DEV_MODE } from '../lib/devMode';
import { Eye, EyeOff, HelpCircle, ExternalLink, Mail, MapPin, Shield, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getConditionInfo } from '../lib/conditionInfo';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [showSnapshotNotice, setShowSnapshotNotice] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('navilla_hide_snapshot_notice') === 'true';
    if (dismissed) {
      setShowSnapshotNotice(false);
    }
  }, []);
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
  const profileName = profile?.displayName || profile?.fullName || profile?.username || profile?.email || '—';
  const profileSubtitle = profile?.username
    ? `@${profile.username}`
    : profile?.email;
  const visibilityKey = profile?.profileVisibility?.toLowerCase() || '';
  const visibilityLabel = visibilityKey === 'public'
    ? t('profile.visibilityPublic')
    : visibilityKey === 'connections'
      ? t('profile.visibilityConnections')
      : visibilityKey === 'private'
        ? t('profile.visibilityPrivate')
        : '—';
  const avatarUrl = profile?.avatarThumbUrl || profile?.avatarUrl;
  const avatarInitials = profileName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

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

      {showSnapshotNotice && (
        <div className="card card-elevated mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">{t('dashboard.snapshotTitle')}</h3>
              <p className="text-sm text-muted">{t('dashboard.snapshotBody')}</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setShowSnapshotNotice(false);
                localStorage.setItem('navilla_hide_snapshot_notice', 'true');
              }}
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Card - Most Important */}
        <div className="card card-elevated dashboard-card">
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
              <h3 className="profile-card-title">{t('dashboard.exposureStatus')}</h3>
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
                      className="exposure-item"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-foreground">
                        <a
                          className="health-condition-link"
                          href={info.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.condition}
                          <ExternalLink className="nav-icon" aria-hidden="true" />
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
                          <div
                            className="font-medium cursor-help"
                            title={`${t(`dashboard.exposureStatusHint.${item.status}`)} · ${t(`dashboard.exposureTimeframeHint.${item.timeframe}`)}`}
                          >
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
        <div className="card card-elevated dashboard-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="profile-card-title">{t('dashboard.connectionCount')}</h3>
          </div>
          <p className="text-4xl font-bold text-primary mb-1">
            {statsQuery.data?.confirmedCount ?? 0}
          </p>
          <p className="text-sm text-muted">{t('dashboard.connectionDescription')}</p>
          {(statsQuery.data?.confirmedCount ?? 0) < 3 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${((statsQuery.data?.confirmedCount ?? 0) / 3) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted whitespace-nowrap">
                  {statsQuery.data?.confirmedCount ?? 0} / 3
                </span>
              </div>
              <p className="text-xs text-muted">
                {t('dashboard.thresholdMessage', { current: statsQuery.data?.confirmedCount ?? 0, needed: 3 })}
              </p>
            </div>
          )}
          <div className="mt-3 text-sm text-muted space-y-1">
            <div className="flex items-center justify-between">
              <span>{t('dashboard.networkSize')}</span>
              <span className="font-semibold text-foreground">
                {exposureQuery.data?.totalGraphNodes ?? '—'}
              </span>
            </div>
            <p className="text-xs text-muted">
              {t('dashboard.networkSizeHint', { depth: exposureQuery.data?.maxDepth ?? 5 })}
              {' '}
              <Link to="/how-it-works#network-size-explainer" className="text-primary font-medium">
                {t('dashboard.networkSizeHelpLink')}
              </Link>
            </p>
          </div>
          <div className="mt-3">
            <Link to="/connections" className="text-sm text-primary font-medium">
              {t('dashboard.manageConnections')}
            </Link>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card card-elevated profile-card">
          <div className="profile-card-header">
            <div className="profile-card-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={t('profile.avatarAlt')} />
              ) : (
                <span className="profile-card-initials">{avatarInitials || 'N'}</span>
              )}
            </div>
            <div className="profile-card-heading">
              <p className="profile-card-title">{t('dashboard.yourProfile')}</p>
              <h3 className="profile-card-name">{profileName}</h3>
              {profileSubtitle && <p className="profile-card-subtitle">{profileSubtitle}</p>}
            </div>
            <div className="profile-card-actions">
              <Link to="/profile" className="btn btn-secondary btn-sm">
                {t('dashboard.editProfile')}
              </Link>
            </div>
          </div>
          {isLoading ? (
            <p className="text-muted">{t('common.loading')}</p>
          ) : error ? (
            <p className="text-error">{t('common.error')}</p>
          ) : profile ? (
            <div className="profile-card-details">
              <div className="profile-detail">
                <Mail className="profile-detail-icon" aria-hidden="true" />
                <div>
                  <p className="profile-detail-label">{t('auth.email')}</p>
                  <p className="profile-detail-value">{profile.email}</p>
                </div>
              </div>
              {(profile.location || profile.country) && (
                <div className="profile-detail">
                  <MapPin className="profile-detail-icon" aria-hidden="true" />
                  <div>
                    <p className="profile-detail-label">{t('auth.location')}</p>
                    <p className="profile-detail-value">
                      {[profile.location, profile.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
              <div className="profile-detail">
                <Shield className="profile-detail-icon" aria-hidden="true" />
                <div>
                  <p className="profile-detail-label">{t('profile.visibility')}</p>
                  <p className="profile-detail-value">{visibilityLabel}</p>
                </div>
              </div>
              {profile.showAge && profile.age !== undefined && (
                <div className="profile-detail">
                  <Calendar className="profile-detail-icon" aria-hidden="true" />
                  <div>
                    <p className="profile-detail-label">{t('profile.ageLabel')}</p>
                    <p className="profile-detail-value">{t('profile.age', { age: profile.age })}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
