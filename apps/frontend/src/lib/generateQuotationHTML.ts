import { Lead, Stall } from '@/types/database';
import { COMPANY_CONFIG, INVOICE_CONFIG } from './invoiceConfig';
import { numberToWords } from './invoiceUtils';

// Default base price per stall when calculating quantity-based quotes
export const DEFAULT_STALL_BASE_PRICE = 10000;

export interface QuotationData {
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  companyName: string;
  companyAddress: string;
  companyGstNo: string;
  buyerName: string;
  buyerCompany: string | null;
  buyerPhone: string;
  buyerEmail: string | null;
  // Scenario A: Specific stalls selected
  stalls: Array<{
    stallNumber: string;
    zone: string | null;
    price: number;
  }>;
  // Scenario B: Quantity-based interest (no specific stalls)
  isQuantityBased: boolean;
  targetStallCount: number | null;
  pricePerStall: number;
  subtotal: number;
  isGst: boolean;
  cgst: number;
  sgst: number;
  grandTotal: number;
  amountInWords: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bank: string;
    ifsc: string;
    branch: string;
  };
}

/**
 * Build quotation data from lead and selected stalls
 * Supports both specific stall selection (Scenario A) and quantity-based interest (Scenario B)
 */
export function buildQuotationData(
  lead: Lead,
  stalls: Stall[],
  quotationNumber: string,
  averageStallPrice?: number
): QuotationData {
  const isQuantityBased = stalls.length === 0 && (lead.target_stall_count || 0) > 0;
  const pricePerStall = averageStallPrice || DEFAULT_STALL_BASE_PRICE;
  
  // Calculate subtotal based on scenario
  let subtotal: number;
  if (isQuantityBased) {
    // Scenario B: Quantity-based calculation
    subtotal = (lead.target_stall_count || 0) * pricePerStall;
  } else {
    // Scenario A: Specific stalls
    subtotal = stalls.reduce((sum, stall) => sum + stall.base_rent, 0);
  }
  
  // Use lead's GST preference
  const isGst = lead.quoted_gst || false;
  const cgst = isGst ? Math.round(subtotal * 0.09) : 0;
  const sgst = isGst ? Math.round(subtotal * 0.09) : 0;
  const grandTotal = subtotal + cgst + sgst;
  
  // Format dates
  const today = new Date();
  const validUntilDate = new Date(today);
  validUntilDate.setDate(validUntilDate.getDate() + 7); // Valid for 7 days
  
  const formatDate = (date: Date) => date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).split('/').join('-');
  
  return {
    quotationNumber,
    quotationDate: formatDate(today),
    validUntil: formatDate(validUntilDate),
    companyName: COMPANY_CONFIG.name,
    companyAddress: COMPANY_CONFIG.address,
    companyGstNo: COMPANY_CONFIG.gstNo,
    buyerName: lead.name,
    buyerCompany: lead.company,
    buyerPhone: lead.phone,
    buyerEmail: lead.email,
    stalls: stalls.map(stall => ({
      stallNumber: stall.stall_number,
      zone: stall.zone,
      price: stall.base_rent,
    })),
    isQuantityBased,
    targetStallCount: lead.target_stall_count,
    pricePerStall,
    subtotal,
    isGst,
    cgst,
    sgst,
    grandTotal,
    amountInWords: numberToWords(grandTotal),
    bankDetails: COMPANY_CONFIG.bankDetails,
  };
}

/**
 * Generate professional quotation HTML
 * Returns HTML string ready for PDF conversion
 * Handles both Scenario A (specific stalls) and Scenario B (quantity-based)
 */
