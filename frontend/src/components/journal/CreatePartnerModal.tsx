import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useCreatePartner } from '../../hooks/useJournal';

interface CreatePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePartnerModal({ isOpen, onClose }: CreatePartnerModalProps) {
  const { t } = useTranslation();
  const createPartner = useCreatePartner();

  const [alias, setAlias] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAlias('');
      setNotes('');
      setError(null);
      createPartner.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = alias.trim();
    if (!trimmed) {
      setError(t('journal.errors.aliasRequired', 'Partner name is required'));
      return;
    }

    try {
      await createPartner.mutateAsync({ alias: trimmed, notes: notes.trim() || undefined });
      onClose();
    } catch {
      setError(t('journal.errors.createPartnerFailed', 'Failed to create partner'));
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="modal">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold">{t('journal.addPartner')}</h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-muted mb-4">
          {t('journal.createPartnerDescription')}
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Alias */}
          <div>
            <label className="label" htmlFor="partner-alias">
              {t('journal.partnerAlias')}
            </label>
            <input
              id="partner-alias"
              type="text"
              className="input"
              value={alias}
              maxLength={200}
              placeholder={t('journal.partnerAliasPlaceholder', 'Name or nickname')}
              onChange={(e) => setAlias(e.target.value)}
              autoFocus
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label" htmlFor="partner-notes">
              {t('journal.createPartnerNotes')}
            </label>
            <textarea
              id="partner-notes"
              className="input"
              rows={3}
              value={notes}
              maxLength={5000}
              placeholder={t('journal.partnerNotesPlaceholder')}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={createPartner.isPending}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createPartner.isPending}
            >
              {createPartner.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner" aria-hidden="true" />
                  {t('common.loading')}
                </span>
              ) : (
                t('journal.createPartner')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
