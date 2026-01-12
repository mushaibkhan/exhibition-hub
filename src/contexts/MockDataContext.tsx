import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { 
  mockStalls as initialStalls, 
  mockLeads as initialLeads, 
  mockServices as initialServices,
  mockTransactions as initialTransactions,
  mockTransactionItems as initialTransactionItems,
  mockPayments as initialPayments,
  mockAccounts as initialAccounts,
  mockServiceAllocations as initialServiceAllocations,
} from '@/lib/mockData';
import { Stall, Lead, Service, Transaction, TransactionItem, Payment, Account, StallStatus, LeadStatus, PaymentStatus, ServiceAllocation } from '@/types/database';

type AppRole = 'admin' | 'maintainer';

interface MockDataContextType {
  role: AppRole;
  setRole: (role: AppRole) => void;
  isAdmin: boolean;
  stalls: Stall[];
  leads: Lead[];
  services: Service[];
  transactions: Transaction[];
  transactionItems: TransactionItem[];
  payments: Payment[];
  accounts: Account[];
  serviceAllocations: ServiceAllocation[];
  updateStall: (id: string, updates: Partial<Stall>) => void;
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addService: (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Service;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addServiceAllocation: (allocation: Omit<ServiceAllocation, 'id' | 'created_at'>) => void;
  removeServiceAllocation: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>, items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[], selectedStallId?: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => void;
  addAccount: (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
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
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<AppRole>('admin');
  const [stalls, setStalls] = useState<Stall[]>(initialStalls);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>(initialTransactionItems);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [serviceAllocations, setServiceAllocations] = useState<ServiceAllocation[]>(initialServiceAllocations);

  const isAdmin = role === 'admin';

  // Derive stall statuses from transaction payment status
  // This runs whenever transactions, transactionItems, or payments change
  useEffect(() => {
    setStalls(prevStalls => {
      return prevStalls.map(stall => {
        // Find if this stall is in any transaction
        const txnItem = transactionItems.find(ti => ti.stall_id === stall.id);
        if (!txnItem) {
          // Stall not in any transaction - keep as available or blocked
          if (stall.status !== 'blocked') {
            return { ...stall, status: 'available' as StallStatus };
          }
          return stall;
        }

        // Find the transaction
        const txn = transactions.find(t => t.id === txnItem.transaction_id);
        if (!txn) return stall;

        // Derive stall status from transaction payment status
        let newStatus: StallStatus;
        switch (txn.payment_status) {
          case 'paid':
            newStatus = 'sold';
            break;
          case 'partial':
            newStatus = 'pending';
            break;
          case 'unpaid':
          default:
            newStatus = 'reserved'; // Reserved = in transaction but unpaid
            break;
        }

        if (stall.status !== newStatus) {
          return { ...stall, status: newStatus, updated_at: new Date().toISOString() };
        }
        return stall;
      });
    });
  }, [transactions, transactionItems]);

  const updateStall = useCallback((id: string, updates: Partial<Stall>) => {
    setStalls(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s));
  }, []);

  const addLead = useCallback((lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    const newLead: Lead = { ...lead, id: `lead-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setLeads(prev => [...prev, newLead]);
  }, []);

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l));
  }, []);

  const deleteLead = useCallback((id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  const addService = useCallback((service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Service => {
    const newService: Service = { ...service, id: `service-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setServices(prev => [...prev, newService]);
    return newService;
  }, []);

  const updateService = useCallback((id: string, updates: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s));
  }, []);

  const deleteService = useCallback((id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    setServiceAllocations(prev => prev.filter(a => a.service_id !== id));
  }, []);

  const addServiceAllocation = useCallback((allocation: Omit<ServiceAllocation, 'id' | 'created_at'>) => {
    const newAllocation: ServiceAllocation = { ...allocation, id: `alloc-${Date.now()}`, created_at: new Date().toISOString() };
    setServiceAllocations(prev => [...prev, newAllocation]);
    setServices(prev => prev.map(s => s.id === allocation.service_id ? { ...s, sold_quantity: s.sold_quantity + allocation.quantity } : s));
  }, []);

  const removeServiceAllocation = useCallback((id: string) => {
    const allocation = serviceAllocations.find(a => a.id === id);
    if (allocation) {
      setServices(prev => prev.map(s => s.id === allocation.service_id ? { ...s, sold_quantity: Math.max(0, s.sold_quantity - allocation.quantity) } : s));
    }
    setServiceAllocations(prev => prev.filter(a => a.id !== id));
  }, [serviceAllocations]);

