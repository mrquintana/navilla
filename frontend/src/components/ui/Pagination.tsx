import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, totalElements, pageSize, onPageChange }: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  const from = currentPage * pageSize + 1;
  const to = Math.min((currentPage + 1) * pageSize, totalElements);

  // Build page numbers: show max 5 with ellipsis
  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 5) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    pages.push(0);
    if (currentPage > 2) pages.push('ellipsis');
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages - 2, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push('ellipsis');
    pages.push(totalPages - 1);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted">
        {t('journal.showingEntries', { from, to, total: totalElements })}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn btn-secondary btn-sm p-1.5"
          disabled={currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label={t('journal.prevPage')}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Page numbers — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e${i}`} className="px-1 text-muted text-sm">...</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`btn btn-sm min-w-[32px] ${
                  p === currentPage ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => onPageChange(p)}
                aria-label={t('journal.pageLabel', { page: p + 1, total: totalPages })}
                aria-current={p === currentPage ? 'page' : undefined}
              >
                {p + 1}
              </button>
            )
          )}
        </div>

        {/* Mobile: just show current/total */}
        <span className="sm:hidden text-sm text-muted px-2">
          {t('journal.pageLabel', { page: currentPage + 1, total: totalPages })}
        </span>

        <button
          type="button"
          className="btn btn-secondary btn-sm p-1.5"
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label={t('journal.nextPage')}
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
