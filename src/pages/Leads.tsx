import { useState, useMemo } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useSupabaseData } from '@/contexts/SupabaseDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Lead, LeadStatus, Stall } from '@/types/database';
import { Plus, Search, Phone, Mail, Building2, Edit, Trash2, Receipt, Download, Loader2, Users, FileText, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportToExcel, formatDateForExport } from '@/lib/exportUtils';
import { buildQuotationData, downloadQuotation, DEFAULT_STALL_BASE_PRICE } from '@/lib/generateQuotationHTML';

const statusColors: Record<LeadStatus, string> = { new: 'bg-blue-100 text-blue-800', follow_up: 'bg-purple-100 text-purple-800', interested: 'bg-cyan-100 text-cyan-800', not_interested: 'bg-gray-100 text-gray-800', converted: 'bg-green-100 text-green-800' };
const statusLabels: Record<LeadStatus, string> = { new: 'New', follow_up: 'Follow Up', interested: 'Interested', not_interested: 'Not Interested', converted: 'Converted' };

const Leads = () => {
  const { leads, stalls, addLead, updateLead, deleteLead, isAdmin, transactions, getAvailableStalls } = useSupabaseData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    company: '', 
    status: 'new' as LeadStatus, 
    interested_stalls: [] as string[], 
    target_stall_count: null as number | null,
    interested_zone: '', 
    quoted_gst: false,
    notes: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [stallSelectorOpen, setStallSelectorOpen] = useState(false);
  
  // Conversion dialog for quantity-based leads
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [conversionLead, setConversionLead] = useState<Lead | null>(null);
  const [conversionStalls, setConversionStalls] = useState<string[]>([]);

  // Calculate average stall price from available stalls
  const averageStallPrice = useMemo(() => {
    if (stalls.length === 0) return DEFAULT_STALL_BASE_PRICE;
    const total = stalls.reduce((sum, stall) => sum + stall.base_rent, 0);
    return Math.round(total / stalls.length);
  }, [stalls]);

  // Get available stalls for selection
  const availableStalls = useMemo(() => {
    const available = getAvailableStalls();
    // When editing, also include the stalls currently selected by this lead
    if (editingLead && editingLead.interested_stalls) {
      const currentStalls = stalls.filter(s => editingLead.interested_stalls.includes(s.id));
      const combined = [...available];
      currentStalls.forEach(s => {
        if (!combined.find(a => a.id === s.id)) {
          combined.push(s);
        }
      });
      return combined.sort((a, b) => a.stall_number.localeCompare(b.stall_number));
    }
    return available.sort((a, b) => a.stall_number.localeCompare(b.stall_number));
  }, [getAvailableStalls, stalls, editingLead]);

  // Calculate quotation totals - supports both specific stalls and quantity-based
  const selectedStallsData = useMemo(() => {
    return formData.interested_stalls
      .map(id => stalls.find(s => s.id === id))
      .filter((s): s is Stall => s !== undefined);
  }, [formData.interested_stalls, stalls]);

  const quotationTotals = useMemo(() => {
    let subtotal: number;
    const hasSpecificStalls = selectedStallsData.length > 0;
    const hasQuantity = (formData.target_stall_count || 0) > 0;
    
    if (hasSpecificStalls) {
      // Scenario A: Specific stalls selected
      subtotal = selectedStallsData.reduce((sum, stall) => sum + stall.base_rent, 0);
    } else if (hasQuantity) {
      // Scenario B: Quantity-based calculation
      subtotal = (formData.target_stall_count || 0) * averageStallPrice;
    } else {
      subtotal = 0;
    }
    
    const cgst = formData.quoted_gst ? Math.round(subtotal * 0.09) : 0;
    const sgst = formData.quoted_gst ? Math.round(subtotal * 0.09) : 0;
    const total = subtotal + cgst + sgst;
    return { subtotal, cgst, sgst, total, isQuantityBased: !hasSpecificStalls && hasQuantity };
  }, [selectedStallsData, formData.quoted_gst, formData.target_stall_count, averageStallPrice]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || lead.company?.toLowerCase().includes(search.toLowerCase()) || lead.phone.includes(search);
    return matchesSearch && (statusFilter === 'all' || lead.status === statusFilter);
  });

  const getLeadTransaction = (leadId: string) => transactions.find(t => t.lead_id === leadId && !t.cancelled);

  const resetForm = () => { 
    setFormData({ 
      name: '', 
      phone: '', 
      email: '', 
      company: '', 
      status: 'new', 
      interested_stalls: [], 
      target_stall_count: null,
      interested_zone: '', 
      quoted_gst: false,
      notes: '' 
    }); 
    setEditingLead(null); 
  };

  const handleStallToggle = (stallId: string) => {
    setFormData(prev => ({
      ...prev,
      interested_stalls: prev.interested_stalls.includes(stallId)
        ? prev.interested_stalls.filter(id => id !== stallId)
        : [...prev.interested_stalls, stallId],
      // Clear quantity when selecting specific stalls
      target_stall_count: null
    }));
  };

  const handleRemoveStall = (stallId: string) => {
    setFormData(prev => ({
      ...prev,
      interested_stalls: prev.interested_stalls.filter(id => id !== stallId)
    }));
  };

  const validatePhone = (phone: string): boolean => {
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // Check if it's 10 digits or 10 digits with country code
    return /^(\+91)?[6-9]\d{9}$/.test(cleaned) || /^\d{10}$/.test(cleaned);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Validate required fields
    if (!formData.name?.trim()) {
      toast({ 
        title: 'Validation Error', 
        description: 'Name is required. Please enter the lead\'s full name.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!formData.phone?.trim()) {
      toast({ 
        title: 'Validation Error', 
        description: 'Phone number is required. Please enter a valid phone number.', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate phone format
    if (!validatePhone(formData.phone)) {
      toast({ 
        title: 'Invalid Phone Number', 
        description: 'Please enter a valid 10-digit phone number (e.g., 9876543210 or +91 9876543210).', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate email format if provided
    if (formData.email && !validateEmail(formData.email)) {
      toast({ 
        title: 'Invalid Email Address', 
        description: 'Please enter a valid email address (e.g., example@email.com).', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate name length
    if (formData.name.length > 100) {
      toast({ 
        title: 'Validation Error', 
        description: 'Name is too long. Please enter a name with less than 100 characters.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const leadData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        company: formData.company || null,
        status: formData.status,
        interested_stalls: formData.interested_stalls,
        target_stall_count: formData.target_stall_count,
        interested_zone: formData.interested_zone || null,
        quoted_amount: quotationTotals.subtotal,
        quoted_gst: formData.quoted_gst,
        quoted_cgst: quotationTotals.cgst,
        quoted_sgst: quotationTotals.sgst,
        quoted_total: quotationTotals.total,
        notes: formData.notes || null,
        created_by: null,
      };

      if (editingLead) { 
        await updateLead(editingLead.id, leadData); 
        toast({ title: 'Success', description: `Lead "${formData.name}" updated successfully` }); 
      } else { 
        await addLead(leadData); 
        toast({ title: 'Success', description: `Lead "${formData.name}" added successfully` }); 
      }
      setDialogOpen(false); 
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save lead. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (lead: Lead) => { 
    setEditingLead(lead); 
    setFormData({ 
      name: lead.name, 
      phone: lead.phone, 
      email: lead.email || '', 
      company: lead.company || '', 
      status: lead.status, 
      interested_stalls: lead.interested_stalls || [], 
      target_stall_count: lead.target_stall_count || null,
      interested_zone: lead.interested_zone || '', 
      quoted_gst: lead.quoted_gst || false,
      notes: lead.notes || '' 
    }); 
    setDialogOpen(true); 
  };

  const handleDownloadQuotation = (lead: Lead) => {
    const hasSpecificStalls = lead.interested_stalls && lead.interested_stalls.length > 0;
    const hasQuantity = (lead.target_stall_count || 0) > 0;
    
    if (!hasSpecificStalls && !hasQuantity) {
      toast({ 
        title: 'No Quote Available', 
        description: 'Please edit the lead and select stalls or enter a quantity to generate a quotation.', 
        variant: 'destructive' 
      });
      return;
    }

    const selectedStalls = hasSpecificStalls
      ? (lead.interested_stalls || [])
          .map(id => stalls.find(s => s.id === id))
          .filter((s): s is Stall => s !== undefined)
      : [];

    if (hasSpecificStalls && selectedStalls.length === 0) {
      toast({ 
        title: 'Stalls Not Found', 
        description: 'The selected stalls could not be found.', 
        variant: 'destructive' 
      });
      return;
    }

    const quotationNumber = `QT-${Date.now().toString(36).toUpperCase()}`;
    const quotationData = buildQuotationData(lead, selectedStalls, quotationNumber, averageStallPrice);
    downloadQuotation(quotationData);
    toast({ title: 'Success', description: 'Quotation downloaded successfully' });
  };

  const handleExport = async () => {
    if (isExporting || filteredLeads.length === 0) return;
    setIsExporting(true);
    
    try {
      const exportData = filteredLeads.map(lead => {
        const txn = getLeadTransaction(lead.id);
        const stallNumbers = (lead.interested_stalls || [])
          .map(id => stalls.find(s => s.id === id)?.stall_number)
          .filter(Boolean)
          .join(', ');
        return {
          'Name': lead.name,
          'Phone': lead.phone,
          'Email': lead.email || '',
          'Company': lead.company || '',
          'Status': statusLabels[lead.status],
          'Interested Stalls': stallNumbers || (lead.target_stall_count ? `${lead.target_stall_count} stalls (TBD)` : ''),
          'Target Quantity': lead.target_stall_count || '',
          'Preferred Floor': lead.interested_zone || '',
          'Quoted Amount': lead.quoted_amount || 0,
          'GST Included': lead.quoted_gst ? 'Yes' : 'No',
          'Quoted Total': lead.quoted_total || 0,
          'Transaction Number': txn?.transaction_number || '',
          'Notes': lead.notes || '',
          'Created Date': formatDateForExport(lead.created_at),
        };
      });

      exportToExcel(exportData, 'Leads_Export', 'Leads');
      toast({ title: 'Success', description: `Exported ${exportData.length} lead(s) to Excel` });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Book/Convert button click - check if quantity-based lead needs stall selection
  const handleBookClick = (lead: Lead) => {
    const isQuantityBased = (!lead.interested_stalls || lead.interested_stalls.length === 0) && lead.target_stall_count && lead.target_stall_count > 0;
    
    if (isQuantityBased) {
      // Open conversion dialog to select specific stalls
      setConversionLead(lead);
      setConversionStalls([]);
      setConversionDialogOpen(true);
    } else {
      // Has specific stalls or no quote - go directly to transactions
      navigate('/transactions', { state: { prefilledLead: lead } });
    }
  };

  // Handle stall toggle in conversion dialog
  const handleConversionStallToggle = (stallId: string) => {
    setConversionStalls(prev => {
      if (prev.includes(stallId)) {
        return prev.filter(id => id !== stallId);
      }
      // Limit selection to target_stall_count if set
      const maxStalls = conversionLead?.target_stall_count || 100;
      if (prev.length >= maxStalls) {
        toast({
          title: 'Limit Reached',
          description: `This lead requested ${maxStalls} stall(s). Remove a stall to add another.`,
          variant: 'destructive'
        });
        return prev;
      }
      return [...prev, stallId];
    });
  };

  // Handle conversion confirmation - update lead and navigate to transactions
  const handleConversionConfirm = async () => {
    if (!conversionLead || conversionStalls.length === 0) return;
    
    setIsSubmitting(true);
    try {
      // Update the lead with specific stalls and clear target_stall_count
      await updateLead(conversionLead.id, {
        interested_stalls: conversionStalls,
        target_stall_count: null, // Convert to specific stalls mode
      });

      // Navigate to transactions with pre-filled lead
      const updatedLead = { 
        ...conversionLead, 
        interested_stalls: conversionStalls,
        target_stall_count: null 
      };
      
      toast({
        title: 'Stalls Selected',
        description: `${conversionStalls.length} stall(s) assigned. Redirecting to create transaction...`
      });
      
      setConversionDialogOpen(false);
      setConversionLead(null);
      setConversionStalls([]);
      
      navigate('/transactions', { state: { prefilledLead: updatedLead } });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update lead',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MockAppLayout title="Leads" subtitle="Manage enquiries and prospects">
      <div className="space-y-6">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{leads.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">New</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{leads.filter(l => l.status === 'new').length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Follow Up</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{leads.filter(l => l.status === 'follow_up').length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Converted</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'converted').length}</div></CardContent></Card>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <div className="relative flex-1 min-w-0"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[150px] h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="follow_up">Follow Up</SelectItem><SelectItem value="interested">Interested</SelectItem><SelectItem value="converted">Converted</SelectItem></SelectContent></Select>
          <Button variant="outline" onClick={handleExport} disabled={filteredLeads.length === 0 || isExporting} className="w-full sm:w-auto h-10 min-h-[44px]">
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </>
            )}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto h-10 min-h-[44px]"><Plus className="mr-2 h-4 w-4" />Add Lead</Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[700px] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLead ? 'Edit' : 'Add'} Lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
                {/* 1. Contact Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">1. Contact Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input 
                          value={formData.name} 
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone *</Label>
                        <Input 
                          value={formData.phone} 
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input 
                          value={formData.email} 
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                          type="email"
                          placeholder="example@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input 
                          value={formData.company} 
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })} 
                          placeholder="Company name (optional)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Lead Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">2. Lead Details</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as LeadStatus })}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="follow_up">Follow Up</SelectItem>
                            <SelectItem value="interested">Interested</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Preferred Floor</Label>
                        <Select value={formData.interested_zone} onValueChange={(v) => setFormData({ ...formData, interested_zone: v })}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select floor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Floor 1">Floor 1</SelectItem>
                            <SelectItem value="Floor 2">Floor 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Stall Selection & Quotation */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">3. Stall Selection & Quotation</h3>
                  <div className="space-y-4">
                    {/* Stall Selection Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Quantity Input */}
                      <div className="space-y-2">
                        <Label>Interested Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g., 3"
                          value={formData.target_stall_count || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value, 10) : null;
                            setFormData({ 
                              ...formData, 
                              target_stall_count: value,
                              // Clear specific stalls when using quantity
                              interested_stalls: value ? [] : formData.interested_stalls
                            });
                          }}
                          disabled={formData.interested_stalls.length > 0}
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.interested_stalls.length > 0 
                            ? 'Clear selected stalls to use quantity' 
                            : 'Or select specific stalls below'}
                        </p>
                      </div>
                      
                      {/* Stall Selector Button */}
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Select Specific Stalls</Label>
                        <Dialog open={stallSelectorOpen} onOpenChange={setStallSelectorOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-10">
                              <Plus className="mr-2 h-4 w-4" />
                              Select Stalls ({availableStalls.length} available)
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[500px] max-h-[70vh]">
                            <DialogHeader>
                              <DialogTitle>Select Stalls</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                              {availableStalls.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No available stalls</p>
                              ) : (
                                availableStalls.map(stall => (
                                  <div 
                                    key={stall.id} 
                                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                      formData.interested_stalls.includes(stall.id) 
                                        ? 'bg-primary/10 border-primary' 
                                        : 'hover:bg-muted/50'
                                    }`}
                                    onClick={() => handleStallToggle(stall.id)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Checkbox 
                                        checked={formData.interested_stalls.includes(stall.id)}
                                        onCheckedChange={() => handleStallToggle(stall.id)}
                                      />
                                      <div>
                                        <p className="font-medium">Stall {stall.stall_number}</p>
                                        <p className="text-xs text-muted-foreground">{stall.zone || 'No zone'}</p>
                                      </div>
                                    </div>
                                    <span className="font-semibold">₹{stall.base_rent.toLocaleString()}</span>
                                  </div>
                                ))
                              )}
                            </div>
                            <div className="flex justify-end pt-2 border-t">
                              <Button onClick={() => setStallSelectorOpen(false)}>
                                Done ({formData.interested_stalls.length} selected)
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <p className="text-xs text-muted-foreground">Choose exact stall numbers (clears quantity)</p>
                      </div>
                    </div>

                    {/* Selected Stalls Display */}
                    {formData.interested_stalls.length > 0 && (
                      <div className="border rounded-lg p-3 bg-muted/30">
                        <Label className="text-xs text-muted-foreground mb-2 block">Selected Stalls:</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.interested_stalls.map(stallId => {
                            const stall = stalls.find(s => s.id === stallId);
                            if (!stall) return null;
                            return (
                              <Badge key={stallId} variant="secondary" className="flex items-center gap-1 pr-1">
                                Stall {stall.stall_number} - ₹{stall.base_rent.toLocaleString()}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                                  onClick={() => handleRemoveStall(stallId)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* GST Toggle */}
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="apply-gst"
                          checked={formData.quoted_gst}
                          onCheckedChange={(checked) => setFormData({ ...formData, quoted_gst: checked })}
                        />
                        <Label htmlFor="apply-gst" className="cursor-pointer">
                          Include GST (18%) in quotation
                        </Label>
                      </div>
                    </div>

                    {/* Quotation Summary */}
                    {(formData.interested_stalls.length > 0 || (formData.target_stall_count && formData.target_stall_count > 0)) && (
                      <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20 space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          Estimated Quotation
                          {quotationTotals.isQuantityBased && (
                            <Badge variant="outline" className="text-xs font-normal">Location TBD</Badge>
                          )}
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {quotationTotals.isQuantityBased 
                                ? `Subtotal (${formData.target_stall_count} stall${formData.target_stall_count! > 1 ? 's' : ''} × ₹${averageStallPrice.toLocaleString()})`
                                : `Subtotal (${formData.interested_stalls.length} stall${formData.interested_stalls.length > 1 ? 's' : ''})`
                              }
                            </span>
                            <span className="font-medium">₹{quotationTotals.subtotal.toLocaleString()}</span>
                          </div>
                          {formData.quoted_gst && (
                            <>
                              <div className="flex justify-between text-muted-foreground">
                                <span>CGST (9%)</span>
                                <span>₹{quotationTotals.cgst.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-muted-foreground">
                                <span>SGST (9%)</span>
                                <span>₹{quotationTotals.sgst.toLocaleString()}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between pt-2 border-t font-semibold">
                            <span>{formData.quoted_gst ? 'Grand Total (incl. GST)' : 'Total'}</span>
                            <span className="text-lg">₹{quotationTotals.total.toLocaleString()}</span>
                          </div>
                          {quotationTotals.isQuantityBased && (
                            <p className="text-xs text-muted-foreground pt-1 italic">
                              * Based on average stall price. Final amount may vary based on stall selection.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Notes */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">4. Notes</h3>
                  <Textarea 
                    value={formData.notes} 
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                    rows={3}
                    placeholder="Add any additional notes about this lead..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2 border-t">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="w-full sm:w-auto h-10 min-h-[44px]">Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto h-10 min-h-[44px]">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingLead ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingLead ? 'Update Lead' : 'Add Lead'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card><CardContent className="p-0 overflow-x-auto"><div className="min-w-full"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Company</TableHead><TableHead>Status</TableHead><TableHead>Quoted</TableHead><TableHead>Transaction</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {filteredLeads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-64 text-center">
                <div className="flex flex-col items-center justify-center space-y-3 py-8">
                  <Users className="h-12 w-12 text-muted-foreground/50" />
                  <div className="space-y-1">
                    <p className="text-lg font-medium text-muted-foreground">
                      {search || statusFilter !== 'all'
                        ? 'No leads match your search'
                        : 'No leads found'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {search || statusFilter !== 'all'
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Add your first lead to get started.'}
                    </p>
                  </div>
                  {(!search && statusFilter === 'all') && (
                    <Button onClick={() => setDialogOpen(true)} className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lead
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : filteredLeads.map((lead) => {
            const txn = getLeadTransaction(lead.id);
            const hasQuote = (lead.interested_stalls && lead.interested_stalls.length > 0) || (lead.target_stall_count && lead.target_stall_count > 0);
            const isQuantityBased = (!lead.interested_stalls || lead.interested_stalls.length === 0) && lead.target_stall_count && lead.target_stall_count > 0;
            return (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell><div className="flex flex-col gap-1 text-sm"><span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>{lead.email && <span className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{lead.email}</span>}</div></TableCell>
                <TableCell>{lead.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.company}</span>}</TableCell>
                <TableCell><Badge className={statusColors[lead.status]}>{statusLabels[lead.status]}</Badge></TableCell>
                <TableCell>
                  {hasQuote ? (
                    <div className="text-sm">
                      <div className="font-medium">₹{(lead.quoted_total || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {isQuantityBased 
                          ? `${lead.target_stall_count} stall${lead.target_stall_count! > 1 ? 's' : ''} • TBD`
                          : `${lead.interested_stalls?.length || 0} stall${(lead.interested_stalls?.length || 0) > 1 ? 's' : ''}`
                        }
                        {lead.quoted_gst && ' • GST'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No quote</span>
                  )}
                </TableCell>
                <TableCell>
                  {txn ? (
                    <Badge variant="outline" className="cursor-pointer" onClick={() => navigate('/transactions')}>
                      <Receipt className="h-3 w-3 mr-1" />{txn.transaction_number}
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleBookClick(lead)}>
                      <Plus className="h-3 w-3 mr-1" />Book
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {hasQuote && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDownloadQuotation(lead)}
                        title="Download Quotation"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(lead)} title="Edit Lead">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={async () => { 
                          try { 
                            await deleteLead(lead.id); 
                            toast({ title: 'Success', description: 'Lead deleted successfully' }); 
                          } catch (error: any) { 
                            toast({ title: 'Error', description: error?.message || 'Failed to delete lead.', variant: 'destructive' }); 
                          } 
                        }}
                        title="Delete Lead"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          </TableBody></Table></div></CardContent></Card>
        <p className="text-sm text-muted-foreground text-center">
          💡 Select stalls to generate a quotation. Convert leads by creating a Transaction with the quoted stalls.
        </p>
      </div>

      {/* Conversion Dialog for Quantity-Based Leads */}
      <Dialog open={conversionDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setConversionDialogOpen(false);
          setConversionLead(null);
          setConversionStalls([]);
        }
      }}>
        <DialogContent className="max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Select Stalls for Booking
            </DialogTitle>
          </DialogHeader>
          
          {conversionLead && (
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm">
                  <strong>{conversionLead.name}</strong> has a quantity-based interest of{' '}
                  <strong>{conversionLead.target_stall_count} stall(s)</strong> without specific locations selected.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please select the specific stalls to finalize this booking.
                </p>
              </div>

              {/* Selection Progress */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Selected: <strong>{conversionStalls.length}</strong> / {conversionLead.target_stall_count} stalls
                </span>
                {conversionStalls.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setConversionStalls([])}
                    className="h-7 text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Stall Selection Grid */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {availableStalls.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No available stalls. All stalls may be occupied or reserved.
                  </p>
                ) : (
                  availableStalls.map(stall => (
                    <div 
                      key={stall.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        conversionStalls.includes(stall.id) 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleConversionStallToggle(stall.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={conversionStalls.includes(stall.id)}
                          onCheckedChange={() => handleConversionStallToggle(stall.id)}
                        />
                        <div>
                          <p className="font-medium">Stall {stall.stall_number}</p>
                          <p className="text-xs text-muted-foreground">{stall.zone || 'No zone'}</p>
                        </div>
                      </div>
                      <span className="font-semibold">₹{stall.base_rent.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Selected Stalls Summary */}
              {conversionStalls.length > 0 && (
                <div className="border-t pt-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {conversionStalls.map(stallId => {
                      const stall = stalls.find(s => s.id === stallId);
                      if (!stall) return null;
                      return (
                        <Badge key={stallId} variant="secondary" className="flex items-center gap-1">
                          Stall {stall.stall_number}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConversionStalls(prev => prev.filter(id => id !== stallId));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="text-sm text-right">
                    Total: <strong>₹{conversionStalls.reduce((sum, id) => {
                      const stall = stalls.find(s => s.id === id);
                      return sum + (stall?.base_rent || 0);
                    }, 0).toLocaleString()}</strong>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setConversionDialogOpen(false);
                    setConversionLead(null);
                    setConversionStalls([]);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConversionConfirm}
                  disabled={conversionStalls.length === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Confirm & Create Transaction</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MockAppLayout>
  );
};

export default Leads;
