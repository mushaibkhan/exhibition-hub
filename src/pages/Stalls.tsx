import { useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/MockDataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StallStatus, Stall } from '@/types/database';
import { Search, Eye, ExternalLink, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<StallStatus, string> = { 
  available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', 
  reserved: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', 
  sold: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', 
  pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', 
  blocked: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' 
};
const statusLabels: Record<StallStatus, string> = { 
  available: 'Available', 
  reserved: 'Reserved', 
  sold: 'Fully Paid', 
  pending: 'Partial Payment', 
  blocked: 'Blocked' 
};

const Stalls = () => {
  const { 
    stalls, isAdmin, 
    transactions, transactionItems, 
    getLeadById, getServiceAllocationsByStallId, services,
    getPaymentsByTransactionId
  } = useMockData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewingStall, setViewingStall] = useState<Stall | null>(null);

  const filteredStalls = stalls.filter(s => 
    s.stall_number.toLowerCase().includes(search.toLowerCase()) && 
    (statusFilter === 'all' || s.status === statusFilter)
  );

  // Get transaction info for a stall
  const getStallTransactionInfo = (stallId: string) => {
    const txnItem = transactionItems.find(ti => ti.stall_id === stallId);
    if (!txnItem) return null;
    const txn = transactions.find(t => t.id === txnItem.transaction_id);
    if (!txn) return null;
    const lead = getLeadById(txn.lead_id);
    const payments = getPaymentsByTransactionId(txn.id);
    return { transaction: txn, lead, item: txnItem, payments };
  };

  const getServicesForStall = (stallId: string) => {
    const allocations = getServiceAllocationsByStallId(stallId);
    return allocations.map(a => {
      const service = services.find(s => s.id === a.service_id);
      return service ? { ...service, quantity: a.quantity } : null;
    }).filter(Boolean);
  };

  const handleViewStall = (stall: Stall) => {
    setViewingStall(stall);
  };

  const stallInfo = viewingStall ? getStallTransactionInfo(viewingStall.id) : null;
  const stallServices = viewingStall ? getServicesForStall(viewingStall.id) : [];

  return (
    <MockAppLayout title="Stalls" subtitle="View stall allocations (managed via Transactions)">
      <div className="space-y-6">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.length}</div><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
          <Card className="border-l-4 border-l-emerald-400"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'available').length}</div><p className="text-sm text-muted-foreground">Available</p></CardContent></Card>
          <Card className="border-l-4 border-l-green-400"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'sold').length}</div><p className="text-sm text-muted-foreground">Fully Paid</p></CardContent></Card>
          <Card className="border-l-4 border-l-orange-400"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'pending').length}</div><p className="text-sm text-muted-foreground">Partial Payment</p></CardContent></Card>
          <Card className="border-l-4 border-l-yellow-400"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'reserved').length}</div><p className="text-sm text-muted-foreground">Reserved</p></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search stalls..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="sold">Fully Paid</SelectItem>
                <SelectItem value="pending">Partial Payment</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => navigate('/transactions')} className="w-full sm:w-auto h-10 min-h-[44px]">
            <ExternalLink className="h-4 w-4 mr-2" />
            Go to Transactions
          </Button>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-full">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stall No.</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Floor</TableHead>
                  {isAdmin && <TableHead>Base Rent</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStalls.map((stall) => {
                  const txnInfo = getStallTransactionInfo(stall.id);
                  return (
                    <TableRow key={stall.id}>
                      <TableCell 
                        className="font-medium hover:text-primary hover:underline cursor-pointer"
                        onClick={() => navigate('/', { state: { stallId: stall.id } })}
                      >
                        {stall.stall_number}
                      </TableCell>
                      <TableCell>3×2</TableCell>
                      <TableCell>{stall.zone}</TableCell>
                      {isAdmin && <TableCell>₹{stall.base_rent.toLocaleString()}</TableCell>}
                      <TableCell><Badge className={statusColors[stall.status]}>{statusLabels[stall.status]}</Badge></TableCell>
                      <TableCell>
                        {txnInfo?.lead ? (
                          <div>
                            <p className="font-medium">{txnInfo.lead.name}</p>
                            <p className="text-sm text-muted-foreground">{txnInfo.lead.company || txnInfo.lead.phone}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {txnInfo?.transaction ? (
                          <Badge 
                            variant="outline" 
                            className="cursor-pointer hover:bg-muted hover:text-primary"
                            onClick={() => navigate('/transactions', { state: { highlightTransaction: txnInfo.transaction.id } })}
                          >
                            {txnInfo.transaction.transaction_number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewStall(stall)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredStalls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 py-8">
                        <Square className="h-12 w-12 text-muted-foreground/50" />
                        <div className="space-y-1">
                          <p className="text-lg font-medium text-muted-foreground">
                            {search || statusFilter !== 'all'
                              ? 'No stalls match your criteria'
                              : 'No stalls found'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {search || statusFilter !== 'all'
                              ? 'Try adjusting your search or filter criteria.'
                              : 'Stalls will appear here once they are configured.'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground text-center">
          💡 Stalls are allocated through Transactions. Create a transaction to assign a stall to a buyer.
        </p>
        </div>

      {/* View Stall Details Dialog */}
      <Dialog open={!!viewingStall} onOpenChange={(o) => !o && setViewingStall(null)}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Stall {viewingStall?.stall_number}
              {viewingStall && <Badge className={statusColors[viewingStall.status]}>{statusLabels[viewingStall.status]}</Badge>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Stall Info */}
            <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="font-medium">3×2</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Floor</p>
                <p className="font-medium">{viewingStall?.zone}</p>
              </div>
              {isAdmin && (
                <div>
                  <p className="text-xs text-muted-foreground">Base Rent</p>
                  <p className="font-medium">₹{viewingStall?.base_rent.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Buyer Info */}
            {stallInfo?.lead && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Buyer</h4>
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {stallInfo.lead.name}</p>
                  <p><span className="text-muted-foreground">Company:</span> {stallInfo.lead.company || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {stallInfo.lead.phone}</p>
                </div>
              </div>
            )}

            {/* Transaction Info */}
            {stallInfo?.transaction && isAdmin && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Transaction</h4>
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <p><span className="text-muted-foreground">ID:</span> {stallInfo.transaction.transaction_number}</p>
                  <p><span className="text-muted-foreground">Total:</span> ₹{stallInfo.transaction.total_amount.toLocaleString()}</p>
                  <p><span className="text-muted-foreground">Paid:</span> ₹{stallInfo.transaction.amount_paid.toLocaleString()}</p>
                  <p className="font-medium">
                    <span className="text-muted-foreground">Pending:</span>{' '}
                    <span className={stallInfo.transaction.total_amount > stallInfo.transaction.amount_paid ? 'text-orange-600' : 'text-green-600'}>
                      ₹{(stallInfo.transaction.total_amount - stallInfo.transaction.amount_paid).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Services */}
            {stallServices.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Allocated Services</h4>
                <div className="space-y-1">
                  {stallServices.map((s: any) => (
                    <div key={s.id} className="flex justify-between p-2 bg-muted/50 rounded text-sm">
                      <span>{s.name}</span>
                      {isAdmin && <span>₹{s.price.toLocaleString()}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Not Allocated */}
            {!stallInfo && viewingStall?.status === 'available' && (
              <div className="text-center py-6 text-muted-foreground">
                <p>This stall is available.</p>
                <Button variant="link" onClick={() => { setViewingStall(null); navigate('/transactions'); }}>
                  Create a transaction to assign it →
                </Button>
              </div>
            )}

            {/* Notes */}
            {viewingStall?.notes && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Notes</h4>
                <p className="text-sm p-3 bg-muted/50 rounded-lg">{viewingStall.notes}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            {stallInfo?.transaction && (
              <Button variant="outline" onClick={() => { setViewingStall(null); navigate('/transactions'); }}>
                View Transaction
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewingStall(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MockAppLayout>
  );
};

export default Stalls;
