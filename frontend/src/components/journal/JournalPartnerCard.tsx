import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import type { JournalPartner } from '../../lib/api';

interface JournalPartnerCardProps {
  partner: JournalPartner;
}

export function JournalPartnerCard({ partner }: JournalPartnerCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language.replace('_', '-');

  const lastDate = partner.mostRecentEncounterDate
    ? new Date(partner.mostRecentEncounterDate + 'T00:00:00').toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className="journal-entry-card cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/journal/partner/${partner.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/journal/partner/${partner.id}`);
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {partner.alias}
            </p>
            {partner.connectionDisplayName && (
              <span className="inline-flex items-center gap-1 text-xs text-primary bg-indigo-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                <Link2 className="w-3 h-3" aria-hidden="true" />
                {partner.connectionDisplayName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted">
              {t('journal.partnerEncounterCount', { count: partner.encounterCount })}
            </span>
            {lastDate && (
              <>
                <span className="text-muted text-xs">·</span>
                <span className="text-xs text-muted">
                  {t('journal.partnerLastEncounter')}: {lastDate}
                </span>
              </>
            )}
          </div>
        </div>
        <span className="text-muted shrink-0" aria-hidden="true">
          ›
        </span>
      </div>
    </div>
  );
}
