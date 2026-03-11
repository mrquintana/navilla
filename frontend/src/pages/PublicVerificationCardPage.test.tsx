import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicVerificationCardPage } from './PublicVerificationCardPage';

// ── Hoisted mock functions ──

const useQueryMock = vi.fn();
const useParamsMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useParams: () => useParamsMock(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'lab' in opts && 'date' in opts) return `${key}:${opts.lab}:${opts.date}`;
      if (opts && 'lab' in opts) return `${key}:${opts.lab}`;
      if (opts && 'count' in opts) return `${key}:${opts.count}`;
      if (opts && 'date' in opts) return `${key}:${opts.date}`;
      if (opts && 'time' in opts) return `${key}:${opts.time}`;
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

// Mock the verify API to prevent real network calls
vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return {
    ...actual,
    api: {
      ...actual.api,
      verificationCards: {
        ...actual.api.verificationCards,
        verify: vi.fn().mockResolvedValue({ valid: true, verifiedAt: '2026-03-10T00:00:00Z', signature: 'sig' }),
      },
    },
  };
});

describe('PublicVerificationCardPage', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useParamsMock.mockReset();
    useParamsMock.mockReturnValue({ shareToken: 'abc123' });
  });

  it('shows loading state initially', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = render(<PublicVerificationCardPage />);

    // Loading skeleton pulses are shown
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    // No expired message
    expect(screen.queryByText('publicCard.expired')).not.toBeInTheDocument();
  });

  it('renders card data when loaded', () => {
    useQueryMock.mockReturnValue({
      data: {
        displayName: 'Miguel',
        username: 'miguel123',
        conditions: [
          {
            condition: 'HIV',
            status: 'NEGATIVE',
            verificationLevel: 'SELF_REPORTED',
            testDate: '2026-02-15',
            labName: null,
            labProvider: null,
            verifiedAt: null,
            labWebsiteUrl: null,
          },
          {
            condition: 'SYPHILIS',
            status: 'NEGATIVE',
            verificationLevel: null,
            testDate: null,
            labName: null,
            labProvider: null,
            verifiedAt: null,
            labWebsiteUrl: null,
          },
        ],
        expiresAt: null,
        viewsRemaining: null,
      },
      isLoading: false,
      isError: false,
    });

    render(<PublicVerificationCardPage />);

    // Title and branding
    expect(screen.getByText('publicCard.title')).toBeInTheDocument();
    // Display name
    expect(screen.getByText('Miguel')).toBeInTheDocument();
    // Username
    expect(screen.getByText('@miguel123')).toBeInTheDocument();
    // Conditions rendered
    expect(screen.getByText('healthLog.conditions.HIV')).toBeInTheDocument();
    expect(screen.getByText('healthLog.conditions.SYPHILIS')).toBeInTheDocument();
    // Status badges
    const negBadges = screen.getAllByText('NEGATIVE');
    expect(negBadges).toHaveLength(2);
    // Verified-by footer (now uses verifiedByPrefix + Navilla)
    expect(screen.getByText('publicCard.verifiedByPrefix')).toBeInTheDocument();
    expect(screen.getByText('Navilla')).toBeInTheDocument();
    // No expired message
    expect(screen.queryByText('publicCard.expired')).not.toBeInTheDocument();
  });

  it('shows expired message on error', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<PublicVerificationCardPage />);

    expect(screen.getByText('publicCard.expired')).toBeInTheDocument();
    expect(screen.getByText('publicCard.expiredHint')).toBeInTheDocument();
  });

  it('displays lab-verified badge and metadata', () => {
    useQueryMock.mockReturnValue({
      data: {
        displayName: 'Lab Verified User',
        username: 'labuser',
        conditions: [
          {
            condition: 'HIV',
            status: 'NEGATIVE',
            verificationLevel: 'LAB_VERIFIED',
            testDate: '2026-03-01',
            labName: null,
            labProvider: null,
            verifiedAt: null,
            labWebsiteUrl: null,
          },
          {
            condition: 'HEPATITIS_B',
            status: 'NEGATIVE',
            verificationLevel: 'DOCUMENT_VERIFIED',
            testDate: '2026-02-20',
            labName: null,
            labProvider: null,
            verifiedAt: null,
            labWebsiteUrl: null,
          },
        ],
        expiresAt: '2026-04-01T00:00:00Z',
        viewsRemaining: 8,
      },
      isLoading: false,
      isError: false,
    });

    render(<PublicVerificationCardPage />);

    // Lab verified badge text (only shown for LAB_VERIFIED, falls back to generic)
    expect(screen.getByText('publicCard.labVerified')).toBeInTheDocument();
    // Test dates shown
    expect(screen.getAllByText(/publicCard\.testDate/).length).toBe(2);
    // Expiry info
    expect(screen.getByText(/publicCard\.expiresOn/)).toBeInTheDocument();
    // Views remaining
    expect(screen.getByText('publicCard.viewsLeft:8')).toBeInTheDocument();
  });

  it('shows conditions with no verification level without a badge', () => {
    useQueryMock.mockReturnValue({
      data: {
        displayName: 'Simple Card',
        username: 'simpleuser',
        conditions: [
          {
            condition: 'CHLAMYDIA',
            status: 'NEGATIVE',
            verificationLevel: null,
            testDate: null,
            labName: null,
            labProvider: null,
            verifiedAt: null,
            labWebsiteUrl: null,
          },
        ],
        expiresAt: null,
        viewsRemaining: null,
      },
      isLoading: false,
      isError: false,
    });

    render(<PublicVerificationCardPage />);

    expect(screen.getByText('healthLog.conditions.CHLAMYDIA')).toBeInTheDocument();
    // No lab verified badge
    expect(screen.queryByText('publicCard.labVerified')).not.toBeInTheDocument();
  });

  it('shows empty conditions message when card has no conditions', () => {
    useQueryMock.mockReturnValue({
      data: {
        displayName: 'Empty Card',
        username: 'emptyuser',
        conditions: [],
        expiresAt: null,
        viewsRemaining: null,
      },
      isLoading: false,
      isError: false,
    });

    render(<PublicVerificationCardPage />);

    expect(screen.getByText('health.noStatus')).toBeInTheDocument();
  });

  it('renders lab provenance with lab name and date when present', () => {
    useQueryMock.mockReturnValue({
      data: {
        displayName: 'Provenance User',
        username: 'provuser',
        conditions: [
          {
            condition: 'HIV',
            status: 'NEGATIVE',
            verificationLevel: 'LAB_VERIFIED',
            testDate: '2026-03-01',
            labName: 'Lab Demo MX',
            labProvider: 'MOCK_DEMO_MX',
            verifiedAt: '2026-03-01T14:30:00Z',
            labWebsiteUrl: 'https://www.labdemomx.com',
          },
        ],
        expiresAt: null,
        viewsRemaining: null,
      },
      isLoading: false,
      isError: false,
    });

    render(<PublicVerificationCardPage />);

    // Should show "Verified by Lab Demo MX · date" instead of generic "Lab Verified"
    expect(screen.getByText(/publicCard\.verifiedByLabOn:Lab Demo MX/)).toBeInTheDocument();
    // "How we verify" link
    expect(screen.getByText('publicCard.howWeVerify')).toBeInTheDocument();
    // No generic label
    expect(screen.queryByText('publicCard.labVerified')).not.toBeInTheDocument();
  });

  it('opens and closes "How we verify" modal', () => {
    useQueryMock.mockReturnValue({
      data: {
        displayName: 'Modal User',
        username: 'modaluser',
        conditions: [
          {
            condition: 'HIV',
            status: 'NEGATIVE',
            verificationLevel: 'LAB_VERIFIED',
            testDate: '2026-03-01',
            labName: 'Lab Demo MX',
            labProvider: 'MOCK_DEMO_MX',
            verifiedAt: '2026-03-01T14:30:00Z',
            labWebsiteUrl: 'https://www.labdemomx.com',
          },
        ],
        expiresAt: null,
        viewsRemaining: null,
      },
      isLoading: false,
      isError: false,
    });

    render(<PublicVerificationCardPage />);

    // Modal not visible initially
    expect(screen.queryByText('publicCard.howWeVerifyTitle')).not.toBeInTheDocument();

    // Click "How we verify"
    fireEvent.click(screen.getByText('publicCard.howWeVerify'));

    // Modal appears
    expect(screen.getByText('publicCard.howWeVerifyTitle')).toBeInTheDocument();
    expect(screen.getByText('publicCard.howWeVerifyDismiss')).toBeInTheDocument();

    // Dismiss
    fireEvent.click(screen.getByText('publicCard.howWeVerifyDismiss'));

    // Modal gone
    expect(screen.queryByText('publicCard.howWeVerifyTitle')).not.toBeInTheDocument();
  });

  it('shows generic Lab Verified fallback when no labName', () => {
    useQueryMock.mockReturnValue({
      data: {
        displayName: 'Fallback User',
        username: 'fallbackuser',
        conditions: [
          {
            condition: 'HIV',
            status: 'NEGATIVE',
            verificationLevel: 'LAB_VERIFIED',
            testDate: '2026-03-01',
            labName: null,
            labProvider: null,
            verifiedAt: null,
            labWebsiteUrl: null,
          },
        ],
        expiresAt: null,
        viewsRemaining: null,
      },
      isLoading: false,
      isError: false,
    });

    render(<PublicVerificationCardPage />);

    // Should show generic "Lab Verified"
    expect(screen.getByText('publicCard.labVerified')).toBeInTheDocument();
    // "How we verify" link still present
    expect(screen.getByText('publicCard.howWeVerify')).toBeInTheDocument();
  });
});
