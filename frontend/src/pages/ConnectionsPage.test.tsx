import { render, screen } from '@testing-library/react';
import { ConnectionsPage } from './ConnectionsPage';
import { MemoryRouter } from 'react-router-dom';

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

describe('ConnectionsPage loading behavior', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useQueryMock.mockReset();
    useMutationMock.mockReset();

    useAuthMock.mockReturnValue({
      session: { access_token: 'token' },
    });

    useMutationMock.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('shows page skeleton during first load with no connection data', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = render(
      <MemoryRouter>
        <ConnectionsPage />
      </MemoryRouter>
    );

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByText('connections.title')).not.toBeInTheDocument();
  });

  it('keeps section content during refetch when data is present', () => {
    useQueryMock.mockImplementation((input: { queryKey: string[] }) => {
      const rootKey = input.queryKey[1];
      if (rootKey === 'pendingIncoming') {
        return { data: [], isLoading: true };
      }
      if (rootKey === 'pendingSent') {
        return { data: [], isLoading: true };
      }
      if (rootKey === 'confirmed') {
        return { data: [], isLoading: true };
      }
      return { data: [], isLoading: false };
    });

    const { container } = render(
      <MemoryRouter>
        <ConnectionsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('connections.title')).toBeInTheDocument();
    expect(screen.getByText('connections.noPending')).toBeInTheDocument();
    expect(screen.getByText('connections.noPendingSent')).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton')).toHaveLength(0);
  });
});
