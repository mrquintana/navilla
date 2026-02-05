import { Link, useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function ErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError() as { statusText?: string; message?: string } | undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="container py-12 flex-1">
        <div className="card card-elevated text-center space-y-4">
          <h1 className="text-3xl font-semibold">{t('errors.unexpectedTitle')}</h1>
          <p className="text-sm text-muted">{t('errors.unexpectedBody')}</p>
          {error?.message && (
            <p className="text-xs text-muted">{error.message || error.statusText}</p>
          )}
          <div className="flex justify-center gap-3">
            <Link to="/" className="btn btn-primary">
              {t('errors.goHome')}
            </Link>
            <Link to="/help" className="btn btn-secondary">
              {t('errors.getHelp')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
