import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  FlaskConical,
  ExternalLink,
  MapPin,
  ShieldCheck,
  BadgeCheck,
} from 'lucide-react';
import { buildWebPageLD } from '../lib/structuredData';
import { SignUpCTA } from '../components/layer0/SignUpCTA';
import type { Lang } from '../lib/stiContent';

// ---------------------------------------------------------------------------
// Data — real sourced pricing, verified February 2026
// Each price has a source URL and a verification date.
// Update verifiedDate whenever you re-check the price.
// ---------------------------------------------------------------------------

interface PriceEntry {
  label: { en: string; es: string };
  price: { en: string; es: string };
  sourceUrl: string;
  sourceLabel: string;
  verifiedDate: string; // ISO date
  note?: { en: string; es: string };
}

interface Provider {
  key: string;
  name: string;
  tagline: { en: string; es: string };
  locationInfo: { en: string; es: string };
  locationUrl: string;
  websiteUrl: string;
  prices: PriceEntry[];
}

interface Section {
  key: string;
  tier: 'free' | 'affordable' | 'comprehensive';
  heading: { en: string; es: string };
  subheading: { en: string; es: string };
  providers: Provider[];
}

const SECTIONS: Section[] = [
  // -------------------------------------------------------------------------
  // FREE
  // -------------------------------------------------------------------------
  {
    key: 'free',
    tier: 'free',
    heading: { en: 'Free Testing', es: 'Pruebas Gratuitas' },
    subheading: {
      en: 'Government and NGO clinics offering free STI tests — no insurance required.',
      es: 'Clínicas gubernamentales y ONG con pruebas de ITS gratuitas — sin seguro médico.',
    },
    providers: [
      {
        key: 'capasits',
        name: 'CAPASITS / SAI',
        tagline: {
          en: 'Government sexual health centers. ~80 locations nationwide.',
          es: 'Centros gubernamentales de salud sexual. ~80 ubicaciones en todo el país.',
        },
        locationInfo: {
          en: 'Find your nearest CAPASITS on the CENSIDA directory.',
          es: 'Encuentra tu CAPASITS más cercano en el directorio de CENSIDA.',
        },
        locationUrl: 'https://www.gob.mx/censida/acciones-y-programas/centros-de-atencion-sais-y-capasits',
        websiteUrl: 'https://www.gob.mx/censida',
        prices: [
          {
            label: { en: 'HIV rapid test', es: 'Prueba rápida VIH' },
            price: { en: 'Free', es: 'Gratis' },
            sourceUrl: 'https://www.gob.mx/censida/acciones-y-programas/centros-de-atencion-sais-y-capasits',
            sourceLabel: 'CENSIDA',
            verifiedDate: '2026-02-26',
          },
          {
            label: { en: 'Syphilis (VDRL)', es: 'Sífilis (VDRL)' },
            price: { en: 'Free', es: 'Gratis' },
            sourceUrl: 'https://www.gob.mx/censida/acciones-y-programas/centros-de-atencion-sais-y-capasits',
            sourceLabel: 'CENSIDA',
            verifiedDate: '2026-02-26',
          },
          {
            label: { en: 'Hepatitis C', es: 'Hepatitis C' },
            price: { en: 'Free', es: 'Gratis' },
            sourceUrl: 'https://www.gob.mx/censida/acciones-y-programas/centros-de-atencion-sais-y-capasits',
            sourceLabel: 'CENSIDA',
            verifiedDate: '2026-02-26',
          },
          {
            label: { en: 'Antiretrovirals (if positive)', es: 'Antirretrovirales (si positivo)' },
            price: { en: 'Free', es: 'Gratis' },
            sourceUrl: 'https://www.gob.mx/censida',
            sourceLabel: 'CENSIDA',
            verifiedDate: '2026-02-26',
          },
        ],
      },
      {
        key: 'condesa',
        name: 'Clínica Especializada Condesa',
        tagline: {
          en: 'CDMX government clinic. LGBTQ+-focused since 1995. Walk-in or appointment.',
          es: 'Clínica del gobierno de CDMX. Enfocada en LGBTQ+ desde 1995. Sin cita o con cita.',
        },
        locationInfo: {
          en: 'Gral. Benjamín Hill 24, Hipódromo Condesa, Cuauhtémoc, CDMX',
          es: 'Gral. Benjamín Hill 24, Hipódromo Condesa, Cuauhtémoc, CDMX',
        },
        locationUrl: 'https://maps.app.goo.gl/condesa',
        websiteUrl: 'https://condesa.cdmx.gob.mx/',
        prices: [
          {
            label: { en: 'HIV, syphilis, hepatitis C', es: 'VIH, sífilis, hepatitis C' },
            price: { en: 'Free', es: 'Gratis' },
            sourceUrl: 'https://condesa.cdmx.gob.mx/',
            sourceLabel: 'Clínica Condesa CDMX',
            verifiedDate: '2026-02-26',
          },
          {
            label: { en: 'PrEP and PEP', es: 'PrEP y PEP' },
            price: { en: 'Free', es: 'Gratis' },
            sourceUrl: 'https://condesa.cdmx.gob.mx/',
            sourceLabel: 'Clínica Condesa CDMX',
            verifiedDate: '2026-02-26',
          },
        ],
      },
      {
        key: 'ahf',
        name: 'AHF Mexico',
        tagline: {
          en: 'AIDS Healthcare Foundation. Confidential rapid HIV + syphilis tests. 4 cities.',
          es: 'AIDS Healthcare Foundation. Pruebas rápidas confidenciales de VIH y sífilis. 4 ciudades.',
        },
        locationInfo: {
          en: 'CDMX: Av. Darwin 31, Col. Anzures. Also in Guadalajara, Cuernavaca, Mérida.',
          es: 'CDMX: Av. Darwin 31, Col. Anzures. También en Guadalajara, Cuernavaca y Mérida.',
        },
        locationUrl: 'https://ahfmexico.org.mx/',
        websiteUrl: 'https://ahfmexico.org.mx/',
        prices: [
          {
            label: { en: 'HIV rapid test + counseling', es: 'Prueba rápida VIH + consejería' },
            price: { en: 'Free', es: 'Gratis' },
            sourceUrl: 'https://ahfmexico.org.mx/',
            sourceLabel: 'AHF Mexico',
            verifiedDate: '2026-02-26',
          },
          {
            label: { en: 'Syphilis rapid test', es: 'Prueba rápida de sífilis' },
            price: { en: 'Free', es: 'Gratis' },
            sourceUrl: 'https://ahfmexico.org.mx/',
            sourceLabel: 'AHF Mexico',
            verifiedDate: '2026-02-26',
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // AFFORDABLE PRIVATE
  // -------------------------------------------------------------------------
  {
    key: 'affordable',
    tier: 'affordable',
    heading: { en: 'Affordable Private Labs', es: 'Laboratorios Privados Accesibles' },
    subheading: {
      en: 'Walk-in, fast results. Same-day in most cases. No appointment needed at Salud Digna.',
      es: 'Sin cita. Resultados rápidos. Mismo día en la mayoría de los casos.',
    },
    providers: [
      {
        key: 'marie_stopes',
        name: 'Marie Stopes / Fundación MSI',
        tagline: {
          en: 'Best-value rapid panel in Mexico: 4 infections in one visit, same-day results, counseling included.',
          es: 'El mejor panel rápido en México: 4 infecciones en una visita, resultados el mismo día, consejería incluida.',
        },
        locationInfo: {
          en: 'Multiple branches across Mexico. Book online.',
          es: 'Varias sucursales en México. Agenda en línea.',
        },
        locationUrl: 'https://fundacionmsi.org.mx/servicios/deteccion-de-its/deteccion-de-its/',
        websiteUrl: 'https://fundacionmsi.org.mx/',
        prices: [
          {
            label: {
              en: 'Rapid ITS pack: HIV + Hep C + Chlamydia + Syphilis (same-day results)',
              es: 'Paquete rápido ITS: VIH + Hep C + Clamidia + Sífilis (resultados el mismo día)',
            },
            price: { en: 'from $369 MXN', es: 'desde $369 MXN' },
            sourceUrl: 'https://fundacionmsi.org.mx/servicios/deteccion-de-its/deteccion-de-its/',
            sourceLabel: 'Fundación MSI — Detección de ITS',
            verifiedDate: '2026-02-26',
            note: {
              en: 'Free HPV check-up included with this package.',
              es: 'Revisión de VPH gratuita incluida con este paquete.',
            },
          },
        ],
      },
      {
        key: 'salud_digna',
        name: 'Salud Digna',
        tagline: {
          en: 'Most accessible private lab chain in Mexico. ~30 states. Walk-in, no appointment.',
          es: 'La cadena de laboratorios privados más accesible de México. ~30 estados. Sin cita.',
        },
        locationInfo: {
          en: 'Find your nearest branch at salud-digna.org.',
          es: 'Encuentra tu sucursal más cercana en salud-digna.org.',
        },
        locationUrl: 'https://www.salud-digna.org/',
        websiteUrl: 'https://www.salud-digna.org/',
        prices: [
          {
            label: { en: 'HIV (ELISA screening)', es: 'VIH (ELISA detección)' },
            price: { en: '$150 MXN', es: '$150 MXN' },
            sourceUrl: 'https://salud-digna-mx.com/%E2%96%B7-pruebas-de-ets-en-salud-digna-citas-precios/',
            sourceLabel: 'salud-digna-mx.com — Precios ETS',
            verifiedDate: '2026-02-26',
          },
          {
            label: { en: 'Syphilis (VDRL)', es: 'Sífilis (VDRL)' },
            price: { en: '$100–$180 MXN', es: '$100–$180 MXN' },
            sourceUrl: 'https://salud-digna-mx.com/%E2%96%B7-pruebas-de-ets-en-salud-digna-citas-precios/',
            sourceLabel: 'salud-digna-mx.com — Precios ETS',
            verifiedDate: '2026-02-26',
          },
          {
            label: { en: 'Herpes IgG antibodies (HSV-1)', es: 'Anticuerpos IgG herpes (VHS-1)' },
            price: { en: '$262 MXN', es: '$262 MXN' },
            sourceUrl: 'https://salud-digna-mx.com/%E2%96%B7-pruebas-de-ets-en-salud-digna-citas-precios/',
            sourceLabel: 'salud-digna-mx.com — Precios ETS',
            verifiedDate: '2026-02-26',
          },
          {
            label: { en: 'HPV (14 high-risk genotypes)', es: 'VPH (14 genotipos de alto riesgo)' },
            price: { en: '$290 MXN', es: '$290 MXN' },
            sourceUrl: 'https://salud-digna-mx.com/%E2%96%B7-pruebas-de-ets-en-salud-digna-citas-precios/',
            sourceLabel: 'salud-digna-mx.com — Precios ETS',
            verifiedDate: '2026-02-26',
            note: {
              en: 'Pooled high-risk genotype screening. Not the same as Chopo\'s full genotyping PCR.',
              es: 'Detección de genotipos de alto riesgo. No es lo mismo que el PCR de genotipificación completa de Chopo.',
            },
          },
          {
            label: { en: 'Gonorrhea PCR', es: 'Gonorrea PCR' },
            price: { en: '$1,328–$1,333 MXN', es: '$1,328–$1,333 MXN' },
            sourceUrl: 'https://mislaboratorio.com.mx/pruebas-de-ets/',
            sourceLabel: 'mislaboratorio.com.mx — Precios ITS',
            verifiedDate: '2026-02-26',
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // COMPREHENSIVE PCR
  // -------------------------------------------------------------------------
  {
    key: 'comprehensive',
    tier: 'comprehensive',
    heading: { en: 'Comprehensive PCR Panels', es: 'Paneles PCR Completos' },
    subheading: {
      en: 'For full confirmation or when you need precise pathogen identification. Chopo is Mexico\'s largest clinical lab network.',
      es: 'Para confirmación completa o cuando necesitas identificación precisa del patógeno. Chopo es la red de laboratorios clínicos más grande de México.',
    },
    providers: [
      {
        key: 'chopo',
        name: 'Laboratorio Médico del Chopo',
        tagline: {
          en: 'Largest private lab network in Mexico. Structured ITS panels with PCR precision. Online booking gets ~10% off.',
          es: 'La red de laboratorios privados más grande de México. Paneles ITS con precisión PCR. Reserva en línea con ~10% de descuento.',
        },
        locationInfo: {
          en: 'Hundreds of branches nationwide. Find nearest at chopo.com.mx.',
          es: 'Cientos de sucursales en todo el país. Encuentra la más cercana en chopo.com.mx.',
        },
        locationUrl: 'https://www.chopo.com.mx/',
        websiteUrl: 'https://www.chopo.com.mx/',
        prices: [
          {
            label: { en: 'HIV (4th gen Ag+Ab, most accurate)', es: 'VIH (4ª gen Ag+Ac, más preciso)' },
            price: { en: '$476 MXN', es: '$476 MXN' },
            sourceUrl: 'https://www.chopo.com.mx/metro/ac-a-virus-de-inmunodeficiencia-en-suero',
            sourceLabel: 'Chopo — VIH Anticuerpos',
            verifiedDate: '2026-02-26',
          },
          {
            label: { en: 'Syphilis (VDRL)', es: 'Sífilis (VDRL)' },
            price: { en: '$189 MXN', es: '$189 MXN' },
            sourceUrl: 'https://www.chopo.com.mx/v-d-r-l',
            sourceLabel: 'Chopo — VDRL',
            verifiedDate: '2026-02-26',
          },
          {
            label: {
              en: 'Basic ITS profile (HIV + syphilis)',
              es: 'Perfil ITS básico (VIH + sífilis)',
            },
            price: { en: '$839 MXN', es: '$839 MXN' },
            sourceUrl: 'https://www.chopo.com.mx/metro/perfil-de-infecciones-de-transmisio',
            sourceLabel: 'Chopo — Perfil ITS básico',
            verifiedDate: '2026-02-26',
          },
          {
            label: {
              en: 'Chlamydia + Gonorrhea (PCR combo)',
              es: 'Clamidia + Gonorrea (combo PCR)',
            },
            price: { en: '$1,092 MXN', es: '$1,092 MXN' },
            sourceUrl: 'https://www.chopo.com.mx/sinaloa//deteccion-de-c-trachomatis-y-n-gonorrhoeae',
            sourceLabel: 'Chopo — Clamidia + Gonorrea',
            verifiedDate: '2026-02-26',
          },
          {
            label: {
              en: 'Hepatitis A + B + C profile',
              es: 'Perfil hepatitis A + B + C',
            },
            price: { en: '$3,140 MXN', es: '$3,140 MXN' },
            sourceUrl: 'https://www.chopo.com.mx/perfil-de-hepatitis-a-b-c-12331',
            sourceLabel: 'Chopo — Perfil Hepatitis A+B+C',
            verifiedDate: '2026-02-26',
          },
          {
            label: {
              en: '14-pathogen STI panel (PCR)',
              es: 'Panel 14 patógenos ITS (PCR)',
            },
            price: { en: '$2,678 MXN', es: '$2,678 MXN' },
            sourceUrl: 'https://www.chopo.com.mx/metro/panel-enfermedades-transmision-sexual-14-patogenos',
            sourceLabel: 'Chopo — Panel 14 patógenos',
            verifiedDate: '2026-02-26',
            note: {
              en: 'Covers: Chlamydia, Gonorrhea, Syphilis, HIV-1/2, Herpes 1/2, HPV, Hepatitis B, Hepatitis C, Trichomoniasis, and more.',
              es: 'Incluye: Clamidia, Gonorrea, Sífilis, VIH-1/2, Herpes 1/2, VPH, Hepatitis B, Hepatitis C, Tricomoniasis y más.',
            },
          },
          {
            label: {
              en: '7-pathogen PCR multiplex (Trichomonas, MG, Chlamydia, Gonorrhea + more)',
              es: 'PCR multiplex 7 patógenos (Trichomonas, MG, Clamidia, Gonorrea + más)',
            },
            price: { en: '$5,054 MXN', es: '$5,054 MXN' },
            sourceUrl: 'https://www.chopo.com.mx/metro/panel-de-enfermedades-de-transmision-sexual-por-pcr',
            sourceLabel: 'Chopo — Panel ETS 7 patógenos PCR',
            verifiedDate: '2026-02-26',
            note: {
              en: 'Includes Mycoplasma genitalium — not available in basic panels.',
              es: 'Incluye Mycoplasma genitalium — no disponible en paneles básicos.',
            },
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatVerifiedDate(isoDate: string, lang: Lang): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
    month: 'short',
    year: 'numeric',
  });
}

const TIER_CONFIG = {
  free: {
    cssClass: 'cost-section--free',
    badgeClass: 'cost-section-badge--free',
    icon: <ShieldCheck className="w-4 h-4" aria-hidden="true" />,
  },
  affordable: {
    cssClass: 'cost-section--affordable',
    badgeClass: 'cost-section-badge--affordable',
    icon: <BadgeCheck className="w-4 h-4" aria-hidden="true" />,
  },
  comprehensive: {
    cssClass: 'cost-section--comprehensive',
    badgeClass: 'cost-section-badge--comprehensive',
    icon: <FlaskConical className="w-4 h-4" aria-hidden="true" />,
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TestingCostPage() {
  const { i18n } = useTranslation();
  const lang: Lang = i18n.language?.startsWith('es') ? 'es' : 'en';

  const metaTitle = lang === 'es'
    ? 'Costos de Pruebas de ITS en México — Navilla'
    : 'STI Testing Costs in Mexico — Navilla';
  const metaDescription = lang === 'es'
    ? 'Precios reales de pruebas de ITS en México: opciones gratuitas (CAPASITS, Clínica Condesa), laboratorios accesibles (Salud Digna, Marie Stopes) y paneles PCR completos (Chopo). Con fuentes y fechas de verificación.'
    : 'Real STI testing prices in Mexico: free options (CAPASITS, Clínica Condesa), affordable labs (Salud Digna, Marie Stopes), and comprehensive PCR panels (Chopo). With sources and verification dates.';

  return (
    <>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href="https://www.navilla.app/testing-cost" />
      <link rel="alternate" hrefLang="en" href="https://www.navilla.app/testing-cost" />
      <link rel="alternate" hrefLang="es" href="https://www.navilla.app/testing-cost" />
      <script type="application/ld+json">
        {JSON.stringify(buildWebPageLD({ name: metaTitle, description: metaDescription, url: 'https://www.navilla.app/testing-cost' }))}
      </script>

      <div className="cost-page">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="cost-hero landing-surface">
          <div className="container">
            <div className="cost-hero-inner">
              <div className="calculator-kicker">
                <FlaskConical className="w-4 h-4" aria-hidden="true" />
                <span>{lang === 'es' ? 'Costos de Pruebas' : 'Testing Costs'}</span>
              </div>
              <h1 className="calculator-title">
                {lang === 'es' ? 'Cuánto cuesta hacerse la prueba en México' : 'What STI testing costs in Mexico'}
              </h1>
              <p className="calculator-subtitle">
                {lang === 'es'
                  ? 'Precios reales de proveedores verificados — desde gratis hasta paneles PCR completos. Con fuentes y fechas.'
                  : 'Real prices from verified providers — from free to full PCR panels. With sources and dates.'}
              </p>
            </div>
          </div>
        </section>

        {/* ── Body ─────────────────────────────────────────────── */}
        <section className="container cost-body">

          {/* Disclaimer */}
          <div className="cost-disclaimer" role="note">
            <span className="cost-disclaimer-icon" aria-hidden="true">ⓘ</span>
            <p>
              {lang === 'es'
                ? 'Los precios son aproximados y pueden cambiar. Verifica con el proveedor antes de asistir. Mostramos la fuente y la fecha en que verificamos cada precio.'
                : 'Prices are approximate and may change. Verify with the provider before attending. We show the source and date we verified each price.'}
            </p>
          </div>

          {/* ── Sections ─────────────────────────────────────── */}
          {SECTIONS.map((section) => {
            const config = TIER_CONFIG[section.tier];
            return (
              <div key={section.key} className={`cost-section ${config.cssClass}`}>

                {/* Section header */}
                <div className="cost-section-header">
                  <div className={`cost-section-badge ${config.badgeClass}`}>
                    {config.icon}
                    <span>{section.heading[lang]}</span>
                  </div>
                  <p className="cost-section-subheading">{section.subheading[lang]}</p>
                </div>

                {/* Provider cards */}
                <div className="cost-providers">
                  {section.providers.map((provider) => (
                    <div key={provider.key} className="cost-provider-card">

                      {/* Provider header */}
                      <div className="cost-provider-header">
                        <div>
                          <h2 className="cost-provider-name">{provider.name}</h2>
                          <p className="cost-provider-tagline">{provider.tagline[lang]}</p>
                        </div>
                        <a
                          href={provider.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cost-provider-site-link"
                          aria-label={`${provider.name} website (opens in new tab)`}
                        >
                          {lang === 'es' ? 'Sitio web' : 'Website'}
                          <ExternalLink className="w-3 h-3 ml-1" aria-hidden="true" />
                        </a>
                      </div>

                      {/* Price list */}
                      <ul className="cost-price-list" role="list">
                        {provider.prices.map((entry, i) => (
                          <li key={i} className="cost-price-row">
                            <div className="cost-price-label">
                              <span>{entry.label[lang]}</span>
                              {entry.note && (
                                <span className="cost-price-note">{entry.note[lang]}</span>
                              )}
                            </div>
                            <div className="cost-price-right">
                              <span className={`cost-price-amount cost-price-amount--${section.tier}`}>
                                {entry.price[lang]}
                              </span>
                              <a
                                href={entry.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cost-price-source"
                                aria-label={`Source: ${entry.sourceLabel}`}
                              >
                                {entry.sourceLabel}
                                <ExternalLink className="w-2.5 h-2.5 ml-0.5 inline" aria-hidden="true" />
                              </a>
                              <span className="cost-price-verified">
                                <BadgeCheck className="w-3 h-3" aria-hidden="true" />
                                {lang === 'es' ? 'Verificado' : 'Verified'}{' '}
                                {formatVerifiedDate(entry.verifiedDate, lang)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* Location */}
                      <a
                        href={provider.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cost-provider-location"
                      >
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                        <span>{provider.locationInfo[lang]}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 ml-auto" aria-hidden="true" />
                      </a>

                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Cross-tool link */}
          <div className="calculator-clinic-cta">
            <div className="calculator-clinic-cta-inner">
              <div>
                <h3>{lang === 'es' ? '¿Sabes cuándo hacerte la prueba?' : 'Know when to get tested?'}</h3>
                <p>{lang === 'es'
                  ? 'Usa la calculadora de período de ventana para saber cuándo tus resultados serán confiables.'
                  : 'Use the window period calculator to know when your results will be reliable.'}
                </p>
              </div>
              <Link to="/calculator" className="btn btn-secondary">
                <FlaskConical className="w-4 h-4 mr-1" aria-hidden="true" />
                {lang === 'es' ? 'Ir a la calculadora' : 'Go to calculator'}
                <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <SignUpCTA
            titleEn="Log your tests and get reminders — free"
            titleEs="Registra tus pruebas y recibe recordatorios — gratis"
            bodyEn="Track your testing history and get reminders when it's time to retest."
            bodyEs="Lleva un registro de tus pruebas y recibe recordatorios cuando sea hora de repetir."
          />

        </section>
      </div>
    </>
  );
}
