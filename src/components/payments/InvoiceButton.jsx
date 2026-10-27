import { useState } from 'react';
import toast from 'react-hot-toast';
import { FileDown } from 'lucide-react';
import Button from '../common/Button';
import { downloadInvoice, invoiceBlocker } from '../../features/payments/invoice/downloadInvoice';
import { isPaidPayment } from './PaymentPeriodCards';

/** Downloads the payment's tax invoice PDF. Hidden for unpaid payments; disabled (with the reason) when data is missing. */
export default function InvoiceButton({ payment }) {
  const [busy, setBusy] = useState(false);
  if (!isPaidPayment(payment)) return null;
  const blocker = invoiceBlocker(payment);

  const handleClick = async () => {
    setBusy(true);
    try {
      await downloadInvoice(payment);
    } catch (err) {
      toast.error(`Couldn't create the invoice: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleClick}
      loading={busy}
      disabled={!!blocker}
      title={blocker || `Download invoice ${payment.reciept_number}`}
    >
      {!busy && <FileDown className="h-3.5 w-3.5" />} Invoice
    </Button>
  );
}
