import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="container py-12">
      <div className="card card-elevated text-center space-y-4">
        <h1 className="text-3xl font-semibold">{t('errors.notFoundTitle')}</h1>
        <p className="text-sm text-muted">{t('errors.notFoundBody')}</p>
        <div className="flex justify-center gap-3">
          <Link to="/" className="btn btn-primary">
            {t('errors.goHome')}
          </Link>
          <Link to="/help" className="btn btn-secondary">
            {t('errors.getHelp')}
          </Link>
        </div>
      </div>
    </div>
  );
}
