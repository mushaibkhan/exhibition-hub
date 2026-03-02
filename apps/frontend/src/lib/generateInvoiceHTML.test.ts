import { describe, it, expect } from 'vitest';
import { generateInvoiceHTML } from './generateInvoiceHTML';
import { InvoiceData } from '@/types/invoice';

describe('generateInvoiceHTML', () => {
  const baseInvoiceData: InvoiceData = {
    invoiceNumber: 'INV-2023-001',
    invoiceDate: '01-11-2023',
    companyName: 'Acme Corp',
    companyAddress: '123 Acme St, Tech City',
    companyGstNo: '27AADCB2230M1Z2',
    buyerName: 'John Doe',
    buyerCompany: 'Doe Enterprises',
    buyerAddress: '456 Business Rd, Market Town',
    buyerGstNo: '27XYZAB1234C1Z5',
    buyerEmail: 'john@doe.com',
    buyerState: 'Maharashtra',
    stallNumber: 'A1',
    description: 'Premium Stall Booking',
    hsnCode: '9983',
    quantity: 1,
    rate: 10000,
    amount: 10000,
    isGst: true,
    cgst: 900,
    sgst: 900,
    igst: 0,
    grandTotal: 11800,
    taxType: 'cgst_sgst',
    discountAmount: 0,
    amountPaid: 0,
    balanceDue: 11800,
    amountInWords: 'Eleven Thousand Eight Hundred Rupees Only',
    bankDetails: {
      accountName: 'Acme Corp',
      accountNumber: '1234567890',
      bank: 'Global Bank',
      ifsc: 'GB1234567',
      branch: 'Tech City Branch',
    },
    footerText: 'For: M/S. Acme Corp',
  };

  it('generates a TAX INVOICE with CGST and SGST', () => {
    const html = generateInvoiceHTML(baseInvoiceData);

    // Document title and page title
    expect(html).toContain('<h1>TAX INVOICE</h1>');
    expect(html).toContain('<title>Tax Invoice - INV-2023-001</title>');

    // Basic details
    expect(html).toContain('INV-2023-001');
    expect(html).toContain('Acme Corp');
    expect(html).toContain('John Doe');

    // Tax rows
    expect(html).toContain('Add: CGST @ 9%');
    expect(html).toContain('₹900.00');
    expect(html).toContain('Add: SGST @ 9%');
    expect(html).toContain('Grand Total (incl. GST):');
    expect(html).toContain('₹11,800.00');

    // Make sure IGST is not there
    expect(html).not.toContain('Add: IGST @ 18%');

    // Make sure discount is not there
    expect(html).not.toContain('Less: Discount:');
  });

  it('generates a TAX INVOICE with IGST', () => {
    const invoiceData = {
      ...baseInvoiceData,
      taxType: 'igst' as const,
      cgst: 0,
      sgst: 0,
      igst: 1800,
      grandTotal: 11800,
    };

    const html = generateInvoiceHTML(invoiceData);

    // Document title
    expect(html).toContain('<h1>TAX INVOICE</h1>');

    // Tax rows
    expect(html).toContain('Add: IGST @ 18%');
    expect(html).toContain('₹1,800.00');

    // Make sure CGST/SGST are not there
    expect(html).not.toContain('Add: CGST @ 9%');
    expect(html).not.toContain('Add: SGST @ 9%');
  });

  it('generates a BILL OF SUPPLY without GST', () => {
    const invoiceData = {
      ...baseInvoiceData,
      isGst: false,
      cgst: 0,
      sgst: 0,
      igst: 0,
      grandTotal: 10000,
      amountInWords: 'Ten Thousand Rupees Only',
    };

    const html = generateInvoiceHTML(invoiceData);

    // Document title and page title
    expect(html).toContain('<h1>BILL OF SUPPLY</h1>');
    expect(html).toContain('<title>Bill of Supply - INV-2023-001</title>');

    // Tax rows should NOT be present
    expect(html).not.toContain('Add: CGST');
    expect(html).not.toContain('Add: SGST');
    expect(html).not.toContain('Add: IGST');

    // Grand Total text
    expect(html).toContain('Grand Total:');
    expect(html).not.toContain('Grand Total (incl. GST):');
    expect(html).toContain('₹10,000.00');
  });

  it('displays discount when discountAmount is provided', () => {
    const invoiceData = {
      ...baseInvoiceData,
      discountAmount: 500,
      amount: 9500, // 10000 - 500
      cgst: 855,
      sgst: 855,
      grandTotal: 11210,
    };

    const html = generateInvoiceHTML(invoiceData);

    // Discount row
    expect(html).toContain('Less: Discount:');
    expect(html).toContain('-₹500.00');
    expect(html).toContain('₹11,210.00');
  });

  it('does not display buyer company, address, GST, and email if they are null', () => {
    const invoiceData = {
      ...baseInvoiceData,
      buyerCompany: null,
      buyerAddress: null,
      buyerGstNo: null,
      buyerEmail: null,
    };

    const html = generateInvoiceHTML(invoiceData);

    // These should be omitted (we look for the specific strings, but it\'s tricky since they are generic.
    // The previous test passes if John Doe is there, we check if John Doe is present, but others absent).
    expect(html).toContain('John Doe');
    expect(html).not.toContain('Doe Enterprises');
    expect(html).not.toContain('456 Business Rd, Market Town');
    expect(html).not.toContain('27XYZAB1234C1Z5');
    expect(html).not.toContain('john@doe.com');
  });
});
