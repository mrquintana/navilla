import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import type { JournalEntry } from '../../lib/api';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function JournalEntryCard({ entry, onEdit, onDelete, isDeleting }: JournalEntryCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.replace('_', '-');

  const encounterDate = new Date(entry.encounterDate + 'T00:00:00');
  const formattedDate = encounterDate.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
  const fullDate = encounterDate.toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const partner = entry.partnerAlias || entry.connectionDisplayName;
  const notesPreview = entry.notes
    ? entry.notes.length > 120
      ? entry.notes.slice(0, 120) + '...'
      : entry.notes
    : null;

  const customFields = entry.customFields ?? [];

  return (
    <div className={`journal-entry-card${isDeleting ? ' journal-entry-card--deleting' : ''}`}>
      {/* Mobile: stacked layout. Desktop: row layout */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4 min-w-0">
          {/* Date */}
          <span
            className="text-sm font-semibold text-primary whitespace-nowrap pt-0.5"
            title={fullDate}
          >
            {formattedDate}
          </span>

          {/* Content */}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {partner || (
                <span className="text-muted italic">
                  {t('journal.anonymous')}
                </span>
              )}
            </p>
            {notesPreview && (
              <p className="text-xs text-muted mt-0.5 line-clamp-2">
                {notesPreview}
              </p>
            )}
            {customFields.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {customFields.map((cf, i) => (
                  <span key={i} className="journal-custom-field-chip">
                    <span className="journal-custom-field-label">{cf.label}</span>
                    <span className="journal-custom-field-value">{cf.value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isDeleting ? (
            <span className="spinner" aria-label={t('common.loading')} />
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onEdit(entry)}
                title={t('common.edit')}
                aria-label={t('common.edit')}
              >
                <Pencil className="nav-icon" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onDelete(entry.id)}
                title={t('common.delete')}
                aria-label={t('common.delete')}
              >
                <Trash2 className="nav-icon" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
