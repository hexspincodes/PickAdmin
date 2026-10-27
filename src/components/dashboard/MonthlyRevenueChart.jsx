import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { paidAt } from '../payments/PaymentPeriodCards';
import { formatAED } from '../../features/payments/paymentUtils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// brand-600: brand-500 is under 3:1 against the white card; this passes.
const LINE = '#e0570c';
const INK_MUTED = '#9ca3af';
const GRID = '#f1f5f9';

const compactAED = (v) => (v >= 1000 ? `${(v / 1000).toLocaleString('en-AE', { maximumFractionDigits: 1 })}k` : `${v}`);

function ChartTooltip({ active, payload, year }) {
  if (!active || !payload?.length) return null;
  const { month, amount, count } = payload[0].payload;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-gray-500">
        {month} {year}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">AED {formatAED(amount)}</p>
      <p className="text-gray-500">
        {count} payment{count === 1 ? '' : 's'}
      </p>
    </div>
  );
}

/**
 * Revenue received per month for a chosen year.
 * paid: paid payments; amountOf(row): AED charged; loading: show a placeholder.
 */
export default function MonthlyRevenueChart({ paid, amountOf, loading }) {
  const now = new Date();
  const thisYear = now.getFullYear();

  // Every year that has a payment, plus the current one, newest first.
  const years = useMemo(() => {
    const set = new Set([thisYear]);
    paid.forEach((row) => {
      const d = paidAt(row);
      if (d) set.add(d.getFullYear());
    });
    return [...set].sort((a, b) => b - a);
  }, [paid, thisYear]);

  const [year, setYear] = useState(thisYear);
  const [view, setView] = useState('chart');

  const data = useMemo(() => {
    const months = MONTHS.map((month) => ({ month, amount: 0, count: 0 }));
    paid.forEach((row) => {
      const d = paidAt(row);
      if (!d || d.getFullYear() !== year) return;
      months[d.getMonth()].amount += amountOf(row) || 0;
      months[d.getMonth()].count += 1;
    });
    // Months that haven't happened yet are blank, not zero, so the line stops at this month.
    return months.map((m, i) => (year === thisYear && i > now.getMonth() ? { ...m, amount: null } : m));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid, amountOf, year, thisYear]);

  const yearTotal = data.reduce((sum, m) => sum + (m.amount || 0), 0);
  const yearCount = data.reduce((sum, m) => sum + m.count, 0);
  const shownMonths = data.filter((m) => m.amount !== null);

  return (
    <div className="rounded-3xl border border-gray-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Monthly revenue received</h3>
          {loading ? (
            <span className="mt-2 inline-block h-7 w-36 animate-pulse rounded bg-gray-200" />
          ) : (
            <p className="mt-1 text-2xl font-medium tracking-tight text-gray-900">
              <span className="mr-1 text-sm text-gray-400">AED</span>
              {formatAED(yearTotal)}
              <span className="ml-2 text-sm font-normal text-gray-500">
                in {year} · {yearCount} payment{yearCount === 1 ? '' : 's'}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-gray-100 p-0.5 text-xs font-medium" role="group" aria-label="View as">
            {['chart', 'table'].map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={clsx(
                  'rounded-full px-3 py-1 capitalize transition-colors',
                  view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="revenue-year">
            Year
          </label>
          <select
            id="revenue-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-full border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-gray-700 outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-300"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 h-72 animate-pulse rounded-2xl bg-gray-50" />
      ) : view === 'chart' ? (
        <div className="mt-4 h-72" role="img" aria-label={`Line chart of revenue per month in ${year}. Switch to Table for exact values.`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={LINE} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={LINE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: INK_MUTED, fontSize: 12 }} dy={6} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                allowDecimals={false}
                tickFormatter={compactAED}
                tick={{ fill: INK_MUTED, fontSize: 12 }}
              />
              <Tooltip
                content={<ChartTooltip year={year} />}
                cursor={{ stroke: INK_MUTED, strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={LINE}
                strokeWidth={2}
                fill="url(#revenueFill)"
                dot={{ r: 4, fill: LINE, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: LINE, stroke: '#fff', strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-gray-100">
          <table className="min-w-full text-sm">
            <caption className="sr-only">Revenue per month in {year}</caption>
            <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Month</th>
                <th className="px-4 py-2 text-right font-semibold">Payments</th>
                <th className="px-4 py-2 text-right font-semibold">Revenue (AED)</th>
              </tr>
            </thead>
            <tbody>
              {shownMonths.map((m) => (
                <tr key={m.month} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-700">
                    {m.month} {year}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-700">{m.count}</td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums text-gray-900">{formatAED(m.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
