import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Plus, List, Calendar, Users, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useJournalEntries, useJournalSummary, useDeleteJournalEntry } from '../hooks/useJournal';
import type { JournalEntry } from '../lib/api';
import { JournalTimeline } from '../components/journal/JournalTimeline';
import { JournalCalendar } from '../components/journal/JournalCalendar';
import { JournalEntryCard } from '../components/journal/JournalEntryCard';
import { JournalEmptyState } from '../components/journal/JournalEmptyState';
import { JournalEntryModal } from '../components/journal/JournalEntryModal';
import { JournalPartnersTab } from '../components/journal/JournalPartnersTab';
import { PageSkeleton, SkeletonBlock, SkeletonRows } from '../components/ui/LoadingShell';

type ViewMode = 'timeline' | 'calendar' | 'partners';

/** Format Date to "YYYY-MM" */
function toMonthKey(date: Date): string {
  const m = date.getMonth() + 1;
  return `${date.getFullYear()}-${m < 10 ? '0' : ''}${m}`;
}

export function JournalPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.replace('_', '-');
  const now = new Date();
  const currentYear = now.getFullYear();

  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: entries, isLoading: entriesLoading } = useJournalEntries();
  const { data: summary } = useJournalSummary(currentYear);
  const deleteMutation = useDeleteJournalEntry();

  const isInitialLoading = entriesLoading && !entries;

  const handleAdd = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setDeletingId(id);
  };

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId, {
      onSettled: () => setDeletingId(null),
    });
  };

  const handleDeleteCancel = () => {
    setDeletingId(null);
  };

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'timeline' || mode === 'partners') {
      setSelectedDate(null);
    }
  }, []);

  const handleDayClick = useCallback((date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  }, []);

  const handlePrevMonth = useCallback(() => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  }, []);

  const handleNextMonth = useCallback(() => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  }, []);

  // Entries filtered to the current calendar month
  const calendarMonthKey = toMonthKey(calendarMonth);
  const calendarEntries = useMemo(() => {
    if (!entries) return [];
    return entries.filter((e) => e.encounterDate.startsWith(calendarMonthKey));
  }, [entries, calendarMonthKey]);

  // Entries for the selected date in calendar view
  const selectedDateEntries = useMemo(() => {
    if (!selectedDate || !entries) return [];
    return entries.filter((e) => e.encounterDate === selectedDate);
  }, [entries, selectedDate]);

  // Month label for the nav header
  const calendarMonthLabel = useMemo(() => {
    return calendarMonth.toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    });
  }, [calendarMonth, locale]);

  // Compute this-month count from summary
  const thisMonthKey = toMonthKey(now);
  const thisMonthCount = summary?.monthlyCounts?.[thisMonthKey] ?? 0;
  const yearTotal = summary?.yearTotal ?? 0;

  if (isInitialLoading) {
    return (
      <PageSkeleton loadingLabel={t('common.loading')}>
        <SkeletonBlock className="h-12 rounded-2xl" />
        <SkeletonRows rows={4} />
      </PageSkeleton>
    );
  }

  const entryList = entries ?? [];

  return (
    <div className="container py-8 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{t('journal.title')}</h1>
            <span
              className="journal-encrypted-badge"
              title={t('journal.encryptedTooltip')}
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              {t('journal.encrypted')}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleAdd}
        >
          <span className="inline-flex items-center gap-1.5">
            <Plus className="nav-icon" aria-hidden="true" />
            {t('journal.addEntry')}
          </span>
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleViewModeChange('timeline')}
        >
          <span className="inline-flex items-center gap-1.5">
            <List className="nav-icon" aria-hidden="true" />
            {t('journal.timeline')}
          </span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleViewModeChange('calendar')}
        >
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="nav-icon" aria-hidden="true" />
            {t('journal.calendar')}
          </span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${viewMode === 'partners' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleViewModeChange('partners')}
        >
          <span className="inline-flex items-center gap-1.5">
            <Users className="nav-icon" aria-hidden="true" />
            {t('journal.partnersTab')}
          </span>
        </button>
      </div>

      {/* Content */}
      {viewMode === 'partners' ? (
        <JournalPartnersTab />
      ) : entryList.length === 0 ? (
        <JournalEmptyState onAdd={handleAdd} />
      ) : viewMode === 'timeline' ? (
        <JournalTimeline
          entries={entryList}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          deletingId={deleteMutation.isPending ? deletingId : null}
        />
      ) : (
        <div className="space-y-6">
          {/* Month navigation */}
          <nav className="journal-month-nav" aria-label={t('journal.calendar')}>
            <button
              type="button"
              className="journal-month-nav-btn"
              onClick={handlePrevMonth}
              aria-label={t('journal.previousMonth')}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="journal-month-nav-label">{calendarMonthLabel}</span>
            <button
              type="button"
              className="journal-month-nav-btn"
              onClick={handleNextMonth}
              aria-label={t('journal.nextMonth')}
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </nav>

          {/* Calendar grid */}
          <JournalCalendar
            entries={calendarEntries}
            currentMonth={calendarMonth}
            onDayClick={handleDayClick}
            selectedDate={selectedDate}
          />

          {/* Selected date entries */}
          {selectedDate && (
            <div className="space-y-3">
              <h3 className="journal-month-header">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString(locale, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              {selectedDateEntries.length === 0 ? (
                <p className="text-sm text-muted">{t('journal.noEntriesOnDate')}</p>
              ) : (
                selectedDateEntries.map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    isDeleting={deleteMutation.isPending && deletingId === entry.id}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary bar */}
      {entryList.length > 0 && (
        <div className="journal-summary-bar">
          <span>{t('journal.monthSummary', { count: thisMonthCount })}</span>
          <span className="text-muted mx-2">|</span>
          <span>{t('journal.yearTotal', { count: yearTotal })}</span>
        </div>
      )}

      {/* Create/Edit modal */}
      <JournalEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
      />

      {/* Delete confirmation modal */}
      {deletingId && !deleteMutation.isPending && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) handleDeleteCancel(); }}
        >
          <div className="modal" style={{ maxWidth: '380px' }}>
            <div className="flex items-start gap-3 mb-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">
                  {t('journal.deleteTitle')}
                </h3>
                <p className="text-sm text-muted mt-1">
                  {t('journal.deleteConfirm')}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDeleteCancel}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#dc3545', color: '#fff', borderColor: '#dc3545' }}
                onClick={handleDeleteConfirm}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
