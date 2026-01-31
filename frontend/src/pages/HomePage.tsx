import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { t } = useTranslation();
  const { session } = useAuth();

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">{t('common.appName')}</h1>
          <p className="hero-subtitle">{t('privacy.tagline')}</p>
          <p className="hero-description">{t('privacy.description')}</p>

          <div className="flex justify-center gap-4">
            {session ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                {t('nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn btn-primary btn-lg">
                  {t('auth.signUp')}
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  {t('auth.signIn')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="text-center mb-8">How It Works</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Connect Privately</h3>
            <p>Add connections without sharing personal details. Your network stays anonymous.</p>
          </div>
          <div className="feature-card">
            <h3>Stay Informed</h3>
            <p>Get notified about potential exposures in your network, without revealing who.</p>
          </div>
          <div className="feature-card">
            <h3>Take Control</h3>
            <p>Manage your health status and help protect your community, all on your terms.</p>
          </div>
        </div>
      </section>
    </>
  );
}
