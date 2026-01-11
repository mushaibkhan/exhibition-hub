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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StallStatus, Stall } from '@/types/database';
import { Search, UserPlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<StallStatus, string> = { 
  available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', 
  reserved: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', 
  sold: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', 
  pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', 
  blocked: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' 
};
const statusLabels: Record<StallStatus, string> = { available: 'Available', reserved: 'Reserved', sold: 'Sold', pending: 'Pending', blocked: 'Blocked' };

const Stalls = () => {
  const { stalls, isAdmin, updateStall, leads, getLeadById, getServiceAllocationsByStallId, services } = useMockData();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [formData, setFormData] = useState({ 
    lead_id: '' as string | null, 
    status: 'available' as StallStatus, 
    notes: '' 
  });

  const filteredStalls = stalls.filter(s => 
    s.stall_number.toLowerCase().includes(search.toLowerCase()) && 
    (statusFilter === 'all' || s.status === statusFilter)
  );

  const handleEdit = (stall: Stall) => {
    setEditingStall(stall);
    setFormData({ 
      lead_id: stall.lead_id || '', 
      status: stall.status, 
      notes: stall.notes || '' 
    });
  };

  const handleSave = () => {
    if (editingStall) {
      updateStall(editingStall.id, { 
        lead_id: formData.lead_id || null, 
        status: formData.status, 
        notes: formData.notes || null 
      });
      toast({ title: 'Success', description: 'Stall assignment updated successfully' });
      setEditingStall(null);
    }
  };

  const handleClearAssignment = () => {
    setFormData({ ...formData, lead_id: '', status: 'available' });
  };

  const getServicesForStall = (stallId: string) => {
    const allocations = getServiceAllocationsByStallId(stallId);
    return allocations.map(a => {
      const service = services.find(s => s.id === a.service_id);
      return service ? { ...service, quantity: a.quantity } : null;
    }).filter(Boolean);
  };

  return (
    <MockAppLayout title="Stalls" subtitle="Assign leads to stalls and manage allocations">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.length}</div><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
          <Card className="border-l-4 border-l-emerald-400"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'available').length}</div><p className="text-sm text-muted-foreground">Available</p></CardContent></Card>
          <Card className="border-l-4 border-l-blue-400"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'sold').length}</div><p className="text-sm text-muted-foreground">Sold</p></CardContent></Card>
          <Card className="border-l-4 border-l-orange-400"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'pending').length}</div><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
          <Card className="border-l-4 border-l-yellow-400"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'reserved').length}</div><p className="text-sm text-muted-foreground">Reserved</p></CardContent></Card>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search stalls..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stall No.</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Floor</TableHead>
                  {isAdmin && <TableHead>Base Rent</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStalls.map((stall) => {
                  const lead = stall.lead_id ? getLeadById(stall.lead_id) : null;
                  const stallServices = getServicesForStall(stall.id);
                  return (
                    <TableRow key={stall.id}>
                      <TableCell className="font-medium">{stall.stall_number}</TableCell>
                      <TableCell>{stall.size}</TableCell>
                      <TableCell>{stall.zone}</TableCell>
                      {isAdmin && <TableCell>₹{stall.base_rent.toLocaleString()}</TableCell>}
                      <TableCell><Badge className={statusColors[stall.status]}>{statusLabels[stall.status]}</Badge></TableCell>
                      <TableCell>
                        {lead ? (
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-muted-foreground">{lead.company || lead.phone}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {stallServices.length > 0 ? (
                          <Badge variant="secondary">{stallServices.length} service{stallServices.length > 1 ? 's' : ''}</Badge>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(stall)}>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingStall} onOpenChange={(o) => !o && setEditingStall(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Person to Stall {editingStall?.stall_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Stall Info (read-only) */}
            <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="font-medium">{editingStall?.size}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Floor</p>
                <p className="font-medium">{editingStall?.zone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Base Rent</p>
                <p className="font-medium">₹{editingStall?.base_rent.toLocaleString()}</p>
              </div>
            </div>

            {/* Assign Lead */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Assign Lead / Person</Label>
                {formData.lead_id && (
                  <Button variant="ghost" size="sm" onClick={handleClearAssignment} className="h-6 text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <Select value={formData.lead_id || ''} onValueChange={(v) => setFormData({ ...formData, lead_id: v || null })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lead to assign" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} {lead.company ? `- ${lead.company}` : ''} ({lead.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leads can be added from the Leads page
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Stall Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as StallStatus })}>
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
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                placeholder="Add notes about this assignment..."
                rows={3} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingStall(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save Assignment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MockAppLayout>
  );
};

export default Stalls;
