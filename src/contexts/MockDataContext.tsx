import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useExhibition } from './ExhibitionContext';
import { EXHIBITION_DATASETS, ExhibitionDataset, generateExhibitionData } from '@/lib/multiExhibitionData';
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
  cancelTransaction: (id: string) => void;
  removeServiceFromTransaction: (transactionId: string, itemId: string) => void;
  deletePayment: (paymentId: string) => void;
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
  currentExhibitionId: string;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

// Deep clone helper to prevent cross-exhibition data pollution
const cloneDataset = (dataset: ExhibitionDataset): ExhibitionDataset => {
  return JSON.parse(JSON.stringify(dataset));
};

// Initialize datasets for all exhibitions
const initializeAllDatasets = (): Record<string, ExhibitionDataset> => {
  const datasets: Record<string, ExhibitionDataset> = {};
  Object.keys(EXHIBITION_DATASETS).forEach(key => {
    datasets[key] = cloneDataset(EXHIBITION_DATASETS[key]);
  });
  return datasets;
};

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentExhibition } = useExhibition();
  const [role, setRole] = useState<AppRole>('admin');
  
  // Store ALL datasets - each exhibition has its own isolated copy
  const [allDatasets, setAllDatasets] = useState<Record<string, ExhibitionDataset>>(initializeAllDatasets);
  
  // Track exhibition ID for change detection
  const currentExhibitionId = currentExhibition.id;
  const prevExhibitionIdRef = useRef(currentExhibitionId);
  
  // Log when exhibition changes
  useEffect(() => {
    if (prevExhibitionIdRef.current !== currentExhibitionId) {
      console.log(`[MockData] Exhibition changed: ${prevExhibitionIdRef.current} -> ${currentExhibitionId}`);
      prevExhibitionIdRef.current = currentExhibitionId;
    }
  }, [currentExhibitionId]);

  // Get the current exhibition's dataset - this is the key to isolation
  // When allDatasets changes (via updateCurrentDataset), this memo recalculates,
  // causing the destructured arrays (transactions, transactionItems, payments, etc.) to update,
  // which triggers dependent useEffects and re-renders throughout the app
  const currentDataset = useMemo(() => {
    const dataset = allDatasets[currentExhibitionId];
    if (!dataset) {
      console.warn(`[MockData] No dataset found for ${currentExhibitionId}, generating new one`);
      return cloneDataset(generateExhibitionData(currentExhibitionId));
    }
    return dataset;
  }, [allDatasets, currentExhibitionId]);

  // Destructure ONLY from current exhibition's dataset
  const { stalls, leads, services, transactions, transactionItems, payments, accounts, serviceAllocations } = currentDataset;
  
  const isAdmin = role === 'admin';

  // Helper to update ONLY the current exhibition's dataset
  const updateCurrentDataset = useCallback((updater: (dataset: ExhibitionDataset) => ExhibitionDataset) => {
    setAllDatasets(prev => {
      const currentData = prev[currentExhibitionId] || cloneDataset(EXHIBITION_DATASETS[currentExhibitionId]);
      const updatedData = updater(currentData);
      return {
        ...prev,
        [currentExhibitionId]: updatedData,
      };
    });
  }, [currentExhibitionId]);

  // Derive stall statuses from transaction payment status - scoped to current exhibition
  // Reactive chain: allDatasets change → currentDataset memo recalculates → transactions/transactionItems/payments change → useEffect runs → stall statuses update
  useEffect(() => {
    updateCurrentDataset(dataset => {
      let hasChanges = false;
      const newStalls = dataset.stalls.map(stall => {
        // Find transaction items for this stall, excluding cancelled transactions
        const txnItem = dataset.transactionItems.find(ti => {
          if (ti.stall_id !== stall.id) return false;
          const txn = dataset.transactions.find(t => t.id === ti.transaction_id);
          return txn && !txn.cancelled;
        });
        if (!txnItem) {
          if (stall.status !== 'blocked' && stall.status !== 'available') {
            hasChanges = true;
            return { ...stall, status: 'available' as StallStatus };
          }
          return stall;
        }

        const txn = dataset.transactions.find(t => t.id === txnItem.transaction_id);
        if (!txn || txn.cancelled) return stall;

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
          hasChanges = true;
          return { ...stall, status: newStatus, updated_at: new Date().toISOString() };
        }
        return stall;
      });

      if (hasChanges) {
        return { ...dataset, stalls: newStalls };
      }
      return dataset;
    });
  }, [currentExhibitionId, transactions, transactionItems, payments, updateCurrentDataset]);

  const updateStall = useCallback((id: string, updates: Partial<Stall>) => {
    updateCurrentDataset(dataset => ({
      ...dataset,
      stalls: dataset.stalls.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s),
    }));
  }, [updateCurrentDataset]);

  const addLead = useCallback((lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    const newLead: Lead = { 
      ...lead, 
      id: `${currentExhibitionId}_lead_${Date.now()}`, 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    };
    updateCurrentDataset(dataset => ({
      ...dataset,
      leads: [...dataset.leads, newLead],
    }));
  }, [updateCurrentDataset, currentExhibitionId]);

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    updateCurrentDataset(dataset => ({
      ...dataset,
      leads: dataset.leads.map(l => l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l),
    }));
  }, [updateCurrentDataset]);

  const deleteLead = useCallback((id: string) => {
    updateCurrentDataset(dataset => ({
      ...dataset,
      leads: dataset.leads.filter(l => l.id !== id),
    }));
  }, [updateCurrentDataset]);

  const addService = useCallback((service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Service => {
    const newService: Service = { 
      ...service, 
      id: `${currentExhibitionId}_service_${Date.now()}`, 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    };
    updateCurrentDataset(dataset => ({
      ...dataset,
      services: [...dataset.services, newService],
    }));
    return newService;
  }, [updateCurrentDataset, currentExhibitionId]);

  const updateService = useCallback((id: string, updates: Partial<Service>) => {
    updateCurrentDataset(dataset => ({
      ...dataset,
      services: dataset.services.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s),
    }));
  }, [updateCurrentDataset]);

  const deleteService = useCallback((id: string) => {
    updateCurrentDataset(dataset => ({
      ...dataset,
      services: dataset.services.filter(s => s.id !== id),
      serviceAllocations: dataset.serviceAllocations.filter(a => a.service_id !== id),
    }));
  }, [updateCurrentDataset]);

  const addServiceAllocation = useCallback((allocation: Omit<ServiceAllocation, 'id' | 'created_at'>) => {
    const newAllocation: ServiceAllocation = { 
      ...allocation, 
      id: `${currentExhibitionId}_alloc_${Date.now()}`, 
      created_at: new Date().toISOString() 
    };
    updateCurrentDataset(dataset => ({
      ...dataset,
      serviceAllocations: [...dataset.serviceAllocations, newAllocation],
      services: dataset.services.map(s => s.id === allocation.service_id ? { ...s, sold_quantity: s.sold_quantity + allocation.quantity } : s),
    }));
  }, [updateCurrentDataset, currentExhibitionId]);

  const removeServiceAllocation = useCallback((id: string) => {
    updateCurrentDataset(dataset => {
      const allocation = dataset.serviceAllocations.find(a => a.id === id);
      if (!allocation) return dataset;
      return {
        ...dataset,
        serviceAllocations: dataset.serviceAllocations.filter(a => a.id !== id),
        services: dataset.services.map(s => s.id === allocation.service_id ? { ...s, sold_quantity: Math.max(0, s.sold_quantity - allocation.quantity) } : s),
      };
    });
  }, [updateCurrentDataset]);

  const addTransaction = useCallback((
    transaction: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>, 
    items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[],
    selectedStallId?: string
  ) => {
    const txnId = `${currentExhibitionId}_txn_${Date.now()}`;
    
    updateCurrentDataset(dataset => {
      // Defensive validation: Verify all stall IDs belong to current exhibition
      const stallIdsInItems = items
        .filter(item => item.item_type === 'stall' && item.stall_id)
        .map(item => item.stall_id!);
      
      const invalidStalls = stallIdsInItems.filter(stallId => 
        !dataset.stalls.some(s => s.id === stallId)
      );
      
      // Filter out invalid items to prevent data corruption
      let validItems = items;
      if (invalidStalls.length > 0) {
        console.error(`[MockData] Invalid stall IDs for exhibition ${currentExhibitionId}:`, invalidStalls);
        validItems = items.filter(item => 
          item.item_type !== 'stall' || !item.stall_id || !invalidStalls.includes(item.stall_id)
        );
      }
      
      // Validate selectedStallId if provided (for service-only transactions)
      if (selectedStallId && !dataset.stalls.some(s => s.id === selectedStallId)) {
        console.error(`[MockData] Invalid selectedStallId for exhibition ${currentExhibitionId}:`, selectedStallId);
        // Don't proceed with invalid stall selection
        return dataset;
      }
      
      const txnNumber = `TXN-${currentExhibitionId.toUpperCase().substring(0, 4)}-${String(dataset.transactions.length + 1).padStart(4, '0')}`;
      const newTransaction: Transaction = { 
        ...transaction, 
        id: txnId, 
        transaction_number: txnNumber, 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      };
      const newItems: TransactionItem[] = validItems.map((item, idx) => ({ 
        ...item, 
        id: `${currentExhibitionId}_item_${Date.now()}_${idx}`, 
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
              id: `${currentExhibitionId}_alloc_${txnId}_${idx}`,
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
  }, [updateCurrentDataset, currentExhibitionId]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    updateCurrentDataset(dataset => ({
      ...dataset,
      transactions: dataset.transactions.map(t => 
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      ),
    }));
  }, [updateCurrentDataset]);

  const cancelTransaction = useCallback((id: string) => {
    updateCurrentDataset(dataset => {
      const transaction = dataset.transactions.find(t => t.id === id);
      if (!transaction || transaction.cancelled) return dataset;

      // Mark transaction as cancelled
      const cancelledAt = new Date().toISOString();
      const updatedTransactions = dataset.transactions.map(t => 
        t.id === id ? { ...t, cancelled: true, cancelled_at: cancelledAt, updated_at: cancelledAt } : t
      );

      // Keep transaction items for audit purposes (they show what was cancelled)
      // We don't remove them - they remain visible to show what was in the cancelled transaction
      const updatedTransactionItems = dataset.transactionItems;

      // Remove ONLY service allocations that were created as part of THIS transaction
      // Service allocations have IDs in format: `${currentExhibitionId}_alloc_${txnId}_${idx}`
      // So we can identify them by checking if the allocation ID contains this transaction ID
      const updatedServiceAllocations = dataset.serviceAllocations.filter(alloc => {
        // Check if allocation ID contains this transaction ID (format: ..._alloc_${txnId}_...)
        return !alloc.id.includes(`_alloc_${id}_`);
      });

      // Update service sold_quantity (decrease by removed allocations)
      const removedAllocations = dataset.serviceAllocations.filter(alloc => 
        !updatedServiceAllocations.some(a => a.id === alloc.id)
      );
      const updatedServices = dataset.services.map(service => {
        const removedCount = removedAllocations.filter(a => a.service_id === service.id).length;
        return removedCount > 0 
          ? { ...service, sold_quantity: Math.max(0, service.sold_quantity - removedCount) }
          : service;
      });

      return {
        ...dataset,
        transactions: updatedTransactions,
        transactionItems: updatedTransactionItems,
        serviceAllocations: updatedServiceAllocations,
        services: updatedServices,
      };
    });
  }, [updateCurrentDataset]);

  const removeServiceFromTransaction = useCallback((transactionId: string, itemId: string) => {
    updateCurrentDataset(dataset => {
      const item = dataset.transactionItems.find(i => i.id === itemId);
      if (!item || item.item_type !== 'service' || item.transaction_id !== transactionId) {
        return dataset;
      }

      const transaction = dataset.transactions.find(t => t.id === transactionId);
      if (!transaction || transaction.cancelled) return dataset;

      // Remove the service item
      const updatedTransactionItems = dataset.transactionItems.filter(i => i.id !== itemId);
      
      // Recalculate transaction total
      const newTotal = updatedTransactionItems.reduce((sum, i) => sum + i.final_price, 0);
      
      // Remove service allocation if it exists
      const updatedServiceAllocations = dataset.serviceAllocations.filter(alloc => {
        if (alloc.service_id !== item.service_id) return true;
        // Match by stall and creation time proximity
        const allocDate = new Date(alloc.created_at).getTime();
        const txnDate = new Date(transaction.created_at).getTime();
        return Math.abs(allocDate - txnDate) > 10000;
      });

      // Update service sold_quantity
      const removedAllocations = dataset.serviceAllocations.filter(alloc => 
        !updatedServiceAllocations.some(a => a.id === alloc.id)
      );
      const updatedServices = dataset.services.map(service => {
        const removedCount = removedAllocations.filter(a => a.service_id === service.id).length;
        return removedCount > 0 
          ? { ...service, sold_quantity: Math.max(0, service.sold_quantity - removedCount) }
          : service;
      });

      // Update transaction total and payment status
      const updatedTransactions = dataset.transactions.map(t => {
        if (t.id !== transactionId) return t;
        const newAmountPaid = Math.min(t.amount_paid, newTotal);
        const newPaymentStatus: PaymentStatus = newAmountPaid >= newTotal ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid';
        return {
          ...t,
          total_amount: newTotal,
          amount_paid: newAmountPaid,
          payment_status: newPaymentStatus,
          updated_at: new Date().toISOString(),
        };
      });

      return {
        ...dataset,
        transactions: updatedTransactions,
        transactionItems: updatedTransactionItems,
        serviceAllocations: updatedServiceAllocations,
        services: updatedServices,
      };
    });
  }, [updateCurrentDataset]);

  const deletePayment = useCallback((paymentId: string) => {
    updateCurrentDataset(dataset => {
      const payment = dataset.payments.find(p => p.id === paymentId);
      if (!payment) return dataset;

      const transaction = dataset.transactions.find(t => t.id === payment.transaction_id);
      if (!transaction || transaction.cancelled) return dataset;

      // Remove payment
      const updatedPayments = dataset.payments.filter(p => p.id !== paymentId);

      // Recalculate transaction payment status
      const remainingPayments = updatedPayments.filter(p => p.transaction_id === payment.transaction_id);
      const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
      const newStatus: PaymentStatus = totalPaid >= transaction.total_amount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

      const updatedTransactions = dataset.transactions.map(t => 
        t.id === payment.transaction_id 
          ? { ...t, amount_paid: totalPaid, payment_status: newStatus, updated_at: new Date().toISOString() }
          : t
      );

      return {
        ...dataset,
        payments: updatedPayments,
        transactions: updatedTransactions,
      };
    });
  }, [updateCurrentDataset]);

  const addPayment = useCallback((payment: Omit<Payment, 'id' | 'created_at'>) => {
    // Defensive validation: ensure amount is positive
    if (!payment.amount || payment.amount <= 0) {
      console.error('[MockData] Invalid payment amount:', payment.amount);
      return;
    }

    const newPayment: Payment = { 
      ...payment, 
      id: `${currentExhibitionId}_pay_${Date.now()}`, 
      created_at: new Date().toISOString() 
    };
    
    updateCurrentDataset(dataset => {
      const transaction = dataset.transactions.find(t => t.id === payment.transaction_id);
      if (!transaction) {
        console.warn('[MockData] Transaction not found for payment:', payment.transaction_id);
        return { ...dataset, payments: [...dataset.payments, newPayment] };
      }

      // Defensive: prevent payments to cancelled transactions
      if (transaction.cancelled) {
        console.warn('[MockData] Attempted to add payment to cancelled transaction:', payment.transaction_id);
        return dataset;
      }
      
      const currentPayments = dataset.payments.filter(p => p.transaction_id === payment.transaction_id);
      const pendingAmount = transaction.total_amount - transaction.amount_paid;
      
      // Defensive: cap payment at pending amount to prevent overpayment
      const actualPaymentAmount = Math.min(payment.amount, pendingAmount);
      
      const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0) + actualPaymentAmount;
      const newStatus: PaymentStatus = totalPaid >= transaction.total_amount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
      
      // Use actual payment amount (may be capped)
      const finalPayment: Payment = { ...newPayment, amount: actualPaymentAmount };
      
      return {
        ...dataset,
        payments: [...dataset.payments, finalPayment],
        transactions: dataset.transactions.map(t => 
          t.id === payment.transaction_id ? { ...t, amount_paid: totalPaid, payment_status: newStatus, updated_at: new Date().toISOString() } : t
        ),
      };
    });
  }, [updateCurrentDataset, currentExhibitionId]);

  const addAccount = useCallback((account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
    updateCurrentDataset(dataset => ({
      ...dataset,
      accounts: [...dataset.accounts, { 
        ...account, 
        id: `${currentExhibitionId}_account_${Date.now()}`, 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      }],
    }));
  }, [updateCurrentDataset, currentExhibitionId]);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    updateCurrentDataset(dataset => ({
      ...dataset,
      accounts: dataset.accounts.map(a => a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a),
    }));
  }, [updateCurrentDataset]);

  // Sorted arrays - derived from current exhibition only
  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [leads]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transactions]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [payments]);

  const sortedServiceAllocations = useMemo(() => {
    return [...serviceAllocations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [serviceAllocations]);

  // Getters - all operate on current exhibition's data only
  const getLeadById = useCallback((id: string) => sortedLeads.find(l => l.id === id), [sortedLeads]);
  const getStallById = useCallback((id: string) => stalls.find(s => s.id === id), [stalls]);
  const getStallByNumber = useCallback((number: string) => stalls.find(s => s.stall_number === number), [stalls]);
  const getTransactionById = useCallback((id: string) => sortedTransactions.find(t => t.id === id), [sortedTransactions]);
  const getTransactionsByLeadId = useCallback((leadId: string) => sortedTransactions.filter(t => t.lead_id === leadId), [sortedTransactions]);
  const getPaymentsByTransactionId = useCallback((txnId: string) => sortedPayments.filter(p => p.transaction_id === txnId), [sortedPayments]);
  const getItemsByTransactionId = useCallback((txnId: string) => transactionItems.filter(i => i.transaction_id === txnId), [transactionItems]);
  const getServiceAllocationsByStallId = useCallback((stallId: string) => sortedServiceAllocations.filter(a => a.stall_id === stallId), [sortedServiceAllocations]);
  const getServiceById = useCallback((id: string) => services.find(s => s.id === id), [services]);
  /**
   * Business Rule: A stall can be sold ONLY ONCE per exhibition.
   * 
   * A stall is available for purchase if and only if:
   * - It has NO transaction items (never been in a transaction)
   * - It is not blocked
   * 
   * Status-based filtering is NOT used because:
   * - Status is derived and can be stale
   * - A stall with status 'available' might already have a transaction
   * 
   * This ensures data integrity and prevents double-selling.
   */
  const getAvailableStalls = useCallback(() => {
    // A stall is available ONLY if it has no transaction items from non-cancelled transactions
    // This ensures a stall can never be sold twice
    const stallsWithTransactions = new Set(
      transactionItems
        .filter(item => {
          if (item.item_type !== 'stall' || !item.stall_id) return false;
          const txn = transactions.find(t => t.id === item.transaction_id);
          return txn && !txn.cancelled;
        })
        .map(item => item.stall_id!)
    );
    
    return stalls.filter(s => 
      !stallsWithTransactions.has(s.id) && s.status !== 'blocked'
    );
  }, [stalls, transactionItems, transactions]);
  
  const getStallsByLeadId = useCallback((leadId: string) => {
    // Only count stalls from non-cancelled transactions
    const leadTransactions = sortedTransactions.filter(t => t.lead_id === leadId && !t.cancelled);
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

  // Memoize the full context value
  const value = useMemo(() => ({
    role, 
    setRole, 
    isAdmin, 
    stalls, 
    leads: sortedLeads, 
    services, 
    transactions: sortedTransactions, 
    transactionItems, 
    payments: sortedPayments, 
    accounts, 
    serviceAllocations: sortedServiceAllocations,
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
    addAccount, 
    updateAccount,
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
    currentExhibitionId,
  }), [
    role, isAdmin, stalls, sortedLeads, services, sortedTransactions, transactionItems, sortedPayments, accounts, sortedServiceAllocations,
    updateStall, addLead, updateLead, deleteLead, addService, updateService, deleteService,
    addServiceAllocation, removeServiceAllocation, addTransaction, updateTransaction, cancelTransaction, removeServiceFromTransaction, deletePayment, addPayment, addAccount, updateAccount,
    getLeadById, getStallById, getStallByNumber, getTransactionById, getTransactionsByLeadId, getPaymentsByTransactionId,
    getItemsByTransactionId, getServiceAllocationsByStallId, getServiceAllocationsByTransactionId, getServiceById, getAvailableStalls, getStallsByLeadId, getTransactionsByStallId,
    currentExhibitionId,
  ]);

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (!context) throw new Error('useMockData must be used within a MockDataProvider');
  return context;
};
