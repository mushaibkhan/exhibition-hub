/**
 * Multi-Exhibition Mock Data Generator
 * Creates isolated datasets for each exhibition
 */

import { Stall, Lead, Service, Transaction, TransactionItem, Payment, Account, StallStatus, LeadStatus, PaymentStatus, ServiceCategory } from '@/types/database';
import { ServiceAllocation } from '@/lib/mockData';

// Generate unique IDs prefixed by exhibition
const genId = (exhibitionId: string, type: string, idx: number) => `${exhibitionId}-${type}-${idx}`;

// Generate stall positions for a floor layout
const generateFloorStalls = (exhibitionId: string, floor: number, prefix: string, count: number, baseRent: number) => {
  const stalls: Array<{
    stall_number: string;
    size: string;
    zone: string;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    base_rent: number;
  }> = [];

  const cols = 12;
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    // Add some variety in stall sizes
    const isPremium = (i % 15 === 0);
    const isLarge = (i % 8 === 0) && !isPremium;
    
    stalls.push({
      stall_number: `${prefix}${i + 1}`,
      size: isPremium ? '6x6' : isLarge ? '3x6' : '3x3',
      zone: `Floor ${floor}`,
      position_x: col + (col >= 6 ? 2 : 0), // Gap in middle
      position_y: row,
      width: isPremium ? 2 : 1,
      height: isPremium ? 2 : isLarge ? 2 : 1,
      base_rent: isPremium ? baseRent * 3 : isLarge ? baseRent * 1.8 : baseRent,
    });
  }

  return stalls;
};

// Generate leads for an exhibition
const generateLeads = (exhibitionId: string): Lead[] => {
  const companies = [
    { name: 'Rajesh Kumar', company: 'Tech Solutions Pvt Ltd', email: 'rajesh@techsolutions.com' },
    { name: 'Priya Sharma', company: 'GreenTech Industries', email: 'priya@greentech.in' },
    { name: 'Amit Patel', company: 'Innovate IO', email: 'amit@innovate.io' },
    { name: 'Sunita Reddy', company: 'CraftWorks', email: 'sunita@craftworks.com' },
    { name: 'Vikram Singh', company: 'MegaCorp Industries', email: 'vikram@megacorp.in' },
    { name: 'Ananya Das', company: 'Fashion Hub', email: 'ananya@fashionhub.com' },
    { name: 'Deepak Joshi', company: 'SoftTech Solutions', email: 'deepak@softtech.com' },
    { name: 'Meera Nair', company: 'HealthPlus', email: 'meera@healthplus.in' },
    { name: 'Arjun Mehta', company: 'AutoZone Motors', email: 'arjun@autozone.com' },
    { name: 'Kavita Gupta', company: 'JewelCraft', email: 'kavita@jewelcraft.com' },
    { name: 'Rahul Verma', company: 'Digital Dreams', email: 'rahul@digitaldreams.com' },
    { name: 'Neha Kapoor', company: 'EventPro', email: 'neha@eventpro.in' },
    { name: 'Sanjay Agarwal', company: 'PrintMax', email: 'sanjay@printmax.com' },
    { name: 'Divya Iyer', company: 'CloudNine Tech', email: 'divya@cloudnine.io' },
    { name: 'Karthik Rajan', company: 'SpiceTrade', email: 'karthik@spicetrade.com' },
    { name: 'Lakshmi Venkat', company: 'Silk Weaves', email: 'lakshmi@silkweaves.in' },
    { name: 'Manish Tiwari', company: 'PowerTools Inc', email: 'manish@powertools.com' },
    { name: 'Pooja Desai', company: 'HomeDecor Hub', email: 'pooja@homedecorhub.com' },
    { name: 'Ravi Shankar', company: 'EduLearn', email: 'ravi@edulearn.in' },
    { name: 'Sneha Pillai', company: 'Wellness World', email: 'sneha@wellnessworld.com' },
  ];

  const statuses: LeadStatus[] = ['new', 'follow_up', 'interested', 'not_interested', 'converted'];
  
  return companies.map((c, idx) => ({
    id: genId(exhibitionId, 'lead', idx + 1),
    name: c.name,
    phone: `98765${String(43210 + idx).padStart(5, '0')}`,
    email: c.email,
    company: c.company,
    status: statuses[idx % 5],
    interested_size: idx % 3 === 0 ? '6x6' : '3x3',
    interested_zone: `Floor ${(idx % 2) + 1}`,
    notes: `Lead for ${exhibitionId}`,
    created_by: null,
    created_at: new Date(2024, 0, 1 + idx).toISOString(),
    updated_at: new Date(2024, 0, 5 + idx).toISOString(),
  }));
};

