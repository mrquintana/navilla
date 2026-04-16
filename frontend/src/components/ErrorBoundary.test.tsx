import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const Boom = ({ message = 'kaboom' }: { message?: string }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div>healthy content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('healthy content')).toBeInTheDocument();
  });

  it('renders fallback UI with error message when child throws', () => {
    render(
      <ErrorBoundary>
        <Boom message="render exploded" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('render exploded')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reload page' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Go home' })
    ).toBeInTheDocument();
  });

  it('shows contact email in fallback for support', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    const link = screen.getByRole('link', { name: 'contact@navilla.app' });
    expect(link).toHaveAttribute('href', 'mailto:contact@navilla.app');
  });
});
