import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { TestingCostPage } from './TestingCostPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <TestingCostPage />
    </MemoryRouter>
  );
}

describe('TestingCostPage', () => {
  it('renders the page h1', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/testing costs in mexico/i);
  });

  it('renders all three tier section badges', () => {
    renderPage();
    expect(screen.getByText('Free Testing')).toBeInTheDocument();
    expect(screen.getByText('Affordable Private Labs')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive PCR Panels')).toBeInTheDocument();
  });

  it('renders all provider names as headings', () => {
    renderPage();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toContain('CAPASITS / SAI');
    expect(headings).toContain('Clínica Especializada Condesa');
    expect(headings).toContain('AHF Mexico');
    expect(headings).toContain('Marie Stopes / Fundación MSI');
    expect(headings).toContain('Salud Digna');
    expect(headings).toContain('Laboratorio Médico del Chopo');
  });

  it('renders Free price labels for government providers', () => {
    renderPage();
    const freeLabels = screen.getAllByText('Free');
    expect(freeLabels.length).toBeGreaterThan(0);
  });

  it('renders source links and verified date badges', () => {
    renderPage();
    const verifiedBadges = screen.getAllByText(/verified/i);
    expect(verifiedBadges.length).toBeGreaterThan(0);
    const censidaLinks = screen.getAllByText(/CENSIDA/);
    expect(censidaLinks.length).toBeGreaterThan(0);
  });

  it('renders real MXN prices', () => {
    renderPage();
    expect(screen.getByText('$476 MXN')).toBeInTheDocument();
    expect(screen.getByText('from $369 MXN')).toBeInTheDocument();
    expect(screen.getByText('$150 MXN')).toBeInTheDocument();
  });

  it('renders the disclaimer note', () => {
    renderPage();
    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText(/prices are approximate/i)).toBeInTheDocument();
  });

  it('renders cross-tool link to window period calculator', () => {
    renderPage();
    const calcLink = screen.getByRole('link', { name: /go to calculator/i });
    expect(calcLink).toBeInTheDocument();
    expect(calcLink).toHaveAttribute('href', '/calculator');
  });
});
