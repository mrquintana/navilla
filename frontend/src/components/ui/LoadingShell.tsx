import type { ReactNode } from 'react';

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function SkeletonRows({
  rows = 3,
  rowClassName = 'h-14 rounded-xl',
}: {
  rows?: number;
  rowClassName?: string;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonBlock key={index} className={rowClassName} />
      ))}
    </div>
  );
}

export function PageSkeleton({
  titleWidth = 'w-72',
  subtitleWidth = 'w-96',
  children,
  loadingLabel = 'Loading...',
}: {
  titleWidth?: string;
  subtitleWidth?: string;
  children?: ReactNode;
  loadingLabel?: string;
}) {
  return (
    <div className="container py-8 space-y-6" role="status" aria-live="polite">
      <span className="sr-only">{loadingLabel}</span>
      <div className="space-y-3">
        <SkeletonBlock className={`h-9 rounded-full ${titleWidth}`} />
        <SkeletonBlock className={`h-4 rounded-full ${subtitleWidth}`} />
      </div>
      {children}
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-3">
          <SkeletonBlock className="h-8 w-40 rounded-full" />
          <SkeletonBlock className="h-4 w-72 rounded-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonBlock className="h-28 rounded-2xl" />
          <SkeletonBlock className="h-28 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
