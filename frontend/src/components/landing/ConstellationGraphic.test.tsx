import { render } from '@testing-library/react';
import { ConstellationGraphic } from './ConstellationGraphic';

describe('ConstellationGraphic', () => {
  it('renders without crashing', () => {
    const { container } = render(<ConstellationGraphic />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has aria-hidden to hide from screen readers', () => {
    const { container } = render(<ConstellationGraphic />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('accepts a className prop', () => {
    const { container } = render(<ConstellationGraphic className="hero-constellation" />);
    expect(container.querySelector('svg')?.classList.contains('hero-constellation')).toBe(true);
  });
});
