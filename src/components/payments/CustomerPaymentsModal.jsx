import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, CalendarClock, Pencil, ReceiptText, Wallet } from 'lucide-react';
import { fetchAllPayments } from '../../features/payments/paymentsSlice';
import { STATUS_TONE, PLAN_LABEL, statusLabel, amountAED, formatAED } from '../../features/payments/paymentUtils';
import { isPaidPayment } from './PaymentPeriodCards';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Loader from '../common/Loader';
import EditPaymentForm from './EditPaymentForm';
import { formatDate, formatDateTime } from '../../utils/formatDate';

function Summary({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="truncate text-sm font-semibold text-gray-900">{children}</p>
      </div>
    </div>
  );
}

/** A customer's payments (from the full payments list), with in-place expiry/status editing. */
export default function CustomerPaymentsModal({ customer, onClose }) {
  const dispatch = useDispatch();
  const { all, allStatus } = useSelector((state) => state.payments);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (customer) dispatch(fetchAllPayments());
  }, [customer, dispatch]);

  useEffect(() => {
    if (!customer) setEditingId(null);
  }, [customer]);

  const payments = useMemo(
    () =>
      customer
        ? all.filter((p) => p.user_id === customer.user_id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [],
    [all, customer],
  );

  const paid = payments.filter(isPaidPayment);
  const totalPaid = paid.reduce((sum, p) => sum + (amountAED(p) || 0), 0);
  const active = payments.find((p) => p.status === 1);
  // Editing keeps the record from the latest list so a save shows the updated values.
  const editing = payments.find((p) => p._id === editingId);
  const name = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email : '';

  return (
    <Modal open={!!customer} onClose={onClose} title={editing ? 'Edit payment' : `Payment history — ${name}`} size="2xl">
      {customer &&
        (editing ? (
          <div className="mx-auto max-w-md">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-600"
            >
              <ArrowLeft className="h-4 w-4" /> Back to history
            </button>
            <EditPaymentForm key={editing._id} payment={editing} onDone={() => setEditingId(null)} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              {customer.email}
              <span className="mx-2 text-gray-300">·</span>
              <span className="font-mono text-xs">{customer.user_id}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Summary icon={Wallet} label="Total paid">
                AED {formatAED(totalPaid)}
              </Summary>
              <Summary icon={ReceiptText} label="Payments">
                {paid.length} paid · {payments.length} total
              </Summary>
              <Summary icon={CalendarClock} label="Current subscription">
                {active ? `${PLAN_LABEL[active.type] ?? active.type} · until ${formatDate(active.expiryDate)}` : 'None active'}
              </Summary>
            </div>

            {allStatus === 'loading' && payments.length === 0 ? (
              <Loader label="Loading payments…" />
            ) : payments.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
                This customer has no payments yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Plan / Amount</th>
                      <th className="px-3 py-2.5">Created</th>
                      <th className="px-3 py-2.5">Paid at</th>
                      <th className="px-3 py-2.5">Expires</th>
                      <th className="px-3 py-2.5">Ref</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {payments.map((p, i) => (
                      <tr key={p._id} className="whitespace-nowrap hover:bg-brand-50">
                        <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2.5">
                          {PLAN_LABEL[p.type] ?? p.type} · AED {formatAED(amountAED(p))}
                          {p.coupon_code && (
                            <Badge tone="brand" className="ml-2">
                              {p.coupon_code} −{p.discount_percent}%
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5">{formatDate(p.createdAt)}</td>
                        <td className="px-3 py-2.5">{p.status === 0 ? '—' : formatDateTime(p.paymentDate)}</td>
                        <td className="px-3 py-2.5">{formatDateTime(p.expiryDate)}</td>
                        <td className="px-3 py-2.5 font-mono text-xs">{p.transRef || '—'}</td>
                        <td className="px-3 py-2.5">
                          <Badge tone={STATUS_TONE[p.status] || 'gray'}>{statusLabel(p)}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingId(p._id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 ring-1 ring-inset ring-brand-200/70 transition-colors hover:bg-brand-500 hover:text-white hover:ring-brand-500"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit expiry / status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
    </Modal>
  );
}
