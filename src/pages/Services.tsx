import { useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/MockDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Service, ServiceCategory } from '@/types/database';
import { Search, Sparkles, Package, Utensils, PlusCircle, Plus, Edit, MapPin } from 'lucide-react';

const categoryColors: Record<ServiceCategory, string> = { sponsor: 'bg-purple-100 text-purple-800', signboard: 'bg-blue-100 text-blue-800', food_court: 'bg-orange-100 text-orange-800', add_on: 'bg-green-100 text-green-800' };
const categoryLabels: Record<ServiceCategory, string> = { sponsor: 'Sponsor', signboard: 'Signboard', food_court: 'Food Court', add_on: 'Add-on' };
const categoryIcons: Record<ServiceCategory, React.ElementType> = { sponsor: Sparkles, signboard: Package, food_court: Utensils, add_on: PlusCircle };

const Services = () => {
  const { services, isAdmin, addService, updateService, stalls, addServiceAllocation, serviceAllocations, getServiceAllocationsByStallId } = useMockData();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStallId, setSelectedStallId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({ name: '', category: 'add_on' as ServiceCategory, description: '', price: 0, quantity: 0, is_unlimited: false, notes: '' });

  const filteredServices = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) && (categoryFilter === 'all' || s.category === categoryFilter));
  const grouped = { sponsor: services.filter(s => s.category === 'sponsor'), signboard: services.filter(s => s.category === 'signboard'), food_court: services.filter(s => s.category === 'food_court'), add_on: services.filter(s => s.category === 'add_on') };

  const resetForm = () => { setFormData({ name: '', category: 'add_on', description: '', price: 0, quantity: 0, is_unlimited: false, notes: '' }); setEditingService(null); };

  const handleSubmit = () => {
    if (!formData.name) { toast({ title: 'Error', description: 'Name required', variant: 'destructive' }); return; }
    if (editingService) { updateService(editingService.id, formData); toast({ title: 'Success', description: 'Service updated' }); }
    else { addService({ ...formData, sold_quantity: 0 }); toast({ title: 'Success', description: 'Service added' }); }
    setDialogOpen(false); resetForm();
  };

  const handleEdit = (service: Service) => { setEditingService(service); setFormData({ name: service.name, category: service.category, description: service.description || '', price: service.price, quantity: service.quantity, is_unlimited: service.is_unlimited, notes: service.notes || '' }); setDialogOpen(true); };

  const handleAllocate = (service: Service) => { setSelectedService(service); setSelectedStallId(''); setQuantity(1); setAllocateDialogOpen(true); };

  const confirmAllocate = () => {
    if (selectedService && selectedStallId) {
      addServiceAllocation({ service_id: selectedService.id, stall_id: selectedStallId, quantity });
      const stall = stalls.find(s => s.id === selectedStallId);
      toast({ title: 'Success', description: `${selectedService.name} allocated to ${stall?.stall_number}` });
      setAllocateDialogOpen(false);
    }
  };

  const soldStalls = stalls.filter(s => s.status === 'sold' || s.status === 'pending' || s.status === 'reserved');

  return (
    <MockAppLayout title="Services" subtitle="Manage sellable services and add-ons">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {(Object.keys(grouped) as ServiceCategory[]).map(cat => { const Icon = categoryIcons[cat]; const rev = grouped[cat].reduce((s, x) => s + x.price * x.sold_quantity, 0); return (<Card key={cat}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">{categoryLabels[cat]}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{grouped[cat].length}</div>{isAdmin && <p className="text-xs text-muted-foreground">₹{rev.toLocaleString()}</p>}</CardContent></Card>); })}
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="sponsor">Sponsor</SelectItem><SelectItem value="signboard">Signboard</SelectItem><SelectItem value="food_court">Food Court</SelectItem><SelectItem value="add_on">Add-on</SelectItem></SelectContent></Select>
          {isAdmin && <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Service</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>{editingService ? 'Edit' : 'Add'} Service</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4"><div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div><div><Label>Category</Label><Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as ServiceCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sponsor">Sponsor</SelectItem><SelectItem value="signboard">Signboard</SelectItem><SelectItem value="food_court">Food Court</SelectItem><SelectItem value="add_on">Add-on</SelectItem></SelectContent></Select></div></div>
                <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
                <div className="grid grid-cols-2 gap-4"><div><Label>Price (₹)</Label><Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} /></div><div><Label>Quantity</Label><Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} disabled={formData.is_unlimited} /></div></div>
                <div className="flex items-center gap-2"><Checkbox checked={formData.is_unlimited} onCheckedChange={(c) => setFormData({ ...formData, is_unlimited: !!c })} /><Label>Unlimited Quantity</Label></div>
                <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></div>
              </div>
              <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button><Button onClick={handleSubmit}>{editingService ? 'Update' : 'Add'}</Button></div>
            </DialogContent>
          </Dialog>}
        </div>
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead>{isAdmin && <TableHead>Price</TableHead>}<TableHead>Availability</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {filteredServices.map((s) => { const avail = s.is_unlimited ? '∞' : s.quantity - s.sold_quantity; const soldOut = !s.is_unlimited && s.sold_quantity >= s.quantity; return (<TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell><Badge className={categoryColors[s.category]}>{categoryLabels[s.category]}</Badge></TableCell><TableCell className="max-w-[200px] truncate text-muted-foreground">{s.description || '-'}</TableCell>{isAdmin && <TableCell>₹{s.price.toLocaleString()}</TableCell>}<TableCell>{soldOut ? <Badge variant="destructive">Sold Out</Badge> : <span className="text-sm">{avail} available</span>}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1">{isAdmin && <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button>}<Button variant="ghost" size="icon" onClick={() => handleAllocate(s)} disabled={soldOut}><MapPin className="h-4 w-4" /></Button></div></TableCell></TableRow>); })}
        </TableBody></Table></CardContent></Card>
      </div>

      <Dialog open={allocateDialogOpen} onOpenChange={setAllocateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Allocate {selectedService?.name} to Stall</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Select Stall</Label><Select value={selectedStallId} onValueChange={setSelectedStallId}><SelectTrigger><SelectValue placeholder="Choose a stall" /></SelectTrigger><SelectContent>{soldStalls.map(stall => (<SelectItem key={stall.id} value={stall.id}>{stall.stall_number} - {stall.zone}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Quantity</Label><Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></div>
          </div>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setAllocateDialogOpen(false)}>Cancel</Button><Button onClick={confirmAllocate} disabled={!selectedStallId}>Allocate</Button></div>
        </DialogContent>
      </Dialog>
    </MockAppLayout>
  );
};

export default Services;
