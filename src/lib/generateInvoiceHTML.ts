import { InvoiceData } from '@/types/invoice';
import { COMPANY_CONFIG } from './invoiceConfig';

/**
 * Generate professional GST-compliant invoice HTML
 * Returns HTML string ready for PDF conversion
 */
export function generateInvoiceHTML(invoiceData: InvoiceData): string {
  const {
    invoiceNumber,
    invoiceDate,
    companyName,
    companyAddress,
    companyGstNo,
    buyerName,
    buyerCompany,
    buyerAddress,
    buyerGstNo,
    buyerEmail,
    description,
    hsnCode,
    quantity,
    rate,
    amount,
    cgst,
    sgst,
    igst,
    grandTotal,
    amountInWords,
    bankDetails,
    footerText,
    taxType,
  } = invoiceData;

  // Format currency (INR with 2 decimal places)
  const formatCurrency = (value: number): string => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Determine tax display
  const taxRows = taxType === 'igst' 
    ? `<tr>
         <td colspan="4" style="text-align: right; padding: 8px; border-top: 1px solid #ddd; font-weight: 600;">Add: IGST @ 18%:</td>
         <td style="text-align: right; padding: 8px; border-top: 1px solid #ddd; font-weight: 600;">${formatCurrency(igst)}</td>
       </tr>`
    : `<tr>
         <td colspan="4" style="text-align: right; padding: 8px; border-top: 1px solid #ddd; font-weight: 600;">Add: CGST @ 9%:</td>
         <td style="text-align: right; padding: 8px; border-top: 1px solid #ddd; font-weight: 600;">${formatCurrency(cgst)}</td>
       </tr>
       <tr>
         <td colspan="4" style="text-align: right; padding: 8px; font-weight: 600;">Add: SGST @ 9%:</td>
         <td style="text-align: right; padding: 8px; font-weight: 600;">${formatCurrency(sgst)}</td>
       </tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #000;
      background: #fff;
    }
    
    @page {
      size: A4;
      margin: 15mm;
    }
    
    .invoice-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
      background: #fff;
    }
    
    .invoice-header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #000;
      padding-bottom: 10px;
    }
    
    .invoice-header h1 {
      font-size: 24px;
      font-weight: bold;
      color: #d32f2f;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      align-items: flex-start;
    }
    
    .invoice-number-date {
      text-align: right;
      font-weight: 600;
    }
    
    .invoice-number-date div {
      margin-bottom: 5px;
    }
    
    .company-buyer-container {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 40px;
    }
    
    .seller-section,
    .buyer-section {
      flex: 1;
    }
    
    .section-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 10px;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    
    .buyer-section .section-title {
      margin-bottom: 15px;
    }
    
    .seller-info,
    .buyer-info {
      line-height: 1.8;
    }
    
    .seller-info div,
    .buyer-info div {
      margin-bottom: 5px;
    }
    
    .line-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border: 1px solid #ddd;
    }
    
    .line-items-table th {
      background-color: #f5f5f5;
      padding: 10px 8px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #ddd;
      font-size: 11px;
    }
    
    .line-items-table td {
      padding: 10px 8px;
      border: 1px solid #ddd;
      font-size: 11px;
    }
    
    .line-items-table th:nth-child(3),
    .line-items-table th:nth-child(4),
    .line-items-table th:nth-child(5),
    .line-items-table td:nth-child(3),
    .line-items-table td:nth-child(4),
    .line-items-table td:nth-child(5) {
      text-align: right;
    }
    
    .totals-section {
      margin-bottom: 20px;
    }
    
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      margin-left: auto;
      margin-right: 0;
      max-width: 300px;
    }
    
    .totals-table td {
      padding: 8px;
      border: none;
    }
    
    .totals-table td:first-child {
      text-align: right;
      font-weight: 600;
      padding-right: 10px;
    }
    
    .totals-table td:last-child {
      text-align: right;
      font-weight: 600;
      border-top: 1px solid #ddd;
    }
    
    .grand-total-row td {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      font-size: 14px;
      font-weight: bold;
      padding: 10px 8px;
    }
    
    .amount-in-words {
      margin-top: 15px;
      margin-bottom: 20px;
      padding: 10px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      font-weight: 600;
      font-size: 11px;
    }
    
    .bank-details {
      margin-top: 30px;
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      font-size: 11px;
    }
    
    .bank-details h3 {
      font-size: 13px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    
    .bank-details div {
      margin-bottom: 5px;
      line-height: 1.6;
    }
    
    .footer {
      margin-top: 50px;
      text-align: right;
      font-size: 11px;
    }
    
    .footer div {
      margin-bottom: 10px;
    }
    
    .signature-line {
      margin-top: 60px;
      text-align: right;
    }
    
    @media print {
      body {
        background: #fff;
      }
      
      .invoice-container {
        padding: 0;
      }
      
      @page {
        margin: 15mm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <h1>TAX INVOICE</h1>
    </div>
    
    <!-- Invoice Number and Date -->
    <div class="invoice-info">
      <div></div>
      <div class="invoice-number-date">
        <div>Invoice No: ${invoiceNumber}</div>
        <div>Date: ${invoiceDate}</div>
      </div>
    </div>
    
    <!-- Company and Buyer Details -->
    <div class="company-buyer-container">
      <!-- Seller Section -->
      <div class="seller-section">
        <div class="seller-info">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">${companyName}</div>
          <div>${companyAddress}</div>
          <div>GST No: ${companyGstNo}</div>
        </div>
      </div>
      
      <!-- Buyer Section -->
      <div class="buyer-section">
        <div class="section-title">Bill To:</div>
        <div class="buyer-info">
          ${buyerCompany ? `<div style="font-weight: bold; margin-bottom: 5px;">${buyerCompany}</div>` : ''}
          ${buyerName ? `<div style="margin-bottom: 5px;">${buyerName}</div>` : ''}
          ${buyerAddress ? `<div style="margin-bottom: 5px;">${buyerAddress}</div>` : ''}
          ${buyerGstNo ? `<div style="margin-bottom: 5px;">GST No: ${buyerGstNo}</div>` : ''}
          ${buyerEmail ? `<div style="margin-bottom: 5px;">Email: ${buyerEmail}</div>` : ''}
        </div>
      </div>
    </div>
    
    <!-- Line Items Table -->
    <table class="line-items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>HSN Code</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${description}</td>
          <td>${hsnCode}</td>
          <td>${quantity}</td>
          <td>${formatCurrency(rate)}</td>
          <td>${formatCurrency(amount)}</td>
        </tr>
      </tbody>
    </table>
    
    <!-- Totals Section -->
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td>Total:</td>
          <td>${formatCurrency(amount)}</td>
        </tr>
        ${taxRows}
        <tr class="grand-total-row">
          <td>Grand Total:</td>
          <td>${formatCurrency(grandTotal)}</td>
        </tr>
      </table>
    </div>
    
    <!-- Amount in Words -->
    <div class="amount-in-words">
      <strong>Total Amount (₹ - In Words):</strong> ${amountInWords}
    </div>
    
    <!-- Bank Details -->
    <div class="bank-details">
      <h3>Bank Details:</h3>
      <div><strong>Account Name:</strong> ${bankDetails.accountName}</div>
      <div><strong>Current A/C:</strong> ${bankDetails.accountNumber}</div>
      <div><strong>Bank:</strong> ${bankDetails.bank}</div>
      <div><strong>IFSC Code:</strong> ${bankDetails.ifsc}</div>
      <div><strong>Branch:</strong> ${bankDetails.branch}</div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div>${footerText}</div>
      <div class="signature-line">
        <div style="margin-bottom: 40px;">_______________________</div>
        <div>Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  return html;
}
