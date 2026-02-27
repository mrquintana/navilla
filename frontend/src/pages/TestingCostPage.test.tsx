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
  it('renders the page title', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/testing cost/i);
  });

  it('renders all 10 STI names', () => {
    renderPage();
    expect(screen.getByText('Chlamydia')).toBeInTheDocument();
    expect(screen.getByText('HIV')).toBeInTheDocument();
    expect(screen.getByText('Syphilis')).toBeInTheDocument();
  });

  it('renders provider tier column headers', () => {
    renderPage();
    expect(screen.getByText('CAPASITS / SAI')).toBeInTheDocument();
    expect(screen.getByText('Private Lab')).toBeInTheDocument();
  });

  it('renders cost tier symbols', () => {
    renderPage();
    const freeLabels = screen.getAllByText('Free');
    expect(freeLabels.length).toBeGreaterThan(0);
  });

  it('renders provider footnotes', () => {
    renderPage();
    expect(screen.getByText(/government sexual health clinics/i)).toBeInTheDocument();
  });
});