// Generate services for an exhibition
const generateServices = (exhibitionId: string): Service[] => {
  const serviceTemplates = [
    { name: 'TV Display (32")', category: 'add_on' as ServiceCategory, price: 5000, quantity: 20 },
    { name: 'Extra Power Outlet', category: 'add_on' as ServiceCategory, price: 2000, quantity: 50 },
    { name: 'Signboard Standard', category: 'signboard' as ServiceCategory, price: 8000, quantity: 30 },
    { name: 'Signboard Premium', category: 'signboard' as ServiceCategory, price: 15000, quantity: 15 },
    { name: 'Food Court Stall', category: 'food_court' as ServiceCategory, price: 35000, quantity: 10 },
    { name: 'Title Sponsor', category: 'sponsor' as ServiceCategory, price: 500000, quantity: 1 },
    { name: 'Gold Sponsor', category: 'sponsor' as ServiceCategory, price: 250000, quantity: 3 },
    { name: 'Silver Sponsor', category: 'sponsor' as ServiceCategory, price: 100000, quantity: 5 },
    { name: 'WiFi Access', category: 'add_on' as ServiceCategory, price: 3000, quantity: 100 },
    { name: 'Branding Package', category: 'add_on' as ServiceCategory, price: 25000, quantity: 20 },
  ];

  return serviceTemplates.map((s, idx) => ({
    id: genId(exhibitionId, 'service', idx + 1),
    name: s.name,
    category: s.category,
    price: s.price,
    quantity: s.quantity,
    sold_quantity: Math.floor(s.quantity * Math.random() * 0.3),
    is_unlimited: false,
    description: `${s.name} for exhibition`,
    notes: null,
    created_at: new Date(2024, 0, 1).toISOString(),
    updated_at: new Date(2024, 0, 1).toISOString(),
  }));
};

// Generate accounts for an exhibition
const generateAccounts = (exhibitionId: string): Account[] => {
  return [
    {
      id: genId(exhibitionId, 'account', 1),
      name: 'Main Exhibition Account',
      bank_details: 'HDFC Bank, Account: XXXX1234',
      upi_details: 'exhibition@upi',
      is_active: true,
      notes: null,
      created_at: new Date(2024, 0, 1).toISOString(),
      updated_at: new Date(2024, 0, 1).toISOString(),
    },
    {
      id: genId(exhibitionId, 'account', 2),
      name: 'Cash Collection',
      bank_details: null,
      upi_details: null,
      is_active: true,
      notes: 'For cash payments only',
      created_at: new Date(2024, 0, 1).toISOString(),
      updated_at: new Date(2024, 0, 1).toISOString(),
    },
  ];
};

// Generate complete exhibition dataset
export interface ExhibitionDataset {
  stalls: Stall[];
  leads: Lead[];
  services: Service[];
  transactions: Transaction[];
  transactionItems: TransactionItem[];
  payments: Payment[];
  accounts: Account[];
  serviceAllocations: ServiceAllocation[];
}

const generateStallsWithStatus = (exhibitionId: string, baseRent: number): Stall[] => {
  const floor1Stalls = generateFloorStalls(exhibitionId, 1, 'G', 48, baseRent);
  const floor2Stalls = generateFloorStalls(exhibitionId, 2, 'F', 36, baseRent * 1.2);
  const allPositions = [...floor1Stalls, ...floor2Stalls];

  const statuses: StallStatus[] = ['available', 'reserved', 'sold', 'pending', 'blocked'];
  
  return allPositions.map((pos, idx) => {
    // Randomize status with weighted distribution
    const rand = Math.random();
    let status: StallStatus = 'available';
    if (rand < 0.4) status = 'available';
    else if (rand < 0.55) status = 'sold';
    else if (rand < 0.65) status = 'pending';
    else if (rand < 0.75) status = 'reserved';
    else if (rand < 0.8) status = 'blocked';

    return {
      id: genId(exhibitionId, 'stall', idx + 1),
      stall_number: pos.stall_number,
      size: pos.size,
      zone: pos.zone,
      base_rent: pos.base_rent,
      status,
      notes: status === 'blocked' ? 'Reserved for organizer' : null,
      position_x: pos.position_x,
      position_y: pos.position_y,
      width: pos.width,
      height: pos.height,
      created_at: new Date(2024, 0, 1).toISOString(),
      updated_at: new Date(2024, 0, 15).toISOString(),
      lead_id: null,
    };
  });
};

