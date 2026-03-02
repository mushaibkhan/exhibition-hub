import { Stall, Lead, Service, Transaction, TransactionItem, Payment, Account, StallStatus, LeadStatus, PaymentStatus, PaymentMode, ServiceCategory } from '@/types/database';

// Service allocation type - tracks which services are assigned to which stalls
export interface ServiceAllocation {
  id: string;
  service_id: string;
  stall_id: string;
  quantity: number;
  created_at: string;
}

// Generate stall positions for a realistic floor layout matching the reference images
// Ground Floor (Floor 1) - Based on first reference image
const generateFloor1Stalls = () => {
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

  // Top row - Left side
  for (let i = 1; i <= 6; i++) {
    stalls.push({
      stall_number: `G${i}`,
      size: '3×2',
      zone: 'Floor 1',
      position_x: i - 1,
      position_y: 0,
      width: 1,
      height: 1,
      base_rent: 25000,
    });
  }
  
  // Top row - Right side
  for (let i = 7; i <= 12; i++) {
    stalls.push({
      stall_number: `G${i}`,
      size: '3×2',
      zone: 'Floor 1',
      position_x: i - 1 + 2, // Gap for pathway
      position_y: 0,
      width: 1,
      height: 1,
      base_rent: 25000,
    });
  }

  // Second row - Left side
  for (let i = 13; i <= 16; i++) {
    stalls.push({
      stall_number: `G${i}`,
      size: '3×2',
      zone: 'Floor 1',
      position_x: i - 13,
      position_y: 1,
      width: 1,
      height: 1,
      base_rent: 25000,
    });
  }
  
  // Second row - Premium stalls
  stalls.push({ stall_number: 'G17', size: '3×2', zone: 'Floor 1', position_x: 4, position_y: 1, width: 1, height: 1, base_rent: 25000 });
  
  // Second row - Right side
  for (let i = 18; i <= 21; i++) {
    stalls.push({
      stall_number: `G${i}`,
      size: '3×2',
      zone: 'Floor 1',
      position_x: i - 18 + 10,
      position_y: 1,
      width: 1,
      height: 1,
      base_rent: 25000,
    });
  }

  // Third row - Left side
  for (let i = 22; i <= 25; i++) {
    stalls.push({
      stall_number: `G${i}`,
      size: '3×2',
      zone: 'Floor 1',
      position_x: i - 22,
      position_y: 2,
      width: 1,
      height: 1,
      base_rent: 25000,
    });
  }

  // Third row - Right side
  for (let i = 26; i <= 29; i++) {
    stalls.push({
      stall_number: `G${i}`,
      size: '3×2',
      zone: 'Floor 1',
      position_x: i - 26 + 10,
      position_y: 2,
      width: 1,
      height: 1,
      base_rent: 25000,
    });
  }

  // Fourth row - Left side
  stalls.push({ stall_number: 'G30', size: '3×2', zone: 'Floor 1', position_x: 0, position_y: 3, width: 1, height: 1, base_rent: 25000 });
  stalls.push({ stall_number: 'G31', size: '3×2', zone: 'Floor 1', position_x: 1, position_y: 3, width: 1, height: 1, base_rent: 25000 });
  stalls.push({ stall_number: 'G32', size: '3x3', zone: 'Floor 1', position_x: 2, position_y: 3, width: 1, height: 1, base_rent: 25000 });
  stalls.push({ stall_number: 'G33', size: '3x3', zone: 'Floor 1', position_x: 3, position_y: 3, width: 1, height: 1, base_rent: 25000 });
  
  // Fourth row - Right side
  stalls.push({ stall_number: 'G34', size: '3x3', zone: 'Floor 1', position_x: 10, position_y: 3, width: 1, height: 1, base_rent: 25000 });
  stalls.push({ stall_number: 'G35', size: '3x3', zone: 'Floor 1', position_x: 11, position_y: 3, width: 1, height: 1, base_rent: 25000 });
  stalls.push({ stall_number: 'G36', size: '3×2', zone: 'Floor 1', position_x: 12, position_y: 3, width: 1, height: 1, base_rent: 25000 });
  stalls.push({ stall_number: 'G37', size: '3×2', zone: 'Floor 1', position_x: 13, position_y: 3, width: 1, height: 1, base_rent: 25000 });

  // Fifth row
  stalls.push({ stall_number: 'G38', size: '3x3', zone: 'Floor 1', position_x: 2, position_y: 4, width: 1, height: 1, base_rent: 25000 });
  stalls.push({ stall_number: 'G39', size: '3x3', zone: 'Floor 1', position_x: 3, position_y: 4, width: 1, height: 1, base_rent: 25000 });
  stalls.push({ stall_number: 'G40', size: '3x3', zone: 'Floor 1', position_x: 10, position_y: 4, width: 1, height: 1, base_rent: 25000 });
  stalls.push({ stall_number: 'G41', size: '3x3', zone: 'Floor 1', position_x: 11, position_y: 4, width: 1, height: 1, base_rent: 25000 });

  // Bottom row
  for (let i = 42; i <= 47; i++) {
    stalls.push({
      stall_number: `G${i}`,
      size: '3×2',
      zone: 'Floor 1',
      position_x: i - 42,
      position_y: 5,
      width: 1,
      height: 1,
      base_rent: 25000,
    });
  }
  
  for (let i = 48; i <= 53; i++) {
    stalls.push({
      stall_number: `G${i}`,
      size: '3×2',
      zone: 'Floor 1',
      position_x: i - 48 + 8,
      position_y: 5,
      width: 1,
      height: 1,
      base_rent: 25000,
    });
  }

  return stalls;
};

