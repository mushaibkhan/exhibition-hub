import { Payment, Transaction, Lead, TransactionItem, Exhibition } from './database';

export interface InvoiceData {
  // Invoice metadata
  invoiceNumber: string;
  invoiceDate: string; // DD-MM-YYYY format
  
  // Company details (seller)
  companyName: string;
  companyAddress: string;
  companyGstNo: string;
  
  // Buyer details
  buyerName: string;
  buyerCompany: string | null;
  buyerAddress: string | null;
  buyerGstNo: string | null;
  buyerEmail: string | null;
  buyerState: string | null; // Buyer's state for tax calculation
  
  // Stall information
  stallNumber: string | null;
  
  // Line items
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  amount: number; // Subtotal before tax
  
  // Tax calculations
  isGst: boolean; // Whether GST is applied (determines Tax Invoice vs Bill of Supply)
  cgst: number;
  sgst: number;
  igst: number; // IGST for interstate transactions
  grandTotal: number;
  taxType: 'cgst_sgst' | 'igst'; // Tax calculation type
  
  // Discount information
  discountAmount?: number;
  discountType?: 'fixed' | 'percentage' | null;
  discountValue?: number | null;
  
  // Payment information
  amountPaid: number; // This payment amount
  balanceDue: number; // Transaction total - all payments
  
  // Additional info
  amountInWords: string;
  
  // Bank details
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bank: string;
    ifsc: string;
    branch: string;
  };
  
  // Footer
  footerText: string; // "For: M/S. Catalyst Connect"
}
