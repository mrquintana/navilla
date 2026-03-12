import { useTranslation } from 'react-i18next';
import { useInsights } from '../hooks/useInsights';
import { PageSkeleton, SkeletonBlock } from '../components/ui/LoadingShell';
import {
  Activity,
  TestTubes,
  ShieldCheck,
  Flame,
  Check,
  Clock,
  Bell,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { ReminderSettingsModal } from '../components/reminders/ReminderSettingsModal';

export function InsightsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useInsights();

  if (isLoading) {
    return (
      <PageSkeleton loadingLabel={t('common.loading')}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonBlock className="h-80 rounded-2xl" />
          <SkeletonBlock className="h-80 rounded-2xl" />
          <SkeletonBlock className="h-80 rounded-2xl" />
        </div>
      </PageSkeleton>
    );
  }

  const activity = data?.activity;
  const testing = data?.testing;
  const prevention = data?.prevention;

  return (
    <div className="container py-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('insights.title')}</h1>
        <p className="text-muted text-lg mt-1">{t('insights.subtitle')}</p>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Activity Summary */}
        <ActivityCard activity={activity} />

        {/* Testing Summary */}
        <TestingCard testing={testing} />

        {/* Prevention Summary */}
        <PreventionCard prevention={prevention} />
      </div>
    </div>
  );
}

/* ── Activity Card ─────────────────────────────────────── */

