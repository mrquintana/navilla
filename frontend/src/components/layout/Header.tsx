import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthOptional } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';
import { Bell, ChevronDown, HeartPulse, LayoutDashboard, LogOut, Menu, UserCircle2, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, type NotificationItem } from '../../lib/api';
import { queryClient } from '../../queryClient';
import { formatRelativeTime } from '../../lib/notifications';
export function Header() {
  const { t, i18n } = useTranslation();
  const auth = useAuthOptional();
  const session = auth?.session ?? null;
  const signOut = auth?.signOut;
  const token = session?.access_token ?? '';
  const { data: profile } = useUser();
  const { pathname } = useLocation();
  const isLanding = pathname === '/';
  const [scrolledOnLanding, setScrolledOnLanding] = useState(false);
  const scrolled = isLanding ? scrolledOnLanding : false;

  useEffect(() => {
    if (!isLanding) return;
    const onScroll = () => setScrolledOnLanding(window.scrollY > 48);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const avatarThumb = profile?.avatarThumbUrl || profile?.avatarUrl;
  const profileLabel = profile?.username
    ? `(@${profile.username})`
    : profile?.email
      ? `(${profile.email})`
      : '';
  const [nowMs] = useState(() => Date.now());
  const unreadCount = notifications?.filter((item) => !item.readAt).length ?? 0;
  const previewItems = (notifications ?? []).slice(0, 5);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (!mobileMenuRef.current) return;
      if (!mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
      if (!notificationsRef.current) return;
      if (!notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
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

        {/* Navigation */}
        <nav className="flex items-center gap-2 sm:gap-3">
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
                    <Link to="/connections" className={`nav-dropdown-item${pathname === '/connections' ? ' nav-dropdown-item-active' : ''}`} role="menuitem">
                      <Users className="nav-icon" aria-hidden="true" />
                      {t('nav.connections')}
                    </Link>
                    <Link to="/health" className={`nav-dropdown-item${pathname === '/health' ? ' nav-dropdown-item-active' : ''}`} role="menuitem">
                      <HeartPulse className="nav-icon" aria-hidden="true" />
                      {t('nav.health')}
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
                <Link to="/connections" className={`nav-link${pathname === '/connections' ? ' nav-link-active' : ''}`}>
                  <Users className="nav-icon" aria-hidden="true" />
                  {t('nav.connections')}
                </Link>
                <Link to="/health" className={`nav-link${pathname === '/health' ? ' nav-link-active' : ''}`}>
                  <HeartPulse className="nav-icon" aria-hidden="true" />
                  {t('nav.health')}
                </Link>
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
                    ) : (
                      <span className="nav-avatar-fallback" aria-hidden="true" />
                    )}
                  </span>
                  {t('nav.profile')}
                  {profileLabel && <span className="nav-username">{profileLabel}</span>}
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
