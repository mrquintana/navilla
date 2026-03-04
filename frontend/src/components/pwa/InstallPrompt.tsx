import { useTranslation } from 'react-i18next';
import { Download, X } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export function InstallPrompt() {
  const { t } = useTranslation();
  const { canInstall, install, dismiss } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-primary/20 bg-white p-4 shadow-lg sm:left-auto sm:right-6 sm:max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">
            {t('pwa.installTitle')}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {t('pwa.installDescription')}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={install}
              className="btn btn-primary btn-sm text-xs"
            >
              {t('pwa.installButton')}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="btn btn-secondary btn-sm text-xs"
            >
              {t('pwa.installDismiss')}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-muted hover:text-foreground"
          aria-label={t('common.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
