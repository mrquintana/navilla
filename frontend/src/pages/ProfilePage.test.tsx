import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const useAuthMock = vi.fn();
const useUserMock = vi.fn();
const useMutationMock = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../hooks/useUser', () => ({
  useUser: () => useUserMock(),
}));

vi.mock('../components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div>language-switcher</div>,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn(),
      }),
    },
  },
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
    useMutation: (options: unknown) => useMutationMock(options),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

async function renderProfile() {
  const { ProfilePage } = await import('./ProfilePage');
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );
}

describe('ProfilePage loading behavior', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useUserMock.mockReset();
    useMutationMock.mockReset();

    useAuthMock.mockReturnValue({
      session: { access_token: 'token', user: { id: 'u1' } },
      signOut: vi.fn(),
    });

    useMutationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('shows page skeleton while profile is loading', async () => {
    useUserMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = await renderProfile();

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByText('profile.title')).not.toBeInTheDocument();
  });

  it('renders profile content when data is loaded', async () => {
    useUserMock.mockReturnValue({
      data: {
        email: 'user@example.com',
        firstName: 'Migue',
        lastName: 'Example',
        username: 'migue',
        sex: 'male',
        dateOfBirth: '1990-01-01',
        showAge: true,
        country: 'US',
        location: 'Austin, TX',
        profileVisibility: 'PRIVATE',
      },
      isLoading: false,
    });

    const { container } = await renderProfile();

    expect(screen.getByText('profile.title')).toBeInTheDocument();
    expect(screen.getByText('settings.title')).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton')).toHaveLength(0);
  });
});
