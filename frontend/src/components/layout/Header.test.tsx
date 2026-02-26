import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';

const useAuthOptionalMock = vi.fn();
const useUserMock = vi.fn();
const useQueryMock = vi.fn();
const useMutationMock = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuthOptional: () => useAuthOptionalMock(),
}));

vi.mock('../../hooks/useUser', () => ({
  useUser: () => useUserMock(),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQuery: (options: unknown) => useQueryMock(options),
    useMutation: (options: unknown) => useMutationMock(options),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
}

describe('Header', () => {
  beforeEach(() => {
    useAuthOptionalMock.mockReset();
    useUserMock.mockReset();
    useQueryMock.mockReset();
    useMutationMock.mockReset();
    useMutationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders sign-in nav for unauthenticated users', () => {
    useAuthOptionalMock.mockReturnValue({
      session: null,
      signOut: vi.fn(),
    });
    useUserMock.mockReturnValue({ data: undefined });
    useQueryMock.mockReturnValue({ data: undefined });

    renderHeader();

    expect(screen.getByText('auth.signIn')).toBeInTheDocument();
    expect(screen.queryByText('nav.dashboard')).not.toBeInTheDocument();
  });

  it('renders authenticated nav and unread badge count', () => {
    useAuthOptionalMock.mockReturnValue({
      session: { access_token: 'token' },
      signOut: vi.fn(),
    });
    useUserMock.mockReturnValue({
      data: {
        username: 'migue',
      },
    });
    useQueryMock.mockReturnValue({
      data: [
        { id: 'n1', readAt: null },
        { id: 'n2', readAt: null },
        { id: 'n3', readAt: '2026-02-01T00:00:00.000Z' },
      ],
    });

    renderHeader();

    expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
    expect(screen.getByText('nav.connections')).toBeInTheDocument();
    expect(screen.getByText('nav.health')).toBeInTheDocument();
    expect(screen.getByText('nav.notifications')).toBeInTheDocument();
    expect(screen.getByText('(@migue)')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not show unread badge when there are no unread notifications', () => {
    useAuthOptionalMock.mockReturnValue({
      session: { access_token: 'token' },
      signOut: vi.fn(),
    });
    useUserMock.mockReturnValue({ data: { username: 'migue' } });
    useQueryMock.mockReturnValue({
      data: [{ id: 'n1', readAt: '2026-02-01T00:00:00.000Z' }],
    });

    const { container } = renderHeader();

    expect(container.querySelector('.nav-bell-badge')).toBeNull();
    expect(container.querySelector('.nav-mobile-badge')).toBeNull();
  });
});

describe('Header — transparent landing variant', () => {
  beforeEach(() => {
    useAuthOptionalMock.mockReturnValue({ session: null, signOut: vi.fn() });
    useUserMock.mockReturnValue({ data: undefined });
    useQueryMock.mockReturnValue({ data: undefined });
  });

  it('has navbar--transparent class on landing page when not scrolled', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );
    expect(container.querySelector('header')?.classList.contains('navbar--transparent')).toBe(true);
  });

  it('does NOT have navbar--transparent class on non-landing pages', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/guides']}>
        <Header />
      </MemoryRouter>
    );
    expect(container.querySelector('header')?.classList.contains('navbar--transparent')).toBe(false);
  });
});
