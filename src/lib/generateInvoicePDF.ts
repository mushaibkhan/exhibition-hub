import { InvoiceData } from '@/types/invoice';
import { generateInvoiceHTML } from './generateInvoiceHTML';

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
