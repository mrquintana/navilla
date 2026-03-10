import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerificationCardPage } from './VerificationCardPage';
import type { VerificationCardResponse } from '../lib/api';

// ── Hoisted mock functions ──

const useVerificationCardsMock = vi.fn();
const useCreateVerificationCardMock = vi.fn();
const useUpdateVerificationCardMock = vi.fn();
const useDeleteVerificationCardMock = vi.fn();
const useQueryMock = vi.fn();

const defaultMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
};

vi.mock('../hooks/useVerificationCards', () => ({
  useVerificationCards: () => useVerificationCardsMock(),
  useCreateVerificationCard: () => useCreateVerificationCardMock(),
  useUpdateVerificationCard: () => useUpdateVerificationCardMock(),
  useDeleteVerificationCard: () => useDeleteVerificationCardMock(),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    session: { access_token: 'test-token' },
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'count' in opts) return `${key}:${opts.count}`;
      return key;
    },
    i18n: { language: 'en_US' },
  }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query'
  );
  return {
    ...actual,
    useQuery: () => useQueryMock(),
  };
});

// Mock qrcode to avoid dynamic import issues
vi.mock('qrcode', () => ({
  toString: vi.fn().mockResolvedValue('<svg></svg>'),
}));

function makeCard(overrides: Partial<VerificationCardResponse> = {}): VerificationCardResponse {
  return {
    id: 'card-1',
    displayName: 'Test User',
    includedConditions: ['HIV', 'SYPHILIS'],
    showTestDates: true,
    showVerificationLevel: true,
    shareToken: 'abc123',
    shareUrl: 'https://navilla.app/verify/abc123',
    privacyMode: 'PUBLIC',
    maxViews: null,
    currentViews: 5,
    expiresAt: null,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

describe('VerificationCardPage', () => {
  beforeEach(() => {
    useVerificationCardsMock.mockReset();
    useCreateVerificationCardMock.mockReset();
    useUpdateVerificationCardMock.mockReset();
    useDeleteVerificationCardMock.mockReset();
    useQueryMock.mockReset();

    useCreateVerificationCardMock.mockReturnValue(defaultMutation);
    useUpdateVerificationCardMock.mockReturnValue(defaultMutation);
    useDeleteVerificationCardMock.mockReturnValue(defaultMutation);
    useQueryMock.mockReturnValue({ data: [], isLoading: false });
  });

  it('renders page title and create button', () => {
    useVerificationCardsMock.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<VerificationCardPage />);

    expect(screen.getByText('verificationCard.title')).toBeInTheDocument();
    expect(screen.getByText('verificationCard.subtitle')).toBeInTheDocument();
    expect(screen.getByText('verificationCard.createCard')).toBeInTheDocument();
  });

  it('shows empty state when no cards exist', () => {
    useVerificationCardsMock.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<VerificationCardPage />);

    expect(screen.getByText('verificationCard.noCards')).toBeInTheDocument();
    expect(screen.getByText('verificationCard.noCardsHint')).toBeInTheDocument();
  });

  it('renders saved cards when data is available', () => {
    const card1 = makeCard({ id: 'card-1', displayName: 'Card One', currentViews: 10 });
    const card2 = makeCard({
      id: 'card-2',
      displayName: 'Card Two',
      currentViews: 3,
      maxViews: 50,
      expiresAt: '2026-04-01T00:00:00Z',
    });

    useVerificationCardsMock.mockReturnValue({
      data: [card1, card2],
      isLoading: false,
    });

    render(<VerificationCardPage />);

    expect(screen.getByText('Card One')).toBeInTheDocument();
    expect(screen.getByText('Card Two')).toBeInTheDocument();
    expect(screen.getByText('verificationCard.views:10')).toBeInTheDocument();
    expect(screen.getByText('verificationCard.views:3')).toBeInTheDocument();
    // Max views indicator for card2
    expect(screen.getByText('50')).toBeInTheDocument();
    // Expires at indicator for card2
    expect(screen.getByText(/verificationCard\.expiresAt/)).toBeInTheDocument();
    // No empty state
    expect(screen.queryByText('verificationCard.noCards')).not.toBeInTheDocument();
  });

  it('opens create modal when create button is clicked', () => {
    useVerificationCardsMock.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<VerificationCardPage />);

    // Modal should not be open initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click the create button
    fireEvent.click(screen.getByText('verificationCard.createCard'));

    // Modal should now be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Modal shows the form fields
    expect(screen.getByText('verificationCard.displayName')).toBeInTheDocument();
    expect(screen.getByText('verificationCard.includedConditions')).toBeInTheDocument();
    expect(screen.getByText('verificationCard.showTestDates')).toBeInTheDocument();
    expect(screen.getByText('verificationCard.showVerificationLevel')).toBeInTheDocument();
    expect(screen.getByText('verificationCard.viewLimit')).toBeInTheDocument();
  });

  it('copy link button copies shareUrl to clipboard', async () => {
    const card = makeCard({ shareUrl: 'https://navilla.app/verify/xyz789' });
    useVerificationCardsMock.mockReturnValue({
      data: [card],
      isLoading: false,
    });

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(<VerificationCardPage />);

    const copyButton = screen.getByTitle('verificationCard.copyLink');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('https://navilla.app/verify/xyz789');
    });

    // Shows "copied" confirmation text
    await waitFor(() => {
      expect(screen.getByText('verificationCard.linkCopied')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton when cards are loading', () => {
    useVerificationCardsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = render(<VerificationCardPage />);

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText('verificationCard.noCards')).not.toBeInTheDocument();
  });

  it('shows anonymous label when card has no display name', () => {
    const card = makeCard({ displayName: null });
    useVerificationCardsMock.mockReturnValue({
      data: [card],
      isLoading: false,
    });

    render(<VerificationCardPage />);

    expect(screen.getByText('publicCard.anonymous')).toBeInTheDocument();
  });

  it('shows delete confirmation flow', () => {
    const card = makeCard();
    useVerificationCardsMock.mockReturnValue({
      data: [card],
      isLoading: false,
    });

    render(<VerificationCardPage />);

    // Click the delete button
    fireEvent.click(screen.getByText('verificationCard.deleteCard'));

    // Confirmation prompt should appear
    expect(screen.getByText('verificationCard.deleteConfirm')).toBeInTheDocument();
    expect(screen.getByText('common.confirm')).toBeInTheDocument();
    expect(screen.getByText('common.cancel')).toBeInTheDocument();
  });

  it('renders edit button on existing cards', () => {
    const card = makeCard();
    useVerificationCardsMock.mockReturnValue({
      data: [card],
      isLoading: false,
    });

    render(<VerificationCardPage />);

    expect(screen.getByText('verificationCard.editCard')).toBeInTheDocument();
  });

  it('opens edit modal when edit button is clicked', () => {
    const card = makeCard({ displayName: 'My Card' });
    useVerificationCardsMock.mockReturnValue({
      data: [card],
      isLoading: false,
    });

    render(<VerificationCardPage />);

    fireEvent.click(screen.getByText('verificationCard.editCard'));

    // Modal opens in edit mode with title "editCard"
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders QR code button on existing cards', () => {
    const card = makeCard();
    useVerificationCardsMock.mockReturnValue({
      data: [card],
      isLoading: false,
    });

    render(<VerificationCardPage />);

    expect(screen.getByText('verificationCard.showQR')).toBeInTheDocument();
  });
});