function ActivityCard({
  activity,
}: {
  activity:
    | {
        totalEncounters: number;
        encountersThisMonth: number;
        protectionRate: number;
        encounterTypeCounts: Record<string, number>;
        protectionMethodCounts: Record<string, number>;
      }
    | undefined;
}) {
  const { t } = useTranslation();

  const hasData = activity && activity.totalEncounters > 0;
  const protectionPct = activity ? Math.round(activity.protectionRate * 100) : 0;

  return (
    <div className="card card-elevated flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(99, 102, 241, 0.08)' }}
        >
          <Activity className="w-4 h-4" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t('insights.activity')}
        </h2>
      </div>

      {!hasData ? (
        <p className="text-sm text-muted">{t('insights.noEncounters')}</p>
      ) : (
        <div className="space-y-5 flex-1">
          {/* Big number */}
          <div>
            <p className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {activity.encountersThisMonth}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mt-1">
              {t('insights.encountersThisMonth')}
            </p>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{t('insights.totalEncounters')}</span>
            <span className="font-semibold">{activity.totalEncounters}</span>
          </div>

          {/* Protection rate */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted">{t('insights.protectionRate')}</span>
              <span className="font-semibold">{protectionPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-stone-200">
              <div
                className="h-2 rounded-full bg-indigo-500 transition-all"
                style={{ width: `${protectionPct}%` }}
                role="progressbar"
                aria-valuenow={protectionPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${t('insights.protectionRate')}: ${protectionPct}%`}
              />
            </div>
          </div>

          {/* Encounter types */}
          {Object.keys(activity.encounterTypeCounts).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                {t('insights.encounterTypes')}
              </p>
              <div className="space-y-1.5">
                {Object.entries(activity.encounterTypeCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{t(`journal.encounterTypes.${type}`, type)}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Protection methods */}
          {Object.keys(activity.protectionMethodCounts).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                {t('insights.protectionMethods')}
              </p>
              <div className="space-y-1.5">
                {Object.entries(activity.protectionMethodCounts).map(([method, count]) => (
                  <div key={method} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{t(`journal.protectionLabels.${method}`, method)}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Testing Card ──────────────────────────────────────── */

function TestingCard({
  testing,
}: {
  testing:
    | {
        daysSinceLastTest: number;
        testsThisYear: number;
        conditionsCovered: number;
        totalStandardConditions: number;
        coverageMap: Record<string, string>;
      }
    | undefined;
}) {
  const { t } = useTranslation();

  const hasData = testing && testing.daysSinceLastTest !== -1;
  const days = testing?.daysSinceLastTest ?? -1;

  const daysColor =
    days === -1
      ? 'text-muted'
      : days < 90
        ? 'text-green-600'
        : days <= 180
          ? 'text-amber-500'
          : 'text-red-500';

  const coveragePct =
    testing && testing.totalStandardConditions > 0
      ? Math.round((testing.conditionsCovered / testing.totalStandardConditions) * 100)
      : 0;

  return (
    <div className="card card-elevated flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(99, 102, 241, 0.08)' }}
        >
          <TestTubes className="w-4 h-4" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t('insights.testing')}
        </h2>
      </div>

      {!hasData && !testing ? (
        <p className="text-sm text-muted">{t('insights.noTests')}</p>
      ) : (
        <div className="space-y-5 flex-1">
          {/* Days since last test */}
          <div>
            <p className={`text-4xl font-bold ${daysColor}`}>
              {days === -1 ? '--' : days}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mt-1">
              {days === -1 ? t('insights.neverTested') : t('insights.daysSinceTest')}
            </p>
          </div>

          {/* Tests this year */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{t('insights.testsThisYear')}</span>
            <span className="font-semibold">{testing?.testsThisYear ?? 0}</span>
          </div>

          {/* Condition coverage */}
          {testing && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted">{t('insights.conditionCoverage')}</span>
                <span className="font-semibold">
                  {testing.conditionsCovered}/{testing.totalStandardConditions}
                </span>
              </div>
              <div className="h-2 rounded-full bg-stone-200">
                <div
                  className="h-2 rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${coveragePct}%` }}
                  role="progressbar"
                  aria-valuenow={coveragePct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${t('insights.conditionCoverage')}: ${testing.conditionsCovered}/${testing.totalStandardConditions}`}
                />
              </div>
            </div>
          )}

          {/* Coverage grid */}
          {testing && Object.keys(testing.coverageMap).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                {t('insights.coverageStatus')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(testing.coverageMap).map(([condition, status]) => {
                  const bgColor =
                    status === 'NEGATIVE'
                      ? 'bg-green-100 text-green-700'
                      : status === 'POSITIVE'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-stone-100 text-stone-500';
                  return (
                    <span
                      key={condition}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${bgColor}`}
                      title={`${t(`healthLog.conditions.${condition}`, condition)}: ${status}`}
                    >
                      {t(`healthLog.conditions.${condition}`, condition)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Prevention Card ───────────────────────────────────── */

function PreventionCard({
  prevention,
}: {
  prevention:
    | {
        prepAdherenceRate: number | null;
        currentPrepStreakDays: number;
        longestPrepStreakDays: number;
        completedVaccines: string[];
        pendingVaccines: string[];
        activeReminders: number;
      }
    | undefined;
}) {
  const { t } = useTranslation();
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  const hasPrepData = prevention?.prepAdherenceRate != null;
  const adherencePct = hasPrepData ? Math.round(prevention!.prepAdherenceRate! * 100) : 0;
  const currentStreak = prevention?.currentPrepStreakDays ?? 0;
  const longestStreak = prevention?.longestPrepStreakDays ?? 0;

  const milestones = [
    { label: '7d', threshold: 7 },
    { label: '30d', threshold: 30 },
    { label: '90d', threshold: 90 },
  ];

  const hasVaccines =
    (prevention?.completedVaccines?.length ?? 0) > 0 ||
    (prevention?.pendingVaccines?.length ?? 0) > 0;

  return (
    <div className="card card-elevated flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(99, 102, 241, 0.08)' }}
        >
          <ShieldCheck className="w-4 h-4" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t('insights.prevention')}
        </h2>
      </div>

      <div className="space-y-5 flex-1">
        {/* PrEP Adherence */}
        {hasPrepData ? (
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted">{t('insights.prepAdherence')}</span>
              <span className="font-semibold">{adherencePct}%</span>
            </div>
            <div className="h-2 rounded-full bg-stone-200">
              <div
                className="h-2 rounded-full bg-indigo-500 transition-all"
                style={{ width: `${adherencePct}%` }}
                role="progressbar"
                aria-valuenow={adherencePct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${t('insights.prepAdherence')}: ${adherencePct}%`}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">{t('insights.noPrepData')}</p>
        )}

        {/* PrEP Streak */}
        {hasPrepData && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <span className="text-sm font-semibold">
                  {t('insights.days', { count: currentStreak })}
                </span>
              </div>
              <p className="text-xs text-muted">{t('insights.currentStreak')}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{t('insights.days', { count: longestStreak })}</p>
              <p className="text-xs text-muted">{t('insights.longestStreak')}</p>
            </div>
          </div>
        )}

        {/* Streak milestones */}
        {hasPrepData && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              {t('insights.streakMilestones')}
            </p>
            <div className="flex gap-2">
              {milestones.map((m) => {
                const achieved = longestStreak >= m.threshold;
                return (
                  <span
                    key={m.label}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      achieved
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {m.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Vaccinations */}
        {hasVaccines ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              {t('insights.vaccines')}
            </p>
            <div className="space-y-1.5">
              {prevention!.completedVaccines.map((v) => (
                <div key={v} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                  <span>{t(`vaccinations.types.${v}`, v)}</span>
                  <span className="text-xs text-muted">({t('insights.vaccinesCompleted')})</span>
                </div>
              ))}
              {prevention!.pendingVaccines.map((v) => (
                <div key={v} className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" aria-hidden="true" />
                  <span>{t(`vaccinations.types.${v}`, v)}</span>
                  <span className="text-xs text-muted">({t('insights.vaccinesPending')})</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">{t('insights.noVaccines')}</p>
        )}

        {/* Active reminders */}
        {prevention && prevention.activeReminders > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Bell className="w-4 h-4" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
            <span className="text-muted">{t('insights.activeReminders')}:</span>
            <span className="font-semibold">{prevention.activeReminders}</span>
            <button
              onClick={() => setShowReminderSettings(true)}
              className="ml-auto p-1 rounded-md text-muted hover:text-foreground hover:bg-secondary transition-colors"
              aria-label={t('reminders.settings')}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <ReminderSettingsModal
        isOpen={showReminderSettings}
        onClose={() => setShowReminderSettings(false)}
      />
    </div>
  );
}
