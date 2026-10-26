import clsx from 'clsx';

// Decorative mini bar cluster (bar heights in px).
const BARS = [22, 30, 18, 34, 26];

/**
 * Row of clickable count cards that double as a filter.
 * cards: [{ key, label, filter, icon }] — `filter` is what onSelect receives; counts[key] is the number shown.
 * counts: null while loading (shows a placeholder).
 */
export default function StatCards({ cards, counts, activeFilter, onSelect, className = 'xl:grid-cols-6' }) {
  return (
    <div className={clsx('mb-5 grid grid-cols-2 gap-3 md:grid-cols-3', className)}>
      {cards.map(({ key, label, filter, icon: Icon }) => {
        const active = activeFilter === filter;
        const value = counts ? counts[key] : null;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(filter)}
            aria-pressed={active}
            className={clsx(
              'flex flex-col justify-between gap-6 rounded-3xl border bg-white p-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-md',
              active ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-gray-200/70',
            )}
          >
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <Icon className="h-4 w-4 text-gray-800" strokeWidth={1.75} />
              {label}
            </span>
            <span className="flex items-end justify-between gap-3">
              <span className="text-3xl font-medium leading-none tracking-tight text-gray-900">
                {value ?? <span className="inline-block h-7 w-10 animate-pulse rounded bg-gray-200" />}
              </span>
              <span className="flex items-end gap-1" aria-hidden="true">
                {BARS.map((h, i) => (
                  <span key={i} className="w-1.5 rounded-full bg-brand-500" style={{ height: h }} />
                ))}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
