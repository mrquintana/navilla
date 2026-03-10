import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Copy, Check, Trash2, Pencil, QrCode, Share2, Plus, X, Loader2 } from 'lucide-react';
import { api, type HealthStatus, type VerificationCardResponse } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import {
  useVerificationCards,
  useCreateVerificationCard,
  useUpdateVerificationCard,
  useDeleteVerificationCard,
} from '../hooks/useVerificationCards';

export function VerificationCardPage() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const token = session?.access_token ?? '';
  const locale = i18n.language.replace('_', '-');

  const cardsQuery = useVerificationCards();
  const createMutation = useCreateVerificationCard();
  const updateMutation = useUpdateVerificationCard();
  const deleteMutation = useDeleteVerificationCard();

  const healthQuery = useQuery<HealthStatus[]>({
    queryKey: ['healthStatuses'],
    queryFn: () => api.health.list(token),
    enabled: !!token,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<VerificationCardResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const openCreate = () => {
    setEditingCard(null);
    setIsModalOpen(true);
  };

  const openEdit = (card: VerificationCardResponse) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleCopy = async (card: VerificationCardResponse) => {
    try {
      await navigator.clipboard.writeText(card.shareUrl);
      setCopiedId(card.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback: clipboard not available
    }
  };

  const handleShare = async (card: VerificationCardResponse) => {
    if (navigator.share) {
      try {
        await navigator.share({ url: card.shareUrl, title: t('verificationCard.title') });
      } catch {
        // User cancelled
      }
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, { onSuccess: () => setDeleteConfirmId(null) });
  };

  const cards = cardsQuery.data ?? [];

  return (
    <div className="page-container">
      <div className="page-header mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary" aria-hidden="true" />
          <div>
            <h1 className="font-semibold text-lg">{t('verificationCard.title')}</h1>
            <p className="text-sm text-muted">{t('verificationCard.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Create button */}
      <div className="mb-6">
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t('verificationCard.createCard')}
        </button>
      </div>

      {/* Cards list */}
      {cardsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="card card-elevated animate-pulse h-24" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="card card-elevated text-center py-12">
          <ShieldCheck className="w-12 h-12 text-muted mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-medium">{t('verificationCard.noCards')}</p>
          <p className="text-xs text-muted mt-1">{t('verificationCard.noCardsHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <div key={card.id} className="card card-elevated">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                    <span className="font-semibold text-sm truncate">
                      {card.displayName || t('publicCard.anonymous')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{card.includedConditions.length} {t('publicCard.condition').toLowerCase()}s</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>{t('verificationCard.views', { count: card.currentViews })}</span>
                    {card.maxViews && (
                      <>
                        <span aria-hidden="true">/</span>
                        <span>{card.maxViews}</span>
                      </>
                    )}
                    {card.expiresAt && (
                      <>
                        <span aria-hidden="true">&middot;</span>
                        <span>{t('verificationCard.expiresAt')}: {new Date(card.expiresAt).toLocaleDateString(locale)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(card)}
                  title={t('verificationCard.copyLink')}
                >
                  {copiedId === card.id ? (
                    <><Check className="w-3.5 h-3.5" aria-hidden="true" /> {t('verificationCard.linkCopied')}</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" aria-hidden="true" /> {t('verificationCard.copyLink')}</>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setQrUrl(card.shareUrl)}
                  title={t('verificationCard.showQR')}
                >
                  <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('verificationCard.showQR')}
                </button>
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleShare(card)}
                  >
                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('verificationCard.nativeShare')}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => openEdit(card)}
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('verificationCard.editCard')}
                </button>
                {deleteConfirmId === card.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">{t('verificationCard.deleteConfirm')}</span>
                    <button type="button" className="btn btn-sm text-red-600" onClick={() => handleDelete(card.id)}>
                      {t('common.confirm')}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirmId(null)}>
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm text-red-500"
                    onClick={() => setDeleteConfirmId(card.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('verificationCard.deleteCard')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <CardFormModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingCard(null); }}
          editingCard={editingCard}
          healthStatuses={healthQuery.data ?? []}
          createMutation={createMutation}
          updateMutation={updateMutation}
        />
      )}

      {/* QR Modal */}
      {qrUrl && (
        <QRModal url={qrUrl} onClose={() => setQrUrl(null)} />
      )}
    </div>
  );
}

// ── Card Form Modal ──

interface CardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCard: VerificationCardResponse | null;
  healthStatuses: HealthStatus[];
  createMutation: ReturnType<typeof useCreateVerificationCard>;
  updateMutation: ReturnType<typeof useUpdateVerificationCard>;
}

function CardFormModal({ onClose, editingCard, healthStatuses, createMutation, updateMutation }: CardFormModalProps) {
  const { t } = useTranslation();

  const [displayName, setDisplayName] = useState(editingCard?.displayName ?? '');
  const [selectedConditions, setSelectedConditions] = useState<Set<string>>(
    new Set(editingCard?.includedConditions ?? [])
  );
  const [showTestDates, setShowTestDates] = useState(editingCard?.showTestDates ?? false);
  const [showVerificationLevel, setShowVerificationLevel] = useState(editingCard?.showVerificationLevel ?? true);
  const [maxViews, setMaxViews] = useState<string>(editingCard?.maxViews?.toString() ?? '');
  const [expiresAt, setExpiresAt] = useState(editingCard?.expiresAt?.split('T')[0] ?? '');

  const isEditing = !!editingCard;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev => {
      const next = new Set(prev);
      if (next.has(condition)) next.delete(condition);
      else next.add(condition);
      return next;
    });
  };

  const handleSave = () => {
    const data = {
      displayName: displayName.trim() || undefined,
      includedConditions: Array.from(selectedConditions),
      showTestDates,
      showVerificationLevel,
      maxViews: maxViews ? parseInt(maxViews, 10) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt + 'T23:59:59Z').toISOString() : undefined,
    };

    if (isEditing) {
      updateMutation.mutate({ id: editingCard!.id, data }, { onSuccess: onClose });
    } else {
      createMutation.mutate(data, { onSuccess: onClose });
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const uniqueConditions = useMemo(() => {
    const seen = new Set<string>();
    return healthStatuses.filter(hs => {
      if (seen.has(hs.condition)) return false;
      seen.add(hs.condition);
      return true;
    });
  }, [healthStatuses]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal overflow-y-auto" style={{ maxWidth: '480px', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold">{isEditing ? t('verificationCard.editCard') : t('verificationCard.createCard')}</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} aria-label={t('common.close')}>
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Display name */}
          <div>
            <label className="label mb-1">{t('verificationCard.displayName')}</label>
            <input
              type="text"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('publicCard.anonymous')}
              maxLength={200}
            />
            <p className="text-xs text-muted mt-1">{t('verificationCard.displayNameHint')}</p>
          </div>

          {/* Condition checkboxes */}
          <fieldset>
            <legend className="label mb-1">{t('verificationCard.includedConditions')}</legend>
            <p className="text-xs text-muted mb-2">{t('verificationCard.includedConditionsHint')}</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {uniqueConditions.length === 0 ? (
                <p className="text-xs text-muted">{t('health.noStatus')}</p>
              ) : (
                uniqueConditions.map((hs) => (
                  <label key={hs.condition} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={selectedConditions.has(hs.condition)}
                      onChange={() => toggleCondition(hs.condition)}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <span className="text-sm">
                      {t(`healthLog.conditions.${hs.condition}`, { defaultValue: hs.condition })}
                    </span>
                    <span className={`badge ${hs.status === 'POSITIVE' ? 'badge-error' : hs.status === 'NEGATIVE' ? 'badge-info' : 'badge-warning'}`}>
                      {hs.status}
                    </span>
                  </label>
                ))
              )}
            </div>
          </fieldset>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showTestDates}
                onChange={(e) => setShowTestDates(e.target.checked)}
                className="accent-indigo-600 w-4 h-4"
              />
              <span className="text-sm">{t('verificationCard.showTestDates')}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showVerificationLevel}
                onChange={(e) => setShowVerificationLevel(e.target.checked)}
                className="accent-indigo-600 w-4 h-4"
              />
              <span className="text-sm">{t('verificationCard.showVerificationLevel')}</span>
            </label>
          </div>

          {/* View limit */}
          <div>
            <label className="label mb-1">{t('verificationCard.viewLimit')}</label>
            <input
              type="number"
              className="input"
              value={maxViews}
              onChange={(e) => setMaxViews(e.target.value)}
              placeholder={t('verificationCard.unlimited')}
              min={1}
              max={10000}
            />
            <p className="text-xs text-muted mt-1">{t('verificationCard.viewLimitHint')}</p>
          </div>

          {/* Expiry date */}
          <div>
            <label className="label mb-1">{t('verificationCard.expiresAt')}</label>
            <input
              type="date"
              className="input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted mt-1">{t('verificationCard.expiresAtHint')}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border-light">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving || selectedConditions.size === 0}
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                {t('common.loading')}
              </span>
            ) : (
              t('common.save')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── QR Modal ──

function QRModal({ url, onClose }: { url: string; onClose: () => void }) {
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal text-center" style={{ maxWidth: '360px' }}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold">{t('verificationCard.qrTitle')}</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} aria-label={t('common.close')}>
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex justify-center mb-4">
          <QRCodeSVG value={url} size={256} />
        </div>
        <p className="text-xs text-muted break-all">{url}</p>
      </div>
    </div>
  );
}

// ── QR Code SVG using qrcode package ──

function QRCodeSVG({ value, size = 256 }: { value: string; size?: number }) {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    import('qrcode').then((QRCode) => {
      QRCode.toString(value, {
        type: 'svg',
        width: size,
        margin: 2,
        color: { dark: '#1c1917', light: '#ffffff' },
      }).then((svg: string) => {
        if (!cancelled) setSvgContent(svg);
      });
    });
    return () => { cancelled = true; };
  }, [value, size]);

  if (!svgContent) {
    return <div style={{ width: size, height: size }} className="animate-pulse bg-stone-100 rounded" />;
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: svgContent }}
      style={{ width: size, height: size }}
      role="img"
      aria-label="QR Code"
    />
  );
}
