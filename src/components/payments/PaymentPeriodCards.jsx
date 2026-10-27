import clsx from 'clsx';
import { CalendarCheck, CalendarClock, CalendarDays, CalendarRange, CalendarSearch, Wallet } from 'lucide-react';

const DAY = 24 * 60 * 60 * 1000;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// A payment counts once money was taken: pending (0) checkouts are excluded; suspended/expired (2) were paid.
export const isPaidPayment = (row) => row.is_paid === true || row.status === 1 || row.status === 2;

// When the money came in; older records without paymentDate fall back to when they were created.
export const paidAt = (row) => {
  const d = new Date(row.paymentDate || row.createdAt);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * [start, end) in local time for a period key, or null for "all".
 * customDay is "YYYY-MM-DD"; customMonth is "YYYY-MM".
 */
export function periodRange(key, customDay, customMonth, now = new Date()) {
  const today = startOfDay(now);
  switch (key) {
    case 'today':
      return [today, new Date(today.getTime() + DAY)];
    case 'yesterday':
      return [new Date(today.getTime() - DAY), today];
    case 'week': {
      // Weeks start on Monday (the UAE working week).
      const sinceMonday = (today.getDay() + 6) % 7;
      return [new Date(today.getFullYear(), today.getMonth(), today.getDate() - sinceMonday), new Date(today.getTime() + DAY)];
    }
    case 'month':
      return [new Date(today.getFullYear(), today.getMonth(), 1), new Date(today.getTime() + DAY)];
    case 'custom': {
      if (!customDay) return null;
      const [y, m, d] = customDay.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      return [start, new Date(y, m - 1, d + 1)];
    }
    case 'customMonth': {
      if (!customMonth) return null;
      const [y, m] = customMonth.split('-').map(Number);
      return [new Date(y, m - 1, 1), new Date(y, m, 1)];
    }
    default:
      return null;
  }
}

export const inRange = (date, range) => !range || (date && date >= range[0] && date < range[1]);

const CARDS = [
  { key: 'today', label: 'Today', icon: CalendarCheck },
  { key: 'yesterday', label: 'Yesterday', icon: CalendarClock },
  { key: 'custom', label: 'Custom day', icon: CalendarSearch },
  { key: 'month', label: 'This month', icon: CalendarRange },
  { key: 'customMonth', label: 'Custom month', icon: CalendarDays },
  { key: 'all', label: 'All time', icon: Wallet },
];

// Decorative mini bar cluster (bar heights in px), as on the maid status cards.
const BARS = [22, 30, 18, 34, 26];

const formatAED =(value) => value.toLocaleString('en-AE', { maximumFractionDigits: 2 });

/**
 * Revenue cards per period. Click a card to filter the table to that period (click again to clear).
 * paid: paid payments; amountOf(row): AED charged; loading: show placeholders.
 */
export default function PaymentPeriodCards({
  paid,
  amountOf,
  loading,
  activePeriod,
  onSelect,
  customDay,
  onCustomDayChange,
  customMonth,
  onCustomMonthChange,
}) {
  const totals = Object.fromEntries(
    CARDS.map(({ key }) => {
      const range = periodRange(key, customDay, customMonth);
      const rows = key !== 'all' && !range ? [] : paid.filter((row) => inRange(paidAt(row), range));
      return [key, { count: rows.length, amount: rows.reduce((sum, row) => sum + (amountOf(row) || 0), 0) }];
    }),
  );

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {CARDS.map(({ key, label, icon: Icon }) => {
        const active = activePeriod === key;
        const { count, amount } = totals[key];
        const select = () => onSelect(active ? null : key);
        return (
          <div
            key={key}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            onClick={select}
            onKeyDown={(e) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                select();
              }
            }}
            className={clsx(
              'flex cursor-pointer flex-col justify-between gap-6 rounded-3xl border bg-white p-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] outline-none transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-500/40',
              active ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-gray-200/70',
            )}
          >
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <Icon className="h-4 w-4 text-gray-800" strokeWidth={1.75} />
              {label}
            </span>

            {key === 'custom' && (
              <input
                type="date"
                value={customDay}
                max={new Date().toLocaleDateString('en-CA')}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  onCustomDayChange(e.target.value);
                  if (e.target.value) onSelect('custom');
                }}
                aria-label="Pick a day"
                className="-mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 outline-none focus:border-brand-300 focus:bg-white"
              />
            )}

            {key === 'customMonth' && (
              <input
                type="month"
                value={customMonth}
                max={new Date().toLocaleDateString('en-CA').slice(0, 7)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  onCustomMonthChange(e.target.value);
                  if (e.target.value) onSelect('customMonth');
                }}
                aria-label="Pick a month"
                className="-mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 outline-none focus:border-brand-300 focus:bg-white"
              />
            )}

            <span className="flex items-end justify-between gap-3">
              <span className="min-w-0">
                {loading ? (
                  <span className="inline-block h-7 w-24 animate-pulse rounded bg-gray-200" />
                ) : (
                  <span className="block truncate text-2xl font-medium leading-none tracking-tight text-gray-900">
                    <span className="mr-1 text-sm text-gray-400">AED</span>
                    {formatAED(amount)}
                  </span>
                )}
                {key === 'custom' && !customDay ? (
                  <span className="mt-2 block text-xs text-gray-500">Pick a day</span>
                ) : key === 'customMonth' && !customMonth ? (
                  <span className="mt-2 block text-xs text-gray-500">Pick a month</span>
                ) : (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
                    <span className="text-sm font-bold text-brand-600">{count}</span>
                    payment{count === 1 ? '' : 's'}
                  </span>
                )}
              </span>
              <span className="mb-1 flex shrink-0 items-end gap-1" aria-hidden="true">
                {BARS.map((h, i) => (
                  <span key={i} className="w-1.5 rounded-full bg-brand-500" style={{ height: h }} />
                ))}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
