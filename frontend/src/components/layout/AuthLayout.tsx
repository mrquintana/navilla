import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Footer } from './Footer';

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-auth-fractal flex flex-col">
      <header className="p-4">
        <Link to="/" className="navbar-logo-text hover:no-underline">
          {t('common.appName')}
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
