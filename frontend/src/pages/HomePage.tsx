import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthOptional } from '../contexts/AuthContext';
import { Network, ShieldCheck, UserPlus, UserRoundCheck, Activity, LockKeyhole, ArrowRight } from 'lucide-react';
import { ConstellationGraphic } from '../components/landing/ConstellationGraphic';

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

      {/* Hero — warm ivory, two-column editorial */}
      <section className="hero">
        <div className="container">
          <div className="hero-copy">
            <p className="hero-eyebrow">{t('landing.heroEyebrow')}</p>
            <h1 className="hero-title">{t('common.appName')}</h1>
            <p className="hero-subtitle">{t('privacy.tagline')}</p>
            <p className="hero-description">{t('privacy.description')}</p>

            <div className="hero-cta-group">
              <Link to="/signup" className="btn btn-primary btn-lg">
                {t('landing.heroCta', 'Get started — it\'s free')}
              </Link>
              <p className="hero-signin-hint">
                {t('landing.heroSignInHint', 'Already have an account?')}{' '}
                <Link to="/login" className="hero-signin-link">
                  {t('auth.signIn')}
                </Link>
              </p>
            </div>
          </div>

          <div className="hero-visual">
            <ConstellationGraphic className="hero-constellation" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-12 landing-section">
        <div className="landing-panel landing-panel--steps">
          <h2 className="text-center mb-6">{t('landing.howTitle')}</h2>
          <div className="landing-grid landing-grid--steps">
            <div className="feature-card feature-card--step">
              <div className="feature-card-head">
                <span className="feature-kicker">{t('landing.stepLabel1')}</span>
                <span className="feature-icon" aria-hidden="true">
                  <UserPlus className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.stepOneTitle')}</h3>
              <p>{t('landing.stepOneBody')}</p>
            </div>
            <div className="feature-card feature-card--step">
              <div className="feature-card-head">
                <span className="feature-kicker">{t('landing.stepLabel2')}</span>
                <span className="feature-icon" aria-hidden="true">
                  <UserRoundCheck className="w-4 h-4" />
                </span>
              </div>
              <h3>{t('landing.stepTwoTitle')}</h3>
              <p>{t('landing.stepTwoBody')}</p>
            </div>
            <div className="feature-card feature-card--step">
              <div className="feature-card-head">
                <span className="feature-kicker">{t('landing.stepLabel3')}</span>
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

      {/* Why it feels different */}
      <section className="container landing-section">
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

      {/* Bottom conversion CTA */}
      <section className="container landing-section pb-16">
        <div className="landing-cta-section">
          <div className="landing-cta-left">
            <p className="landing-cta-eyebrow">
              {t('landing.ctaEyebrow', 'Free. Private. No judgment.')}
            </p>
            <h2 className="landing-cta-heading">
              {t('landing.ctaHeading', 'Your health deserves better tools.')}
            </h2>
            <p className="landing-cta-body">
              {t(
                'landing.ctaBody',
                'Track your testing history, log encounters, and see anonymized risk signals from your network — all without anyone knowing your name.'
              )}
            </p>
            <div className="landing-cta-actions">
              <Link to="/signup" className="btn landing-cta-btn">
                {t('landing.ctaButton', 'Create your free account')}
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Link>
              <p className="landing-cta-fine-print">
                {t('landing.ctaFinePrint', 'No credit card. Delete any time.')}
              </p>
            </div>
          </div>
          <div className="landing-cta-right" aria-hidden="true">
            <div className="landing-cta-stat">
              <span className="landing-cta-stat-number">0</span>
              <span className="landing-cta-stat-label">
                {t('landing.ctaStatLabel', 'names shared. Ever.')}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
