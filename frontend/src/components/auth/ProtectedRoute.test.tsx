import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

const useAuthMock = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <div>secure dashboard</div>
            </ProtectedRoute>
          )}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it('shows loading shell while auth is loading', () => {
    useAuthMock.mockReturnValue({
      session: null,
      isLoading: true,
    });

    const { container } = renderRoute();

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByText('secure dashboard')).not.toBeInTheDocument();
  });

  it('redirects to login when user is unauthenticated', () => {
    useAuthMock.mockReturnValue({
      session: null,
      isLoading: false,
    });

    renderRoute();

    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secure dashboard')).not.toBeInTheDocument();
  });

  it('renders protected content when session exists', () => {
    useAuthMock.mockReturnValue({
      session: { access_token: 'token' },
      isLoading: false,
    });

    renderRoute();

    expect(screen.getByText('secure dashboard')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
});
