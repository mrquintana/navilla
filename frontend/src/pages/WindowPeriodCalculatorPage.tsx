import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, FlaskConical } from 'lucide-react';
import { STI_DATA, STI_ORDER, type Lang } from '../lib/stiContent';

type Status = 'testable' | 'wait' | 'no-standard-test';

interface StatusResult {
  status: Status;
  daysWaited: number;
  daysUntilMin: number;
  readyDate: Date;
}

function getStatus(encounterDate: Date, today: Date, minDays: number, maxDays: number, noStandardTest?: boolean): StatusResult {
  const daysWaited = Math.floor((today.getTime() - encounterDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilMin = Math.max(0, minDays - daysWaited);
  const readyDate = new Date(encounterDate);
  readyDate.setDate(readyDate.getDate() + minDays);

  if (noStandardTest) {
    return { status: 'no-standard-test', daysWaited, daysUntilMin: 0, readyDate };
  }

  if (daysWaited >= minDays) {
    return { status: 'testable', daysWaited, daysUntilMin: 0, readyDate };
  }

  return { status: 'wait', daysWaited, daysUntilMin, readyDate };
}

function formatDate(date: Date, lang: Lang): string {
  return date.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function WindowPeriodCalculatorPage() {
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language.startsWith('es') ? 'es' : 'en';

  const [encounterDateStr, setEncounterDateStr] = useState('');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const encounterDate = encounterDateStr ? new Date(encounterDateStr + 'T00:00:00') : null;

  const isDateInFuture = encounterDate && encounterDate > today;
  const showResults = encounterDate && !isDateInFuture;

  const maxDate = todayString();

  return (
    <>
      <title>
        {lang === 'es'
          ? 'Calculadora de Período de Ventana — Navilla'
          : 'Window Period Calculator — Navilla'}
      </title>
      <meta
        name="description"
        content={
          lang === 'es'
            ? 'Calcula cuándo puedes hacerte la prueba de ITS después de una exposición. Basado en datos del CDC y la OMS.'
            : 'Calculate when you can get tested for STIs after an exposure. Based on CDC and WHO data.'
        }
      />
      <link rel="canonical" href="https://www.navilla.app/calculator" />
      <link rel="alternate" hrefLang="en" href="https://www.navilla.app/calculator" />
      <link rel="alternate" hrefLang="es" href="https://www.navilla.app/calculator" />

      <div className="calculator-page">
        {/* Hero section */}
        <section className="calculator-hero landing-surface">
          <div className="container">
            <div className="calculator-hero-inner">
              <div className="calculator-kicker">
                <FlaskConical className="w-4 h-4" aria-hidden="true" />
                <span>{t('calculator.kicker', 'Testing Tools')}</span>
              </div>
              <h1 className="calculator-title">{t('calculator.title', 'Window Period Calculator')}</h1>
              <p className="calculator-subtitle">
                {t(
                  'calculator.subtitle',
                  'Enter your encounter date to see when each STI becomes reliably testable.'
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Main content */}
        <section className="container calculator-body">
          {/* Disclaimer */}
          <div className="calculator-disclaimer" role="note" aria-label="Medical disclaimer">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p>{t('calculator.disclaimer', 'This tool is for informational purposes only and is not a substitute for medical advice. Consult a healthcare provider for personalized guidance.')}</p>
          </div>

          {/* Date picker card */}
          <div className="calculator-card">
            <label htmlFor="encounter-date" className="calculator-date-label">
              <Calendar className="w-5 h-5" aria-hidden="true" />
              {t('calculator.encounterDateLabel', 'When did the encounter happen?')}
            </label>
            <input
              id="encounter-date"
              type="date"
              className="calculator-date-input"
              value={encounterDateStr}
              max={maxDate}
              onChange={(e) => setEncounterDateStr(e.target.value)}
              aria-describedby="date-hint"
            />
            <p id="date-hint" className="calculator-date-hint">
              {t('calculator.dateHint', 'Select a date in the past to calculate your testing window.')}
            </p>
            {isDateInFuture && (
              <p className="calculator-date-error" role="alert">
                {t('calculator.futureDateError', 'Please select a date that has already passed.')}
              </p>
            )}
          </div>

          {/* Results table */}
          {showResults && (
            <div className="calculator-results" aria-live="polite" aria-label="Testing readiness results">
              <div className="calculator-results-header">
                <Clock className="w-5 h-5" aria-hidden="true" />
                <h2>{t('calculator.resultsTitle', 'Testing readiness')}</h2>
                <span className="calculator-days-badge">
                  {Math.floor((today.getTime() - encounterDate.getTime()) / (1000 * 60 * 60 * 24))}
                  {' '}
                  {t('calculator.daysAgo', 'days ago')}
                </span>
              </div>

              <div className="calculator-table-wrapper" role="table" aria-label="STI testing window results">
                <div role="rowgroup" className="calculator-table-head">
                  <div role="row" className="calculator-table-row calculator-table-row--header">
                    <span role="columnheader">{t('calculator.colCondition', 'Condition')}</span>
                    <span role="columnheader">{t('calculator.colWindow', 'Window')}</span>
                    <span role="columnheader">{t('calculator.colStatus', 'Status')}</span>
                  </div>
                </div>

                <div role="rowgroup">
                  {STI_ORDER.map((slug) => {
                    const sti = STI_DATA[slug];
                    const { windowPeriod } = sti;
                    const result = getStatus(encounterDate, today, windowPeriod.minDays, windowPeriod.maxDays, windowPeriod.noStandardTest);

                    return (
                      <div
                        key={slug}
                        role="row"
                        className={`calculator-table-row calculator-table-row--data calculator-table-row--${result.status}`}
                      >
                        <span role="cell" className="calculator-cell-condition">
                          <Link to={`/guide/${slug}`} className="calculator-condition-link">
                            {sti.title[lang]}
                          </Link>
                        </span>

                        <span role="cell" className="calculator-cell-window">
                          {windowPeriod.noStandardTest ? (
                            <span className="calculator-window-text">—</span>
                          ) : (
                            <span className="calculator-window-text">
                              {windowPeriod.minDays}–{windowPeriod.maxDays}{' '}
                              {lang === 'es' ? 'días' : 'days'}
                            </span>
                          )}
                        </span>

                        <span role="cell" className="calculator-cell-status">
                          <StatusBadge result={result} encounterDate={encounterDate} lang={lang} t={t} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="calculator-window-explainer">
                {t(
                  'calculator.windowExplainer',
                  'Window = earliest days after exposure for a reliable test. Results before this window may miss an active infection.'
                )}
              </p>
            </div>
          )}

          {/* Prompt when no date selected */}
          {!encounterDate && (
            <div className="calculator-empty-state" aria-hidden="true">
              <div className="calculator-empty-icon">
                <Calendar className="w-8 h-8" />
              </div>
              <p>{t('calculator.emptyState', 'Select a date above to see your testing timeline.')}</p>
            </div>
          )}

          {/* Find a clinic CTA */}
          <div className="calculator-clinic-cta">
            <div className="calculator-clinic-cta-inner">
              <div>
                <h3>{t('calculator.clinicCtaTitle', 'Ready to get tested?')}</h3>
                <p>{t('calculator.clinicCtaBody', 'Find an STI clinic or testing center near you.')}</p>
              </div>
              <a
                href="https://gettested.cdc.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                aria-label={t('calculator.findClinicCta', 'Find a clinic near you') + ' (opens in new tab)'}
              >
                {t('calculator.findClinicCta', 'Find a clinic near you')}
                <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Sources */}
          <div className="calculator-sources">
            <h3 className="calculator-sources-label">
              {t('calculator.sourcesLabel', 'Sources')}
            </h3>
            <ul className="calculator-sources-list">
              <li>
                <a href="https://www.cdc.gov/std/prevention/screeningreccs.htm" target="_blank" rel="noopener noreferrer">
                  CDC — STI Screening Recommendations
                </a>
              </li>
              <li>
                <a href="https://www.who.int/teams/global-hiv-hepatitis-and-stis-programmes/stis" target="_blank" rel="noopener noreferrer">
                  WHO — Sexually transmitted infections
                </a>
              </li>
              <li>
                <a href="https://www.gob.mx/censida" target="_blank" rel="noopener noreferrer">
                  CENSIDA — ITS (México)
                </a>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// StatusBadge component
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  result: StatusResult;
  encounterDate: Date;
  lang: Lang;
  t: (key: string, fallback: string, opts?: Record<string, unknown>) => string;
}

function StatusBadge({ result, encounterDate: _encounterDate, lang, t }: StatusBadgeProps) {
  if (result.status === 'no-standard-test') {
    return (
      <span className="status-badge status-badge--no-test">
        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
        {t('calculator.statusNoTest', 'No standard test')}
      </span>
    );
  }

  if (result.status === 'testable') {
    return (
      <span className="status-badge status-badge--testable">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
        {t('calculator.statusTestable', 'Testable now')}
      </span>
    );
  }

  // wait
  const readyDateStr = formatDate(result.readyDate, lang);
  return (
    <span className="status-badge status-badge--wait">
      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
      {t('calculator.statusWait', 'Ready {{date}}', { date: readyDateStr }).replace('{{date}}', readyDateStr)}
    </span>
  );
}
