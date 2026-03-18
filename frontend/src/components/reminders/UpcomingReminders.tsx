import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pill, Syringe, ClipboardCheck, Bell, Check, Clock, Settings } from 'lucide-react';
import {
  useUpcomingReminders,
  useCompleteReminder,
  useSnoozeReminder,
} from '../../hooks/useReminders';
import type { Reminder } from '../../lib/api';
import { ReminderSettingsModal } from './ReminderSettingsModal';

function getRelativeTime(scheduledFor: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduled = new Date(scheduledFor);
  scheduled.setHours(0, 0, 0, 0);

  const diffMs = scheduled.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return t('myHealth.upcoming.overdue');
  if (diffDays === 0) return t('myHealth.upcoming.dueToday');
  if (diffDays === 1) return t('myHealth.upcoming.dueTomorrow');
  return t('myHealth.upcoming.dueInDays', { count: diffDays });
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

interface ReminderCardProps {
  reminder: Reminder;
}

function ReminderIcon({ type }: { type: string }) {
  switch (type) {
    case 'MEDICATION':
      return <Pill className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />;
    case 'VACCINATION':
      return <Syringe className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />;
    case 'TESTING':
      return <ClipboardCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />;
    default:
      return <Bell className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />;
  }
}

function ReminderCard({ reminder }: ReminderCardProps) {
  const { t } = useTranslation();
  const completeMutation = useCompleteReminder();
  const snoozeMutation = useSnoozeReminder();

  const relativeTime = getRelativeTime(reminder.scheduledFor, t);

  const isOverdue = new Date(reminder.scheduledFor) < new Date(new Date().toISOString().split('T')[0]);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeMutation.mutate(reminder.id);
  };

  const handleSnooze = (e: React.MouseEvent) => {
    e.stopPropagation();
    snoozeMutation.mutate({ id: reminder.id, until: tomorrowISO() });
  };

  return (
    <div
      className="flex-shrink-0 rounded-xl border p-3 w-52"
      style={{
        borderColor: isOverdue ? 'var(--color-error)' : 'var(--color-border-light)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(79, 70, 229, 0.012))',
      }}
    >
      <div className="flex items-start gap-2 mb-2">
        <ReminderIcon type={reminder.reminderType} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>
            {reminder.title}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: isOverdue ? 'var(--color-error)' : 'var(--color-muted)' }}
          >
            {relativeTime}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn btn-sm flex-1"
          style={{
            padding: '0.5rem',
            color: 'var(--color-success)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.375rem',
            background: 'transparent',
          }}
          onClick={handleComplete}
          disabled={completeMutation.isPending}
          title={t('reminders.markDone')}
          aria-label={t('reminders.markDone')}
        >
          <Check className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-sm flex-1"
          style={{
            padding: '0.5rem',
            color: 'var(--color-muted)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.375rem',
            background: 'transparent',
          }}
          onClick={handleSnooze}
          disabled={snoozeMutation.isPending}
          title={t('reminders.snooze')}
          aria-label={t('reminders.snooze')}
        >
          <Clock className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function UpcomingReminders() {
  const { t } = useTranslation();
  const { data: reminders, isLoading } = useUpcomingReminders(14);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const items = reminders ?? [];

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
          {t('myHealth.upcoming.title')}
        </h2>
        <button
          type="button"
          className="p-1 rounded-md hover:bg-stone-100 transition-colors"
          onClick={() => setSettingsOpen(true)}
          title={t('reminders.settings')}
          aria-label={t('reminders.settings')}
        >
          <Settings className="w-4 h-4" style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <span className="spinner" aria-label={t('common.loading')} />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-center py-2" style={{ color: 'var(--color-muted)' }}>
          {t('myHealth.upcoming.noReminders')}
        </p>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          {items.slice(0, 10).map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}

      {/* Settings modal */}
      <ReminderSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
