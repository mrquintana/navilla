import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../hooks/useUser';
import { Bell, HeartPulse, LayoutDashboard, Users } from 'lucide-react';
export function Header() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { data: profile } = useUser();
  const avatarThumb = profile?.avatarThumbUrl || profile?.avatarUrl;

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
              <Link
                to="/profile"
                className="hidden sm:inline-flex nav-link"
              >
                <span className="nav-avatar">
                  {avatarThumb ? (
                    <img src={avatarThumb} alt={t('profile.avatarAlt')} />
                  ) : (
                    <span className="nav-avatar-fallback" aria-hidden="true" />
                  )}
                </span>
                {t('nav.profile')}
              </Link>
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
