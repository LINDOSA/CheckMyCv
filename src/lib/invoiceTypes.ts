export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  sessionId: string;
  packageName: string;
  amountPaid: string;
  currency: string;
  subtotal: string;
  tax: string;
  total: string;
  status: 'PAID';
  paymentMethod: string;
  companyName: string;
  companyAddress: string;
  supportEmail: string;
}

/**
 * Creates structured invoice data with unique serial number and timestamp
 */
export function createInvoiceData(params: {
  customerName: string;
  customerEmail: string;
  sessionId: string;
  amountPaid?: string;
}): InvoiceData {
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const randomSerial = Math.floor(100000 + Math.random() * 900000);
  const invoiceNumber = 'INV-' + now.getFullYear() + '-' + randomSerial;

  return {
    invoiceNumber,
    date: dateFormatted,
    customerName: params.customerName || 'Valued Candidate',
    customerEmail: params.customerEmail,
    sessionId: params.sessionId,
    packageName: 'Executive CV Revamp Package',
    amountPaid: params.amountPaid || '$9.00 USD',
    currency: 'USD',
    subtotal: '$9.00 USD',
    tax: '$0.00 USD (0% VAT/Tax Exempt)',
    total: '$9.00 USD',
    status: 'PAID',
    paymentMethod: 'Stripe 256-Bit Encrypted Card Payment',
    companyName: 'CheckMyCV Ltd. (Executive Resume Systems)',
    companyAddress: '128 Innovation Way, Suite 400, Wilmington, DE 19801',
    supportEmail: 'support@checkmycv.co.za',
  };
}

/**
 * Generates an official, print-ready HTML Tax Invoice
 */
export function generateInvoiceHtml(invoice: InvoiceData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice ${invoice.invoiceNumber}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 32px;
      color: #0f172a;
      background: #f8fafc;
    }
    .invoice-card {
      max-width: 680px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 36px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-num {
      font-family: monospace;
      font-weight: 700;
      font-size: 15px;
      color: #0284c7;
    }
    .badge-paid {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
      font-size: 13px;
      line-height: 1.5;
    }
    .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
      font-size: 13px;
    }
    .table th {
      text-align: left;
      padding: 10px 12px;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
    }
    .table td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .total-box {
      margin-left: auto;
      width: 260px;
      margin-bottom: 28px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #475569;
    }
    .total-row.grand {
      display: flex;
      justify-content: space-between;
      padding: 12px 0 6px 0;
      border-top: 2px solid #0f172a;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      font-size: 11px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .invoice-card {
        box-shadow: none;
        border: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand-title">CheckMyCV</div>
        <div class="brand-sub">${invoice.companyName}</div>
        <div class="brand-sub">${invoice.companyAddress}</div>
      </div>
      <div class="invoice-meta">
        <div class="label">Official Tax Receipt</div>
        <div class="invoice-num">${invoice.invoiceNumber}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${invoice.date}</div>
        <span class="badge-paid">✓ Paid in Full</span>
      </div>
    </div>

    <div class="details-grid">
      <div>
        <div class="label">Billed To</div>
        <div style="font-weight: 700; font-size: 14px;">${invoice.customerName}</div>
        <div style="color: #475569;">${invoice.customerEmail}</div>
      </div>
      <div>
        <div class="label">Payment Details</div>
        <div>Method: <strong>${invoice.paymentMethod}</strong></div>
        <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-top: 2px;">
          Transaction Ref: ${invoice.sessionId}
        </div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center; width: 60px;">Qty</th>
          <th style="text-align: right; width: 100px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${invoice.packageName}</strong>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              Single-column ATS standard DOCX export, PDF document, full executive rewrite &amp; lifetime access.
            </div>
          </td>
          <td style="text-align: center;">1</td>
          <td style="text-align: right; font-weight: 600;">${invoice.subtotal}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>${invoice.subtotal}</span>
      </div>
      <div class="total-row">
        <span>VAT / Sales Tax (0%):</span>
        <span>${invoice.tax}</span>
      </div>
      <div class="total-row grand">
        <span>Total Paid:</span>
        <span>${invoice.total}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for choosing CheckMyCV for your career advancement.</p>
      <p>For questions or assistance regarding this order, please contact <strong>${invoice.supportEmail}</strong> quoting invoice number ${invoice.invoiceNumber}.</p>
    </div>
  </div>
</body>
</html>`;
}
