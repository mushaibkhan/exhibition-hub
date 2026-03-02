// Static company and invoice configuration

export const COMPANY_CONFIG = {
  name: 'CATALYST CONNECT',
  address: '5th Floor, Sri Balaji Complex, GHMC No-8-191/12 &13 Raidurg, Serilingampally, Rangareddy District, Telangana.',
  gstNo: '36AJVPA4764H1ZV',
  bankDetails: {
    accountName: 'CATALYST CONNECT',
    accountNumber: '1265 6190 0000 812',
    bank: 'YES BANK',
    ifsc: 'YESB0001265',
    branch: 'Shaikpet',
  },
};

export const INVOICE_CONFIG = {
  hsnCode: '998596', // Default HSN code for stall rent
  cgstRate: 0.09, // 9%
  sgstRate: 0.09, // 9%
  stallSize: '3×2', // Fixed stall size in meters
  invoicePrefix: 'CC', // Prefix for invoice numbers
};
