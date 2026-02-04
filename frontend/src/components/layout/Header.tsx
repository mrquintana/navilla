import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { LanguageSwitcher } from '../LanguageSwitcher';

export function Header() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();

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
        <nav className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />
          {session ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                to="/connections"
                className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t('nav.connections')}
              </Link>
              <Link
                to="/health"
                className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t('nav.health')}
              </Link>
              <Link
                to="/notifications"
                className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t('nav.notifications')}
              </Link>
              <Link
                to="/profile"
                className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t('nav.profile')}
              </Link>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-error rounded-lg hover:bg-gray-100 transition-colors"
              >
                {t('auth.signOut')}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
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
