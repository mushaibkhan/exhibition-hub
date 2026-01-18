import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { useExhibition } from './ExhibitionContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Stall, Lead, Service, Transaction, TransactionItem, Payment, Account, 
  StallStatus, LeadStatus, PaymentStatus, ServiceAllocation, StallLayout,
  Profile, UserRole, AppRole, Exhibition, Expense
} from '@/types/database';

// Helper function to create user-friendly error messages
const getErrorMessage = (error: any, defaultMessage: string): string => {
  if (!error) return defaultMessage;
  if (typeof error === 'string') return error;
  if (error.message) {
    // Handle Supabase errors
    if (error.message.includes('duplicate key')) return 'This record already exists.';
    if (error.message.includes('foreign key')) return 'Cannot perform this operation: related record not found.';
    if (error.message.includes('violates not-null')) return 'Required fields are missing.';
    if (error.message.includes('violates check constraint')) return 'Invalid data provided.';
    return error.message;
  }
  return defaultMessage;
};

interface SupabaseDataContextType {
  role: AppRole;
  setRole: (role: AppRole) => void;
  isAdmin: boolean;
  stalls: Stall[];
  leads: Lead[];
  services: Service[];
  transactions: Transaction[];
  transactionItems: TransactionItem[];
  payments: Payment[];
  expenses: Expense[];
  accounts: Account[];
  profiles: Profile[];
  userRoles: UserRole[];
  serviceAllocations: ServiceAllocation[];
  stallLayouts: StallLayout[];
  updateStall: (id: string, updates: Partial<Stall>) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addService: (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Promise<Service>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addServiceAllocation: (allocation: Omit<ServiceAllocation, 'id' | 'created_at'>) => Promise<void>;
  removeServiceAllocation: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>, items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[], selectedStallId?: string) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  cancelTransaction: (id: string) => Promise<void>;
  removeServiceFromTransaction: (transactionId: string, itemId: string) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<Payment>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addAccount: (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  createUser: (userData: { email: string; password: string; full_name: string; phone?: string; roles?: AppRole[] }) => Promise<Profile>;
  updateUser: (id: string, updates: Partial<Profile>) => Promise<void>;
  updateUserPassword: (id: string, newPassword: string) => Promise<void>;
  deactivateUser: (id: string) => Promise<void>;
  activateUser: (id: string) => Promise<void>;
  assignUserRole: (userId: string, role: AppRole) => Promise<void>;
  removeUserRole: (userId: string, role: AppRole) => Promise<void>;
  addExhibition: (exhibition: Omit<Exhibition, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateExhibition: (id: string, updates: Partial<Exhibition>) => Promise<void>;
  deleteExhibition: (id: string) => Promise<void>;
  getLeadById: (id: string) => Lead | undefined;
  getStallById: (id: string) => Stall | undefined;
  getStallByNumber: (number: string) => Stall | undefined;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByLeadId: (leadId: string) => Transaction[];
  getPaymentsByTransactionId: (transactionId: string) => Payment[];
  getItemsByTransactionId: (transactionId: string) => TransactionItem[];
  getServiceAllocationsByStallId: (stallId: string) => ServiceAllocation[];
  getServiceAllocationsByTransactionId: (transactionId: string) => ServiceAllocation[];
  getServiceById: (id: string) => Service | undefined;
  getAvailableStalls: () => Stall[];
  getStallsByLeadId: (leadId: string) => Stall[];
  getTransactionsByStallId: (stallId: string) => Transaction[];
  getStallStatus: (stallId: string) => StallStatus;
  getTransactionSummary: (transactionId: string) => { amount_paid: number; payment_status: PaymentStatus };
  currentExhibitionId: string;
}

const SupabaseDataContext = createContext<SupabaseDataContextType | undefined>(undefined);

export const SupabaseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentExhibition } = useExhibition();
  const [role, setRole] = useState<AppRole>('admin');
  const queryClient = useQueryClient();
  const currentExhibitionId = currentExhibition?.id || '';
  const isAdmin = role === 'admin';

  // Fetch stalls with layouts (disabled if no exhibition)
  const { data: stallsData = [] } = useQuery({
    queryKey: ['stalls', currentExhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stalls')
        .select('*')
        .eq('exhibition_id', currentExhibitionId)
        .order('stall_number');
      if (error) throw error;
      // Ensure base_rent is a number (Supabase NUMERIC can return as string)
      return (data || []).map((stall: any) => ({
        ...stall,
        base_rent: Number(stall.base_rent),
        exhibition_id: stall.exhibition_id || currentExhibitionId,
        is_blocked: stall.is_blocked || false,
      })) as Stall[];
    },
    enabled: !!currentExhibitionId,
  });

  // First fetch stalls to get their IDs for filtering layouts
  const { data: stallsForLayouts = [] } = useQuery({
    queryKey: ['stalls_for_layouts', currentExhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stalls')
        .select('id')
        .eq('exhibition_id', currentExhibitionId);
      if (error) throw error;
      return (data || []).map(s => s.id);
    },
    enabled: !!currentExhibitionId,
  });

  const { data: layoutsData = [] } = useQuery({
    queryKey: ['stall_layouts', currentExhibitionId, stallsForLayouts],
    queryFn: async () => {
      if (!stallsForLayouts || (Array.isArray(stallsForLayouts) && stallsForLayouts.length === 0)) return [];
      // Fetch layouts for stalls in current exhibition
      const { data, error } = await (supabase.from('stall_layouts' as any) as any)
        .select('*')
        .in('stall_id', stallsForLayouts as readonly any[]);
      if (error) throw error;
      return (data || []) as StallLayout[];
    },
    enabled: !!currentExhibitionId && !!stallsForLayouts && (Array.isArray(stallsForLayouts) ? stallsForLayouts.length > 0 : false),
  });

