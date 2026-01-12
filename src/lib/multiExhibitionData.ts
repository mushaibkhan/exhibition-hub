/**
 * Multi-Exhibition Mock Data Generator
 * Creates DISTINCTLY DIFFERENT isolated datasets for each exhibition
 * Each exhibition has unique layouts, lead names, transaction numbers, and totals
 */

import { Stall, Lead, Service, Transaction, TransactionItem, Payment, Account, StallStatus, LeadStatus, PaymentStatus, ServiceCategory } from '@/types/database';
import { ServiceAllocation } from '@/lib/mockData';

// Exhibition-specific configurations for VISIBLE differences
const EXHIBITION_CONFIGS = {
  'kings-crown-business': {
    stallPrefix1: 'KB',
    stallPrefix2: 'KBF',
    floor1Count: 42,
    floor2Count: 28,
    baseRent: 25000,
    txnPrefix: 'KC-BIZ',
    leadOffset: 0,
    soldPercentage: 0.35,
    partialPercentage: 0.15,
    reservedPercentage: 0.1,
  },
  'kings-crown-education': {
    stallPrefix1: 'KE',
    stallPrefix2: 'KEF',
    floor1Count: 36,
    floor2Count: 24,
    baseRent: 18000,
    txnPrefix: 'KC-EDU',
    leadOffset: 100,
    soldPercentage: 0.25,
    partialPercentage: 0.2,
    reservedPercentage: 0.15,
  },
  'charminar-business': {
    stallPrefix1: 'CB',
    stallPrefix2: 'CBF',
    floor1Count: 54,
    floor2Count: 36,
    baseRent: 35000,
    txnPrefix: 'CHAR',
    leadOffset: 200,
    soldPercentage: 0.45,
    partialPercentage: 0.1,
    reservedPercentage: 0.05,
  },
};

// Exhibition-specific lead data - completely different people per exhibition
const EXHIBITION_LEADS = {
  'kings-crown-business': [
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
  ],
  'kings-crown-education': [
    { name: 'Dr. Suresh Reddy', company: 'Hyderabad University', email: 'suresh@hyd-uni.edu' },
    { name: 'Prof. Lakshmi Devi', company: 'IIT Hyderabad', email: 'lakshmi@iith.ac.in' },
    { name: 'Ramesh Babu', company: 'Narayana Colleges', email: 'ramesh@narayana.edu' },
    { name: 'Swetha Rao', company: 'BITS Pilani Hyd', email: 'swetha@bits-hyd.ac.in' },
    { name: 'Venkat Rao', company: 'IIIT Hyderabad', email: 'venkat@iiith.ac.in' },
    { name: 'Padma Kumari', company: 'Osmania University', email: 'padma@osmania.ac.in' },
    { name: 'Ajay Khanna', company: 'JNTU Hyderabad', email: 'ajay@jntuh.ac.in' },
    { name: 'Sirisha Reddy', company: 'ISB Hyderabad', email: 'sirisha@isb.edu' },
    { name: 'Mohan Das', company: 'ICFAI Business School', email: 'mohan@ibsindia.org' },
    { name: 'Bhavani Shankar', company: 'Gitam University', email: 'bhavani@gitam.edu' },
    { name: 'Ravi Teja', company: 'Mahindra University', email: 'ravi@mahindrauniversity.edu.in' },
    { name: 'Anjali Menon', company: 'Woxsen University', email: 'anjali@woxsen.edu.in' },
  ],
  'charminar-business': [
    { name: 'Mohammed Khaleel', company: 'Pearl Trading Co', email: 'khaleel@pearltrading.com' },
    { name: 'Fatima Begum', company: 'Nizam Textiles', email: 'fatima@nizamtextiles.in' },
    { name: 'Abdul Kareem', company: 'Charminar Jewels', email: 'kareem@charminarjewels.com' },
    { name: 'Ayesha Khan', company: 'Heritage Crafts', email: 'ayesha@heritagecrafts.in' },
    { name: 'Syed Hussain', company: 'Deccan Exports', email: 'hussain@deccanexports.com' },
    { name: 'Zainab Sultana', company: 'Irani Cafe Chain', email: 'zainab@iranicafe.in' },
    { name: 'Imran Ahmed', company: 'Old City Electronics', email: 'imran@oldcityelec.com' },
    { name: 'Nazia Parveen', company: 'Bidri Art House', email: 'nazia@bidriart.in' },
    { name: 'Rashid Ali', company: 'Hyderabadi Biryani Inc', email: 'rashid@hydbiryani.com' },
    { name: 'Shabana Azmi', company: 'Lac Bangles Co', email: 'shabana@lacbangles.in' },
    { name: 'Feroz Khan', company: 'Attar Perfumes', email: 'feroz@attarperfumes.com' },
    { name: 'Rukhsar Begum', company: 'Kalamkari Arts', email: 'rukhsar@kalamkari.in' },
    { name: 'Naseer Ahmed', company: 'Gulzar Flowers', email: 'naseer@gulzarflowers.com' },
    { name: 'Meher Jahan', company: 'Silver Filigree', email: 'meher@silverfiligree.in' },
    { name: 'Saleem Baig', company: 'Antique Collections', email: 'saleem@antiquecollections.com' },
    { name: 'Tahira Sultana', company: 'Mughal Miniatures', email: 'tahira@mughalminiatures.in' },
    { name: 'Wajid Ali', company: 'Dates & Dry Fruits', email: 'wajid@datesndryfruits.com' },
    { name: 'Nazreen Fatima', company: 'Embroidery Works', email: 'nazreen@embroideryworks.in' },
  ],
};

