import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthOptional } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';
import { Bell, ChevronDown, HeartPulse, LayoutDashboard, LogOut, Menu, UserCircle2, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
export function Header() {
  const { t } = useTranslation();
  const auth = useAuthOptional();
  const session = auth?.session ?? null;
  const signOut = auth?.signOut;
  const token = session?.access_token ?? '';
  const { data: profile } = useUser();
  const { pathname } = useLocation();
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(token),
    enabled: !!token,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
  const avatarThumb = profile?.avatarThumbUrl || profile?.avatarUrl;
  const profileLabel = profile?.username
    ? `(@${profile.username})`
    : profile?.email
      ? `(${profile.email})`
      : '';
  const unreadCount = notifications?.filter((item) => !item.readAt).length ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
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
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="navbar border-b border-border-light">
      <div className="container flex justify-between items-center h-full">
        {/* Logo - Bold and substantial */}
        <Link to="/" className="flex items-center gap-2 hover:no-underline">
          <span className="text-2xl font-extrabold tracking-tight text-primary">
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
                <Link to="/notifications" className={`nav-link${pathname === '/notifications' ? ' nav-link-active' : ''}`}>
                  <span className="nav-bell" aria-hidden="true">
                    <Bell className="nav-icon" />
                    {unreadCount > 0 && (
                      <span className="nav-bell-badge">{unreadCount}</span>
                    )}
                  </span>
                  {t('nav.notifications')}
                </Link>
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
