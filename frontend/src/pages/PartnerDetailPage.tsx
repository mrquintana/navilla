import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Link2, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import {
  useJournalPartner,
  useJournalPartnerEntries,
  useUpdatePartner,
  useDeletePartner,
  useDeleteJournalEntry,
} from '../hooks/useJournal';
import type { JournalEntry } from '../lib/api';
import { JournalTimeline } from '../components/journal/JournalTimeline';
import { JournalEntryModal } from '../components/journal/JournalEntryModal';
import { PageSkeleton, SkeletonBlock, SkeletonRows } from '../components/ui/LoadingShell';

type DeleteMode = 'soft' | 'destructive' | null;

export function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language.replace('_', '-');

  const { data: partner, isLoading: partnerLoading } = useJournalPartner(id ?? '');
  const { data: entries, isLoading: entriesLoading } = useJournalPartnerEntries(id ?? '');
  const updateMutation = useUpdatePartner();
  const deleteMutation = useDeletePartner();
  const deleteEntryMutation = useDeleteJournalEntry();

  // Local overrides — null means "use server value"
  const [localNotes, setLocalNotes] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<DeleteMode>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Entry edit/delete state
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  if (!id) {
    return <Navigate to="/journal" replace />;
  }

  // Derive notes: local override if user has edited, otherwise server data
  const notes = localNotes ?? partner?.notes ?? '';
  const notesDirty = localNotes !== null;

  const isInitialLoading = (partnerLoading && !partner) || (entriesLoading && !entries);

  if (isInitialLoading) {
    return (
      <PageSkeleton loadingLabel={t('common.loading')}>
        <SkeletonBlock className="h-8 w-32 rounded-lg" />
        <SkeletonBlock className="h-12 rounded-2xl" />
        <SkeletonRows rows={3} />
      </PageSkeleton>
    );
  }

  if (!partner) {
    return (
      <div className="container py-8">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4"
          onClick={() => navigate('/journal')}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          {t('common.back')}
        </button>
        <p className="text-muted">{t('common.notFound')}</p>
      </div>
    );
  }

  const entryList = entries ?? [];
  const encounterCount = partner.encounterCount;

  const firstDate = partner.firstEncounterDate
    ? new Date(partner.firstEncounterDate + 'T00:00:00').toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const lastDate = partner.mostRecentEncounterDate
    ? new Date(partner.mostRecentEncounterDate + 'T00:00:00').toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const handleSaveNotes = () => {
    updateMutation.mutate(
      { id: partner.id, data: { notes } },
      {
        onSuccess: () => {
          setLocalNotes(null);
        },
      },
    );
  };

  const handleRename = () => {
    if (!renameValue.trim() || renameValue.trim() === partner.alias) {
      setIsRenaming(false);
      setRenameValue(partner.alias);
      return;
    }
    updateMutation.mutate(
      { id: partner.id, data: { alias: renameValue.trim() } },
      {
        onSuccess: () => {
          setIsRenaming(false);
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteMode) return;
    const deleteEntries = deleteMode === 'destructive';
    deleteMutation.mutate(
      { id: partner.id, deleteEntries },
      {
        onSuccess: () => {
          navigate('/journal');
        },
      },
    );
  };

  const confirmWord = t('journal.deletePartnerConfirmWord');
  const canConfirmDestructive = deleteConfirmText === confirmWord;

  // Handlers for entries within timeline
  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  const handleDeleteEntryRequest = (entryId: string) => {
    setDeletingEntryId(entryId);
  };

  const handleDeleteEntryConfirm = () => {
    if (!deletingEntryId) return;
    deleteEntryMutation.mutate(deletingEntryId, {
      onSettled: () => setDeletingEntryId(null),
    });
  };

  const handleDeleteEntryCancel = () => {
    setDeletingEntryId(null);
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Back link */}
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        onClick={() => navigate('/journal')}
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        {t('common.back')}
      </button>

      {/* Partner header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {isRenaming ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="input text-2xl font-bold py-1 px-2"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') {
                    setIsRenaming(false);
                    setRenameValue(partner.alias);
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleRename}
                disabled={updateMutation.isPending}
              >
                {t('common.save')}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsRenaming(false);
                  setRenameValue(partner.alias);
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <h1 className="text-3xl font-bold">{partner.alias}</h1>
          )}
          {partner.connectionDisplayName && (
            <span className="inline-flex items-center gap-1 text-xs text-primary bg-indigo-50 px-2 py-0.5 rounded-full mt-2">
              <Link2 className="w-3 h-3" aria-hidden="true" />
              {partner.connectionDisplayName}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {!isRenaming && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => { setRenameValue(partner.alias); setIsRenaming(true); }}
              title={t('journal.editPartner')}
              aria-label={t('journal.editPartner')}
            >
              <Pencil className="nav-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowDeleteModal(true)}
              title={t('journal.deletePartner')}
              aria-label={t('journal.deletePartner')}
            >
              <Trash2 className="nav-icon" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="journal-entry-card">
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="text-center flex-1">
            <p className="text-muted text-xs">{t('journal.partnerFirstEncounter')}</p>
            <p className="font-semibold text-foreground mt-0.5">{firstDate}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center flex-1">
            <p className="text-muted text-xs">{t('journal.partnerLastEncounter')}</p>
            <p className="font-semibold text-foreground mt-0.5">{lastDate}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center flex-1">
            <p className="font-semibold text-foreground">
              {t('journal.partnerEncounterCount', { count: encounterCount })}
            </p>
          </div>
        </div>
      </div>

      {/* Notes section */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{t('journal.partnerNotes')}</h2>
        <textarea
          className="input w-full min-h-[100px] resize-y"
          placeholder={t('journal.partnerNotesPlaceholder')}
          value={notes}
          onChange={(e) => {
            setLocalNotes(e.target.value);
          }}
        />
        {notesDirty && (
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveNotes}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <span className="spinner" aria-label={t('common.loading')} />
              ) : (
                t('common.save')
              )}
            </button>
          </div>
        )}
      </div>

      {/* Encounter timeline */}
      {entryList.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {t('journal.partnerEncounterCount', { count: encounterCount })}
          </h2>
          <JournalTimeline
            entries={entryList}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntryRequest}
            deletingId={deleteEntryMutation.isPending ? deletingEntryId : null}
            hidePartnerLink
            hidePartnerName
          />
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-partner-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false);
              setDeleteMode(null);
              setDeleteConfirmText('');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowDeleteModal(false);
              setDeleteMode(null);
              setDeleteConfirmText('');
            }
          }}
        >
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="flex items-start gap-3 mb-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />
              </span>
              <div>
                <h3 id="delete-partner-title" className="font-semibold text-foreground">
                  {t('journal.deletePartnerTitle')}
                </h3>
              </div>
            </div>

            {/* Option 1: Soft delete */}
            <div className="space-y-3 mb-4">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-stone-50 transition-colors">
                <input
                  type="radio"
                  name="deleteMode"
                  className="mt-1"
                  checked={deleteMode === 'soft'}
                  onChange={() => {
                    setDeleteMode('soft');
                    setDeleteConfirmText('');
                  }}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('journal.deletePartnerSoftLabel')}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {t('journal.deletePartnerSoftDescription')}
                  </p>
                </div>
              </label>

              {/* Option 2: Destructive delete */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-stone-50 transition-colors">
                <input
                  type="radio"
                  name="deleteMode"
                  className="mt-1"
                  checked={deleteMode === 'destructive'}
                  onChange={() => setDeleteMode('destructive')}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('journal.deletePartnerDestructiveLabel')}
                  </p>
                </div>
              </label>
            </div>

            {/* Destructive warning and confirmation */}
            {deleteMode === 'destructive' && (
              <div className="mb-4 space-y-3">
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {t('journal.deletePartnerDestructiveWarning', {
                    alias: partner.alias,
                    count: encounterCount,
                  })}
                </p>
                <div>
                  <label className="text-xs text-muted block mb-1">
                    {t('journal.deletePartnerTypeConfirm')}
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={confirmWord}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteMode(null);
                  setDeleteConfirmText('');
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#dc3545', color: '#fff', borderColor: '#dc3545' }}
                disabled={
                  !deleteMode ||
                  (deleteMode === 'destructive' && !canConfirmDestructive) ||
                  deleteMutation.isPending
                }
                onClick={handleDelete}
              >
                {deleteMutation.isPending ? (
                  <span className="spinner" aria-label={t('common.loading')} />
                ) : (
                  t('journal.deletePartner')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entry edit modal */}
      <JournalEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
      />

      {/* Entry delete confirmation modal */}
      {deletingEntryId && !deleteEntryMutation.isPending && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) handleDeleteEntryCancel(); }}
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
                onClick={handleDeleteEntryCancel}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#dc3545', color: '#fff', borderColor: '#dc3545' }}
                onClick={handleDeleteEntryConfirm}
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
