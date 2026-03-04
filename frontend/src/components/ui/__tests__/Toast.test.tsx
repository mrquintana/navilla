import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '../../../contexts/ToastContext';
import { ToastContainer } from '../Toast';

function AddToastButton({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) {
  const { addToast } = useToast();
  return (
    <button onClick={() => addToast(type, message)}>
      Add {type}
    </button>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      {ui}
      <ToastContainer />
    </ToastProvider>,
  );
}

describe('Toast notification system', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a success toast with correct styling', () => {
    renderWithProvider(<AddToastButton type="success" message="Saved successfully" />);

    fireEvent.click(screen.getByText('Add success'));

    const toast = screen.getByTestId('toast-success');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent('Saved successfully');
    expect(toast.className).toContain('bg-green-50');
  });

  it('renders an error toast with correct styling', () => {
    renderWithProvider(<AddToastButton type="error" message="Something went wrong" />);

    fireEvent.click(screen.getByText('Add error'));

    const toast = screen.getByTestId('toast-error');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent('Something went wrong');
    expect(toast.className).toContain('bg-red-50');
  });

  it('renders an info toast with correct styling', () => {
    renderWithProvider(<AddToastButton type="info" message="FYI information" />);

    fireEvent.click(screen.getByText('Add info'));

    const toast = screen.getByTestId('toast-info');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent('FYI information');
    expect(toast.className).toContain('bg-indigo-50');
  });

  it('auto-dismisses after 4 seconds', () => {
    renderWithProvider(<AddToastButton type="success" message="Will vanish" />);

    fireEvent.click(screen.getByText('Add success'));
    expect(screen.getByText('Will vanish')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Will vanish')).not.toBeInTheDocument();
  });

  it('does not dismiss before 4 seconds', () => {
    renderWithProvider(<AddToastButton type="success" message="Still here" />);

    fireEvent.click(screen.getByText('Add success'));
    expect(screen.getByText('Still here')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3999);
    });

    expect(screen.getByText('Still here')).toBeInTheDocument();
  });

  it('removes toast when dismiss button is clicked', () => {
    renderWithProvider(<AddToastButton type="error" message="Dismissable" />);

    fireEvent.click(screen.getByText('Add error'));
    expect(screen.getByText('Dismissable')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Dismissable')).not.toBeInTheDocument();
  });

  it('stacks multiple toasts', () => {
    renderWithProvider(
      <>
        <AddToastButton type="success" message="First" />
        <AddToastButton type="error" message="Second" />
      </>,
    );

    fireEvent.click(screen.getByText('Add success'));
    fireEvent.click(screen.getByText('Add error'));

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('has aria-live region for accessibility', () => {
    renderWithProvider(<AddToastButton type="info" message="Accessible" />);

    fireEvent.click(screen.getByText('Add info'));

    const container = screen.getByTestId('toast-container');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('does not render container when no toasts exist', () => {
    renderWithProvider(<div>empty</div>);
    expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument();
  });

  it('throws error when useToast is used outside provider', () => {
    function BadComponent() {
      useToast();
      return null;
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BadComponent />)).toThrow('useToast must be used within a ToastProvider');
    consoleSpy.mockRestore();
  });
});