const generateTransactionsAndPayments = (
  exhibitionId: string, 
  stalls: Stall[], 
  leads: Lead[]
): { 
  transactions: Transaction[]; 
  transactionItems: TransactionItem[]; 
  payments: Payment[];
  updatedStalls: Stall[];
  updatedLeads: Lead[];
} => {
  const transactions: Transaction[] = [];
  const transactionItems: TransactionItem[] = [];
  const payments: Payment[] = [];
  
  // Clone stalls and leads for updating
  const updatedStalls = [...stalls];
  const updatedLeads = [...leads];

  // Create transactions for sold/pending/reserved stalls
  const transactableStalls = updatedStalls.filter(s => ['sold', 'pending', 'reserved'].includes(s.status));
  const convertedLeads = updatedLeads.filter(l => l.status === 'converted' || l.status === 'interested');
  
  transactableStalls.forEach((stall, idx) => {
    if (idx >= convertedLeads.length) return;
    
    const lead = convertedLeads[idx];
    const txnId = genId(exhibitionId, 'txn', idx + 1);
    const txnNumber = `TXN-${exhibitionId.toUpperCase().substring(0, 4)}-${String(idx + 1).padStart(3, '0')}`;
    
    // Determine payment status based on stall status
    let paymentStatus: PaymentStatus = 'unpaid';
    let amountPaid = 0;
    
    if (stall.status === 'sold') {
      paymentStatus = 'paid';
      amountPaid = stall.base_rent;
    } else if (stall.status === 'pending') {
      paymentStatus = 'partial';
      amountPaid = Math.floor(stall.base_rent * 0.5);
    }

    // Create transaction
    transactions.push({
      id: txnId,
      transaction_number: txnNumber,
      lead_id: lead.id,
      total_amount: stall.base_rent,
      amount_paid: amountPaid,
      payment_status: paymentStatus,
      notes: null,
      created_by: null,
      created_at: new Date(2024, 0, 10 + idx).toISOString(),
      updated_at: new Date(2024, 0, 15 + idx).toISOString(),
    });

    // Create transaction item
    transactionItems.push({
      id: genId(exhibitionId, 'item', idx + 1),
      transaction_id: txnId,
      item_type: 'stall',
      item_name: `Stall ${stall.stall_number}`,
      stall_id: stall.id,
      service_id: null,
      size: stall.size,
      base_price: stall.base_rent,
      addon_price: 0,
      final_price: stall.base_rent,
      created_at: new Date(2024, 0, 10 + idx).toISOString(),
    });

    // Create payment if any amount paid
    if (amountPaid > 0) {
      payments.push({
        id: genId(exhibitionId, 'payment', idx + 1),
        transaction_id: txnId,
        amount: amountPaid,
        payment_mode: ['cash', 'upi', 'bank'][idx % 3] as 'cash' | 'upi' | 'bank',
        payment_date: new Date(2024, 0, 12 + idx).toISOString(),
        account_id: null,
        reference_id: amountPaid > 10000 ? `REF${String(idx + 1).padStart(6, '0')}` : null,
        notes: null,
        recorded_by: null,
        created_at: new Date(2024, 0, 12 + idx).toISOString(),
      });
    }

    // Update stall with lead_id
    const stallIndex = updatedStalls.findIndex(s => s.id === stall.id);
    if (stallIndex !== -1) {
      updatedStalls[stallIndex] = { ...updatedStalls[stallIndex], lead_id: lead.id };
    }

    // Update lead status
    const leadIndex = updatedLeads.findIndex(l => l.id === lead.id);
    if (leadIndex !== -1) {
      updatedLeads[leadIndex] = { ...updatedLeads[leadIndex], status: 'converted' };
    }
  });

  return { transactions, transactionItems, payments, updatedStalls, updatedLeads };
};

export const generateExhibitionData = (exhibitionId: string): ExhibitionDataset => {
  // Different base rents for different exhibitions
  const baseRents: Record<string, number> = {
    'kings-crown-business': 25000,
    'kings-crown-education': 20000,
    'charminar-business': 30000,
  };
  
  const baseRent = baseRents[exhibitionId] || 25000;
  
  let stalls = generateStallsWithStatus(exhibitionId, baseRent);
  let leads = generateLeads(exhibitionId);
  const services = generateServices(exhibitionId);
  const accounts = generateAccounts(exhibitionId);

  const { transactions, transactionItems, payments, updatedStalls, updatedLeads } = 
    generateTransactionsAndPayments(exhibitionId, stalls, leads);

  return {
    stalls: updatedStalls,
    leads: updatedLeads,
    services,
    transactions,
    transactionItems,
    payments,
    accounts,
    serviceAllocations: [],
  };
};

// Pre-generate all exhibition datasets
export const EXHIBITION_DATASETS: Record<string, ExhibitionDataset> = {
  'kings-crown-business': generateExhibitionData('kings-crown-business'),
  'kings-crown-education': generateExhibitionData('kings-crown-education'),
  'charminar-business': generateExhibitionData('charminar-business'),
};
