import { render, screen } from '@testing-library/react';
import { HealthStatusPage } from './HealthStatusPage';

const useAuthMock = vi.fn();
const useQueryMock = vi.fn();
const useMutationMock = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
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

describe('HealthStatusPage loading behavior', () => {
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

  it('shows page skeleton on first load', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = render(<HealthStatusPage />);

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByText('health.title')).not.toBeInTheDocument();
  });

  it('keeps content visible during refetch when data exists', () => {
    useQueryMock.mockImplementation((input: { queryKey: string[] }) => {
      const rootKey = input.queryKey[0];
      if (rootKey === 'health') {
        return { data: [], isLoading: true };
      }
      if (rootKey === 'exposures') {
        return { data: { exposures: [] }, isLoading: true };
      }
      return { data: undefined, isLoading: false };
    });

    const { container } = render(<HealthStatusPage />);

    expect(screen.getByText('health.title')).toBeInTheDocument();
    expect(screen.getByText('health.noStatus')).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton')).toHaveLength(0);
  });
});
