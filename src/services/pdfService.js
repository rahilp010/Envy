/**
 * PDF & HTML Invoice Template Service
 * Generates comprehensive GST-compliant Tax Invoices and Commercial Bills
 */

// Number to Words converter for Indian Rupee currency
export const numberToWords = (num) => {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.floor(Math.abs(num))).substr(-9);
  const match = n.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!match) return '';

  let str = '';
  str += Number(match[1]) !== 0 ? (a[Number(match[1])] || b[match[1][0]] + ' ' + a[match[1][1]]) + 'Crore ' : '';
  str += Number(match[2]) !== 0 ? (a[Number(match[2])] || b[match[2][0]] + ' ' + a[match[2][1]]) + 'Lakh ' : '';
  str += Number(match[3]) !== 0 ? (a[Number(match[3])] || b[match[3][0]] + ' ' + a[match[3][1]]) + 'Thousand ' : '';
  str += Number(match[4]) !== 0 ? (a[Number(match[4])] || b[match[4][0]] + ' ' + a[match[4][1]]) + 'Hundred ' : '';
  str += Number(match[5]) !== 0 ? ((str !== '' ? 'and ' : '') + (a[Number(match[5])] || b[match[5][0]] + ' ' + a[match[5][1]])) : '';

  return str.trim() ? str.trim() + ' Rupees Only' : 'Zero Rupees Only';
};

