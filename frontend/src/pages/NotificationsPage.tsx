import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, type NotificationItem } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { queryClient } from '../queryClient';
import { PageSkeleton, SkeletonRows } from '../components/ui/LoadingShell';
import { Bell, Check, CircleAlert, ShieldAlert, UserCheck, X } from 'lucide-react';
import {
  formatRelativeTime,
  getNotificationCategory,
  getNotificationRoute,
  getNotificationSection,
  isActionNeededNotification,
} from '../lib/notifications';

export function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const token = session?.access_token ?? '';
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'action'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [nowMs] = useState(() => Date.now());
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(token),
    enabled: !!token,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
  const pendingIncomingQuery = useQuery({
    queryKey: ['connections', 'pendingIncoming'],
    queryFn: () => api.connections.pendingIncoming(token),
    enabled: !!token,
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const acceptMutation = useMutation({
    mutationFn: (connectionId: string) => api.connections.accept(token, connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const denyMutation = useMutation({
    mutationFn: (connectionId: string) => api.connections.deny(token, connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const allItems = (listQuery.data ?? []).filter((item) => !dismissedIds.has(item.id));
  const pendingIncomingIds = new Set((pendingIncomingQuery.data ?? []).map((item) => item.id));
  const filteredItems = allItems.filter((item) => {
    if (activeFilter === 'unread') return !item.readAt;
    if (activeFilter === 'action') return isActionNeededNotification(item);
    return true;
  });
  const groupedItems = useMemo(() => {
    return {
      today: filteredItems.filter((item) => getNotificationSection(item.createdAt, nowMs) === 'today'),
      yesterday: filteredItems.filter((item) => getNotificationSection(item.createdAt, nowMs) === 'yesterday'),
      earlier: filteredItems.filter((item) => getNotificationSection(item.createdAt, nowMs) === 'earlier'),
    };
  }, [filteredItems, nowMs]);

  const unreadItems = allItems.filter((item) => !item.readAt);
  const unreadCount = unreadItems.length;
  const listInitialLoading = listQuery.isLoading && !listQuery.data;

  if (listInitialLoading) {
    return (
      <PageSkeleton titleWidth="w-56" subtitleWidth="w-80" loadingLabel={t('common.loading')}>
        <div className="card card-elevated">
          <SkeletonRows rows={5} />
        </div>
      </PageSkeleton>
    );
  }

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
        <div className="notification-toolbar">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all' as const, label: t('notifications.filterAll') },
              { key: 'unread' as const, label: t('notifications.filterUnread') },
              { key: 'action' as const, label: t('notifications.filterActionNeeded') },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`notification-filter-btn${activeFilter === filter.key ? ' notification-filter-btn-active' : ''}`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              for (const item of unreadItems) {
                await readMutation.mutateAsync(item.id);
              }
            }}
            disabled={unreadItems.length === 0 || readMutation.isPending}
          >
            <span className="inline-flex items-center gap-1">
              <Check className="nav-icon" aria-hidden="true" />
              {t('notifications.markAllRead')}
            </span>
          </button>
        </div>

        {allItems.length > 0 ? (
          <div className="space-y-5">
            {(['today', 'yesterday', 'earlier'] as const).map((sectionKey) => (
              groupedItems[sectionKey].length > 0 ? (
                <section key={sectionKey} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t(`notifications.section.${sectionKey}`)}
                  </p>
                  <div className="space-y-2">
                    {groupedItems[sectionKey].map((item: NotificationItem) => {
                      const category = getNotificationCategory(item.type);
                      const actionNeeded = isActionNeededNotification(item);
                      const isResolvedConnectionRequest = item.type === 'CONNECTION_REQUEST'
                        && !!item.connectionId
                        && !pendingIncomingIds.has(item.connectionId);
                      const categoryIcon = category === 'connections'
                        ? <UserCheck className="nav-icon" aria-hidden="true" />
                        : category === 'health'
                          ? <CircleAlert className="nav-icon" aria-hidden="true" />
                          : <ShieldAlert className="nav-icon" aria-hidden="true" />;

                      return (
                        <article
                          key={item.id}
                          className={`notification-row${item.readAt ? '' : ' notification-row-unread'}`}
                        >
                          <div className="notification-row-icon">
                            {categoryIcon}
                          </div>
                          <div className="notification-row-content">
                            <div className="notification-row-meta">
                              <span className="badge badge-info text-xs">{t(`notifications.category.${category}`)}</span>
                              {actionNeeded ? (
                                <span className="badge badge-warning text-xs">{t('notifications.actionNeeded')}</span>
                              ) : isResolvedConnectionRequest ? (
                                <span className="badge text-xs">{t('notifications.resolved')}</span>
                              ) : !item.readAt ? (
                                <span className="badge badge-success text-xs">{t('notifications.unread')}</span>
                              ) : (
                                <span className="badge text-xs">{t('notifications.read')}</span>
                              )}
                            </div>
                            <p className={`text-sm ${item.readAt ? 'text-muted' : 'font-medium'}`}>
                              {t(item.messageKey)}
                            </p>
                            <p className="text-xs text-muted" title={new Date(item.createdAt).toLocaleString()}>
                              {formatRelativeTime(item.createdAt, i18n.language, nowMs)}
                            </p>
                            <div className="notification-row-actions">
                              <a className="text-xs font-medium text-primary" href={getNotificationRoute(item)}>
                                {t('notifications.viewDetails')}
                              </a>
                              {!item.readAt && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => readMutation.mutate(item.id)}
                                >
                                  {t('notifications.markRead')}
                                </button>
                              )}
                              {item.type === 'CONNECTION_REQUEST' && item.connectionId && !isResolvedConnectionRequest && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    disabled={pendingActionId === item.id}
                                    onClick={async () => {
                                      setPendingActionId(item.id);
                                      try {
                                        await acceptMutation.mutateAsync(item.connectionId!);
                                        if (!item.readAt) {
                                          await readMutation.mutateAsync(item.id);
                                        }
                                      } finally {
                                        setPendingActionId(null);
                                      }
                                    }}
                                  >
                                    {t('connections.accept')}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    disabled={pendingActionId === item.id}
                                    onClick={async () => {
                                      setPendingActionId(item.id);
                                      try {
                                        await denyMutation.mutateAsync(item.connectionId!);
                                        if (!item.readAt) {
                                          await readMutation.mutateAsync(item.id);
                                        }
                                      } finally {
                                        setPendingActionId(null);
                                      }
                                    }}
                                  >
                                    {t('connections.deny')}
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={async () => {
                                  setDismissedIds((prev) => {
                                    const next = new Set(prev);
                                    next.add(item.id);
                                    return next;
                                  });
                                  if (!item.readAt) {
                                    await readMutation.mutateAsync(item.id);
                                  }
                                }}
                              >
                                <span className="inline-flex items-center gap-1">
                                  <X className="nav-icon" aria-hidden="true" />
                                  {t('notifications.dismiss')}
                                </span>
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null
            ))}
            {filteredItems.length === 0 && (
              <p className="text-sm text-muted">{t('notifications.noMatching')}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Bell className="nav-icon" aria-hidden="true" />
            <p className="text-sm text-muted">{t('notifications.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
