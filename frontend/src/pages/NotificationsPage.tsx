import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, type NotificationItem } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { queryClient } from '../queryClient';

export function NotificationsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const token = session?.access_token ?? '';
  const listQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(token),
    enabled: !!token,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadItems = (listQuery.data ?? []).filter((item) => !item.readAt);
  const readItems = (listQuery.data ?? []).filter((item) => item.readAt);
  const unreadCount = unreadItems.length;
  const unreadIds = useMemo(
    () => unreadItems.map((item) => item.id),
    [unreadItems]
  );
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    if (!isFocused || unreadIds.length === 0 || readMutation.isPending) return;
    const markAllRead = async () => {
      for (const id of unreadIds) {
        await readMutation.mutateAsync(id);
      }
    };
    markAllRead().catch(() => null);
  }, [isFocused, readMutation, unreadIds]);
  const isStaleRead = (readAt?: string | null) => {
    if (!readAt) return false;
    const readTime = new Date(readAt).getTime();
    return Number.isFinite(readTime) && Date.now() - readTime > 5 * 60 * 1000;
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {t('notifications.title')}
          {unreadCount > 0 ? ` (${unreadCount})` : ''}
        </h1>
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
            {unreadItems.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t('notifications.newSection')}
                </p>
                {unreadItems.map((item: NotificationItem) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {t(item.messageKey)}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      {t('notifications.unread')}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {readItems.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t('notifications.earlierSection')}
                </p>
                {readItems.map((item: NotificationItem) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0 ${
                      isStaleRead(item.readAt) ? 'opacity-60' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm text-muted">
                        {t(item.messageKey)}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">{t('notifications.empty')}</p>
        )}
      </div>
    </div>
  );
}
