import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallPrompt } from './InstallPrompt';
import { vi, beforeEach } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockInstall = vi.fn();
const mockDismiss = vi.fn();
let mockCanInstall = true;

vi.mock('../../hooks/usePwaInstall', () => ({
  usePwaInstall: () => ({
    canInstall: mockCanInstall,
    install: mockInstall,
    dismiss: mockDismiss,
  }),
}));

describe('InstallPrompt', () => {
  beforeEach(() => {
    mockCanInstall = true;
    mockInstall.mockClear();
    mockDismiss.mockClear();
  });

  it('renders install prompt when canInstall is true', () => {
    render(<InstallPrompt />);
    expect(screen.getByText('pwa.installTitle')).toBeInTheDocument();
    expect(screen.getByText('pwa.installButton')).toBeInTheDocument();
  });

  it('renders nothing when canInstall is false', () => {
    mockCanInstall = false;
    const { container } = render(<InstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('calls install when install button is clicked', async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);
    await user.click(screen.getByText('pwa.installButton'));
    expect(mockInstall).toHaveBeenCalledOnce();
  });

  it('calls dismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);
    await user.click(screen.getByText('pwa.installDismiss'));
    expect(mockDismiss).toHaveBeenCalledOnce();
  });
});
