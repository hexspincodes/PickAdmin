import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BadgeCheck, Calendar, Filter, Pencil, RotateCcw } from 'lucide-react';
import { fetchPayments, manualVerifyPayment, updatePayment } from '../features/payments/paymentsSlice';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import { Field, TextInput, Select } from '../components/common/FormField';
import { formatDate, formatDateTime, toDateTimeLocal } from '../utils/formatDate';

const STATUS_TONE = { 1: 'green', 2: 'yellow', 0: 'gray' };
const STATUS_LABEL = { 1: 'Paid', 2: 'Suspended', 0: 'Pending' };
const PLAN_LABEL = { 0: 'Basic', 1: 'Standard', 2: 'Premium', 3: 'Starter' };
// What records created before the charged amount was stored were billed, in AED
// (Starter was 195 then; new Starter payments store their 0.38 amount).
const PLAN_PRICE = { 0: 350, 1: 495, 2: 899, 3: 195 };
const LIMIT = 100;

// Status 2 is set both by the expiry job and by admins suspending a customer.
const statusLabel = (row) => {
  if (row.status === 2 && row.expiryDate && new Date(row.expiryDate) < new Date()) return 'Expired';
  return STATUS_LABEL[row.status] ?? row.status;
};

const amountAED = (row) => (row.amount != null ? row.amount / 100 : PLAN_PRICE[row.type]);

export default function PaymentsPage() {
  const dispatch = useDispatch();
  const { items, count, status, page, search } = useSelector((state) => state.payments);
  const [searchInput, setSearchInput] = useState(search);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ expiryDate: '', status: '1' });
  const [saving, setSaving] = useState(false);

  const openEdit = (row) => {
    setEditForm({ expiryDate: toDateTimeLocal(row.expiryDate), status: String(row.status) });
    setEditing(row);
  };

  const editWouldBeExpired =
    editForm.status === '1' && editForm.expiryDate && new Date(editForm.expiryDate) <= new Date();

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await dispatch(
      updatePayment({
        id: editing._id,
        // datetime-local is local time; send an absolute instant.
        expiryDate: new Date(editForm.expiryDate).toISOString(),
        status: Number(editForm.status),
      }),
    );
    setSaving(false);
    if (!result.error) setEditing(null);
  };

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

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Payment" size="sm">
        {editing && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
              <div>
                <span className="font-medium text-gray-700">{editing.name || editing.user_id}</span>
                {editing.email && <> · {editing.email}</>}
              </div>
              <div>
                {PLAN_LABEL[editing.type] ?? editing.type} · Paid {formatDateTime(editing.paymentDate)} · Ref{' '}
                {editing.transRef}
              </div>
            </div>
            <Field label="Expires at" required hint="Shown in your local time.">
              <TextInput
                required
                type="datetime-local"
                value={editForm.expiryDate}
                onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
              />
            </Field>
            <Field
              label="Status"
              required
              hint={editWouldBeExpired ? 'An active subscription needs an expiry date in the future.' : undefined}
            >
              <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="1">Paid (active)</option>
                <option value="2">Expired / suspended</option>
                <option value="0">Pending</option>
              </Select>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} disabled={!!editWouldBeExpired}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
