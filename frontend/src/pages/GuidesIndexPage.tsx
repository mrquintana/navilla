import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronRight, FlaskConical } from 'lucide-react';
import { STI_DATA, STI_ORDER, type Lang } from '../lib/stiContent';
import { FactChips } from '../components/layer0/FactChips';

export function GuidesIndexPage() {
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language?.startsWith('es') ? 'es' : 'en';

  return (
    <>
      <title>
        {lang === 'es'
          ? 'Guías de ITS — Síntomas, Pruebas y Tratamiento | Navilla'
          : 'STI Guides — Symptoms, Testing & Treatment | Navilla'}
      </title>
      <meta
        name="description"
        content={
          lang === 'es'
            ? 'Guías completas de ITS: qué son, cómo se transmiten, síntomas, pruebas y tratamiento. Basadas en CDC y OMS.'
            : 'Complete STI guides: what they are, transmission, symptoms, testing, and treatment. Based on CDC and WHO data.'
        }
      />
      <link rel="canonical" href="https://www.navilla.app/guides" />
      <link rel="alternate" hrefLang="en" href="https://www.navilla.app/guides" />
      <link rel="alternate" hrefLang="es" href="https://www.navilla.app/guides" />

      <div className="guides-page">
        {/* Hero */}
        <section className="guides-hero landing-surface">
          <div className="container">
            <div className="guides-hero-inner">
              <div className="calculator-kicker">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>{lang === 'es' ? 'Información de salud' : 'Health Information'}</span>
              </div>
              <h1 className="calculator-title">
                {lang === 'es' ? 'Guías de ITS' : 'STI Guides'}
              </h1>
              <p className="calculator-subtitle">
                {lang === 'es'
                  ? 'Información clara y sin juicios sobre infecciones de transmisión sexual. Basada en CDC, OMS y CENSIDA.'
                  : 'Clear, non-judgmental information about sexually transmitted infections. Based on CDC, WHO, and CENSIDA.'}
              </p>
            </div>
          </div>
        </section>

        {/* Guides grid */}
        <section className="container guides-body">
          <div className="guides-grid" role="list" aria-label={lang === 'es' ? 'Lista de guías' : 'Guides list'}>
            {STI_ORDER.map((slug) => {
              const sti = STI_DATA[slug];
              const hasGuide = !!sti.guide;
              const isNoTest = sti.windowPeriod.noStandardTest;

              return (
                <div key={slug} role="listitem">
                  {hasGuide ? (
                    <Link
                      to={`/guide/${slug}`}
                      className="guide-card"
                      aria-label={`${sti.title[lang]} guide`}
                    >
                      <GuideCardContent sti={sti} lang={lang} hasGuide={hasGuide} isNoTest={isNoTest} />
                    </Link>
                  ) : (
                    <div
                      className="guide-card guide-card--disabled"
                      aria-label={`${sti.title[lang]} — ${lang === 'es' ? 'próximamente' : 'coming soon'}`}
                    >
                      <GuideCardContent sti={sti} lang={lang} hasGuide={hasGuide} isNoTest={isNoTest} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Calculator CTA */}
          <div className="calculator-clinic-cta">
            <div className="calculator-clinic-cta-inner">
              <div>
                <h3>
                  {lang === 'es'
                    ? '¿Sabes cuándo hacerte la prueba?'
                    : 'Know when to get tested?'}
                </h3>
                <p>
                  {lang === 'es'
                    ? 'Usa nuestra calculadora de período de ventana para ver tus fechas.'
                    : 'Use our window period calculator to see your testing dates.'}
                </p>
              </div>
              <Link to="/calculator" className="btn btn-primary">
                <FlaskConical className="w-4 h-4 mr-1" aria-hidden="true" />
                {lang === 'es' ? 'Ir a la calculadora' : 'Go to calculator'}
                <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="calculator-date-hint" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            {t(
              'calculator.disclaimer',
              'This information is for educational purposes only and is not a substitute for medical advice.'
            )}
          </p>
        </section>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared card content
// ---------------------------------------------------------------------------

interface GuideCardContentProps {
  sti: typeof STI_DATA[keyof typeof STI_DATA];
  lang: Lang;
  hasGuide: boolean;
  isNoTest: boolean | undefined;
}

function GuideCardContent({ sti, lang, hasGuide, isNoTest }: GuideCardContentProps) {
  return (
    <>
      <h2 className="guide-card-title">{sti.title[lang]}</h2>
      <p className="guide-card-tagline">{sti.tagline[lang]}</p>
      <FactChips facts={sti.facts} />
      <div className="guide-card-footer">
        {!isNoTest && (
          <p className="guide-card-window">
            {lang === 'es' ? 'Ventana: ' : 'Window: '}
            {sti.windowPeriod.minDays}–{sti.windowPeriod.maxDays}{' '}
            {lang === 'es' ? 'días' : 'days'}
          </p>
        )}
        <div className="guide-card-tags">
          {!hasGuide && (
            <span className="guide-tag guide-tag--coming-soon">
              {lang === 'es' ? 'Próximamente' : 'Coming soon'}
            </span>
          )}
          {isNoTest && (
            <span className="guide-tag guide-tag--no-test">
              {lang === 'es' ? 'Sin prueba rutinaria' : 'No routine test'}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
