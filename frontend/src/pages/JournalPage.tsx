import { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Plus, List, Calendar, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle, X } from 'lucide-react';
import { useJournalEntries, useJournalEntriesPaginated, useJournalMonths, useJournalSummary, useDeleteJournalEntry, usePromoteAlias } from '../hooks/useJournal';
import type { JournalEntry } from '../lib/api';
import { JournalTimeline } from '../components/journal/JournalTimeline';
import { JournalCalendar } from '../components/journal/JournalCalendar';
import { JournalEntryCard } from '../components/journal/JournalEntryCard';
import { JournalEmptyState } from '../components/journal/JournalEmptyState';
import { JournalEntryModal } from '../components/journal/JournalEntryModal';
import { JournalPartnersTab } from '../components/journal/JournalPartnersTab';
import { Pagination } from '../components/ui/Pagination';
import { MonthYearPicker } from '../components/journal/MonthYearPicker';
import { PageSkeleton, SkeletonBlock, SkeletonRows } from '../components/ui/LoadingShell';

type ViewMode = 'timeline' | 'calendar' | 'partners';

/** Format Date to "YYYY-MM" */
function toMonthKey(date: Date): string {
  const m = date.getMonth() + 1;
  return `${date.getFullYear()}-${m < 10 ? '0' : ''}${m}`;
}

interface PromoteState {
  alias: string;
  count: number;
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
  const [timelinePage, setTimelinePage] = useState(0);

  // Promotion toast state
  const [promoteState, setPromoteState] = useState<PromoteState | null>(null);
  const dismissedAliasesRef = useRef<Set<string>>(new Set());

  // Data hooks — timeline uses paginated, calendar uses per-month
  const calendarMonthKey = toMonthKey(calendarMonth);
  const { data: paginatedData, isLoading: timelineLoading, isFetching: timelineFetching } = useJournalEntriesPaginated(timelinePage);
  const { data: calendarEntries, isLoading: calendarLoading, isFetching: calendarFetching } = useJournalEntries(calendarMonthKey);
  const { data: monthsWithEntries } = useJournalMonths();
  const { data: summary } = useJournalSummary(currentYear);
  const deleteMutation = useDeleteJournalEntry();
  const promoteMutation = usePromoteAlias();

  const monthsList = useMemo(() => monthsWithEntries ?? [], [monthsWithEntries]);
  const timelineEntries = useMemo(() => paginatedData?.content ?? [], [paginatedData]);
  const calendarEntryList = useMemo(() => calendarEntries ?? [], [calendarEntries]);

  const isInitialLoading = viewMode === 'timeline'
    ? (timelineLoading && !paginatedData)
    : (calendarLoading && !calendarEntries);
  const isRefetching = viewMode === 'timeline'
    ? (timelineFetching && !timelineLoading)
    : (calendarFetching && !calendarLoading);

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

  const handleMonthNavigate = useCallback((year: number, monthIndex: number) => {
    setCalendarMonth(new Date(year, monthIndex, 1));
    setSelectedDate(null);
  }, []);

  const handleSkipPrev = useCallback(() => {
    const key = toMonthKey(calendarMonth);
    for (let i = monthsList.length - 1; i >= 0; i--) {
      if (monthsList[i] < key) {
        const [y, m] = monthsList[i].split('-').map(Number);
        setCalendarMonth(new Date(y, m - 1, 1));
        setSelectedDate(null);
        return;
      }
    }
  }, [calendarMonth, monthsList]);

