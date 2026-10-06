import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BadgeCheck, Calendar, Filter, RotateCcw } from 'lucide-react';
import { fetchPayments, manualVerifyPayment } from '../features/payments/paymentsSlice';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import { formatDate } from '../utils/formatDate';

const STATUS_TONE = { 1: 'green', 2: 'yellow', 0: 'gray' };
const STATUS_LABEL = { 1: 'Paid', 2: 'Suspended', 0: 'Pending' };
const LIMIT = 100;

export default function PaymentsPage() {
  const dispatch = useDispatch();
  const { items, count, status, page, search } = useSelector((state) => state.payments);
  const [searchInput, setSearchInput] = useState(search);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    dispatch(fetchPayments({ page: 1, limit: LIMIT, search: '' }));
  }, [dispatch]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) dispatch(fetchPayments({ page: 1, limit: LIMIT, search: searchInput }));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const filteredRows = useMemo(() => {
    return items
      .filter((row) => {
        if (statusFilter !== 'all' && String(row.status) !== statusFilter) return false;
        if (dateFrom && (!row.createdAt || new Date(row.createdAt) < new Date(dateFrom))) return false;
        if (dateTo && (!row.createdAt || new Date(row.createdAt) > new Date(`${dateTo}T23:59:59`))) return false;
        return true;
      })
      .sort((a, b) => (b.status === 1 ? 1 : 0) - (a.status === 1 ? 1 : 0));
  }, [items, statusFilter, dateFrom, dateTo]);

  const hasActiveFilters = statusFilter !== 'all' || dateFrom || dateTo;
  const clearFilters = () => {
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const columns = [
    { key: 'user_id', header: 'User ID' },
    {
      key: 'createdAt',
      header: (
        <span className="inline-flex items-center gap-1">
          Created <Calendar className="h-3 w-3 text-gray-300" />
        </span>
      ),
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'expiryDate',
      header: 'Expires',
      render: (row) => formatDate(row.expiryDate),
    },
    { key: 'transRef', header: 'Transaction Ref' },
    {
      key: 'status',
      header: (
        <span className="inline-flex items-center gap-1">
          Status <Filter className="h-3 w-3 text-gray-300" />
        </span>
      ),
      render: (row) => <Badge tone={STATUS_TONE[row.status] || 'gray'}>{STATUS_LABEL[row.status] ?? row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => dispatch(manualVerifyPayment(row.user_id))}>
          <BadgeCheck className="h-3.5 w-3.5" /> Verify
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Payments" description="All customer payment and subscription records" />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-[11px] font-medium text-gray-400">Search</label>
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search by user ID" />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-400">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-600 outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-300"
          >
            <option value="all">All statuses</option>
            <option value="1">Paid</option>
            <option value="2">Suspended</option>
            <option value="0">Pending</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-400">Created from</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-600 outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-300"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-400">Created to</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-600 outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-300"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}

        <span className="ml-auto whitespace-nowrap pb-2 text-xs text-gray-400">
          {filteredRows.length} of {items.length} shown
        </span>
      </div>

      <Table columns={columns} rows={filteredRows} loading={status === 'loading'} rowKey="_id" />
      <Pagination
        page={page}
        totalPages={Math.ceil(count / LIMIT) || 1}
        onChange={(p) => dispatch(fetchPayments({ page: p, limit: LIMIT, search }))}
      />
    </div>
  );
}