// Generate unique IDs prefixed by exhibition
const genId = (exhibitionId: string, type: string, idx: number) => `${exhibitionId}_${type}_${idx}`;

// Generate stall positions for a floor layout with exhibition-specific prefixes
const generateFloorStalls = (
  exhibitionId: string, 
  floor: number, 
  prefix: string, 
  count: number, 
  baseRent: number
) => {
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

  const cols = 10;
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    // Deterministic variety in stall sizes based on position
    const isPremium = (i % 12 === 0);
    const isLarge = (i % 7 === 0) && !isPremium;
    
    stalls.push({
      stall_number: `${prefix}${String(i + 1).padStart(2, '0')}`,
      size: isPremium ? '6x6' : isLarge ? '3x6' : '3x3',
      zone: `Floor ${floor}`,
      position_x: col + (col >= 5 ? 2 : 0), // Gap in middle for pathway
      position_y: row,
      width: isPremium ? 2 : 1,
      height: isPremium ? 2 : isLarge ? 2 : 1,
      base_rent: Math.round(isPremium ? baseRent * 3 : isLarge ? baseRent * 1.8 : baseRent),
    });
  }

  return stalls;
};

// Generate leads for an exhibition
const generateLeads = (exhibitionId: string): Lead[] => {
  const config = EXHIBITION_CONFIGS[exhibitionId as keyof typeof EXHIBITION_CONFIGS];
  const leadData = EXHIBITION_LEADS[exhibitionId as keyof typeof EXHIBITION_LEADS] || EXHIBITION_LEADS['kings-crown-business'];
  
  const statuses: LeadStatus[] = ['new', 'follow_up', 'interested', 'not_interested', 'converted'];
  
  return leadData.map((c, idx) => ({
    id: genId(exhibitionId, 'lead', idx + 1),
    name: c.name,
    phone: `9${String(8700000000 + config.leadOffset + idx)}`,
    email: c.email,
    company: c.company,
    status: statuses[idx % 5],
    interested_size: idx % 3 === 0 ? '6x6' : '3x3',
    interested_zone: `Floor ${(idx % 2) + 1}`,
    notes: null,
    created_by: null,
    created_at: new Date(2024, 0, 1 + idx).toISOString(),
    updated_at: new Date(2024, 0, 5 + idx).toISOString(),
  }));
};

