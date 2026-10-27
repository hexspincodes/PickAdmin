import { Link } from 'react-router-dom';
import { CalendarRange, CalendarDays, Wallet } from 'lucide-react';
import { paidAt, periodRange, inRange } from '../payments/PaymentPeriodCards';
import { formatAED } from '../../features/payments/paymentUtils';

const CARDS = [
  { key: 'all', label: 'Total revenue', icon: Wallet },
  { key: 'month', label: 'Revenue this month', icon: CalendarRange },
  { key: 'week', label: 'Revenue this week', icon: CalendarDays },
];

// Decorative mini bar cluster (bar heights in px), as on the other stat cards.
const BARS = [22, 30, 18, 34, 26];

/**
 * Revenue summary in the same card style as the Payments page. Each card links there.
 * paid: paid payments; amountOf(row): AED charged; loading: show placeholders.
 */
export default function RevenueCards({ paid, amountOf, loading }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {CARDS.map(({ key, label, icon: Icon }) => {
        const range = periodRange(key);
        const rows = paid.filter((row) => inRange(paidAt(row), range));
        const amount = rows.reduce((sum, row) => sum + (amountOf(row) || 0), 0);
        return (
          <Link
            key={key}
            to="/payments"
            className="flex flex-col justify-between gap-6 rounded-3xl border border-gray-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] outline-none transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <Icon className="h-4 w-4 text-gray-800" strokeWidth={1.75} />
              {label}
            </span>
            <span className="flex items-end justify-between gap-3">
              <span className="min-w-0">
                {loading ? (
                  <span className="inline-block h-8 w-32 animate-pulse rounded bg-gray-200" />
                ) : (
                  <span className="block truncate text-3xl font-medium leading-none tracking-tight text-gray-900">
                    <span className="mr-1 text-sm text-gray-400">AED</span>
                    {formatAED(amount)}
                  </span>
                )}
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
                  <span className="text-sm font-bold text-brand-600">{loading ? '…' : rows.length}</span>
                  payment{rows.length === 1 ? '' : 's'}
                </span>
              </span>
              <span className="mb-1 flex shrink-0 items-end gap-1" aria-hidden="true">
                {BARS.map((h, i) => (
                  <span key={i} className="w-1.5 rounded-full bg-brand-500" style={{ height: h }} />
                ))}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
