import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, type NotificationItem } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { queryClient } from '../queryClient';

export function NotificationsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const token = session?.access_token ?? '';
  const [pendingReadId, setPendingReadId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(token),
    enabled: !!token,
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markRead = async (id: string) => {
    setPendingReadId(id);
    try {
      await readMutation.mutateAsync(id);
    } finally {
      setPendingReadId(null);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('notifications.title')}</h1>
        <p className="text-muted">{t('notifications.subtitle')}</p>
      </div>

      <div className="card card-elevated">
        {listQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="spinner" aria-hidden="true" />
            <span className="sr-only">{t('common.loading')}</span>
            <span>{t('common.loading')}</span>
          </div>
        ) : listQuery.data && listQuery.data.length > 0 ? (
          <div className="space-y-3">
            {listQuery.data.map((item: NotificationItem) => (
              <div key={item.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className={`text-sm ${item.readAt ? 'text-muted' : 'font-medium'}`}>
                    {t(item.messageKey)}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                {!item.readAt && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => markRead(item.id)}
                    disabled={pendingReadId === item.id}
                  >
                    {pendingReadId === item.id ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="spinner" aria-hidden="true" />
                        {t('common.loading')}
                      </span>
                    ) : t('notifications.markRead')}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{t('notifications.empty')}</p>
        )}
      </div>
    </div>
  );
}
