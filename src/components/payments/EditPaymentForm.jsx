import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updatePayment } from '../../features/payments/paymentsSlice';
import { PLAN_LABEL } from '../../features/payments/paymentUtils';
import Button from '../common/Button';
import { Field, TextInput, Select } from '../common/FormField';
import { formatDateTime, toDateTimeLocal } from '../../utils/formatDate';

/** Expiry + status editor for one payment. onDone() runs on cancel and after a successful save. */
export default function EditPaymentForm({ payment, onDone }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ expiryDate: toDateTimeLocal(payment.expiryDate), status: String(payment.status) });
  const [saving, setSaving] = useState(false);

  const wouldBeExpired = form.status === '1' && form.expiryDate && new Date(form.expiryDate) <= new Date();

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await dispatch(
      updatePayment({
        id: payment._id,
        // datetime-local is local time; send an absolute instant.
        expiryDate: new Date(form.expiryDate).toISOString(),
        status: Number(form.status),
      }),
    );
    setSaving(false);
    if (!result.error) onDone();
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700">{payment.name || payment.user_id}</span>
          {payment.email && <> · {payment.email}</>}
        </div>
        <div>
          {PLAN_LABEL[payment.type] ?? payment.type} · Paid {formatDateTime(payment.paymentDate)} · Ref {payment.transRef}
        </div>
      </div>
      <Field label="Expires at" required hint="Shown in your local time.">
        <TextInput
          required
          type="datetime-local"
          value={form.expiryDate}
          onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
        />
      </Field>
      <Field
        label="Status"
        required
        hint={wouldBeExpired ? 'An active subscription needs an expiry date in the future.' : undefined}
      >
        <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="1">Paid (active)</option>
          <option value="2">Expired / suspended</option>
          <option value="0">Pending</option>
        </Select>
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={!!wouldBeExpired}>
          Save
        </Button>
      </div>
    </form>
  );
}
