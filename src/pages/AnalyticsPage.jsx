import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchCategoryAnalytics } from '../features/analytics/analyticsSlice';
import PageHeader from '../components/common/PageHeader';
import { TextInput } from '../components/common/FormField';
import Button from '../components/common/Button';

export default function AnalyticsPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.analytics);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    dispatch(fetchCategoryAnalytics({}));
  }, [dispatch]);

  const handleFilter = (e) => {
    e.preventDefault();
    dispatch(fetchCategoryAnalytics({ from, to }));
  };

  return (
    <div>
      <PageHeader title="Analytics" description="Category usage across the platform" />

      <form onSubmit={handleFilter} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
          <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
          <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="submit">Apply</Button>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {status === 'loading' ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No analytics data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={items}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#f2711d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
