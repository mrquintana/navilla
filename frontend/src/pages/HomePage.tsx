import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { t } = useTranslation();
  const { session } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-semibold mb-4">{t('common.appName')}</h1>
      <p className="text-xl text-muted mb-2">{t('privacy.tagline')}</p>
      <p className="text-muted mb-8 max-w-2xl mx-auto">{t('privacy.description')}</p>

      <div className="flex justify-center gap-4">
        {session ? (
          <Link to="/dashboard" className="btn btn-primary">
            {t('nav.dashboard')}
          </Link>
        ) : (
          <>
            <Link to="/signup" className="btn btn-primary">
              {t('auth.signUp')}
            </Link>
            <Link to="/login" className="btn btn-secondary">
              {t('auth.signIn')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
