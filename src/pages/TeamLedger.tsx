import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useSupabaseData } from '@/contexts/SupabaseDataContext';
// import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Plus, Search, Users, AlertTriangle, CheckCircle2, Clock, 
  ArrowRight, Banknote, Loader2, Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { InternalLedger } from '@/types/database';

const TeamLedger = () => {
  const { role, isAdmin, internalLedger, addInternalTransaction, settleInternalTransaction } = useSupabaseData();
  // const { user, isMaintainer } = useAuth();

  // Mock profile based on role slider
  const isMaintainer = role === 'maintainer';
  const mockProfile = useMemo(() => {
    if (role === 'admin') return { full_name: 'Admin User' };
    if (role === 'maintainer') return { full_name: 'Maintainer User' };
    return { full_name: '' };
  }, [role]);

  const currentUserName = mockProfile.full_name;
  const { toast } = useToast();

  // const currentUserName = user?.full_name || user?.email || '';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  
  // Add Transaction Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    from_name: '',
    to_name: '',
    amount: '',
    description: '',
  });

  // Simple string-based check: if from_name contains "Maintainer", it's final (always Completed)
  const isFromMaintainer = (fromName: string) =>
    (fromName || '').toLowerCase().includes('maintainer');

  // Filter ledger based on role
  const visibleLedger = useMemo(() => {
    if (isAdmin) {
      return internalLedger;
    }
    // Maintainer only sees their own entries
    return internalLedger.filter(entry => 
      entry.from_name.toLowerCase() === currentUserName.toLowerCase()
    );
  }, [internalLedger, isAdmin, currentUserName]);

  // Calculate stats based on visible ledger
  // Pending and Settled calculations
  // Removed duplicate totalPending useMemo

  // For Maintainers: all entries are settled, so totalSettled = total
  const totalSettled = useMemo(() => {
    if (isAdmin) {
      return visibleLedger.filter(e => e.status === 'settled').reduce((sum, entry) => sum + entry.amount, 0);
    }
    return visibleLedger.reduce((sum, entry) => sum + entry.amount, 0);
  }, [visibleLedger, isAdmin]);

  // For Maintainers: Cash in Hand = Total Cash Payments - Total Handovers
  // (Assume payments are available from useSupabaseData, e.g. payments array)
  const { payments = [] } = useSupabaseData();
  const totalPayments = useMemo(() => {
    // Only count cash payments for this user (if needed)
    // For now, sum all payments if not user-specific
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);
  const cashInHand = isMaintainer ? (totalPayments - totalSettled) : 0;

  // Pending that requires manual settlement (excludes maintainer-created transactions per Finality rule)
  const pendingRequiringSettlement = useMemo(() =>
    internalLedger.filter(
      t => t.status === 'pending' && !isFromMaintainer(t.from_name)
    ),
    [internalLedger]
  );

  const totalPending = isAdmin
    ? pendingRequiringSettlement.reduce((sum, t) => sum + t.amount, 0)
    : 0;

  const myPendingHandovers = isAdmin
    ? visibleLedger
        .filter(t => t.status === 'pending' && !isFromMaintainer(t.from_name))
        .reduce((sum, t) => sum + t.amount, 0)
    : 0;

  // Pending by person (for admin view) - only counts transactions requiring manual settlement
  const pendingByPerson = useMemo(() => {
    const personTotals: Record<string, number> = {};
    internalLedger
      .filter(entry => entry.status === 'pending' && !isFromMaintainer(entry.from_name))
      .forEach(entry => {
        personTotals[entry.from_name] = (personTotals[entry.from_name] || 0) + entry.amount;
      });

    return Object.entries(personTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [internalLedger]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let entries = [...visibleLedger];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      entries = entries.filter(entry => 
        entry.from_name.toLowerCase().includes(searchLower) ||
        entry.to_name.toLowerCase().includes(searchLower) ||
        (entry.description && entry.description.toLowerCase().includes(searchLower))
      );
    }

    // Status filter (Finality: maintainer-created count as settled/completed)
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        entries = entries.filter(entry => entry.status === 'pending' && !isFromMaintainer(entry.from_name));
      } else {
        entries = entries.filter(entry => entry.status === 'settled' || isFromMaintainer(entry.from_name));
      }
    }

    // Sort
    if (sortBy === 'amount') {
      entries.sort((a, b) => b.amount - a.amount);
    } else {
      entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return entries;
  }, [visibleLedger, search, statusFilter, sortBy]);

  // Redirect users without proper role
  if (!isAdmin && !isMaintainer) {
    return <Navigate to="/" replace />;
  }

  // Reset form when dialog opens - Maintainer: lock From; Admin: clear for free-form entry
  const openDialog = () => {
    setFormData({
      from_name: isMaintainer && !isAdmin ? currentUserName : '',
      to_name: '',
      amount: '',
      description: '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const amount = parseFloat(formData.amount);
    if (!formData.from_name.trim()) {
      toast({ title: 'Error', description: 'Please enter who is giving the money.', variant: 'destructive' });
      return;
    }
    if (!formData.to_name.trim()) {
      toast({ title: 'Error', description: 'Who is receiving the cash is required.', variant: 'destructive' });
      return;
    }
    if (!amount || amount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount greater than zero.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Send from_name and to_name as raw strings to Supabase (manual journal)
      const payload = {
        from_name: formData.from_name.trim(),
        to_name: formData.to_name.trim(),
        amount,
        description: formData.description.trim() || null,
        exhibition_id: '',
      };
      await addInternalTransaction(payload);

      toast({ 
        title: 'Handover Recorded', 
        description: `${formData.from_name} → ${formData.to_name}: ₹${amount.toLocaleString()}` 
      });
      
      setDialogOpen(false);
      setFormData({ from_name: '', to_name: '', amount: '', description: '' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to add transaction.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettle = async (entry: InternalLedger) => {
    try {
      await settleInternalTransaction(entry.id);
      toast({ 
        title: 'Transaction Settled', 
        description: `Marked ₹${entry.amount.toLocaleString()} from ${entry.from_name} as settled.` 
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to settle transaction.', variant: 'destructive' });
    }
  };

  const pageSubtitle = isAdmin 
    ? "Track internal cash handovers across the team" 
    : "Track your cash handovers";

  return (
    <MockAppLayout title="Team Ledger" subtitle={pageSubtitle}>
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {isAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">₹{totalPending.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingRequiringSettlement.length} pending handover(s) requiring settlement
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isAdmin ? 'Total Settled' : 'Total Cash Handed Over'}
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{totalSettled.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? `${visibleLedger.filter(e => e.status === 'settled').length} settled transaction(s)` : `${visibleLedger.length} handover(s) logged`}
              </p>
            </CardContent>
          </Card>

          {isAdmin ? (
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending by Person</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {pendingByPerson.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending handovers</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {pendingByPerson.slice(0, 5).map(({ name, amount }) => (
                      <div key={name} className="flex justify-between items-center text-sm">
                        <span className="truncate mr-2">{name}</span>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          ₹{amount.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                    {pendingByPerson.length > 5 && (
                      <p className="text-xs text-muted-foreground">+{pendingByPerson.length - 5} more</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash in Hand</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">₹{cashInHand.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Cash in hand = Payments - Handovers
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pending Alert (Admins only) */}
        {isAdmin && totalPending > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200">
                ₹{totalPending.toLocaleString()} pending collection from {pendingByPerson.length} team member(s)
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Review and settle handovers as cash is collected
              </p>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by name or description..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-9 h-10" 
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-[150px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="settled">Settled Only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-full sm:w-[150px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="amount">Sort by Amount</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openDialog} className="w-full sm:w-auto h-10">
            <Plus className="h-4 w-4 mr-2" />
            Add Handover
          </Button>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              {isAdmin ? 'All Transactions' : 'My Transactions'} ({filteredEntries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead></TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                        {isMaintainer && !isAdmin 
                          ? 'No handovers recorded yet. Add a handover when you give cash to an admin.'
                          : 'No transactions found'
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(entry.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">{entry.from_name}</TableCell>
                        <TableCell className="text-center px-1">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium">{entry.to_name}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{entry.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {entry.description || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isFromMaintainer(entry.from_name) || entry.status === 'settled' ? 'default' : 'outline'}
                            className={
                              isFromMaintainer(entry.from_name) || entry.status === 'settled'
                                ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300'
                            }
                          >
                            {isFromMaintainer(entry.from_name) ? 'Completed' : (entry.status === 'pending' ? 'Pending' : 'Settled')}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {/* Settle button: only for pending entries NOT from Maintainer */}
                            {entry.status === 'pending' && !isFromMaintainer(entry.from_name) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSettle(entry)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Settle
                              </Button>
                            )}
                            {(entry.status === 'settled' || isFromMaintainer(entry.from_name)) && entry.settled_at && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(entry.settled_at), 'dd MMM')}
                              </span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[450px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Record Cash Handover
            </DialogTitle>
            <DialogDescription>
              {isMaintainer && !isAdmin 
                ? 'Record when you hand over cash to an admin. Your name is attached as the sender.'
                : 'Log payments and handovers as a daily expense journal. Enter any names as strings.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="from_name">From *</Label>
              <Input
                id="from_name"
                placeholder={isAdmin ? 'Who is giving the cash' : undefined}
                value={formData.from_name}
                onChange={isAdmin ? (e) => setFormData({ ...formData, from_name: e.target.value }) : undefined}
                className="h-10"
                disabled={isMaintainer && !isAdmin}
                aria-describedby={isMaintainer && !isAdmin ? 'from-readonly' : undefined}
              />
              {isMaintainer && !isAdmin && (
                <p id="from-readonly" className="text-xs text-muted-foreground">
                  Locked to your identity
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="to_name">To *</Label>
              <Input
                id="to_name"
                placeholder="e.g., Omar, Aijaz, Anas, etc."
                value={formData.to_name}
                onChange={(e) => setFormData({ ...formData, to_name: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                placeholder="e.g., 5000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g., Cash from stall bookings, Day 1 collection"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto h-10">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto h-10">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Handover'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MockAppLayout>
  );
};

export default TeamLedger;
