import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { SignUpCTA } from './SignUpCTA';

vi.mock('../../contexts/AuthContext', () => ({
  useAuthOptional: vi.fn(),
}));

import { useAuthOptional } from '../../contexts/AuthContext';

describe('SignUpCTA', () => {
  it('renders when user is not authenticated', () => {
    (useAuthOptional as ReturnType<typeof vi.fn>).mockReturnValue({ session: null });
    render(
      <MemoryRouter>
        <SignUpCTA
          titleEn="Track your testing history"
          titleEs="Lleva un registro de tus pruebas"
          bodyEn="Log results and see risk signals — privately."
          bodyEs="Registra resultados y ve señales de riesgo — de forma privada."
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Track your testing history')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create free account/i })).toHaveAttribute('href', '/signup');
  });

  it('does not render when user is authenticated', () => {
    (useAuthOptional as ReturnType<typeof vi.fn>).mockReturnValue({ session: { access_token: 'x' } });
    render(
      <MemoryRouter>
        <SignUpCTA
          titleEn="Track your testing history"
          titleEs="Lleva un registro"
          bodyEn="Log results."
          bodyEs="Registra resultados."
        />
      </MemoryRouter>
    );
    expect(screen.queryByText('Track your testing history')).not.toBeInTheDocument();
  });
});
