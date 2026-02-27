import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { useJournalPartners } from '../../hooks/useJournal';
import { JournalPartnerCard } from './JournalPartnerCard';

export function JournalPartnersTab() {
  const { t } = useTranslation();
  const { data: partners, isLoading } = useJournalPartners();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="spinner" aria-label={t('common.loading')} />
      </div>
    );
  }

  const list = partners ?? [];

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
          <Users className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {t('journal.noPartners')}
        </h3>
        <p className="text-muted text-sm max-w-md">
          {t('journal.noPartnersDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((partner) => (
        <JournalPartnerCard key={partner.id} partner={partner} />
      ))}
    </div>
  );
}
