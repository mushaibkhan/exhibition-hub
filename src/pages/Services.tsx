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
import { Search, Sparkles, Package, Utensils, PlusCircle, Plus, Edit, Store } from 'lucide-react';

const categoryColors: Record<ServiceCategory, string> = { 
  sponsor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', 
  signboard: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', 
  food_court: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', 
  add_on: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
};
const categoryLabels: Record<ServiceCategory, string> = { sponsor: 'Sponsor', signboard: 'Signboard', food_court: 'Food Court', add_on: 'Add-on' };
const categoryIcons: Record<ServiceCategory, React.ElementType> = { sponsor: Sparkles, signboard: Package, food_court: Utensils, add_on: PlusCircle };

const Services = () => {
  const { services, isAdmin, addService, updateService, stalls, addServiceAllocation, serviceAllocations, getServiceAllocationsByStallId, getLeadById } = useMockData();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    category: 'add_on' as ServiceCategory, 
    description: '', 
    price: 0, 
    quantity: 1, 
    is_unlimited: false, 
    notes: '',
    stall_id: '' // Required stall assignment when adding
  });

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) && 
    (categoryFilter === 'all' || s.category === categoryFilter)
  );
  
  const grouped = { 
    sponsor: services.filter(s => s.category === 'sponsor'), 
    signboard: services.filter(s => s.category === 'signboard'), 
    food_court: services.filter(s => s.category === 'food_court'), 
    add_on: services.filter(s => s.category === 'add_on') 
  };

  const resetForm = () => { 
    setFormData({ name: '', category: 'add_on', description: '', price: 0, quantity: 1, is_unlimited: false, notes: '', stall_id: '' }); 
    setEditingService(null); 
  };

  const handleSubmit = () => {
    if (!formData.name) { 
      toast({ title: 'Error', description: 'Service name is required', variant: 'destructive' }); 
      return; 
    }
    
    if (!editingService && !formData.stall_id) {
      toast({ title: 'Error', description: 'Please select a stall to assign this service', variant: 'destructive' }); 
      return;
    }

    if (editingService) { 
      updateService(editingService.id, {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: formData.price,
        quantity: formData.quantity,
        is_unlimited: formData.is_unlimited,
        notes: formData.notes
      }); 
      toast({ title: 'Success', description: 'Service updated' }); 
    } else { 
      const newService = addService({ 
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: formData.price,
        quantity: formData.quantity,
        is_unlimited: formData.is_unlimited,
        notes: formData.notes,
        sold_quantity: 0 
      });
      
      // Immediately allocate to selected stall
      if (newService && formData.stall_id) {
        addServiceAllocation({ 
          service_id: newService.id, 
          stall_id: formData.stall_id, 
          quantity: 1 
        });
        const stall = stalls.find(s => s.id === formData.stall_id);
        toast({ title: 'Success', description: `${formData.name} added and assigned to ${stall?.stall_number}` }); 
      }
    }
    setDialogOpen(false); 
    resetForm();
  };

  const handleEdit = (service: Service) => { 
    setEditingService(service); 
    setFormData({ 
      name: service.name, 
      category: service.category, 
      description: service.description || '', 
      price: service.price, 
      quantity: service.quantity, 
      is_unlimited: service.is_unlimited, 
      notes: service.notes || '',
      stall_id: ''
    }); 
    setDialogOpen(true); 
  };

  // Get stall info for a service allocation
  const getStallForService = (serviceId: string) => {
    const allocation = serviceAllocations.find(a => a.service_id === serviceId);
    if (!allocation) return null;
    const stall = stalls.find(s => s.id === allocation.stall_id);
    if (!stall) return null;
    const lead = stall.lead_id ? getLeadById(stall.lead_id) : null;
    return { stall, lead, quantity: allocation.quantity };
  };

  // Only show stalls that are sold, reserved, or pending for service allocation
  const allocatableStalls = stalls.filter(s => 
    s.status === 'sold' || s.status === 'pending' || s.status === 'reserved'
  );

  return (
    <MockAppLayout title="Services" subtitle="Add-on services assigned to stalls">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {(Object.keys(grouped) as ServiceCategory[]).map(cat => { 
            const Icon = categoryIcons[cat]; 
            const rev = grouped[cat].reduce((s, x) => s + x.price * x.sold_quantity, 0); 
            return (
              <Card key={cat}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">{categoryLabels[cat]}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{grouped[cat].length}</div>
                  {isAdmin && <p className="text-xs text-muted-foreground">₹{rev.toLocaleString()} revenue</p>}
                </CardContent>
              </Card>
            ); 
          })}
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="sponsor">Sponsor</SelectItem>
              <SelectItem value="signboard">Signboard</SelectItem>
              <SelectItem value="food_court">Food Court</SelectItem>
              <SelectItem value="add_on">Add-on</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Add Service</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingService ? 'Edit' : 'Add'} Service</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        placeholder="e.g., Extra Power, TV Ad"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as ServiceCategory })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sponsor">Sponsor</SelectItem>
                          <SelectItem value="signboard">Signboard</SelectItem>
                          <SelectItem value="food_court">Food Court</SelectItem>
                          <SelectItem value="add_on">Add-on</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Stall Assignment - Required for new services */}
                  {!editingService && (
                    <div className="space-y-2">
                      <Label>Assign to Stall *</Label>
                      <Select value={formData.stall_id} onValueChange={(v) => setFormData({ ...formData, stall_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a stall" />
                        </SelectTrigger>
                        <SelectContent>
                          {allocatableStalls.length === 0 ? (
                            <SelectItem value="" disabled>No stalls available (must be sold/reserved/pending)</SelectItem>
                          ) : (
                            allocatableStalls.map(stall => {
                              const lead = stall.lead_id ? getLeadById(stall.lead_id) : null;
                              return (
                                <SelectItem key={stall.id} value={stall.id}>
                                  {stall.stall_number} - {stall.zone} {lead ? `(${lead.name})` : ''}
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Services must be assigned to a stall. Only sold, reserved, or pending stalls are available.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                      placeholder="Service description..."
                      rows={2} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (₹)</Label>
                      <Input 
                        type="number" 
                        value={formData.price} 
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input 
                        type="number" 
                        value={formData.quantity} 
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} 
                        disabled={formData.is_unlimited} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="unlimited"
                      checked={formData.is_unlimited} 
                      onCheckedChange={(c) => setFormData({ ...formData, is_unlimited: !!c })} 
                    />
                    <Label htmlFor="unlimited" className="cursor-pointer">Unlimited Quantity</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea 
                      value={formData.notes} 
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                      placeholder="Internal notes..."
                      rows={2} 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button onClick={handleSubmit}>{editingService ? 'Update' : 'Add Service'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned Stall</TableHead>
                  {isAdmin && <TableHead>Price</TableHead>}
                  <TableHead>Availability</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((s) => { 
                  const avail = s.is_unlimited ? '∞' : s.quantity - s.sold_quantity; 
                  const soldOut = !s.is_unlimited && s.sold_quantity >= s.quantity;
                  const stallInfo = getStallForService(s.id);
                  
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{s.name}</p>
                          {s.description && <p className="text-sm text-muted-foreground truncate max-w-[200px]">{s.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={categoryColors[s.category]}>{categoryLabels[s.category]}</Badge>
                      </TableCell>
                      <TableCell>
                        {stallInfo ? (
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{stallInfo.stall.stall_number}</p>
                              {stallInfo.lead && (
                                <p className="text-xs text-muted-foreground">{stallInfo.lead.name}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      {isAdmin && <TableCell>₹{s.price.toLocaleString()}</TableCell>}
                      <TableCell>
                        {soldOut ? (
                          <Badge variant="destructive">Sold Out</Badge>
                        ) : (
                          <span className="text-sm">{avail} available</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ); 
                })}
                {filteredServices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No services found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MockAppLayout>
  );
};

export default Services;