  const handleSkipNext = useCallback(() => {
    const key = toMonthKey(calendarMonth);
    for (let i = 0; i < monthsList.length; i++) {
      if (monthsList[i] > key) {
        const [y, m] = monthsList[i].split('-').map(Number);
        setCalendarMonth(new Date(y, m - 1, 1));
        setSelectedDate(null);
        return;
      }
    }
  }, [calendarMonth, monthsList]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(null);
  }, []);

  // Promotion callback — uses timeline entries for approximation
  const handlePromote = useCallback(
    (alias: string) => {
      if (dismissedAliasesRef.current.has(alias.toLowerCase())) return;
      const matchCount =
        timelineEntries.filter(
          (e) => e.partnerAlias?.toLowerCase() === alias.toLowerCase() && !e.partnerId
        ).length + 1;
      if (matchCount >= 3) {
        setPromoteState({ alias, count: matchCount });
      }
    },
    [timelineEntries]
  );

  const handlePromoteConfirm = async () => {
    if (!promoteState) return;
    try {
      await promoteMutation.mutateAsync({ alias: promoteState.alias });
    } finally {
      dismissedAliasesRef.current.add(promoteState.alias.toLowerCase());
      setPromoteState(null);
    }
  };

  const handlePromoteDismiss = () => {
    if (promoteState) {
      dismissedAliasesRef.current.add(promoteState.alias.toLowerCase());
    }
    setPromoteState(null);
  };

  // Entries for the selected date in calendar view
  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return calendarEntryList.filter((e) => e.encounterDate === selectedDate);
  }, [calendarEntryList, selectedDate]);

  // Month label for the nav header
  const calendarMonthLabel = useMemo(() => {
    return calendarMonth.toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    });
  }, [calendarMonth, locale]);

  // Skip button disabled state
  const canSkipPrev = monthsList.some((k) => k < calendarMonthKey);
  const canSkipNext = monthsList.some((k) => k > calendarMonthKey);
  const isCurrentMonth = calendarMonthKey === toMonthKey(now);

  // Compute this-month count from summary
  const thisMonthKey = toMonthKey(now);
  const thisMonthCount = summary?.monthlyCounts?.[thisMonthKey] ?? 0;
  const yearTotal = summary?.yearTotal ?? 0;

  // Determine if there are any entries at all (for empty state)
  const hasAnyEntries = viewMode === 'timeline'
    ? (paginatedData ? paginatedData.totalElements > 0 : false)
    : calendarEntryList.length > 0 || monthsList.length > 0;

  if (isInitialLoading) {
    return (
      <PageSkeleton loadingLabel={t('common.loading')}>
        <SkeletonBlock className="h-12 rounded-2xl" />
        <SkeletonRows rows={4} />
      </PageSkeleton>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Promotion toast */}
      {promoteState && (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-sm text-indigo-800 flex-1">
            {t('journal.promotePrompt', {
              count: promoteState.count,
              alias: promoteState.alias,
            })}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePromoteConfirm}
              disabled={promoteMutation.isPending}
            >
              {promoteMutation.isPending ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="spinner" aria-hidden="true" />
                  {t('common.loading')}
                </span>
              ) : (
                t('journal.promoteYes')
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePromoteDismiss}
              disabled={promoteMutation.isPending}
            >
              {t('journal.promoteNotNow')}
            </button>
            <button
              type="button"
              className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
              onClick={handlePromoteDismiss}
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

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

      {/* Summary bar — moved to top */}
      {hasAnyEntries && (
        <div className="journal-summary-bar">
          <span>{t('journal.monthSummary', { count: thisMonthCount })}</span>
          <span className="text-muted mx-2">|</span>
          <span>{t('journal.yearTotal', { count: yearTotal })}</span>
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted uppercase tracking-wide">{t('journal.view')}</span>
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
        </div>
        <span className="w-px h-5 bg-stone-200" aria-hidden="true" />
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

      {/* Refetching indicator */}
      {isRefetching && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-primary)' }}>
          <span className="spinner" aria-hidden="true" />
          {t('common.loading')}
        </div>
      )}

      {/* Content */}
      {viewMode === 'partners' ? (
        <JournalPartnersTab />
      ) : viewMode === 'timeline' ? (
        !hasAnyEntries ? (
          <JournalEmptyState onAdd={handleAdd} />
        ) : (
          <>
            <JournalTimeline
              entries={timelineEntries}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              deletingId={deleteMutation.isPending ? deletingId : null}
            />
            {paginatedData && (
              <Pagination
                currentPage={paginatedData.number}
                totalPages={paginatedData.totalPages}
                totalElements={paginatedData.totalElements}
                pageSize={paginatedData.size}
                onPageChange={setTimelinePage}
              />
            )}
          </>
        )
      ) : (
        <div className="space-y-6">
          {/* Month navigation */}
          <div className="space-y-1">
            <nav className="journal-month-nav" aria-label={t('journal.calendar')}>
              <button
                type="button"
                className="journal-month-nav-btn journal-month-nav-skip"
                onClick={handleSkipPrev}
                disabled={!canSkipPrev}
                aria-label={t('journal.skipPrevMonth')}
              >
                <ChevronsLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="journal-month-nav-btn"
                onClick={handlePrevMonth}
                aria-label={t('journal.previousMonth')}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <MonthYearPicker
                currentMonth={calendarMonth}
                monthsWithEntries={monthsList}
                onNavigate={handleMonthNavigate}
                label={calendarMonthLabel}
              />
              <button
                type="button"
                className="journal-month-nav-btn"
                onClick={handleNextMonth}
                aria-label={t('journal.nextMonth')}
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="journal-month-nav-btn journal-month-nav-skip"
                onClick={handleSkipNext}
                disabled={!canSkipNext}
                aria-label={t('journal.skipNextMonth')}
              >
                <ChevronsRight className="w-4 h-4" aria-hidden="true" />
              </button>
              {!isCurrentMonth && (
                <button
                  type="button"
                  className="journal-month-nav-today"
                  onClick={handleToday}
                >
                  {t('journal.today')}
                </button>
              )}
            </nav>
            {!canSkipPrev && monthsList.length > 0 && (
              <p className="text-xs text-muted text-center">{t('journal.noEncountersBefore')}</p>
            )}
            {!canSkipNext && monthsList.length > 0 && (
              <p className="text-xs text-muted text-center">{t('journal.noEncountersAfter')}</p>
            )}
          </div>

          {/* Calendar grid */}
          <JournalCalendar
            entries={calendarEntryList}
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

      {/* Create/Edit modal */}
      <JournalEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
        onPromote={handlePromote}
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