// Generate services for an exhibition with exhibition-specific pricing
const generateServices = (exhibitionId: string): Service[] => {
  const config = EXHIBITION_CONFIGS[exhibitionId as keyof typeof EXHIBITION_CONFIGS];
  const priceMultiplier = config.baseRent / 25000; // Relative to base
  
  const serviceTemplates = [
    { name: 'TV Display (42")', category: 'add_on' as ServiceCategory, price: 6000, quantity: 25 },
    { name: 'Extra Power Outlet', category: 'add_on' as ServiceCategory, price: 2500, quantity: 60 },
    { name: 'Signboard Standard', category: 'signboard' as ServiceCategory, price: 10000, quantity: 35 },
    { name: 'Signboard Premium LED', category: 'signboard' as ServiceCategory, price: 20000, quantity: 18 },
    { name: 'Food Court Space', category: 'food_court' as ServiceCategory, price: 45000, quantity: 12 },
    { name: 'Title Sponsor Package', category: 'sponsor' as ServiceCategory, price: 600000, quantity: 1 },
    { name: 'Gold Sponsor Package', category: 'sponsor' as ServiceCategory, price: 300000, quantity: 3 },
    { name: 'Silver Sponsor Package', category: 'sponsor' as ServiceCategory, price: 150000, quantity: 5 },
    { name: 'High-Speed WiFi', category: 'add_on' as ServiceCategory, price: 4000, quantity: 80 },
    { name: 'Premium Branding Kit', category: 'add_on' as ServiceCategory, price: 30000, quantity: 25 },
  ];

  return serviceTemplates.map((s, idx) => ({
    id: genId(exhibitionId, 'service', idx + 1),
    name: s.name,
    category: s.category,
    price: Math.round(s.price * priceMultiplier),
    quantity: s.quantity,
    sold_quantity: Math.floor(s.quantity * config.soldPercentage * 0.5),
    is_unlimited: false,
    description: `${s.name} service for exhibition booths`,
    notes: null,
    created_at: new Date(2024, 0, 1).toISOString(),
    updated_at: new Date(2024, 0, 1).toISOString(),
  }));
};