// First Floor (Floor 2) - Based on second reference image  
const generateFloor2Stalls = () => {
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

  // Top section - Exhibition stalls
  for (let i = 1; i <= 5; i++) {
    stalls.push({
      stall_number: `F${i}`,
      size: '3×2',
      zone: 'Floor 2',
      position_x: i - 1,
      position_y: 0,
      width: 1,
      height: 1,
      base_rent: 30000,
    });
  }
  
  for (let i = 6; i <= 10; i++) {
    stalls.push({
      stall_number: `F${i}`,
      size: '3×2',
      zone: 'Floor 2',
      position_x: i - 6 + 7,
      position_y: 0,
      width: 1,
      height: 1,
      base_rent: 30000,
    });
  }

  // Second row
  stalls.push({ stall_number: 'F11', size: '3×2', zone: 'Floor 2', position_x: 0, position_y: 1, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F12', size: '3x3', zone: 'Floor 2', position_x: 2, position_y: 1, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F13', size: '3x3', zone: 'Floor 2', position_x: 3, position_y: 1, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F14', size: '3x3', zone: 'Floor 2', position_x: 4, position_y: 1, width: 1, height: 1, base_rent: 30000 });
  
  stalls.push({ stall_number: 'F15', size: '3x3', zone: 'Floor 2', position_x: 7, position_y: 1, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F16', size: '3x3', zone: 'Floor 2', position_x: 8, position_y: 1, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F17', size: '3x3', zone: 'Floor 2', position_x: 9, position_y: 1, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F18', size: '3×2', zone: 'Floor 2', position_x: 10, position_y: 1, width: 1, height: 1, base_rent: 30000 });

  // Third row
  stalls.push({ stall_number: 'F19', size: '3x3', zone: 'Floor 2', position_x: 2, position_y: 2, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F20', size: '3x3', zone: 'Floor 2', position_x: 3, position_y: 2, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F21', size: '3x3', zone: 'Floor 2', position_x: 4, position_y: 2, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F22', size: '3x3', zone: 'Floor 2', position_x: 7, position_y: 2, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F23', size: '3x3', zone: 'Floor 2', position_x: 8, position_y: 2, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F24', size: '3x3', zone: 'Floor 2', position_x: 9, position_y: 2, width: 1, height: 1, base_rent: 30000 });

  // Fourth row - Mixed
  stalls.push({ stall_number: 'F25', size: '3×2', zone: 'Floor 2', position_x: 0, position_y: 3, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F26', size: '3x3', zone: 'Floor 2', position_x: 1, position_y: 3, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F27', size: '3x3', zone: 'Floor 2', position_x: 2, position_y: 3, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F28', size: '3x3', zone: 'Floor 2', position_x: 3, position_y: 3, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F29', size: '3x3', zone: 'Floor 2', position_x: 8, position_y: 3, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F30', size: '3x3', zone: 'Floor 2', position_x: 9, position_y: 3, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F31', size: '3x3', zone: 'Floor 2', position_x: 10, position_y: 3, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F32', size: '3×2', zone: 'Floor 2', position_x: 11, position_y: 3, width: 1, height: 1, base_rent: 30000 });

  // Fifth row
  stalls.push({ stall_number: 'F33', size: '3x3', zone: 'Floor 2', position_x: 1, position_y: 4, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F34', size: '3x3', zone: 'Floor 2', position_x: 2, position_y: 4, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F35', size: '3x3', zone: 'Floor 2', position_x: 3, position_y: 4, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F36', size: '3x3', zone: 'Floor 2', position_x: 8, position_y: 4, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F37', size: '3x3', zone: 'Floor 2', position_x: 9, position_y: 4, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'F38', size: '3x3', zone: 'Floor 2', position_x: 10, position_y: 4, width: 1, height: 1, base_rent: 30000 });

  return stalls;
};

// Combine all stalls
const generateAllStalls = () => {
  return [...generateFloor1Stalls(), ...generateFloor2Stalls()];
};

// Lead assignments to stalls
const stallLeadAssignments: Record<string, string> = {
  'G1': 'lead-1',
  'G2': 'lead-2', 
  'G3': 'lead-3',
  'G13': 'lead-4',
  'G17': 'lead-5',
  'G18': 'lead-6',
  'G22': 'lead-7',
  'G30': 'lead-8',
  'G42': 'lead-9',
  'G43': 'lead-10',
  'F1': 'lead-11',
  'F2': 'lead-12',
  'F11': 'lead-13',
  'F15': 'lead-14',
  'F25': 'lead-15',
  'F29': 'lead-16',
};

// Status assignments for realistic distribution
const statusAssignments: Record<string, { status: StallStatus; leadId?: string }> = {
  'G1': { status: 'sold', leadId: 'lead-1' },
  'G2': { status: 'sold', leadId: 'lead-2' },
  'G3': { status: 'pending', leadId: 'lead-3' },
  'G4': { status: 'available' },
  'G5': { status: 'available' },
  'G6': { status: 'blocked' },
  'G7': { status: 'available' },
  'G8': { status: 'available' },
  'G9': { status: 'reserved', leadId: 'lead-4' },
  'G10': { status: 'available' },
  'G11': { status: 'available' },
  'G12': { status: 'available' },
  'G13': { status: 'sold', leadId: 'lead-5' },
  'G14': { status: 'available' },
  'G15': { status: 'available' },
  'G16': { status: 'pending', leadId: 'lead-6' },
  'G17': { status: 'sold', leadId: 'lead-7' },
  'G18': { status: 'available' },
  'G19': { status: 'available' },
  'G20': { status: 'reserved', leadId: 'lead-8' },
  'G21': { status: 'available' },
  'G22': { status: 'sold', leadId: 'lead-9' },
  'G23': { status: 'available' },
  'G24': { status: 'available' },
  'G25': { status: 'pending', leadId: 'lead-10' },
  'G26': { status: 'available' },
  'G27': { status: 'available' },
  'G28': { status: 'blocked' },
  'G29': { status: 'available' },
  'G30': { status: 'sold', leadId: 'lead-11' },
  'G31': { status: 'sold', leadId: 'lead-12' },
  'G32': { status: 'available' },
  'G33': { status: 'reserved', leadId: 'lead-13' },
  'G34': { status: 'available' },
  'G35': { status: 'available' },
  'G36': { status: 'pending', leadId: 'lead-14' },
  'G37': { status: 'available' },
  'G38': { status: 'available' },
  'G39': { status: 'sold', leadId: 'lead-15' },
  'G40': { status: 'available' },
  'G41': { status: 'available' },
  'G42': { status: 'sold', leadId: 'lead-16' },
  'G43': { status: 'available' },
  'G44': { status: 'available' },
  'G45': { status: 'blocked' },
  'G46': { status: 'available' },
  'G47': { status: 'available' },
  'G48': { status: 'reserved', leadId: 'lead-17' },
  'G49': { status: 'available' },
  'G50': { status: 'pending', leadId: 'lead-18' },
  'G51': { status: 'available' },
  'G52': { status: 'sold', leadId: 'lead-19' },
  'G53': { status: 'available' },
  'F1': { status: 'sold', leadId: 'lead-20' },
  'F2': { status: 'available' },
  'F3': { status: 'pending', leadId: 'lead-21' },
  'F4': { status: 'available' },
  'F5': { status: 'reserved', leadId: 'lead-22' },
  'F6': { status: 'available' },
  'F7': { status: 'sold', leadId: 'lead-1' },
  'F8': { status: 'available' },
  'F9': { status: 'available' },
  'F10': { status: 'blocked' },
  'F11': { status: 'sold', leadId: 'lead-2' },
  'F12': { status: 'available' },
  'F13': { status: 'pending', leadId: 'lead-3' },
  'F14': { status: 'available' },
  'F15': { status: 'available' },
  'F16': { status: 'reserved', leadId: 'lead-4' },
  'F17': { status: 'available' },
  'F18': { status: 'sold', leadId: 'lead-5' },
  'F19': { status: 'available' },
  'F20': { status: 'available' },
  'F21': { status: 'pending', leadId: 'lead-6' },
  'F22': { status: 'available' },
  'F23': { status: 'sold', leadId: 'lead-7' },
  'F24': { status: 'available' },
  'F25': { status: 'reserved', leadId: 'lead-8' },
  'F26': { status: 'available' },
  'F27': { status: 'available' },
  'F28': { status: 'sold', leadId: 'lead-9' },
  'F29': { status: 'available' },
  'F30': { status: 'pending', leadId: 'lead-10' },
  'F31': { status: 'available' },
  'F32': { status: 'sold', leadId: 'lead-11' },
  'F33': { status: 'available' },
  'F34': { status: 'available' },
  'F35': { status: 'reserved', leadId: 'lead-12' },
  'F36': { status: 'available' },
  'F37': { status: 'sold', leadId: 'lead-13' },
  'F38': { status: 'available' },
};

// Generate Stalls
export const mockStalls: Stall[] = generateAllStalls().map((pos, idx) => {
  const assignment = statusAssignments[pos.stall_number] || { status: 'available' as StallStatus };
  return {
    id: `stall-${idx + 1}`,
    stall_number: pos.stall_number,
    size: pos.size,
    zone: pos.zone,
    base_rent: pos.base_rent,
    status: assignment.status,
    notes: assignment.status === 'blocked' ? 'Reserved for organizer setup' : null,
    position_x: pos.position_x,
    position_y: pos.position_y,
    width: pos.width,
    height: pos.height,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    lead_id: assignment.leadId || null,
  };
});

// Generate Leads
export const mockLeads: Lead[] = [
  { id: 'lead-1', name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@techsolutions.com', company: 'Tech Solutions Pvt Ltd', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Premium client, paid in advance. Interested in corner stalls.', created_by: null, created_at: '2024-01-05T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'lead-2', name: 'Priya Sharma', phone: '9876543211', email: 'priya@greentech.in', company: 'GreenTech Industries', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Returning exhibitor from last year.', created_by: null, created_at: '2024-01-06T00:00:00Z', updated_at: '2024-01-12T00:00:00Z' },
  { id: 'lead-3', name: 'Amit Patel', phone: '9876543212', email: 'amit@innovate.io', company: 'Innovate IO', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Startup company, negotiated discount.', created_by: null, created_at: '2024-01-07T00:00:00Z', updated_at: '2024-01-14T00:00:00Z' },
  { id: 'lead-4', name: 'Sunita Reddy', phone: '9876543213', email: 'sunita@craftworks.com', company: 'CraftWorks', status: 'interested', interested_stalls: [], target_stall_count: 2, interested_zone: 'Floor 1', quoted_amount: 20000, quoted_gst: true, quoted_cgst: 1800, quoted_sgst: 1800, quoted_total: 23600, notes: 'Wants to see the floor layout before confirming.', created_by: null, created_at: '2024-01-08T00:00:00Z', updated_at: '2024-01-15T00:00:00Z' },
  { id: 'lead-5', name: 'Vikram Singh', phone: '9876543214', email: 'vikram@megacorp.in', company: 'MegaCorp Industries', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Large stall requirement. Title sponsor candidate.', created_by: null, created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-08T00:00:00Z' },
  { id: 'lead-6', name: 'Ananya Das', phone: '9876543215', email: 'ananya@fashionhub.com', company: 'Fashion Hub', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Fashion brand, needs power outlets.', created_by: null, created_at: '2024-01-09T00:00:00Z', updated_at: '2024-01-16T00:00:00Z' },
  { id: 'lead-7', name: 'Deepak Joshi', phone: '9876543216', email: 'deepak@softtech.com', company: 'SoftTech Solutions', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Comparing with other exhibitions.', created_by: null, created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-17T00:00:00Z' },
  { id: 'lead-8', name: 'Meera Nair', phone: '9876543217', email: 'meera@healthplus.in', company: 'HealthPlus', status: 'interested', interested_stalls: [], target_stall_count: 3, interested_zone: 'Floor 1', quoted_amount: 30000, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 30000, notes: 'Healthcare products showcase.', created_by: null, created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-09T00:00:00Z' },
  { id: 'lead-9', name: 'Arjun Mehta', phone: '9876543218', email: 'arjun@autozone.com', company: 'AutoZone Motors', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Auto accessories display.', created_by: null, created_at: '2024-01-11T00:00:00Z', updated_at: '2024-01-18T00:00:00Z' },
  { id: 'lead-10', name: 'Kavita Gupta', phone: '9876543219', email: 'kavita@jewelcraft.com', company: 'JewelCraft', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Jewelry display, needs security.', created_by: null, created_at: '2024-01-04T00:00:00Z', updated_at: '2024-01-11T00:00:00Z' },
  { id: 'lead-11', name: 'Rohit Agarwal', phone: '9876543220', email: 'rohit@furnmart.in', company: 'FurnMart', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Furniture display needs extra space.', created_by: null, created_at: '2024-01-12T00:00:00Z', updated_at: '2024-01-19T00:00:00Z' },
  { id: 'lead-12', name: 'Neha Kapoor', phone: '9876543221', email: 'neha@beautyworld.com', company: 'Beauty World', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Major cosmetics brand. VIP treatment.', created_by: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-07T00:00:00Z' },
  { id: 'lead-13', name: 'Sanjay Verma', phone: '9876543222', email: 'sanjay@techgear.io', company: 'TechGear', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 2', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Electronics and gadgets.', created_by: null, created_at: '2024-01-05T00:00:00Z', updated_at: '2024-01-12T00:00:00Z' },
  { id: 'lead-14', name: 'Pooja Iyer', phone: '9876543223', email: 'pooja@organicfoods.in', company: 'Organic Foods Co', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 2', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Food samples distribution planned.', created_by: null, created_at: '2024-01-13T00:00:00Z', updated_at: '2024-01-20T00:00:00Z' },
  { id: 'lead-15', name: 'Karan Malhotra', phone: '9876543224', email: 'karan@sportspro.com', company: 'SportsPro', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 2', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Sports equipment showcase.', created_by: null, created_at: '2024-01-14T00:00:00Z', updated_at: '2024-01-21T00:00:00Z' },
  { id: 'lead-16', name: 'Divya Saxena', phone: '9876543225', email: 'divya@homestyle.in', company: 'HomeStyle Decor', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Home decor, needs setup time.', created_by: null, created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-09T00:00:00Z' },
  { id: 'lead-17', name: 'Manish Tiwari', phone: '9876543226', email: 'manish@printzone.com', company: 'PrintZone', status: 'interested', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Printing services demo.', created_by: null, created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-22T00:00:00Z' },
  { id: 'lead-18', name: 'Shreya Bhatt', phone: '9876543227', email: 'shreya@edutech.io', company: 'EduTech Solutions', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Educational products and services.', created_by: null, created_at: '2024-01-06T00:00:00Z', updated_at: '2024-01-13T00:00:00Z' },
  { id: 'lead-19', name: 'Rahul Khanna', phone: '9876543228', email: 'rahul@travelbee.in', company: 'TravelBee', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Travel agency promotions.', created_by: null, created_at: '2024-01-16T00:00:00Z', updated_at: '2024-01-23T00:00:00Z' },
  { id: 'lead-20', name: 'Anjali Rao', phone: '9876543229', email: 'anjali@petcare.com', company: 'PetCare Plus', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 2', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Pet products, live demos.', created_by: null, created_at: '2024-01-07T00:00:00Z', updated_at: '2024-01-14T00:00:00Z' },
  { id: 'lead-21', name: 'Vivek Choudhary', phone: '9876543230', email: 'vivek@finserve.in', company: 'FinServe', status: 'converted', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 2', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Financial services, needs meeting space.', created_by: null, created_at: '2024-01-17T00:00:00Z', updated_at: '2024-01-24T00:00:00Z' },
  { id: 'lead-22', name: 'Ritu Bansal', phone: '9876543231', email: 'ritu@artgallery.com', company: 'Art Gallery India', status: 'interested', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 2', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Art exhibition, lighting requirements.', created_by: null, created_at: '2024-01-08T00:00:00Z', updated_at: '2024-01-15T00:00:00Z' },
  { id: 'lead-23', name: 'Arun Mishra', phone: '9876543232', email: 'arun@buildtech.in', company: 'BuildTech', status: 'new', interested_stalls: [], target_stall_count: 5, interested_zone: 'Floor 1', quoted_amount: 50000, quoted_gst: true, quoted_cgst: 4500, quoted_sgst: 4500, quoted_total: 59000, notes: 'Construction company, first inquiry.', created_by: null, created_at: '2024-01-18T00:00:00Z', updated_at: '2024-01-18T00:00:00Z' },
  { id: 'lead-24', name: 'Sneha Pillai', phone: '9876543233', email: 'sneha@mediahub.com', company: 'MediaHub', status: 'follow_up', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 2', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Media company, needs follow-up call.', created_by: null, created_at: '2024-01-19T00:00:00Z', updated_at: '2024-01-25T00:00:00Z' },
  { id: 'lead-25', name: 'Nitin Desai', phone: '9876543234', email: 'nitin@eventpro.in', company: 'EventPro', status: 'not_interested', interested_stalls: [], target_stall_count: null, interested_zone: 'Floor 1', quoted_amount: 0, quoted_gst: false, quoted_cgst: 0, quoted_sgst: 0, quoted_total: 0, notes: 'Budget constraints, maybe next year.', created_by: null, created_at: '2024-01-20T00:00:00Z', updated_at: '2024-01-26T00:00:00Z' },
];

// Generate Services
export const mockServices: Service[] = [
  // Sponsor Slots
  { id: 'service-1', name: 'Title Sponsor', category: 'sponsor', description: 'Exclusive title sponsorship with logo on all materials', price: 500000, quantity: 1, sold_quantity: 0, is_unlimited: false, notes: 'Premium package', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'service-2', name: 'Gold Sponsor', category: 'sponsor', description: 'Gold tier sponsorship package', price: 250000, quantity: 3, sold_quantity: 2, is_unlimited: false, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'service-3', name: 'Silver Sponsor', category: 'sponsor', description: 'Silver tier sponsorship package', price: 100000, quantity: 5, sold_quantity: 3, is_unlimited: false, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-12T00:00:00Z' },
  
  // Signboards
  { id: 'service-4', name: 'Main Gate Banner', category: 'signboard', description: 'Large banner at main entrance (20x10 ft)', price: 75000, quantity: 2, sold_quantity: 1, is_unlimited: false, notes: 'High visibility', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-08T00:00:00Z' },
  { id: 'service-5', name: 'Stage Backdrop', category: 'signboard', description: 'Backdrop branding on main stage', price: 150000, quantity: 1, sold_quantity: 1, is_unlimited: false, notes: 'Sold to MegaCorp', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-05T00:00:00Z' },
  { id: 'service-6', name: 'Entry Arch Branding', category: 'signboard', description: 'Branding on entry arch structure', price: 100000, quantity: 2, sold_quantity: 0, is_unlimited: false, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'service-7', name: 'Hall Banner (Small)', category: 'signboard', description: 'Small banners inside halls (5x3 ft)', price: 15000, quantity: 20, sold_quantity: 8, is_unlimited: false, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-15T00:00:00Z' },
  
  // Food Court
  { id: 'service-8', name: 'Food Stall Type A', category: 'food_court', description: 'Large food stall with cooking area', price: 50000, quantity: 5, sold_quantity: 3, is_unlimited: false, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-14T00:00:00Z' },
  { id: 'service-9', name: 'Food Stall Type B', category: 'food_court', description: 'Standard food counter', price: 30000, quantity: 8, sold_quantity: 5, is_unlimited: false, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-16T00:00:00Z' },
  { id: 'service-10', name: 'Beverage Counter', category: 'food_court', description: 'Drinks and beverages only', price: 20000, quantity: 6, sold_quantity: 2, is_unlimited: false, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-13T00:00:00Z' },
  
  // Add-ons
  { id: 'service-11', name: 'Extra Power (5 KW)', category: 'add_on', description: 'Additional 5 KW power supply', price: 5000, quantity: 0, sold_quantity: 12, is_unlimited: true, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-20T00:00:00Z' },
  { id: 'service-12', name: 'Furniture Package Basic', category: 'add_on', description: '2 chairs, 1 table, 1 display rack', price: 3000, quantity: 0, sold_quantity: 18, is_unlimited: true, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-22T00:00:00Z' },
  { id: 'service-13', name: 'Furniture Package Premium', category: 'add_on', description: '4 chairs, 2 tables, 2 display racks, carpet', price: 8000, quantity: 0, sold_quantity: 7, is_unlimited: true, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-21T00:00:00Z' },
  { id: 'service-14', name: 'Extra Storage Room', category: 'add_on', description: 'Secure storage room access', price: 10000, quantity: 10, sold_quantity: 4, is_unlimited: false, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-18T00:00:00Z' },
  { id: 'service-15', name: 'WiFi Package', category: 'add_on', description: 'Dedicated high-speed WiFi for stall', price: 2000, quantity: 0, sold_quantity: 25, is_unlimited: true, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-23T00:00:00Z' },
  { id: 'service-16', name: 'TV Display 42"', category: 'add_on', description: '42 inch LED TV with stand', price: 8000, quantity: 15, sold_quantity: 6, is_unlimited: false, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-23T00:00:00Z' },
  { id: 'service-17', name: 'Advertisement LED Screen', category: 'add_on', description: 'Rotating ad on main LED screen', price: 25000, quantity: 10, sold_quantity: 4, is_unlimited: false, notes: 'Per day rate', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-23T00:00:00Z' },
];

// Service allocations - mapping services to stalls
export const mockServiceAllocations: ServiceAllocation[] = [
  { id: 'alloc-1', service_id: 'service-11', stall_id: 'stall-1', quantity: 1, created_at: '2024-01-10T00:00:00Z' },
  { id: 'alloc-2', service_id: 'service-12', stall_id: 'stall-1', quantity: 1, created_at: '2024-01-10T00:00:00Z' },
  { id: 'alloc-3', service_id: 'service-15', stall_id: 'stall-1', quantity: 1, created_at: '2024-01-10T00:00:00Z' },
  { id: 'alloc-4', service_id: 'service-11', stall_id: 'stall-2', quantity: 1, created_at: '2024-01-11T00:00:00Z' },
  { id: 'alloc-5', service_id: 'service-13', stall_id: 'stall-13', quantity: 1, created_at: '2024-01-12T00:00:00Z' },
  { id: 'alloc-6', service_id: 'service-16', stall_id: 'stall-13', quantity: 2, created_at: '2024-01-12T00:00:00Z' },
  { id: 'alloc-7', service_id: 'service-17', stall_id: 'stall-17', quantity: 1, created_at: '2024-01-13T00:00:00Z' },
  { id: 'alloc-8', service_id: 'service-11', stall_id: 'stall-17', quantity: 2, created_at: '2024-01-13T00:00:00Z' },
];

// Generate Accounts
export const mockAccounts: Account[] = [
  { id: 'account-1', name: 'Main Event Account', upi_details: 'exhibition@ybl', bank_details: 'HDFC Bank - 50100123456789 - IFSC: HDFC0001234', notes: 'Primary collection account', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'account-2', name: 'Cash Collection', upi_details: null, bank_details: null, notes: 'Physical cash collection', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'account-3', name: 'Secondary Bank Account', upi_details: 'events2@okaxis', bank_details: 'Axis Bank - 917020045678901 - IFSC: UTIB0002345', notes: 'Backup account', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

// Generate Transactions
export const mockTransactions: Transaction[] = [
  { id: 'txn-1', transaction_number: 'TXN-2024-001', lead_id: 'lead-1', total_amount: 25000, amount_paid: 25000, payment_status: 'paid', notes: 'Full payment received', created_by: null, created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'txn-2', transaction_number: 'TXN-2024-002', lead_id: 'lead-2', total_amount: 28000, amount_paid: 28000, payment_status: 'paid', notes: 'Includes furniture package', created_by: null, created_at: '2024-01-12T00:00:00Z', updated_at: '2024-01-12T00:00:00Z' },
  { id: 'txn-3', transaction_number: 'TXN-2024-003', lead_id: 'lead-3', total_amount: 27000, amount_paid: 15000, payment_status: 'partial', notes: 'Balance due before event', created_by: null, created_at: '2024-01-14T00:00:00Z', updated_at: '2024-01-20T00:00:00Z' },
  { id: 'txn-4', transaction_number: 'TXN-2024-004', lead_id: 'lead-5', total_amount: 85000, amount_paid: 85000, payment_status: 'paid', notes: 'Large stall - VIP client', created_by: null, created_at: '2024-01-08T00:00:00Z', updated_at: '2024-01-08T00:00:00Z' },
  { id: 'txn-5', transaction_number: 'TXN-2024-005', lead_id: 'lead-6', total_amount: 53000, amount_paid: 25000, payment_status: 'partial', notes: 'First installment received', created_by: null, created_at: '2024-01-16T00:00:00Z', updated_at: '2024-01-16T00:00:00Z' },
  { id: 'txn-6', transaction_number: 'TXN-2024-006', lead_id: 'lead-7', total_amount: 75000, amount_paid: 75000, payment_status: 'paid', notes: null, created_by: null, created_at: '2024-01-09T00:00:00Z', updated_at: '2024-01-09T00:00:00Z' },
  { id: 'txn-7', transaction_number: 'TXN-2024-007', lead_id: 'lead-9', total_amount: 30000, amount_paid: 10000, payment_status: 'partial', notes: 'Cheque pending clearance', created_by: null, created_at: '2024-01-18T00:00:00Z', updated_at: '2024-01-22T00:00:00Z' },
  { id: 'txn-8', transaction_number: 'TXN-2024-008', lead_id: 'lead-10', total_amount: 32000, amount_paid: 32000, payment_status: 'paid', notes: 'Extra security included', created_by: null, created_at: '2024-01-11T00:00:00Z', updated_at: '2024-01-11T00:00:00Z' },
  { id: 'txn-9', transaction_number: 'TXN-2024-009', lead_id: 'lead-11', total_amount: 55000, amount_paid: 55000, payment_status: 'paid', notes: 'Premium package with all add-ons', created_by: null, created_at: '2024-01-07T00:00:00Z', updated_at: '2024-01-07T00:00:00Z' },
  { id: 'txn-10', transaction_number: 'TXN-2024-010', lead_id: 'lead-12', total_amount: 55000, amount_paid: 55000, payment_status: 'paid', notes: null, created_by: null, created_at: '2024-01-12T00:00:00Z', updated_at: '2024-01-12T00:00:00Z' },
  { id: 'txn-11', transaction_number: 'TXN-2024-011', lead_id: 'lead-14', total_amount: 32000, amount_paid: 16000, payment_status: 'partial', notes: '50% advance paid', created_by: null, created_at: '2024-01-20T00:00:00Z', updated_at: '2024-01-20T00:00:00Z' },
  { id: 'txn-12', transaction_number: 'TXN-2024-012', lead_id: 'lead-16', total_amount: 30000, amount_paid: 30000, payment_status: 'paid', notes: 'Stall with sponsorship', created_by: null, created_at: '2024-01-09T00:00:00Z', updated_at: '2024-01-09T00:00:00Z' },
];

// Generate Transaction Items
export const mockTransactionItems: TransactionItem[] = [
  { id: 'item-1', transaction_id: 'txn-1', item_type: 'stall', stall_id: 'stall-1', service_id: null, item_name: 'Stall G1', size: '3x3', base_price: 25000, addon_price: 0, final_price: 25000, created_at: '2024-01-10T00:00:00Z' },
  { id: 'item-2', transaction_id: 'txn-2', item_type: 'stall', stall_id: 'stall-2', service_id: null, item_name: 'Stall G2', size: '3x3', base_price: 25000, addon_price: 0, final_price: 25000, created_at: '2024-01-12T00:00:00Z' },
  { id: 'item-3', transaction_id: 'txn-2', item_type: 'service', stall_id: null, service_id: 'service-12', item_name: 'Furniture Package Basic', size: null, base_price: 3000, addon_price: 0, final_price: 3000, created_at: '2024-01-12T00:00:00Z' },
  { id: 'item-4', transaction_id: 'txn-4', item_type: 'stall', stall_id: 'stall-13', service_id: null, item_name: 'Stall G13', size: '3x3', base_price: 25000, addon_price: 0, final_price: 25000, created_at: '2024-01-08T00:00:00Z' },
  { id: 'item-5', transaction_id: 'txn-4', item_type: 'service', stall_id: null, service_id: 'service-11', item_name: 'Extra Power (5 KW)', size: null, base_price: 5000, addon_price: 0, final_price: 5000, created_at: '2024-01-08T00:00:00Z' },
  { id: 'item-6', transaction_id: 'txn-6', item_type: 'stall', stall_id: 'stall-17', service_id: null, item_name: 'Stall G17', size: '6x6', base_price: 75000, addon_price: 0, final_price: 75000, created_at: '2024-01-09T00:00:00Z' },
  { id: 'item-7', transaction_id: 'txn-9', item_type: 'stall', stall_id: 'stall-30', service_id: null, item_name: 'Stall G30', size: '3x6', base_price: 45000, addon_price: 0, final_price: 45000, created_at: '2024-01-07T00:00:00Z' },
  { id: 'item-8', transaction_id: 'txn-9', item_type: 'service', stall_id: null, service_id: 'service-13', item_name: 'Furniture Package Premium', size: null, base_price: 8000, addon_price: 0, final_price: 8000, created_at: '2024-01-07T00:00:00Z' },
  { id: 'item-9', transaction_id: 'txn-10', item_type: 'stall', stall_id: 'stall-31', service_id: null, item_name: 'Stall G31', size: '3x6', base_price: 45000, addon_price: 0, final_price: 45000, created_at: '2024-01-12T00:00:00Z' },
  { id: 'item-10', transaction_id: 'txn-10', item_type: 'service', stall_id: null, service_id: 'service-14', item_name: 'Extra Storage Room', size: null, base_price: 10000, addon_price: 0, final_price: 10000, created_at: '2024-01-12T00:00:00Z' },
];

// Generate Payments
export const mockPayments: Payment[] = [
  { id: 'pay-1', transaction_id: 'txn-1', amount: 25000, payment_mode: 'bank', account_id: 'account-1', reference_id: 'NEFT123456789', payment_date: '2024-01-10', recorded_by: null, notes: 'Full payment via NEFT', created_at: '2024-01-10T00:00:00Z' },
  { id: 'pay-2', transaction_id: 'txn-2', amount: 28000, payment_mode: 'upi', account_id: 'account-1', reference_id: 'UPI987654321', payment_date: '2024-01-12', recorded_by: null, notes: null, created_at: '2024-01-12T00:00:00Z' },
  { id: 'pay-3', transaction_id: 'txn-3', amount: 15000, payment_mode: 'cash', account_id: 'account-2', reference_id: 'CASH-003', payment_date: '2024-01-14', recorded_by: null, notes: 'Advance payment', created_at: '2024-01-14T00:00:00Z' },
  { id: 'pay-4', transaction_id: 'txn-4', amount: 50000, payment_mode: 'bank', account_id: 'account-1', reference_id: 'RTGS789012345', payment_date: '2024-01-06', recorded_by: null, notes: 'First installment', created_at: '2024-01-06T00:00:00Z' },
  { id: 'pay-5', transaction_id: 'txn-4', amount: 35000, payment_mode: 'bank', account_id: 'account-1', reference_id: 'RTGS789012346', payment_date: '2024-01-08', recorded_by: null, notes: 'Final payment', created_at: '2024-01-08T00:00:00Z' },
  { id: 'pay-6', transaction_id: 'txn-5', amount: 25000, payment_mode: 'upi', account_id: 'account-1', reference_id: 'UPI567890123', payment_date: '2024-01-16', recorded_by: null, notes: null, created_at: '2024-01-16T00:00:00Z' },
  { id: 'pay-7', transaction_id: 'txn-6', amount: 75000, payment_mode: 'cash', account_id: 'account-2', reference_id: 'CASH-006', payment_date: '2024-01-09', recorded_by: null, notes: null, created_at: '2024-01-09T00:00:00Z' },
  { id: 'pay-8', transaction_id: 'txn-7', amount: 10000, payment_mode: 'upi', account_id: 'account-3', reference_id: 'UPI345678901', payment_date: '2024-01-18', recorded_by: null, notes: 'Partial payment', created_at: '2024-01-18T00:00:00Z' },
  { id: 'pay-9', transaction_id: 'txn-8', amount: 32000, payment_mode: 'bank', account_id: 'account-1', reference_id: 'NEFT234567890', payment_date: '2024-01-11', recorded_by: null, notes: null, created_at: '2024-01-11T00:00:00Z' },
  { id: 'pay-10', transaction_id: 'txn-9', amount: 55000, payment_mode: 'bank', account_id: 'account-1', reference_id: 'RTGS901234567', payment_date: '2024-01-07', recorded_by: null, notes: 'Premium client - full payment', created_at: '2024-01-07T00:00:00Z' },
  { id: 'pay-11', transaction_id: 'txn-10', amount: 55000, payment_mode: 'upi', account_id: 'account-1', reference_id: 'UPI678901234', payment_date: '2024-01-12', recorded_by: null, notes: null, created_at: '2024-01-12T00:00:00Z' },
  { id: 'pay-12', transaction_id: 'txn-11', amount: 16000, payment_mode: 'cash', account_id: 'account-2', reference_id: 'CASH-011', payment_date: '2024-01-20', recorded_by: null, notes: '50% advance', created_at: '2024-01-20T00:00:00Z' },
  { id: 'pay-13', transaction_id: 'txn-12', amount: 30000, payment_mode: 'bank', account_id: 'account-1', reference_id: 'RTGS012345678', payment_date: '2024-01-09', recorded_by: null, notes: 'Full payment received', created_at: '2024-01-09T00:00:00Z' },
];

// Helper to get lead for a transaction
export const getLeadForTransaction = (leadId: string) => mockLeads.find(l => l.id === leadId);

// Helper to get stall assignment info
export const getStallAssignment = (stallNumber: string) => statusAssignments[stallNumber];

// Helper to get transaction for a lead
export const getTransactionForLead = (leadId: string) => mockTransactions.find(t => t.lead_id === leadId);
