export const STATUS_TONE = { 1: 'green', 2: 'yellow', 0: 'gray' };
const STATUS_LABEL = { 1: 'Paid', 2: 'Suspended', 0: 'Pending' };
export const PLAN_LABEL = { 0: 'Basic', 1: 'Standard', 2: 'Premium', 3: 'Starter' };
// What records created before the charged amount was stored were billed, in AED
// (Starter was 195 then; new Starter payments store their 0.38 amount).
const PLAN_PRICE = { 0: 350, 1: 495, 2: 899, 3: 195 };

// Status 2 is set both by the expiry job and by admins suspending a customer.
export const statusLabel = (row) => {
  if (row.status === 2 && row.expiryDate && new Date(row.expiryDate) < new Date()) return 'Expired';
  return STATUS_LABEL[row.status] ?? row.status;
};

export const amountAED = (row) => (row.amount != null ? row.amount / 100 : PLAN_PRICE[row.type]);

export const formatAED = (value) => (value ?? 0).toLocaleString('en-AE', { maximumFractionDigits: 2 });
