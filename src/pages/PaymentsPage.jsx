import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BadgeCheck, Calendar, Filter, Pencil, RotateCcw } from 'lucide-react';
import { fetchPayments, fetchAllPayments, manualVerifyPayment } from '../features/payments/paymentsSlice';
import { STATUS_TONE, PLAN_LABEL, statusLabel, amountAED } from '../features/payments/paymentUtils';
import PaymentPeriodCards, { isPaidPayment, paidAt, periodRange, inRange } from '../components/payments/PaymentPeriodCards';
import EditPaymentForm from '../components/payments/EditPaymentForm';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import { formatDate, formatDateTime } from '../utils/formatDate';

const LIMIT = 100;

export default function PaymentsPage() {
  const dispatch = useDispatch();
  const { items, count, status, page, search, all, allStatus } = useSelector((state) => state.payments);
  const [searchInput, setSearchInput] = useState(search);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [period, setPeriod] = useState(null);
  const [customDay, setCustomDay] = useState('');
  const [editing, setEditing] = useState(null);
  const openEdit = setEditing;

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

  useEffect(() => {
    dispatch(fetchAllPayments());
  }, [dispatch]);

  const paid = useMemo(() => all.filter(isPaidPayment), [all]);

  // With a period card selected the table lists that period's paid payments from the full set
  // (not just the loaded page), searched client-side; otherwise it's the server page as before.
  const sourceRows = useMemo(() => {
    if (!period) return items;
    const range = periodRange(period, customDay);
    const term = search.trim().toLowerCase();
    return paid.filter(
      (row) =>
        inRange(paidAt(row), range) &&
        (!term || [row.name, row.email, row.mobile, row.transRef, row.user_id].some((v) => v != null && String(v).toLowerCase().includes(term))),
    );
  }, [period, customDay, paid, items, search]);

  const filteredRows = useMemo(() => {
    return sourceRows
      .filter((row) => {
        if (statusFilter !== 'all' && String(row.status) !== statusFilter) return false;
        if (dateFrom && (!row.createdAt || new Date(row.createdAt) < new Date(dateFrom))) return false;
        if (dateTo && (!row.createdAt || new Date(row.createdAt) > new Date(`${dateTo}T23:59:59`))) return false;
        return true;
      })
      .sort((a, b) => (b.status === 1 ? 1 : 0) - (a.status === 1 ? 1 : 0));
  }, [sourceRows, statusFilter, dateFrom, dateTo]);

  const hasActiveFilters = statusFilter !== 'all' || dateFrom || dateTo || period;
  const clearFilters = () => {
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setPeriod(null);
  };

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <div className="leading-tight" title={`User ID: ${row.user_id}`}>
          <p className="font-medium capitalize text-gray-900">{row.name || '—'}</p>
          {row.email && (
            <a href={`mailto:${row.email}`} className="text-xs text-gray-500 hover:text-brand-600 hover:underline">
              {row.email}
            </a>
          )}
        </div>
      ),
    },
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
      key: 'paymentDate',
      header: 'Paid at',
      render: (row) => (row.status === 0 ? '—' : formatDateTime(row.paymentDate)),
    },
    {
      key: 'expiryDate',
      header: 'Expires',
      render: (row) => formatDateTime(row.expiryDate),
    },
    {
      key: 'amount',
      header: 'Plan / Amount',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span>
            {PLAN_LABEL[row.type] ?? row.type} · AED {amountAED(row)}
          </span>
          {row.coupon_code && (
            <span>
              <Badge tone="brand">
                {row.coupon_code} −{row.discount_percent}%
              </Badge>
            </span>
          )}
        </div>
      ),
    },
    { key: 'transRef', header: 'Transaction Ref' },
    {
      key: 'status',
      header: (
        <span className="inline-flex items-center gap-1">
          Status <Filter className="h-3 w-3 text-gray-300" />
        </span>
      ),
      render: (row) => <Badge tone={STATUS_TONE[row.status] || 'gray'}>{statusLabel(row)}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEdit(row)} title="Edit expiry / status">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => dispatch(manualVerifyPayment(row.user_id))}>
            <BadgeCheck className="h-3.5 w-3.5" /> Verify
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Payments" description="All customer payment and subscription records" />

      <PaymentPeriodCards
        paid={paid}
        amountOf={amountAED}
        loading={allStatus !== 'succeeded' && all.length === 0}
        activePeriod={period}
        onSelect={setPeriod}
        customDay={customDay}
        onCustomDayChange={setCustomDay}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-[11px] font-medium text-gray-400">Search</label>
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search name, email, phone or ref" />
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
          {filteredRows.length} of {sourceRows.length} shown
        </span>
      </div>

      <Table
        columns={columns}
        rows={filteredRows}
        loading={period ? allStatus === 'loading' && all.length === 0 : status === 'loading'}
        rowKey="_id"
        emptyMessage={period ? 'No payments in this period' : undefined}
      />
      {!period && (
        <Pagination
          page={page}
          totalPages={Math.ceil(count / LIMIT) || 1}
          onChange={(p) => dispatch(fetchPayments({ page: p, limit: LIMIT, search }))}
        />
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Payment" size="sm">
        {editing && <EditPaymentForm key={editing._id} payment={editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
