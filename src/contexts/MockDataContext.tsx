import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { 
  mockStalls as initialStalls, 
  mockLeads as initialLeads, 
  mockServices as initialServices,
  mockTransactions as initialTransactions,
  mockTransactionItems as initialTransactionItems,
  mockPayments as initialPayments,
  mockAccounts as initialAccounts,
} from '@/lib/mockData';
import { Stall, Lead, Service, Transaction, TransactionItem, Payment, Account, StallStatus, LeadStatus, PaymentStatus } from '@/types/database';

type AppRole = 'admin' | 'maintainer';

interface MockDataContextType {
  // Role management
  role: AppRole;
  setRole: (role: AppRole) => void;
  isAdmin: boolean;

  // Data
  stalls: Stall[];
  leads: Lead[];
  services: Service[];
  transactions: Transaction[];
  transactionItems: TransactionItem[];
  payments: Payment[];
  accounts: Account[];

  // Stall operations
  updateStall: (id: string, updates: Partial<Stall>) => void;

  // Lead operations
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;

  // Service operations
  addService: (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;

  // Transaction operations
  addTransaction: (transaction: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>, items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;

  // Payment operations
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => void;

  // Account operations
  addAccount: (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;

  // Helpers
  getLeadById: (id: string) => Lead | undefined;
  getStallById: (id: string) => Stall | undefined;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByLeadId: (leadId: string) => Transaction[];
  getPaymentsByTransactionId: (transactionId: string) => Payment[];
  getItemsByTransactionId: (transactionId: string) => TransactionItem[];
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

  const isAdmin = role === 'admin';

  // Stall operations
  const updateStall = useCallback((id: string, updates: Partial<Stall>) => {
    setStalls(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s));
  }, []);

  // Lead operations
  const addLead = useCallback((lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    const newLead: Lead = {
      ...lead,
      id: `lead-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLeads(prev => [...prev, newLead]);
  }, []);

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l));
  }, []);

  const deleteLead = useCallback((id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  // Service operations
  const addService = useCallback((service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    const newService: Service = {
      ...service,
      id: `service-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setServices(prev => [...prev, newService]);
  }, []);

  const updateService = useCallback((id: string, updates: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s));
  }, []);

  const deleteService = useCallback((id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  }, []);

  // Transaction operations
  const addTransaction = useCallback((
    transaction: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>,
    items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[]
  ) => {
    const txnId = `txn-${Date.now()}`;
    const txnNumber = `TXN-2024-${String(transactions.length + 1).padStart(3, '0')}`;
    
    const newTransaction: Transaction = {
      ...transaction,
      id: txnId,
      transaction_number: txnNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newItems: TransactionItem[] = items.map((item, idx) => ({
      ...item,
      id: `item-${Date.now()}-${idx}`,
      transaction_id: txnId,
      created_at: new Date().toISOString(),
    }));

    setTransactions(prev => [...prev, newTransaction]);
    setTransactionItems(prev => [...prev, ...newItems]);

    // Update stall status if a stall is included
    items.forEach(item => {
      if (item.stall_id) {
        const status: StallStatus = transaction.payment_status === 'paid' ? 'sold' : 'pending';
        updateStall(item.stall_id, { status });
      }
    });

    // Update lead status to converted
    updateLead(transaction.lead_id, { status: 'converted' });
  }, [transactions.length, updateStall, updateLead]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates, updated_at: new Date().toISOString() };
      
      // If payment status changed, update related stalls
      if (updates.payment_status) {
        const items = transactionItems.filter(i => i.transaction_id === id);
        items.forEach(item => {
          if (item.stall_id) {
            const stallStatus: StallStatus = updates.payment_status === 'paid' ? 'sold' : 'pending';
            updateStall(item.stall_id, { status: stallStatus });
          }
        });
      }
      
      return updated;
    }));
  }, [transactionItems, updateStall]);

  // Payment operations
  const addPayment = useCallback((payment: Omit<Payment, 'id' | 'created_at'>) => {
    const newPayment: Payment = {
      ...payment,
      id: `pay-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setPayments(prev => [...prev, newPayment]);

    // Update transaction amount_paid and status
    const transaction = transactions.find(t => t.id === payment.transaction_id);
    if (transaction) {
      const currentPayments = payments.filter(p => p.transaction_id === payment.transaction_id);
      const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0) + payment.amount;
      
      let newStatus: PaymentStatus = 'unpaid';
      if (totalPaid >= transaction.total_amount) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partial';
      }

      updateTransaction(payment.transaction_id, {
        amount_paid: totalPaid,
        payment_status: newStatus,
      });
    }
  }, [transactions, payments, updateTransaction]);

  // Account operations
  const addAccount = useCallback((account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
    const newAccount: Account = {
      ...account,
      id: `account-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setAccounts(prev => [...prev, newAccount]);
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a));
  }, []);

  // Helper functions
  const getLeadById = useCallback((id: string) => leads.find(l => l.id === id), [leads]);
  const getStallById = useCallback((id: string) => stalls.find(s => s.id === id), [stalls]);
  const getTransactionById = useCallback((id: string) => transactions.find(t => t.id === id), [transactions]);
  const getTransactionsByLeadId = useCallback((leadId: string) => transactions.filter(t => t.lead_id === leadId), [transactions]);
  const getPaymentsByTransactionId = useCallback((transactionId: string) => payments.filter(p => p.transaction_id === transactionId), [payments]);
  const getItemsByTransactionId = useCallback((transactionId: string) => transactionItems.filter(i => i.transaction_id === transactionId), [transactionItems]);

  const value = useMemo(() => ({
    role,
    setRole,
    isAdmin,
    stalls,
    leads,
    services,
    transactions,
    transactionItems,
    payments,
    accounts,
    updateStall,
    addLead,
    updateLead,
    deleteLead,
    addService,
    updateService,
    deleteService,
    addTransaction,
    updateTransaction,
    addPayment,
    addAccount,
    updateAccount,
    getLeadById,
    getStallById,
    getTransactionById,
    getTransactionsByLeadId,
    getPaymentsByTransactionId,
    getItemsByTransactionId,
  }), [
    role, isAdmin, stalls, leads, services, transactions, transactionItems, payments, accounts,
    updateStall, addLead, updateLead, deleteLead, addService, updateService, deleteService,
    addTransaction, updateTransaction, addPayment, addAccount, updateAccount,
    getLeadById, getStallById, getTransactionById, getTransactionsByLeadId, getPaymentsByTransactionId, getItemsByTransactionId,
  ]);

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
};
