import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useExhibition } from './ExhibitionContext';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';
import { 
  Stall, Lead, Service, Transaction, TransactionItem, Payment, Account, 
  StallStatus, LeadStatus, PaymentStatus, ServiceAllocation, StallLayout,
  Profile, UserRole, AppRole, Exhibition, Expense, InternalLedger, ExpenseCategoryItem
} from '@/types/database';

interface DataContextType {
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
  expenseCategories: ExpenseCategoryItem[];
  addExpenseCategory: (name: string) => Promise<void>;
  accounts: Account[];
  internalLedger: InternalLedger[];
  profiles: Profile[];
  userRoles: UserRole[];
  serviceAllocations: ServiceAllocation[];
  stallLayouts: StallLayout[];
  updateStall: (id: string, updates: Partial<Stall>) => Promise<void>;
  addStall: (stall: { stall_number: string; zone: string; base_rent: number; notes?: string }) => Promise<void>;
  deleteStall: (id: string) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addService: (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Promise<Service>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addServiceAllocation: (allocation: Omit<ServiceAllocation, 'id' | 'created_at'>) => Promise<void>;
  removeServiceAllocation: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>, items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[], selectedStallId?: string) => Promise<{ transaction: Transaction; items: TransactionItem[]; lead: Lead }>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  cancelTransaction: (id: string) => Promise<void>;
  removeServiceFromTransaction: (transactionId: string, itemId: string) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<Payment>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addInternalTransaction: (entry: Omit<InternalLedger, 'id' | 'created_at' | 'settled_at' | 'status'>) => Promise<void>;
  settleInternalTransaction: (id: string) => Promise<void>;
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

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentExhibition } = useExhibition();
  const { user: authUser } = useAuth();
  const authRole = authUser?.roles?.includes('admin') ? 'admin' : 'maintainer';
  const [role, setRole] = useState<AppRole>(authRole);
  const queryClient = useQueryClient();
  const currentExhibitionId = currentExhibition?.id || '';
  const isAdmin = role === 'admin';

  useEffect(() => {
    setRole(authRole);
  }, [authRole]);

  // Fetch stalls (backend joins stall_layouts, returns position_x/y, width, height)
  const { data: stallsRaw = [] } = useQuery({
    queryKey: ['stalls', currentExhibitionId],
    queryFn: async () => {
      const data = await api.get<any[]>('/stalls', { exhibition_id: currentExhibitionId });
      return (data || []).map((stall: any) => ({
        ...stall,
        base_rent: Number(stall.base_rent),
        exhibition_id: stall.exhibition_id || currentExhibitionId,
        is_blocked: stall.is_blocked || false,
        position_x: stall.position_x ?? 0,
        position_y: stall.position_y ?? 0,
        width: stall.width ?? 1,
        height: stall.height ?? 1,
      })) as Stall[];
    },
    enabled: !!currentExhibitionId,
  });

  // Build stallLayouts from the stall data for backwards compatibility
  const stallLayouts = useMemo(() => {
    return stallsRaw
      .filter((s: any) => s && s.id)
      .map((s: any) => ({
        id: s.id,
        stall_id: s.id,
        position_x: s.position_x ?? 0,
        position_y: s.position_y ?? 0,
        width: s.width ?? 1,
        height: s.height ?? 1,
        created_at: s.created_at,
        updated_at: s.updated_at,
      })) as StallLayout[];
  }, [stallsRaw]);

  // Fetch other data
  const { data: leads = [] } = useQuery({
    queryKey: ['leads', currentExhibitionId],
    queryFn: async () => {
      return await api.get<Lead[]>('/leads', { exhibition_id: currentExhibitionId });
    },
    enabled: !!currentExhibitionId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', currentExhibitionId],
    queryFn: async () => {
      const data = await api.get<any[]>('/services', { exhibition_id: currentExhibitionId });
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
      const data = await api.get<any[]>('/transactions', { exhibition_id: currentExhibitionId });
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
      const data = await api.get<any[]>('/transaction-items', { exhibition_id: currentExhibitionId });
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
      const data = await api.get<any[]>('/payments', { exhibition_id: currentExhibitionId });
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
      const data = await api.get<any[]>('/expenses', { exhibition_id: currentExhibitionId });
      return (data || []).map((e: any) => ({
        ...e,
        amount: Number(e.amount),
      })) as Expense[];
    },
    enabled: !!currentExhibitionId,
  });

  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['expense_categories', currentExhibitionId],
    queryFn: async () => {
      const data = await api.get<ExpenseCategoryItem[]>('/expense-categories', { exhibition_id: currentExhibitionId });
      return data || [];
    },
    enabled: !!currentExhibitionId,
  });

  const { data: internalLedger = [] } = useQuery({
    queryKey: ['internal_ledger', currentExhibitionId],
    queryFn: async () => {
      const data = await api.get<any[]>('/internal-ledger', { exhibition_id: currentExhibitionId });
      return (data || []).map((entry: any) => ({
        ...entry,
        amount: Number(entry.amount),
      })) as InternalLedger[];
    },
    enabled: !!currentExhibitionId,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      return await api.get<Account[]>('/accounts');
    },
  });

  // GET /users returns { profiles, roles }
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      return await api.get<{ profiles: Profile[]; roles: UserRole[] }>('/users');
    },
  });

  const profiles = usersData?.profiles ?? [];
  const userRoles = usersData?.roles ?? [];

  const { data: serviceAllocations = [] } = useQuery({
    queryKey: ['service_allocations', currentExhibitionId],
    queryFn: async () => {
      return await api.get<ServiceAllocation[]>('/service-allocations', { exhibition_id: currentExhibitionId });
    },
    enabled: !!currentExhibitionId,
  });

  // Derive stall status from transactions and payments
  const getStallStatus = useCallback((stallId: string): StallStatus => {
    if (!stallId) return 'available';
    const stallArray = Array.isArray(stallsRaw) ? stallsRaw : [];
    const stall = stallArray.find((s: Stall) => s.id === stallId);
    if (!stall) return 'available';
    if ((stall as any).is_blocked) return 'blocked';

    const transactionItemsArray = Array.isArray(transactionItems) ? transactionItems : [];
    const txnItem = transactionItemsArray.find((ti: TransactionItem) => 
      ti.stall_id === stallId && 
      ti.item_type === 'stall'
    );
    if (!txnItem) return 'available';

    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    const txn = transactionsArray.find((t: Transaction) => t.id === txnItem.transaction_id);
    if (!txn || txn.cancelled) return 'available';

    const paymentsArray = Array.isArray(payments) ? payments : [];
    const totalPaid = paymentsArray
      .filter((p: Payment) => p && p.transaction_id === txn.id)
      .reduce((sum: number, p: Payment) => sum + (Number(p.amount) || 0), 0);

    if (totalPaid >= Number(txn.total_amount || 0)) return 'sold';
    if (totalPaid > 0) return 'pending';
    return 'reserved';
  }, [stallsRaw, transactionItems, transactions, payments]);

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
    const stallsArray = Array.isArray(stallsRaw) ? stallsRaw : [];
    if (!stallsArray || stallsArray.length === 0) return [];
    return stallsArray
      .filter((stall: Stall) => stall && stall.id)
      .map((stall: Stall) => ({
        ...stall,
        status: getStallStatus(stall.id),
      }));
  }, [stallsRaw, getStallStatus]);

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
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      await api.put(`/stalls/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
    },
  });

  const addStallMutation = useMutation({
    mutationFn: async (stall: { stall_number: string; zone: string; base_rent: number; notes?: string }) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      await api.post('/stalls', { ...stall, exhibition_id: currentExhibitionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
    },
  });

  const deleteStallMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/stalls/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
    },
  });

  const addLeadMutation = useMutation({
    mutationFn: async (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      if (!lead.name?.trim()) throw new Error('Lead name is required');
      if (!lead.phone?.trim()) throw new Error('Phone number is required');
      await api.post('/leads', { ...lead, exhibition_id: currentExhibitionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', currentExhibitionId] });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      await api.put(`/leads/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', currentExhibitionId] });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      const hasTransactions = transactions.some(t => t.lead_id === id);
      if (hasTransactions) {
        throw new Error('Cannot delete lead with existing transactions. Please cancel transactions first.');
      }
      await api.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', currentExhibitionId] });
    },
  });

  const addServiceMutation = useMutation({
    mutationFn: async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      if (!service.name?.trim()) throw new Error('Service name is required');
      if (service.price < 0) throw new Error('Service price cannot be negative');
      if (service.quantity < 0) throw new Error('Service quantity cannot be negative');
      const data = await api.post<any>('/services', { ...service, exhibition_id: currentExhibitionId });
      return {
        ...data,
        price: Number(data.price),
        quantity: Number(data.quantity),
        sold_quantity: Number(data.sold_quantity),
      } as Service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Service> }) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      if (updates.price !== undefined && updates.price < 0) throw new Error('Service price cannot be negative');
      if (updates.quantity !== undefined && updates.quantity < 0) throw new Error('Service quantity cannot be negative');
      if (updates.sold_quantity !== undefined && updates.sold_quantity < 0) throw new Error('Sold quantity cannot be negative');
      await api.put(`/services/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      const hasAllocations = serviceAllocations.some(a => a.service_id === id);
      if (hasAllocations) {
        throw new Error('Cannot delete service with existing allocations. Please remove allocations first.');
      }
      await api.delete(`/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
    },
  });

  const addServiceAllocationMutation = useMutation({
    mutationFn: async (allocation: Omit<ServiceAllocation, 'id' | 'created_at'>) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      if (!allocation.service_id) throw new Error('Service ID is required');
      if (!allocation.stall_id) throw new Error('Stall ID is required');
      if (!allocation.transaction_id) throw new Error('Transaction ID is required');
      if (allocation.quantity < 1) throw new Error('Quantity must be at least 1');
      await api.post('/service-allocations', { ...allocation, exhibition_id: currentExhibitionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_allocations', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
    },
  });

  const removeServiceAllocationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      await api.delete(`/service-allocations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_allocations', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
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
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      if (!transaction.lead_id) throw new Error('Lead is required');
      if (!items || items.length === 0) throw new Error('At least one item is required');
      if (transaction.total_amount < 0) throw new Error('Transaction total cannot be negative');

      for (const item of items) {
        if (item.item_type === 'stall' && !item.stall_id) throw new Error('Stall ID is required for stall items');
        if (item.item_type === 'service' && !item.service_id) throw new Error('Service ID is required for service items');
        if (item.final_price < 0) throw new Error('Item price cannot be negative');
      }

      const { amount_paid, payment_status, lead, ...transactionData } = transaction;
      return await api.post<{ transaction: Transaction; items: TransactionItem[]; lead: Lead }>(
        '/transactions',
        { ...transactionData, items, selectedStallId, exhibition_id: currentExhibitionId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['transaction_items', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['service_allocations', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['leads', currentExhibitionId] });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      if (updates.total_amount !== undefined && updates.total_amount <= 0) {
        throw new Error('Transaction total must be greater than zero');
      }
      const { amount_paid, payment_status, lead, ...updateData } = updates;
      await api.put(`/transactions/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
    },
  });

  const cancelTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      await api.post(`/transactions/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['service_allocations', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
    },
  });

  const removeServiceFromTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, itemId }: { transactionId: string; itemId: string }) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      await api.delete(`/transactions/${transactionId}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction_items', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['service_allocations', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['services', currentExhibitionId] });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      await api.delete(`/payments/${paymentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at'>) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      if (!payment.transaction_id) throw new Error('Transaction ID is required');
      if (payment.amount <= 0) throw new Error('Payment amount must be greater than zero');

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

      const paymentDate = payment.payment_date 
        ? (payment.payment_date.includes('T') ? payment.payment_date.split('T')[0] : payment.payment_date)
        : new Date().toISOString().split('T')[0];
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
        throw new Error('Invalid payment date format. Expected YYYY-MM-DD');
      }

      return await api.post<Payment>('/payments', {
        ...payment,
        amount: Number(payment.amount),
        exhibition_id: currentExhibitionId,
        payment_date: paymentDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', currentExhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stalls', currentExhibitionId] });
    },
  });

  const addExpenseCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      if (!name?.trim()) throw new Error('Category name is required');
      await api.post('/expense-categories', { name: name.trim(), exhibition_id: currentExhibitionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense_categories', currentExhibitionId] });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      if (!expense.description?.trim()) throw new Error('Description is required');
      if (!expense.expense_date) throw new Error('Expense date is required');
      if (!expense.category) throw new Error('Category is required');
      if (!expense.payment_mode) throw new Error('Payment mode is required');
      if (expense.amount <= 0) throw new Error('Expense amount must be greater than zero');

      const expenseDate = expense.expense_date 
        ? (expense.expense_date.includes('T') ? expense.expense_date.split('T')[0] : expense.expense_date)
        : new Date().toISOString().split('T')[0];
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
        throw new Error('Invalid expense date format. Expected YYYY-MM-DD');
      }

      await api.post('/expenses', {
        ...expense,
        amount: Number(expense.amount),
        exhibition_id: currentExhibitionId,
        expense_date: expenseDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', currentExhibitionId] });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Expense> }) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      
      if (updates.description !== undefined && !updates.description.trim()) {
        throw new Error('Description cannot be empty');
      }
      if (updates.amount !== undefined && updates.amount <= 0) {
        throw new Error('Expense amount must be greater than zero');
      }

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

      await api.put(`/expenses/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', currentExhibitionId] });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      await api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', currentExhibitionId] });
    },
  });

  const addInternalTransactionMutation = useMutation({
    mutationFn: async (entry: Omit<InternalLedger, 'id' | 'created_at' | 'settled_at' | 'status'>) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      if (!entry.from_name?.trim()) throw new Error('From name is required');
      if (!entry.to_name?.trim()) throw new Error('To name is required');
      if (!entry.amount || entry.amount <= 0) throw new Error('Amount must be greater than zero');
      await api.post('/internal-ledger', {
        ...entry,
        exhibition_id: currentExhibitionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal_ledger', currentExhibitionId] });
    },
  });

  const settleInternalTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!currentExhibitionId) throw new Error('No exhibition selected');
      await api.post(`/internal-ledger/${id}/settle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal_ledger', currentExhibitionId] });
    },
  });

  const addAccountMutation = useMutation({
    mutationFn: async (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
      if (!account.name?.trim()) throw new Error('Account name is required');
      await api.post('/accounts', account);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Account> }) => {
      if (updates.name !== undefined && !updates.name.trim()) {
        throw new Error('Account name cannot be empty');
      }
      await api.put(`/accounts/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
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

  const addStall = useCallback(async (stall: { stall_number: string; zone: string; base_rent: number; notes?: string }) => {
    await addStallMutation.mutateAsync(stall);
  }, [addStallMutation]);

  const deleteStall = useCallback(async (id: string) => {
    await deleteStallMutation.mutateAsync(id);
  }, [deleteStallMutation]);

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
  ): Promise<{ transaction: Transaction; items: TransactionItem[]; lead: Lead }> => {
    return await addTransactionMutation.mutateAsync({ transaction, items, selectedStallId });
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

  const addExpenseCategory = useCallback(async (name: string) => {
    await addExpenseCategoryMutation.mutateAsync(name);
  }, [addExpenseCategoryMutation]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    await updateExpenseMutation.mutateAsync({ id, updates });
  }, [updateExpenseMutation]);

  const deleteExpense = useCallback(async (id: string) => {
    await deleteExpenseMutation.mutateAsync(id);
  }, [deleteExpenseMutation]);

  const addInternalTransaction = useCallback(async (entry: Omit<InternalLedger, 'id' | 'created_at' | 'settled_at' | 'status'>) => {
    await addInternalTransactionMutation.mutateAsync(entry);
  }, [addInternalTransactionMutation]);

  const settleInternalTransaction = useCallback(async (id: string) => {
    await settleInternalTransactionMutation.mutateAsync(id);
  }, [settleInternalTransactionMutation]);

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
      return await api.post<Profile>('/users', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Profile> }) => {
      if (updates.email !== undefined && !updates.email.trim()) {
        throw new Error('Email cannot be empty');
      }
      await api.put(`/users/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUserPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      await api.put(`/users/${id}`, { password: newPassword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/users/${id}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const activateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/users/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const assignUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      await api.post(`/users/${userId}/roles`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const removeUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      await api.delete(`/users/${userId}/roles/${role}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
      if (!exhibition.name?.trim()) throw new Error('Exhibition name is required');
      if (!exhibition.short_name?.trim()) throw new Error('Short name is required');
      if (!exhibition.start_date) throw new Error('Start date is required');
      if (!exhibition.end_date) throw new Error('End date is required');
      if (new Date(exhibition.start_date) > new Date(exhibition.end_date)) {
        throw new Error('End date must be after start date');
      }
      await api.post('/exhibitions', exhibition);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
    },
  });

  const updateExhibitionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Exhibition> }) => {
      if (updates.name !== undefined && !updates.name.trim()) throw new Error('Exhibition name cannot be empty');
      if (updates.short_name !== undefined && !updates.short_name.trim()) throw new Error('Short name cannot be empty');
      if (updates.start_date && updates.end_date) {
        if (new Date(updates.start_date) > new Date(updates.end_date)) {
          throw new Error('End date must be after start date');
        }
      }
      await api.put(`/exhibitions/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
    },
  });

  const deleteExhibitionMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/exhibitions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
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
    expenseCategories,
    addExpenseCategory,
    accounts,
    internalLedger,
    profiles,
    userRoles,
    serviceAllocations,
    stallLayouts,
    updateStall,
    addStall,
    deleteStall,
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
    addInternalTransaction,
    settleInternalTransaction,
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
    payments, expenses, expenseCategories, accounts, internalLedger, profiles, userRoles, serviceAllocations, stallLayouts,
    updateStall, addStall, deleteStall, addLead, updateLead, deleteLead, addService, updateService, deleteService,
    addServiceAllocation, removeServiceAllocation, addTransaction, updateTransaction, 
    cancelTransaction, removeServiceFromTransaction, deletePayment, addPayment, addExpense, updateExpense, deleteExpense, addExpenseCategory,
    addInternalTransaction, settleInternalTransaction, addAccount, updateAccount, deleteAccount,
    createUser, updateUser, updateUserPassword, deactivateUser, activateUser, assignUserRole, removeUserRole,
    addExhibition, updateExhibition, deleteExhibition,
    getLeadById, getStallById, getStallByNumber, getTransactionById, getTransactionsByLeadId,
    getPaymentsByTransactionId, getItemsByTransactionId, getServiceAllocationsByStallId,
    getServiceAllocationsByTransactionId, getServiceById, getAvailableStalls, getStallsByLeadId,
    getTransactionsByStallId, getStallStatus, getTransactionSummary, currentExhibitionId,
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
