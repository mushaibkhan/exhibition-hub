import { Payment, Transaction, Lead, TransactionItem, Exhibition } from '@/types/database';
import { InvoiceData } from '@/types/invoice';
import { COMPANY_CONFIG, INVOICE_CONFIG } from './invoiceConfig';

/**
 * Convert number to Indian English words
 * Example: 41300 -> "INR Forty One Thousand Three Hundred Only"
 */
export function numberToWords(amount: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];
  
  function convertHundreds(num: number): string {
    let result = '';
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num > 0) {
      result += ones[num] + ' ';
    }
    return result.trim();
  }
  
  if (amount === 0) return 'INR Zero Only';
  
  let words = 'INR ';
  let num = Math.floor(amount);
  
  // Handle crores (10000000)
  if (num >= 10000000) {
    words += convertHundreds(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  
  // Handle lakhs (100000)
  if (num >= 100000) {
    words += convertHundreds(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  
  // Handle thousands (1000)
  if (num >= 1000) {
    words += convertHundreds(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  
  // Handle hundreds and below
  if (num > 0) {
    words += convertHundreds(num) + ' ';
  }
  
  return words.trim() + ' Only';
}

/**
 * Generate next invoice number
 * Format: CC001, CC002, etc.
 */
export async function generateInvoiceNumber(existingPayments: Payment[]): Promise<string> {
  // Extract invoice numbers from existing payments
  // Format: CC/001, CC/002, etc. (with slash)
  const maxInvoiceNumber = existingPayments
    .map(p => {
      // Extract number from invoice_number (support both CC001 and CC/001 formats)
      const invoiceNum = (p as any).invoice_number || '';
      const invoiceMatch = invoiceNum.match(/CC[\/]?(\d+)/);
      return invoiceMatch ? parseInt(invoiceMatch[1], 10) : 0;
    })
    .reduce((max, num) => Math.max(max, num), 0);
  
  const nextNumber = maxInvoiceNumber + 1;
  // Format: CC/001, CC/002, etc. (with slash as shown in template)
  return `${INVOICE_CONFIG.invoicePrefix}/${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Build invoice data from payment and related entities
 */
export function buildInvoiceData(
  payment: Payment,
  transaction: Transaction,
  lead: Lead,
  items: TransactionItem[],
  allPayments: Payment[],
  exhibition: Exhibition
): InvoiceData {
  // Find stall item to get stall number
  const stallItem = items.find(item => item.item_type === 'stall' && item.stall_id);
  const stallNumber = stallItem ? stallItem.item_name.replace('Stall ', '') : null;
  
  // Calculate subtotal from transaction items
  const subtotal = items.reduce((sum, item) => sum + item.final_price, 0);
  
  // Extract buyer state from address (default to Telangana if cannot detect)
  const sellerState = 'Telangana';
  const buyerAddressFromNotes = lead.notes || null;
  let buyerState = sellerState; // Default to same state
  
  if (buyerAddressFromNotes) {
    const addressUpper = buyerAddressFromNotes.toUpperCase();
    // Common Indian states to check
    const states = [
      'ANDHRA PRADESH', 'AP', 'KARNATAKA', 'TAMIL NADU', 'MAHARASHTRA',
      'KERALA', 'ODISHA', 'CHHATTISGARH', 'WEST BENGAL', 'DELHI',
      'RAJASTHAN', 'GUJARAT', 'MADHYA PRADESH', 'UTTAR PRADESH', 'UTTARAKHAND',
      'PUNJAB', 'HARYANA', 'HIMACHAL PRADESH', 'JAMMU AND KASHMIR'
    ];
    
    // Check if address contains any state name
    for (const state of states) {
      if (addressUpper.includes(state)) {
        buyerState = state;
        break;
      }
    }
    
    // Check specifically for Telangana
    if (addressUpper.includes('TELANGANA') || addressUpper.includes('HYDERABAD')) {
      buyerState = 'Telangana';
    }
  }
  
  // Calculate taxes based on state
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let taxType: 'cgst_sgst' | 'igst' = 'cgst_sgst';
  
  if (buyerState === sellerState || buyerState === 'Telangana') {
    // Same state: CGST + SGST (9% each = 18% total)
    cgst = Math.round(subtotal * INVOICE_CONFIG.cgstRate);
    sgst = Math.round(subtotal * INVOICE_CONFIG.sgstRate);
    igst = 0;
    taxType = 'cgst_sgst';
  } else {
    // Different state: IGST (18%)
    cgst = 0;
    sgst = 0;
    igst = Math.round(subtotal * 0.18);
    taxType = 'igst';
  }
  
  const grandTotal = subtotal + cgst + sgst + igst;
  
  // Calculate total payments made so far
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = transaction.total_amount - totalPaid;
  
  // Build description to match template format: "STALL 3x3 Metres Octonorm - Booking Services"
  const serviceItems = items.filter(item => item.item_type === 'service');
  const stallSizeDisplay = INVOICE_CONFIG.stallSize.replace('×', 'x').replace('×', 'x').toUpperCase();
  const servicesText = serviceItems.length > 0 
    ? serviceItems.map(item => item.item_name).join(', ')
    : 'Booking Services';
  
  const description = `STALL ${stallSizeDisplay} Metres Octonorm - ${servicesText}`;
  
  // Format invoice date (payment date) to DD-MM-YYYY
  const paymentDate = new Date(payment.payment_date);
  const invoiceDate = paymentDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).split('/').join('-');
  
  return {
    invoiceNumber: (payment as any).invoice_number || `${INVOICE_CONFIG.invoicePrefix}XXX`, // Will be set later
    invoiceDate,
    companyName: COMPANY_CONFIG.name,
    companyAddress: COMPANY_CONFIG.address,
    companyGstNo: COMPANY_CONFIG.gstNo,
    buyerName: lead.name,
    buyerCompany: lead.company,
    buyerAddress: buyerAddressFromNotes,
    buyerGstNo: null, // Not stored in Lead table yet
    buyerEmail: lead.email || null,
    buyerState: buyerState,
    stallNumber,
    description,
    hsnCode: INVOICE_CONFIG.hsnCode,
    quantity: 1,
    rate: subtotal,
    amount: subtotal,
    cgst,
    sgst,
    igst,
    grandTotal,
    taxType,
    amountPaid: payment.amount,
    balanceDue: Math.max(0, balanceDue),
    amountInWords: numberToWords(grandTotal), // numberToWords already includes "INR" prefix
    bankDetails: COMPANY_CONFIG.bankDetails,
    footerText: 'For M/s Catalyst Connect',
  };
}
