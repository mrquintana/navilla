import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { queryClient } from './queryClient';
import { router } from './router';
import { FullPageLoader } from './components/ui/LoadingShell';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

function LoadingFallback() {
  return <FullPageLoader />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<LoadingFallback />}>
              <RouterProvider router={router} />
            </Suspense>
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
