import { render, screen } from '@testing-library/react';
import { FullPageLoader, PageSkeleton, SkeletonRows } from './LoadingShell';

describe('LoadingShell', () => {
  it('renders page skeleton with accessible loading label', () => {
    const { container } = render(
      <PageSkeleton loadingLabel="Loading page data">
        <div>content placeholder</div>
      </PageSkeleton>
    );

    expect(screen.getByText('Loading page data')).toBeInTheDocument();
    expect(screen.getByText('content placeholder')).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('renders requested number of skeleton rows', () => {
    const { container } = render(<SkeletonRows rows={4} />);
    expect(container.querySelectorAll('.skeleton')).toHaveLength(4);
  });

  it('renders full page loader skeletons', () => {
    const { container } = render(<FullPageLoader />);
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThanOrEqual(4);
  });
});
