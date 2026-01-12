import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stall, Lead, Transaction } from '@/types/database';
import { useMockData } from '@/contexts/MockDataContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ShoppingCart, PlusCircle, Banknote, CreditCard, Smartphone } from 'lucide-react';

interface StallDrawerProps {
  stall: Stall | null;
  lead?: Lead | null;
  transaction?: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const statusLabels = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
  pending: 'Payment Pending',
  blocked: 'Blocked',
};

const statusColors = {
  available: 'bg-pink-100 text-pink-800 border-pink-300',
  reserved: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  sold: 'bg-green-100 text-green-800 border-green-300',
  pending: 'bg-orange-100 text-orange-800 border-orange-300',
  blocked: 'bg-gray-100 text-gray-800 border-gray-300',
};

export const StallDrawer = ({ stall, lead, transaction, open, onOpenChange, onUpdate }: StallDrawerProps) => {
  const { 
    isAdmin, role, updateStall: updateStallFn, getLeadById, transactions, 
    getTransactionsByStallId, getItemsByTransactionId, getPaymentsByTransactionId,
    getServiceAllocationsByStallId, services, getServiceById
  } = useMockData();
  const navigate = useNavigate();
  const isMaintainer = role === 'maintainer';
  const { toast } = useToast();
  const [notes, setNotes] = useState(stall?.notes || '');

  // Reset form when stall changes
  useEffect(() => {
    if (stall) {
      setNotes(stall.notes || '');
    }
  }, [stall]);

  if (!stall) return null;

  // Get all transactions for this stall
  const stallTransactions = getTransactionsByStallId(stall.id);
  
  // Get lead from first transaction or prop
  const firstTxn = stallTransactions[0];
  const stallLead = firstTxn ? getLeadById(firstTxn.lead_id) : lead;
  
  // Get all services for this stall with their allocations
  const serviceAllocations = getServiceAllocationsByStallId(stall.id);
  const stallServices = serviceAllocations.map(alloc => {
    const service = getServiceById(alloc.service_id);
    return service ? { ...service, allocation: alloc } : null;
  }).filter(Boolean);
  
  // Get all payments across all transactions, sorted by date
  const allPayments = stallTransactions.flatMap(txn => 
    getPaymentsByTransactionId(txn.id).map(p => ({ ...p, transaction: txn }))
  ).sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  const handleSave = () => {
    const updates: Partial<Stall> = { notes };
    
    // Status is derived from transactions/payments, not manually editable
    updateStallFn(stall.id, updates);
    toast({
      title: 'Success',
      description: 'Stall updated successfully',
    });
    onUpdate();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col max-h-screen h-screen">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-3">
            <span>Stall {stall.stall_number}</span>
            <Badge variant="outline" className={statusColors[stall.status]}>
              {statusLabels[stall.status]}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 flex-1 overflow-y-auto pr-2">
          {/* Stall Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Size</span>
                <p className="font-medium">{stall.size}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Zone</span>
                <p className="font-medium">{stall.zone || 'N/A'}</p>
              </div>
              {isAdmin && (
                <div>
                  <span className="text-muted-foreground">Base Rent</span>
                  <p className="font-medium">₹{stall.base_rent.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Assigned Buyer */}
          {stallLead && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Buyer</h3>
                <div className="text-sm space-y-2">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{' '}
                    <span 
                      className="font-medium hover:text-primary hover:underline cursor-pointer"
                      onClick={() => navigate('/leads')}
                    >
                      {stallLead.name}
                    </span>
                  </p>
                  <p><span className="text-muted-foreground">Company:</span> {stallLead.company || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {stallLead.phone}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Transactions */}
          {stallTransactions.length > 0 && isAdmin && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transactions</h3>
                <div className="space-y-3">
                  {stallTransactions.map((txn, idx) => {
                    const items = getItemsByTransactionId(txn.id);
                    const hasStall = items.some(i => i.item_type === 'stall');
                    const hasServices = items.some(i => i.item_type === 'service');
                    const txnType = hasStall ? 'Stall Purchase' : 'Service Add-on';
                    // Alternate background colors for better visual separation
                    const bgColor = idx % 2 === 0 ? 'bg-muted/50' : 'bg-muted/30';
                    
                    return (
                      <div key={txn.id} className={`p-3 ${bgColor} rounded-lg space-y-2 text-sm border border-border`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {hasStall ? (
                              <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <PlusCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="font-semibold text-foreground">{format(new Date(txn.created_at), 'dd MMM yyyy')}</span>
                          </div>
                          <Badge variant="outline" className="text-xs font-medium">{txnType}</Badge>
                        </div>
                        <div className="space-y-1 text-xs">
                          <p>
                            <span className="text-muted-foreground">Transaction:</span>{' '}
                            <span 
                              className="font-medium hover:text-primary hover:underline cursor-pointer"
                              onClick={() => navigate('/transactions', { state: { highlightTransaction: txn.id } })}
                            >
                              {txn.transaction_number}
                            </span>
                          </p>
                          <p><span className="text-muted-foreground">Total:</span> ₹{txn.total_amount.toLocaleString()}</p>
                          <p><span className="text-muted-foreground">Paid:</span> ₹{txn.amount_paid.toLocaleString()}</p>
                          {txn.total_amount > txn.amount_paid && (
                            <p><span className="text-muted-foreground">Pending:</span> ₹{(txn.total_amount - txn.amount_paid).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Services */}
          {stallServices.length > 0 && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Services</h3>
                <div className="space-y-2">
                  {stallServices.map((serviceItem: any) => {
                    const service = serviceItem;
                    const alloc = serviceItem.allocation;
                    // Find which transaction this service belongs to (by matching created_at approximately or by stall_id)
                    const relatedTxn = stallTransactions.find(txn => {
                      const txnDate = new Date(txn.created_at).getTime();
                      const allocDate = new Date(alloc.created_at).getTime();
                      // Service allocation should be close to transaction date
                      return Math.abs(txnDate - allocDate) < 10000; // 10 seconds tolerance
                    });
                    
                    return (
                      <div key={service.id} className="p-2 bg-muted/50 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{service.name}</span>
                          {isAdmin && <span>₹{service.price.toLocaleString()}</span>}
                        </div>
                        {relatedTxn && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Transaction on {format(new Date(relatedTxn.created_at), 'dd MMM')} – {relatedTxn.transaction_number}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Payment History */}
          {allPayments.length > 0 && isAdmin && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payment History</h3>
                  <span className="text-xs text-muted-foreground">
                    Total: ₹{allPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-2">
                  {allPayments.map((payment) => {
                    const modeIcons: Record<string, React.ElementType> = {
                      cash: Banknote,
                      upi: Smartphone,
                      bank: CreditCard,
                    };
                    const Icon = modeIcons[payment.payment_mode] || Banknote;
                    const modeColors: Record<string, string> = {
                      cash: 'text-green-600 dark:text-green-400',
                      upi: 'text-purple-600 dark:text-purple-400',
                      bank: 'text-blue-600 dark:text-blue-400',
                    };
                    
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm border border-border">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${modeColors[payment.payment_mode] || 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-medium">{format(new Date(payment.payment_date), 'dd MMM yyyy')}</p>
                            <p className="text-xs text-muted-foreground">
                              <span 
                                className="hover:text-primary hover:underline cursor-pointer"
                                onClick={() => navigate('/transactions', { state: { highlightTransaction: payment.transaction_id } })}
                              >
                                {payment.transaction.transaction_number}
                              </span>
                              {' – '}
                              <span className="font-medium">{payment.payment_mode.toUpperCase()}</span>
                              {payment.reference_id && ` (${payment.reference_id})`}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold">₹{payment.amount.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Status Display (Read-only) */}
          <div className="space-y-3">
            <Label>Status</Label>
            <p className="text-sm text-muted-foreground">{statusLabels[stall.status]}</p>
            <p className="text-xs text-muted-foreground italic">
              Status is automatically derived from transactions and payments.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this stall..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
