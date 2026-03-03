import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit2, Pill } from 'lucide-react';
import { useMedication, useAdherence } from '../hooks/useMedications';
import { MedicationModal } from '../components/reminders/MedicationModal';
import { PageSkeleton, SkeletonBlock } from '../components/ui/LoadingShell';

function currentMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1, 1).getDay();
}

export function MedicationDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const locale = i18n.language.replace('_', '-');

  const [month, setMonth] = useState(currentMonthISO);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: medication, isLoading: medLoading } = useMedication(id!);
  const { data: adherence, isLoading: adhLoading } = useAdherence(id!, month);

  // Build a set of taken/missed days for the calendar
  const dayStatusMap = useMemo(() => {
    const map = new Map<number, 'taken' | 'missed'>();
    if (!adherence?.logs) return map;
    for (const log of adherence.logs) {
      const day = new Date(log.scheduledFor + 'T00:00:00').getDate();
      map.set(day, log.taken ? 'taken' : 'missed');
    }
    return map;
  }, [adherence]);

  const isLoading = medLoading && !medication;

  if (isLoading) {
    return (
      <PageSkeleton loadingLabel={t('common.loading')}>
        <SkeletonBlock className="h-12 rounded-xl" />
        <SkeletonBlock className="h-24 rounded-xl" />
        <SkeletonBlock className="h-64 rounded-xl" />
      </PageSkeleton>
    );
  }

  if (!medication) {
    return (
      <div className="container py-8 text-center">
        <p className="text-muted">{t('common.notFound', 'Not found')}</p>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(month);
  const firstDayOfWeek = getFirstDayOfWeek(month);
  const today = new Date();
  const todayDay = today.getDate();
  const isCurrentMonth =
    month === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // Month navigation
  const [yearStr, monthStr] = month.split('-');
  const yearNum = parseInt(yearStr);
  const monthNum = parseInt(monthStr);
  const monthLabel = new Date(yearNum, monthNum - 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    const d = new Date(yearNum, monthNum - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const d = new Date(yearNum, monthNum, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const typeLabel = t(`medications.types.${medication.medicationType}`, medication.medicationType);
  const frequencyLabel = t(`medications.frequencies.${medication.frequency}`, medication.frequency);

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="p-1 rounded-md hover:bg-stone-100 transition-colors"
          onClick={() => navigate('/health-log')}
          aria-label={t('healthLog.backToHealthLog')}
        >
          <ChevronLeft className="w-5 h-5" style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{medication.name}</h1>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
            <span>{typeLabel}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{frequencyLabel}</span>
            {medication.dosage && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span>{medication.dosage}</span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setEditModalOpen(true)}
          aria-label={t('medications.edit')}
        >
          <Edit2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Stats card */}
      <div className="card" style={{ background: 'var(--color-background-secondary)' }}>
        <div className="text-center">
          {adherence ? (
            <>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                {Math.round(adherence.adherenceRate)}%
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {t('medications.adherence')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                {t('medications.takenCount', {
                  taken: adherence.takenCount,
                  total: adherence.totalDays,
                })}
              </p>
            </>
          ) : adhLoading ? (
            <span className="spinner" aria-label={t('common.loading')} />
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Pill className="w-5 h-5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {t('medications.adherence')}
              </p>
            </div>
          )}
        </div>

        {/* Adherence bar */}
        {adherence && (
          <div className="mt-3">
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--color-border-light)' }}
              role="progressbar"
              aria-valuenow={Math.round(adherence.adherenceRate)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('medications.adherenceRate', { rate: Math.round(adherence.adherenceRate) })}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${adherence.adherenceRate}%`,
                  background: adherence.adherenceRate >= 80
                    ? 'var(--color-success)'
                    : adherence.adherenceRate >= 50
                      ? 'var(--color-warning)'
                      : 'var(--color-error)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="card space-y-3">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={prevMonth}
            aria-label={t('common.previous', 'Previous')}
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <span className="text-sm font-semibold capitalize" style={{ color: 'var(--color-foreground)' }}>
            {monthLabel}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={nextMonth}
            aria-label={t('common.next', 'Next')}
          >
            <ChevronLeft className="w-4 h-4 rotate-180" aria-hidden="true" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 text-center text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const status = dayStatusMap.get(day);
            const isFuture = isCurrentMonth && day > todayDay;
            const isToday = isCurrentMonth && day === todayDay;

            let dotColor = 'transparent';
            if (status === 'taken') dotColor = 'var(--color-success)';
            else if (status === 'missed') dotColor = 'var(--color-error)';
            else if (isFuture) dotColor = 'transparent';
            // Past days with no log = gray
            else if (!isCurrentMonth || day < todayDay) dotColor = 'var(--color-border)';

            return (
              <div
                key={day}
                className="aspect-square flex flex-col items-center justify-center rounded-lg text-xs"
                style={{
                  color: isToday ? 'var(--color-primary)' : 'var(--color-foreground)',
                  fontWeight: isToday ? 700 : 400,
                  background: isToday ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                }}
              >
                <span>{day}</span>
                <div
                  className="w-1.5 h-1.5 rounded-full mt-0.5"
                  style={{ backgroundColor: dotColor }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dose log list */}
      {adherence && adherence.logs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
            {t('medications.logDose')}
          </h3>
          <div className="space-y-1">
            {[...adherence.logs].reverse().map((log) => {
              const dateFormatted = new Date(log.scheduledFor + 'T00:00:00').toLocaleDateString(locale, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg text-sm"
                  style={{
                    background: 'var(--color-background-secondary)',
                    color: 'var(--color-foreground)',
                  }}
                >
                  <span>{dateFormatted}</span>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: log.taken ? 'var(--color-success)' : 'var(--color-error)',
                    }}
                  >
                    {log.taken ? t('medications.taken') : t('medications.missed')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit modal */}
      <MedicationModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        medication={medication}
      />
    </div>
  );
}
