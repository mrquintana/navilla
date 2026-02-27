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
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ContactPage } from './pages/ContactPage';
import { AboutPage } from './pages/AboutPage';
import { CareersPage } from './pages/CareersPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SecurityPage } from './pages/SecurityPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { HelpPage } from './pages/HelpPage';
import { StatusPage } from './pages/StatusPage';
import { AccessibilityPage } from './pages/AccessibilityPage';
import { JournalPage } from './pages/JournalPage';
import { PartnerDetailPage } from './pages/PartnerDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ErrorPage } from './pages/ErrorPage';
import { WindowPeriodCalculatorPage } from './pages/WindowPeriodCalculatorPage';
import { GuidesIndexPage } from './pages/GuidesIndexPage';
import { GuideDetailPage } from './pages/GuideDetailPage';
import { TestingCostPage } from './pages/TestingCostPage';

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
        path: 'journal',
        element: (
          <ProtectedRoute>
            <JournalPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'journal/partner/:id',
        element: (
          <ProtectedRoute>
            <PartnerDetailPage />
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
      { path: 'calculator', element: <WindowPeriodCalculatorPage /> },
      { path: 'guides', element: <GuidesIndexPage /> },
      { path: 'guide/:slug', element: <GuideDetailPage /> },
      { path: 'testing-cost', element: <TestingCostPage /> },
      { path: 'how-it-works', element: <HowItWorksPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'careers', element: <CareersPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'security', element: <SecurityPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      { path: 'cookie-policy', element: <CookiePolicyPage /> },
      { path: 'help', element: <HelpPage /> },
      { path: 'status', element: <StatusPage /> },
      { path: 'accessibility', element: <AccessibilityPage /> },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignUpPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
]);
