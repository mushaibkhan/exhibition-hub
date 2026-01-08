export type AppRole = 'admin' | 'maintainer';
export type StallStatus = 'available' | 'reserved' | 'sold' | 'pending' | 'blocked';
export type LeadStatus = 'new' | 'follow_up' | 'interested' | 'not_interested' | 'converted';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type PaymentMode = 'cash' | 'upi' | 'bank';
export type ServiceCategory = 'sponsor' | 'signboard' | 'food_court' | 'add_on';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Account {
  id: string;
  name: string;
  upi_details: string | null;
  bank_details: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stall {
  id: string;
  stall_number: string;
  size: string;
  zone: string | null;
  base_rent: number;
  status: StallStatus;
  notes: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string | null;
  price: number;
  quantity: number;
  sold_quantity: number;
  is_unlimited: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  status: LeadStatus;
  interested_size: string | null;
  interested_zone: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  lead_id: string;
  total_amount: number;
  amount_paid: number;
  payment_status: PaymentStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lead?: Lead;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  item_type: 'stall' | 'service';
  stall_id: string | null;
  service_id: string | null;
  item_name: string;
  size: string | null;
  base_price: number;
  addon_price: number;
  final_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  transaction_id: string;
  amount: number;
  payment_mode: PaymentMode;
  account_id: string | null;
  reference_id: string | null;
  payment_date: string;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
  transaction?: Transaction;
  account?: Account;
}
