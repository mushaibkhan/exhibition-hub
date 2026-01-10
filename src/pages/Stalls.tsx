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
import { Search, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<StallStatus, string> = { available: 'bg-pink-100 text-pink-800', reserved: 'bg-yellow-100 text-yellow-800', sold: 'bg-green-100 text-green-800', pending: 'bg-orange-100 text-orange-800', blocked: 'bg-gray-100 text-gray-800' };
const statusLabels: Record<StallStatus, string> = { available: 'Available', reserved: 'Reserved', sold: 'Sold', pending: 'Pending', blocked: 'Blocked' };

const Stalls = () => {
  const { stalls, isAdmin, updateStall, leads, getLeadById } = useMockData();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [formData, setFormData] = useState({ stall_number: '', size: '', base_rent: 0, status: 'available' as StallStatus, notes: '' });

  const filteredStalls = stalls.filter(s => s.stall_number.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'all' || s.status === statusFilter));

  const handleEdit = (stall: Stall) => {
    setEditingStall(stall);
    setFormData({ stall_number: stall.stall_number, size: stall.size, base_rent: stall.base_rent, status: stall.status, notes: stall.notes || '' });
  };

  const handleSave = () => {
    if (editingStall) {
      updateStall(editingStall.id, { stall_number: formData.stall_number, size: formData.size, base_rent: formData.base_rent, status: formData.status, notes: formData.notes || null });
      toast({ title: 'Success', description: 'Stall updated successfully' });
      setEditingStall(null);
    }
  };

  return (
    <MockAppLayout title="Stalls" subtitle="Manage exhibition stalls">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.length}</div><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
          <Card className="border-l-4 border-l-pink-400"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'available').length}</div><p className="text-sm text-muted-foreground">Available</p></CardContent></Card>
          <Card className="border-l-4 border-l-green-400"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'sold').length}</div><p className="text-sm text-muted-foreground">Sold</p></CardContent></Card>
          <Card className="border-l-4 border-l-orange-400"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'pending').length}</div><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
          <Card className="border-l-4 border-l-yellow-400"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'reserved').length}</div><p className="text-sm text-muted-foreground">Reserved</p></CardContent></Card>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search stalls..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="available">Available</SelectItem><SelectItem value="reserved">Reserved</SelectItem><SelectItem value="sold">Sold</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select>
        </div>
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Stall No.</TableHead><TableHead>Size</TableHead><TableHead>Floor</TableHead><TableHead>Assigned To</TableHead>{isAdmin && <TableHead>Base Rent</TableHead>}<TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {filteredStalls.map((stall) => {
            const lead = stall.lead_id ? getLeadById(stall.lead_id) : null;
            return (
              <TableRow key={stall.id}>
                <TableCell className="font-medium">{stall.stall_number}</TableCell>
                <TableCell>{stall.size}</TableCell>
                <TableCell>{stall.zone}</TableCell>
                <TableCell>{lead ? <span className="text-sm">{lead.name}<br/><span className="text-muted-foreground">{lead.company}</span></span> : '-'}</TableCell>
                {isAdmin && <TableCell>₹{stall.base_rent.toLocaleString()}</TableCell>}
                <TableCell><Badge className={statusColors[stall.status]}>{statusLabels[stall.status]}</Badge></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleEdit(stall)}><Edit className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            );
          })}
        </TableBody></Table></CardContent></Card>
      </div>

      <Dialog open={!!editingStall} onOpenChange={(o) => !o && setEditingStall(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Stall {editingStall?.stall_number}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Stall Number</Label><Input value={formData.stall_number} onChange={(e) => setFormData({ ...formData, stall_number: e.target.value })} /></div>
              <div><Label>Size</Label><Select value={formData.size} onValueChange={(v) => setFormData({ ...formData, size: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="3x3">3x3</SelectItem><SelectItem value="3x6">3x6</SelectItem><SelectItem value="6x6">6x6</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {isAdmin && <div><Label>Base Rent (₹)</Label><Input type="number" value={formData.base_rent} onChange={(e) => setFormData({ ...formData, base_rent: Number(e.target.value) })} /></div>}
              <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as StallStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="reserved">Reserved</SelectItem><SelectItem value="sold">Sold</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
          </div>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setEditingStall(null)}>Cancel</Button><Button onClick={handleSave}>Save Changes</Button></div>
        </DialogContent>
      </Dialog>
    </MockAppLayout>
  );
};

export default Stalls;
