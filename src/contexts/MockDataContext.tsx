import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
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
  allocateStallToLead: (stallId: string, leadId: string) => void;
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addService: (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addServiceAllocation: (allocation: Omit<ServiceAllocation, 'id' | 'created_at'>) => void;
  removeServiceAllocation: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>, items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[]) => void;
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
  getServiceById: (id: string) => Service | undefined;
  getAvailableStalls: () => Stall[];
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

  const updateStall = useCallback((id: string, updates: Partial<Stall>) => {
    setStalls(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s));
  }, []);

  const allocateStallToLead = useCallback((stallId: string, leadId: string) => {
    setStalls(prev => prev.map(s => s.id === stallId ? { ...s, lead_id: leadId, status: 'reserved' as StallStatus, updated_at: new Date().toISOString() } : s));
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

  const addService = useCallback((service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    const newService: Service = { ...service, id: `service-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setServices(prev => [...prev, newService]);
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

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>, items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[]) => {
    const txnId = `txn-${Date.now()}`;
    const txnNumber = `TXN-2024-${String(transactions.length + 1).padStart(3, '0')}`;
    const newTransaction: Transaction = { ...transaction, id: txnId, transaction_number: txnNumber, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const newItems: TransactionItem[] = items.map((item, idx) => ({ ...item, id: `item-${Date.now()}-${idx}`, transaction_id: txnId, created_at: new Date().toISOString() }));
    setTransactions(prev => [...prev, newTransaction]);
    setTransactionItems(prev => [...prev, ...newItems]);
    items.forEach(item => { if (item.stall_id) { updateStall(item.stall_id, { status: transaction.payment_status === 'paid' ? 'sold' : 'pending' }); } });
    updateLead(transaction.lead_id, { status: 'converted' });
  }, [transactions.length, updateStall, updateLead]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (updates.payment_status) {
        transactionItems.filter(i => i.transaction_id === id).forEach(item => {
          if (item.stall_id) updateStall(item.stall_id, { status: updates.payment_status === 'paid' ? 'sold' : 'pending' });
        });
      }
      return { ...t, ...updates, updated_at: new Date().toISOString() };
    }));
  }, [transactionItems, updateStall]);

  const addPayment = useCallback((payment: Omit<Payment, 'id' | 'created_at'>) => {
    const newPayment: Payment = { ...payment, id: `pay-${Date.now()}`, created_at: new Date().toISOString() };
    setPayments(prev => [...prev, newPayment]);
    const transaction = transactions.find(t => t.id === payment.transaction_id);
    if (transaction) {
      const totalPaid = payments.filter(p => p.transaction_id === payment.transaction_id).reduce((sum, p) => sum + p.amount, 0) + payment.amount;
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

  const getLeadById = useCallback((id: string) => leads.find(l => l.id === id), [leads]);
  const getStallById = useCallback((id: string) => stalls.find(s => s.id === id), [stalls]);
  const getStallByNumber = useCallback((number: string) => stalls.find(s => s.stall_number === number), [stalls]);
  const getTransactionById = useCallback((id: string) => transactions.find(t => t.id === id), [transactions]);
  const getTransactionsByLeadId = useCallback((leadId: string) => transactions.filter(t => t.lead_id === leadId), [transactions]);
  const getPaymentsByTransactionId = useCallback((txnId: string) => payments.filter(p => p.transaction_id === txnId), [payments]);
  const getItemsByTransactionId = useCallback((txnId: string) => transactionItems.filter(i => i.transaction_id === txnId), [transactionItems]);
  const getServiceAllocationsByStallId = useCallback((stallId: string) => serviceAllocations.filter(a => a.stall_id === stallId), [serviceAllocations]);
  const getServiceById = useCallback((id: string) => services.find(s => s.id === id), [services]);
  const getAvailableStalls = useCallback(() => stalls.filter(s => s.status === 'available'), [stalls]);

  const value = useMemo(() => ({
    role, setRole, isAdmin, stalls, leads, services, transactions, transactionItems, payments, accounts, serviceAllocations,
    updateStall, allocateStallToLead, addLead, updateLead, deleteLead, addService, updateService, deleteService,
    addServiceAllocation, removeServiceAllocation, addTransaction, updateTransaction, addPayment, addAccount, updateAccount,
    getLeadById, getStallById, getStallByNumber, getTransactionById, getTransactionsByLeadId, getPaymentsByTransactionId,
    getItemsByTransactionId, getServiceAllocationsByStallId, getServiceById, getAvailableStalls,
  }), [role, isAdmin, stalls, leads, services, transactions, transactionItems, payments, accounts, serviceAllocations,
    updateStall, allocateStallToLead, addLead, updateLead, deleteLead, addService, updateService, deleteService,
    addServiceAllocation, removeServiceAllocation, addTransaction, updateTransaction, addPayment, addAccount, updateAccount,
    getLeadById, getStallById, getStallByNumber, getTransactionById, getTransactionsByLeadId, getPaymentsByTransactionId,
    getItemsByTransactionId, getServiceAllocationsByStallId, getServiceById, getAvailableStalls]);

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (!context) throw new Error('useMockData must be used within a MockDataProvider');
  return context;
};
