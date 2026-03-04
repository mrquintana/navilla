import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';

export function PwaUpdatePrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        // Check for updates every hour
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-primary/20 bg-white p-4 shadow-lg sm:left-auto sm:right-6 sm:max-w-sm"
    >
      <div className="flex items-center gap-3">
        <RefreshCw className="h-5 w-5 shrink-0 text-primary" />
        <p className="flex-1 text-sm text-foreground">
          {t('pwa.updateAvailable')}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="btn btn-primary btn-sm text-xs"
          >
            {t('pwa.updateButton')}
          </button>
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            className="btn btn-secondary btn-sm text-xs"
          >
            {t('pwa.updateDismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}
