import { Stall, Lead, Service, Transaction, TransactionItem, Payment, Account, StallStatus, LeadStatus, PaymentStatus, PaymentMode, ServiceCategory } from '@/types/database';

// Generate stall positions for a realistic floor layout
const generateStallPositions = () => {
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

  // Hall A - Left side (Columns 0-4)
  // Row 1
  ['A1', 'A2', 'A3', 'A4', 'A5'].forEach((num, idx) => {
    stalls.push({
      stall_number: num,
      size: '3x3',
      zone: 'Hall A',
      position_x: idx,
      position_y: 0,
      width: 1,
      height: 1,
      base_rent: 25000,
    });
  });

  // Row 2 - Mixed sizes
  stalls.push({ stall_number: 'A6', size: '6x6', zone: 'Hall A', position_x: 0, position_y: 1, width: 2, height: 2, base_rent: 75000 });
  stalls.push({ stall_number: 'A7', size: '3x6', zone: 'Hall A', position_x: 2, position_y: 1, width: 1, height: 2, base_rent: 45000 });
  stalls.push({ stall_number: 'A8', size: '3x3', zone: 'Hall A', position_x: 3, position_y: 1, width: 1, height: 1, base_rent: 25000 });
  stalls.push({ stall_number: 'A9', size: '3x3', zone: 'Hall A', position_x: 4, position_y: 1, width: 1, height: 1, base_rent: 25000 });

  // Row 3
  stalls.push({ stall_number: 'A10', size: '3x3', zone: 'Hall A', position_x: 3, position_y: 2, width: 1, height: 1, base_rent: 25000 });
  stalls.push({ stall_number: 'A11', size: '3x3', zone: 'Hall A', position_x: 4, position_y: 2, width: 1, height: 1, base_rent: 25000 });

  // Row 4
  ['A12', 'A13', 'A14', 'A15', 'A16'].forEach((num, idx) => {
    stalls.push({
      stall_number: num,
      size: '3x3',
      zone: 'Hall A',
      position_x: idx,
      position_y: 3,
      width: 1,
      height: 1,
      base_rent: 25000,
    });
  });

  // Row 5
  stalls.push({ stall_number: 'A17', size: '3x6', zone: 'Hall A', position_x: 0, position_y: 4, width: 1, height: 2, base_rent: 45000 });
  stalls.push({ stall_number: 'A18', size: '3x6', zone: 'Hall A', position_x: 1, position_y: 4, width: 1, height: 2, base_rent: 45000 });
  stalls.push({ stall_number: 'A19', size: '6x6', zone: 'Hall A', position_x: 2, position_y: 4, width: 2, height: 2, base_rent: 75000 });
  stalls.push({ stall_number: 'A20', size: '3x3', zone: 'Hall A', position_x: 4, position_y: 4, width: 1, height: 1, base_rent: 25000 });
  stalls.push({ stall_number: 'A21', size: '3x3', zone: 'Hall A', position_x: 4, position_y: 5, width: 1, height: 1, base_rent: 25000 });

  // Hall B - Right side (Columns 6-10)
  // Row 1
  ['B1', 'B2', 'B3', 'B4', 'B5'].forEach((num, idx) => {
    stalls.push({
      stall_number: num,
      size: '3x3',
      zone: 'Hall B',
      position_x: idx + 6,
      position_y: 0,
      width: 1,
      height: 1,
      base_rent: 30000,
    });
  });

  // Row 2
  stalls.push({ stall_number: 'B6', size: '3x3', zone: 'Hall B', position_x: 6, position_y: 1, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'B7', size: '6x6', zone: 'Hall B', position_x: 7, position_y: 1, width: 2, height: 2, base_rent: 85000 });
  stalls.push({ stall_number: 'B8', size: '3x6', zone: 'Hall B', position_x: 9, position_y: 1, width: 1, height: 2, base_rent: 50000 });
  stalls.push({ stall_number: 'B9', size: '3x3', zone: 'Hall B', position_x: 10, position_y: 1, width: 1, height: 1, base_rent: 30000 });

  // Row 3
  stalls.push({ stall_number: 'B10', size: '3x3', zone: 'Hall B', position_x: 6, position_y: 2, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'B11', size: '3x3', zone: 'Hall B', position_x: 10, position_y: 2, width: 1, height: 1, base_rent: 30000 });

  // Row 4
  ['B12', 'B13', 'B14', 'B15', 'B16'].forEach((num, idx) => {
    stalls.push({
      stall_number: num,
      size: '3x3',
      zone: 'Hall B',
      position_x: idx + 6,
      position_y: 3,
      width: 1,
      height: 1,
      base_rent: 30000,
    });
  });

  // Row 5-6
  stalls.push({ stall_number: 'B17', size: '6x6', zone: 'Hall B', position_x: 6, position_y: 4, width: 2, height: 2, base_rent: 85000 });
  stalls.push({ stall_number: 'B18', size: '3x3', zone: 'Hall B', position_x: 8, position_y: 4, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'B19', size: '3x3', zone: 'Hall B', position_x: 9, position_y: 4, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'B20', size: '3x3', zone: 'Hall B', position_x: 10, position_y: 4, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'B21', size: '3x3', zone: 'Hall B', position_x: 8, position_y: 5, width: 1, height: 1, base_rent: 30000 });
  stalls.push({ stall_number: 'B22', size: '3x6', zone: 'Hall B', position_x: 9, position_y: 5, width: 2, height: 1, base_rent: 55000 });

  return stalls;
};

