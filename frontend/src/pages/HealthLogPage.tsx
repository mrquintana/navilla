import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Lock, Plus, HelpCircle, ExternalLink, Pill, Shield, Syringe, ChevronDown, Calendar, Edit3, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHealthLogSummary, useHealthLogVisits } from '../hooks/useHealthLog';
import { useMedications } from '../hooks/useMedications';
import { useVaccinations } from '../hooks/useVaccinations';
import { api } from '../lib/api';
import { getConditionInfo } from '../lib/conditionInfo';
import { sortExposureItems, getUrgencyConfig, getExposureCardStyle } from '../lib/exposureSort';
import { HealthLogStats } from '../components/health-log/HealthLogStats';
import { ConditionCard } from '../components/health-log/ConditionCard';
import { TestVisitModal } from '../components/health-log/TestVisitModal';
import { MedicationCard } from '../components/reminders/MedicationCard';
import { MedicationModal } from '../components/reminders/MedicationModal';
import { VaccinationSeriesCard } from '../components/reminders/VaccinationSeriesCard';
import { VaccinationModal } from '../components/reminders/VaccinationModal';
import { SkeletonBlock } from '../components/ui/LoadingShell';
import type { VaccineSeries } from '../lib/api';

type HealthTab = 'overview' | 'tests' | 'medications' | 'vaccines';

