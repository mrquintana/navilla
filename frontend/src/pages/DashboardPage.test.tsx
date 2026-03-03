import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';

const useAuthMock = vi.fn();
const useUserMock = vi.fn();
const useQueryMock = vi.fn();
const useMutationMock = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../hooks/useUser', () => ({
  useUser: () => useUserMock(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en_US' },
  }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQuery: (options: unknown) => useQueryMock(options),
    useMutation: (options: unknown) => useMutationMock(options),
  };
});

// Mock UpcomingReminders to avoid needing the full reminders hooks/API
vi.mock('../components/reminders/UpcomingReminders', () => ({
  UpcomingReminders: () => <div data-testid="upcoming-reminders">Reminders</div>,
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe('DashboardPage loading behavior', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useUserMock.mockReset();
    useQueryMock.mockReset();
    useMutationMock.mockReset();
    localStorage.removeItem('navilla_hide_snapshot_notice');

    useMutationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders skeleton shell during initial loading', () => {
    useAuthMock.mockReturnValue({
      user: { email: 'migue1990@example.com', user_metadata: {} },
      session: { access_token: 'token' },
      isLoading: true,
    });

    useUserMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    });

    const { container } = renderDashboard();

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { name: /dashboard\.welcome/i })).not.toBeInTheDocument();
  });

  it('renders stable greeting from profile data after loading', () => {
    useAuthMock.mockReturnValue({
      user: { email: 'migue1990@example.com', user_metadata: {} },
      session: { access_token: 'token' },
      isLoading: false,
    });

    useUserMock.mockReturnValue({
      data: {
        displayName: 'Migue',
        email: 'migue1990@example.com',
        profileVisibility: 'PRIVATE',
      },
      isLoading: false,
      error: null,
    });

    useQueryMock.mockImplementation((input: { queryKey: string[] }) => {
      const rootKey = input.queryKey[0];
      if (rootKey === 'connections') {
        return {
          data: { confirmedCount: 3 },
          isLoading: false,
        };
      }
      if (rootKey === 'exposures') {
        return {
          data: { exposures: [], totalGraphNodes: 12, maxDepth: 5 },
          isLoading: false,
          refetch: vi.fn(),
        };
      }
      if (rootKey === 'health') {
        return {
          data: [],
          isLoading: false,
        };
      }
      return {
        data: undefined,
        isLoading: false,
      };
    });

    renderDashboard();

    const greeting = screen.getByRole('heading', { name: 'dashboard.welcome, Migue' });
    expect(greeting).toBeInTheDocument();
    expect(greeting).not.toHaveTextContent('migue1990');
  });

  it('renders upcoming reminders section and quick actions', () => {
    useAuthMock.mockReturnValue({
      user: { email: 'migue1990@example.com', user_metadata: {} },
      session: { access_token: 'token' },
      isLoading: false,
    });

    useUserMock.mockReturnValue({
      data: {
        displayName: 'Migue',
        email: 'migue1990@example.com',
        profileVisibility: 'PRIVATE',
      },
      isLoading: false,
      error: null,
    });

    useQueryMock.mockImplementation((input: { queryKey: string[] }) => {
      const rootKey = input.queryKey[0];
      if (rootKey === 'connections') {
        return { data: { confirmedCount: 3 }, isLoading: false };
      }
      if (rootKey === 'exposures') {
        return { data: { exposures: [], totalGraphNodes: 12, maxDepth: 5 }, isLoading: false, refetch: vi.fn() };
      }
      if (rootKey === 'health') {
        return { data: [], isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });

    renderDashboard();

    // Upcoming reminders is rendered (mocked)
    expect(screen.getByTestId('upcoming-reminders')).toBeInTheDocument();

    // Quick action links are present
    expect(screen.getByText('dashboard.goToHealth')).toBeInTheDocument();
    expect(screen.getByText('dashboard.goToJournal')).toBeInTheDocument();
    expect(screen.getByText('dashboard.goToConnections')).toBeInTheDocument();
  });
});
