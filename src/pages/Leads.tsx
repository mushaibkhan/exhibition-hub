import { useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/SupabaseDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Lead, LeadStatus } from '@/types/database';
import { Plus, Search, Phone, Mail, Building2, Edit, Trash2, Receipt, Download, Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportToExcel, formatDateForExport } from '@/lib/exportUtils';

const statusColors: Record<LeadStatus, string> = { new: 'bg-blue-100 text-blue-800', follow_up: 'bg-purple-100 text-purple-800', interested: 'bg-cyan-100 text-cyan-800', not_interested: 'bg-gray-100 text-gray-800', converted: 'bg-green-100 text-green-800' };
const statusLabels: Record<LeadStatus, string> = { new: 'New', follow_up: 'Follow Up', interested: 'Interested', not_interested: 'Not Interested', converted: 'Converted' };

const Leads = () => {
  const { leads, addLead, updateLead, deleteLead, isAdmin, transactions } = useMockData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', company: '', status: 'new' as LeadStatus, interested_size: '', interested_zone: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || lead.company?.toLowerCase().includes(search.toLowerCase()) || lead.phone.includes(search);
    return matchesSearch && (statusFilter === 'all' || lead.status === statusFilter);
  });

  const getLeadTransaction = (leadId: string) => transactions.find(t => t.lead_id === leadId);

  const resetForm = () => { setFormData({ name: '', phone: '', email: '', company: '', status: 'new', interested_size: '', interested_zone: '', notes: '' }); setEditingLead(null); };

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
      if (editingLead) { 
        await updateLead(editingLead.id, formData); 
        toast({ title: 'Success', description: `Lead "${formData.name}" updated successfully` }); 
      } else { 
        await addLead({ ...formData, created_by: null }); 
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

  const handleEdit = (lead: Lead) => { setEditingLead(lead); setFormData({ name: lead.name, phone: lead.phone, email: lead.email || '', company: lead.company || '', status: lead.status, interested_size: lead.interested_size || '', interested_zone: lead.interested_zone || '', notes: lead.notes || '' }); setDialogOpen(true); };

  const handleExport = async () => {
    if (isExporting || filteredLeads.length === 0) return;
    setIsExporting(true);
    
    try {
      const exportData = filteredLeads.map(lead => {
        const txn = getLeadTransaction(lead.id);
        return {
          'Name': lead.name,
          'Phone': lead.phone,
          'Email': lead.email || '',
          'Company': lead.company || '',
          'Status': statusLabels[lead.status],
          'Preferred Size': lead.interested_size || '',
          'Preferred Floor': lead.interested_zone || '',
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
            <DialogContent className="w-[95vw] max-w-[600px] max-h-[95vh] overflow-y-auto">
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
                        <p className="text-xs text-muted-foreground">Required field for identification</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Phone *</Label>
                        <Input 
                          value={formData.phone} 
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                          placeholder="Enter phone number"
                        />
                        <p className="text-xs text-muted-foreground">Required field for identification</p>
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
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as LeadStatus })}>
                        <SelectTrigger className="h-10 min-h-[44px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="follow_up">Follow Up</SelectItem>
                          <SelectItem value="interested">Interested</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Set the initial status for this lead</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Preferred Size</Label>
                        <Select value={formData.interested_size} onValueChange={(v) => setFormData({ ...formData, interested_size: v })}>
                          <SelectTrigger className="h-10 min-h-[44px]">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3×2">3×2 (Standard)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">All stalls are 3×2 meters (optional)</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Preferred Floor</Label>
                        <Select value={formData.interested_zone} onValueChange={(v) => setFormData({ ...formData, interested_zone: v })}>
                          <SelectTrigger className="h-10 min-h-[44px]">
                            <SelectValue placeholder="Select floor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Floor 1">Floor 1</SelectItem>
                            <SelectItem value="Floor 2">Floor 2</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Preferred floor location (optional)</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea 
                        value={formData.notes} 
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                        rows={3}
                        placeholder="Add any additional notes about this lead..."
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
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
        <Card><CardContent className="p-0 overflow-x-auto"><div className="min-w-full"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Company</TableHead><TableHead>Status</TableHead><TableHead>Transaction</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {filteredLeads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-64 text-center">
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
            return (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell><div className="flex flex-col gap-1 text-sm"><span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>{lead.email && <span className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{lead.email}</span>}</div></TableCell>
                <TableCell>{lead.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.company}</span>}</TableCell>
                <TableCell><Badge className={statusColors[lead.status]}>{statusLabels[lead.status]}</Badge></TableCell>
                <TableCell>
                  {txn ? (
                    <Badge variant="outline" className="cursor-pointer" onClick={() => navigate('/transactions')}>
                      <Receipt className="h-3 w-3 mr-1" />{txn.transaction_number}
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => navigate('/transactions')}>
                      <Plus className="h-3 w-3 mr-1" />Create Transaction
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => handleEdit(lead)}><Edit className="h-4 w-4" /></Button>{isAdmin && <Button variant="ghost" size="icon" onClick={async () => { try { await deleteLead(lead.id); toast({ title: 'Success', description: 'Lead deleted successfully' }); } catch (error: any) { toast({ title: 'Error', description: error?.message || 'Failed to delete lead. Please try again.', variant: 'destructive' }); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div></TableCell>
              </TableRow>
            );
          })}
          </TableBody></Table></div></CardContent></Card>
        <p className="text-sm text-muted-foreground text-center">
          💡 To convert a lead, create a Transaction and add stalls/services as line items.
        </p>
      </div>
    </MockAppLayout>
  );
};

export default Leads;
