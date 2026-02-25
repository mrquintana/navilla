import type { NotificationItem } from './api';

export type NotificationCategory = 'connections' | 'health' | 'system';
export type NotificationSection = 'today' | 'yesterday' | 'earlier';

export function getNotificationCategory(type: string): NotificationCategory {
  if (type.startsWith('CONNECTION_')) return 'connections';
  if (type.startsWith('EXPOSURE_')) return 'health';
  return 'system';
}

export function isActionNeededNotification(item: NotificationItem): boolean {
  return item.type === 'CONNECTION_REQUEST' && !item.readAt;
}

export function getNotificationSection(createdAt: string, nowMs: number): NotificationSection {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 'earlier';

  const now = new Date(nowMs);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const createdMs = created.getTime();

  if (createdMs >= startOfToday) return 'today';
  if (createdMs >= startOfYesterday) return 'yesterday';
  return 'earlier';
}

export function formatRelativeTime(createdAt: string, locale: string, nowMs: number): string {
  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return '';

  const diffMinutes = Math.round((createdMs - nowMs) / 60000);
  const absMinutes = Math.abs(diffMinutes);
  const normalizedLocale = (locale || 'en-US').replace('_', '-');
  let rtf: Intl.RelativeTimeFormat;
  try {
    rtf = new Intl.RelativeTimeFormat(normalizedLocale, { numeric: 'auto' });
  } catch {
    rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
  }

  if (absMinutes < 60) return rtf.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
}

export function getNotificationRoute(item: NotificationItem): string {
  const category = getNotificationCategory(item.type);
  if (category === 'connections') return '/connections';
  if (category === 'health') return '/health';
  return '/profile';
}
