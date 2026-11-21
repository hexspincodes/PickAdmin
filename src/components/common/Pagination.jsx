import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import clsx from 'clsx';

const navButton =
  'inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

/**
 * Page navigation: first / prev / numbered pages / next / last, plus "Go to page".
 * summary: optional text on the left (e.g. "Page 1 of 184 · 18,381 customers").
 * disabled: blocks navigation while a page is loading.
 */
export default function Pagination({ page, totalPages, onChange, summary, disabled = false }) {
  const [draft, setDraft] = useState(String(page));
  useEffect(() => setDraft(String(page)), [page]);

  if (totalPages <= 1) return summary ? <p className="px-1 py-3 text-xs text-gray-400">{summary}</p> : null;

  const go = (p) => {
    const target = Math.min(Math.max(1, Math.round(p)), totalPages);
    if (!disabled && target !== page) onChange(target);
  };

  const submitDraft = (e) => {
    e.preventDefault();
    const n = Number(draft);
    if (Number.isFinite(n) && draft.trim() !== '') go(n);
    else setDraft(String(page));
  };

  const pages = Array.from(new Set([1, page - 1, page, page + 1, totalPages]))
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3">
      {summary ? <p className="text-xs text-gray-400">{summary}</p> : <span />}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button type="button" onClick={() => go(1)} disabled={disabled || page <= 1} className={navButton} title="First page" aria-label="First page">
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => go(page - 1)} disabled={disabled || page <= 1} className={navButton} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Prev</span>
          </button>

          {pages.map((p, i) => (
            <span key={p} className="flex items-center">
              {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-gray-300">…</span>}
              <button
                type="button"
                onClick={() => go(p)}
                disabled={disabled}
                aria-current={p === page ? 'page' : undefined}
                className={clsx(
                  'h-8 min-w-8 rounded-md px-1.5 text-sm font-medium tabular-nums disabled:cursor-not-allowed',
                  p === page ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {p}
              </button>
            </span>
          ))}

          <button type="button" onClick={() => go(page + 1)} disabled={disabled || page >= totalPages} className={navButton} aria-label="Next page">
            <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => go(totalPages)} disabled={disabled || page >= totalPages} className={navButton} title="Last page" aria-label="Last page">
            <ChevronsRight className="h-4 w-4" />
          </button>
        </nav>

        <form onSubmit={submitDraft} className="flex items-center gap-1.5 text-sm text-gray-500">
          <label htmlFor="pagination-goto">Go to</label>
          <input
            id="pagination-goto"
            type="number"
            inputMode="numeric"
            min={1}
            max={totalPages}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => draft.trim() === '' && setDraft(String(page))}
            disabled={disabled}
            className="h-8 w-16 rounded-md border border-gray-300 px-2 text-center text-sm tabular-nums text-gray-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50"
          />
          <span className="tabular-nums">/ {totalPages.toLocaleString('en-AE')}</span>
          <button
            type="submit"
            disabled={disabled}
            className="h-8 rounded-md border border-gray-300 px-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Go
          </button>
        </form>
      </div>
    </div>
  );
}
