import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthOptional } from '../contexts/AuthContext';

export function HomePage() {
  const { t } = useTranslation();
  const session = useAuthOptional()?.session ?? null;

  if (session) {
    return <Navigate to="/connections" replace />;
  }

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

      <section className="container py-12 landing-section">
        <h2 className="text-center mb-6">{t('landing.howTitle')}</h2>
        <div className="landing-grid">
          <div className="feature-card">
            <h3>{t('landing.stepOneTitle')}</h3>
            <p>{t('landing.stepOneBody')}</p>
          </div>
          <div className="feature-card">
            <h3>{t('landing.stepTwoTitle')}</h3>
            <p>{t('landing.stepTwoBody')}</p>
          </div>
          <div className="feature-card">
            <h3>{t('landing.stepThreeTitle')}</h3>
            <p>{t('landing.stepThreeBody')}</p>
          </div>
        </div>
      </section>

      <section className="container pb-16 landing-section">
        <h2 className="text-center mb-6">{t('landing.valueTitle')}</h2>
        <div className="landing-grid">
          <div className="feature-card">
            <h3>{t('landing.valueOneTitle')}</h3>
            <p>{t('landing.valueOneBody')}</p>
          </div>
          <div className="feature-card">
            <h3>{t('landing.valueTwoTitle')}</h3>
            <p>{t('landing.valueTwoBody')}</p>
          </div>
          <div className="feature-card">
            <h3>{t('landing.valueThreeTitle')}</h3>
            <p>{t('landing.valueThreeBody')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
