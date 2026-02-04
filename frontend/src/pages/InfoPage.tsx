import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface InfoPageProps {
  title: string;
  subtitle?: string;
  notice?: ReactNode;
}

export function InfoPage({ title, subtitle, notice }: InfoPageProps) {
  return (
    <div className="container py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>

      <div className="card card-elevated space-y-3">
        <p className="text-sm text-muted">This content is still being defined.</p>
        <p className="text-sm text-muted">
          If you need something specific here, let us know and we will prioritize it.
        </p>
        {notice && (
          <div className="rounded-md border border-border-light bg-white/70 p-3 text-xs text-muted">
            {notice}
          </div>
        )}
        <Link to="/" className="text-sm text-primary font-medium">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
