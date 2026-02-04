import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { DEV_MODE } from '../../lib/devMode';

export function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      {DEV_MODE && (
        <div className="bg-red-600 text-white text-center text-sm font-semibold py-2">
          DEV MODE ENABLED
        </div>
      )}
      <main className="pt-6 pb-12 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
