import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { t } = useTranslation();
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

  // Get display name or first part of email
  const displayName = profile?.displayName || user?.email?.split('@')[0] || '';

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
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold">{t('dashboard.exposureStatus')}</h3>
          </div>
          {exposureQuery.data?.message ? (
            <span className="badge badge-warning text-sm">{t(exposureQuery.data.message)}</span>
          ) : (
            <span className="badge badge-success text-sm">{t('dashboard.noExposure')}</span>
          )}
          <div className="mt-3">
            <Link to="/health" className="text-sm text-primary font-medium">
              {t('dashboard.viewHealthStatus')}
            </Link>
          </div>
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
