import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4">
        <Link to="/" className="text-xl font-semibold text-foreground">
          {t('common.appName')}
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
