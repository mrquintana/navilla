import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GuideDetailPage } from './GuideDetailPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en_US' },
  }),
}));

function renderWithSlug(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/guide/${slug}`]}>
      <Routes>
        <Route path="/guide/:slug" element={<GuideDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderWithForcedSlug(slug: string) {
  return render(
    <MemoryRouter>
      <GuideDetailPage forcedSlug={slug} />
    </MemoryRouter>
  );
}

describe('GuideDetailPage — chlamydia', () => {
  it('renders chlamydia guide title', () => {
    renderWithSlug('chlamydia');
    expect(screen.getByRole('heading', { name: 'Chlamydia', level: 1 })).toBeInTheDocument();
  });

  it('renders all 6 guide sections', () => {
    renderWithSlug('chlamydia');
    expect(screen.getByText('What is it?')).toBeInTheDocument();
    expect(screen.getByText('How it spreads')).toBeInTheDocument();
    expect(screen.getByText('Symptoms')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
    expect(screen.getByText('Treatment')).toBeInTheDocument();
    expect(screen.getByText('Prevention')).toBeInTheDocument();
  });

  it('renders window period callout with correct range', () => {
    renderWithSlug('chlamydia');
    expect(screen.getByText(/5–14/)).toBeInTheDocument();
  });

  it('renders sources section', () => {
    renderWithSlug('chlamydia');
    expect(screen.getByText(/CDC — Chlamydia/)).toBeInTheDocument();
  });

  it('renders sign-up CTA', () => {
    renderWithSlug('chlamydia');
    expect(screen.getByText('Track your testing history')).toBeInTheDocument();
  });

  it('renders breadcrumb', () => {
    renderWithSlug('chlamydia');
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByText('Guides')).toBeInTheDocument();
  });
});

describe('GuideDetailPage — HIV', () => {
  it('renders HIV guide title', () => {
    renderWithSlug('hiv');
    expect(screen.getByRole('heading', { name: 'HIV', level: 1 })).toBeInTheDocument();
  });

  it('renders HIV guide section content', () => {
    renderWithSlug('hiv');
    const matches = screen.getAllByText(/antiretroviral therapy/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renders HIV window period (18–45 days)', () => {
    renderWithSlug('hiv');
    const matches = screen.getAllByText(/18–45/);
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe('GuideDetailPage — coming soon (HPV)', () => {
  it('shows coming soon state for HPV', () => {
    renderWithSlug('hpv');
    expect(screen.getByTestId('guide-coming-soon')).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('does not show guide section content for HPV', () => {
    renderWithSlug('hpv');
    expect(screen.queryByText('What is it?')).not.toBeInTheDocument();
  });

  it('shows link to calculator in coming soon state', () => {
    renderWithSlug('hpv');
    const link = screen.getByRole('link', { name: /go to calculator/i });
    expect(link).toBeInTheDocument();
  });
});

describe('GuideDetailPage — not found', () => {
  it('shows not found state for unknown slug', () => {
    renderWithSlug('unknown-condition-xyz');
    expect(screen.getByTestId('guide-not-found')).toBeInTheDocument();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  it('shows browse all guides link', () => {
    renderWithSlug('unknown-condition-xyz');
    expect(screen.getByRole('link', { name: /browse all guides/i })).toBeInTheDocument();
  });
});

describe('GuideDetailPage — forcedSlug prop (SSR)', () => {
  it('renders chlamydia via forcedSlug without router params', () => {
    renderWithForcedSlug('chlamydia');
    expect(screen.getByRole('heading', { name: 'Chlamydia', level: 1 })).toBeInTheDocument();
  });

  it('renders HIV via forcedSlug', () => {
    renderWithForcedSlug('hiv');
    expect(screen.getByRole('heading', { name: 'HIV', level: 1 })).toBeInTheDocument();
  });
});

describe('GuideDetailPage — SEO', () => {
  it('renders hreflang alternate links in document head', () => {
    renderWithSlug('chlamydia');
    // React 19 renders <link> tags to document.head, not into the container
    const hreflang = document.head.querySelector('link[hreflang="es"]');
    expect(hreflang).not.toBeNull();
  });
});
