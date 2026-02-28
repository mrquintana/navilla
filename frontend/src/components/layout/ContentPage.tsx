import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

export interface ContentSection {
  heading?: string;
  body?: string | string[];
  list?: string[];
  note?: string;
}

interface ContentPageProps {
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  sections: ContentSection[];
  footer?: ReactNode;
}

export function ContentPage({
  seoTitle,
  seoDescription,
  canonical,
  title,
  subtitle,
  lastUpdated,
  sections,
  footer,
}: ContentPageProps) {
  const { t } = useTranslation();
  return (
    <div className="container py-10 space-y-6 max-w-3xl">
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={canonical} />

      <div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {subtitle && <p className="text-muted">{subtitle}</p>}
        {lastUpdated && (
          <p className="text-xs text-muted mt-1">Last updated: {lastUpdated}</p>
        )}
      </div>

      {sections.map((section, i) => (
        <div key={i} className="card card-elevated space-y-3">
          {section.heading && (
            <h2 className="text-lg font-semibold">{section.heading}</h2>
          )}
          {section.body && (
            Array.isArray(section.body)
              ? section.body.map((p, j) => (
                  <p key={j} className="text-sm text-muted leading-relaxed">{p}</p>
                ))
              : <p className="text-sm text-muted leading-relaxed">{section.body}</p>
          )}
          {section.list && (
            <ul className="list-disc list-inside space-y-1 pl-1 text-sm text-muted">
              {section.list.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          )}
          {section.note && (
            <p className="text-xs text-muted border-l-2 border-border pl-3 italic">{section.note}</p>
          )}
        </div>
      ))}

      {footer && <div>{footer}</div>}

      <Link to="/" className="text-sm text-primary font-medium">
        {t('common.backToHome')}
      </Link>
    </div>
  );
}