  const addTransaction = useCallback((
    transaction: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>, 
    items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[],
    selectedStallId?: string
  ) => {
    const txnId = `txn-${Date.now()}`;
    const txnNumber = `TXN-2024-${String(transactions.length + 1).padStart(3, '0')}`;
    const newTransaction: Transaction = { 
      ...transaction, 
      id: txnId, 
      transaction_number: txnNumber, 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    };
    const newItems: TransactionItem[] = items.map((item, idx) => ({ 
      ...item, 
      id: `item-${Date.now()}-${idx}`, 
      transaction_id: txnId, 
      created_at: new Date().toISOString() 
    }));
    
    setTransactions(prev => [...prev, newTransaction]);
    setTransactionItems(prev => [...prev, ...newItems]);
    
    // Auto-allocate services to stall
    // Priority: 1) selectedStallId (service-only transaction), 2) first stall item in transaction
    let targetStallId: string | null = null;
    if (selectedStallId) {
      targetStallId = selectedStallId;
    } else {
      const firstStallItem = newItems.find(item => item.item_type === 'stall' && item.stall_id);
      if (firstStallItem && firstStallItem.stall_id) {
        targetStallId = firstStallItem.stall_id;
      }
    }
    
    if (targetStallId) {
      const serviceItems = newItems.filter(item => item.item_type === 'service' && item.service_id);
      serviceItems.forEach((serviceItem, idx) => {
        if (serviceItem.service_id) {
          const timestamp = new Date().toISOString();
          const newAllocation: ServiceAllocation = {
            id: `alloc-${txnId}-${idx}`,
            service_id: serviceItem.service_id,
            stall_id: targetStallId!,
            quantity: 1,
            created_at: timestamp
          };
          setServiceAllocations(prev => [...prev, newAllocation]);
          // Update service sold_quantity
          setServices(prev => prev.map(s => s.id === serviceItem.service_id ? { ...s, sold_quantity: s.sold_quantity + 1 } : s));
        }
      });
    }
    
    // Mark lead as converted only if not already converted
    setLeads(prevLeads => {
      const currentLead = prevLeads.find(l => l.id === transaction.lead_id);
      if (currentLead && currentLead.status !== 'converted') {
        return prevLeads.map(l => l.id === transaction.lead_id ? { ...l, status: 'converted' as LeadStatus } : l);
      }
      return prevLeads;
    });
  }, [transactions.length]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
    ));
  }, []);

  const addPayment = useCallback((payment: Omit<Payment, 'id' | 'created_at'>) => {
    const newPayment: Payment = { ...payment, id: `pay-${Date.now()}`, created_at: new Date().toISOString() };
    setPayments(prev => [...prev, newPayment]);
    
    // Update transaction payment status
    const transaction = transactions.find(t => t.id === payment.transaction_id);
    if (transaction) {
      const currentPayments = payments.filter(p => p.transaction_id === payment.transaction_id);
      const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0) + payment.amount;
      const newStatus: PaymentStatus = totalPaid >= transaction.total_amount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
      updateTransaction(payment.transaction_id, { amount_paid: totalPaid, payment_status: newStatus });
    }
  }, [transactions, payments, updateTransaction]);

  const addAccount = useCallback((account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
    setAccounts(prev => [...prev, { ...account, id: `account-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a));
  }, []);

  // Sort leads by created_at DESC (newest first)
  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [leads]);

  // Sort transactions by created_at DESC (newest first)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transactions]);

  // Sort payments by created_at DESC (newest first)
  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [payments]);

  // Sort service allocations by created_at DESC (newest first)
  const sortedServiceAllocations = useMemo(() => {
    return [...serviceAllocations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [serviceAllocations]);

  const getLeadById = useCallback((id: string) => sortedLeads.find(l => l.id === id), [sortedLeads]);
  const getStallById = useCallback((id: string) => stalls.find(s => s.id === id), [stalls]);
  const getStallByNumber = useCallback((number: string) => stalls.find(s => s.stall_number === number), [stalls]);
  const getTransactionById = useCallback((id: string) => sortedTransactions.find(t => t.id === id), [sortedTransactions]);
  const getTransactionsByLeadId = useCallback((leadId: string) => sortedTransactions.filter(t => t.lead_id === leadId), [sortedTransactions]);
  const getPaymentsByTransactionId = useCallback((txnId: string) => sortedPayments.filter(p => p.transaction_id === txnId), [sortedPayments]);
  const getItemsByTransactionId = useCallback((txnId: string) => transactionItems.filter(i => i.transaction_id === txnId), [transactionItems]);
  const getServiceAllocationsByStallId = useCallback((stallId: string) => sortedServiceAllocations.filter(a => a.stall_id === stallId), [sortedServiceAllocations]);
  const getServiceById = useCallback((id: string) => services.find(s => s.id === id), [services]);
  const getAvailableStalls = useCallback(() => stalls.filter(s => s.status === 'available'), [stalls]);
  const getStallsByLeadId = useCallback((leadId: string) => {
    // Find all transactions for this lead
    const leadTransactions = sortedTransactions.filter(t => t.lead_id === leadId);
    // Get all transaction items that are stalls
    const stallItemIds = new Set<string>();
    leadTransactions.forEach(txn => {
      const items = transactionItems.filter(i => i.transaction_id === txn.id && i.item_type === 'stall' && i.stall_id);
      items.forEach(item => {
        if (item.stall_id) stallItemIds.add(item.stall_id);
      });
    });
    // Get unique stalls and sort by stall_number
    const leadStalls = Array.from(stallItemIds)
      .map(stallId => stalls.find(s => s.id === stallId))
      .filter((s): s is Stall => s !== undefined)
      .sort((a, b) => a.stall_number.localeCompare(b.stall_number));
    return leadStalls;
  }, [sortedTransactions, transactionItems, stalls]);

  const getTransactionsByStallId = useCallback((stallId: string) => {
    const items = transactionItems.filter(i => i.stall_id === stallId);
    const txnIds = new Set(items.map(i => i.transaction_id));
    return sortedTransactions.filter(t => txnIds.has(t.id));
  }, [sortedTransactions, transactionItems]);

  const getServiceAllocationsByTransactionId = useCallback((transactionId: string) => {
    // Get stall IDs from transaction items
    const stallIds = new Set<string>();
    const txnItems = transactionItems.filter(i => i.transaction_id === transactionId && i.stall_id);
    txnItems.forEach(item => {
      if (item.stall_id) stallIds.add(item.stall_id);
    });
    // Get service allocations for those stalls that were created as part of this transaction
    // We can't directly link allocations to transactions, so we return all allocations for the stalls in this transaction
    // The caller can filter by created_at if needed
    return sortedServiceAllocations.filter(a => stallIds.has(a.stall_id));
  }, [sortedServiceAllocations, transactionItems]);

  const value = useMemo(() => ({
    role, setRole, isAdmin, stalls, leads: sortedLeads, services, transactions: sortedTransactions, transactionItems, payments: sortedPayments, accounts, serviceAllocations: sortedServiceAllocations,
    updateStall, addLead, updateLead, deleteLead, addService, updateService, deleteService,
    addServiceAllocation, removeServiceAllocation, addTransaction, updateTransaction, addPayment, addAccount, updateAccount,
    getLeadById, getStallById, getStallByNumber, getTransactionById, getTransactionsByLeadId, getPaymentsByTransactionId,
    getItemsByTransactionId, getServiceAllocationsByStallId, getServiceAllocationsByTransactionId, getServiceById, getAvailableStalls, getStallsByLeadId, getTransactionsByStallId,
  }), [role, isAdmin, stalls, sortedLeads, services, sortedTransactions, transactionItems, sortedPayments, accounts, sortedServiceAllocations,
    updateStall, addLead, updateLead, deleteLead, addService, updateService, deleteService,
    addServiceAllocation, removeServiceAllocation, addTransaction, updateTransaction, addPayment, addAccount, updateAccount,
    getLeadById, getStallById, getStallByNumber, getTransactionById, getTransactionsByLeadId, getPaymentsByTransactionId,
    getItemsByTransactionId, getServiceAllocationsByStallId, getServiceAllocationsByTransactionId, getServiceById, getAvailableStalls, getStallsByLeadId, getTransactionsByStallId]);

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (!context) throw new Error('useMockData must be used within a MockDataProvider');
  return context;
};