// Status assignments for realistic distribution
const statusAssignments: Record<string, { status: StallStatus; leadId?: string }> = {
  'A1': { status: 'sold', leadId: 'lead-1' },
  'A2': { status: 'sold', leadId: 'lead-2' },
  'A3': { status: 'pending', leadId: 'lead-3' },
  'A4': { status: 'reserved', leadId: 'lead-4' },
  'A5': { status: 'available' },
  'A6': { status: 'sold', leadId: 'lead-5' },
  'A7': { status: 'pending', leadId: 'lead-6' },
  'A8': { status: 'available' },
  'A9': { status: 'blocked' },
  'A10': { status: 'available' },
  'A11': { status: 'reserved', leadId: 'lead-7' },
  'A12': { status: 'sold', leadId: 'lead-8' },
  'A13': { status: 'available' },
  'A14': { status: 'available' },
  'A15': { status: 'pending', leadId: 'lead-9' },
  'A16': { status: 'sold', leadId: 'lead-10' },
  'A17': { status: 'available' },
  'A18': { status: 'reserved', leadId: 'lead-11' },
  'A19': { status: 'sold', leadId: 'lead-12' },
  'A20': { status: 'available' },
  'A21': { status: 'blocked' },
  'B1': { status: 'sold', leadId: 'lead-13' },
  'B2': { status: 'available' },
  'B3': { status: 'pending', leadId: 'lead-14' },
  'B4': { status: 'available' },
  'B5': { status: 'reserved', leadId: 'lead-15' },
  'B6': { status: 'available' },
  'B7': { status: 'sold', leadId: 'lead-16' },
  'B8': { status: 'available' },
  'B9': { status: 'available' },
  'B10': { status: 'pending', leadId: 'lead-17' },
  'B11': { status: 'sold', leadId: 'lead-18' },
  'B12': { status: 'available' },
  'B13': { status: 'available' },
  'B14': { status: 'reserved', leadId: 'lead-19' },
  'B15': { status: 'available' },
  'B16': { status: 'sold', leadId: 'lead-20' },
  'B17': { status: 'pending', leadId: 'lead-21' },
  'B18': { status: 'available' },
  'B19': { status: 'available' },
  'B20': { status: 'blocked' },
  'B21': { status: 'available' },
  'B22': { status: 'sold', leadId: 'lead-22' },
};

// Generate Stalls
export const mockStalls: Stall[] = generateStallPositions().map((pos, idx) => {
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
  };
});