// Generate accounts for an exhibition
const generateAccounts = (exhibitionId: string): Account[] => {
  const config = EXHIBITION_CONFIGS[exhibitionId as keyof typeof EXHIBITION_CONFIGS];
  
  return [
    {
      id: genId(exhibitionId, 'account', 1),
      name: `${config.txnPrefix} Main Account`,
      bank_details: 'HDFC Bank, Hyderabad Branch',
      upi_details: `${exhibitionId}@ybl`,
      is_active: true,
      notes: 'Primary collection account',
      created_at: new Date(2024, 0, 1).toISOString(),
      updated_at: new Date(2024, 0, 1).toISOString(),
    },
    {
      id: genId(exhibitionId, 'account', 2),
      name: 'Cash Collection Counter',
      bank_details: null,
      upi_details: null,
      is_active: true,
      notes: 'On-site cash payments only',
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

const generateStallsWithDeterministicStatus = (exhibitionId: string): Stall[] => {
  const config = EXHIBITION_CONFIGS[exhibitionId as keyof typeof EXHIBITION_CONFIGS];
  
  const floor1Stalls = generateFloorStalls(
    exhibitionId, 1, config.stallPrefix1, config.floor1Count, config.baseRent
  );
  const floor2Stalls = generateFloorStalls(
    exhibitionId, 2, config.stallPrefix2, config.floor2Count, Math.round(config.baseRent * 1.25)
  );
  const allPositions = [...floor1Stalls, ...floor2Stalls];

  const totalStalls = allPositions.length;
  const soldCount = Math.floor(totalStalls * config.soldPercentage);
  const partialCount = Math.floor(totalStalls * config.partialPercentage);
  const reservedCount = Math.floor(totalStalls * config.reservedPercentage);
  const blockedCount = Math.floor(totalStalls * 0.05);
  
  return allPositions.map((pos, idx) => {
    // Deterministic status assignment based on index
    let status: StallStatus = 'available';
    if (idx < soldCount) {
      status = 'sold';
    } else if (idx < soldCount + partialCount) {
      status = 'pending';
    } else if (idx < soldCount + partialCount + reservedCount) {
      status = 'reserved';
    } else if (idx >= totalStalls - blockedCount) {
      status = 'blocked';
    }

    return {
      id: genId(exhibitionId, 'stall', idx + 1),
      stall_number: pos.stall_number,
      size: pos.size,
      zone: pos.zone,
      base_rent: pos.base_rent,
      status,
      notes: status === 'blocked' ? 'Reserved for organizer setup' : null,
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
  const config = EXHIBITION_CONFIGS[exhibitionId as keyof typeof EXHIBITION_CONFIGS];
  const transactions: Transaction[] = [];
  const transactionItems: TransactionItem[] = [];
  const payments: Payment[] = [];
  
  // Clone stalls and leads for updating
  const updatedStalls = stalls.map(s => ({ ...s }));
  const updatedLeads = leads.map(l => ({ ...l }));

  // Create transactions for sold/pending/reserved stalls
  const transactableStalls = updatedStalls.filter(s => ['sold', 'pending', 'reserved'].includes(s.status));
  let leadIdx = 0;
  
  transactableStalls.forEach((stall, idx) => {
    // Cycle through leads
    const lead = updatedLeads[leadIdx % updatedLeads.length];
    leadIdx++;
    
    const txnId = genId(exhibitionId, 'txn', idx + 1);
    const txnNumber = `${config.txnPrefix}-${String(idx + 1).padStart(4, '0')}`;
    
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
      created_at: new Date(2024, 0, 10 + (idx % 20)).toISOString(),
      updated_at: new Date(2024, 0, 15 + (idx % 15)).toISOString(),
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
      created_at: new Date(2024, 0, 10 + (idx % 20)).toISOString(),
    });

    // Create payment if any amount paid
    if (amountPaid > 0) {
      payments.push({
        id: genId(exhibitionId, 'payment', idx + 1),
        transaction_id: txnId,
        amount: amountPaid,
        payment_mode: ['cash', 'upi', 'bank'][idx % 3] as 'cash' | 'upi' | 'bank',
        payment_date: new Date(2024, 0, 12 + (idx % 18)).toISOString(),
        account_id: null,
        reference_id: amountPaid > 10000 ? `${config.txnPrefix}-REF-${String(idx + 1).padStart(5, '0')}` : null,
        notes: null,
        recorded_by: null,
        created_at: new Date(2024, 0, 12 + (idx % 18)).toISOString(),
      });
    }

    // Update stall with lead_id
    const stallIndex = updatedStalls.findIndex(s => s.id === stall.id);
    if (stallIndex !== -1) {
      updatedStalls[stallIndex] = { ...updatedStalls[stallIndex], lead_id: lead.id };
    }

    // Update lead status to converted
    const leadIndex = updatedLeads.findIndex(l => l.id === lead.id);
    if (leadIndex !== -1 && updatedLeads[leadIndex].status !== 'converted') {
      updatedLeads[leadIndex] = { ...updatedLeads[leadIndex], status: 'converted' };
    }
  });

  return { transactions, transactionItems, payments, updatedStalls, updatedLeads };
};

export const generateExhibitionData = (exhibitionId: string): ExhibitionDataset => {
  const stalls = generateStallsWithDeterministicStatus(exhibitionId);
  const leads = generateLeads(exhibitionId);
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

// Pre-generate all exhibition datasets - these are STATIC and DIFFERENT for each exhibition
export const EXHIBITION_DATASETS: Record<string, ExhibitionDataset> = {
  'kings-crown-business': generateExhibitionData('kings-crown-business'),
  'kings-crown-education': generateExhibitionData('kings-crown-education'),
  'charminar-business': generateExhibitionData('charminar-business'),
};

// Debug logging to verify datasets are different
console.log('[ExhibitionData] Dataset stats:', {
  'kings-crown-business': {
    stalls: EXHIBITION_DATASETS['kings-crown-business'].stalls.length,
    leads: EXHIBITION_DATASETS['kings-crown-business'].leads.length,
    transactions: EXHIBITION_DATASETS['kings-crown-business'].transactions.length,
  },
  'kings-crown-education': {
    stalls: EXHIBITION_DATASETS['kings-crown-education'].stalls.length,
    leads: EXHIBITION_DATASETS['kings-crown-education'].leads.length,
    transactions: EXHIBITION_DATASETS['kings-crown-education'].transactions.length,
  },
  'charminar-business': {
    stalls: EXHIBITION_DATASETS['charminar-business'].stalls.length,
    leads: EXHIBITION_DATASETS['charminar-business'].leads.length,
    transactions: EXHIBITION_DATASETS['charminar-business'].transactions.length,
  },
});
