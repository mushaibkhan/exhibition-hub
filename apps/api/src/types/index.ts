export type AppRole = 'admin' | 'maintainer';
export type StallStatus = 'available' | 'reserved' | 'sold' | 'pending' | 'blocked';
export type LeadStatus = 'new' | 'follow_up' | 'interested' | 'not_interested' | 'converted';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type PaymentMode = 'cash' | 'upi' | 'bank';
export type ServiceCategory = 'sponsor' | 'signboard' | 'food_court' | 'add_on';
export type ExpenseCategory = 'venue' | 'furniture' | 'marketing' | 'utilities' | 'staff' | 'misc';
export type InternalLedgerStatus = 'pending' | 'settled';
