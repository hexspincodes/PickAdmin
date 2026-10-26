import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { fetchCoupons, createCoupon, updateCoupon, removeCoupon } from '../features/coupons/couponsSlice';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SearchInput from '../components/common/SearchInput';
import { Field, TextInput, Checkbox } from '../components/common/FormField';
import { formatDateTime, toDateTimeLocal } from '../utils/formatDate';

const emptyForm = {
  code: '',
  discount_percent: 10,
  is_active: true,
  new_customers_only: true,
  once_per_customer: true,
  expires_at: '',
};

const couponState = (coupon) => {
  if (!coupon.is_active) return { tone: 'gray', label: 'Inactive' };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return { tone: 'yellow', label: 'Expired' };
  return { tone: 'green', label: 'Active' };
};

export default function CouponsPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.coupons);
  const [search, setSearch] = useState('');
  // null = closed, {} = creating, a coupon row = editing that coupon
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? items.filter((c) => c.code.toLowerCase().includes(term)) : items;
  }, [items, search]);

  const isEdit = !!editing?._id;

  const openCreate = () => {
    setForm(emptyForm);
    setEditing({});
  };

  const openEdit = (coupon) => {
    setForm({
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      is_active: coupon.is_active,
      // Coupons created before this setting existed are new-customers-only.
      new_customers_only: coupon.new_customers_only ?? true,
      once_per_customer: coupon.once_per_customer,
      expires_at: toDateTimeLocal(coupon.expires_at),
    });
    setEditing(coupon);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      discount_percent: Number(form.discount_percent),
      // datetime-local is local time; send an absolute instant (or null to clear).
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    const action = isEdit ? updateCoupon({ id: editing._id, ...payload }) : createCoupon(payload);
    const result = await dispatch(action);
    setSubmitting(false);
    if (!result.error) setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await dispatch(removeCoupon(deleteTarget._id));
    setDeleting(false);
    setDeleteTarget(null);
  };

  const columns = [
    { key: 'code', header: 'Code', render: (row) => <span className="font-mono font-semibold">{row.code}</span> },
    { key: 'discount_percent', header: 'Discount', render: (row) => `${row.discount_percent}%` },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const { tone, label } = couponState(row);
        return <Badge tone={tone}>{label}</Badge>;
      },
    },
    { key: 'expires_at', header: 'Expires', render: (row) => (row.expires_at ? formatDateTime(row.expires_at) : 'Never') },
    {
      key: 'new_customers_only',
      header: 'Who can use',
      render: (row) =>
        (row.new_customers_only ?? true) ? <Badge tone="blue">New customers only</Badge> : 'All customers',
    },
    {
      key: 'once_per_customer',
      header: 'Use limit',
      render: (row) => (row.once_per_customer ? 'Once per customer' : 'Unlimited'),
    },
    { key: 'times_used', header: 'Paid orders', render: (row) => row.times_used ?? 0 },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => dispatch(updateCoupon({ id: row._id, is_active: !row.is_active }))}
            title={row.is_active ? 'Deactivate' : 'Activate'}
          >
            {row.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openEdit(row)} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(row)} title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Percentage discounts customers can apply to any package at checkout"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Coupon
          </Button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search codes…" className="mb-4 max-w-sm" />

      <Table
        columns={columns}
        rows={rows}
        loading={status === 'loading' && items.length === 0}
        rowKey="_id"
        emptyMessage={search ? 'No coupons match your search' : 'No coupons yet'}
      />

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isEdit ? 'Edit Coupon' : 'New Coupon'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Code" required hint='Letters, numbers, "-" or "_". Customers can type it in any case.'>
            <TextInput
              required
              autoFocus
              maxLength={30}
              pattern="[A-Za-z0-9_\-]+"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Discount (%)" required hint="Whole number from 1 to 90, taken off every package price.">
            <TextInput
              required
              type="number"
              min={1}
              max={90}
              step={1}
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
            />
          </Field>
          <Field label="Expires at" hint="Leave empty for no expiry.">
            <TextInput
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
            />
          </Field>
          <Checkbox
            label="Active (customers can apply it)"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          <Checkbox
            label="New customers only (accounts that have never bought a package)"
            checked={form.new_customers_only}
            onChange={(e) => setForm({ ...form, new_customers_only: e.target.checked })}
          />
          <Checkbox
            label="Each customer can use it only once"
            checked={form.once_per_customer}
            onChange={(e) => setForm({ ...form, once_per_customer: e.target.checked })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete coupon"
        message={`Delete "${deleteTarget?.code}"? Customers will no longer be able to apply it. Past payments keep the discount they were charged with.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
