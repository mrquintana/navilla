import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert, Clock, Eye } from 'lucide-react';
import { api, type PublicVerificationCardResponse, type CardVerificationResponse } from '../lib/api';

export function PublicVerificationCardPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { t, i18n } = useTranslation();
  const locale = i18n.language.replace('_', '-');

  const cardQuery = useQuery<PublicVerificationCardResponse>({
    queryKey: ['publicCard', shareToken],
    queryFn: () => api.verificationCards.getPublic(shareToken!),
    enabled: !!shareToken,
    retry: false,
  });

  const [verification, setVerification] = useState<CardVerificationResponse | null>(null);
  const [verifyFailed, setVerifyFailed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const runVerification = useCallback(async () => {
    if (!shareToken) return;
    try {
      const result = await api.verificationCards.verify(shareToken);
      setVerification(result);
      setVerifyFailed(false);
    } catch {
      setVerifyFailed(true);
    }
  }, [shareToken]);

  useEffect(() => {
    if (cardQuery.data) {
      // Defer initial verification to avoid synchronous setState in effect body
      const timeout = setTimeout(runVerification, 0);
      const interval = setInterval(runVerification, 60000);
      return () => { clearTimeout(timeout); clearInterval(interval); };
    }
  }, [cardQuery.data, runVerification]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const isExpired = cardQuery.isError;
  const card = cardQuery.data;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-darkest) 0%, var(--color-primary) 100%)',
          padding: '2.5rem 1rem 3.5rem',
          textAlign: 'center',
        }}
      >
        <div className="inline-flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-white" aria-hidden="true" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>
            {t('publicCard.title')}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '-2rem auto 2rem', padding: '0 1rem' }}>
        {cardQuery.isLoading ? (
          <div className="card card-elevated text-center py-12">
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-stone-200 rounded w-1/3 mx-auto" />
              <div className="h-4 bg-stone-200 rounded w-2/3 mx-auto" />
            </div>
          </div>
        ) : isExpired ? (
          <div className="card card-elevated text-center py-12">
            <ShieldAlert className="w-12 h-12 text-muted mx-auto mb-3" aria-hidden="true" />
            <p className="font-semibold text-sm">{t('publicCard.expired')}</p>
            <p className="text-xs text-muted mt-1">{t('publicCard.expiredHint')}</p>
          </div>
        ) : card ? (
          <div
            className="verification-card-holographic"
            onMouseMove={handleMouseMove}
            style={{
              '--mouse-x': `${mousePos.x}%`,
              '--mouse-y': `${mousePos.y}%`,
            } as React.CSSProperties}
          >
            <div className="holographic-border" />
            <div className="verification-card-watermark" />
            <div className="verification-card-content">
              {/* Identity */}
              <div className="text-center mb-5 pb-4 border-b border-border-light">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
                  style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}
                >
                  <ShieldCheck className="w-7 h-7 text-primary" aria-hidden="true" />
                </div>
                <h2 className="font-semibold text-lg">{card.displayName}</h2>
                {card.username && (
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-primary)' }}>@{card.username}</p>
                )}
                {/* Live verification badge */}
                <div className="mt-3">
                  {verification?.valid ? (
                    <span className="verification-badge-live verification-badge-live--valid">
                      <span className="pulse-dot" />
                      {t('publicCard.liveVerified')}
                    </span>
                  ) : verifyFailed ? (
                    <span className="verification-badge-live verification-badge-live--invalid">
                      {t('publicCard.verificationFailed')}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">{t('common.loading')}</span>
                  )}
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-3">
                {card.conditions.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 py-2"
                    style={idx < card.conditions.length - 1 ? { borderBottom: '1px solid var(--color-border-light)' } : undefined}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {t(`healthLog.conditions.${c.condition}`, { defaultValue: c.condition })}
                      </p>
                      {c.testDate && (
                        <p className="text-xs text-muted">
                          {t('publicCard.testDate')}: {new Date(c.testDate + 'T00:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${c.status === 'POSITIVE' ? 'badge-error' : c.status === 'NEGATIVE' ? 'badge-info' : 'badge-warning'}`}>
                        {c.status}
                      </span>
                      {c.verificationLevel === 'LAB_VERIFIED' && (
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#16a34a' }}>
                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          <span className="hidden sm:inline">{t('publicCard.labVerified')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {card.conditions.length === 0 && (
                  <p className="text-sm text-muted text-center py-4">{t('health.noStatus')}</p>
                )}
              </div>

              {/* Meta */}
              <div className="mt-6 pt-4 border-t border-border-light flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                {card.expiresAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('publicCard.expiresOn', { date: new Date(card.expiresAt).toLocaleDateString(locale) })}
                  </div>
                )}
                {card.viewsRemaining != null && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('publicCard.viewsLeft', { count: card.viewsRemaining })}
                  </div>
                )}
              </div>

              {/* Branded footer */}
              <div className="mt-6 pt-4 border-t border-border-light text-center">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  <span>{t('publicCard.verifiedByPrefix')}<span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Navilla</span></span>
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