export function HealthLogPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<HealthTab>('overview');

  return (
    <div className="container py-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">{t('myHealth.title')}</h1>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t('healthLog.encrypted')}</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div
        className="flex border-b"
        style={{ borderColor: 'var(--color-border)' }}
        role="tablist"
        aria-label={t('myHealth.title')}
      >
        {(['overview', 'tests', 'medications', 'vaccines'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`tabpanel-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            {t(`myHealth.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div id={`tabpanel-${activeTab}`} role="tabpanel">
        {activeTab === 'overview' && <OverviewTabContent />}
        {activeTab === 'tests' && <TestsTabContent />}
        {activeTab === 'medications' && <MedicationsTabContent />}
        {activeTab === 'vaccines' && <VaccinesTabContent />}
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────

function OverviewTabContent() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const token = session?.access_token ?? '';

  const [showAllExposures, setShowAllExposures] = useState(false);
  const [showExposureInfo, setShowExposureInfo] = useState(false);

  const summaryQuery = useHealthLogSummary();
  const exposureQuery = useQuery({
    queryKey: ['exposures'],
    queryFn: () => api.exposures.get(token),
    enabled: !!token,
  });

  const summary = summaryQuery.data;
  const exposureItems = sortExposureItems(exposureQuery.data?.exposures ?? []);
  const exposureInitialLoading = exposureQuery.isLoading && !exposureQuery.data;
  const summaryLoading = summaryQuery.isLoading && !summaryQuery.data;
  const hasConditions = (summary?.conditions?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Exposure Overview */}
      <div className="card card-elevated space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">{t('healthLog.exposureOverview')}</h3>
            <p className="text-xs text-muted">{t('health.exposureHint')}</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowExposureInfo(true)}
            title={t('health.moreInfoTitle')}
          >
            <HelpCircle className="nav-icon" aria-hidden="true" />
          </button>
        </div>
        {exposureInitialLoading ? (
          <div role="status" aria-live="polite">
            <span className="sr-only">{t('common.loading')}</span>
            <SkeletonBlock className="h-5 w-48 rounded-full" />
            <div className="space-y-2 mt-3">
              <SkeletonBlock className="h-20 rounded-xl" />
              <SkeletonBlock className="h-20 rounded-xl" />
              <SkeletonBlock className="h-20 rounded-xl" />
            </div>
          </div>
        ) : exposureItems.length > 0 ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{t('health.exposureDetected')}</span>
              <span>
                {t('health.exposureUpdatedAt')}{' '}
                {exposureQuery.data?.computedAt
                  ? new Date(exposureQuery.data.computedAt).toLocaleDateString(i18n.language.replace('_', '-'), { year: 'numeric', month: 'short', day: 'numeric' })
                  : '\u2014'}
              </span>
            </div>
            {(showAllExposures ? exposureItems : exposureItems.slice(0, 6)).map(
              (item) => {
                const urgency = getUrgencyConfig(item);
                return (
                  <div key={item.condition} className="exposure-item" style={getExposureCardStyle(item)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-foreground">
                        <a
                          className="health-condition-link"
                          href={getConditionInfo(item.condition, i18n.language).url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.condition}
                          <ExternalLink className="nav-icon" aria-hidden="true" />
                        </a>
                      </div>
                      <span
                        className="inline-block text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ color: urgency.badgeColor, background: urgency.badgeBg }}
                      >
                        {t(urgency.labelKey)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>{t('health.exposureClosest', { degree: item.closestDegree })}</span>
                      <span>&bull;</span>
                      <span>{t('health.exposureCases')} {item.count}</span>
                    </div>
                    <p
                      className="text-xs text-muted cursor-help"
                      title={`${t(`dashboard.exposureStatusHint.${item.status}`)} \u00B7 ${t(`dashboard.exposureTimeframeHint.${item.timeframe}`)}`}
                    >
                      {t(`dashboard.exposureStatusLabels.${item.status}`)} &middot;{' '}
                      {t(`dashboard.exposureTimeframe.${item.timeframe}`)}
                    </p>
                  </div>
                );
              }
            )}
            {exposureItems.length > 6 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAllExposures((prev) => !prev)}
              >
                {showAllExposures ? t('health.showLess') : t('health.showAll')}
              </button>
            )}
          </div>
        ) : exposureQuery.data?.message ? (
          <p className="text-sm text-muted">{t(exposureQuery.data.message)}</p>
        ) : (
          <div className="text-center py-6">
            <Shield className="w-10 h-10 mx-auto mb-2 opacity-40" style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
            <p className="text-sm text-muted">{t('health.noExposure')}</p>
          </div>
        )}
      </div>

      {/* My Results */}
      <div className="space-y-3">
        <h3 className="font-semibold">{t('healthLog.myResults')}</h3>
        {summaryLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <SkeletonBlock className="h-20 rounded-xl" />
            <SkeletonBlock className="h-20 rounded-xl" />
            <SkeletonBlock className="h-20 rounded-xl" />
            <SkeletonBlock className="h-20 rounded-xl" />
          </div>
        ) : hasConditions ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {summary!.conditions.map((condition) => {
              const key = condition.conditionType ?? condition.customCondition ?? 'unknown';
              return <ConditionCard key={key} condition={condition} />;
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">{t('healthLog.noTests')}</p>
        )}
      </div>

      {/* Coverage text */}
      {summary && summary.conditionsCovered > 0 && (
        <p className="text-sm text-muted text-center">
          {t('healthLog.coverageDescription', {
            count: summary.conditionsCovered,
            total: summary.totalStandardConditions,
          })}
        </p>
      )}

      {/* Exposure Info Modal */}
      {showExposureInfo && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-semibold">{t('healthLog.exposureOverview')}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowExposureInfo(false)}
              >
                {t('common.close')}
              </button>
            </div>
            <p className="text-sm text-muted">
              {t('health.exposureInfo')
                .split(/(\*\*[^*]+\*\*)/g)
                .map((part, index) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                  }
                  return <span key={index}>{part}</span>;
                })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tests Tab ──────────────────────────────────────────────────────────

function TestsTabContent() {
  const { t, i18n } = useTranslation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<import('../lib/api').TestVisit | null>(null);
  const [showAllVisits, setShowAllVisits] = useState(false);

  const summaryQuery = useHealthLogSummary();
  const visitsQuery = useHealthLogVisits();

  const summary = summaryQuery.data;
  const summaryLoading = summaryQuery.isLoading && !summaryQuery.data;
  const visitsLoading = visitsQuery.isLoading && !visitsQuery.data;

  return (
    <div className="space-y-6">
      {/* Add Visit button */}
      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setModalOpen(true)}
        >
          <span className="inline-flex items-center gap-1">
            <Plus className="w-4 h-4" aria-hidden="true" />
            {t('healthLog.addVisit')}
          </span>
        </button>
      </div>

      {/* Stats bar */}
      {summaryLoading ? (
        <SkeletonBlock className="h-24 rounded-2xl" />
      ) : summary ? (
        <HealthLogStats summary={summary} />
      ) : null}

      {/* Visit History */}
      {visitsLoading ? (
        <div className="space-y-3">
          <SkeletonBlock className="h-5 w-40 rounded-full" />
          <SkeletonBlock className="h-14 rounded-xl" />
          <SkeletonBlock className="h-14 rounded-xl" />
          <SkeletonBlock className="h-14 rounded-xl" />
        </div>
      ) : visitsQuery.data && visitsQuery.data.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold">{t('healthLog.visitHistory.title')}</h3>
          <div className="space-y-2">
            {(showAllVisits
              ? [...visitsQuery.data].sort((a, b) => b.testDate.localeCompare(a.testDate))
              : [...visitsQuery.data].sort((a, b) => b.testDate.localeCompare(a.testDate)).slice(0, 5)
            ).map((visit) => (
              <div
                key={visit.id}
                className="card card-elevated flex items-center gap-3 p-3"
              >
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                  style={{ backgroundColor: 'var(--color-primary-light-bg)' }}
                >
                  <Calendar className="w-4 h-4" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {new Date(visit.testDate + 'T00:00:00').toLocaleDateString(i18n.language.replace('_', '-'), {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {visit.labName && <span>{visit.labName}</span>}
                    {visit.labName && visit.results.length > 0 && <span>&bull;</span>}
                    <span>
                      {t('healthLog.visitHistory.resultCount', { count: visit.results.length })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {visit.verified && (
                    <CheckCircle2
                      className="w-4 h-4"
                      style={{ color: 'var(--color-success)' }}
                      aria-label={t('healthLog.verified')}
                    />
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm p-1.5"
                    onClick={() => {
                      setEditingVisit(visit);
                      setModalOpen(true);
                    }}
                    aria-label={t('healthLog.editVisit')}
                  >
                    <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {visitsQuery.data.length > 5 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAllVisits((v) => !v)}
            >
              {showAllVisits
                ? t('healthLog.visitHistory.showLess')
                : t('healthLog.visitHistory.showAll')}
            </button>
          )}
        </div>
      ) : (
        <div className="card card-elevated text-center py-10 space-y-3">
          <p className="text-lg font-semibold text-foreground">{t('healthLog.noTests')}</p>
          <p className="text-sm text-muted">{t('healthLog.noTestsDescription')}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            <span className="inline-flex items-center gap-1">
              <Plus className="w-4 h-4" aria-hidden="true" />
              {t('healthLog.addVisit')}
            </span>
          </button>
        </div>
      )}

      {/* Test Visit Modal */}
      <TestVisitModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingVisit(null);
        }}
        editVisit={editingVisit}
      />
    </div>
  );
}

// ── Medications Tab ────────────────────────────────────────────────────

function MedicationsTabContent() {
  const { t } = useTranslation();
  const { data: medications, isLoading } = useMedications();
  const [modalOpen, setModalOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  if (isLoading && !medications) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="spinner" aria-label={t('common.loading')} />
      </div>
    );
  }

  const all = medications ?? [];
  const active = all.filter((m) => m.active);
  const inactive = all.filter((m) => !m.active);

  return (
    <div className="space-y-4">
      {/* Add Medication button */}
      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setModalOpen(true)}
        >
          <span className="inline-flex items-center gap-1">
            <Plus className="w-4 h-4" aria-hidden="true" />
            {t('medications.add')}
          </span>
        </button>
      </div>

      {all.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: 'var(--color-primary-light-bg)' }}
          >
            <Pill className="w-8 h-8" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {t('medications.noMedications')}
          </h3>
          <p className="text-muted text-sm max-w-md">
            {t('medications.noMedicationsDescription')}
          </p>
        </div>
      ) : (
        <>
          {/* Active medications */}
          {active.length > 0 && (
            <div className="space-y-2">
              {active.map((med) => (
                <MedicationCard key={med.id} medication={med} />
              ))}
            </div>
          )}

          {/* Inactive / past medications */}
          {inactive.length > 0 && (
            <div>
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium py-2"
                style={{ color: 'var(--color-muted)' }}
                onClick={() => setShowInactive((v) => !v)}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showInactive ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
                {t('medications.inactive')} ({inactive.length})
              </button>
              {showInactive && (
                <div className="space-y-2">
                  {inactive.map((med) => (
                    <MedicationCard key={med.id} medication={med} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Medication modal */}
      <MedicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

// ── Vaccines Tab ───────────────────────────────────────────────────────

function VaccinesTabContent() {
  const { t } = useTranslation();
  const { data: series, isLoading } = useVaccinations();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<VaccineSeries | null>(null);

  if (isLoading && !series) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="spinner" aria-label={t('common.loading')} />
      </div>
    );
  }

  const all = series ?? [];

  const handleLogDose = (s?: VaccineSeries) => {
    setSelectedSeries(s ?? null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Add Dose button */}
      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => handleLogDose()}
        >
          <span className="inline-flex items-center gap-1">
            <Plus className="w-4 h-4" aria-hidden="true" />
            {t('vaccinations.add')}
          </span>
        </button>
      </div>

      {all.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: 'var(--color-primary-light-bg)' }}
          >
            <Syringe className="w-8 h-8" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {t('vaccinations.noVaccinations')}
          </h3>
          <p className="text-muted text-sm max-w-md">
            {t('vaccinations.noVaccinationsDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {all.map((s) => (
            <VaccinationSeriesCard
              key={s.vaccineType}
              series={s}
              onLogDose={() => handleLogDose(s)}
            />
          ))}
        </div>
      )}

      {/* Vaccination modal */}
      <VaccinationModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSeries(null);
        }}
        existingSeries={selectedSeries}
      />
    </div>
  );
}
