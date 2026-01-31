import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser';

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useUser();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1>{t('dashboard.title')}</h1>
        <p className="text-muted">
          {t('dashboard.welcome')}, {user?.email}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <h3 className="mb-4">{t('dashboard.exposureStatus')}</h3>
          <span className="badge badge-success">{t('dashboard.noExposure')}</span>
        </div>

        <div className="card">
          <h3 className="mb-4">{t('dashboard.connectionCount')}</h3>
          <p className="text-3xl font-bold text-primary">0</p>
          <p className="text-sm text-muted">connections in your network</p>
        </div>

        <div className="card">
          <h3 className="mb-4">{t('nav.profile')}</h3>
          {isLoading ? (
            <p className="text-muted">{t('common.loading')}</p>
          ) : error ? (
            <p className="text-error">{t('common.error')}</p>
          ) : profile ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted">{t('auth.email')}:</span>{' '}
                <span className="font-medium">{profile.email}</span>
              </p>
              {profile.display_name && (
                <p>
                  <span className="text-muted">Display Name:</span>{' '}
                  <span className="font-medium">{profile.display_name}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted">Profile not loaded</p>
          )}
        </div>
      </div>
    </div>
  );
}
