import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, ApiError, type Connection } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { queryClient } from '../queryClient';
import { Check, Clock, HeartPulse, Inbox, Search, Send, UserRound, Users, X } from 'lucide-react';
import { DEV_MODE } from '../lib/devMode';
import { PageSkeleton, SkeletonBlock, SkeletonRows } from '../components/ui/LoadingShell';
import { useSearchParams } from 'react-router-dom';

function ConnectionList({
  title,
  headerExtra,
  connections,
  emptyText,
  emptyIcon,
  renderActions,
  renderDetails,
  isExpanded,
  footer,
  isLoading,
  compact,
  focusedConnectionId,
}: {
  title: string;
  headerExtra?: ReactNode;
  connections: Connection[];
  emptyText: string;
  emptyIcon?: ReactNode;
  renderActions?: (connection: Connection) => ReactNode;
  renderDetails?: (connection: Connection) => ReactNode;
  isExpanded?: (connection: Connection) => boolean;
  footer?: ReactNode;
  isLoading?: boolean;
  compact?: boolean;
  focusedConnectionId?: string | null;
}) {
  const { t, i18n } = useTranslation();

  return (
    <div className="card card-elevated">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold">{title}</h3>
        {headerExtra}
      </div>
      {isLoading ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">{t('common.loading')}</span>
          <SkeletonRows rows={compact ? 4 : 3} rowClassName={compact ? 'h-12 rounded-xl' : 'h-14 rounded-xl'} />
        </div>
      ) : connections.length === 0 ? (
        <div className="text-center py-8">
          {emptyIcon && <div className="mx-auto mb-2 opacity-40" style={{ color: 'var(--color-muted)' }}>{emptyIcon}</div>}
          <p className="text-sm text-muted">{emptyText}</p>
        </div>
      ) : (
        <div className={compact ? 'space-y-2' : 'space-y-3'}>
          {connections.map((connection) => {
            // TODO: Revisit identity fields (display name vs full name vs username) to reduce redundancy.
            const maskIdentifier = (value: string) => `${value.charAt(0)}***`;
            const displayName = connection.partnerDisplayName
              || (connection.partnerUsername ? maskIdentifier(connection.partnerUsername) : null);
            const statusLabel = connection.status === 'CONFIRMED'
              ? t('connections.confirmedConnection')
              : t('connections.pendingConnection');
            const nameToShow = displayName || statusLabel;
            const dateLabel = connection.status === 'CONFIRMED'
              ? t('connections.connectedOn')
              : t('connections.requestedOn');

            return (
              <div
                key={connection.id}
                className={`connection-item ${compact ? 'connection-item--compact space-y-2' : 'space-y-3'}${focusedConnectionId === connection.id ? ' ring-2 ring-primary/30' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`${compact ? 'w-9 h-9' : 'w-10 h-10'} rounded-full bg-stone-100 flex items-center justify-center overflow-hidden`}>
                      {connection.partnerAvatarThumbUrl ? (
                        <img
                          src={connection.partnerAvatarThumbUrl}
                          alt={nameToShow}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </div>
                    <div>
                      <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>{nameToShow}</p>
                      {connection.partnerDisplayName && connection.partnerUsername && (
                        <p className="text-xs text-muted">@{connection.partnerUsername}</p>
                      )}
                      <p className="text-xs text-muted" title={dateLabel}>
                        {new Date(connection.requestedAt).toLocaleDateString(i18n.language.replace('_', '-'), { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {renderActions && (
                    <div className={`${compact ? 'flex gap-1.5' : 'flex flex-wrap gap-2'}`}>
                      {renderActions(connection)}
                    </div>
                  )}
                </div>
                {renderDetails && isExpanded?.(connection) && (
                  <div className="connection-detail-panel text-sm">
                    {renderDetails(connection)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {footer}
    </div>
  );
}

export function ConnectionsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const focusConnectionId = searchParams.get('focus');
  const token = session?.access_token ?? '';
  const [pendingActionIds, setPendingActionIds] = useState<Set<string>>(new Set());
  const [pendingIncomingPage, setPendingIncomingPage] = useState(1);
  const [confirmedSearch, setConfirmedSearch] = useState('');
  const [expandedConnectionId, setExpandedConnectionId] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState<'profile' | 'status'>('profile');
  const [removeTarget, setRemoveTarget] = useState<Connection | null>(null);

  const [identifier, setIdentifier] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [infoActionId, setInfoActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fillRandomConnection = () => {
    const samples = ['user001', 'user007', 'user015', 'user021', 'migue1990'];
    const value = samples[Math.floor(Math.random() * samples.length)];
    setIdentifier(value);
  };

  const pendingIncomingQuery = useQuery({
    queryKey: ['connections', 'pendingIncoming'],
    queryFn: () => api.connections.pendingIncoming(token),
    enabled: !!token,
  });

  const pendingSentQuery = useQuery({
    queryKey: ['connections', 'pendingSent'],
    queryFn: () => api.connections.pendingSent(token),
    enabled: !!token,
  });

  const confirmedQuery = useQuery({
    queryKey: ['connections', 'confirmed'],
    queryFn: () => api.connections.confirmed(token),
    enabled: !!token,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.connections.accept(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });

  const denyMutation = useMutation({
    mutationFn: (id: string) => api.connections.deny(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.connections.delete(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.connections.delete(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });

  const pendingIncoming = useMemo(() => pendingIncomingQuery.data ?? [], [pendingIncomingQuery.data]);
  const pendingIncomingPageSize = 10;
  const pendingIncomingTotalPages = Math.max(
    1,
    Math.ceil(pendingIncoming.length / pendingIncomingPageSize)
  );
  const pendingIncomingSlice = useMemo(() => {
    const start = (pendingIncomingPage - 1) * pendingIncomingPageSize;
    return pendingIncoming.slice(start, start + pendingIncomingPageSize);
  }, [pendingIncoming, pendingIncomingPage]);
  const focusedIncomingConnection = focusConnectionId
    ? pendingIncoming.find((connection) => connection.id === focusConnectionId)
    : undefined;

  useEffect(() => {
    if (!focusConnectionId) return;
    const index = pendingIncoming.findIndex((connection) => connection.id === focusConnectionId);
    if (index < 0) return;
    const page = Math.floor(index / pendingIncomingPageSize) + 1;
    if (page !== pendingIncomingPage) {
      setPendingIncomingPage(page);
    }
  }, [focusConnectionId, pendingIncoming, pendingIncomingPage]);

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setPendingActionIds((prev) => new Set(prev).add(id));
    try {
      await action();
    } finally {
      setPendingActionIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const confirmedConnections = useMemo(() => confirmedQuery.data ?? [], [confirmedQuery.data]);
  const filteredConfirmed = useMemo(() => {
    const query = confirmedSearch.trim().toLowerCase();
    if (!query) {
      return confirmedConnections;
    }
    return confirmedConnections.filter((connection) => {
      const displayName = connection.partnerDisplayName?.toLowerCase() ?? '';
      const username = connection.partnerUsername?.toLowerCase() ?? '';
      return displayName.includes(query) || username.includes(query);
    });
  }, [confirmedConnections, confirmedSearch]);

  const toggleExpanded = (id: string, view: 'profile' | 'status') => {
    if (expandedConnectionId === id && expandedView === view) {
      setExpandedConnectionId(null);
      return;
    }
    setExpandedConnectionId(id);
    setExpandedView(view);
  };

  const createMutation = useMutation({
    mutationFn: () => api.connections.create(token, identifier),
    onSuccess: (data) => {
      setMessage(t(data.message));
      setError(null);
      setInfo(null);
      setInfoActionId(null);
      setIdentifier('');
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.status === 409) {
        const data = err.data as { details?: string[] } | null | undefined;
        const details = Array.isArray(data?.details) ? data.details : [];
        const existingConnectionId = details
          .find((detail) => detail.startsWith('existingConnectionId:'))
          ?.split(':')[1];
        const normalized = identifier.trim().replace(/^@/, '').toLowerCase();
        const match = pendingIncoming.find(
          (connection) => connection.partnerUsername?.toLowerCase() === normalized
        );
        setInfo(t('connections.requestAlreadyExists'));
        setInfoActionId(existingConnectionId || match?.id || null);
        setError(null);
      } else {
        setError(err.message || t('common.error'));
        setInfo(null);
        setInfoActionId(null);
      }
      setMessage(null);
    },
  });

  const incomingLoading = pendingIncomingQuery.isLoading && !pendingIncomingQuery.data;
  const sentLoading = pendingSentQuery.isLoading && !pendingSentQuery.data;
  const confirmedLoading = confirmedQuery.isLoading && !confirmedQuery.data;
  const isInitialLoading = incomingLoading && sentLoading && confirmedLoading;
  const showResolvedFocusNotice = !!focusConnectionId
    && !incomingLoading
    && !focusedIncomingConnection;

  if (isInitialLoading) {
    return (
      <PageSkeleton loadingLabel={t('common.loading')}>
        <SkeletonBlock className="h-44 rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card card-elevated space-y-4">
            <SkeletonBlock className="h-5 w-48 rounded-full" />
            <SkeletonRows rows={3} />
          </div>
          <div className="card card-elevated space-y-4">
            <SkeletonBlock className="h-5 w-48 rounded-full" />
            <SkeletonRows rows={3} />
          </div>
        </div>
        <div className="card card-elevated space-y-4">
          <SkeletonBlock className="h-5 w-56 rounded-full" />
          <SkeletonRows rows={4} />
        </div>
      </PageSkeleton>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('connections.title')}</h1>
        <p className="text-muted">{t('connections.subtitle')}</p>
      </div>
      {focusConnectionId && focusedIncomingConnection && (
        <div className="alert alert-info">
          {t('connections.focusedRequest')}
        </div>
      )}
      {showResolvedFocusNotice && (
        <div className="alert alert-info">
          {t('connections.focusResolved')}
        </div>
      )}

      <div className="card card-elevated">
        <h3 className="font-semibold mb-4">{t('connections.addConnection')}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!identifier.trim()) {
              setError(t('errors.required'));
              return;
            }
            createMutation.mutate();
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            className="input flex-1"
            placeholder={t('connections.identifierPlaceholder')}
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (info) {
                setInfo(null);
                setInfoActionId(null);
              }
            }}
          />
          <button className="btn btn-primary" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="spinner" aria-hidden="true" />
                {t('common.loading')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Send className="nav-icon" aria-hidden="true" />
                {t('connections.sendRequest')}
              </span>
            )}
          </button>
        </form>
        {DEV_MODE && (
          <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={fillRandomConnection}>
            {t('common.fillRandom')}
          </button>
        )}

        {message && (
          <div className="alert alert-success mt-4">{message}</div>
        )}
        {info && (
          <div className="alert alert-info mt-4 flex flex-wrap items-center justify-between gap-3">
            <span>{info}</span>
            {infoActionId && (
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={() => runAction(infoActionId, () => acceptMutation.mutateAsync(infoActionId))}
                disabled={pendingActionIds.has(infoActionId)}
              >
                {pendingActionIds.has(infoActionId) ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="spinner" aria-hidden="true" />
                    {t('common.loading')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Check className="nav-icon" aria-hidden="true" />
                    {t('connections.accept')}
                  </span>
                )}
              </button>
            )}
          </div>
        )}
        {error && (
          <div className="alert alert-error mt-4">{error}</div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ConnectionList
          title={t('connections.pendingIncoming')}
          connections={pendingIncomingSlice}
          emptyText={t('connections.noPending')}
          emptyIcon={<Inbox className="w-10 h-10" />}
          isLoading={incomingLoading}
          focusedConnectionId={focusConnectionId}
          renderActions={(connection) => (
            <>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => runAction(connection.id, () => acceptMutation.mutateAsync(connection.id))}
                disabled={pendingActionIds.has(connection.id)}
                title={t('connections.accept')}
                aria-label={t('connections.accept')}
              >
                {pendingActionIds.has(connection.id) ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="spinner" aria-hidden="true" />
                    {t('common.loading')}
                  </span>
                ) : (
                  <Check className="nav-icon" aria-hidden="true" />
                )}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => runAction(connection.id, () => denyMutation.mutateAsync(connection.id))}
                disabled={pendingActionIds.has(connection.id)}
                title={t('connections.deny')}
                aria-label={t('connections.deny')}
              >
                {pendingActionIds.has(connection.id) ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="spinner" aria-hidden="true" />
                    {t('common.loading')}
                  </span>
                ) : (
                  <X className="nav-icon" aria-hidden="true" />
                )}
              </button>
            </>
          )}
          footer={pendingIncomingTotalPages > 1 ? (
            <div className="flex items-center justify-between text-xs text-muted mt-4">
              <span>{t('common.page')} {pendingIncomingPage} {t('common.of')} {pendingIncomingTotalPages}</span>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPendingIncomingPage((p) => Math.max(1, p - 1))}
                  disabled={pendingIncomingPage === 1}
                >
                  {t('common.back')}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPendingIncomingPage((p) => Math.min(pendingIncomingTotalPages, p + 1))}
                  disabled={pendingIncomingPage === pendingIncomingTotalPages}
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          ) : null}
        />

        <ConnectionList
          title={t('connections.pendingSent')}
          connections={pendingSentQuery.data ?? []}
          emptyText={t('connections.noPendingSent')}
          emptyIcon={<Clock className="w-10 h-10" />}
          isLoading={sentLoading}
          renderActions={(connection) => (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => runAction(connection.id, () => cancelMutation.mutateAsync(connection.id))}
              disabled={pendingActionIds.has(connection.id)}
              title={t('connections.cancel')}
              aria-label={t('connections.cancel')}
            >
              {pendingActionIds.has(connection.id) ? (
                <span className="inline-flex items-center gap-1">
                  <span className="spinner" aria-hidden="true" />
                  {t('common.loading')}
                </span>
              ) : (
                <X className="nav-icon" aria-hidden="true" />
              )}
            </button>
          )}
        />
      </div>

      <ConnectionList
        title={t('connections.confirmed')}
        compact
        emptyIcon={<Users className="w-10 h-10" />}
        headerExtra={(
          <div className="relative w-full max-w-xs">
            <Search className="nav-icon input-icon" aria-hidden="true" />
            <input
              className="input input-with-icon"
              placeholder={t('connections.searchPlaceholder')}
              value={confirmedSearch}
              onChange={(e) => setConfirmedSearch(e.target.value)}
            />
          </div>
        )}
        connections={filteredConfirmed}
        emptyText={t('connections.noConfirmed')}
        isLoading={confirmedLoading}
        isExpanded={(connection) => expandedConnectionId === connection.id}
        renderActions={(connection) => (
          <>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => toggleExpanded(connection.id, 'profile')}
              title={t('connections.viewProfile')}
              aria-label={t('connections.viewProfile')}
            >
              <UserRound className="nav-icon" aria-hidden="true" />
            </button>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => toggleExpanded(connection.id, 'status')}
              title={t('connections.viewStatus')}
              aria-label={t('connections.viewStatus')}
            >
              <HeartPulse className="nav-icon" aria-hidden="true" />
            </button>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => {
                setRemoveTarget(connection);
              }}
              title={t('connections.removeConnection')}
              aria-label={t('connections.removeConnection')}
            >
              {pendingActionIds.has(connection.id) ? (
                <span className="inline-flex items-center gap-1">
                  <span className="spinner" aria-hidden="true" />
                  {t('common.loading')}
                </span>
              ) : (
                <X className="nav-icon" aria-hidden="true" />
              )}
            </button>
          </>
        )}
        renderDetails={(connection) => {
          if (expandedView === 'status') {
            return (
              <div className="space-y-1">
                <p className="font-medium">{t('connections.viewStatus')}</p>
                <p className="text-muted">{t('connections.statusNotAvailable')}</p>
              </div>
            );
          }

          return (
            <div className="space-y-1">
              <p className="font-medium">{t('connections.viewProfile')}</p>
              <p>{connection.partnerDisplayName || t('connections.pendingConnection')}</p>
              {connection.partnerUsername && (
                <p className="text-xs text-muted">@{connection.partnerUsername}</p>
              )}
            </div>
          );
        }}
      />
      {removeTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h4 className="text-lg font-semibold">{t('connections.removeConnection')}</h4>
            <p className="text-sm text-muted">
              {t('connections.confirmRemove')}
            </p>
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setRemoveTarget(null)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  runAction(removeTarget.id, () => removeMutation.mutateAsync(removeTarget.id));
                  setRemoveTarget(null);
                }}
                disabled={pendingActionIds.has(removeTarget.id)}
              >
                {pendingActionIds.has(removeTarget.id) ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="spinner" aria-hidden="true" />
                    {t('common.loading')}
                  </span>
                ) : (
                  t('common.delete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