export function generateQuotationHTML(data: QuotationData): string {
  const {
    quotationNumber,
    quotationDate,
    validUntil,
    companyName,
    companyAddress,
    companyGstNo,
    buyerName,
    buyerCompany,
    buyerPhone,
    buyerEmail,
    stalls,
    isQuantityBased,
    targetStallCount,
    pricePerStall,
    subtotal,
    isGst,
    cgst,
    sgst,
    grandTotal,
    amountInWords,
    bankDetails,
  } = data;

  // Format currency (INR with 2 decimal places)
  const formatCurrency = (value: number): string => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Build stall rows - different for Scenario A vs B
  let stallRows: string;
  if (isQuantityBased && targetStallCount) {
    // Scenario B: Quantity-based interest (location TBD)
    stallRows = `
    <tr>
      <td style="padding: 10px 8px; border: 1px solid #ddd;">1</td>
      <td style="padding: 10px 8px; border: 1px solid #ddd;">
        <div>Reservation for ${targetStallCount} Standard Stall${targetStallCount > 1 ? 's' : ''}</div>
        <div style="color: #666; font-size: 10px; margin-top: 4px;">(Location to be determined)</div>
      </td>
      <td style="padding: 10px 8px; border: 1px solid #ddd;">${INVOICE_CONFIG.hsnCode}</td>
      <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">${targetStallCount}</td>
      <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(pricePerStall)}</td>
      <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(subtotal)}</td>
    </tr>
  `;
  } else {
    // Scenario A: Specific stalls selected
    stallRows = stalls.map((stall, idx) => `
    <tr>
      <td style="padding: 10px 8px; border: 1px solid #ddd;">${idx + 1}</td>
      <td style="padding: 10px 8px; border: 1px solid #ddd;">Stall ${stall.stallNumber}${stall.zone ? ` (${stall.zone})` : ''}</td>
      <td style="padding: 10px 8px; border: 1px solid #ddd;">${INVOICE_CONFIG.hsnCode}</td>
      <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">1</td>
      <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(stall.price)}</td>
      <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(stall.price)}</td>
    </tr>
  `).join('');
  }

  // GST rows (only if GST is applied)
  const taxRows = isGst ? `
    <tr>
      <td colspan="5" style="text-align: right; padding: 8px; border-top: 1px solid #ddd; font-weight: 600;">Add: CGST @ 9%:</td>
      <td style="text-align: right; padding: 8px; border-top: 1px solid #ddd; font-weight: 600;">${formatCurrency(cgst)}</td>
    </tr>
    <tr>
      <td colspan="5" style="text-align: right; padding: 8px; font-weight: 600;">Add: SGST @ 9%:</td>
      <td style="text-align: right; padding: 8px; font-weight: 600;">${formatCurrency(sgst)}</td>
    </tr>
  ` : '';

  // Additional note for quantity-based quotes (Scenario B)
  const quantityBasedNote = isQuantityBased ? `
    <div style="margin-top: 15px; padding: 12px; background-color: #e3f2fd; border: 1px solid #2196f3; border-left: 4px solid #2196f3; font-size: 11px;">
      <strong>📍 Location Note:</strong> Stall locations will be assigned upon formal booking and payment confirmation. 
      You may request preferred locations which will be allocated based on availability.
    </div>
  ` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation - ${quotationNumber}</title>
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
    
    .quotation-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
      background: #fff;
    }
    
    .quotation-header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #000;
      padding-bottom: 10px;
    }
    
    .quotation-header h1 {
      font-size: 24px;
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .quotation-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      align-items: flex-start;
    }
    
    .quotation-number-date {
      text-align: right;
      font-weight: 600;
    }
    
    .quotation-number-date div {
      margin-bottom: 5px;
    }
    
    .valid-until {
      color: #d32f2f;
      font-weight: bold;
      margin-top: 10px;
      padding: 5px 10px;
      background: #fff3f3;
      border: 1px solid #d32f2f;
      border-radius: 4px;
      display: inline-block;
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
      background-color: #0066cc;
      color: white;
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
    
    .line-items-table th:nth-child(4),
    .line-items-table th:nth-child(5),
    .line-items-table th:nth-child(6),
    .line-items-table td:nth-child(4),
    .line-items-table td:nth-child(5),
    .line-items-table td:nth-child(6) {
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
      max-width: 350px;
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
      background-color: #f0f7ff;
      border: 1px solid #0066cc;
      font-weight: 600;
      font-size: 11px;
    }
    
    .disclaimer {
      margin-top: 20px;
      margin-bottom: 20px;
      padding: 15px;
      background-color: #fff9e6;
      border: 1px solid #ffc107;
      border-left: 4px solid #ffc107;
      font-size: 11px;
    }
    
    .disclaimer h4 {
      color: #856404;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .disclaimer ul {
      margin-left: 20px;
      color: #856404;
    }
    
    .disclaimer li {
      margin-bottom: 4px;
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
      
      .quotation-container {
        padding: 0;
      }
      
      @page {
        margin: 15mm;
      }
    }
  </style>
</head>
<body>
  <div class="quotation-container">
    <!-- Header -->
    <div class="quotation-header">
      <h1>FORMAL QUOTATION</h1>
    </div>
    
    <!-- Quotation Number and Date -->
    <div class="quotation-info">
      <div></div>
      <div class="quotation-number-date">
        <div>Quotation No: ${quotationNumber}</div>
        <div>Date: ${quotationDate}</div>
        <div class="valid-until">⏰ Valid Until: ${validUntil}</div>
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
        <div class="section-title">Quotation For:</div>
        <div class="buyer-info">
          ${buyerCompany ? `<div style="font-weight: bold; margin-bottom: 5px;">${buyerCompany}</div>` : ''}
          <div style="margin-bottom: 5px;">${buyerName}</div>
          <div style="margin-bottom: 5px;">📞 ${buyerPhone}</div>
          ${buyerEmail ? `<div style="margin-bottom: 5px;">✉️ ${buyerEmail}</div>` : ''}
        </div>
      </div>
    </div>
    
    <!-- Line Items Table -->
    <table class="line-items-table">
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>Description</th>
          <th>HSN Code</th>
          <th style="width: 60px;">Qty</th>
          <th style="width: 100px;">Rate</th>
          <th style="width: 100px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${stallRows}
      </tbody>
    </table>
    
    <!-- Totals Section -->
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td>Subtotal:</td>
          <td>${formatCurrency(subtotal)}</td>
        </tr>
        ${taxRows}
        <tr class="grand-total-row">
          <td>${isGst ? 'Grand Total (incl. GST):' : 'Grand Total:'}</td>
          <td>${formatCurrency(grandTotal)}</td>
        </tr>
      </table>
    </div>
    
    <!-- Amount in Words -->
    <div class="amount-in-words">
      <strong>Total Amount (₹ - In Words):</strong> ${amountInWords}
    </div>
    
    ${quantityBasedNote}
    
    <!-- Disclaimer -->
    <div class="disclaimer">
      <h4>⚠️ Important Notice:</h4>
      <ul>
        <li>This is an <strong>estimate only</strong> and does not guarantee stall reservation.</li>
        <li>Stall availability is subject to change until payment is confirmed.</li>
        <li>This quotation is valid for <strong>7 days</strong> from the date of issue.</li>
        <li>Prices are subject to change without prior notice after the validity period.</li>
        <li>To confirm your booking, please make payment to the bank account below.</li>
      </ul>
    </div>
    
    <!-- Bank Details -->
    <div class="bank-details">
      <h3>Bank Details for Payment:</h3>
      <div><strong>Account Name:</strong> ${bankDetails.accountName}</div>
      <div><strong>Current A/C:</strong> ${bankDetails.accountNumber}</div>
      <div><strong>Bank:</strong> ${bankDetails.bank}</div>
      <div><strong>IFSC Code:</strong> ${bankDetails.ifsc}</div>
      <div><strong>Branch:</strong> ${bankDetails.branch}</div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div>For M/s Catalyst Connect</div>
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

/**
 * Download quotation as HTML file
 */
export function downloadQuotation(data: QuotationData, filename?: string): void {
  try {
    const html = generateQuotationHTML(data);
    
    if (!filename) {
      const buyerName = (data.buyerCompany || data.buyerName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
      filename = `Quotation_${data.quotationNumber}_${buyerName}.html`;
    }
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Quotation] Error downloading quotation:', error);
    }
    throw error;
  }
}
