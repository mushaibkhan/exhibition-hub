import { useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/MockDataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StallStatus, Stall } from '@/types/database';
import { Search, Edit } from 'lucide-react';
import { StallDrawer } from '@/components/floor/StallDrawer';

const statusColors: Record<StallStatus, string> = { available: 'bg-pink-100 text-pink-800', reserved: 'bg-yellow-100 text-yellow-800', sold: 'bg-green-100 text-green-800', pending: 'bg-orange-100 text-orange-800', blocked: 'bg-gray-100 text-gray-800' };
const statusLabels: Record<StallStatus, string> = { available: 'Available', reserved: 'Reserved', sold: 'Sold', pending: 'Pending', blocked: 'Blocked' };

const Stalls = () => {
  const { stalls, isAdmin } = useMockData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredStalls = stalls.filter(s => s.stall_number.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'all' || s.status === statusFilter));

  return (
    <MockAppLayout title="Stalls" subtitle="Manage exhibition stalls">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.length}</div><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
          <Card className="bg-stall-available/30"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'available').length}</div><p className="text-sm text-muted-foreground">Available</p></CardContent></Card>
          <Card className="bg-stall-sold/30"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'sold').length}</div><p className="text-sm text-muted-foreground">Sold</p></CardContent></Card>
          <Card className="bg-stall-pending/30"><CardContent className="pt-6"><div className="text-2xl font-bold">{stalls.filter(s => s.status === 'pending').length}</div><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search stalls..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="available">Available</SelectItem><SelectItem value="reserved">Reserved</SelectItem><SelectItem value="sold">Sold</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select>
        </div>
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Stall No.</TableHead><TableHead>Size</TableHead><TableHead>Zone</TableHead>{isAdmin && <TableHead>Base Rent</TableHead>}<TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {filteredStalls.map((stall) => (<TableRow key={stall.id}><TableCell className="font-medium">{stall.stall_number}</TableCell><TableCell>{stall.size}</TableCell><TableCell>{stall.zone}</TableCell>{isAdmin && <TableCell>₹{stall.base_rent.toLocaleString()}</TableCell>}<TableCell><Badge className={statusColors[stall.status]}>{statusLabels[stall.status]}</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => { setSelectedStall(stall); setDrawerOpen(true); }}><Edit className="h-4 w-4" /></Button></TableCell></TableRow>))}
        </TableBody></Table></CardContent></Card>
      </div>
      <StallDrawer stall={selectedStall} open={drawerOpen} onOpenChange={setDrawerOpen} onUpdate={() => {}} />
    </MockAppLayout>
  );
};

export default Stalls;
