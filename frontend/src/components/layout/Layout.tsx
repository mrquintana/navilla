import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-6 pb-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
