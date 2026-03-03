import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useData } from '@/contexts/DataContext';
import { useExhibition } from '@/contexts/ExhibitionContext';
import { buildInvoiceData } from '@/lib/invoiceUtils';
import { downloadInvoicePDF, buildBookingInvoiceData } from '@/lib/generateInvoicePDF';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PaymentStatus, PaymentMode, Lead, TransactionItem, ServiceCategory } from '@/types/database';
import { Search, ChevronDown, ChevronUp, Plus, CreditCard, Receipt, ShoppingCart, PlusCircle, X, Trash2, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveDataView } from '@/components/ui/responsive-table';
import { Switch } from '@/components/ui/switch';

const statusColors: Record<PaymentStatus, string> = { 
  unpaid: 'bg-red-100 text-red-800', 
  partial: 'bg-orange-100 text-orange-800', 
  paid: 'bg-green-100 text-green-800' 
};
const statusLabels: Record<PaymentStatus, string> = { unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid' };

const Transactions = () => {
  const navigate = useNavigate();
  const { 
    transactions, leads, stalls, services, accounts, transactionItems, payments,
    getLeadById, getItemsByTransactionId, getPaymentsByTransactionId, getAvailableStalls, getStallsByLeadId, getStallById,
    addTransaction, addPayment, cancelTransaction, removeServiceFromTransaction, deletePayment,
    addService, isAdmin 
  } = useData();
  const { currentExhibition } = useExhibition();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Transaction Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Array<{
    type: 'stall' | 'service';
    id: string;
    name: string;
    price: number;
  }>>([]);
  const [selectedStallForServices, setSelectedStallForServices] = useState<string>('');
  const [txnNotes, setTxnNotes] = useState('');
  
  // Discount state
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<string>('');
  
  // GST state
  const [applyGst, setApplyGst] = useState<boolean>(false);

  // Add Payment Dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTxnId, setPaymentTxnId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Confirmation dialogs
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTxnId, setCancelTxnId] = useState<string>('');
  const [deletePaymentDialogOpen, setDeletePaymentDialogOpen] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string>('');

  // Add New Service Dialog
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    name: '',
    category: 'add_on' as ServiceCategory,
    price: '',
    description: '',
  });
  const [isAddingService, setIsAddingService] = useState(false);

  const availableStalls = getAvailableStalls();
  
  // Check if selected lead owns any stalls
  const leadOwnedStalls = selectedLead ? getStallsByLeadId(selectedLead) : [];
  const leadOwnsStalls = leadOwnedStalls.length > 0;
  const hasStallsInTransaction = selectedItems.some(i => i.type === 'stall');
  const hasServicesInTransaction = selectedItems.some(i => i.type === 'service');
  
  // Determine if we should hide the "Add Stall" selector
  // Hide when: lead owns stalls AND services are selected AND no stalls in transaction
  const shouldHideStallSelector = leadOwnsStalls && hasServicesInTransaction && !hasStallsInTransaction;
  
  // Available stalls for selection (filter out already owned ones)
  const availableStallsForLead = availableStalls.filter(s => !leadOwnedStalls.some(owned => owned.id === s.id));
  
  // Disable Create Transaction button if no items selected or no lead selected
  const canCreateTransaction = selectedItems.length > 0 && selectedLead;

  const filteredTxns = transactions.filter(t => { 
    const lead = getLeadById(t.lead_id); 
    return (t.transaction_number.toLowerCase().includes(search.toLowerCase()) || lead?.name.toLowerCase().includes(search.toLowerCase())) && 
           (statusFilter === 'all' || t.payment_status === statusFilter); 
  });

  const stats = { 
    total: transactions.length, 
    totalAmount: transactions.reduce((s, t) => s + t.total_amount, 0), 
    collected: transactions.reduce((s, t) => s + t.amount_paid, 0) 
  };

  const handleAddItem = (type: 'stall' | 'service', id: string) => {
    if (!id) return;
    
    // Check for duplicates
    if (selectedItems.some(i => i.id === id)) {
      toast({
        title: 'Item Already Added',
        description: 'This item is already in the transaction. Each item can only be added once.',
        variant: 'default',
        duration: 3000
      });
      return;
    }
    
    if (type === 'stall') {
      const stall = stalls?.find(s => s.id === id);
      if (!stall) {
        toast({
          title: 'Stall Not Found',
          description: 'The selected stall could not be found.',
          variant: 'destructive'
        });
        return;
      }
      
      // Check if stall is already sold (ignore cancelled transactions)
      const isSold = transactionItems.some(item => {
        if (item.item_type !== 'stall' || item.stall_id !== id) return false;
        const txn = transactions.find(t => t.id === item.transaction_id);
        return txn && !txn.cancelled; // Only count non-cancelled transactions
      });
      
      if (isSold) {
        toast({
          title: 'Stall Already Sold',
          description: `Stall ${stall.stall_number} has already been sold. Please select a different stall.`,
          variant: 'destructive'
        });
        return;
      }
      
        setSelectedItems([...selectedItems, { type, id, name: `Stall ${stall.stall_number}`, price: stall.base_rent }]);
      // Clear selectedStallForServices if a stall is added (stall in transaction takes precedence)
      if (selectedStallForServices) {
        setSelectedStallForServices('');
      }
    } else if (type === 'service') {
      const service = services?.find(s => s && s.id === id);
      if (!service) {
        toast({
          title: 'Service Not Found',
          description: 'The selected service could not be found.',
          variant: 'destructive'
        });
        return;
      }
      
      // Check if service is sold out
      const isSoldOut = !service.is_unlimited && service.sold_quantity >= service.quantity;
      if (isSoldOut) {
        toast({
          title: 'Service Sold Out',
          description: `${service.name} is sold out and cannot be added to transactions.`,
          variant: 'destructive'
        });
        return;
      }
      
      setSelectedItems([...selectedItems, { type, id, name: service.name || 'Unknown Service', price: service.price || 0 }]);
    }
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter(i => i.id !== id));
  };

  // Handle adding a new service to the catalog
  const handleAddNewService = async () => {
    if (isAddingService) return;
    
    // Validation
    const trimmedName = newServiceData.name.trim();
    if (!trimmedName) {
      toast({
        title: 'Validation Error',
        description: 'Service name is required.',
        variant: 'destructive'
      });
      return;
    }

    // Check for duplicate name
    const isDuplicateName = services.some(s => 
      s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicateName) {
      toast({
        title: 'Duplicate Service',
        description: `A service named "${trimmedName}" already exists. Please use a different name.`,
        variant: 'destructive'
      });
      return;
    }

    const priceNum = parseFloat(newServiceData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Price must be a positive number.',
        variant: 'destructive'
      });
      return;
    }

    setIsAddingService(true);
    try {
      const newService = await addService({
        exhibition_id: '', // Will be set by context
        name: trimmedName,
        category: newServiceData.category,
        description: newServiceData.description.trim() || null,
        price: priceNum,
        quantity: 1,
        sold_quantity: 0,
        is_unlimited: true, // New services are unlimited by default
        notes: null,
      });

      // Auto-select the newly created service
      setSelectedItems(prev => [...prev, {
        type: 'service',
        id: newService.id,
        name: newService.name,
        price: newService.price,
      }]);

      toast({
        title: 'Service Created',
        description: `"${newService.name}" has been added to the catalog and selected for this transaction.`,
      });

      // Reset and close dialog
      setNewServiceData({
        name: '',
        category: 'add_on',
        price: '',
        description: '',
      });
      setAddServiceDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create service.',
        variant: 'destructive'
      });
    } finally {
      setIsAddingService(false);
    }
  };

  const subtotal = selectedItems.reduce((sum, i) => sum + i.price, 0);
  
  // Calculate discount
  const discountNumValue = Number(discountValue) || 0;
  const discountAmount = discountType === 'percentage' 
    ? Math.round((subtotal * discountNumValue) / 100)
    : discountNumValue;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  
  // Calculate GST (9% CGST + 9% SGST = 18%)
  const cgstAmount = applyGst ? Math.round(afterDiscount * 0.09) : 0;
  const sgstAmount = applyGst ? Math.round(afterDiscount * 0.09) : 0;
  const gstAmount = cgstAmount + sgstAmount;
  const totalAmount = afterDiscount + gstAmount;

  // Determine transaction type
  const transactionType = (!leadOwnsStalls || hasStallsInTransaction) 
    ? 'New Stall Purchase' 
    : 'Service Add-on (Existing Stall)';

  const handleCreateTransaction = async () => {
    if (isSubmitting) return;
    
    if (!selectedLead || selectedItems.length === 0) {
      toast({ 
        title: 'Missing Information', 
        description: 'Please select a buyer and add at least one item (stall or service) to create a transaction.', 
        variant: 'destructive' 
      });
      return;
    }

    // Stock validation: Check if any selected services are now out of stock
    const serviceItems = selectedItems.filter(i => i.type === 'service');
    const outOfStockServices = serviceItems.filter(item => {
      const service = services.find(s => s.id === item.id);
      if (!service) return false;
      return !service.is_unlimited && service.sold_quantity >= service.quantity;
    });

    if (outOfStockServices.length > 0) {
      const outOfStockNames = outOfStockServices.map(s => s.name).join(', ');
      toast({
        title: 'Out of Stock',
        description: `${outOfStockNames} just went out of stock. Please remove ${outOfStockServices.length > 1 ? 'these services' : 'this service'} and try again.`,
        variant: 'destructive'
      });
      return;
    }

    // Validate: If services-only transaction, require stall selection
    const hasServices = selectedItems.some(i => i.type === 'service');
    const hasStalls = selectedItems.some(i => i.type === 'stall');
    if (hasServices && !hasStalls && !selectedStallForServices) {
      toast({ 
        title: 'Stall Selection Required', 
        description: 'Services must be allocated to a stall. Please select an existing stall from the dropdown below to apply the services.', 
        variant: 'destructive' 
      });
      return;
    }

    // Defensive validation: Prevent re-selling a stall that the lead already owns
    if (hasStalls) {
      const selectedStallIds = selectedItems.filter(i => i.type === 'stall').map(i => i.id);
      const ownedStallIds = leadOwnedStalls.map(s => s.id);
      const isReSellingOwnedStall = selectedStallIds.some(stallId => ownedStallIds.includes(stallId));
      
      if (isReSellingOwnedStall) {
        const duplicateStalls = selectedStallIds.filter(id => ownedStallIds.includes(id));
        const stallNumbers = duplicateStalls
          .map(id => stalls.find(s => s.id === id)?.stall_number)
          .filter(Boolean)
          .join(', ');
        const lead = getLeadById(selectedLead);
        const leadName = lead?.name || 'this buyer';
        
        toast({ 
          title: 'Stall Already Owned', 
          description: `Stall${duplicateStalls.length > 1 ? 's' : ''} ${stallNumbers} ${duplicateStalls.length > 1 ? 'are' : 'is'} already owned by ${leadName}. ${hasServices ? 'To add services, remove the duplicate stall(s) and select an existing stall from the dropdown below.' : 'To add services for existing stalls, use a service add-on transaction instead.'}`, 
          variant: 'destructive' 
        });
        return;
      }
    }
    
    // Additional validation: If lead owns stalls and services are selected without a stall allocation
    if (leadOwnsStalls && hasServices && !hasStalls && !selectedStallForServices) {
      toast({ 
        title: 'Stall Selection Required', 
        description: `Please select an existing stall from the dropdown to allocate the services. This buyer owns ${leadOwnedStalls.length} stall${leadOwnedStalls.length > 1 ? 's' : ''} already.`, 
        variant: 'destructive' 
      });
      return;
    }

    // Defensive validation: Ensure no stall is being re-sold (check for any transaction items)
    if (hasStalls) {
      const stallIdsInTransaction = selectedItems
        .filter(i => i.type === 'stall')
        .map(i => i.id);

      const alreadySoldStalls = stallIdsInTransaction.filter(stallId => {
        // Check if this stall has any transaction items from non-cancelled transactions
        return transactionItems.some(item => {
          if (item.item_type !== 'stall' || item.stall_id !== stallId) return false;
          const txn = transactions.find(t => t.id === item.transaction_id);
          return txn && !txn.cancelled; // Only count non-cancelled transactions
        });
      });

      if (alreadySoldStalls.length > 0) {
        const stallNumbers = alreadySoldStalls
          .map(id => stalls.find(s => s.id === id)?.stall_number)
          .filter(Boolean)
          .join(', ');
        
        toast({
          title: 'Stall Already Sold',
          description: `Stall${alreadySoldStalls.length > 1 ? 's' : ''} ${stallNumbers} ${alreadySoldStalls.length > 1 ? 'are' : 'is'} already sold. Please select a different stall.`,
          variant: 'destructive'
        });
        return;
      }
    }

    const items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[] = selectedItems.map(item => ({
      item_type: item.type,
      item_name: item.name,
      stall_id: item.type === 'stall' ? item.id : null,
      service_id: item.type === 'service' ? item.id : null,
      size: item.type === 'stall' ? '3×2' : null, // All stalls are now 3×2 standard size
      base_price: item.price,
      addon_price: 0,
      final_price: item.price,
      exhibition_id: currentExhibition?.id || '',
    }));

    // Determine selectedStallId: use selectedStallForServices if services-only, otherwise undefined
    const isServiceOnly = hasServices && !hasStalls;
    const selectedStallId = isServiceOnly ? selectedStallForServices : undefined;

    // Build notes with discount info if applicable
    let finalNotes = txnNotes || '';
    if (discountAmount > 0) {
      const discountInfo = discountType === 'percentage' 
        ? `Discount: ${discountNumValue}% (₹${discountAmount.toLocaleString()} off ₹${subtotal.toLocaleString()})`
        : `Discount: ₹${discountAmount.toLocaleString()} off ₹${subtotal.toLocaleString()}`;
      finalNotes = finalNotes ? `${finalNotes}\n${discountInfo}` : discountInfo;
    }
    if (applyGst) {
      const gstInfo = `GST Applied: CGST ₹${cgstAmount.toLocaleString()} + SGST ₹${sgstAmount.toLocaleString()} = ₹${gstAmount.toLocaleString()}`;
      finalNotes = finalNotes ? `${finalNotes}\n${gstInfo}` : gstInfo;
    }

    setIsSubmitting(true);
    try {
      const result = await addTransaction({
        lead_id: selectedLead,
        // GST fields
        is_gst: applyGst,
        subtotal: afterDiscount,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        // Discount fields
        discount_type: discountAmount > 0 ? discountType : null,
        discount_value: discountAmount > 0 ? discountNumValue : null,
        discount_amount: discountAmount,
        notes: finalNotes || null,
        created_by: null,
        exhibition_id: currentExhibition?.id || '',
        cancelled: false,
        cancelled_at: null,
      }, items, selectedStallId);

      // Enhanced toast messages
      const lead = getLeadById(selectedLead);
      const leadName = lead?.name || 'Buyer';
      const stallItems = selectedItems.filter(i => i.type === 'stall');
      const serviceItems = selectedItems.filter(i => i.type === 'service');
      
      let toastMessage = '';
      if (stallItems.length > 0) {
        const stallNumbers = stallItems.map(i => i.name.replace('Stall ', '')).join(', ');
        toastMessage = `Stall ${stallNumbers} sold to ${leadName}.`;
      } else if (serviceItems.length > 0 && selectedStallId) {
        const stall = getStallById(selectedStallId);
        toastMessage = `Services added to Stall ${stall?.stall_number || 'selected'}.`;
      } else {
        toastMessage = `Transaction created successfully.`;
      }
      
      toast({ title: 'Success', description: toastMessage });
      
      // Auto-generate invoice/bill after successful booking
      try {
        if (result && result.transaction && result.lead) {
          const invoiceNumber = result.transaction.transaction_number.replace('TXN', 'INV');
          const invoiceData = buildBookingInvoiceData(
            result.transaction,
            result.lead,
            result.items,
            invoiceNumber
          );
          // Download the invoice automatically
          downloadInvoicePDF(invoiceData);
          toast({ 
            title: 'Invoice Generated', 
            description: `${applyGst ? 'Tax Invoice' : 'Bill of Supply'} downloaded automatically.`,
            duration: 3000
          });
        }
      } catch (invoiceError) {
        // Don't fail the transaction if invoice generation fails
        console.error('Failed to generate invoice:', invoiceError);
        toast({
          title: 'Invoice Warning',
          description: 'Booking created but invoice could not be generated. You can download it later from the Receipts page.',
          variant: 'default',
          duration: 5000
        });
      }
      
    setCreateDialogOpen(false);
    setSelectedLead('');
    setSelectedItems([]);
      setSelectedStallForServices('');
    setTxnNotes('');
      setDiscountType('fixed');
      setDiscountValue('');
      setApplyGst(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create transaction. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPaymentDialog = (txnId: string) => {
    const txn = transactions.find(t => t.id === txnId);
    if (txn?.cancelled) {
      toast({
        title: 'Transaction Cancelled',
        description: 'Payments cannot be added to cancelled transactions.',
        variant: 'destructive'
      });
      return;
    }
    setPaymentTxnId(txnId);
    setPaymentDialogOpen(true);
  };

  const handleAddPayment = async () => {
    if (isSubmitting) return;
    
    const amount = parseFloat(paymentAmount);
    
    // Validate amount is a positive number
    if (!amount || amount <= 0 || isNaN(amount)) {
      toast({ 
        title: 'Invalid Amount', 
        description: 'Please enter a valid payment amount greater than zero.', 
        variant: 'destructive' 
      });
      return;
    }

    // Get transaction and calculate pending amount
    const txn = transactions.find(t => t.id === paymentTxnId);
    if (!txn) {
      toast({ 
        title: 'Transaction Not Found', 
        description: 'The selected transaction could not be found.', 
        variant: 'destructive' 
      });
      return;
    }

    // Check if transaction is cancelled
    if (txn.cancelled) {
      toast({ 
        title: 'Transaction Cancelled', 
        description: 'Payments cannot be added to cancelled transactions.', 
        variant: 'destructive' 
      });
      return;
    }

    const pendingAmount = txn.total_amount - (txn.amount_paid || 0);
    
    // Validate payment doesn't exceed pending amount
    if (amount > pendingAmount) {
      toast({ 
        title: 'Payment Exceeds Pending Amount', 
        description: `Payment amount (₹${amount.toLocaleString()}) cannot exceed pending amount of ₹${pendingAmount.toLocaleString()}. Please enter an amount up to ₹${pendingAmount.toLocaleString()}.`, 
        variant: 'destructive',
        duration: 6000
      });
      return;
    }

    // Warn if payment is close to pending (within 5%) but suggest exact amount
    if (amount < pendingAmount && amount >= pendingAmount * 0.95) {
      toast({ 
        title: 'Payment Amount Suggestion', 
        description: `You're close to the full amount. The exact pending amount is ₹${pendingAmount.toLocaleString()}.`, 
        variant: 'default',
        duration: 4000
      });
    }

    setIsSubmitting(true);
    try {
      const createdPayment = await addPayment({
      transaction_id: paymentTxnId,
      amount,
      payment_mode: paymentMode,
      payment_date: new Date().toISOString(),
      account_id: paymentAccount || null,
      reference_id: paymentReference || null,
      notes: paymentNotes || null,
      recorded_by: null,
      exhibition_id: currentExhibition?.id || '',
    });

      const newPending = pendingAmount - amount;
      const successMessage = newPending === 0 
        ? `Payment of ₹${amount.toLocaleString()} recorded. Transaction is now fully paid.`
        : `Payment of ₹${amount.toLocaleString()} recorded. ₹${newPending.toLocaleString()} remaining.`;

      toast({ 
        title: 'Payment Recorded Successfully', 
        description: successMessage 
      });

      // Generate invoice immediately after payment creation
      if (txn && currentExhibition) {
        try {
          const lead = getLeadById(txn.lead_id);
          const items = getItemsByTransactionId(txn.id);
          // Get all payments including the newly created one (will be in payments array after refresh, but we have it)
          const existingPayments = getPaymentsByTransactionId(txn.id) || [];
          const txnPayments = [
            ...existingPayments.filter(p => p.id !== createdPayment.id),
            createdPayment,
          ];
          
          if (lead) {
            // Build invoice data - invoice number is generated inside buildInvoiceData
            const invoiceData = buildInvoiceData(
              createdPayment,
              txn,
              lead,
              items,
              txnPayments,
              {
                id: currentExhibition.id,
                name: currentExhibition.name,
                short_name: currentExhibition.shortName,
                description: currentExhibition.description || null,
                start_date: currentExhibition.startDate,
                end_date: currentExhibition.endDate,
                created_at: '',
                updated_at: '',
              },
              payments
            );
            
            // Generate and download invoice HTML file (user can print to PDF)
            downloadInvoicePDF(invoiceData);
            
            // Show success message for invoice generation
            toast({
              title: 'Invoice Generated',
              description: 'Invoice generated and downloaded successfully.',
            });
          }
        } catch (invoiceError: any) {
          if (import.meta.env.DEV) {
            console.error('Error generating invoice:', invoiceError);
          }
          // Don't fail the payment if invoice generation fails
          const errorMsg = invoiceError?.message || '';
          const isTemplateError = errorMsg.includes('Failed to write') || errorMsg.includes('template');
          toast({
            title: 'Payment Recorded',
            description: isTemplateError 
              ? 'Invoice generation failed – template mismatch. Payment was recorded successfully.'
              : 'Invoice generation failed, but payment was recorded successfully.',
            variant: 'default',
          });
        }
      }
    setPaymentDialogOpen(false);
    setPaymentAmount('');
    setPaymentMode('cash');
    setPaymentReference('');
    setPaymentAccount('');
    setPaymentNotes('');
    setPaymentTxnId('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to record payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MockAppLayout title="Bookings" subtitle="Central hub for all sales">
      <div className="space-y-6">
        {isAdmin && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Bookings</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Collected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">₹{stats.collected.toLocaleString()}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">₹{(stats.totalAmount - stats.collected).toLocaleString()}</div></CardContent></Card>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto h-10 min-h-[44px]">
            <Plus className="h-4 w-4 mr-2" />
            Create Booking
          </Button>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Booking #</TableHead>
                  <TableHead>Buyer</TableHead>
                  {isAdmin && <TableHead>Total</TableHead>}
                  {isAdmin && <TableHead>Paid</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTxns.map((txn) => { 
                  const lead = getLeadById(txn.lead_id); 
                  const items = getItemsByTransactionId(txn.id); 
                  const payments = getPaymentsByTransactionId(txn.id); 
                  const isExpanded = expandedRow === txn.id;
                  const pendingAmount = txn.total_amount - txn.amount_paid;
                  
                  return (
                    <React.Fragment key={txn.id}>
                      <TableRow className="cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : txn.id)}>
                        <TableCell
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRow(isExpanded ? null : txn.id);
                          }}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </TableCell>
                        <TableCell 
                          className="font-medium hover:text-primary hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRow(txn.id);
                            // Scroll to this row
                            setTimeout(() => {
                              const element = document.getElementById(`txn-${txn.id}`);
                              element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                          }}
                        >
                          {txn.transaction_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p 
                              className="font-medium hover:text-primary hover:underline cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/leads');
                              }}
                            >
                              {lead?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">{lead?.company}</p>
                          </div>
                        </TableCell>
                        {isAdmin && <TableCell>₹{txn.total_amount.toLocaleString()}</TableCell>}
                        {isAdmin && <TableCell>₹{txn.amount_paid.toLocaleString()}</TableCell>}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[txn.payment_status]}>{statusLabels[txn.payment_status]}</Badge>
                            {txn.cancelled && (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                                Cancelled
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(txn.created_at), 'dd MMM yyyy')}</TableCell>
                        {isAdmin && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {!txn.cancelled && txn.payment_status !== 'paid' && (
                              <Button size="sm" variant="outline" onClick={() => handleOpenPaymentDialog(txn.id)}>
                                <CreditCard className="h-4 w-4 mr-1" />
                                Add Payment
                              </Button>
                            )}
                            {txn.cancelled && (
                              <span className="text-xs text-muted-foreground italic">Cancelled</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${txn.id}-expanded`}>
                          <TableCell colSpan={isAdmin ? 8 : 5} className="bg-muted/50 p-4">
                            {txn.cancelled && (
                              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    This booking has been cancelled
                                  </p>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-6">
                                  Only items from this booking have been released. Previous bookings remain unchanged. This booking is kept for audit purposes.
                                </p>
                              </div>
                            )}
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">Line Items {txn.cancelled && <span className="text-xs font-normal text-muted-foreground">(Cancelled)</span>}</h4>
                                </div>
                                {items.length === 0 ? (
                                  <p className="text-sm text-muted-foreground italic">No items in this booking</p>
                                ) : (
                                  items.map(i => {
                                  const isStall = i.item_type === 'stall';
                                  const isService = i.item_type === 'service';
                                  return (
                                    <div key={i.id} className={`flex justify-between items-center text-sm p-2 rounded mb-1 group ${txn.cancelled ? 'bg-gray-100 dark:bg-gray-800 opacity-75' : 'bg-background'}`}>
                                    <span className="flex items-center gap-2">
                                        <Receipt className={`h-3 w-3 ${txn.cancelled ? 'text-gray-400' : 'text-muted-foreground'}`} />
                                        {isStall ? (
                                          <span 
                                            className={`${txn.cancelled ? 'text-gray-500 line-through' : 'hover:text-primary hover:underline cursor-pointer'}`}
                                            onClick={txn.cancelled ? undefined : () => navigate('/', { state: { stallId: i.stall_id } })}
                                          >
                                      {i.item_name}
                                          </span>
                                        ) : (
                                          <span className={txn.cancelled ? 'text-gray-500 line-through' : ''}>
                                            {i.item_name}
                                          </span>
                                        )}
                                      {i.size && <span className="text-muted-foreground">({i.size})</span>}
                                        {txn.cancelled && (
                                          <Badge variant="outline" className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                            Cancelled
                                          </Badge>
                                        )}
                                    </span>
                                      <div className="flex items-center gap-2">
                                        {isAdmin && <span className={txn.cancelled ? 'text-gray-500' : ''}>₹{i.final_price.toLocaleString()}</span>}
                                        {isAdmin && isService && !txn.cancelled && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeServiceFromTransaction(txn.id, i.id);
                                              toast({
                                                title: 'Service Removed',
                                                description: `${i.item_name} has been removed from this booking.`,
                                              });
                                            }}
                                          >
                                            <X className="h-3 w-3 text-destructive" />
                                          </Button>
                                        )}
                                  </div>
                                    </div>
                                  );
                                  })
                                )}
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">Payments</h4>
                                  <div className="flex items-center gap-2">
                                    {pendingAmount > 0 && (
                                      <span className="text-sm text-orange-600">Pending: ₹{pendingAmount.toLocaleString()}</span>
                                    )}
                                    {!txn.cancelled && txn.payment_status !== 'paid' && (
                                      <Button size="sm" variant="outline" onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenPaymentDialog(txn.id);
                                      }}>
                                        <CreditCard className="h-4 w-4 mr-1" />
                                        Add Payment
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {payments.length ? payments.map(p => (
                                  <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-background rounded mb-1 group">
                                    <span>{format(new Date(p.payment_date), 'dd MMM')} - {p.payment_mode.toUpperCase()}</span>
                                    <div className="flex items-center gap-2">
                                      <span>₹{p.amount.toLocaleString()}</span>
                                      {isAdmin && !txn.cancelled && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletePaymentId(p.id);
                                            setDeletePaymentDialogOpen(true);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )) : (
                                  <p className="text-sm text-muted-foreground">No payments recorded</p>
                                )}
                              </div>
                            </div>
                            {isAdmin && !txn.cancelled && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                  <span className="text-sm font-medium text-muted-foreground">Correction Options</span>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCancelTxnId(txn.id);
                                      setCancelDialogOpen(true);
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel Booking
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Cancelling will release only the stalls and services from this booking. Previous bookings remain unchanged. The booking will remain visible as cancelled for audit purposes.
                                </p>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ); 
                })}
                {filteredTxns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 py-8">
                        <Receipt className="h-12 w-12 text-muted-foreground/50" />
                        <div className="space-y-1">
                          <p className="text-lg font-medium text-muted-foreground">
                            {search || statusFilter !== 'all' 
                              ? 'No transactions match your search' 
                              : 'No transactions found'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {search || statusFilter !== 'all'
                              ? 'Try adjusting your search or filter criteria.'
                              : 'Create your first transaction to get started.'}
                          </p>
                        </div>
                        {(!search && statusFilter === 'all') && isAdmin && (
                          <Button onClick={() => setCreateDialogOpen(true)} className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Transaction
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Transaction Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) {
          setSelectedLead('');
          setSelectedItems([]);
          setSelectedStallForServices('');
          setTxnNotes('');
        }
      }}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Booking</DialogTitle>
            <DialogDescription>
              Select a buyer, add stalls and services, and confirm the booking details.
            </DialogDescription>
            {selectedLead && (
              <div className="pt-3 pb-1">
                <Badge variant="secondary" className="text-sm font-medium flex items-center gap-1.5 w-fit">
                  {transactionType === 'New Stall Purchase' ? (
                    <ShoppingCart className="h-3.5 w-3.5" />
                  ) : (
                    <PlusCircle className="h-3.5 w-3.5" />
                  )}
                  {transactionType}
                </Badge>
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            {/* 1. Buyer Selection */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">1. Buyer</h3>
            <div className="space-y-2">
              <Label>Select Buyer (Lead)</Label>
              <Select value={selectedLead} onValueChange={setSelectedLead}>
                <SelectTrigger className="h-10 min-h-[44px]">
                  <SelectValue placeholder="Choose a lead..." />
                </SelectTrigger>
                <SelectContent>
                  {leads.filter(l => l.status !== 'not_interested').map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} {lead.company ? `- ${lead.company}` : ''} ({lead.phone})
                      {lead.status === 'converted' ? ' (Has existing transaction)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Converted leads can have multiple transactions. Each transaction creates a separate record with its own payment tracking.
              </p>
              
              {/* Owned Stalls Display */}
              {leadOwnsStalls && selectedLead && (
                <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Owns:</p>
                  <div className="flex flex-wrap gap-2">
                    {leadOwnedStalls.map((stall, idx) => (
                      <Button
                        key={stall.id}
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2 py-0"
                        onClick={() => {
                          setCreateDialogOpen(false);
                          navigate('/stalls');
                          // Could navigate to specific stall detail if route exists
                        }}
                      >
                        {stall.stall_number} ({stall.zone})
                        {idx < leadOwnedStalls.length - 1 && <span className="ml-1">,</span>}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* 2. What are they buying? */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">2. What are they buying?</h3>
              
              {/* Buy New Stall - Hide when lead owns stalls and is adding services only */}
            {!shouldHideStallSelector && (
            <div className="space-y-2">
                <Label>Buy New Stall</Label>
                <Select 
                  onValueChange={(v) => handleAddItem('stall', v)} 
                  value=""
                  disabled={leadOwnsStalls && hasServicesInTransaction && !hasStallsInTransaction}
                >
                  <SelectTrigger className={`h-10 min-h-[44px] ${leadOwnsStalls && hasServicesInTransaction && !hasStallsInTransaction ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue placeholder={
                      leadOwnsStalls && hasServicesInTransaction && !hasStallsInTransaction
                        ? "This buyer already owns stalls. Use 'Add Services' to add services to existing stalls."
                        : availableStallsForLead.length === 0
                        ? "No available stalls (all sold/reserved)"
                        : "Select a stall to add..."
                    } />
                </SelectTrigger>
                <SelectContent>
                    {availableStallsForLead.length === 0 ? (
                      <SelectItem value="placeholder-none" disabled>
                        {leadOwnsStalls 
                          ? "All available stalls are already owned. Remove services to add new stalls."
                          : "No available stalls"}
                      </SelectItem>
                    ) : (
                      availableStallsForLead.map(stall => (
                    <SelectItem key={stall.id} value={stall.id} disabled={selectedItems.some(i => i.id === stall.id)}>
                          {stall.stall_number} - ₹{stall.base_rent.toLocaleString()}
                    </SelectItem>
                      ))
                    )}
                </SelectContent>
              </Select>
                {availableStallsForLead.length === 0 && !leadOwnsStalls && (
                  <p className="text-xs text-muted-foreground mt-1">
                    All stalls have been sold or reserved. Sold stalls cannot be purchased again.
                  </p>
                )}
                {leadOwnsStalls && hasServicesInTransaction && !hasStallsInTransaction && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                    <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                      Service-only transaction mode
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
                      This buyer already owns {leadOwnedStalls.length} stall{leadOwnedStalls.length > 1 ? 's' : ''}. 
                      The stall selector is disabled because you're adding services only. The selected stall will not be charged again. 
                      Select an existing stall below to allocate services.
                    </p>
            </div>
                )}
                {leadOwnsStalls && !hasServicesInTransaction && (
                  <p className="text-xs text-muted-foreground">
                    This buyer already owns {leadOwnedStalls.length} stall{leadOwnedStalls.length > 1 ? 's' : ''}. 
                    You can add additional stalls or services.
                  </p>
                )}
              </div>
            )}

            {/* Add Services */}
            <div className="space-y-2">
                <Label>Add Services</Label>
              <Select onValueChange={(v) => handleAddItem('service', v)} value="">
                  <SelectTrigger className="h-10 min-h-[44px]">
                  <SelectValue placeholder="Select a service to add..." />
                </SelectTrigger>
                <SelectContent>
                    {services && services.length > 0 ? (
                      services.map(service => {
                        const isSoldOut = !service.is_unlimited && service.sold_quantity >= service.quantity;
                        const isSelected = selectedItems.some(i => i.id === service.id);
                        const isAvailable = service.is_unlimited || (service.sold_quantity < service.quantity);
                        
                        return (
                          <SelectItem 
                            key={service.id} 
                            value={service.id} 
                            disabled={isSoldOut || isSelected}
                            className={isSoldOut ? 'opacity-50' : ''}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {service.name} - ₹{(service.price || 0).toLocaleString()}
                              </span>
                              {isSoldOut && (
                                <Badge variant="destructive" className="ml-2 text-xs">Sold Out</Badge>
                              )}
                              {isSelected && !isSoldOut && (
                                <Badge variant="secondary" className="ml-2 text-xs">Added</Badge>
                              )}
                            </div>
                    </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="placeholder-no-services" disabled>No services available</SelectItem>
                    )}
                </SelectContent>
              </Select>
              {/* Add New Service Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setAddServiceDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Service to Catalog
              </Button>
              </div>
            </div>

            {/* 3. Where does it apply? */}
            {selectedLead && hasServicesInTransaction && !hasStallsInTransaction && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">3. Where does it apply?</h3>
              <div className="space-y-2">
                  <Label>Apply Services To Stall *</Label>
                <Select value={selectedStallForServices} onValueChange={setSelectedStallForServices}>
                  <SelectTrigger className="h-10 min-h-[44px]">
                    <SelectValue placeholder="Choose an existing stall..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      try {
                        const leadStalls = selectedLead ? getStallsByLeadId(selectedLead) : [];
                        if (!leadStalls || leadStalls.length === 0) {
                          return (
                            <SelectItem value="placeholder-no-stalls" disabled>
                              {leadOwnsStalls 
                                ? "No stalls found for this buyer. Add a stall to this transaction or select a different buyer."
                                : "This buyer doesn't own any stalls yet. Please add a stall to this transaction first."}
                            </SelectItem>
                          );
                        }
                        return leadStalls.map(stall => (
                          <SelectItem key={stall.id} value={stall.id}>
                            {stall.stall_number} - {stall.zone}
                          </SelectItem>
                        ));
                      } catch (error) {
                        if (import.meta.env.DEV) {
                          console.error('Error getting stalls for lead:', error);
                        }
                        return (
                          <SelectItem value="placeholder-error" disabled>
                            Error loading stalls
                          </SelectItem>
                        );
                      }
                    })()}
                  </SelectContent>
                </Select>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                    Service allocation required
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200 mt-0.5">
                    {leadOwnsStalls 
                      ? `Services must be allocated to one of the ${leadOwnedStalls.length} stall${leadOwnedStalls.length > 1 ? 's' : ''} this buyer already owns. The selected stall will not be added to the transaction total—only the service charges will apply.`
                      : "Services must be allocated to a stall. If this buyer doesn't own a stall, add one to this transaction first."}
                  </p>
                </div>
                </div>
              </div>
            )}

            {/* 4. Summary & Payment */}
            {selectedItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">4. Summary & Payment</h3>
                <div className="border rounded-lg p-4 space-y-4">
                  {/* Stall Purchase Section */}
                  {selectedItems.filter(i => i.type === 'stall').length > 0 && (
                    <div className="space-y-2 pb-3 border-b">
                      <h4 className="text-sm font-semibold text-foreground">Stall Purchase</h4>
                      <div className="space-y-1">
                        {selectedItems.filter(i => i.type === 'stall').map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="text-sm">{item.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium">₹{item.price.toLocaleString()}</span>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="h-6 w-6 p-0 text-destructive">
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end pt-1">
                        <span className="text-xs text-muted-foreground">
                          Subtotal: <span className="font-semibold text-foreground">₹{selectedItems.filter(i => i.type === 'stall').reduce((sum, i) => sum + i.price, 0).toLocaleString()}</span>
                      </span>
                      </div>
                    </div>
                  )}

                  {/* Services Section */}
                  {selectedItems.filter(i => i.type === 'service').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">Services</h4>
                      {(selectedStallForServices || selectedItems.find(i => i.type === 'stall')) && (
                        <div className="p-2 bg-primary/5 border border-primary/20 rounded-md mb-2">
                          <p className="text-xs font-medium text-primary">
                            Services will be applied to <strong>
                              {selectedStallForServices 
                                ? getStallById(selectedStallForServices)?.stall_number
                                : selectedItems.find(i => i.type === 'stall')?.name.replace('Stall ', '')}
                            </strong>
                          </p>
                        </div>
                      )}
                      <div className="space-y-1">
                        {selectedItems.filter(i => i.type === 'service').map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="text-sm">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">₹{item.price.toLocaleString()}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="h-6 w-6 p-0 text-destructive">
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                      </div>
                      <div className="flex justify-end pt-1">
                        <span className="text-xs text-muted-foreground">
                          Subtotal: <span className="font-semibold text-foreground">₹{selectedItems.filter(i => i.type === 'service').reduce((sum, i) => sum + i.price, 0).toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Discount Section */}
                  <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Subtotal</span>
                      <span className="text-sm font-medium">₹{subtotal.toLocaleString()}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Discount</Label>
                      <div className="flex gap-2">
                        <Select value={discountType} onValueChange={(v: 'fixed' | 'percentage') => setDiscountType(v)}>
                          <SelectTrigger className="w-[100px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">₹ Fixed</SelectItem>
                            <SelectItem value="percentage">% Percent</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            min={0}
                            max={discountType === 'percentage' ? 100 : subtotal}
                            step={discountType === 'percentage' ? 1 : 100}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                            className="h-9 pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            {discountType === 'percentage' ? '%' : '₹'}
                          </span>
                        </div>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Discount {discountType === 'percentage' && `(${discountNumValue}%)`}
                          </span>
                          <span className="text-green-600 font-medium">-₹{discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* After Discount Subtotal */}
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal (after discount)</span>
                        <span className="font-medium">₹{afterDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* GST Toggle */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="apply-gst"
                          checked={applyGst}
                          onCheckedChange={setApplyGst}
                        />
                        <Label htmlFor="apply-gst" className="text-sm cursor-pointer">
                          Apply GST (18%)
                        </Label>
                      </div>
                    </div>
                    
                    {/* GST Breakdown */}
                    {applyGst && (
                      <div className="space-y-1 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">CGST (9%)</span>
                          <span className="font-medium">₹{cgstAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">SGST (9%)</span>
                          <span className="font-medium">₹{sgstAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-1 border-t border-blue-200 dark:border-blue-700">
                          <span className="text-muted-foreground font-medium">Total GST</span>
                          <span className="font-semibold text-blue-700 dark:text-blue-300">₹{gstAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grand Total */}
                  <div className="flex justify-between pt-3 border-t font-semibold text-lg">
                    <span>{applyGst ? 'Grand Total (incl. GST)' : 'Total'}</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={txnNotes} onChange={(e) => setTxnNotes(e.target.value)} placeholder="Add notes..." rows={3} className="min-h-[80px]" />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="w-full sm:w-auto h-10 min-h-[44px]">Cancel</Button>
            <Button 
              onClick={handleCreateTransaction} 
              disabled={!canCreateTransaction || isSubmitting}
              className={`w-full sm:w-auto h-10 min-h-[44px] ${!canCreateTransaction ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[450px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter payment details to update the transaction balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {paymentTxnId && (() => {
              const txn = transactions.find(t => t.id === paymentTxnId);
              if (!txn) return null;
              
              if (txn.cancelled) {
                return (
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <AlertTriangle className="h-4 w-4" />
                      <p className="font-medium">This transaction has been cancelled</p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-6">
                      Payments cannot be added to cancelled transactions.
                    </p>
                  </div>
                );
              }
              
              const pending = txn.total_amount - txn.amount_paid;
              return (
                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                  <p><span className="text-muted-foreground">Transaction:</span> {txn.transaction_number}</p>
                  <p><span className="text-muted-foreground">Total:</span> ₹{txn.total_amount.toLocaleString()}</p>
                  <p><span className="text-muted-foreground">Already Paid:</span> ₹{txn.amount_paid.toLocaleString()}</p>
                  <p className="font-medium text-orange-600">Pending: ₹{pending.toLocaleString()}</p>
                </div>
              );
            })()}

            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input 
                type="number" 
                value={paymentAmount} 
                onChange={(e) => setPaymentAmount(e.target.value)} 
                placeholder="Enter amount" 
                min="0"
                step="0.01"
                className="h-10 min-h-[44px] text-base"
              />
              {paymentTxnId && (() => {
                const txn = transactions.find(t => t.id === paymentTxnId);
                if (!txn) return null;
                const pending = txn.total_amount - txn.amount_paid;
                return pending > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Maximum: ₹{pending.toLocaleString()}
                  </p>
                ) : null;
              })()}
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                <SelectTrigger className="h-10 min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Account (Optional)</Label>
              <Select value={paymentAccount} onValueChange={setPaymentAccount}>
                <SelectTrigger className="h-10 min-h-[44px]"><SelectValue placeholder="Select account..." /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.is_active).map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reference ID (Optional)</Label>
              <Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="UPI Ref / Cheque No..." className="h-10 min-h-[44px] text-base" />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Add notes..." rows={3} className="min-h-[80px]" />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="w-full sm:w-auto h-10 min-h-[44px]">Cancel</Button>
            <Button onClick={handleAddPayment} disabled={isSubmitting} className="w-full sm:w-auto h-10 min-h-[44px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Transaction Confirmation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to cancel this booking? This will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Release only the stalls purchased in <strong>this booking</strong> (they will become available again)</li>
                  <li>Remove only the service allocations created as part of <strong>this booking</strong></li>
                  <li>Keep the booking visible as "Cancelled" for audit purposes</li>
                </ul>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Note:</strong> This will only affect items in this specific booking. Previous bookings and their items will remain unchanged.
                </p>
                <p className="mt-2 font-medium">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelTxnId) {
                  cancelTransaction(cancelTxnId);
                  toast({
                    title: 'Booking Cancelled',
                    description: 'This booking has been cancelled. Only items from this booking have been released.',
                  });
                  setCancelDialogOpen(false);
                  setCancelTxnId('');
                  setExpandedRow(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Payment Confirmation */}
      <AlertDialog open={deletePaymentDialogOpen} onOpenChange={setDeletePaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to delete this payment record? This will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Remove the payment from the transaction</li>
                  <li>Recalculate the transaction payment status automatically</li>
                  <li>Update stall status if needed</li>
                </ul>
                <p className="mt-2 font-medium">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Payment</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletePaymentId) {
                  deletePayment(deletePaymentId);
                  toast({
                    title: 'Payment Deleted',
                    description: 'The payment has been removed and transaction status has been updated.',
                  });
                  setDeletePaymentDialogOpen(false);
                  setDeletePaymentId('');
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add New Service Dialog */}
      <Dialog open={addServiceDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAddServiceDialogOpen(false);
          setNewServiceData({ name: '', category: 'add_on', price: '', description: '' });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Add New Service to Catalog
            </DialogTitle>
            <DialogDescription>
              Add a service to the catalog for this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="new-service-name">Service Name *</Label>
              <Input
                id="new-service-name"
                placeholder="e.g., Extra Table, Premium Banner"
                value={newServiceData.name}
                onChange={(e) => setNewServiceData(prev => ({ ...prev, name: e.target.value }))}
                className="h-10"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="new-service-category">Category *</Label>
              <Select 
                value={newServiceData.category} 
                onValueChange={(v: ServiceCategory) => setNewServiceData(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sponsor">Sponsor</SelectItem>
                  <SelectItem value="signboard">Signboard</SelectItem>
                  <SelectItem value="food_court">Food Court</SelectItem>
                  <SelectItem value="add_on">Add-on</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="new-service-price">Price (₹) *</Label>
              <Input
                id="new-service-price"
                type="number"
                min="1"
                step="1"
                placeholder="e.g., 500"
                value={newServiceData.price}
                onChange={(e) => setNewServiceData(prev => ({ ...prev, price: e.target.value }))}
                className="h-10"
              />
            </div>

            {/* Description (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="new-service-description">Description (Optional)</Label>
              <Textarea
                id="new-service-description"
                placeholder="Brief description of the service..."
                value={newServiceData.description}
                onChange={(e) => setNewServiceData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Info box about GST */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> The service price will be added to the transaction subtotal. 
                If GST is enabled, 18% GST (9% CGST + 9% SGST) will be calculated on the total subtotal including this service.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAddServiceDialogOpen(false);
                  setNewServiceData({ name: '', category: 'add_on', price: '', description: '' });
                }}
                disabled={isAddingService}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddNewService}
                disabled={isAddingService || !newServiceData.name.trim() || !newServiceData.price}
              >
                {isAddingService ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create & Add to Transaction
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MockAppLayout>
  );
};

export default Transactions;
