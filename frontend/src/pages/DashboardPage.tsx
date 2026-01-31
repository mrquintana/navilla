import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser';

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useUser();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-2">{t('dashboard.title')}</h1>
      <p className="text-muted mb-8">
        {t('dashboard.welcome')}, {user?.email}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-medium mb-4">{t('dashboard.exposureStatus')}</h2>
          <p className="text-success">{t('dashboard.noExposure')}</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium mb-4">{t('nav.profile')}</h2>
          {isLoading ? (
            <p className="text-muted">{t('common.loading')}</p>
          ) : error ? (
            <p className="text-red-600">{t('common.error')}</p>
          ) : profile ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted">{t('auth.email')}:</span> {profile.email}
              </p>
              {profile.display_name && (
                <p>
                  <span className="text-muted">Display Name:</span> {profile.display_name}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
