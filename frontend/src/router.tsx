import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { HealthStatusPage } from './pages/HealthStatusPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { InfoPage } from './pages/InfoPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ErrorPage } from './pages/ErrorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'connections',
        element: (
          <ProtectedRoute>
            <ConnectionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'health',
        element: (
          <ProtectedRoute>
            <HealthStatusPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'how-it-works',
        element: <InfoPage title="How it works" subtitle="A short overview of how Navilla protects your privacy." />,
      },
      {
        path: 'privacy',
        element: <InfoPage title="Privacy" subtitle="How we protect your identity and data." />,
      },
      {
        path: 'security',
        element: <InfoPage title="Security" subtitle="Our approach to securing your data." />,
      },
      {
        path: 'about',
        element: <InfoPage title="About" subtitle="Why Navilla exists and who we serve." />,
      },
      {
        path: 'contact',
        element: <InfoPage title="Contact" subtitle="Get in touch with the Navilla team." />,
      },
      {
        path: 'careers',
        element: <InfoPage title="Careers" subtitle="Join us in building privacy-first health tools." />,
      },
      {
        path: 'terms',
        element: (
          <InfoPage
            title="Terms"
            subtitle="Terms of service (placeholder)."
            notice={(
              <p>
                Some pages link to external health resources for your convenience. These links
                are provided for informational purposes only. Navilla does not control external
                sites and is not responsible for their content, accuracy, or availability. Your
                decision to use external resources is your responsibility.
              </p>
            )}
          />
        ),
      },
      {
        path: 'privacy-policy',
        element: <InfoPage title="Privacy Policy" subtitle="Privacy policy (placeholder)." />,
      },
      {
        path: 'cookie-policy',
        element: <InfoPage title="Cookie Policy" subtitle="Cookie policy (placeholder)." />,
      },
      {
        path: 'help',
        element: <InfoPage title="Help Center" subtitle="Find answers to common questions." />,
      },
      {
        path: 'status',
        element: <InfoPage title="Status" subtitle="Current system status (placeholder)." />,
      },
      {
        path: 'accessibility',
        element: <InfoPage title="Accessibility" subtitle="Our accessibility commitment." />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignUpPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },
]);
