import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();

  return (
    <header className="navbar">
      <div className="container flex justify-between items-center h-full">
        <Link to="/" className="text-xl font-bold text-foreground hover:no-underline">
          {t('common.appName')}
        </Link>

        <nav className="flex items-center gap-6">
          {session ? (
            <>
              <Link to="/dashboard" className="text-foreground-secondary hover:text-primary">
                {t('nav.dashboard')}
              </Link>
              <span className="text-muted text-sm">{session.user.email}</span>
              <button onClick={() => signOut()} className="btn btn-secondary">
                {t('auth.signOut')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-foreground-secondary hover:text-primary">
                {t('auth.signIn')}
              </Link>
              <Link to="/signup" className="btn btn-primary">
                {t('auth.signUp')}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
