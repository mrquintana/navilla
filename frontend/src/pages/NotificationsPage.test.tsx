import { render, screen } from '@testing-library/react';
import { NotificationsPage } from './NotificationsPage';

const useAuthMock = vi.fn();
const useQueryMock = vi.fn();
const useMutationMock = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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

describe('NotificationsPage loading behavior', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useQueryMock.mockReset();
    useMutationMock.mockReset();

    useAuthMock.mockReturnValue({
      session: { access_token: 'token' },
    });

    useMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('shows skeleton on first load with no data', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = render(<NotificationsPage />);

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByText('notifications.title')).not.toBeInTheDocument();
  });

  it('keeps list visible during refetch when data already exists', () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 'n1',
          messageKey: 'notifications.connectionRequest',
          createdAt: '2026-02-01T00:00:00.000Z',
          readAt: null,
        },
      ],
      isLoading: true,
    });

    const { container } = render(<NotificationsPage />);

    expect(screen.getByText('notifications.title (1)')).toBeInTheDocument();
    expect(screen.getByText('notifications.connectionRequest')).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton')).toHaveLength(0);
  });
});
