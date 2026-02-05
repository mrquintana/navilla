import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { Footer } from './Footer';
import { DEV_MODE } from '../../lib/devMode';
import { api } from '../../lib/api';
import { API_URL } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export function Layout() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const location = useLocation();
  const isLanding = !session && location.pathname === '/';
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: () => api.health.check(),
    enabled: API_URL.length > 0,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    retry: 1,
  });

  const showOutage = API_URL.length > 0 && healthQuery.isError;

  return (
    <div className={`min-h-screen bg-background flex flex-col${isLanding ? ' landing-surface' : ''}`}>
      <Header />
      {DEV_MODE && (
        <div className="bg-red-600 text-white text-center text-sm font-semibold py-2">
          DEV MODE ENABLED
        </div>
      )}
      <main className="pt-6 pb-12 flex-1">
        {showOutage ? (
          <div className="container py-8 space-y-4">
            <div className="card card-elevated text-center space-y-3">
              <h1 className="text-2xl font-semibold">{t('status.downTitle')}</h1>
              <p className="text-sm text-muted">{t('status.downBody')}</p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => healthQuery.refetch()}
                >
                  {t('status.retry')}
                </button>
                <a className="btn btn-secondary" href="/status">
                  {t('status.viewStatus')}
                </a>
              </div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
    </div>
  );
}
