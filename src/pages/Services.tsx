import { useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useSupabaseData } from '@/contexts/SupabaseDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Service, ServiceCategory } from '@/types/database';
import { Search, Sparkles, Package, Utensils, PlusCircle, Edit, Store, Loader2, Plus, AlertTriangle } from 'lucide-react';

const categoryColors: Record<ServiceCategory, string> = { 
  sponsor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', 
  signboard: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', 
  food_court: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', 
  add_on: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
};
const categoryLabels: Record<ServiceCategory, string> = { sponsor: 'Sponsor', signboard: 'Signboard', food_court: 'Food Court', add_on: 'Add-on' };
const categoryIcons: Record<ServiceCategory, React.ElementType> = { sponsor: Sparkles, signboard: Package, food_court: Utensils, add_on: PlusCircle };

const Services = () => {
  const { services, isAdmin, updateService, addService, transactions, stalls, serviceAllocations, getServiceAllocationsByStallId, getLeadById } = useSupabaseData();
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
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add Service Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    name: '',
    category: 'add_on' as ServiceCategory,
    price: '',
    description: '',
    is_unlimited: true,
    total_stock: '10',
  });
  const [isAddingService, setIsAddingService] = useState(false);

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

  // Stock status calculations
  const lowStockServices = services.filter(s => !s.is_unlimited && (s.quantity - s.sold_quantity) <= 2 && (s.quantity - s.sold_quantity) > 0);
  const outOfStockServices = services.filter(s => !s.is_unlimited && s.sold_quantity >= s.quantity);

  const resetForm = () => { 
    setFormData({ name: '', category: 'add_on', description: '', price: 0, quantity: 1, is_unlimited: false, notes: '' }); 
    setEditingService(null); 
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    if (!formData.name) { 
      toast({ title: 'Error', description: 'Service name is required', variant: 'destructive' }); 
      return; 
    }
    
    if (!editingService) {
      toast({ title: 'Error', description: 'Services can only be added through transactions', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateService(editingService.id, {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: formData.price,
        quantity: formData.quantity,
        is_unlimited: formData.is_unlimited,
        notes: formData.notes
      }); 
      toast({ title: 'Success', description: 'Service updated' }); 
    setDialogOpen(false); 
    resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update service. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
      notes: service.notes || ''
    }); 
    setDialogOpen(true); 
  };

  // Handle adding a new service to the catalog
  const handleAddService = async () => {
    if (isAddingService) return;
    
    // Validation
    const trimmedName = newServiceData.name.trim();
    if (!trimmedName) {
      toast({
        title: 'Validation Error',
        description: 'Service name is required.',
        variant: 'destructive'
      });
      return;
    }

    // Check for duplicate name
    const isDuplicateName = services.some(s => 
      s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicateName) {
      toast({
        title: 'Duplicate Service',
        description: `A service named "${trimmedName}" already exists. Please use a different name.`,
        variant: 'destructive'
      });
      return;
    }

    const priceNum = parseFloat(newServiceData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast({
        title: 'Validation Error',
        description: 'Price must be a non-negative number.',
        variant: 'destructive'
      });
      return;
    }

    setIsAddingService(true);
    try {
      const stockValue = newServiceData.is_unlimited ? 1 : parseInt(newServiceData.total_stock) || 1;
      await addService({
        exhibition_id: '', // Will be set by context
        name: trimmedName,
        category: newServiceData.category,
        description: newServiceData.description.trim() || null,
        price: priceNum,
        quantity: stockValue,
        sold_quantity: 0,
        is_unlimited: newServiceData.is_unlimited,
        notes: null,
      });

      toast({
        title: 'Service Created',
        description: `"${trimmedName}" has been added to the service catalog.`,
      });

      // Reset and close dialog
      setNewServiceData({
        name: '',
        category: 'add_on',
        price: '',
        description: '',
        is_unlimited: true,
        total_stock: '10',
      });
      setAddDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create service.',
        variant: 'destructive'
      });
    } finally {
      setIsAddingService(false);
    }
  };

  // Get stall info for a service allocation
  const getStallForService = (serviceId: string) => {
    const allocation = serviceAllocations.find(a => a.service_id === serviceId);
    if (!allocation) return null;
    const stall = stalls.find(s => s.id === allocation.stall_id);
    if (!stall) return null;
    // Get lead from transaction (stall.lead_id was removed, lead comes from transaction)
    const transaction = transactions.find(t => t.id === allocation.transaction_id);
    const lead = transaction ? getLeadById(transaction.lead_id) : null;
    return { stall, lead, quantity: allocation.quantity };
  };

  return (
    <MockAppLayout title="Services" subtitle="Add-on services assigned to stalls">
      <div className="space-y-6">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {(Object.keys(grouped) as ServiceCategory[]).map(cat => { 
            const Icon = categoryIcons[cat]; 
            const rev = grouped[cat].reduce((s, x) => s + x.price * x.sold_quantity, 0);
            const catLowStock = grouped[cat].filter(s => !s.is_unlimited && (s.quantity - s.sold_quantity) <= 2 && (s.quantity - s.sold_quantity) > 0).length;
            const catOutOfStock = grouped[cat].filter(s => !s.is_unlimited && s.sold_quantity >= s.quantity).length;
            return (
              <Card key={cat}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">{categoryLabels[cat]}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{grouped[cat].length}</div>
                  {isAdmin && <p className="text-xs text-muted-foreground">₹{rev.toLocaleString()} revenue</p>}
                  {isAdmin && (catLowStock > 0 || catOutOfStock > 0) && (
                    <div className="flex gap-2 mt-1">
                      {catOutOfStock > 0 && (
                        <Badge variant="destructive" className="text-xs">{catOutOfStock} out</Badge>
                      )}
                      {catLowStock > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">{catLowStock} low</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ); 
          })}
        </div>

        {/* Low Stock Alert Banner */}
        {isAdmin && (lowStockServices.length > 0 || outOfStockServices.length > 0) && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Stock Alert
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {outOfStockServices.length > 0 && (
                  <span className="font-semibold text-red-600 dark:text-red-400">{outOfStockServices.length} service(s) out of stock. </span>
                )}
                {lowStockServices.length > 0 && (
                  <span>{lowStockServices.length} service(s) running low (≤2 remaining).</span>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="sponsor">Sponsor</SelectItem>
              <SelectItem value="signboard">Signboard</SelectItem>
              <SelectItem value="food_court">Food Court</SelectItem>
              <SelectItem value="add_on">Add-on</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button onClick={() => setAddDialogOpen(true)} className="w-full sm:w-auto h-10">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          )}
          {isAdmin && (
            <Dialog open={dialogOpen && !!editingService} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogContent className="w-[95vw] max-w-[500px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Service</DialogTitle>
                  <DialogDescription>
                    Update service details, pricing, and availability.
                  </DialogDescription>
                </DialogHeader>
                {editingService && (
                <div className="space-y-4 py-2 sm:py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        placeholder="e.g., Extra Power, TV Ad"
                        className="h-10 min-h-[44px] text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as ServiceCategory })}>
                        <SelectTrigger className="h-10 min-h-[44px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sponsor">Sponsor</SelectItem>
                          <SelectItem value="signboard">Signboard</SelectItem>
                          <SelectItem value="food_court">Food Court</SelectItem>
                          <SelectItem value="add_on">Add-on</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>


                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                      placeholder="Service description..."
                      rows={3}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (₹)</Label>
                      <Input 
                        type="number" 
                        value={formData.price} 
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} 
                        className="h-10 min-h-[44px] text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input 
                        type="number" 
                        value={formData.quantity} 
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} 
                        disabled={formData.is_unlimited} 
                        className="h-10 min-h-[44px] text-base"
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
                      rows={3}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
                )}
                {editingService && (
                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="w-full sm:w-auto h-10 min-h-[44px]">Cancel</Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto h-10 min-h-[44px]">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Service'
                    )}
                  </Button>
                </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned Stall</TableHead>
                  {isAdmin && <TableHead>Price</TableHead>}
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((s) => { 
                  const availableStock = s.quantity - s.sold_quantity;
                  const soldOut = !s.is_unlimited && availableStock <= 0;
                  const lowStock = !s.is_unlimited && availableStock > 0 && availableStock <= 2;
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
                        {s.is_unlimited ? (
                          <span className="text-sm text-muted-foreground">∞ Unlimited</span>
                        ) : soldOut ? (
                          <Badge variant="destructive">Out of Stock (0/{s.quantity})</Badge>
                        ) : lowStock ? (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Low Stock ({availableStock}/{s.quantity})
                          </Badge>
                        ) : (
                          <span className="text-sm font-medium">{availableStock} / {s.quantity}</span>
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
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 py-8">
                        <Package className="h-12 w-12 text-muted-foreground/50" />
                        <div className="space-y-1">
                          <p className="text-lg font-medium text-muted-foreground">
                            {search || categoryFilter !== 'all'
                              ? 'No services match your search'
                              : 'No services found'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {search || categoryFilter !== 'all'
                              ? 'Try adjusting your search or filter criteria.'
                              : isAdmin 
                                ? 'Click "Add Service" to create your first service.'
                                : 'Services will appear here once they are configured.'}
                          </p>
                        </div>
                        {isAdmin && !search && categoryFilter === 'all' && (
                          <Button onClick={() => setAddDialogOpen(true)} className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Service
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Service Dialog */}
      {isAdmin && (
        <Dialog open={addDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setAddDialogOpen(false);
            setNewServiceData({ name: '', category: 'add_on', price: '', description: '', is_unlimited: true });
          }
        }}>
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add New Service
              </DialogTitle>
              <DialogDescription>
                Create a new service and set pricing and stock rules.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Service Name */}
              <div className="space-y-2">
                <Label htmlFor="add-service-name">Name *</Label>
                <Input
                  id="add-service-name"
                  placeholder="e.g., Extra Table, Premium Banner"
                  value={newServiceData.name}
                  onChange={(e) => setNewServiceData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-10"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="add-service-category">Category *</Label>
                <Select 
                  value={newServiceData.category} 
                  onValueChange={(v: ServiceCategory) => setNewServiceData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sponsor">Sponsor</SelectItem>
                    <SelectItem value="signboard">Signboard</SelectItem>
                    <SelectItem value="food_court">Food Court</SelectItem>
                    <SelectItem value="add_on">Add-on</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="add-service-price">Price (₹) *</Label>
                <Input
                  id="add-service-price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g., 500"
                  value={newServiceData.price}
                  onChange={(e) => setNewServiceData(prev => ({ ...prev, price: e.target.value }))}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">Base price before GST</p>
              </div>

              {/* Description (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="add-service-description">Description (Optional)</Label>
                <Textarea
                  id="add-service-description"
                  placeholder="Brief description of the service..."
                  value={newServiceData.description}
                  onChange={(e) => setNewServiceData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Is Unlimited */}
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="add-service-unlimited"
                  checked={newServiceData.is_unlimited} 
                  onCheckedChange={(c) => setNewServiceData(prev => ({ ...prev, is_unlimited: !!c }))} 
                />
                <Label htmlFor="add-service-unlimited" className="cursor-pointer">
                  Unlimited Quantity
                </Label>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                When enabled, this service can be sold without stock limits.
              </p>

              {/* Total Stock (only shown when not unlimited) */}
              {!newServiceData.is_unlimited && (
                <div className="space-y-2">
                  <Label htmlFor="add-service-stock">Total Stock *</Label>
                  <Input
                    id="add-service-stock"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g., 10"
                    value={newServiceData.total_stock}
                    onChange={(e) => setNewServiceData(prev => ({ ...prev, total_stock: e.target.value }))}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Total inventory count. Stock will decrease automatically when sold.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddDialogOpen(false);
                    setNewServiceData({ name: '', category: 'add_on', price: '', description: '', is_unlimited: true });
                  }}
                  disabled={isAddingService}
                  className="w-full sm:w-auto h-10"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddService}
                  disabled={isAddingService || !newServiceData.name.trim() || !newServiceData.price}
                  className="w-full sm:w-auto h-10"
                >
                  {isAddingService ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Service
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </MockAppLayout>
  );
};

export default Services;
