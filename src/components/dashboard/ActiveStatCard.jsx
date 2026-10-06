import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer } from 'recharts';

export default function ActiveStatCard({ title, badge, value, caption, data = [] }) {
  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-gray-400">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="h-3 w-3" /> {badge}
          </span>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-400">{caption}</p>
        </div>
        <div className="h-14 w-20 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="30%">
              <Bar dataKey="v" radius={[3, 3, 0, 0]} fill="#f2711d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
