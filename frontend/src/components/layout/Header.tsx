import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthOptional } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';
import { BarChart3, Bell, BookOpen, ChevronDown, HeartPulse, LayoutDashboard, LogOut, Menu, MoreHorizontal, ShieldCheck, Sparkles, UserCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, type NotificationItem } from '../../lib/api';
import { queryClient } from '../../queryClient';
import { formatRelativeTime } from '../../lib/notifications';
const AVATAR_COLORS = [
  '#4f46e5', // indigo-600
  '#7c3aed', // violet-600
  '#2563eb', // blue-600
  '#0891b2', // cyan-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#dc2626', // red-600
  '#c026d3', // fuchsia-600
];

function getInitials(name: string): string {
  const cleaned = name.replace(/@.*$/, '').trim(); // strip email domain
  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

function getAvatarColor(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Header() {
  const { t, i18n } = useTranslation();
  const auth = useAuthOptional();
  const session = auth?.session ?? null;
  const signOut = auth?.signOut;
  const authLoading = auth?.isLoading ?? false;
  const token = session?.access_token ?? '';
  const { data: profile } = useUser();
  const { pathname } = useLocation();
  const isLanding = pathname === '/';
  const [scrolledOnLanding, setScrolledOnLanding] = useState(false);
  const scrolled = isLanding ? scrolledOnLanding : false;

  useEffect(() => {
    if (!isLanding) return;
    const onScroll = () => setScrolledOnLanding(window.scrollY > 124);
    onScroll(); // set initial state
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      setScrolledOnLanding(false);
    };
  }, [isLanding]);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(token),
    enabled: !!token,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
  const readMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(token, id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<NotificationItem[]>(['notifications']);
      queryClient.setQueryData<NotificationItem[]>(['notifications'], (old) =>
        old?.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const readAllMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(token),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<NotificationItem[]>(['notifications']);
      const now = new Date().toISOString();
      queryClient.setQueryData<NotificationItem[]>(['notifications'], (old) =>
        old?.map((item) => item.readAt ? item : { ...item, readAt: now }),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const avatarThumb = profile?.avatarThumbUrl || profile?.avatarUrl;
  const initials = getInitials(profile?.firstName ? `${profile.firstName} ${profile.lastName ?? ''}`.trim() : (profile?.username || profile?.email || ''));
  const avatarBg = getAvatarColor(profile?.username || profile?.email || '');
  const [nowMs] = useState(() => Date.now());
  const unreadCount = notifications?.filter((item) => !item.readAt).length ?? 0;
  const previewItems = (notifications ?? []).slice(0, 5);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const { mutate: markAllRead } = readAllMutation;
  useEffect(() => {
    if (notificationsOpen && unreadCount > 0) {
      markAllRead();
    }
  }, [notificationsOpen, unreadCount, markAllRead]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navbarStateClass = isLanding
    ? (scrolled ? 'navbar--landing-scrolled' : 'navbar--landing-top')
    : 'navbar--app';

  return (
    <header className={`navbar ${navbarStateClass}`}>
      <div className="container flex justify-between items-center h-full">
        {/* Logo - Bold and substantial */}
        <Link to="/" className="flex items-center gap-2 hover:no-underline">
          <span className="navbar-logo-text">
            {t('common.appName')}
          </span>
        </Link>

        {/* Navigation — fade in after auth resolves to prevent flicker */}
        <nav className={`navbar-nav${authLoading ? ' navbar-nav--loading' : ''}`}>
          <div className="nav-mobile sm:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              className="nav-link"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-haspopup="menu"
            >
              <Menu className="nav-icon" aria-hidden="true" />
              <span className="sr-only">Menu</span>
            </button>
            {mobileMenuOpen && (
              <div className="nav-dropdown" role="menu">
                {session ? (
                  <>
                    <Link to="/dashboard" className={`nav-dropdown-item${pathname === '/dashboard' ? ' nav-dropdown-item-active' : ''}`} role="menuitem">
                      <LayoutDashboard className="nav-icon" aria-hidden="true" />
                      {t('nav.dashboard')}
                    </Link>
                    <Link to="/journal" className={`nav-dropdown-item${pathname === '/journal' ? ' nav-dropdown-item-active' : ''}`} role="menuitem" onClick={() => setMobileMenuOpen(false)}>
                      <BookOpen className="nav-icon" aria-hidden="true" />
                      {t('nav.journal')}
                    </Link>
                    <Link to="/health-log" className={`nav-dropdown-item${pathname === '/health-log' || pathname.startsWith('/health-log/') ? ' nav-dropdown-item-active' : ''}`} role="menuitem">
                      <HeartPulse className="nav-icon" aria-hidden="true" />
                      {t('nav.health')}
                    </Link>
                    <Link to="/network" className={`nav-dropdown-item${pathname === '/network' ? ' nav-dropdown-item-active' : ''}`} role="menuitem" onClick={() => setMobileMenuOpen(false)}>
                      <Sparkles className="nav-icon" aria-hidden="true" />
                      {t('nav.network')}
                    </Link>
                    <Link to="/insights" className={`nav-dropdown-item${pathname === '/insights' ? ' nav-dropdown-item-active' : ''}`} role="menuitem">
                      <BarChart3 className="nav-icon" aria-hidden="true" />
                      {t('nav.insights')}
                    </Link>
                    <Link to="/verification-card" className={`nav-dropdown-item${pathname === '/verification-card' ? ' nav-dropdown-item-active' : ''}`} role="menuitem" onClick={() => setMobileMenuOpen(false)}>
                      <ShieldCheck className="nav-icon" aria-hidden="true" />
                      {t('nav.verificationCard')}
                    </Link>
                    <Link to="/notifications" className={`nav-dropdown-item${pathname === '/notifications' ? ' nav-dropdown-item-active' : ''}`} role="menuitem">
                      <Bell className="nav-icon" aria-hidden="true" />
                      {t('nav.notifications')}
                      {unreadCount > 0 && <span className="nav-mobile-badge">{unreadCount}</span>}
                    </Link>
                    <Link to="/profile" className="nav-dropdown-item" role="menuitem">
                      <UserCircle2 className="nav-icon" aria-hidden="true" />
                      {t('nav.profile')}
                    </Link>
                    <button
                      type="button"
                      className="nav-dropdown-item"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (signOut) {
                          signOut();
                        }
                      }}
                      role="menuitem"
                    >
                      <LogOut className="nav-icon" aria-hidden="true" />
                      {t('auth.signOut')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="nav-dropdown-item" role="menuitem">
                      {t('auth.signIn')}
                    </Link>
                    <Link to="/signup" className="nav-dropdown-item" role="menuitem">
                      {t('auth.signUp')}
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          {session ? (
            <>
              <div className="nav-desktop">
                <Link to="/dashboard" className={`nav-link${pathname === '/dashboard' ? ' nav-link-active' : ''}`}>
                  <LayoutDashboard className="nav-icon" aria-hidden="true" />
                  {t('nav.dashboard')}
                </Link>
                <Link to="/journal" className={`nav-link${pathname === '/journal' ? ' nav-link-active' : ''}`}>
                  <BookOpen className="nav-icon" aria-hidden="true" />
                  {t('nav.journal')}
                </Link>
                <Link to="/health-log" className={`nav-link${pathname === '/health-log' || pathname.startsWith('/health-log/') ? ' nav-link-active' : ''}`}>
                  <HeartPulse className="nav-icon" aria-hidden="true" />
                  {t('nav.health')}
                </Link>
                <Link to="/network" className={`nav-link${pathname === '/network' ? ' nav-link-active' : ''}`}>
                  <Sparkles className="nav-icon" aria-hidden="true" />
                  {t('nav.network')}
                </Link>
                <div className="nav-menu" ref={moreRef}>
                  <button
                    className={`nav-link${pathname === '/insights' || pathname === '/verification-card' ? ' nav-link-active' : ''}`}
                    type="button"
                    onClick={() => setMoreOpen((open) => !open)}
                    aria-expanded={moreOpen}
                    aria-haspopup="menu"
                  >
                    <MoreHorizontal className="nav-icon" aria-hidden="true" />
                    {t('nav.more')}
                    <ChevronDown className="nav-icon" aria-hidden="true" />
                  </button>
                  {moreOpen && (
                    <div className="nav-dropdown" role="menu">
                      <Link to="/insights" className={`nav-dropdown-item${pathname === '/insights' ? ' nav-dropdown-item-active' : ''}`} role="menuitem" onClick={() => setMoreOpen(false)}>
                        <BarChart3 className="nav-icon" aria-hidden="true" />
                        {t('nav.insights')}
                      </Link>
                      <Link to="/verification-card" className={`nav-dropdown-item${pathname === '/verification-card' ? ' nav-dropdown-item-active' : ''}`} role="menuitem" onClick={() => setMoreOpen(false)}>
                        <ShieldCheck className="nav-icon" aria-hidden="true" />
                        {t('nav.verificationCard')}
                      </Link>
                    </div>
                  )}
                </div>
                <div className="nav-menu" ref={notificationsRef}>
                  <button
                    className={`nav-link${pathname === '/notifications' ? ' nav-link-active' : ''}`}
                    type="button"
                    onClick={() => setNotificationsOpen((open) => !open)}
                    aria-expanded={notificationsOpen}
                    aria-haspopup="menu"
                  >
                    <span className="nav-bell" aria-hidden="true">
                      <Bell className="nav-icon" />
                      {unreadCount > 0 && (
                        <span className="nav-bell-badge">{unreadCount}</span>
                      )}
                    </span>
                    {t('nav.notifications')}
                  </button>
                  {notificationsOpen && (
                    <div className="nav-dropdown nav-notifications-dropdown" role="menu">
                      <div className="nav-notifications-head">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {t('notifications.previewTitle')}
                        </span>
                        <Link to="/notifications" className="text-xs font-medium text-primary" onClick={() => setNotificationsOpen(false)}>
                          {t('notifications.viewAll')}
                        </Link>
                      </div>
                      <div className="space-y-2">
                        {previewItems.length > 0 ? previewItems.map((item: NotificationItem) => (
                          <div key={item.id} className={`nav-notification-item${item.readAt ? '' : ' nav-notification-item-unread'}`}>
                            <div className="min-w-0">
                              <p className={`text-xs truncate ${item.readAt ? 'text-muted' : 'font-semibold text-foreground'}`}>
                                {t(item.messageKey)}
                              </p>
                              <p className="text-[11px] text-muted" title={new Date(item.createdAt).toLocaleString()}>
                                {formatRelativeTime(item.createdAt, i18n.language, nowMs)}
                              </p>
                            </div>
                            {!item.readAt && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => readMutation.mutate(item.id)}
                              >
                                {t('notifications.markRead')}
                              </button>
                            )}
                          </div>
                        )) : (
                          <p className="text-xs text-muted">{t('notifications.empty')}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="nav-menu" ref={menuRef}>
                <button
                  className="nav-link"
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="nav-avatar">
                    {avatarThumb ? (
                      <img src={avatarThumb} alt={t('profile.avatarAlt')} />
                    ) : initials ? (
                      <span
                        className="nav-avatar-initials"
                        style={{ background: avatarBg }}
                        aria-hidden="true"
                      >
                        {initials}
                      </span>
                    ) : (
                      <span className="nav-avatar-fallback" aria-hidden="true" />
                    )}
                  </span>
                  {t('nav.profile')}
                  <ChevronDown className="nav-icon" aria-hidden="true" />
                </button>
                {menuOpen && (
                  <div className="nav-dropdown" role="menu">
                    <Link to="/profile" className="nav-dropdown-item" role="menuitem">
                      <UserCircle2 className="nav-icon" aria-hidden="true" />
                      {t('nav.profile')}
                    </Link>
                    <button
                      type="button"
                      className="nav-dropdown-item"
                      onClick={() => {
                        setMenuOpen(false);
                        if (signOut) {
                          signOut();
                        }
                      }}
                      role="menuitem"
                    >
                      <LogOut className="nav-icon" aria-hidden="true" />
                      {t('auth.signOut')}
                    </button>
                  </div>
                )}
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="nav-link"
              >
                {t('auth.signIn')}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
