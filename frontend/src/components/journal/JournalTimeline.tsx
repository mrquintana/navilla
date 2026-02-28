import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { JournalEntry } from '../../lib/api';
import { JournalEntryCard } from './JournalEntryCard';

interface JournalTimelineProps {
  entries: JournalEntry[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  deletingId?: string | null;
  hidePartnerLink?: boolean;
  hidePartnerName?: boolean;
}

/**
 * Groups entries by month and renders them in a timeline.
 * Entries are expected to already be sorted newest-first from the API.
 */
export function JournalTimeline({ entries, onEdit, onDelete, deletingId, hidePartnerLink, hidePartnerName }: JournalTimelineProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language.replace('_', '-');

  const grouped = useMemo(() => {
    const groups: { key: string; label: string; entries: JournalEntry[] }[] = [];
    const groupMap = new Map<string, JournalEntry[]>();

    for (const entry of entries) {
      const date = new Date(entry.encounterDate + 'T00:00:00');
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(entry);
    }

    for (const [key, groupEntries] of groupMap) {
      const [year, month] = key.split('-');
      const date = new Date(Number(year), Number(month) - 1, 1);
      const label = date.toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      });
      groups.push({ key, label, entries: groupEntries });
    }

    return groups;
  }, [entries, locale]);

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <section key={group.key}>
          <h3 className="journal-month-header">{group.label}</h3>
          <div className="space-y-3">
            {group.entries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onEdit={onEdit}
                onDelete={onDelete}
                isDeleting={deletingId === entry.id}
                hidePartnerLink={hidePartnerLink}
                hidePartnerName={hidePartnerName}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
