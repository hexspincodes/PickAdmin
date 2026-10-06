import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <div className="flex items-center justify-between gap-2 px-1 py-3">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" /> Prev
      </button>
      <div className="flex items-center gap-1">
        {pages.map((p, i) => (
          <span key={p} className="flex items-center">
            {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-gray-300">…</span>}
            <button
              onClick={() => onChange(p)}
              className={clsx(
                'h-8 w-8 rounded-md text-sm font-medium',
                p === page ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              {p}
            </button>
          </span>
        ))}
      </div>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
      >
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