export const generateInvoiceHtml = ({
  company = {},
  client = {},
  transaction = {},
  items = [],
  isTaxInvoice = true,
}) => {
  const totalAmount = transaction.totalAmountWithTax || transaction.saleAmount || 0;
  const taxableAmount = transaction.totalAmountWithoutTax || transaction.saleAmount || 0;
  const taxAmount = transaction.taxAmount || 0;
  const freight = transaction.freightCharges || 0;
  const discount = transaction.discount || 0;
  const words = numberToWords(totalAmount);

  const tableRows = items.map((item, index) => {
    const qty = item.quantity || item.qty || 1;
    const rate = item.productPrice || item.rate || item.price || 0;
    const hsn = item.saleHSN || item.hsn || '-';
    const amount = (qty * rate).toFixed(2);
    const taxRate = item.taxRate ?? transaction.taxRate ?? 18;

    return `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td><strong>${item.productName || 'Item'}</strong></td>
        <td style="text-align: center;">${hsn}</td>
        <td style="text-align: right;">${qty}</td>
        <td style="text-align: right;">₹${parseFloat(rate).toFixed(2)}</td>
        <td style="text-align: center;">${taxRate}%</td>
        <td style="text-align: right;">₹${amount}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isTaxInvoice ? 'TAX INVOICE' : 'COMMERCIAL BILL'}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #1e293b;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.4;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .doc-type-badge {
      display: inline-block;
      padding: 6px 14px;
      background: #0f172a;
      color: #ffffff;
      font-weight: bold;
      font-size: 13px;
      border-radius: 4px;
      letter-spacing: 1px;
    }
    .info-grid {
      width: 100%;
      margin-bottom: 16px;
    }
    .info-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      background: #f8fafc;
      vertical-align: top;
      width: 48%;
    }
    .info-card h4 {
      margin: 0 0 6px 0;
      font-size: 12px;
      text-transform: uppercase;
      color: #475569;
      letter-spacing: 0.5px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 16px;
    }
    table.data-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 8px;
      font-size: 11px;
      text-transform: uppercase;
      border: 1px solid #0f172a;
    }
    table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 7px 8px;
    }
    table.data-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .summary-table {
      width: 45%;
      margin-left: auto;
      border-collapse: collapse;
    }
    .summary-table td {
      padding: 4px 8px;
    }
    .summary-table .total-row {
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      font-weight: bold;
      font-size: 15px;
      color: #0f172a;
    }
    .words-box {
      border: 1px dashed #cbd5e1;
      padding: 8px 12px;
      border-radius: 4px;
      background: #f8fafc;
      margin-top: 14px;
      font-style: italic;
    }
    .bank-and-terms {
      margin-top: 20px;
      width: 100%;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }
    .footer-sign {
      margin-top: 40px;
      text-align: right;
    }
  </style>
</head>
<body>

  <table class="header-table">
    <tr>
      <td style="width: 60%;">
        <div class="brand-title">${company.companyName || 'ENVY ENTERPRISE'}</div>
        <div class="brand-sub">${company.tagline || 'Industrial & Commercial Solutions'}</div>
        <div style="margin-top: 4px; font-size: 11px; color: #475569;">
          ${company.address ? company.address + '<br/>' : ''}
          ${company.phone ? 'Phone: ' + company.phone : ''} ${company.email ? '| Email: ' + company.email : ''}<br/>
          ${company.gstin ? '<strong>GSTIN:</strong> ' + company.gstin : ''} ${company.pan ? '| <strong>PAN:</strong> ' + company.pan : ''}
        </div>
      </td>
      <td style="width: 40%; text-align: right; vertical-align: top;">
        <span class="doc-type-badge">${isTaxInvoice ? 'TAX INVOICE' : 'COMMERCIAL BILL'}</span>
        <div style="margin-top: 10px; font-size: 12px;">
          <div><strong>Invoice No:</strong> ${transaction.billNo || 'SAL-NEW'}</div>
          <div><strong>Date:</strong> ${transaction.date ? new Date(transaction.date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</div>
          ${transaction.dueDate ? `<div><strong>Due Date:</strong> ${new Date(transaction.dueDate).toLocaleDateString('en-IN')}</div>` : ''}
        </div>
      </td>
    </tr>
  </table>

  <table class="info-grid">
    <tr>
      <td class="info-card">
        <h4>Billed To (Customer Details)</h4>
        <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${client.clientName || transaction.clientName || 'Cash Customer'}</div>
        <div>${client.address || 'Address on file'}</div>
        <div>Phone: ${client.phoneNo || client.contactNo || '-'}</div>
        ${client.gstNo ? `<div><strong>GSTIN:</strong> ${client.gstNo}</div>` : ''}
      </td>
      <td style="width: 4%;"></td>
      <td class="info-card">
        <h4>Payment & Delivery Info</h4>
        <div><strong>Payment Method:</strong> ${(transaction.paymentMethod || 'Bank').toUpperCase()}</div>
        <div><strong>Status:</strong> ${(transaction.statusOfTransaction || 'Completed').toUpperCase()}</div>
        <div><strong>Payment Type:</strong> ${(transaction.paymentType || 'Full').toUpperCase()}</div>
        ${transaction.description ? `<div><strong>Notes:</strong> ${transaction.description}</div>` : ''}
      </td>
    </tr>
  </table>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 40%; text-align: left;">Item Description</th>
        <th style="width: 12%;">HSN / SAC</th>
        <th style="width: 8%; text-align: right;">Qty</th>
        <th style="width: 12%; text-align: right;">Rate</th>
        <th style="width: 8%;">GST</th>
        <th style="width: 15%; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <table style="width: 100%;">
    <tr>
      <td style="vertical-align: top; width: 50%;">
        <div class="words-box">
          <strong>Amount in Words:</strong><br/>
          ${words}
        </div>
      </td>
      <td style="vertical-align: top; width: 50%;">
        <table class="summary-table">
          <tr>
            <td>Taxable Amount:</td>
            <td style="text-align: right;">₹${parseFloat(taxableAmount).toFixed(2)}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td>Discount:</td>
            <td style="text-align: right; color: #16a34a;">-₹${parseFloat(discount).toFixed(2)}</td>
          </tr>` : ''}
          <tr>
            <td>Total Tax (GST):</td>
            <td style="text-align: right;">₹${parseFloat(taxAmount).toFixed(2)}</td>
          </tr>
          ${freight > 0 ? `
          <tr>
            <td>Freight Charges:</td>
            <td style="text-align: right;">₹${parseFloat(freight).toFixed(2)}</td>
          </tr>` : ''}
          <tr class="total-row">
            <td>Grand Total:</td>
            <td style="text-align: right;">₹${parseFloat(totalAmount).toFixed(2)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <table class="bank-and-terms">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <h4 style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase;">Bank Details for Wire Transfer</h4>
        <div style="font-size: 11px;">
          Bank Name: ${company.bankName || 'State Bank of India'}<br/>
          Account No: ${company.bankAccNo || 'XXXXXXXXXXXX'}<br/>
          IFSC Code: ${company.bankIfsc || 'SBIN0000000'}<br/>
          Branch: ${company.bankBranch || 'Main Branch'}
        </div>
        <div style="margin-top: 10px; font-size: 10px; color: #64748b;">
          <strong>Terms & Conditions:</strong><br/>
          ${company.terms || '1. Goods once sold will not be returned.\n2. Subject to local jurisdiction.'}
        </div>
      </td>
      <td style="width: 50%; vertical-align: bottom; text-align: right;">
        <div style="font-size: 12px; font-weight: bold;">For ${company.companyName || 'ENVY ERP'}</div>
        <div style="height: 50px;"></div>
        <div style="border-top: 1px solid #94a3b8; display: inline-block; width: 180px; text-align: center; font-size: 11px; padding-top: 4px;">
          Authorized Signatory
        </div>
      </td>
    </tr>
  </table>

</body>
</html>
  `;
};
