import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthOptional } from '../contexts/AuthContext';
import { Network, ShieldCheck, UserPlus, UserRoundCheck, Activity, LockKeyhole } from 'lucide-react';

export function HomePage() {
  const { t } = useTranslation();
  const session = useAuthOptional()?.session ?? null;

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <title>Navilla — Know your exposure risk, protect your privacy</title>
      <meta name="description" content="Navilla shows you anonymized health exposure signals from your trusted network. Numbers, not names. Your privacy is our priority." />
      <link rel="canonical" href="https://www.navilla.app/" />
      <meta property="og:url" content="https://www.navilla.app/" />
      <meta property="og:title" content="Navilla — Know your exposure risk, protect your privacy" />
      <meta property="og:description" content="Navilla shows you anonymized health exposure signals from your trusted network. Numbers, not names. Your privacy is our priority." />
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">{t('common.appName')}</h1>
          <p className="hero-subtitle">{t('privacy.tagline')}</p>
          <p className="hero-description">{t('privacy.description')}</p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
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
        <div className="landing-panel landing-panel--steps">
          <h2 className="text-center mb-6">{t('landing.howTitle')}</h2>
          <div className="landing-grid landing-grid--steps">
            <div className="feature-card feature-card--step">
              <div className="feature-card-head">
                <span className="feature-kicker">Step 1</span>
                <span className="feature-icon" aria-hidden="true">
                  <UserPlus className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.stepOneTitle')}</h3>
              <p>{t('landing.stepOneBody')}</p>
            </div>
            <div className="feature-card feature-card--step">
              <div className="feature-card-head">
                <span className="feature-kicker">Step 2</span>
                <span className="feature-icon" aria-hidden="true">
                  <UserRoundCheck className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.stepTwoTitle')}</h3>
              <p>{t('landing.stepTwoBody')}</p>
            </div>
            <div className="feature-card feature-card--step">
              <div className="feature-card-head">
                <span className="feature-kicker">Step 3</span>
                <span className="feature-icon" aria-hidden="true">
                  <Network className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.stepThreeTitle')}</h3>
              <p>{t('landing.stepThreeBody')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-16 landing-section">
        <div className="landing-panel landing-panel--values">
          <h2 className="text-center mb-6">{t('landing.valueTitle')}</h2>
          <div className="landing-grid landing-grid--values">
            <div className="feature-card feature-card--value">
              <div className="feature-card-head feature-card-head--icon-only">
                <span className="feature-icon" aria-hidden="true">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.valueOneTitle')}</h3>
              <p>{t('landing.valueOneBody')}</p>
            </div>
            <div className="feature-card feature-card--value">
              <div className="feature-card-head feature-card-head--icon-only">
                <span className="feature-icon" aria-hidden="true">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.valueTwoTitle')}</h3>
              <p>{t('landing.valueTwoBody')}</p>
            </div>
            <div className="feature-card feature-card--value">
              <div className="feature-card-head feature-card-head--icon-only">
                <span className="feature-icon" aria-hidden="true">
                  <LockKeyhole className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.valueThreeTitle')}</h3>
              <p>{t('landing.valueThreeBody')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
