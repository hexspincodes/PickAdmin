import { amountAED } from '../paymentUtils';
import { INVOICE_LOGO } from './invoiceLogo';

// Port of the backend's customer invoice (Pick_Back Backend2 recieptTemplate.js + getInvoice) —
// keep the layout, wording, plan name and charged amount in sync with it.

const VAT_RATE = 5;
const TAX_REGISTRATION_NUMBER = '104284919800003';

// Plan names as the backend prints them (Pick_Back receiptPlanName) — not the dashboard's PLAN_LABEL.
const invoicePlanName = (payment) => {
  const { type } = payment;
  const plan = type == 0 ? 'Basic Plan' : type == 1 ? 'Standard Plan' : type == 3 ? 'Special Plan' : 'Premium Plan';
  return payment.coupon_code ? `${plan} (${payment.coupon_code} - ${payment.discount_percent}% off)` : plan;
};

const ddmmyyyy = (date) => {
  const d = new Date(date);
  if (!date || Number.isNaN(d.getTime())) return null;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// pdfmake + its fonts are ~1MB, so they load on the first download only.
let pdfMakePromise;
const loadPdfMake = () => {
  pdfMakePromise ??= Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')]).then(
    ([pdfMakeModule, fontsModule]) => {
      const pdfMake = pdfMakeModule.default ?? pdfMakeModule;
      const fonts = fontsModule.default ?? fontsModule;
      pdfMake.vfs = fonts.pdfMake?.vfs ?? fonts.vfs ?? fonts;
      return pdfMake;
    },
  );
  return pdfMakePromise;
};

/**
 * Why an invoice can't be produced for this payment, or null if it can. Never invent an
 * invoice number or dates for a tax invoice.
 */
export function invoiceBlocker(payment) {
  if (payment.reciept_number == null) return 'This payment has no invoice number.';
  if (!ddmmyyyy(payment.paymentDate)) return 'This payment has no payment date.';
  if (!ddmmyyyy(payment.expiryDate)) return 'This payment has no subscription end date.';
  if (amountAED(payment) == null) return 'This payment has no amount.';
  return null;
}

export function invoiceDefinition(payment) {
  const amount = Math.round(amountAED(payment) * 100) / 100;
  const basePrice = amount * (100 / (100 + VAT_RATE));
  const startDate = ddmmyyyy(payment.paymentDate);
  const validity = `${startDate} to ${ddmmyyyy(payment.expiryDate)}`;
  let billAddress = `${payment.name || ''}\n${payment.email || ''}\n`;
  if (payment.mobile) billAddress += `+${String(payment.mobile).replace(/^\+/, '')}`;

  return {
    info: { title: `Tax Invoice ${payment.reciept_number}` },
    content: [
      { image: INVOICE_LOGO, width: 100, margin: [0, 20] },
      {
        columns: [
          { text: `Tax Invoice: ${payment.reciept_number}`, bold: true },
          { text: startDate, alignment: 'right' },
        ],
      },
      { text: `Tax Registration Number: ${TAX_REGISTRATION_NUMBER}`, margin: [0, 10] },
      { text: 'Bill To', style: 'header', margin: [0, 30, 0, 10] },
      { text: billAddress, lineHeight: 1.5, fontSize: 10 },
      { text: 'Subscription Details', style: 'header', margin: [0, 30, 0, 10] },
      {
        table: {
          widths: ['auto', 'auto', '*', 'auto'],
          body: [
            [
              { text: 'Transaction ID', border: [false], style: 'tableHeader' },
              { text: 'Subscription Plan', border: [false], style: 'tableHeader', margin: [0, 5, 5, 5] },
              { text: 'Subscription Period', border: [false], style: 'tableHeader' },
              { text: 'Amount', border: [false], alignment: 'right', style: 'tableHeader' },
            ],
            [
              { text: payment.transRef || '', border: [false], style: 'tableBody' },
              { text: invoicePlanName(payment), border: [false], style: 'tableBody' },
              { text: validity, border: [false], style: 'tableBody' },
              { text: `AED ${basePrice.toFixed(2)}`, border: [false], alignment: 'right', style: 'tableBody' },
            ],
          ],
        },
      },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              { text: 'VAT 5%', bold: true, fontSize: 10, alignment: 'right', margin: [2, 2] },
              { text: `AED ${(amount - basePrice).toFixed(2)}`, fontSize: 10, alignment: 'right', margin: [2, 2] },
            ],
            [
              { text: 'Taxable Amount', bold: true, alignment: 'right', margin: [2, 2] },
              { text: `AED ${amount}`, alignment: 'right', bold: true, margin: [2, 2] },
            ],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 1 : 0),
          vLineWidth: () => 0,
        },
        margin: [0, 0, 0, 20],
      },
      {
        text: 'Thank you for choosing us for your subscription. If you have any questions or need assistance, please feel free to contact us at pickmymaid@gmail.com. We look forward to serving you again soon!',
        lineHeight: '1.2',
        fontSize: 10,
      },
      { text: '\n\n\n\nRefund and Cancellation Policy', bold: true, margin: [0, 10, 0, 5], fontSize: 10 },
      {
        text: 'All payments made are non-refundable once access is granted. Subscription cancellations cannot be processed during the active period. The subscription will be automatically canceled upon completion of the subscribed duration',
        lineHeight: 1.2,
        fontSize: 10,
      },
    ],
    styles: {
      header: { fontSize: 13, bold: true, alignment: 'justify' },
      tableHeader: { bold: true, fillColor: '#FF8F5F', color: 'white', fontSize: 10, margin: [0, 5] },
      tableBody: { fontSize: 10, fillColor: '#f0f8ff', margin: [0, 5] },
    },
  };
}

/** Builds the payment's tax invoice and saves it as "<name> Invoice <number>.pdf". Throws if blocked. */
export async function downloadInvoice(payment) {
  const blocker = invoiceBlocker(payment);
  if (blocker) throw new Error(blocker);
  const pdfMake = await loadPdfMake();
  const filename = `${(payment.name || 'Customer').trim()} Invoice ${payment.reciept_number}.pdf`;
  await new Promise((resolve) => pdfMake.createPdf(invoiceDefinition(payment)).download(filename, resolve));
}
