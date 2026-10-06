import { useMemo, useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

const MAX_DOTS = 12;

export default function AnalyticsHistoryCard({ data = [] }) {
  const [hovered, setHovered] = useState(null);

  const columns = useMemo(() => {
    if (!data.length) return [];
    const max = Math.max(...data.map((d) => d.count || 0), 1);
    return data.map((d, i) => {
      const dots = Math.max(1, Math.round(((d.count || 0) / max) * MAX_DOTS));
      const completedDots = Math.max(1, Math.round(dots * (0.55 + (i % 3) * 0.12)));
      return {
        label: d.category,
        count: d.count,
        dots,
        completedDots: Math.min(dots, completedDots),
      };
    });
  }, [data]);

  const peakIndex = columns.reduce((best, col, i, arr) => (col.dots > (arr[best]?.dots ?? 0) ? i : best), 0);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Analytics History</h3>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50">
            All Categories <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button className="rounded-full border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-600" /> Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-100" /> In Progress
        </span>
      </div>

      {columns.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">No analytics data yet</p>
      ) : (
        <div className="relative mt-6 flex h-56 items-end gap-3 overflow-x-auto pb-1">
          {columns.map((col, i) => {
            const completedPct = Math.round((col.completedDots / col.dots) * 100);
            const showTooltip = hovered === i || (hovered === null && i === peakIndex);
            return (
              <div
                key={col.label}
                className="relative flex min-w-[28px] flex-1 flex-col items-center"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {showTooltip && (
                  <div className="absolute -top-16 z-10 w-max rounded-xl bg-gray-900 px-3 py-2 text-[10px] text-white shadow-lg">
                    <p className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                      Completed {completedPct}%
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-100" />
                      In Progress {100 - completedPct}%
                    </p>
                  </div>
                )}
                <div className="flex flex-col-reverse gap-1">
                  {Array.from({ length: col.dots }).map((_, dotIndex) => (
                    <span
                      key={dotIndex}
                      className={`h-2.5 w-2.5 rounded-full ${dotIndex < col.completedDots ? 'bg-brand-500' : 'bg-brand-100'}`}
                    />
                  ))}
                </div>
                <span className="mt-2 truncate text-[11px] text-gray-400">{col.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
