import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Share2, Download, Loader2 } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import type { VisualizationEngine, NetworkData } from '../../lib/visualization/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  engine: VisualizationEngine;
  data: NetworkData;
}

type IdentityOption = 'displayName' | 'username' | 'fullName' | 'anonymous';

export function ShareConstellationModal({ isOpen, onClose, engine, data }: Props) {
  if (!isOpen) return null;
  return createPortal(
    <ShareConstellationContent onClose={onClose} engine={engine} data={data} />,
    document.body,
  );
}

function ShareConstellationContent({
  onClose,
  engine,
  data,
}: Omit<Props, 'isOpen'>) {
  const { t } = useTranslation();
  const { data: profile } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const identityOptions = useMemo(() => {
    const options: { key: IdentityOption; label: string; value: string | null; enabled: boolean }[] = [
      {
        key: 'displayName',
        label: t('network.identityDisplayName'),
        value: profile?.displayName ?? null,
        enabled: !!profile?.displayName,
      },
      {
        key: 'username',
        label: t('network.identityUsername'),
        value: profile?.username ? `@${profile.username}` : null,
        enabled: !!profile?.username,
      },
      {
        key: 'fullName',
        label: t('network.identityFullName'),
        value: profile?.fullName ?? null,
        enabled: !!profile?.fullName,
      },
      {
        key: 'anonymous',
        label: t('network.identityAnonymous'),
        value: null,
        enabled: true,
      },
    ];
    return options;
  }, [profile, t]);

  const defaultSelection = useMemo(() => {
    const first = identityOptions.find((o) => o.enabled && o.key !== 'anonymous');
    return first?.key ?? 'anonymous';
  }, [identityOptions]);

  const [selectedIdentity, setSelectedIdentity] = useState<IdentityOption>(defaultSelection);

  // Sync default when profile loads
  useEffect(() => {
    setSelectedIdentity(defaultSelection);
  }, [defaultSelection]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const canNativeShare = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    if (!navigator.share) return false;
    try {
      return navigator.canShare?.({
        files: [new File([], 'test.png', { type: 'image/png' })],
      }) ?? false;
    } catch {
      return false;
    }
  }, []);

  const handleShareOrDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const selected = identityOptions.find((o) => o.key === selectedIdentity);
      const identityText = selected?.key === 'anonymous' ? null : (selected?.value ?? null);

      const stats = t('network.stats', {
        direct: data.directCount,
        extended: data.degree2Count + data.degree3Count,
        total: data.totalNodes,
      });

      const blob = await engine.exportImage({
        width: 1080,
        height: 1920,
        identityText,
        stageLabel: data.stageDisplayName,
        stats,
      });

      if (canNativeShare) {
        const file = new File([blob], 'constellation.png', { type: 'image/png' });
        await navigator.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'constellation.png';
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // User cancelled share dialog — not a real error
      if (err instanceof DOMException && err.name === 'AbortError') {
        // noop
      } else {
        setError(t('network.shareError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t('network.shareModalTitle')}
      onClick={handleBackdropClick}
    >
      <div
        className="modal overflow-y-auto"
        style={{ maxWidth: '420px', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold">{t('network.shareModalTitle')}</h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Identity Selection */}
        <fieldset className="mb-5">
          <legend className="label mb-2">{t('network.shareIdentity')}</legend>
          <div className="space-y-2">
            {identityOptions.map((option) => (
              <label
                key={option.key}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedIdentity === option.key
                    ? 'bg-indigo-50'
                    : 'hover:bg-stone-50'
                } ${!option.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="share-identity"
                  value={option.key}
                  checked={selectedIdentity === option.key}
                  disabled={!option.enabled}
                  onChange={() => setSelectedIdentity(option.key)}
                  className="accent-indigo-600 w-4 h-4"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {option.label}
                  </span>
                  {option.value && (
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {option.value}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Error */}
        {error && <div className="alert alert-error mb-4">{error}</div>}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('healthLog.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleShareOrDownload}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                {t('common.loading')}
              </span>
            ) : canNativeShare ? (
              <span className="inline-flex items-center gap-2">
                <Share2 className="w-4 h-4" aria-hidden="true" />
                {t('network.share')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Download className="w-4 h-4" aria-hidden="true" />
                {t('network.download')}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
