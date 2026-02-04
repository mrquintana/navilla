import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../hooks/useUser';
import { Bell, ChevronDown, HeartPulse, LayoutDashboard, LogOut, UserCircle2, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
export function Header() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const { data: profile } = useUser();
  const avatarThumb = profile?.avatarThumbUrl || profile?.avatarUrl;
  const profileLabel = profile?.username
    ? `(@${profile.username})`
    : profile?.email
      ? `(${profile.email})`
      : '';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
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
          {session ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex nav-link"
              >
                <LayoutDashboard className="nav-icon" aria-hidden="true" />
                {t('nav.dashboard')}
              </Link>
              <Link
                to="/connections"
                className="hidden sm:inline-flex nav-link"
              >
                <Users className="nav-icon" aria-hidden="true" />
                {t('nav.connections')}
              </Link>
              <Link
                to="/health"
                className="hidden sm:inline-flex nav-link"
              >
                <HeartPulse className="nav-icon" aria-hidden="true" />
                {t('nav.health')}
              </Link>
              <Link
                to="/notifications"
                className="hidden sm:inline-flex nav-link"
              >
                <Bell className="nav-icon" aria-hidden="true" />
                {t('nav.notifications')}
              </Link>
              <div className="hidden sm:inline-flex nav-menu" ref={menuRef}>
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
                        signOut();
                      }}
                      role="menuitem"
                    >
                      <LogOut className="nav-icon" aria-hidden="true" />
                      {t('auth.signOut')}
                    </button>
                  </div>
                )}
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
              <Link to="/signup" className="btn btn-primary text-sm">
                {t('auth.signUp')}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
