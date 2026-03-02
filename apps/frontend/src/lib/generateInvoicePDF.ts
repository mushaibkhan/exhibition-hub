import { InvoiceData } from '@/types/invoice';
import { Transaction, Lead, TransactionItem } from '@/types/database';
import { generateInvoiceHTML } from './generateInvoiceHTML';
import { numberToWords } from './invoiceUtils';
import { COMPANY_CONFIG, INVOICE_CONFIG } from './invoiceConfig';

/**
 * Build invoice data directly from a transaction (for booking confirmation)
 * This is used when auto-generating invoice after booking creation
 */
export function buildBookingInvoiceData(
  transaction: Transaction,
  lead: Lead,
  items: TransactionItem[],
  invoiceNumber: string
): InvoiceData {
  // Find stall item to get stall number
  const stallItem = items.find(item => item.item_type === 'stall' && item.stall_id);
  const stallNumber = stallItem ? stallItem.item_name.replace('Stall ', '') : null;
  
  // Use transaction's subtotal
  const subtotal = transaction.subtotal || items.reduce((sum, item) => sum + item.final_price, 0);
  
  // Build description
  const serviceItems = items.filter(item => item.item_type === 'service');
  const stallSizeDisplay = INVOICE_CONFIG.stallSize.replace('×', 'x').toUpperCase();
  const servicesText = serviceItems.length > 0 
    ? serviceItems.map(item => item.item_name).join(', ')
    : 'Booking Services';
  const description = stallItem 
    ? `STALL ${stallSizeDisplay} Metres Octonorm - ${servicesText}`
    : servicesText;
  
  // Format invoice date (today)
  const today = new Date();
  const invoiceDate = today.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).split('/').join('-');
  
  // GST values from transaction
  const isGst = transaction.is_gst || false;
  const cgst = transaction.cgst_amount || 0;
  const sgst = transaction.sgst_amount || 0;
  
  return {
    invoiceNumber,
    invoiceDate,
    companyName: COMPANY_CONFIG.name,
    companyAddress: COMPANY_CONFIG.address,
    companyGstNo: COMPANY_CONFIG.gstNo,
    buyerName: lead.name,
    buyerCompany: lead.company,
    buyerAddress: lead.notes || null,
    buyerGstNo: null,
    buyerEmail: lead.email || null,
    buyerState: 'Telangana',
    stallNumber,
    description,
    hsnCode: INVOICE_CONFIG.hsnCode,
    quantity: 1,
    rate: subtotal,
    amount: subtotal,
    isGst,
    cgst,
    sgst,
    igst: 0,
    grandTotal: transaction.total_amount,
    taxType: 'cgst_sgst',
    discountAmount: transaction.discount_amount || 0,
    discountType: transaction.discount_type,
    discountValue: transaction.discount_value,
    amountPaid: 0, // No payment yet for booking confirmation
    balanceDue: transaction.total_amount,
    amountInWords: numberToWords(transaction.total_amount),
    bankDetails: COMPANY_CONFIG.bankDetails,
    footerText: 'For M/s Catalyst Connect',
  };
}

/**
 * Download invoice as HTML file (user can print to PDF)
 * Filename: Invoice_<INVOICE_NO>_<BUYER>.html
 */
export function downloadInvoicePDF(invoiceData: InvoiceData, filename?: string): void {
  try {
    const html = generateInvoiceHTML(invoiceData);
    
    // Generate filename: Invoice_<INVOICE_NO>_<BUYER>.html
    if (!filename) {
      const buyerName = (invoiceData.buyerCompany || invoiceData.buyerName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
      filename = `Invoice_${invoiceData.invoiceNumber}_${buyerName}.html`;
    }
    
    // Create blob and download
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
      console.error('[Invoice] Error downloading invoice:', error);
    }
    throw error;
  }
}

/**
 * Print invoice (opens in new window for printing)
 * User can print to PDF using browser print dialog
 */
export function printInvoicePDF(invoiceData: InvoiceData): void {
  try {
    const html = generateInvoiceHTML(invoiceData);
    
    // Open in new window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      throw new Error('Could not open print window. Please allow popups for this site.');
    }
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Invoice] Error printing invoice:', error);
    }
    throw error;
  }
}

/**
 * Open invoice in new window for preview/printing
 */
export function previewInvoice(invoiceData: InvoiceData): void {
  try {
    const html = generateInvoiceHTML(invoiceData);
    
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (!previewWindow) {
      throw new Error('Could not open preview window. Please allow popups for this site.');
    }
    
    previewWindow.document.write(html);
    previewWindow.document.close();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Invoice] Error previewing invoice:', error);
    }
    throw error;
  }
}
