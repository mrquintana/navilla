import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { DEV_MODE } from '../lib/devMode';
import { HelpCircle, ExternalLink, Heart, BookOpen, Users, BarChart3, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getConditionInfo } from '../lib/conditionInfo';
import { sortExposureItems, getUrgencyConfig, getExposureCardStyle } from '../lib/exposureSort';
import { PageSkeleton, SkeletonBlock } from '../components/ui/LoadingShell';
import { UpcomingReminders } from '../components/reminders/UpcomingReminders';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { useReciprocityStatus } from '../hooks/useReciprocity';
import { ReciprocityOptInCard } from '../components/reciprocity/ReciprocityOptInCard';
import { useNetworkVisualization } from '../hooks/useNetworkVisualization';
import { useNetworkHealth } from '../hooks/useNetworkHealth';
import { NetworkVisualizationHost } from '../components/network/NetworkVisualizationHost';
import { NetworkHealthCard } from '../components/network/NetworkHealthCard';
import { ActiveEngine } from '../lib/visualization';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [showSnapshotNotice, setShowSnapshotNotice] = useState(
    () => localStorage.getItem('navilla_hide_snapshot_notice') !== 'true'
  );
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('navilla_onboarding_complete') !== 'true'
  );
  const [showExposureHelp, setShowExposureHelp] = useState(false);
  const { user, session, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading } = useUser();
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

  const reciprocityQuery = useReciprocityStatus();
  const isOptedIn = reciprocityQuery.data?.optedIn ?? false;

  const { data: networkData } = useNetworkVisualization();
  const { data: networkHealthData } = useNetworkHealth();
  const constellationEngine = useMemo(() => new ActiveEngine(), []);

  const hasPositiveStatus = (healthQuery.data ?? []).some(
    (status) => status.status === 'positive' && !status.clearedAt
  );
  const healthInitialLoading = healthQuery.isLoading && !healthQuery.data;
  const exposureInitialLoading = exposureQuery.isLoading && !exposureQuery.data;

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

  const isInitialLoading = authLoading
    || isLoading
    || statsQuery.isLoading
    || exposureInitialLoading
    || healthInitialLoading;

  const displayName = (profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.firstName || profile?.lastName)
    || profile?.username
    || user?.user_metadata?.full_name
    || user?.user_metadata?.username
    || user?.email?.split('@')[0]
    || '';

  const formatDegree = (degree: number) => {
    if (i18n.language.startsWith('es')) {
      return `${degree}\u00BA`;
    }
    const suffix = degree === 1 ? 'st' : degree === 2 ? 'nd' : degree === 3 ? 'rd' : 'th';
    return `${degree}${suffix}`;
  };

  if (isInitialLoading) {
    return (
      <PageSkeleton loadingLabel={t('common.loading')}>
        <SkeletonBlock className="h-16 w-full rounded-2xl" />
        <SkeletonBlock className="h-32 w-full rounded-2xl" />
        <div className="flex gap-3">
          <SkeletonBlock className="h-12 flex-1 rounded-full" />
          <SkeletonBlock className="h-12 flex-1 rounded-full" />
          <SkeletonBlock className="h-12 flex-1 rounded-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonBlock className="h-64 rounded-2xl" />
          <SkeletonBlock className="h-64 rounded-2xl" />
        </div>
      </PageSkeleton>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold mb-1">
          {t('dashboard.welcome')}, {displayName}
        </h1>
        <p className="text-muted text-lg">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Next Up — Reminders */}
      <div className="card card-elevated">
        <UpcomingReminders />
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted)' }}>
          {t('dashboard.quickActions')}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/health-log"
            className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-primary-light-bg)',
              color: 'var(--color-primary)',
            }}
          >
            <Heart className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline truncate">{t('dashboard.goToHealth')}</span>
          </Link>
          <Link
            to="/journal"
            className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-primary-light-bg)',
              color: 'var(--color-primary)',
            }}
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline truncate">{t('dashboard.goToJournal')}</span>
          </Link>
          <Link
            to="/connections"
            className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-primary-light-bg)',
              color: 'var(--color-primary)',
            }}
          >
            <Users className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline truncate">{t('dashboard.goToConnections')}</span>
          </Link>
          <Link
            to="/insights"
            className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-primary-light-bg)',
              color: 'var(--color-primary)',
            }}
          >
            <BarChart3 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline truncate">{t('dashboard.goToInsights')}</span>
          </Link>
        </div>
      </div>

      {/* Status + Connections — 2-col on md+ */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Card — gated by reciprocity */}
        {!isOptedIn ? (
          <ReciprocityOptInCard />
        ) : (
          <div className="card card-elevated">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  hasPositiveStatus ? 'bg-red-100' : 'bg-green-100'
                }`}
                role="img"
                aria-label={hasPositiveStatus ? t('dashboard.statusActive') : t('dashboard.statusClear')}
              >
                <svg
                  className={`w-5 h-5 ${hasPositiveStatus ? 'text-red-600' : 'text-green-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  {t('dashboard.exposureStatus')}
                </h3>
                <p className={`text-xs font-medium ${hasPositiveStatus ? 'text-red-600' : 'text-green-600'}`}>
                  {hasPositiveStatus ? t('dashboard.statusActive') : t('dashboard.statusClear')}
                </p>
              </div>
            </div>

            {/* Status badge */}
            {healthInitialLoading || exposureInitialLoading ? (
              <div role="status" aria-live="polite" className="mt-1">
                <span className="sr-only">{t('common.loading')}</span>
                <SkeletonBlock className="h-7 w-44 rounded-full" />
              </div>
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

            {/* Exposure help tooltip */}
            {showExposureHelp && (
              <div className="mt-3 rounded-md border border-border-light bg-white/70 p-3 text-xs text-muted">
                <p className="font-semibold text-foreground mb-1">{t('dashboard.exposureHelpTitle')}</p>
                <p>{t('dashboard.exposureHelpBody')}</p>
              </div>
            )}

            {/* Exposure items */}
            {(exposureQuery.data?.exposures?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">{t('dashboard.exposureSummary')}</p>
                  <Link to="/health-log" className="text-[11px] font-semibold tracking-wide uppercase text-primary">
                    {t('dashboard.exposureSummaryMore')}
                  </Link>
                </div>
                <p className="text-[11px] text-muted">
                  {t('dashboard.exposureSummaryPreview', {
                    shown: Math.min(3, exposureQuery.data?.exposures?.length ?? 0),
                    total: exposureQuery.data?.exposures?.length ?? 0,
                  })}
                </p>
                <div className="space-y-2">
                  {sortExposureItems(exposureQuery.data?.exposures ?? []).slice(0, 3).map((item) => {
                    const info = getConditionInfo(item.condition, i18n.language);
                    const urgency = getUrgencyConfig(item);
                    return (
                      <div
                        key={item.condition}
                        className="exposure-item"
                        style={getExposureCardStyle(item)}
                      >
                        <div className="flex items-center justify-between gap-2">
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
                          <span
                            className="inline-block text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ color: urgency.badgeColor, background: urgency.badgeBg }}
                          >
                            {t(urgency.labelKey)}
                          </span>
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
                              title={`${t(`dashboard.exposureStatusHint.${item.status}`)} \u00B7 ${t(`dashboard.exposureTimeframeHint.${item.timeframe}`)}`}
                            >
                              {t(`dashboard.exposureStatusLabels.${item.status}`)} {'\u00B7'} {t(`dashboard.exposureTimeframe.${item.timeframe}`)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer links */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link to="/health-log" className="text-sm text-primary font-medium">
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

            {/* Dev debug */}
            {DEV_MODE && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <div className="font-semibold mb-1">{t('dashboard.devExposureDebug')}</div>
                <div>{t('dashboard.devConnectionCount')}: {exposureQuery.data?.connectionCount ?? '\u2014'}</div>
                <div>{t('dashboard.devSecondDegree')}: {exposureQuery.data?.secondDegreeCount ?? '\u2014'}</div>
                <div>{t('dashboard.devThirdDegree')}: {exposureQuery.data?.thirdDegreeCount ?? '\u2014'}</div>
                <div>{t('dashboard.devExposureCount')}: {exposureQuery.data?.exposures?.length ?? 0}</div>
              </div>
            )}
          </div>
        )}

        {/* Connections Card */}
        <div className="card card-elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-light-bg)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              {t('dashboard.connectionCount')}
            </h3>
          </div>
          <p className="text-4xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
            {statsQuery.data?.confirmedCount ?? 0}
          </p>
          <p className="text-sm text-muted">{t('dashboard.connectionDescription')}</p>
          {(statsQuery.data?.confirmedCount ?? 0) < 3 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-stone-200">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${((statsQuery.data?.confirmedCount ?? 0) / 3) * 100}%`, background: 'var(--color-primary)' }}
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
                {exposureQuery.data?.totalGraphNodes ?? '\u2014'}
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
          <div className="mt-4">
            <Link to="/connections" className="text-sm text-primary font-medium">
              {t('dashboard.manageConnections')}
            </Link>
          </div>
        </div>
      </div>

      {/* Constellation Preview — only for opted-in users with data */}
      {isOptedIn && networkData && (
        <div className="card card-elevated">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-light-bg)' }}>
                <Sparkles className="w-5 h-5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider">{t('dashboard.constellation')}</h3>
            </div>
            <span className="badge badge-primary text-xs">{networkData.stageDisplayName}</span>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ height: 200, background: 'linear-gradient(180deg, #1e1b4b 0%, #0a0a0f 100%)' }}>
            <NetworkVisualizationHost engine={constellationEngine} data={networkData} className="w-full h-full" />
          </div>
          <Link to="/network" className="text-sm font-medium mt-3 inline-block" style={{ color: 'var(--color-primary)' }}>
            {t('dashboard.viewConstellation')} &rarr;
          </Link>
        </div>
      )}

      {/* Network Health — compact card for opted-in users */}
      {isOptedIn && networkHealthData && (
        <NetworkHealthCard data={networkHealthData} />
      )}

      {/* Snapshot notice — bottom, dismissible */}
      {showSnapshotNotice && (
        <div className="card" style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-background-secondary, #f5f5f4)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                {t('dashboard.snapshotTitle')}
              </h3>
              <p className="text-xs text-muted">{t('dashboard.snapshotBody')}</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm flex-shrink-0"
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

      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
