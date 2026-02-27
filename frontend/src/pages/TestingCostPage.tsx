import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DollarSign, AlertCircle } from 'lucide-react';
import { STI_DATA, STI_ORDER, PROVIDER_TIERS, type Lang, type CostTier, type ProviderKey } from '../lib/stiContent';

function renderTierLabel(tier: CostTier | undefined, lang: string): string {
  if (!tier) return '—';
  if (tier === 'free') return lang.startsWith('es') ? 'Gratis' : 'Free';
  if (tier === 'n/a') return 'N/A';
  return tier; // '$', '$$', '$$$'
}

/** Returns true when the viewport is mobile-width (≤640px). False in SSR / test. */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(max-width: 640px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

export function TestingCostPage() {
  const { i18n } = useTranslation();
  const lang: Lang = i18n.language?.startsWith('es') ? 'es' : 'en';
  const isMobile = useIsMobile();

  return (
    <>
      <title>
        {lang === 'es'
          ? 'Costos de Pruebas de ITS en México — Navilla'
          : 'STI Testing Costs in Mexico — Navilla'}
      </title>
      <meta
        name="description"
        content={
          lang === 'es'
            ? 'Costos aproximados de pruebas de ITS por tipo de proveedor en México. CAPASITS, IMSS, laboratorios privados y más.'
            : 'Approximate STI testing costs by provider type in Mexico. CAPASITS, IMSS, private labs, and more.'
        }
      />
      <link rel="canonical" href="https://www.navilla.app/testing-cost" />
      <link rel="alternate" hrefLang="en" href="https://www.navilla.app/testing-cost" />
      <link rel="alternate" hrefLang="es" href="https://www.navilla.app/testing-cost" />

      <div className="cost-page">
        {/* Hero */}
        <section className="cost-hero landing-surface">
          <div className="container">
            <div className="cost-hero-inner">
              <div className="calculator-kicker">
                <DollarSign className="w-4 h-4" aria-hidden="true" />
                <span>{lang === 'es' ? 'Costos de Pruebas' : 'Testing Costs'}</span>
              </div>
              <h1 className="calculator-title">
                {lang === 'es'
                  ? 'Costos de Pruebas de ITS en México'
                  : 'STI Testing Costs in Mexico'}
              </h1>
              <p className="calculator-subtitle">
                {lang === 'es'
                  ? 'Rangos aproximados por tipo de proveedor. Los costos varían según ubicación y disponibilidad.'
                  : 'Approximate cost tiers by provider type. Actual costs vary by location and availability.'}
              </p>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="container cost-body">
          {/* Disclaimer */}
          <div className="calculator-disclaimer" role="note">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              {lang === 'es'
                ? 'Los costos son aproximados y pueden cambiar. Verifica directamente con el proveedor antes de asistir.'
                : 'Costs are approximate and may change. Verify directly with the provider before attending.'}
            </p>
          </div>

          {/* Desktop table — hidden on mobile via CSS and conditional render */}
          {!isMobile && (
            <div className="cost-table-wrapper">
              <table
                className="cost-table"
                aria-label={
                  lang === 'es'
                    ? 'Costos de pruebas por proveedor'
                    : 'Testing costs by provider'
                }
              >
                <thead>
                  <tr>
                    <th scope="col">
                      {lang === 'es' ? 'Infección' : 'Infection'}
                    </th>
                    {PROVIDER_TIERS.map((tier) => (
                      <th key={tier.key} scope="col">
                        {tier.label[lang]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STI_ORDER.map((slug) => {
                    const sti = STI_DATA[slug];
                    return (
                      <tr key={slug}>
                        <td className="cost-cell-name">
                          <Link to={`/guide/${slug}`} className="cost-sti-link">
                            {sti.title[lang]}
                          </Link>
                        </td>
                        {PROVIDER_TIERS.map((tier) => {
                          const costValue = sti.costTiers?.[tier.key as ProviderKey];
                          return (
                            <td
                              key={tier.key}
                              className={`cost-cell cost-cell--${costValue ?? 'na'}`}
                            >
                              {renderTierLabel(costValue, lang)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile cards — only rendered when viewport is ≤640px */}
          {isMobile && (
            <div className="cost-cards">
              {STI_ORDER.map((slug) => {
                const sti = STI_DATA[slug];
                return (
                  <div key={slug} className="cost-card">
                    <h2 className="cost-card-title">
                      <Link to={`/guide/${slug}`}>{sti.title[lang]}</Link>
                    </h2>
                    <dl className="cost-card-list">
                      {PROVIDER_TIERS.map((tier) => {
                        const costValue = sti.costTiers?.[tier.key as ProviderKey];
                        return (
                          <div key={tier.key} className="cost-card-row">
                            <dt>{tier.label[lang]}</dt>
                            <dd className={`cost-cell cost-cell--${costValue ?? 'na'}`}>
                              {renderTierLabel(costValue, lang)}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                );
              })}
            </div>
          )}

          {/* Provider footnotes */}
          <div className="cost-footnotes">
            <h2 className="cost-footnotes-title">
              {lang === 'es' ? 'Tipos de Proveedores' : 'Provider Types'}
            </h2>
            <ul className="cost-footnotes-list">
              {PROVIDER_TIERS.map((tier) => (
                <li
                  key={tier.key}
                  className="cost-footnote-item"
                  data-label={tier.label[lang]}
                >
                  <p className="cost-footnote-desc">{tier.description[lang]}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Sources */}
          <div className="calculator-sources">
            <h3 className="calculator-sources-label">
              {lang === 'es' ? 'Fuentes' : 'Sources'}
            </h3>
            <ul className="calculator-sources-list">
              <li>
                <a
                  href="https://www.gob.mx/censida"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CENSIDA — ITS (México)
                </a>
              </li>
              <li>
                <a
                  href="https://www.imss.gob.mx"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  IMSS — Instituto Mexicano del Seguro Social
                </a>
              </li>
              <li>
                <a
                  href="https://www.gob.mx/salud"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Secretaría de Salud
                </a>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