// Generate Leads
export const mockLeads: Lead[] = [
  { id: 'lead-1', name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@techsolutions.com', company: 'Tech Solutions Pvt Ltd', status: 'converted', interested_size: '3x3', interested_zone: 'Hall A', notes: 'Premium client, paid in advance. Interested in corner stalls.', created_by: null, created_at: '2024-01-05T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'lead-2', name: 'Priya Sharma', phone: '9876543211', email: 'priya@greentech.in', company: 'GreenTech Industries', status: 'converted', interested_size: '3x3', interested_zone: 'Hall A', notes: 'Returning exhibitor from last year.', created_by: null, created_at: '2024-01-06T00:00:00Z', updated_at: '2024-01-12T00:00:00Z' },
  { id: 'lead-3', name: 'Amit Patel', phone: '9876543212', email: 'amit@innovate.io', company: 'Innovate IO', status: 'converted', interested_size: '3x3', interested_zone: 'Hall A', notes: 'Startup company, negotiated discount.', created_by: null, created_at: '2024-01-07T00:00:00Z', updated_at: '2024-01-14T00:00:00Z' },
  { id: 'lead-4', name: 'Sunita Reddy', phone: '9876543213', email: 'sunita@craftworks.com', company: 'CraftWorks', status: 'interested', interested_size: '3x3', interested_zone: 'Hall A', notes: 'Wants to see the floor layout before confirming.', created_by: null, created_at: '2024-01-08T00:00:00Z', updated_at: '2024-01-15T00:00:00Z' },
  { id: 'lead-5', name: 'Vikram Singh', phone: '9876543214', email: 'vikram@megacorp.in', company: 'MegaCorp Industries', status: 'converted', interested_size: '6x6', interested_zone: 'Hall A', notes: 'Large stall requirement. Title sponsor candidate.', created_by: null, created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-08T00:00:00Z' },
  { id: 'lead-6', name: 'Ananya Das', phone: '9876543215', email: 'ananya@fashionhub.com', company: 'Fashion Hub', status: 'converted', interested_size: '3x6', interested_zone: 'Hall A', notes: 'Fashion brand, needs power outlets.', created_by: null, created_at: '2024-01-09T00:00:00Z', updated_at: '2024-01-16T00:00:00Z' },
  { id: 'lead-7', name: 'Deepak Joshi', phone: '9876543216', email: 'deepak@softtech.com', company: 'SoftTech Solutions', status: 'interested', interested_size: '3x3', interested_zone: 'Hall A', notes: 'Comparing with other exhibitions.', created_by: null, created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-17T00:00:00Z' },
  { id: 'lead-8', name: 'Meera Nair', phone: '9876543217', email: 'meera@healthplus.in', company: 'HealthPlus', status: 'converted', interested_size: '3x3', interested_zone: 'Hall A', notes: 'Healthcare products showcase.', created_by: null, created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-09T00:00:00Z' },
  { id: 'lead-9', name: 'Arjun Mehta', phone: '9876543218', email: 'arjun@autozone.com', company: 'AutoZone Motors', status: 'converted', interested_size: '3x3', interested_zone: 'Hall A', notes: 'Auto accessories display.', created_by: null, created_at: '2024-01-11T00:00:00Z', updated_at: '2024-01-18T00:00:00Z' },
  { id: 'lead-10', name: 'Kavita Gupta', phone: '9876543219', email: 'kavita@jewelcraft.com', company: 'JewelCraft', status: 'converted', interested_size: '3x3', interested_zone: 'Hall A', notes: 'Jewelry display, needs security.', created_by: null, created_at: '2024-01-04T00:00:00Z', updated_at: '2024-01-11T00:00:00Z' },
  { id: 'lead-11', name: 'Rohit Agarwal', phone: '9876543220', email: 'rohit@furnmart.in', company: 'FurnMart', status: 'interested', interested_size: '3x6', interested_zone: 'Hall A', notes: 'Furniture display needs extra space.', created_by: null, created_at: '2024-01-12T00:00:00Z', updated_at: '2024-01-19T00:00:00Z' },
  { id: 'lead-12', name: 'Neha Kapoor', phone: '9876543221', email: 'neha@beautyworld.com', company: 'Beauty World', status: 'converted', interested_size: '6x6', interested_zone: 'Hall A', notes: 'Major cosmetics brand. VIP treatment.', created_by: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-07T00:00:00Z' },
  { id: 'lead-13', name: 'Sanjay Verma', phone: '9876543222', email: 'sanjay@techgear.io', company: 'TechGear', status: 'converted', interested_size: '3x3', interested_zone: 'Hall B', notes: 'Electronics and gadgets.', created_by: null, created_at: '2024-01-05T00:00:00Z', updated_at: '2024-01-12T00:00:00Z' },
  { id: 'lead-14', name: 'Pooja Iyer', phone: '9876543223', email: 'pooja@organicfoods.in', company: 'Organic Foods Co', status: 'converted', interested_size: '3x3', interested_zone: 'Hall B', notes: 'Food samples distribution planned.', created_by: null, created_at: '2024-01-13T00:00:00Z', updated_at: '2024-01-20T00:00:00Z' },
  { id: 'lead-15', name: 'Karan Malhotra', phone: '9876543224', email: 'karan@sportspro.com', company: 'SportsPro', status: 'interested', interested_size: '3x3', interested_zone: 'Hall B', notes: 'Sports equipment showcase.', created_by: null, created_at: '2024-01-14T00:00:00Z', updated_at: '2024-01-21T00:00:00Z' },
  { id: 'lead-16', name: 'Divya Saxena', phone: '9876543225', email: 'divya@homestyle.in', company: 'HomeStyle Decor', status: 'converted', interested_size: '6x6', interested_zone: 'Hall B', notes: 'Home decor, needs setup time.', created_by: null, created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-09T00:00:00Z' },
  { id: 'lead-17', name: 'Manish Tiwari', phone: '9876543226', email: 'manish@printzone.com', company: 'PrintZone', status: 'converted', interested_size: '3x3', interested_zone: 'Hall B', notes: 'Printing services demo.', created_by: null, created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-22T00:00:00Z' },
  { id: 'lead-18', name: 'Shreya Bhatt', phone: '9876543227', email: 'shreya@edutech.io', company: 'EduTech Solutions', status: 'converted', interested_size: '3x3', interested_zone: 'Hall B', notes: 'Educational products and services.', created_by: null, created_at: '2024-01-06T00:00:00Z', updated_at: '2024-01-13T00:00:00Z' },
  { id: 'lead-19', name: 'Rahul Khanna', phone: '9876543228', email: 'rahul@travelbee.in', company: 'TravelBee', status: 'interested', interested_size: '3x3', interested_zone: 'Hall B', notes: 'Travel agency promotions.', created_by: null, created_at: '2024-01-16T00:00:00Z', updated_at: '2024-01-23T00:00:00Z' },
  { id: 'lead-20', name: 'Anjali Rao', phone: '9876543229', email: 'anjali@petcare.com', company: 'PetCare Plus', status: 'converted', interested_size: '3x3', interested_zone: 'Hall B', notes: 'Pet products, live demos.', created_by: null, created_at: '2024-01-07T00:00:00Z', updated_at: '2024-01-14T00:00:00Z' },
  { id: 'lead-21', name: 'Vivek Choudhary', phone: '9876543230', email: 'vivek@finserve.in', company: 'FinServe', status: 'converted', interested_size: '6x6', interested_zone: 'Hall B', notes: 'Financial services, needs meeting space.', created_by: null, created_at: '2024-01-17T00:00:00Z', updated_at: '2024-01-24T00:00:00Z' },
  { id: 'lead-22', name: 'Ritu Bansal', phone: '9876543231', email: 'ritu@artgallery.com', company: 'Art Gallery India', status: 'converted', interested_size: '3x6', interested_zone: 'Hall B', notes: 'Art exhibition, lighting requirements.', created_by: null, created_at: '2024-01-08T00:00:00Z', updated_at: '2024-01-15T00:00:00Z' },
  { id: 'lead-23', name: 'Arun Mishra', phone: '9876543232', email: 'arun@buildtech.in', company: 'BuildTech', status: 'new', interested_size: '6x6', interested_zone: 'Hall A', notes: 'Construction company, first inquiry.', created_by: null, created_at: '2024-01-18T00:00:00Z', updated_at: '2024-01-18T00:00:00Z' },
  { id: 'lead-24', name: 'Sneha Pillai', phone: '9876543233', email: 'sneha@mediahub.com', company: 'MediaHub', status: 'follow_up', interested_size: '3x3', interested_zone: 'Hall B', notes: 'Media company, needs follow-up call.', created_by: null, created_at: '2024-01-19T00:00:00Z', updated_at: '2024-01-25T00:00:00Z' },
  { id: 'lead-25', name: 'Nitin Desai', phone: '9876543234', email: 'nitin@eventpro.in', company: 'EventPro', status: 'not_interested', interested_size: '3x3', interested_zone: 'Hall A', notes: 'Budget constraints, maybe next year.', created_by: null, created_at: '2024-01-20T00:00:00Z', updated_at: '2024-01-26T00:00:00Z' },
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
];

// Generate Accounts
export const mockAccounts: Account[] = [
  { id: 'account-1', name: 'Main Event Account', upi_details: 'exhibition@ybl', bank_details: 'HDFC Bank - 50100123456789 - IFSC: HDFC0001234', notes: 'Primary collection account', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'account-2', name: 'Cash Collection', upi_details: null, bank_details: null, notes: 'Physical cash collection', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'account-3', name: 'Secondary Bank Account', upi_details: 'events2@okaxis', bank_details: 'Axis Bank - 917020045678901 - IFSC: UTIB0002345', notes: 'Backup account', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

// Find stall by lead ID helper
const findStallByLeadId = (leadId: string) => {
  const stallNumber = Object.entries(statusAssignments).find(([_, v]) => v.leadId === leadId)?.[0];
  return mockStalls.find(s => s.stall_number === stallNumber);
};

// Generate Transactions
export const mockTransactions: Transaction[] = [
  { id: 'txn-1', transaction_number: 'TXN-2024-001', lead_id: 'lead-1', total_amount: 25000, amount_paid: 25000, payment_status: 'paid', notes: 'Full payment received', created_by: null, created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'txn-2', transaction_number: 'TXN-2024-002', lead_id: 'lead-2', total_amount: 28000, amount_paid: 28000, payment_status: 'paid', notes: 'Includes furniture package', created_by: null, created_at: '2024-01-12T00:00:00Z', updated_at: '2024-01-12T00:00:00Z' },
  { id: 'txn-3', transaction_number: 'TXN-2024-003', lead_id: 'lead-3', total_amount: 27000, amount_paid: 15000, payment_status: 'partial', notes: 'Balance due before event', created_by: null, created_at: '2024-01-14T00:00:00Z', updated_at: '2024-01-20T00:00:00Z' },
  { id: 'txn-4', transaction_number: 'TXN-2024-004', lead_id: 'lead-5', total_amount: 85000, amount_paid: 85000, payment_status: 'paid', notes: 'Large stall - VIP client', created_by: null, created_at: '2024-01-08T00:00:00Z', updated_at: '2024-01-08T00:00:00Z' },
  { id: 'txn-5', transaction_number: 'TXN-2024-005', lead_id: 'lead-6', total_amount: 53000, amount_paid: 25000, payment_status: 'partial', notes: 'First installment received', created_by: null, created_at: '2024-01-16T00:00:00Z', updated_at: '2024-01-16T00:00:00Z' },
  { id: 'txn-6', transaction_number: 'TXN-2024-006', lead_id: 'lead-8', total_amount: 25000, amount_paid: 25000, payment_status: 'paid', notes: null, created_by: null, created_at: '2024-01-09T00:00:00Z', updated_at: '2024-01-09T00:00:00Z' },
  { id: 'txn-7', transaction_number: 'TXN-2024-007', lead_id: 'lead-9', total_amount: 30000, amount_paid: 10000, payment_status: 'partial', notes: 'Cheque pending clearance', created_by: null, created_at: '2024-01-18T00:00:00Z', updated_at: '2024-01-22T00:00:00Z' },
  { id: 'txn-8', transaction_number: 'TXN-2024-008', lead_id: 'lead-10', total_amount: 32000, amount_paid: 32000, payment_status: 'paid', notes: 'Extra security included', created_by: null, created_at: '2024-01-11T00:00:00Z', updated_at: '2024-01-11T00:00:00Z' },
  { id: 'txn-9', transaction_number: 'TXN-2024-009', lead_id: 'lead-12', total_amount: 95000, amount_paid: 95000, payment_status: 'paid', notes: 'Premium package with all add-ons', created_by: null, created_at: '2024-01-07T00:00:00Z', updated_at: '2024-01-07T00:00:00Z' },
  { id: 'txn-10', transaction_number: 'TXN-2024-010', lead_id: 'lead-13', total_amount: 35000, amount_paid: 35000, payment_status: 'paid', notes: null, created_by: null, created_at: '2024-01-12T00:00:00Z', updated_at: '2024-01-12T00:00:00Z' },
  { id: 'txn-11', transaction_number: 'TXN-2024-011', lead_id: 'lead-14', total_amount: 32000, amount_paid: 16000, payment_status: 'partial', notes: '50% advance paid', created_by: null, created_at: '2024-01-20T00:00:00Z', updated_at: '2024-01-20T00:00:00Z' },
  { id: 'txn-12', transaction_number: 'TXN-2024-012', lead_id: 'lead-16', total_amount: 100000, amount_paid: 100000, payment_status: 'paid', notes: 'Large stall with sponsorship', created_by: null, created_at: '2024-01-09T00:00:00Z', updated_at: '2024-01-09T00:00:00Z' },
];

// Generate Transaction Items
export const mockTransactionItems: TransactionItem[] = [
  // Transaction 1 - Simple stall
  { id: 'item-1', transaction_id: 'txn-1', item_type: 'stall', stall_id: 'stall-1', service_id: null, item_name: 'Stall A1', size: '3x3', base_price: 25000, addon_price: 0, final_price: 25000, created_at: '2024-01-10T00:00:00Z' },
  
  // Transaction 2 - Stall with furniture
  { id: 'item-2', transaction_id: 'txn-2', item_type: 'stall', stall_id: 'stall-2', service_id: null, item_name: 'Stall A2', size: '3x3', base_price: 25000, addon_price: 0, final_price: 25000, created_at: '2024-01-12T00:00:00Z' },
  { id: 'item-3', transaction_id: 'txn-2', item_type: 'service', stall_id: null, service_id: 'service-12', item_name: 'Furniture Package Basic', size: null, base_price: 3000, addon_price: 0, final_price: 3000, created_at: '2024-01-12T00:00:00Z' },
  
  // Transaction 4 - Large stall
  { id: 'item-4', transaction_id: 'txn-4', item_type: 'stall', stall_id: 'stall-6', service_id: null, item_name: 'Stall A6', size: '6x6', base_price: 75000, addon_price: 0, final_price: 75000, created_at: '2024-01-08T00:00:00Z' },
  { id: 'item-5', transaction_id: 'txn-4', item_type: 'service', stall_id: null, service_id: 'service-11', item_name: 'Extra Power (5 KW)', size: null, base_price: 5000, addon_price: 0, final_price: 5000, created_at: '2024-01-08T00:00:00Z' },
  { id: 'item-6', transaction_id: 'txn-4', item_type: 'service', stall_id: null, service_id: 'service-15', item_name: 'WiFi Package', size: null, base_price: 2000, addon_price: 0, final_price: 2000, created_at: '2024-01-08T00:00:00Z' },
  
  // Transaction 9 - Premium package
  { id: 'item-7', transaction_id: 'txn-9', item_type: 'stall', stall_id: 'stall-18', service_id: null, item_name: 'Stall A19', size: '6x6', base_price: 75000, addon_price: 0, final_price: 75000, created_at: '2024-01-07T00:00:00Z' },
  { id: 'item-8', transaction_id: 'txn-9', item_type: 'service', stall_id: null, service_id: 'service-13', item_name: 'Furniture Package Premium', size: null, base_price: 8000, addon_price: 0, final_price: 8000, created_at: '2024-01-07T00:00:00Z' },
  { id: 'item-9', transaction_id: 'txn-9', item_type: 'service', stall_id: null, service_id: 'service-11', item_name: 'Extra Power (5 KW)', size: null, base_price: 5000, addon_price: 0, final_price: 5000, created_at: '2024-01-07T00:00:00Z' },
  { id: 'item-10', transaction_id: 'txn-9', item_type: 'service', stall_id: null, service_id: 'service-14', item_name: 'Extra Storage Room', size: null, base_price: 10000, addon_price: 0, final_price: 10000, created_at: '2024-01-07T00:00:00Z' },
];

// Generate Payments
export const mockPayments: Payment[] = [
  { id: 'pay-1', transaction_id: 'txn-1', amount: 25000, payment_mode: 'bank', account_id: 'account-1', reference_id: 'NEFT123456789', payment_date: '2024-01-10', recorded_by: null, notes: 'Full payment via NEFT', created_at: '2024-01-10T00:00:00Z' },
  { id: 'pay-2', transaction_id: 'txn-2', amount: 28000, payment_mode: 'upi', account_id: 'account-1', reference_id: 'UPI987654321', payment_date: '2024-01-12', recorded_by: null, notes: null, created_at: '2024-01-12T00:00:00Z' },
  { id: 'pay-3', transaction_id: 'txn-3', amount: 15000, payment_mode: 'cash', account_id: 'account-2', reference_id: 'CASH-003', payment_date: '2024-01-14', recorded_by: null, notes: 'Advance payment', created_at: '2024-01-14T00:00:00Z' },
  { id: 'pay-4', transaction_id: 'txn-4', amount: 50000, payment_mode: 'bank', account_id: 'account-1', reference_id: 'RTGS789012345', payment_date: '2024-01-06', recorded_by: null, notes: 'First installment', created_at: '2024-01-06T00:00:00Z' },
  { id: 'pay-5', transaction_id: 'txn-4', amount: 35000, payment_mode: 'bank', account_id: 'account-1', reference_id: 'RTGS789012346', payment_date: '2024-01-08', recorded_by: null, notes: 'Final payment', created_at: '2024-01-08T00:00:00Z' },
  { id: 'pay-6', transaction_id: 'txn-5', amount: 25000, payment_mode: 'upi', account_id: 'account-1', reference_id: 'UPI567890123', payment_date: '2024-01-16', recorded_by: null, notes: null, created_at: '2024-01-16T00:00:00Z' },
  { id: 'pay-7', transaction_id: 'txn-6', amount: 25000, payment_mode: 'cash', account_id: 'account-2', reference_id: 'CASH-006', payment_date: '2024-01-09', recorded_by: null, notes: null, created_at: '2024-01-09T00:00:00Z' },
  { id: 'pay-8', transaction_id: 'txn-7', amount: 10000, payment_mode: 'upi', account_id: 'account-3', reference_id: 'UPI345678901', payment_date: '2024-01-18', recorded_by: null, notes: 'Partial payment', created_at: '2024-01-18T00:00:00Z' },
  { id: 'pay-9', transaction_id: 'txn-8', amount: 32000, payment_mode: 'bank', account_id: 'account-1', reference_id: 'NEFT234567890', payment_date: '2024-01-11', recorded_by: null, notes: null, created_at: '2024-01-11T00:00:00Z' },
  { id: 'pay-10', transaction_id: 'txn-9', amount: 95000, payment_mode: 'bank', account_id: 'account-1', reference_id: 'RTGS901234567', payment_date: '2024-01-07', recorded_by: null, notes: 'Premium client - full payment', created_at: '2024-01-07T00:00:00Z' },
  { id: 'pay-11', transaction_id: 'txn-10', amount: 35000, payment_mode: 'upi', account_id: 'account-1', reference_id: 'UPI678901234', payment_date: '2024-01-12', recorded_by: null, notes: null, created_at: '2024-01-12T00:00:00Z' },
  { id: 'pay-12', transaction_id: 'txn-11', amount: 16000, payment_mode: 'cash', account_id: 'account-2', reference_id: 'CASH-011', payment_date: '2024-01-20', recorded_by: null, notes: '50% advance', created_at: '2024-01-20T00:00:00Z' },
  { id: 'pay-13', transaction_id: 'txn-12', amount: 100000, payment_mode: 'bank', account_id: 'account-1', reference_id: 'RTGS012345678', payment_date: '2024-01-09', recorded_by: null, notes: 'Full payment received', created_at: '2024-01-09T00:00:00Z' },
];

// Helper to get lead for a transaction
export const getLeadForTransaction = (leadId: string) => mockLeads.find(l => l.id === leadId);

// Helper to get stall assignment info
export const getStallAssignment = (stallNumber: string) => statusAssignments[stallNumber];

// Helper to get transaction for a lead
export const getTransactionForLead = (leadId: string) => mockTransactions.find(t => t.lead_id === leadId);
