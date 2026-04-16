import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in React tree:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="card card-elevated max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted">
            We ran into an unexpected problem. Reloading the page usually fixes
            this. If it keeps happening, please contact{' '}
            <a href="mailto:contact@navilla.app" className="underline">
              contact@navilla.app
            </a>
            .
          </p>
          {this.state.error?.message && (
            <p className="text-xs text-muted font-mono break-all">
              {this.state.error.message}
            </p>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <button onClick={this.handleReload} className="btn btn-primary">
              Reload page
            </button>
            <button onClick={this.handleGoHome} className="btn btn-secondary">
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