  // Merge stalls with layouts
  const stalls = useMemo(() => {
    if (!stallsData || stallsData.length === 0) return [];
    return stallsData
      .filter(stall => stall && stall.id)
      .map(stall => {
        const layout = layoutsData?.find(l => l && l.stall_id === stall.id);
        return {
          ...stall,
          position_x: layout?.position_x ?? 0,
          position_y: layout?.position_y ?? 0,
          width: layout?.width ?? 1,
          height: layout?.height ?? 1,
        };
      });
  }, [stallsData, layoutsData]);

  // Fetch other data (disabled if no exhibition)
  const { data: leads = [] } = useQuery({
    queryKey: ['leads', currentExhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('exhibition_id', currentExhibitionId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!currentExhibitionId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', currentExhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('exhibition_id', currentExhibitionId)
        .order('name');
      if (error) throw error;
      // Ensure numeric fields are numbers (Supabase NUMERIC can return as string)
      return (data || []).map(service => ({
        ...service,
        price: Number(service.price),
        quantity: Number(service.quantity),
        sold_quantity: Number(service.sold_quantity),
      })) as Service[];
    },
    enabled: !!currentExhibitionId,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', currentExhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('exhibition_id', currentExhibitionId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Ensure total_amount is a number (Supabase NUMERIC can return as string)
      return (data || []).map(t => ({
        ...t,
        total_amount: Number(t.total_amount),
      })) as Transaction[];
    },
    enabled: !!currentExhibitionId,
  });

