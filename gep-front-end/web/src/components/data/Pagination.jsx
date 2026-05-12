import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

function pageRange(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const out = new Set([1, 2, pageCount - 1, pageCount, page - 1, page, page + 1]);
  return [...out]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) {
  const pageCount = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total || 0);
  const pages = pageRange(page, pageCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-4 py-3 text-body-sm text-on-surface-variant">
      <span>
        Showing <span className="text-on-surface">{from}</span>–
        <span className="text-on-surface">{to}</span> of{' '}
        <span className="text-on-surface">{total ?? '—'}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const gap = prev !== undefined && p - prev > 1;
          return (
            <span key={p} className="flex items-center">
              {gap ? <span className="px-1 text-on-surface-variant">…</span> : null}
              <button
                type="button"
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPageChange?.(p)}
                className={cn(
                  'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-body-sm transition-colors',
                  p === page
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                )}
              >
                {p}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPageChange?.(page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {onPageSizeChange ? (
        <label className="flex items-center gap-2">
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-outline-variant bg-surface-container-low px-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
