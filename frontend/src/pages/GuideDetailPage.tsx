import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Clock,
  ChevronRight,
  ArrowRight,
  ArrowUpDown,
  Thermometer,
  FlaskConical,
  Pill,
  ShieldCheck,
} from 'lucide-react';
import { STI_DATA, type Lang } from '../lib/stiContent';
import { buildMedicalWebPageLD } from '../lib/structuredData';
import { FactChips } from '../components/layer0/FactChips';
import { SignUpCTA } from '../components/layer0/SignUpCTA';
import { renderMarkdown } from '../lib/renderMarkdown';

interface Props {
  /** Passed by the prerender script instead of useParams for SSR compatibility */
  forcedSlug?: string;
}

const GUIDE_SECTIONS = [
  { key: 'what' as const,         labelEn: 'What is it?',    labelEs: '¿Qué es?',          icon: <BookOpen className="w-3.5 h-3.5" aria-hidden="true" /> },
  { key: 'transmission' as const, labelEn: 'How it spreads', labelEs: 'Cómo se transmite', icon: <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" /> },
  { key: 'symptoms' as const,     labelEn: 'Symptoms',       labelEs: 'Síntomas',          icon: <Thermometer className="w-3.5 h-3.5" aria-hidden="true" /> },
  { key: 'testing' as const,      labelEn: 'Testing',        labelEs: 'Pruebas',           icon: <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" /> },
  { key: 'treatment' as const,    labelEn: 'Treatment',      labelEs: 'Tratamiento',       icon: <Pill className="w-3.5 h-3.5" aria-hidden="true" /> },
  { key: 'prevention' as const,   labelEn: 'Prevention',     labelEs: 'Prevención',        icon: <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> },
] as const;

export function GuideDetailPage({ forcedSlug }: Props) {
  const { t, i18n } = useTranslation();
  const params = useParams<{ slug: string }>();
  const slug = forcedSlug ?? params.slug ?? '';
  const lang: Lang = i18n.language?.startsWith('es') ? 'es' : 'en';

  const sti = STI_DATA[slug];

  // Not found
  if (!sti) {
    return (
      <>
        <title>{lang === 'es' ? 'Guía no encontrada — Navilla' : 'Guide not found — Navilla'}</title>
        <div className="guide-page">
          <div className="container guide-body">
            <nav className="guide-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">{t('nav.home', 'Home')}</Link>
              <ChevronRight className="w-3.5 h-3.5 guide-breadcrumb-sep" aria-hidden="true" />
              <Link to="/guides">{lang === 'es' ? 'Guías' : 'Guides'}</Link>
              <ChevronRight className="w-3.5 h-3.5 guide-breadcrumb-sep" aria-hidden="true" />
              <span className="guide-breadcrumb-current">404</span>
            </nav>
            <div className="guide-state-card" data-testid="guide-not-found">
              <h2>{lang === 'es' ? 'Guía no encontrada' : 'Guide not found'}</h2>
              <p>
                {lang === 'es'
                  ? 'No encontramos una guía para esa condición.'
                  : "We couldn't find a guide for that condition."}
              </p>
              <Link to="/guides" className="btn btn-primary">
                {lang === 'es' ? 'Ver todas las guías' : 'Browse all guides'}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const title = sti.title[lang];
  const { windowPeriod, guide } = sti;

  const metaTitle = lang === 'es'
    ? `${title} — Guía completa | Navilla`
    : `${title} Guide — Symptoms, Testing & Treatment | Navilla`;

  const metaDescription = lang === 'es'
    ? `Todo sobre ${title}: qué es, cómo se transmite, síntomas, pruebas y tratamiento.`
    : `Everything about ${title}: what it is, transmission, symptoms, testing, and treatment.`;

  return (
    <>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={`https://www.navilla.app/guide/${slug}`} />
      <link rel="alternate" hrefLang="en" href={`https://www.navilla.app/guide/${slug}`} />
      <link rel="alternate" hrefLang="es" href={`https://www.navilla.app/guide/${slug}`} />
      <script type="application/ld+json">
        {JSON.stringify(buildMedicalWebPageLD({
          name: metaTitle,
          description: metaDescription,
          url: `https://www.navilla.app/guide/${slug}`,
        }))}
      </script>

      <div className="guide-page">
        {/* Hero */}
        <section className="guide-hero landing-surface">
          <div className="container">
            <nav className="guide-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">{t('nav.home', 'Home')}</Link>
              <ChevronRight className="w-3.5 h-3.5 guide-breadcrumb-sep" aria-hidden="true" />
              <Link to="/guides">{lang === 'es' ? 'Guías' : 'Guides'}</Link>
              <ChevronRight className="w-3.5 h-3.5 guide-breadcrumb-sep" aria-hidden="true" />
              <span className="guide-breadcrumb-current">{title}</span>
            </nav>

            <div className="guide-hero-inner">
              <div className="guide-category-badge">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                {lang === 'es' ? 'Guía de salud' : 'Health Guide'}
              </div>
              <h1 className="guide-title">{title}</h1>
              <p className="guide-subtitle">{sti.tagline[lang]}</p>
            </div>
          </div>
        </section>

        {/* Body */}
        <div className="container guide-body">
          {/* Quick stats block */}
          <QuickStatsBlock slug={slug} windowPeriod={windowPeriod} facts={sti.facts} lang={lang} />

          {/* Guide content — or coming soon */}
          {guide ? (
            <>
              <div className="guide-section-grid" role="main">
                {GUIDE_SECTIONS.map(({ key, labelEn, labelEs, icon }) => (
                  <article key={key} className="guide-section" aria-labelledby={`section-${key}`}>
                    <h2 id={`section-${key}`} className="guide-section-title">
                      {icon}
                      {lang === 'es' ? labelEs : labelEn}
                    </h2>
                    <div className="guide-section-body">
                      {renderMarkdown(guide[key][lang])}
                    </div>
                  </article>
                ))}
              </div>

              {/* Sources */}
              <div className="guide-sources">
                <h3 className="guide-sources-title">
                  {lang === 'es' ? 'Fuentes' : 'Sources'}
                </h3>
                <ol className="guide-sources-list">
                  {guide.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          ) : (
            <div className="guide-state-card" data-testid="guide-coming-soon">
              <h2>{lang === 'es' ? 'Guía próximamente' : 'Guide coming soon'}</h2>
              <p>
                {lang === 'es'
                  ? `Estamos preparando la guía completa de ${title}. Mientras tanto, puedes calcular tu período de ventana.`
                  : `We're preparing the full ${title} guide. In the meantime, you can calculate your testing window.`}
              </p>
              <Link to="/calculator" className="btn btn-primary">
                {lang === 'es' ? 'Ir a la calculadora' : 'Go to calculator'}
                <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Link>
            </div>
          )}

          <SignUpCTA
            titleEn="Track your testing history"
            titleEs="Lleva un registro de tus pruebas"
            bodyEn="With Navilla you can log your results and see risk signals in your network — privately."
            bodyEs="Con Navilla puedes registrar tus resultados y ver señales de riesgo en tu red — de forma privada."
          />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// QuickStatsBlock
// ---------------------------------------------------------------------------

interface QuickStatsProps {
  slug: string;
  windowPeriod: import('../lib/stiContent').WindowPeriod;
  facts: import('../lib/stiContent').STIContent['facts'];
  lang: Lang;
}

function QuickStatsBlock({ slug, windowPeriod, facts, lang }: QuickStatsProps) {
  const { t } = useTranslation();
  return (
    <div className="guide-quick-stats">
      <div className="guide-quick-stats-left">
        <FactChips facts={facts} />
        <div className="guide-quick-stats-window">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          {windowPeriod.noStandardTest ? (
            <span className="guide-quick-stats-no-test">{windowPeriod.note[lang]}</span>
          ) : (
            <>
              <span className="guide-window-callout-label">
                {lang === 'es' ? 'Período de ventana:' : 'Window period:'}
              </span>
              <span className="guide-quick-stats-window-value">
                {windowPeriod.minDays}–{windowPeriod.maxDays} {lang === 'es' ? 'días' : 'days'}
              </span>
            </>
          )}
        </div>
      </div>
      <Link
        to="/calculator"
        className="btn btn-secondary"
        aria-label={t('calculator.title', 'Window Period Calculator')}
        state={{ slug }}
      >
        <FlaskConical className="w-4 h-4 mr-1" aria-hidden="true" />
        {lang === 'es' ? 'Calcular mis fechas' : 'Calculate my dates'}
      </Link>
    </div>
  );
}
