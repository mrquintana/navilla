import { useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, type Connection } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { queryClient } from '../queryClient';

function ConnectionList({
  title,
  connections,
  emptyText,
  renderActions,
}: {
  title: string;
  connections: Connection[];
  emptyText: string;
  renderActions?: (connection: Connection) => ReactNode;
}) {
  return (
    <div className="card card-elevated">
      <h3 className="font-semibold mb-4">{title}</h3>
      {connections.length === 0 ? (
        <p className="text-sm text-muted">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {connections.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{connection.id}</p>
                <p className="text-xs text-muted">
                  {new Date(connection.requestedAt).toLocaleDateString()}
                </p>
              </div>
              {renderActions && (
                <div className="flex gap-2">
                  {renderActions(connection)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConnectionsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const token = session?.access_token ?? '';

  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const createMutation = useMutation({
    mutationFn: () => api.connections.create(token, identifier),
    onSuccess: (data) => {
      setMessage(t(data.message));
      setError(null);
      setIdentifier('');
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: (err: any) => {
      setError(err.message || t('common.error'));
      setMessage(null);
    },
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

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('connections.title')}</h1>
        <p className="text-muted">{t('connections.subtitle')}</p>
      </div>

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
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? t('common.loading') : t('connections.sendRequest')}
          </button>
        </form>

        {message && (
          <div className="alert alert-success mt-4">{message}</div>
        )}
        {error && (
          <div className="alert alert-error mt-4">{error}</div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ConnectionList
          title={t('connections.pendingIncoming')}
          connections={pendingIncomingQuery.data ?? []}
          emptyText={t('connections.noPending')}
          renderActions={(connection) => (
            <>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => acceptMutation.mutate(connection.id)}
              >
                {t('connections.accept')}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => denyMutation.mutate(connection.id)}
              >
                {t('connections.deny')}
              </button>
            </>
          )}
        />

        <ConnectionList
          title={t('connections.pendingSent')}
          connections={pendingSentQuery.data ?? []}
          emptyText={t('connections.noPendingSent')}
          renderActions={(connection) => (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => cancelMutation.mutate(connection.id)}
            >
              {t('connections.cancel')}
            </button>
          )}
        />
      </div>

      <ConnectionList
        title={t('connections.confirmed')}
        connections={confirmedQuery.data ?? []}
        emptyText={t('connections.noConfirmed')}
      />
    </div>
  );
}
