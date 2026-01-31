import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();

  return (
    <header className="border-b border-border bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-semibold text-foreground">
            {t('common.appName')}
          </Link>

          <nav className="flex items-center gap-4">
            {session ? (
              <>
                <Link to="/dashboard" className="text-muted hover:text-foreground">
                  {t('nav.dashboard')}
                </Link>
                <span className="text-muted text-sm">{session.user.email}</span>
                <button onClick={() => signOut()} className="btn btn-secondary">
                  {t('auth.signOut')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  {t('auth.signIn')}
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  {t('auth.signUp')}
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
