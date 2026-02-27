import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';

interface JournalEmptyStateProps {
  onAdd: () => void;
}

export function JournalEmptyState({ onAdd }: JournalEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
        <ShieldCheck className="w-8 h-8 text-primary" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {t('journal.empty.title')}
      </h3>
      <p className="text-muted text-sm max-w-md mb-8">
        {t('journal.empty.description')}
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={onAdd}
      >
        {t('journal.empty.cta')}
      </button>
    </div>
  );
}
