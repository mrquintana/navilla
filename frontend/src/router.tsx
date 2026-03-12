import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { FullPageLoader } from './components/ui/LoadingShell';
import { ErrorPage } from './pages/ErrorPage';

// Auto-reload on stale chunks after deploy
function lazyWithReload<T extends { default: React.ComponentType }>(
  factory: () => Promise<T>,
) {
  return lazy(() =>
    factory().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('dynamically imported module') || msg.includes('Failed to fetch')) {
        window.location.reload();
        return new Promise<T>(() => {}); // never resolves — reload takes over
      }
      throw err;
    }),
  );
}

// --- Lazy-loaded page components (route-level code splitting) ---

const HomePage = lazyWithReload(() =>
  import('./pages/HomePage').then(m => ({ default: m.HomePage })),
);
const LoginPage = lazyWithReload(() =>
  import('./pages/LoginPage').then(m => ({ default: m.LoginPage })),
);
const SignUpPage = lazyWithReload(() =>
  import('./pages/SignUpPage').then(m => ({ default: m.SignUpPage })),
);
const ForgotPasswordPage = lazyWithReload(() =>
  import('./pages/ForgotPasswordPage').then(m => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazyWithReload(() =>
  import('./pages/ResetPasswordPage').then(m => ({
    default: m.ResetPasswordPage,
  })),
);
const DashboardPage = lazyWithReload(() =>
  import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })),
);
const ConnectionsPage = lazyWithReload(() =>
  import('./pages/ConnectionsPage').then(m => ({ default: m.ConnectionsPage })),
);
const ProfilePage = lazyWithReload(() =>
  import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })),
);
const HealthLogPage = lazyWithReload(() =>
  import('./pages/HealthLogPage').then(m => ({ default: m.HealthLogPage })),
);
const ConditionDetailPage = lazyWithReload(() =>
  import('./pages/ConditionDetailPage').then(m => ({
    default: m.ConditionDetailPage,
  })),
);
const NotificationsPage = lazyWithReload(() =>
  import('./pages/NotificationsPage').then(m => ({
    default: m.NotificationsPage,
  })),
);
const HowItWorksPage = lazyWithReload(() =>
  import('./pages/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })),
);
const ContactPage = lazyWithReload(() =>
  import('./pages/ContactPage').then(m => ({ default: m.ContactPage })),
);
const AboutPage = lazyWithReload(() =>
  import('./pages/AboutPage').then(m => ({ default: m.AboutPage })),
);
const CareersPage = lazyWithReload(() =>
  import('./pages/CareersPage').then(m => ({ default: m.CareersPage })),
);
const PrivacyPage = lazyWithReload(() =>
  import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })),
);
const SecurityPage = lazyWithReload(() =>
  import('./pages/SecurityPage').then(m => ({ default: m.SecurityPage })),
);
const TermsPage = lazyWithReload(() =>
  import('./pages/TermsPage').then(m => ({ default: m.TermsPage })),
);
const PrivacyPolicyPage = lazyWithReload(() =>
  import('./pages/PrivacyPolicyPage').then(m => ({
    default: m.PrivacyPolicyPage,
  })),
);
const CookiePolicyPage = lazyWithReload(() =>
  import('./pages/CookiePolicyPage').then(m => ({
    default: m.CookiePolicyPage,
  })),
);
const HelpPage = lazyWithReload(() =>
  import('./pages/HelpPage').then(m => ({ default: m.HelpPage })),
);
const StatusPage = lazyWithReload(() =>
  import('./pages/StatusPage').then(m => ({ default: m.StatusPage })),
);
const AccessibilityPage = lazyWithReload(() =>
  import('./pages/AccessibilityPage').then(m => ({
    default: m.AccessibilityPage,
  })),
);
const JournalPage = lazyWithReload(() =>
  import('./pages/JournalPage').then(m => ({ default: m.JournalPage })),
);
const PartnerDetailPage = lazyWithReload(() =>
  import('./pages/PartnerDetailPage').then(m => ({
    default: m.PartnerDetailPage,
  })),
);
const NotFoundPage = lazyWithReload(() =>
  import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })),
);
const WindowPeriodCalculatorPage = lazyWithReload(() =>
  import('./pages/WindowPeriodCalculatorPage').then(m => ({
    default: m.WindowPeriodCalculatorPage,
  })),
);
const GuidesIndexPage = lazyWithReload(() =>
  import('./pages/GuidesIndexPage').then(m => ({ default: m.GuidesIndexPage })),
);
const GuideDetailPage = lazyWithReload(() =>
  import('./pages/GuideDetailPage').then(m => ({ default: m.GuideDetailPage })),
);
const TestingCostPage = lazyWithReload(() =>
  import('./pages/TestingCostPage').then(m => ({ default: m.TestingCostPage })),
);
const MedicationDetailPage = lazyWithReload(() =>
  import('./pages/MedicationDetailPage').then(m => ({
    default: m.MedicationDetailPage,
  })),
);
const InsightsPage = lazyWithReload(() =>
  import('./pages/InsightsPage').then(m => ({ default: m.InsightsPage })),
);
const NetworkPage = lazyWithReload(() =>
  import('./pages/NetworkPage').then(m => ({ default: m.NetworkPage })),
);
const VerificationCardPage = lazyWithReload(() =>
  import('./pages/VerificationCardPage').then(m => ({ default: m.VerificationCardPage })),
);
const PublicVerificationCardPage = lazyWithReload(() =>
  import('./pages/PublicVerificationCardPage').then(m => ({ default: m.PublicVerificationCardPage })),
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'journal',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader />}>
              <JournalPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'journal/partner/:id',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader />}>
              <PartnerDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'connections',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader />}>
              <ConnectionsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'health-log',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader />}>
              <HealthLogPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'health-log/medication/:id',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader />}>
              <MedicationDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'health-log/:condition',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader />}>
              <ConditionDetailPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'health',
        element: <Navigate to="/health-log" replace />,
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader />}>
              <NotificationsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'insights',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader />}>
              <InsightsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'network',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader />}>
              <NetworkPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'verification-card',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<FullPageLoader />}>
              <VerificationCardPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'v/:shareToken',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <PublicVerificationCardPage />
          </Suspense>
        ),
      },
      {
        path: 'calculator',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <WindowPeriodCalculatorPage />
          </Suspense>
        ),
      },
      {
        path: 'guides',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <GuidesIndexPage />
          </Suspense>
        ),
      },
      {
        path: 'guide/:slug',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <GuideDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'testing-cost',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <TestingCostPage />
          </Suspense>
        ),
      },
      {
        path: 'how-it-works',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <HowItWorksPage />
          </Suspense>
        ),
      },
      {
        path: 'about',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AboutPage />
          </Suspense>
        ),
      },
      {
        path: 'contact',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <ContactPage />
          </Suspense>
        ),
      },
      {
        path: 'careers',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <CareersPage />
          </Suspense>
        ),
      },
      {
        path: 'privacy',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <PrivacyPage />
          </Suspense>
        ),
      },
      {
        path: 'security',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <SecurityPage />
          </Suspense>
        ),
      },
      {
        path: 'terms',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <TermsPage />
          </Suspense>
        ),
      },
      {
        path: 'privacy-policy',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <PrivacyPolicyPage />
          </Suspense>
        ),
      },
      {
        path: 'cookie-policy',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <CookiePolicyPage />
          </Suspense>
        ),
      },
      {
        path: 'help',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <HelpPage />
          </Suspense>
        ),
      },
      {
        path: 'status',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <StatusPage />
          </Suspense>
        ),
      },
      {
        path: 'accessibility',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AccessibilityPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: 'signup',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <SignUpPage />
          </Suspense>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <ResetPasswordPage />
          </Suspense>
        ),
      },
    ],
  },
]);