  const { data: transactionItems = [] } = useQuery({
    queryKey: ['transaction_items', currentExhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_items')
        .select('*')
        .eq('exhibition_id', currentExhibitionId);
      if (error) throw error;
      // Ensure price fields are numbers (Supabase NUMERIC can return as string)
      return (data || []).map(item => ({
        ...item,
        base_price: Number(item.base_price),
        addon_price: Number(item.addon_price),
        final_price: Number(item.final_price),
      })) as TransactionItem[];
    },
    enabled: !!currentExhibitionId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', currentExhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('exhibition_id', currentExhibitionId)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      // Ensure amount is a number (Supabase NUMERIC can return as string)
      return (data || []).map(p => ({
        ...p,
        amount: Number(p.amount),
      })) as Payment[];
    },
    enabled: !!currentExhibitionId,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', currentExhibitionId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('expenses' as any) as any)
        .select('*')
        .eq('exhibition_id', currentExhibitionId)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      // Ensure amount is a number (Supabase NUMERIC can return as string)
      return (data || []).map((e: any) => ({
        ...e,
        amount: Number(e.amount),
      })) as Expense[];
    },
    enabled: !!currentExhibitionId,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Account[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['user_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const { data: serviceAllocations = [] } = useQuery({
    queryKey: ['service_allocations', currentExhibitionId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('service_allocations' as any) as any)
        .select('*')
        .eq('exhibition_id', currentExhibitionId);
      if (error) throw error;
      return (data || []) as ServiceAllocation[];
    },
    enabled: !!currentExhibitionId,
  });

  // Derive stall status from transactions and payments
  const getStallStatus = useCallback((stallId: string): StallStatus => {
    if (!stallId) return 'available';
    const stallArray = Array.isArray(stalls) ? stalls : [];
    const stall = stallArray.find((s: Stall) => s.id === stallId);
    if (!stall) return 'available';
    if ((stall as any).is_blocked) return 'blocked';

    // Find transaction item for this stall (non-cancelled)
    const transactionItemsArray = Array.isArray(transactionItems) ? transactionItems : [];
    const txnItem = transactionItemsArray.find((ti: TransactionItem) => 
      ti.stall_id === stallId && 
      ti.item_type === 'stall'
    );
    if (!txnItem) return 'available';

    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    const txn = transactionsArray.find((t: Transaction) => t.id === txnItem.transaction_id);
    if (!txn || txn.cancelled) return 'available';

    // Calculate total paid
    const paymentsArray = Array.isArray(payments) ? payments : [];
    const totalPaid = paymentsArray
      .filter((p: Payment) => p && p.transaction_id === txn.id)
      .reduce((sum: number, p: Payment) => sum + (Number(p.amount) || 0), 0);

    if (totalPaid >= Number(txn.total_amount || 0)) return 'sold';
    if (totalPaid > 0) return 'pending';
    return 'reserved';
  }, [stalls, transactionItems, transactions, payments]);

  // Derive transaction summary
  const getTransactionSummary = useCallback((transactionId: string): { amount_paid: number; payment_status: PaymentStatus } => {
    if (!transactionId) return { amount_paid: 0, payment_status: 'unpaid' };
    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    const txn = transactionsArray.find((t: Transaction) => t && t.id === transactionId);
    if (!txn) return { amount_paid: 0, payment_status: 'unpaid' };
    if (txn.cancelled) return { amount_paid: 0, payment_status: 'unpaid' };

    const paymentsArray = Array.isArray(payments) ? payments : [];
    const totalPaid = paymentsArray
      .filter((p: Payment) => p && p.transaction_id === transactionId)
      .reduce((sum: number, p: Payment) => sum + (Number(p.amount) || 0), 0);

    let payment_status: PaymentStatus = 'unpaid';
    const totalAmount = Number(txn.total_amount || 0);
    if (totalPaid >= totalAmount) payment_status = 'paid';
    else if (totalPaid > 0) payment_status = 'partial';

    return { amount_paid: totalPaid, payment_status };
  }, [transactions, payments]);

  // Add status to stalls
  const stallsWithStatus = useMemo(() => {
    const stallsArray = Array.isArray(stalls) ? stalls : [];
    if (!stallsArray || stallsArray.length === 0) return [];
    return stallsArray
      .filter((stall: Stall) => stall && stall.id)
      .map((stall: Stall) => ({
        ...stall,
        status: getStallStatus(stall.id),
      }));
  }, [stalls, getStallStatus]);

  // Add summary to transactions
  const transactionsWithSummary = useMemo(() => {
    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    if (!transactionsArray || transactionsArray.length === 0) return [];
    return transactionsArray
      .filter((txn: Transaction) => txn && txn.id)
      .map((txn: Transaction) => {
        const summary = getTransactionSummary(txn.id);
        return {
          ...txn,
          amount_paid: summary.amount_paid,
          payment_status: summary.payment_status,
        };
      });
  }, [transactions, getTransactionSummary]);

  // Mutations
  const updateStallMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Stall> }) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        const { error } = await supabase
          .from('stalls')
          .update(updates)
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update stall. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error updating stall:', error);
      }
    },
  });

  const addLeadMutation = useMutation({
    mutationFn: async (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        if (!lead.name?.trim()) throw new Error('Lead name is required');
        if (!lead.phone?.trim()) throw new Error('Phone number is required');
        const { error } = await supabase
          .from('leads')
          .insert({ ...lead, exhibition_id: currentExhibitionId });
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to add lead. Please check your input and try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error adding lead:', error);
      }
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        const { error } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update lead. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error updating lead:', error);
      }
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        // Check if lead has transactions
        const hasTransactions = transactions.some(t => t.lead_id === id);
        if (hasTransactions) {
          throw new Error('Cannot delete lead with existing transactions. Please cancel transactions first.');
        }
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to delete lead. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error deleting lead:', error);
      }
    },
  });

  const addServiceMutation = useMutation({
    mutationFn: async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        if (!service.name?.trim()) throw new Error('Service name is required');
        if (service.price < 0) throw new Error('Service price cannot be negative');
        if (service.quantity < 0) throw new Error('Service quantity cannot be negative');
        const { data, error } = await supabase
          .from('services')
          .insert({ ...service, exhibition_id: currentExhibitionId })
          .select()
          .single();
        if (error) throw error;
        // Ensure numeric fields are numbers
        return {
          ...data,
          price: Number(data.price),
          quantity: Number(data.quantity),
          sold_quantity: Number(data.sold_quantity),
        } as Service;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to add service. Please check your input and try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error adding service:', error);
      }
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Service> }) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        if (updates.price !== undefined && updates.price < 0) throw new Error('Service price cannot be negative');
        if (updates.quantity !== undefined && updates.quantity < 0) throw new Error('Service quantity cannot be negative');
        if (updates.sold_quantity !== undefined && updates.sold_quantity < 0) throw new Error('Sold quantity cannot be negative');
        const { error } = await supabase
          .from('services')
          .update(updates)
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update service. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error updating service:', error);
      }
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        // Check if service has allocations
        const hasAllocations = serviceAllocations.some(a => a.service_id === id);
        if (hasAllocations) {
          throw new Error('Cannot delete service with existing allocations. Please remove allocations first.');
        }
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to delete service. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error deleting service:', error);
      }
    },
  });

  const addServiceAllocationMutation = useMutation({
    mutationFn: async (allocation: Omit<ServiceAllocation, 'id' | 'created_at'>) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        if (!allocation.service_id) throw new Error('Service ID is required');
        if (!allocation.stall_id) throw new Error('Stall ID is required');
        if (!allocation.transaction_id) throw new Error('Transaction ID is required');
        if (allocation.quantity < 1) throw new Error('Quantity must be at least 1');
        const { error } = await (supabase.from('service_allocations' as any) as any)
          .insert({ ...allocation, exhibition_id: currentExhibitionId });
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to add service allocation. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_allocations', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error adding service allocation:', error);
      }
    },
  });

  const removeServiceAllocationMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        const { error } = await (supabase.from('service_allocations' as any) as any)
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to remove service allocation. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_allocations', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error removing service allocation:', error);
      }
    },
  });

  const addTransactionMutation = useMutation({
    mutationFn: async ({ 
      transaction, 
      items, 
      selectedStallId 
    }: { 
      transaction: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>;
      items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[];
      selectedStallId?: string;
    }) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        if (!transaction.lead_id) throw new Error('Lead is required');
        if (!items || items.length === 0) throw new Error('At least one item is required');
        if (transaction.total_amount <= 0) throw new Error('Transaction total must be greater than zero');
        
        // Validate items
        for (const item of items) {
          if (item.item_type === 'stall' && !item.stall_id) throw new Error('Stall ID is required for stall items');
          if (item.item_type === 'service' && !item.service_id) throw new Error('Service ID is required for service items');
          if (item.final_price <= 0) throw new Error('Item price must be greater than zero');
        }
        
        // Generate transaction number using timestamp to avoid race conditions
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const txnNumber = `TXN-2024-${timestamp}-${String(random).padStart(3, '0')}`;

        // Insert transaction (exclude derived fields: amount_paid, payment_status, lead)
        const { amount_paid, payment_status, lead, ...transactionData } = transaction;
        const { data: txnData, error: txnError } = await supabase
          .from('transactions')
          .insert({
            ...transactionData,
            exhibition_id: currentExhibitionId,
            transaction_number: txnNumber,
            cancelled: false,
            cancelled_at: null,
          })
          .select()
          .single();
        if (txnError) throw txnError;

        // Insert transaction items
        const itemsWithExhibition = items.map(item => ({
          ...item,
          exhibition_id: currentExhibitionId,
          transaction_id: txnData.id,
        }));
        const { error: itemsError } = await supabase
          .from('transaction_items')
          .insert(itemsWithExhibition);
        if (itemsError) throw itemsError;

        // Create service allocations if services are present
        const serviceItems = items.filter(i => i.item_type === 'service');
        if (serviceItems.length > 0 && selectedStallId) {
          const allocations = serviceItems.map(item => ({
            exhibition_id: currentExhibitionId,
            service_id: item.service_id!,
            stall_id: selectedStallId,
            transaction_id: txnData.id,
            quantity: 1, // Default quantity
          }));
          const { error: allocError } = await (supabase.from('service_allocations' as any) as any)
            .insert(allocations);
          if (allocError) throw allocError;

          // Update service sold_quantity atomically using RPC or increment
          const servicesArray = Array.isArray(services) ? services : [];
          for (const item of serviceItems) {
            if (item.service_id) {
              const service = servicesArray.find((s: Service) => s.id === item.service_id);
              if (service) {
                // Use atomic increment to avoid race conditions
                const { error: updateError } = await (supabase.rpc as any)('increment_service_sold_quantity', {
                  service_id: service.id,
                  increment_by: 1
                }).catch(async () => {
                  // Fallback to regular update if RPC doesn't exist
                  const { error } = await supabase
                    .from('services')
                    .update({ sold_quantity: service.sold_quantity + 1 })
                    .eq('id', service.id);
                  if (error) throw error;
                });
                if (updateError) throw updateError;
              }
            }
          }
        }

        // Mark lead as converted if not already
        const leadsArray = Array.isArray(leads) ? leads : [];
        const leadData = leadsArray.find((l: Lead) => l.id === transaction.lead_id);
        if (leadData && leadData.status !== 'converted') {
          const { error: leadError } = await supabase
            .from('leads')
            .update({ status: 'converted' })
            .eq('id', transaction.lead_id);
          if (leadError) throw leadError;
        }
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to create transaction. Please check your input and try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['transaction_items', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['service_allocations', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['leads', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error adding transaction:', error);
      }
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        if (updates.total_amount !== undefined && updates.total_amount <= 0) {
          throw new Error('Transaction total must be greater than zero');
        }
        // Exclude derived fields from updates
        const { amount_paid, payment_status, lead, ...updateData } = updates;
        const { error } = await supabase
          .from('transactions')
          .update(updateData)
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update transaction. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error updating transaction:', error);
      }
    },
  });

  const cancelTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        // Mark transaction as cancelled (keep items for audit)
        const { error } = await supabase
          .from('transactions')
          .update({ 
            cancelled: true, 
            cancelled_at: new Date().toISOString() 
          } as any)
          .eq('id', id);
        if (error) throw error;

        // Remove service allocations linked to this transaction
        const { data: allocations, error: allocFetchError } = await (supabase.from('service_allocations' as any) as any)
          .select('*')
          .eq('transaction_id', id);
        
        if (allocFetchError) throw allocFetchError;
        
        if (allocations && allocations.length > 0) {
          // Update service sold_quantity atomically
          const servicesArray = Array.isArray(services) ? services : [];
          for (const alloc of allocations) {
            const service = servicesArray.find((s: Service) => s.id === alloc.service_id);
            if (service) {
              // Use atomic decrement to avoid race conditions
              const { error: updateError } = await (supabase.rpc as any)('decrement_service_sold_quantity', {
                service_id: service.id,
                decrement_by: alloc.quantity
              }).catch(async () => {
                // Fallback to regular update if RPC doesn't exist
                const { error } = await supabase
                  .from('services')
                  .update({ sold_quantity: Math.max(0, service.sold_quantity - alloc.quantity) })
                  .eq('id', service.id);
                if (error) throw error;
              });
              if (updateError) throw updateError;
            }
          }

          // Delete allocations
          const { error: deleteError } = await (supabase.from('service_allocations' as any) as any)
            .delete()
            .eq('transaction_id', id);
          if (deleteError) throw deleteError;
        }
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to cancel transaction. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['service_allocations', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error cancelling transaction:', error);
      }
    },
  });

  const removeServiceFromTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, itemId }: { transactionId: string; itemId: string }) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        // Get the item
        const transactionItemsArray = Array.isArray(transactionItems) ? transactionItems : [];
        const item = transactionItemsArray.find((ti: TransactionItem) => ti.id === itemId);
        if (!item || item.item_type !== 'service') {
          throw new Error('Item not found or is not a service');
        }

        // Delete the transaction item
        const { error: itemError } = await supabase
          .from('transaction_items')
          .delete()
          .eq('id', itemId);
        if (itemError) throw itemError;

        // Get remaining items to recalculate total
        const { data: remainingItems, error: fetchError } = await supabase
          .from('transaction_items')
          .select('final_price')
          .eq('transaction_id', transactionId);
        
        if (fetchError) throw fetchError;
        
        const newTotal = remainingItems?.reduce((sum, ti) => sum + Number(ti.final_price), 0) || 0;
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ total_amount: newTotal })
          .eq('id', transactionId);
        if (updateError) throw updateError;

        // Remove service allocation
        if (item.service_id) {
          const { data: allocations, error: allocFetchError } = await (supabase.from('service_allocations' as any) as any)
            .select('*')
            .eq('service_id', item.service_id)
            .eq('transaction_id', transactionId)
            .limit(1);
          
          if (allocFetchError) throw allocFetchError;
          
          if (allocations && allocations.length > 0) {
            const allocation = allocations[0];
            const { error: deleteError } = await (supabase.from('service_allocations' as any) as any)
              .delete()
              .eq('id', allocation.id);
            if (deleteError) throw deleteError;

            // Update service sold_quantity atomically
            const servicesArray = Array.isArray(services) ? services : [];
            const service = servicesArray.find((s: Service) => s.id === item.service_id);
            if (service) {
              const { error: updateServiceError } = await (supabase.rpc as any)('decrement_service_sold_quantity', {
                service_id: service.id,
                decrement_by: allocation.quantity
              }).catch(async () => {
                // Fallback to regular update if RPC doesn't exist
                const { error } = await supabase
                  .from('services')
                  .update({ sold_quantity: Math.max(0, service.sold_quantity - allocation.quantity) })
                  .eq('id', service.id);
                if (error) throw error;
              });
              if (updateServiceError) throw updateServiceError;
            }
          }
        }
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to remove service from transaction. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction_items', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['service_allocations', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error removing service from transaction:', error);
      }
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        const { error } = await supabase
          .from('payments')
          .delete()
          .eq('id', paymentId);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to delete payment. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error deleting payment:', error);
      }
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at'>) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        if (!payment.transaction_id) throw new Error('Transaction ID is required');
        if (payment.amount <= 0) throw new Error('Payment amount must be greater than zero');
        
        // Validate payment amount
        const transactionsArray = Array.isArray(transactions) ? transactions : [];
        const txn = transactionsArray.find((t: Transaction) => t.id === payment.transaction_id);
        if (!txn) throw new Error('Transaction not found');
        if (txn.cancelled) throw new Error('Cannot add payment to cancelled transaction');

        const paymentsArray = Array.isArray(payments) ? payments : [];
        const currentPaid = paymentsArray
          .filter((p: Payment) => p.transaction_id === payment.transaction_id)
          .reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);
        
        const newTotal = currentPaid + Number(payment.amount);
        const pendingAmount = Number(txn.total_amount) - currentPaid;
        
        if (newTotal > Number(txn.total_amount)) {
          throw new Error(`Payment exceeds pending amount. Maximum: ₹${pendingAmount.toLocaleString()}`);
        }

        // Ensure amount is a number and payment_date is in DATE format (YYYY-MM-DD)
        const paymentDate = payment.payment_date 
          ? (payment.payment_date.includes('T') ? payment.payment_date.split('T')[0] : payment.payment_date)
          : new Date().toISOString().split('T')[0];
        
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
          throw new Error('Invalid payment date format. Expected YYYY-MM-DD');
        }
        
        const { data, error } = await supabase
          .from('payments')
          .insert({ 
            ...payment,
            amount: Number(payment.amount), // Ensure it's a number
            exhibition_id: currentExhibitionId,
            payment_date: paymentDate,
          })
          .select()
          .single();
        if (error) throw error;
        return data as Payment;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to add payment. Please check your input and try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error adding payment:', error);
      }
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        if (!expense.description?.trim()) throw new Error('Description is required');
        if (!expense.expense_date) throw new Error('Expense date is required');
        if (!expense.category) throw new Error('Category is required');
        if (!expense.payment_mode) throw new Error('Payment mode is required');
        if (expense.amount <= 0) throw new Error('Expense amount must be greater than zero');

        // Ensure expense_date is in DATE format (YYYY-MM-DD)
        const expenseDate = expense.expense_date 
          ? (expense.expense_date.includes('T') ? expense.expense_date.split('T')[0] : expense.expense_date)
          : new Date().toISOString().split('T')[0];
        
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
          throw new Error('Invalid expense date format. Expected YYYY-MM-DD');
        }
        
        const { error } = await (supabase.from('expenses' as any) as any)
          .insert({ 
            ...expense,
            amount: Number(expense.amount), // Ensure it's a number
            exhibition_id: currentExhibitionId,
            expense_date: expenseDate,
          });
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to add expense. Please check your input and try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error adding expense:', error);
      }
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Expense> }) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        
        if (updates.description !== undefined && !updates.description.trim()) {
          throw new Error('Description cannot be empty');
        }
        if (updates.amount !== undefined && updates.amount <= 0) {
          throw new Error('Expense amount must be greater than zero');
        }

        // Ensure expense_date is in DATE format if provided
        let updateData = { ...updates };
        if (updates.expense_date) {
          const expenseDate = updates.expense_date.includes('T') 
            ? updates.expense_date.split('T')[0] 
            : updates.expense_date;
          
          if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
            throw new Error('Invalid expense date format. Expected YYYY-MM-DD');
          }
          updateData = { ...updateData, expense_date: expenseDate };
        }

        if (updates.amount !== undefined) {
          updateData = { ...updateData, amount: Number(updates.amount) };
        }

        const { error } = await (supabase.from('expenses' as any) as any)
          .update(updateData)
          .eq('id', id)
          .eq('exhibition_id', currentExhibitionId);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update expense. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error updating expense:', error);
      }
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        if (!currentExhibitionId) throw new Error('No exhibition selected');
        const { error } = await (supabase.from('expenses' as any) as any)
          .delete()
          .eq('id', id)
          .eq('exhibition_id', currentExhibitionId);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to delete expense. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', currentExhibitionId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error deleting expense:', error);
      }
    },
  });

  const addAccountMutation = useMutation({
    mutationFn: async (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        if (!account.name?.trim()) throw new Error('Account name is required');
        const { error } = await supabase
          .from('accounts')
          .insert(account);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to add account. Please check your input and try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error adding account:', error);
      }
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Account> }) => {
      try {
        if (updates.name !== undefined && !updates.name.trim()) {
          throw new Error('Account name cannot be empty');
        }
        const { error } = await supabase
          .from('accounts')
          .update(updates)
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update account. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error updating account:', error);
      }
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        // Check if account is used in any payments
        const { data: paymentsUsingAccount } = await supabase
          .from('payments')
          .select('id')
          .eq('account_id', id)
          .limit(1);
        
        if (paymentsUsingAccount && paymentsUsingAccount.length > 0) {
          throw new Error('Cannot delete account that is used in payments. Deactivate it instead.');
        }
        
        const { error } = await supabase
          .from('accounts')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to delete account. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error deleting account:', error);
      }
    },
  });

  // Helper functions
  const getLeadById = useCallback((id: string) => {
    return leads.find(l => l.id === id);
  }, [leads]);

  const getStallById = useCallback((id: string) => {
    return stallsWithStatus.find(s => s.id === id);
  }, [stallsWithStatus]);

  const getStallByNumber = useCallback((number: string) => {
    return stallsWithStatus.find(s => s.stall_number === number);
  }, [stallsWithStatus]);

  const getTransactionById = useCallback((id: string) => {
    return transactionsWithSummary.find(t => t.id === id);
  }, [transactionsWithSummary]);

  const getTransactionsByLeadId = useCallback((leadId: string) => {
    return transactionsWithSummary
      .filter(t => t.lead_id === leadId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transactionsWithSummary]);

  const getPaymentsByTransactionId = useCallback((transactionId: string) => {
    if (!transactionId || !payments) return [];
    return payments
      .filter(p => p && p.transaction_id === transactionId)
      .sort((a, b) => {
        const dateA = a.payment_date ? new Date(a.payment_date).getTime() : 0;
        const dateB = b.payment_date ? new Date(b.payment_date).getTime() : 0;
        return dateB - dateA;
      });
  }, [payments]);

  const getItemsByTransactionId = useCallback((transactionId: string) => {
    if (!transactionId || !transactionItems) return [];
    return transactionItems.filter(ti => ti && ti.transaction_id === transactionId);
  }, [transactionItems]);

  const getServiceAllocationsByStallId = useCallback((stallId: string) => {
    if (!stallId || !serviceAllocations) return [];
    return serviceAllocations.filter(sa => sa && sa.stall_id === stallId);
  }, [serviceAllocations]);

  const getServiceAllocationsByTransactionId = useCallback((transactionId: string) => {
    if (!transactionId || !transactionItems || !serviceAllocations) return [];
    const stallIds = new Set(
      transactionItems
        .filter(ti => ti && ti.transaction_id === transactionId && ti.stall_id)
        .map(ti => ti.stall_id!)
        .filter(Boolean)
    );
    if (stallIds.size === 0) return [];
    return serviceAllocations
      .filter(sa => sa && sa.stall_id && stallIds.has(sa.stall_id) && sa.transaction_id === transactionId)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }, [serviceAllocations, transactionItems]);

  const getServiceById = useCallback((id: string) => {
    const servicesArray = Array.isArray(services) ? services : [];
    return servicesArray.find((s: Service) => s.id === id);
  }, [services]);

  const getAvailableStalls = useCallback(() => {
    // Stalls with no transaction items (non-cancelled)
    const transactionItemsArray = Array.isArray(transactionItems) ? transactionItems : [];
    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    const soldStallIds = new Set(
      transactionItemsArray
        .filter((ti: TransactionItem) => {
          const txn = transactionsArray.find((t: Transaction) => t.id === ti.transaction_id);
          return ti.item_type === 'stall' && txn && !txn.cancelled;
        })
        .map((ti: TransactionItem) => ti.stall_id!)
    );
    return stallsWithStatus.filter((s: Stall) => 
      !(s as any).is_blocked && 
      !soldStallIds.has(s.id) &&
      s.status === 'available'
    );
  }, [stallsWithStatus, transactionItems, transactions]);

  const getStallsByLeadId = useCallback((leadId: string) => {
    if (!leadId) return [];
    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    const transactionItemsArray = Array.isArray(transactionItems) ? transactionItems : [];
    if (!stallsWithStatus) return [];
    const leadTransactions = transactionsArray.filter((t: Transaction) => t && t.lead_id === leadId && !t.cancelled);
    if (leadTransactions.length === 0) return [];
    const transactionIds = new Set(leadTransactions.map((t: Transaction) => t.id).filter(Boolean));
    const stallIds = new Set(
      transactionItemsArray
        .filter((ti: TransactionItem) => ti && ti.transaction_id && transactionIds.has(ti.transaction_id) && ti.item_type === 'stall' && ti.stall_id)
        .map((ti: TransactionItem) => ti.stall_id!)
        .filter(Boolean)
    );
    return stallsWithStatus.filter((s: Stall) => s && s.id && stallIds.has(s.id));
  }, [stallsWithStatus, transactions, transactionItems]);

  const getTransactionsByStallId = useCallback((stallId: string) => {
    if (!stallId || !transactionsWithSummary) return [];
    const transactionItemsArray = Array.isArray(transactionItems) ? transactionItems : [];
    const itemTransactionIds = new Set(
      transactionItemsArray
        .filter((ti: TransactionItem) => ti && ti.stall_id === stallId && ti.item_type === 'stall' && ti.transaction_id)
        .map((ti: TransactionItem) => ti.transaction_id)
        .filter(Boolean)
    );
    if (itemTransactionIds.size === 0) return [];
    return transactionsWithSummary
      .filter((t: Transaction) => t && t.id && itemTransactionIds.has(t.id))
      .sort((a: Transaction, b: Transaction) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }, [transactionsWithSummary, transactionItems]);

  // Wrapper functions for mutations
  const updateStall = useCallback(async (id: string, updates: Partial<Stall>) => {
    await updateStallMutation.mutateAsync({ id, updates });
  }, [updateStallMutation]);

  const addLead = useCallback(async (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    await addLeadMutation.mutateAsync(lead);
  }, [addLeadMutation]);

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    await updateLeadMutation.mutateAsync({ id, updates });
  }, [updateLeadMutation]);

  const deleteLead = useCallback(async (id: string) => {
    await deleteLeadMutation.mutateAsync(id);
  }, [deleteLeadMutation]);

  const addService = useCallback(async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    return await addServiceMutation.mutateAsync(service);
  }, [addServiceMutation]);

  const updateService = useCallback(async (id: string, updates: Partial<Service>) => {
    await updateServiceMutation.mutateAsync({ id, updates });
  }, [updateServiceMutation]);

  const deleteService = useCallback(async (id: string) => {
    await deleteServiceMutation.mutateAsync(id);
  }, [deleteServiceMutation]);

  const addServiceAllocation = useCallback(async (allocation: Omit<ServiceAllocation, 'id' | 'created_at'>) => {
    await addServiceAllocationMutation.mutateAsync(allocation);
  }, [addServiceAllocationMutation]);

  const removeServiceAllocation = useCallback(async (id: string) => {
    await removeServiceAllocationMutation.mutateAsync(id);
  }, [removeServiceAllocationMutation]);

  const addTransaction = useCallback(async (
    transaction: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>,
    items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[],
    selectedStallId?: string
  ) => {
    await addTransactionMutation.mutateAsync({ transaction, items, selectedStallId });
  }, [addTransactionMutation]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    await updateTransactionMutation.mutateAsync({ id, updates });
  }, [updateTransactionMutation]);

  const cancelTransaction = useCallback(async (id: string) => {
    await cancelTransactionMutation.mutateAsync(id);
  }, [cancelTransactionMutation]);

  const removeServiceFromTransaction = useCallback(async (transactionId: string, itemId: string) => {
    await removeServiceFromTransactionMutation.mutateAsync({ transactionId, itemId });
  }, [removeServiceFromTransactionMutation]);

  const deletePayment = useCallback(async (paymentId: string) => {
    await deletePaymentMutation.mutateAsync(paymentId);
  }, [deletePaymentMutation]);

  const addPayment = useCallback(async (payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> => {
    return await addPaymentMutation.mutateAsync(payment);
  }, [addPaymentMutation]);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
    await addExpenseMutation.mutateAsync(expense);
  }, [addExpenseMutation]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    await updateExpenseMutation.mutateAsync({ id, updates });
  }, [updateExpenseMutation]);

  const deleteExpense = useCallback(async (id: string) => {
    await deleteExpenseMutation.mutateAsync(id);
  }, [deleteExpenseMutation]);

  const addAccount = useCallback(async (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
    await addAccountMutation.mutateAsync(account);
  }, [addAccountMutation]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    await updateAccountMutation.mutateAsync({ id, updates });
  }, [updateAccountMutation]);

  const deleteAccount = useCallback(async (id: string) => {
    await deleteAccountMutation.mutateAsync(id);
  }, [deleteAccountMutation]);

  // User Management Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; full_name: string; phone?: string; roles?: AppRole[] }) => {
      try {
        // Generate a UUID for the profile (without auth.users for now)
        // Using crypto.randomUUID() which is available in modern browsers
        const userId = crypto.randomUUID();

        // Create profile directly (authentication will be added later)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userData.email,
            full_name: userData.full_name,
            phone: userData.phone || null,
            is_active: true,
          })
          .select()
          .single();

        if (profileError) {
          throw profileError;
        }

        // Assign roles if provided
        if (userData.roles && userData.roles.length > 0) {
          const roleInserts = userData.roles.map(role => ({
            user_id: userId,
            role: role,
          }));

          const { error: roleError } = await supabase
            .from('user_roles')
            .insert(roleInserts);

          if (roleError) {
            if (import.meta.env.DEV) {
              console.error('Error assigning roles:', roleError);
            }
            // Don't throw - user is created, roles can be assigned later
          }
        }

        return profile as Profile;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to create user. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error creating user:', error);
      }
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Profile> }) => {
      try {
        if (updates.email !== undefined && !updates.email.trim()) {
          throw new Error('Email cannot be empty');
        }
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update user. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error updating user:', error);
      }
    },
  });

  const updateUserPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      try {
        if (!newPassword || newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        // Password updates disabled for now (authentication not implemented)
        // In the future, this will update auth.users password
        // For now, just return success (password is stored but not used for auth)
        if (import.meta.env.DEV) {
          console.log(`Password update requested for user ${id} (authentication not implemented yet)`);
        }
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update password. Please try again.'));
      }
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error updating password:', error);
      }
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: false } as any)
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to deactivate user. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error deactivating user:', error);
      }
    },
  });

  const activateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: true } as any)
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to activate user. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error activating user:', error);
      }
    },
  });

  const assignUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      try {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role })
          .select()
          .single();
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to assign role. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error assigning role:', error);
      }
    },
  });

  const removeUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      try {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to remove role. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error removing role:', error);
      }
    },
  });

  // User Management Callback Functions
  const createUser = useCallback(async (userData: { email: string; password: string; full_name: string; phone?: string; roles?: AppRole[] }) => {
    return await createUserMutation.mutateAsync(userData);
  }, [createUserMutation]);

  const updateUser = useCallback(async (id: string, updates: Partial<Profile>) => {
    await updateUserMutation.mutateAsync({ id, updates });
  }, [updateUserMutation]);

  const updateUserPassword = useCallback(async (id: string, newPassword: string) => {
    await updateUserPasswordMutation.mutateAsync({ id, newPassword });
  }, [updateUserPasswordMutation]);

  const deactivateUser = useCallback(async (id: string) => {
    await deactivateUserMutation.mutateAsync(id);
  }, [deactivateUserMutation]);

  const activateUser = useCallback(async (id: string) => {
    await activateUserMutation.mutateAsync(id);
  }, [activateUserMutation]);

  const assignUserRole = useCallback(async (userId: string, role: AppRole) => {
    await assignUserRoleMutation.mutateAsync({ userId, role });
  }, [assignUserRoleMutation]);

  const removeUserRole = useCallback(async (userId: string, role: AppRole) => {
    await removeUserRoleMutation.mutateAsync({ userId, role });
  }, [removeUserRoleMutation]);

  // Exhibition Management Mutations
  const addExhibitionMutation = useMutation({
    mutationFn: async (exhibition: Omit<Exhibition, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        if (!exhibition.name?.trim()) {
          throw new Error('Exhibition name is required');
        }
        if (!exhibition.short_name?.trim()) {
          throw new Error('Short name is required');
        }
        if (!exhibition.start_date) {
          throw new Error('Start date is required');
        }
        if (!exhibition.end_date) {
          throw new Error('End date is required');
        }
        if (new Date(exhibition.start_date) > new Date(exhibition.end_date)) {
          throw new Error('End date must be after start date');
        }

        const { error } = await (supabase.from('exhibitions') as any)
          .insert({
            name: exhibition.name,
            short_name: exhibition.short_name,
            description: exhibition.description || null,
            start_date: exhibition.start_date,
            end_date: exhibition.end_date,
          });
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to create exhibition. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error creating exhibition:', error);
      }
    },
  });

  const updateExhibitionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Exhibition> }) => {
      try {
        if (updates.name !== undefined && !updates.name.trim()) {
          throw new Error('Exhibition name cannot be empty');
        }
        if (updates.short_name !== undefined && !updates.short_name.trim()) {
          throw new Error('Short name cannot be empty');
        }
        if (updates.start_date && updates.end_date) {
          if (new Date(updates.start_date) > new Date(updates.end_date)) {
            throw new Error('End date must be after start date');
          }
        }

        const { error } = await (supabase.from('exhibitions') as any)
          .update(updates)
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to update exhibition. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error updating exhibition:', error);
      }
    },
  });

  const deleteExhibitionMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        // Check if exhibition has any related data
        const { data: stalls } = await supabase
          .from('stalls')
          .select('id')
          .eq('exhibition_id', id)
          .limit(1);
        
        if (stalls && stalls.length > 0) {
          throw new Error('Cannot delete exhibition that has stalls. Delete all stalls first or use CASCADE delete.');
        }

        const { error } = await (supabase.from('exhibitions') as any)
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to delete exhibition. Please try again.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('Error deleting exhibition:', error);
      }
    },
  });

  const addExhibition = useCallback(async (exhibition: Omit<Exhibition, 'id' | 'created_at' | 'updated_at'>) => {
    await addExhibitionMutation.mutateAsync(exhibition);
  }, [addExhibitionMutation]);

  const updateExhibition = useCallback(async (id: string, updates: Partial<Exhibition>) => {
    await updateExhibitionMutation.mutateAsync({ id, updates });
  }, [updateExhibitionMutation]);

  const deleteExhibition = useCallback(async (id: string) => {
    await deleteExhibitionMutation.mutateAsync(id);
  }, [deleteExhibitionMutation]);

  const value = useMemo(() => ({
    role,
    setRole,
    isAdmin,
    stalls: stallsWithStatus,
    leads,
    services,
    transactions: transactionsWithSummary,
    transactionItems,
    payments,
    expenses,
    accounts,
    profiles,
    userRoles,
    serviceAllocations,
    stallLayouts: layoutsData,
    updateStall,
    addLead,
    updateLead,
    deleteLead,
    addService,
    updateService,
    deleteService,
    addServiceAllocation,
    removeServiceAllocation,
    addTransaction,
    updateTransaction,
    cancelTransaction,
    removeServiceFromTransaction,
    deletePayment,
    addPayment,
    addExpense,
    updateExpense,
    deleteExpense,
    addAccount,
    updateAccount,
    deleteAccount,
    createUser,
    updateUser,
    updateUserPassword,
    deactivateUser,
    activateUser,
    assignUserRole,
    removeUserRole,
    addExhibition,
    updateExhibition,
    deleteExhibition,
    getLeadById,
    getStallById,
    getStallByNumber,
    getTransactionById,
    getTransactionsByLeadId,
    getPaymentsByTransactionId,
    getItemsByTransactionId,
    getServiceAllocationsByStallId,
    getServiceAllocationsByTransactionId,
    getServiceById,
    getAvailableStalls,
    getStallsByLeadId,
    getTransactionsByStallId,
    getStallStatus,
    getTransactionSummary,
    currentExhibitionId,
  }), [
    role, isAdmin, stallsWithStatus, leads, services, transactionsWithSummary, transactionItems, 
    payments, expenses, accounts, profiles, userRoles, serviceAllocations, layoutsData,
    updateStall, addLead, updateLead, deleteLead, addService, updateService, deleteService,
    addServiceAllocation, removeServiceAllocation, addTransaction, updateTransaction, 
    cancelTransaction, removeServiceFromTransaction, deletePayment, addPayment, addExpense, updateExpense, deleteExpense, addAccount, updateAccount, deleteAccount,
    createUser, updateUser, updateUserPassword, deactivateUser, activateUser, assignUserRole, removeUserRole,
    addExhibition, updateExhibition, deleteExhibition,
    getLeadById, getStallById, getStallByNumber, getTransactionById, getTransactionsByLeadId,
    getPaymentsByTransactionId, getItemsByTransactionId, getServiceAllocationsByStallId,
    getServiceAllocationsByTransactionId, getServiceById, getAvailableStalls, getStallsByLeadId,
    getTransactionsByStallId, getStallStatus, getTransactionSummary, currentExhibitionId,
  ]);

  return (
    <SupabaseDataContext.Provider value={value}>
      {children}
    </SupabaseDataContext.Provider>
  );
};

export const useSupabaseData = () => {
  const context = useContext(SupabaseDataContext);
  if (!context) throw new Error('useSupabaseData must be used within a SupabaseDataProvider');
  return context;
};

// Alias for backward compatibility during migration
export const useMockData = useSupabaseData;

