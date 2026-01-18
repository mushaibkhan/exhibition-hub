export type AppRole = 'admin' | 'maintainer';
export type StallStatus = 'available' | 'reserved' | 'sold' | 'pending' | 'blocked';
export type LeadStatus = 'new' | 'follow_up' | 'interested' | 'not_interested' | 'converted';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type PaymentMode = 'cash' | 'upi' | 'bank';
export type ServiceCategory = 'sponsor' | 'signboard' | 'food_court' | 'add_on';
export type ExpenseCategory = 'venue' | 'furniture' | 'marketing' | 'utilities' | 'staff' | 'misc';

export interface Profile {
  id: string; // References auth.users.id
  email: string | null;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Exhibition {
  id: string;
  name: string;
  short_name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
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

// Stall simplified - no size, status, lead_id, position fields (moved to layout table)
export interface Stall {
  id: string;
  exhibition_id: string;
  stall_number: string;
  zone: string | null;
  base_rent: number;
  is_blocked: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Derived fields (computed, not stored)
  status?: StallStatus;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
}

// Stall layout - separate table for positioning
export interface StallLayout {
  id: string;
  stall_id: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  exhibition_id: string;
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

export interface ServiceAllocation {
  id: string;
  exhibition_id: string;
  service_id: string;
  stall_id: string;
  transaction_id: string; // Link to source transaction
  quantity: number;
  created_at: string;
}

export interface Lead {
  id: string;
  exhibition_id: string;
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

// Transaction simplified - no amount_paid, payment_status (derived from payments)
export interface Transaction {
  id: string;
  exhibition_id: string;
  transaction_number: string;
  lead_id: string;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  cancelled: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  // Derived fields (computed, not stored)
  amount_paid?: number;
  payment_status?: PaymentStatus;
  lead?: Lead;
}

export interface TransactionItem {
  id: string;
  exhibition_id: string;
  transaction_id: string;
  item_type: 'stall' | 'service';
  stall_id: string | null;
  service_id: string | null;
  item_name: string;
  size: string | null; // Display only
  base_price: number;
  addon_price: number;
  final_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  exhibition_id: string;
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

export interface Expense {
  id: string;
  exhibition_id: string;
  expense_date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  payment_mode: PaymentMode;
  account_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  account?: Account;
}
