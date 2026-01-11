import { useState } from 'react';
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
import { Search, ChevronDown, ChevronUp, Plus, CreditCard, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<PaymentStatus, string> = { 
  unpaid: 'bg-red-100 text-red-800', 
  partial: 'bg-orange-100 text-orange-800', 
  paid: 'bg-green-100 text-green-800' 
};
const statusLabels: Record<PaymentStatus, string> = { unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid' };

const Transactions = () => {
  const { 
    transactions, leads, stalls, services, accounts,
    getLeadById, getItemsByTransactionId, getPaymentsByTransactionId, getAvailableStalls,
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
  const [txnNotes, setTxnNotes] = useState('');

  // Add Payment Dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTxnId, setPaymentTxnId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const convertedLeads = leads.filter(l => l.status !== 'converted' && l.status !== 'not_interested');
  const availableStalls = getAvailableStalls();

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
    if (type === 'stall') {
      const stall = stalls.find(s => s.id === id);
      if (stall && !selectedItems.find(i => i.id === id)) {
        setSelectedItems([...selectedItems, { type, id, name: `Stall ${stall.stall_number}`, price: stall.base_rent }]);
      }
    } else {
      const service = services.find(s => s.id === id);
      if (service && !selectedItems.find(i => i.id === id)) {
        setSelectedItems([...selectedItems, { type, id, name: service.name, price: service.price }]);
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter(i => i.id !== id));
  };

  const totalAmount = selectedItems.reduce((sum, i) => sum + i.price, 0);

  const handleCreateTransaction = () => {
    if (!selectedLead || selectedItems.length === 0) {
      toast({ title: 'Error', description: 'Please select a lead and at least one item', variant: 'destructive' });
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

    addTransaction({
      lead_id: selectedLead,
      total_amount: totalAmount,
      amount_paid: 0,
      payment_status: 'unpaid',
      notes: txnNotes || null,
      created_by: null,
    }, items);

    toast({ title: 'Success', description: 'Transaction created successfully' });
    setCreateDialogOpen(false);
    setSelectedLead('');
    setSelectedItems([]);
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
                        <TableCell>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
                        <TableCell className="font-medium">{txn.transaction_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead?.name}</p>
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
                                {items.map(i => (
                                  <div key={i.id} className="flex justify-between text-sm p-2 bg-background rounded mb-1">
                                    <span className="flex items-center gap-2">
                                      <Receipt className="h-3 w-3 text-muted-foreground" />
                                      {i.item_name}
                                      {i.size && <span className="text-muted-foreground">({i.size})</span>}
                                    </span>
                                    {isAdmin && <span>₹{i.final_price.toLocaleString()}</span>}
                                  </div>
                                ))}
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
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Select Lead */}
            <div className="space-y-2">
              <Label>Select Buyer (Lead)</Label>
              <Select value={selectedLead} onValueChange={setSelectedLead}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lead..." />
                </SelectTrigger>
                <SelectContent>
                  {convertedLeads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} {lead.company ? `- ${lead.company}` : ''} ({lead.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Only leads that are not yet converted are shown</p>
            </div>

            {/* Add Stalls */}
            <div className="space-y-2">
              <Label>Add Stall</Label>
              <Select onValueChange={(v) => handleAddItem('stall', v)} value="">
                <SelectTrigger>
                  <SelectValue placeholder="Select a stall to add..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStalls.map(stall => (
                    <SelectItem key={stall.id} value={stall.id} disabled={selectedItems.some(i => i.id === stall.id)}>
                      {stall.stall_number} ({stall.size}) - ₹{stall.base_rent.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Services */}
            <div className="space-y-2">
              <Label>Add Service/Add-on</Label>
              <Select onValueChange={(v) => handleAddItem('service', v)} value="">
                <SelectTrigger>
                  <SelectValue placeholder="Select a service to add..." />
                </SelectTrigger>
                <SelectContent>
                  {services.filter(s => s.is_unlimited || s.sold_quantity < s.quantity).map(service => (
                    <SelectItem key={service.id} value={service.id} disabled={selectedItems.some(i => i.id === service.id)}>
                      {service.name} - ₹{service.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Items</Label>
                <div className="border rounded-lg p-3 space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">
                        <Badge variant="outline" className="mr-2">{item.type}</Badge>
                        {item.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">₹{item.price.toLocaleString()}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="h-6 w-6 p-0 text-destructive">
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t font-semibold">
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
          <div className="flex justify-end gap-3">
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
