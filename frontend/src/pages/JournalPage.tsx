import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Plus, List, Calendar } from 'lucide-react';
import { useJournalEntries, useJournalSummary, useDeleteJournalEntry } from '../hooks/useJournal';
import type { JournalEntry } from '../lib/api';
import { JournalTimeline } from '../components/journal/JournalTimeline';
import { JournalEmptyState } from '../components/journal/JournalEmptyState';
import { JournalEntryModal } from '../components/journal/JournalEntryModal';
import { PageSkeleton, SkeletonBlock, SkeletonRows } from '../components/ui/LoadingShell';

type ViewMode = 'timeline' | 'calendar';

export function JournalPage() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

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

  const handleDelete = (id: string) => {
    if (window.confirm(t('journal.deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  // Compute this-month count from summary
  const monthKey = String(currentMonth);
  const thisMonthCount = summary?.monthlyCounts?.[monthKey] ?? 0;
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
          onClick={() => setViewMode('timeline')}
        >
          <span className="inline-flex items-center gap-1.5">
            <List className="nav-icon" aria-hidden="true" />
            {t('journal.timeline')}
          </span>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-secondary opacity-50 cursor-not-allowed"
          disabled
          title="Coming soon"
        >
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="nav-icon" aria-hidden="true" />
            {t('journal.calendar')}
          </span>
        </button>
      </div>

      {/* Content */}
      {entryList.length === 0 ? (
        <JournalEmptyState onAdd={handleAdd} />
      ) : (
        <JournalTimeline
          entries={entryList}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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
    </div>
  );
}
