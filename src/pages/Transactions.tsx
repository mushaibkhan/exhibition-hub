import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/MockDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PaymentStatus, PaymentMode, Lead, TransactionItem } from '@/types/database';
import { Search, ChevronDown, ChevronUp, Plus, CreditCard, Receipt, ShoppingCart, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<PaymentStatus, string> = { 
  unpaid: 'bg-red-100 text-red-800', 
  partial: 'bg-orange-100 text-orange-800', 
  paid: 'bg-green-100 text-green-800' 
};
const statusLabels: Record<PaymentStatus, string> = { unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid' };

const Transactions = () => {
  const navigate = useNavigate();
  const { 
    transactions, leads, stalls, services, accounts,
    getLeadById, getItemsByTransactionId, getPaymentsByTransactionId, getAvailableStalls, getStallsByLeadId, getStallById,
    addTransaction, addPayment,
    isAdmin 
  } = useMockData();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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

  // Add Payment Dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTxnId, setPaymentTxnId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

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
    
    if (type === 'stall') {
      const stall = stalls?.find(s => s.id === id);
      if (stall && !selectedItems.find(i => i.id === id)) {
        setSelectedItems([...selectedItems, { type, id, name: `Stall ${stall.stall_number}`, price: stall.base_rent }]);
        // Clear selectedStallForServices if a stall is added (stall in transaction takes precedence)
        if (selectedStallForServices) {
          setSelectedStallForServices('');
        }
      }
    } else if (type === 'service') {
      const service = services?.find(s => s && s.id === id);
      if (service && !selectedItems.find(i => i.id === id)) {
        setSelectedItems([...selectedItems, { type, id, name: service.name || 'Unknown Service', price: service.price || 0 }]);
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter(i => i.id !== id));
  };

  const totalAmount = selectedItems.reduce((sum, i) => sum + i.price, 0);

  // Determine transaction type
  const transactionType = (!leadOwnsStalls || hasStallsInTransaction) 
    ? 'New Stall Purchase' 
    : 'Service Add-on (Existing Stall)';

  const handleCreateTransaction = () => {
    if (!selectedLead || selectedItems.length === 0) {
      toast({ 
        title: 'Missing Information', 
        description: 'Please select a buyer and add at least one item (stall or service) to create a transaction.', 
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

    const items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at'>[] = selectedItems.map(item => ({
      item_type: item.type,
      item_name: item.name,
      stall_id: item.type === 'stall' ? item.id : null,
      service_id: item.type === 'service' ? item.id : null,
      size: item.type === 'stall' ? stalls.find(s => s.id === item.id)?.size || null : null,
      base_price: item.price,
      addon_price: 0,
      final_price: item.price,
    }));

    // Determine selectedStallId: use selectedStallForServices if services-only, otherwise undefined
    const isServiceOnly = hasServices && !hasStalls;
    const selectedStallId = isServiceOnly ? selectedStallForServices : undefined;

    // Calculate transaction number before creating (since it's based on current count)
    const txnNumber = `TXN-2024-${String(transactions.length + 1).padStart(3, '0')}`;
    
    addTransaction({
      lead_id: selectedLead,
      total_amount: totalAmount,
      amount_paid: 0,
      payment_status: 'unpaid',
      notes: txnNotes || null,
      created_by: null,
    }, items, selectedStallId);

    // Enhanced toast messages
    const lead = getLeadById(selectedLead);
    const leadName = lead?.name || 'Buyer';
    const stallItems = selectedItems.filter(i => i.type === 'stall');
    const serviceItems = selectedItems.filter(i => i.type === 'service');
    
    let toastMessage = '';
    if (stallItems.length > 0) {
      const stallNumbers = stallItems.map(i => i.name.replace('Stall ', '')).join(', ');
      toastMessage = `Stall ${stallNumbers} sold to ${leadName}. Transaction: ${txnNumber}`;
    } else if (serviceItems.length > 0 && selectedStallId) {
      const stall = getStallById(selectedStallId);
      toastMessage = `Services added to Stall ${stall?.stall_number || 'selected'}. Transaction: ${txnNumber}`;
    } else {
      toastMessage = `Transaction created successfully. Transaction: ${txnNumber}`;
    }
    
    toast({ title: 'Success', description: toastMessage });
    setCreateDialogOpen(false);
    setSelectedLead('');
    setSelectedItems([]);
    setSelectedStallForServices('');
    setTxnNotes('');
  };

  const handleOpenPaymentDialog = (txnId: string) => {
    setPaymentTxnId(txnId);
    setPaymentDialogOpen(true);
  };

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    addPayment({
      transaction_id: paymentTxnId,
      amount,
      payment_mode: paymentMode,
      payment_date: new Date().toISOString(),
      account_id: paymentAccount || null,
      reference_id: paymentReference || null,
      notes: paymentNotes || null,
      recorded_by: null,
    });

    toast({ title: 'Success', description: 'Payment recorded successfully' });
    setPaymentDialogOpen(false);
    setPaymentAmount('');
    setPaymentMode('cash');
    setPaymentReference('');
    setPaymentAccount('');
    setPaymentNotes('');
    setPaymentTxnId('');
  };

  return (
    <MockAppLayout title="Transactions" subtitle="Central hub for all sales">
      <div className="space-y-6">
        {isAdmin && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Transactions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Collected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">₹{stats.collected.toLocaleString()}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">₹{(stats.totalAmount - stats.collected).toLocaleString()}</div></CardContent></Card>
          </div>
        )}

        <div className="flex gap-4 flex-wrap items-center justify-between">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Transaction
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Transaction #</TableHead>
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
                    <>
                      <TableRow key={txn.id} className="cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : txn.id)}>
                        <TableCell onClick={(e) => e.stopPropagation()}>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
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
                        <TableCell><Badge className={statusColors[txn.payment_status]}>{statusLabels[txn.payment_status]}</Badge></TableCell>
                        <TableCell>{format(new Date(txn.created_at), 'dd MMM yyyy')}</TableCell>
                        {isAdmin && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {txn.payment_status !== 'paid' && (
                              <Button size="sm" variant="outline" onClick={() => handleOpenPaymentDialog(txn.id)}>
                                <CreditCard className="h-4 w-4 mr-1" />
                                Add Payment
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${txn.id}-expanded`}>
                          <TableCell colSpan={isAdmin ? 8 : 5} className="bg-muted/50 p-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <h4 className="font-semibold mb-2">Line Items</h4>
                                {items.map(i => {
                                  const isStall = i.item_type === 'stall';
                                  return (
                                    <div key={i.id} className="flex justify-between text-sm p-2 bg-background rounded mb-1">
                                      <span className="flex items-center gap-2">
                                        <Receipt className="h-3 w-3 text-muted-foreground" />
                                        {isStall ? (
                                          <span 
                                            className="hover:text-primary hover:underline cursor-pointer"
                                            onClick={() => navigate('/', { state: { stallId: i.stall_id } })}
                                          >
                                            {i.item_name}
                                          </span>
                                        ) : (
                                          i.item_name
                                        )}
                                        {i.size && <span className="text-muted-foreground">({i.size})</span>}
                                      </span>
                                      {isAdmin && <span>₹{i.final_price.toLocaleString()}</span>}
                                    </div>
                                  );
                                })}
                              </div>
                              {isAdmin && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">Payments</h4>
                                    {pendingAmount > 0 && (
                                      <span className="text-sm text-orange-600">Pending: ₹{pendingAmount.toLocaleString()}</span>
                                    )}
                                  </div>
                                  {payments.length ? payments.map(p => (
                                    <div key={p.id} className="flex justify-between text-sm p-2 bg-background rounded mb-1">
                                      <span>{format(new Date(p.payment_date), 'dd MMM')} - {p.payment_mode.toUpperCase()}</span>
                                      <span>₹{p.amount.toLocaleString()}</span>
                                    </div>
                                  )) : (
                                    <p className="text-sm text-muted-foreground">No payments recorded</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ); 
                })}
              </TableBody>
            </Table>
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Transaction</DialogTitle>
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
          <div className="space-y-6 py-4">
            {/* 1. Buyer Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">1. Buyer</h3>
              <div className="space-y-2">
                <Label>Select Buyer (Lead)</Label>
              <Select value={selectedLead} onValueChange={setSelectedLead}>
                <SelectTrigger>
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
                  <SelectTrigger className={leadOwnsStalls && hasServicesInTransaction && !hasStallsInTransaction ? 'opacity-50 cursor-not-allowed' : ''}>
                    <SelectValue placeholder={
                      leadOwnsStalls && hasServicesInTransaction && !hasStallsInTransaction
                        ? "This buyer already owns stalls. Add services only."
                        : "Select a stall to add..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStallsForLead.length === 0 ? (
                      <SelectItem value="" disabled>
                        {leadOwnsStalls 
                          ? "All available stalls are already owned. Remove services to add new stalls."
                          : "No available stalls"}
                      </SelectItem>
                    ) : (
                      availableStallsForLead.map(stall => (
                        <SelectItem key={stall.id} value={stall.id} disabled={selectedItems.some(i => i.id === stall.id)}>
                          {stall.stall_number} ({stall.size}) - ₹{stall.base_rent.toLocaleString()}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services && services.length > 0 ? (
                      services.filter(s => s && (s.is_unlimited || (s.sold_quantity !== undefined && s.quantity !== undefined && s.sold_quantity < s.quantity))).map(service => (
                        <SelectItem key={service.id} value={service.id} disabled={selectedItems.some(i => i.id === service.id)}>
                          {service.name} - ₹{(service.price || 0).toLocaleString()}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>No services available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 3. Where does it apply? */}
            {selectedLead && hasServicesInTransaction && !hasStallsInTransaction && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">3. Where does it apply?</h3>
                <div className="space-y-2">
                  <Label>Apply Services To Stall *</Label>
                <Select value={selectedStallForServices} onValueChange={setSelectedStallForServices}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an existing stall..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      try {
                        const leadStalls = selectedLead ? getStallsByLeadId(selectedLead) : [];
                        if (!leadStalls || leadStalls.length === 0) {
                          return (
                            <SelectItem value="" disabled>
                              {leadOwnsStalls 
                                ? "No stalls found for this buyer. Add a stall to this transaction or select a different buyer."
                                : "This buyer doesn't own any stalls yet. Please add a stall to this transaction first."}
                            </SelectItem>
                          );
                        }
                        return leadStalls.map(stall => (
                          <SelectItem key={stall.id} value={stall.id}>
                            {stall.stall_number} ({stall.size}) - {stall.zone}
                          </SelectItem>
                        ));
                      } catch (error) {
                        console.error('Error getting stalls for lead:', error);
                        return (
                          <SelectItem value="" disabled>
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

                  {/* Total */}
                  <div className="flex justify-between pt-3 border-t font-semibold">
                    <span>Total</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={txnNotes} onChange={(e) => setTxnNotes(e.target.value)} placeholder="Add notes..." rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTransaction} disabled={!selectedLead || selectedItems.length === 0}>
              Create Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {paymentTxnId && (() => {
              const txn = transactions.find(t => t.id === paymentTxnId);
              const pending = txn ? txn.total_amount - txn.amount_paid : 0;
              return txn ? (
                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                  <p><span className="text-muted-foreground">Transaction:</span> {txn.transaction_number}</p>
                  <p><span className="text-muted-foreground">Total:</span> ₹{txn.total_amount.toLocaleString()}</p>
                  <p><span className="text-muted-foreground">Already Paid:</span> ₹{txn.amount_paid.toLocaleString()}</p>
                  <p className="font-medium text-orange-600">Pending: ₹{pending.toLocaleString()}</p>
                </div>
              ) : null;
            })()}

            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount" />
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue placeholder="Select account..." /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.is_active).map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reference ID (Optional)</Label>
              <Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="UPI Ref / Cheque No..." />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Add notes..." rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPayment}>Record Payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MockAppLayout>
  );
};

export default Transactions;
