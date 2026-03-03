import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Users } from 'lucide-react';
import { useJournalPartners } from '../../hooks/useJournal';
import { JournalPartnerCard } from './JournalPartnerCard';
import { CreatePartnerModal } from './CreatePartnerModal';

export function JournalPartnersTab() {
  const { t } = useTranslation();
  const { data: partners, isLoading } = useJournalPartners();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="spinner" aria-label={t('common.loading')} />
      </div>
    );
  }

  const list = partners ?? [];

  return (
    <div className="space-y-3">
      {/* Add Partner button — always visible */}
      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setModalOpen(true)}
        >
          <span className="inline-flex items-center gap-1">
            <Plus className="w-4 h-4" aria-hidden="true" />
            {t('journal.addPartner')}
          </span>
        </button>
      </div>

      {list.length === 0 ? (
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
      ) : (
        list.map((partner) => (
          <JournalPartnerCard key={partner.id} partner={partner} />
        ))
      )}

      {/* Create Partner Modal */}
      <CreatePartnerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
