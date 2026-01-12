import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useExhibition } from './ExhibitionContext';
import { EXHIBITION_DATASETS, ExhibitionDataset } from '@/lib/multiExhibitionData';
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
  // Exhibition info
  currentExhibitionId: string;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

// Deep clone helper to prevent cross-exhibition data pollution
const cloneDataset = (dataset: ExhibitionDataset): ExhibitionDataset => ({
  stalls: JSON.parse(JSON.stringify(dataset.stalls)),
  leads: JSON.parse(JSON.stringify(dataset.leads)),
  services: JSON.parse(JSON.stringify(dataset.services)),
  transactions: JSON.parse(JSON.stringify(dataset.transactions)),
  transactionItems: JSON.parse(JSON.stringify(dataset.transactionItems)),
  payments: JSON.parse(JSON.stringify(dataset.payments)),
  accounts: JSON.parse(JSON.stringify(dataset.accounts)),
  serviceAllocations: JSON.parse(JSON.stringify(dataset.serviceAllocations)),
});

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentExhibition } = useExhibition();
  const [role, setRole] = useState<AppRole>('admin');
  
  // Store datasets per exhibition - keyed by exhibition ID
  const [exhibitionDatasets, setExhibitionDatasets] = useState<Record<string, ExhibitionDataset>>(() => {
    // Initialize with cloned datasets for each exhibition
    const datasets: Record<string, ExhibitionDataset> = {};
    Object.keys(EXHIBITION_DATASETS).forEach(key => {
      datasets[key] = cloneDataset(EXHIBITION_DATASETS[key]);
    });
    return datasets;
  });

  // Get current exhibition's dataset
  const currentDataset = exhibitionDatasets[currentExhibition.id] || cloneDataset(EXHIBITION_DATASETS[currentExhibition.id]);
  
  const { stalls, leads, services, transactions, transactionItems, payments, accounts, serviceAllocations } = currentDataset;

  const isAdmin = role === 'admin';
  const currentExhibitionId = currentExhibition.id;

  // Helper to update current exhibition's dataset
  const updateDataset = useCallback((updater: (dataset: ExhibitionDataset) => ExhibitionDataset) => {
    setExhibitionDatasets(prev => ({
      ...prev,
      [currentExhibitionId]: updater(prev[currentExhibitionId] || currentDataset),
    }));
  }, [currentExhibitionId, currentDataset]);

  // Derive stall statuses from transaction payment status
  useEffect(() => {
    updateDataset(dataset => {
      const newStalls = dataset.stalls.map(stall => {
        const txnItem = dataset.transactionItems.find(ti => ti.stall_id === stall.id);
        if (!txnItem) {
          if (stall.status !== 'blocked') {
            return { ...stall, status: 'available' as StallStatus };
          }
          return stall;
        }

        const txn = dataset.transactions.find(t => t.id === txnItem.transaction_id);
        if (!txn) return stall;

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
            newStatus = 'reserved';
            break;
        }

        if (stall.status !== newStatus) {
          return { ...stall, status: newStatus, updated_at: new Date().toISOString() };
        }
        return stall;
      });

      if (JSON.stringify(newStalls) !== JSON.stringify(dataset.stalls)) {
        return { ...dataset, stalls: newStalls };
      }
      return dataset;
    });
  }, [transactions, transactionItems, updateDataset]);

  const updateStall = useCallback((id: string, updates: Partial<Stall>) => {
    updateDataset(dataset => ({
      ...dataset,
      stalls: dataset.stalls.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s),
    }));
  }, [updateDataset]);

  const addLead = useCallback((lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    const newLead: Lead = { ...lead, id: `${currentExhibitionId}-lead-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    updateDataset(dataset => ({
      ...dataset,
      leads: [...dataset.leads, newLead],
    }));
  }, [updateDataset, currentExhibitionId]);

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    updateDataset(dataset => ({
      ...dataset,
      leads: dataset.leads.map(l => l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l),
    }));
  }, [updateDataset]);

  const deleteLead = useCallback((id: string) => {
    updateDataset(dataset => ({
      ...dataset,
      leads: dataset.leads.filter(l => l.id !== id),
    }));
  }, [updateDataset]);

  const addService = useCallback((service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Service => {
    const newService: Service = { ...service, id: `${currentExhibitionId}-service-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    updateDataset(dataset => ({
      ...dataset,
      services: [...dataset.services, newService],
    }));
    return newService;
  }, [updateDataset, currentExhibitionId]);

  const updateService = useCallback((id: string, updates: Partial<Service>) => {
    updateDataset(dataset => ({
      ...dataset,
      services: dataset.services.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s),
    }));
  }, [updateDataset]);

  const deleteService = useCallback((id: string) => {
    updateDataset(dataset => ({
      ...dataset,
      services: dataset.services.filter(s => s.id !== id),
      serviceAllocations: dataset.serviceAllocations.filter(a => a.service_id !== id),
    }));
  }, [updateDataset]);

  const addServiceAllocation = useCallback((allocation: Omit<ServiceAllocation, 'id' | 'created_at'>) => {
    const newAllocation: ServiceAllocation = { ...allocation, id: `${currentExhibitionId}-alloc-${Date.now()}`, created_at: new Date().toISOString() };
    updateDataset(dataset => ({
      ...dataset,
      serviceAllocations: [...dataset.serviceAllocations, newAllocation],
      services: dataset.services.map(s => s.id === allocation.service_id ? { ...s, sold_quantity: s.sold_quantity + allocation.quantity } : s),
    }));
  }, [updateDataset, currentExhibitionId]);

  const removeServiceAllocation = useCallback((id: string) => {
    updateDataset(dataset => {
      const allocation = dataset.serviceAllocations.find(a => a.id === id);
      if (!allocation) return dataset;
      return {
        ...dataset,
        serviceAllocations: dataset.serviceAllocations.filter(a => a.id !== id),
        services: dataset.services.map(s => s.id === allocation.service_id ? { ...s, sold_quantity: Math.max(0, s.sold_quantity - allocation.quantity) } : s),
      };
    });
  }, [updateDataset]);

  const addTransaction = useCallback((
    transaction: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>, 
    items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[],
    selectedStallId?: string
  ) => {
    const txnId = `${currentExhibitionId}-txn-${Date.now()}`;
    
    updateDataset(dataset => {
      const txnNumber = `TXN-${currentExhibitionId.toUpperCase().substring(0, 4)}-${String(dataset.transactions.length + 1).padStart(3, '0')}`;
      const newTransaction: Transaction = { 
        ...transaction, 
        id: txnId, 
        transaction_number: txnNumber, 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      };
      const newItems: TransactionItem[] = items.map((item, idx) => ({ 
        ...item, 
        id: `${currentExhibitionId}-item-${Date.now()}-${idx}`, 
        transaction_id: txnId, 
        created_at: new Date().toISOString() 
      }));
      
      // Auto-allocate services to stall
      let targetStallId: string | null = null;
      if (selectedStallId) {
        targetStallId = selectedStallId;
      } else {
        const firstStallItem = newItems.find(item => item.item_type === 'stall' && item.stall_id);
        if (firstStallItem && firstStallItem.stall_id) {
          targetStallId = firstStallItem.stall_id;
        }
      }
      
      let newAllocations = [...dataset.serviceAllocations];
      let newServices = [...dataset.services];
      
      if (targetStallId) {
        const serviceItems = newItems.filter(item => item.item_type === 'service' && item.service_id);
        serviceItems.forEach((serviceItem, idx) => {
          if (serviceItem.service_id) {
            const timestamp = new Date().toISOString();
            const newAllocation: ServiceAllocation = {
              id: `${currentExhibitionId}-alloc-${txnId}-${idx}`,
              service_id: serviceItem.service_id,
              stall_id: targetStallId!,
              quantity: 1,
              created_at: timestamp
            };
            newAllocations.push(newAllocation);
            newServices = newServices.map(s => s.id === serviceItem.service_id ? { ...s, sold_quantity: s.sold_quantity + 1 } : s);
          }
        });
      }
      
      // Mark lead as converted
      const newLeads = dataset.leads.map(l => {
        if (l.id === transaction.lead_id && l.status !== 'converted') {
          return { ...l, status: 'converted' as LeadStatus };
        }
        return l;
      });

      return {
        ...dataset,
        transactions: [...dataset.transactions, newTransaction],
        transactionItems: [...dataset.transactionItems, ...newItems],
        serviceAllocations: newAllocations,
        services: newServices,
        leads: newLeads,
      };
    });
  }, [updateDataset, currentExhibitionId]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    updateDataset(dataset => ({
      ...dataset,
      transactions: dataset.transactions.map(t => 
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      ),
    }));
  }, [updateDataset]);

  const addPayment = useCallback((payment: Omit<Payment, 'id' | 'created_at'>) => {
    const newPayment: Payment = { ...payment, id: `${currentExhibitionId}-pay-${Date.now()}`, created_at: new Date().toISOString() };
    
    updateDataset(dataset => {
      const transaction = dataset.transactions.find(t => t.id === payment.transaction_id);
      if (!transaction) {
        return { ...dataset, payments: [...dataset.payments, newPayment] };
      }
      
      const currentPayments = dataset.payments.filter(p => p.transaction_id === payment.transaction_id);
      const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0) + payment.amount;
      const newStatus: PaymentStatus = totalPaid >= transaction.total_amount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
      
      return {
        ...dataset,
        payments: [...dataset.payments, newPayment],
        transactions: dataset.transactions.map(t => 
          t.id === payment.transaction_id ? { ...t, amount_paid: totalPaid, payment_status: newStatus, updated_at: new Date().toISOString() } : t
        ),
      };
    });
  }, [updateDataset, currentExhibitionId]);

  const addAccount = useCallback((account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
    updateDataset(dataset => ({
      ...dataset,
      accounts: [...dataset.accounts, { ...account, id: `${currentExhibitionId}-account-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
    }));
  }, [updateDataset, currentExhibitionId]);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    updateDataset(dataset => ({
      ...dataset,
      accounts: dataset.accounts.map(a => a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a),
    }));
  }, [updateDataset]);

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
    const leadTransactions = sortedTransactions.filter(t => t.lead_id === leadId);
    const stallItemIds = new Set<string>();
    leadTransactions.forEach(txn => {
      const items = transactionItems.filter(i => i.transaction_id === txn.id && i.item_type === 'stall' && i.stall_id);
      items.forEach(item => {
        if (item.stall_id) stallItemIds.add(item.stall_id);
      });
    });
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
    const stallIds = new Set<string>();
    const txnItems = transactionItems.filter(i => i.transaction_id === transactionId && i.stall_id);
    txnItems.forEach(item => {
      if (item.stall_id) stallIds.add(item.stall_id);
    });
    return sortedServiceAllocations.filter(a => stallIds.has(a.stall_id));
  }, [sortedServiceAllocations, transactionItems]);

  const value = useMemo(() => ({
    role, setRole, isAdmin, stalls, leads: sortedLeads, services, transactions: sortedTransactions, transactionItems, payments: sortedPayments, accounts, serviceAllocations: sortedServiceAllocations,
    updateStall, addLead, updateLead, deleteLead, addService, updateService, deleteService,
    addServiceAllocation, removeServiceAllocation, addTransaction, updateTransaction, addPayment, addAccount, updateAccount,
    getLeadById, getStallById, getStallByNumber, getTransactionById, getTransactionsByLeadId, getPaymentsByTransactionId,
    getItemsByTransactionId, getServiceAllocationsByStallId, getServiceAllocationsByTransactionId, getServiceById, getAvailableStalls, getStallsByLeadId, getTransactionsByStallId,
    currentExhibitionId,
  }), [role, isAdmin, stalls, sortedLeads, services, sortedTransactions, transactionItems, sortedPayments, accounts, sortedServiceAllocations,
    updateStall, addLead, updateLead, deleteLead, addService, updateService, deleteService,
    addServiceAllocation, removeServiceAllocation, addTransaction, updateTransaction, addPayment, addAccount, updateAccount,
    getLeadById, getStallById, getStallByNumber, getTransactionById, getTransactionsByLeadId, getPaymentsByTransactionId,
    getItemsByTransactionId, getServiceAllocationsByStallId, getServiceAllocationsByTransactionId, getServiceById, getAvailableStalls, getStallsByLeadId, getTransactionsByStallId,
    currentExhibitionId]);

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (!context) throw new Error('useMockData must be used within a MockDataProvider');
  return context;
};
