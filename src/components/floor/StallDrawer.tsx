import { useState } from 'react';
import { Stall, Lead, Transaction } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

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
  const { isAdmin, isMaintainer } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState(stall?.notes || '');
  const [status, setStatus] = useState(stall?.status || 'available');
  const [isSaving, setIsSaving] = useState(false);

  if (!stall) return null;

  const handleSave = async () => {
    setIsSaving(true);
    
    const updates: Partial<Stall> = { notes };
    
    // Maintainers can only change to reserved
    if (isMaintainer && status === 'reserved' && stall.status === 'available') {
      updates.status = 'reserved';
    }
    
    // Admins can change any status
    if (isAdmin) {
      updates.status = status as Stall['status'];
    }

    const { error } = await supabase
      .from('stalls')
      .update(updates)
      .eq('id', stall.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update stall',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Stall updated successfully',
      });
      onUpdate();
      onOpenChange(false);
    }

    setIsSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <span>Stall {stall.stall_number}</span>
            <Badge variant="outline" className={statusColors[stall.status]}>
              {statusLabels[stall.status]}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
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
          {lead && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Buyer</h3>
                <div className="text-sm space-y-2">
                  <p><span className="text-muted-foreground">Name:</span> {lead.name}</p>
                  <p><span className="text-muted-foreground">Company:</span> {lead.company || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {lead.phone}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Transaction */}
          {transaction && isAdmin && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transaction</h3>
                <div className="text-sm space-y-2">
                  <p><span className="text-muted-foreground">ID:</span> {transaction.transaction_number}</p>
                  <p><span className="text-muted-foreground">Total:</span> ₹{transaction.total_amount.toLocaleString()}</p>
                  <p><span className="text-muted-foreground">Paid:</span> ₹{transaction.amount_paid.toLocaleString()}</p>
                  <p><span className="text-muted-foreground">Pending:</span> ₹{(transaction.total_amount - transaction.amount_paid).toLocaleString()}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Status Change */}
          <div className="space-y-3">
            <Label>Status</Label>
            {isAdmin ? (
              <Select value={status} onValueChange={(v) => setStatus(v as Stall['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="pending">Payment Pending</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            ) : isMaintainer && stall.status === 'available' ? (
              <Select value={status} onValueChange={(v) => setStatus(v as Stall['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{statusLabels[stall.status]}</p>
            )}
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
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? 'Saving...' : 'Save Changes'}
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
