import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { Footer } from './Footer';
import { DEV_MODE } from '../../lib/devMode';
import { api, API_URL } from '../../lib/api';
import { env } from '../../lib/env';
import { useAuthOptional } from '../../contexts/AuthContext';
import { useEffect } from 'react';

export function Layout() {
  const { t } = useTranslation();
  const session = useAuthOptional()?.session ?? null;
  const location = useLocation();
  const isLanding = !session && location.pathname === '/';
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      if (env.DEV) {
        console.debug('[healthcheck] queryFn');
      }
      return api.system.check();
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    retry: 1,
    enabled: true,
  });

  useEffect(() => {
    if (env.DEV) {
      console.debug('[healthcheck] status', healthQuery.status);
    }
  }, [healthQuery.status]);

  const showOutage = healthQuery.failureCount >= 2;

  return (
    <div className={`min-h-screen bg-background flex flex-col${isLanding ? ' landing-surface' : ' app-surface'}`}>
      <Header />
      {DEV_MODE && (
        <div className="bg-red-600 text-white text-center text-sm font-semibold py-2">
          DEV MODE ENABLED
        </div>
      )}
      {DEV_MODE && (
        <div className="bg-blue-600 text-white text-center text-xs font-semibold py-2">
          API URL: {API_URL || 'not set'} · Health: {API_URL ? `${API_URL}/api/health` : 'not set'} · Status: {healthQuery.status}
          {healthQuery.isError && (
            <span className="ml-2">
              · Error: {healthQuery.error instanceof Error ? healthQuery.error.message : String(healthQuery.error)}
            </span>
          )}
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
