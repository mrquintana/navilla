import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { FullPageLoader } from './components/ui/LoadingShell';
import { ErrorPage } from './pages/ErrorPage';

// --- Lazy-loaded page components (route-level code splitting) ---

const HomePage = lazy(() =>
  import('./pages/HomePage').then(m => ({ default: m.HomePage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then(m => ({ default: m.LoginPage })),
);
const SignUpPage = lazy(() =>
  import('./pages/SignUpPage').then(m => ({ default: m.SignUpPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then(m => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then(m => ({
    default: m.ResetPasswordPage,
  })),
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })),
);
const ConnectionsPage = lazy(() =>
  import('./pages/ConnectionsPage').then(m => ({ default: m.ConnectionsPage })),
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })),
);
const HealthLogPage = lazy(() =>
  import('./pages/HealthLogPage').then(m => ({ default: m.HealthLogPage })),
);
const ConditionDetailPage = lazy(() =>
  import('./pages/ConditionDetailPage').then(m => ({
    default: m.ConditionDetailPage,
  })),
);
const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage').then(m => ({
    default: m.NotificationsPage,
  })),
);
const HowItWorksPage = lazy(() =>
  import('./pages/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })),
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then(m => ({ default: m.ContactPage })),
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then(m => ({ default: m.AboutPage })),
);
const CareersPage = lazy(() =>
  import('./pages/CareersPage').then(m => ({ default: m.CareersPage })),
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })),
);
const SecurityPage = lazy(() =>
  import('./pages/SecurityPage').then(m => ({ default: m.SecurityPage })),
);
const TermsPage = lazy(() =>
  import('./pages/TermsPage').then(m => ({ default: m.TermsPage })),
);
const PrivacyPolicyPage = lazy(() =>
  import('./pages/PrivacyPolicyPage').then(m => ({
    default: m.PrivacyPolicyPage,
  })),
);
const CookiePolicyPage = lazy(() =>
  import('./pages/CookiePolicyPage').then(m => ({
    default: m.CookiePolicyPage,
  })),
);
const HelpPage = lazy(() =>
  import('./pages/HelpPage').then(m => ({ default: m.HelpPage })),
);
const StatusPage = lazy(() =>
  import('./pages/StatusPage').then(m => ({ default: m.StatusPage })),
);
const AccessibilityPage = lazy(() =>
  import('./pages/AccessibilityPage').then(m => ({
    default: m.AccessibilityPage,
  })),
);
const JournalPage = lazy(() =>
  import('./pages/JournalPage').then(m => ({ default: m.JournalPage })),
);
const PartnerDetailPage = lazy(() =>
  import('./pages/PartnerDetailPage').then(m => ({
    default: m.PartnerDetailPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })),
);
const WindowPeriodCalculatorPage = lazy(() =>
  import('./pages/WindowPeriodCalculatorPage').then(m => ({
    default: m.WindowPeriodCalculatorPage,
  })),
);
const GuidesIndexPage = lazy(() =>
  import('./pages/GuidesIndexPage').then(m => ({ default: m.GuidesIndexPage })),
);
const GuideDetailPage = lazy(() =>
  import('./pages/GuideDetailPage').then(m => ({ default: m.GuideDetailPage })),
);
const TestingCostPage = lazy(() =>
  import('./pages/TestingCostPage').then(m => ({ default: m.TestingCostPage })),
);
const MedicationDetailPage = lazy(() =>
  import('./pages/MedicationDetailPage').then(m => ({
    default: m.MedicationDetailPage,
  })),
);
const InsightsPage = lazy(() =>
  import('./pages/InsightsPage').then(m => ({ default: m.InsightsPage })),
);
const NetworkPage = lazy(() =>
  import('./pages/NetworkPage').then(m => ({ default: m.NetworkPage })),
);
const VerificationCardPage = lazy(() =>
  import('./pages/VerificationCardPage').then(m => ({ default: m.VerificationCardPage })),
);
const PublicVerificationCardPage = lazy(() =>
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
