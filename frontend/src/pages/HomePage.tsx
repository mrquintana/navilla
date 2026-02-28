import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthOptional } from '../contexts/AuthContext';
import {
  Network,
  ShieldCheck,
  UserPlus,
  UserRoundCheck,
  Activity,
  LockKeyhole,
  ArrowRight,
  CircleHelp,
  BookOpen,
  HeartPulse,
} from 'lucide-react';
import { ConstellationGraphic } from '../components/landing/ConstellationGraphic';

export function HomePage() {
  const { t } = useTranslation();
  const session = useAuthOptional()?.session ?? null;

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <title>Navilla — Your private sexual health companion</title>
      <meta name="description" content="Navilla helps you make better sexual health decisions with private tools, clear timing guidance, and anonymized network signals." />
      <link rel="canonical" href="https://www.navilla.app/" />
      <meta property="og:url" content="https://www.navilla.app/" />
      <meta property="og:title" content="Navilla — Your private sexual health companion" />
      <meta property="og:description" content="Private tools, timing guidance, and anonymized exposure signals designed for trust and informed decisions." />

      {/* Hero — dark indigo with full-bleed constellation background */}
      <section className="hero">
        <ConstellationGraphic className="hero-constellation" />
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
        </div>
      </section>

      {/* How it works */}
      <section className="container py-12 landing-section landing-section--steps">
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
          <div className="text-center mt-6">
            <Link to="/how-it-works" className="btn btn-secondary">
              {t('landing.howMore', 'How it works in detail')}
            </Link>
          </div>
        </div>
      </section>

      {/* Why it feels different */}
      <section className="container landing-section landing-section--values">
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
          <div className="text-center mt-6">
            <Link to="/privacy" className="btn btn-secondary">
              {t('landing.valueMore', 'Privacy details')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features — Journal & Health Log showcase */}
      <section className="container landing-section landing-section--features">
        <div className="landing-panel landing-panel--values">
          <h2 className="text-center mb-2">{t('landing.featuresTitle')}</h2>
          <p className="text-center text-sm text-muted mb-6">{t('landing.featuresSubtitle')}</p>
          <div className="landing-grid landing-grid--features">
            {/* Journal card */}
            <div className="feature-showcase-card">
              <div className="feature-showcase-preview" aria-hidden="true">
                {/* TODO: Replace with actual screenshot */}
                <div className="feature-showcase-placeholder">
                  <BookOpen className="w-8 h-8" />
                </div>
              </div>
              <div className="feature-showcase-content">
                <div className="feature-showcase-badge">
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  <span>{t('landing.featureJournalBadge')}</span>
                </div>
                <h3>{t('landing.featureJournalTitle')}</h3>
                <p>{t('landing.featureJournalBody')}</p>
                <Link to="/signup" className="feature-card-cta">
                  {t('landing.featuresCta')}
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Health Log card */}
            <div className="feature-showcase-card">
              <div className="feature-showcase-preview" aria-hidden="true">
                {/* TODO: Replace with actual screenshot */}
                <div className="feature-showcase-placeholder">
                  <HeartPulse className="w-8 h-8" />
                </div>
              </div>
              <div className="feature-showcase-content">
                <div className="feature-showcase-badge">
                  <HeartPulse className="w-4 h-4" aria-hidden="true" />
                  <span>{t('landing.featureHealthLogBadge')}</span>
                </div>
                <h3>{t('landing.featureHealthLogTitle')}</h3>
                <p>{t('landing.featureHealthLogBody')}</p>
                <Link to="/signup" className="feature-card-cta">
                  {t('landing.featuresCta')}
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore — Layer 0 tools */}
      <section className="container landing-section landing-section--explore">
        <div className="landing-panel landing-panel--values">
          <h2 className="text-center mb-6">{t('landing.exploreTitle', 'Explore before you sign up')}</h2>
          <div className="landing-grid landing-grid--explore">
            <Link to="/calculator" className="feature-card feature-card--explore">
              <div className="explore-card-preview" aria-hidden="true">
                <img
                  src="/images/preview-calculator.png"
                  alt=""
                  className="explore-card-thumbnail"
                  loading="lazy"
                />
              </div>
              <h3>{t('landing.exploreCalculatorTitle', 'When should I test?')}</h3>
              <p>{t('landing.exploreCalculatorBody', 'Enter a date and see exactly when each test becomes reliable.')}</p>
              <span className="feature-card-cta">
                {t('landing.exploreCalculatorCta', 'Open calculator')}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </Link>
            <Link to="/guides" className="feature-card feature-card--explore">
              <div className="explore-card-preview" aria-hidden="true">
                <img
                  src="/images/preview-guides.png"
                  alt=""
                  className="explore-card-thumbnail"
                  loading="lazy"
                />
              </div>
              <h3>{t('landing.exploreGuidesTitle', 'Learn about STIs')}</h3>
              <p>{t('landing.exploreGuidesBody', 'Clear guides on 10 conditions — symptoms, testing, treatment.')}</p>
              <span className="feature-card-cta">
                {t('landing.exploreGuidesCta', 'Browse guides')}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ preview */}
      <section className="container landing-section">
        <div className="landing-panel landing-panel--values">
          <h2 className="text-center mb-6">{t('landing.faqTitle', 'Questions people ask first')}</h2>
          <div className="landing-grid landing-grid--values">
            {[1, 2, 3].map((item) => (
              <div key={item} className="feature-card feature-card--value">
                <div className="feature-card-head feature-card-head--icon-only">
                  <span className="feature-icon" aria-hidden="true">
                    <CircleHelp className="w-4 h-4" />
                  </span>
                </div>
                <h3>{t(`landing.faqQ${item}`)}</h3>
                <p>{t(`landing.faqA${item}`)}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/help" className="btn btn-secondary">
              {t('landing.faqMore', 'Read all FAQs')}
            </Link>
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
