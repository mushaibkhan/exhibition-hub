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
import { useToast } from '@/hooks/use-toast';
import { Lead, LeadStatus } from '@/types/database';
import { Plus, Search, Phone, Mail, Building2, Edit, Trash2 } from 'lucide-react';

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800', follow_up: 'bg-purple-100 text-purple-800',
  interested: 'bg-cyan-100 text-cyan-800', not_interested: 'bg-gray-100 text-gray-800',
  converted: 'bg-green-100 text-green-800',
};

const statusLabels: Record<LeadStatus, string> = {
  new: 'New', follow_up: 'Follow Up', interested: 'Interested',
  not_interested: 'Not Interested', converted: 'Converted',
};

const Leads = () => {
  const { leads, addLead, updateLead, deleteLead, isAdmin } = useMockData();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', company: '', status: 'new' as LeadStatus, interested_size: '', interested_zone: '', notes: '' });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || lead.company?.toLowerCase().includes(search.toLowerCase()) || lead.phone.includes(search);
    return matchesSearch && (statusFilter === 'all' || lead.status === statusFilter);
  });

  const resetForm = () => { setFormData({ name: '', phone: '', email: '', company: '', status: 'new', interested_size: '', interested_zone: '', notes: '' }); setEditingLead(null); };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone) { toast({ title: 'Error', description: 'Name and phone required', variant: 'destructive' }); return; }
    if (editingLead) { updateLead(editingLead.id, formData); toast({ title: 'Success', description: 'Lead updated' }); }
    else { addLead({ ...formData, created_by: null }); toast({ title: 'Success', description: 'Lead added' }); }
    setDialogOpen(false); resetForm();
  };

  const handleEdit = (lead: Lead) => { setEditingLead(lead); setFormData({ name: lead.name, phone: lead.phone, email: lead.email || '', company: lead.company || '', status: lead.status, interested_size: lead.interested_size || '', interested_zone: lead.interested_zone || '', notes: lead.notes || '' }); setDialogOpen(true); };

  return (
    <MockAppLayout title="Leads" subtitle="Manage enquiries and prospects">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{leads.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">New</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{leads.filter(l => l.status === 'new').length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Follow Up</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{leads.filter(l => l.status === 'follow_up').length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Converted</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'converted').length}</div></CardContent></Card>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="follow_up">Follow Up</SelectItem><SelectItem value="interested">Interested</SelectItem><SelectItem value="converted">Converted</SelectItem></SelectContent></Select>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Lead</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>{editingLead ? 'Edit' : 'Add'} Lead</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4"><div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div><div><Label>Phone *</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div><div><Label>Company</Label><Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} /></div></div>
                <div className="grid grid-cols-3 gap-4"><div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as LeadStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="follow_up">Follow Up</SelectItem><SelectItem value="interested">Interested</SelectItem><SelectItem value="converted">Converted</SelectItem></SelectContent></Select></div><div><Label>Size</Label><Select value={formData.interested_size} onValueChange={(v) => setFormData({ ...formData, interested_size: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="3x3">3x3</SelectItem><SelectItem value="3x6">3x6</SelectItem><SelectItem value="6x6">6x6</SelectItem></SelectContent></Select></div><div><Label>Zone</Label><Select value={formData.interested_zone} onValueChange={(v) => setFormData({ ...formData, interested_zone: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Hall A">Hall A</SelectItem><SelectItem value="Hall B">Hall B</SelectItem></SelectContent></Select></div></div>
                <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></div>
              </div>
              <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button><Button onClick={handleSubmit}>{editingLead ? 'Update' : 'Add'}</Button></div>
            </DialogContent>
          </Dialog>
        </div>
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Company</TableHead><TableHead>Status</TableHead><TableHead>Interest</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {filteredLeads.map((lead) => (<TableRow key={lead.id}><TableCell className="font-medium">{lead.name}</TableCell><TableCell><div className="flex flex-col gap-1 text-sm"><span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>{lead.email && <span className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{lead.email}</span>}</div></TableCell><TableCell>{lead.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.company}</span>}</TableCell><TableCell><Badge className={statusColors[lead.status]}>{statusLabels[lead.status]}</Badge></TableCell><TableCell><div className="text-sm">{lead.interested_size && <div>Size: {lead.interested_size}</div>}{lead.interested_zone && <div className="text-muted-foreground">{lead.interested_zone}</div>}</div></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => handleEdit(lead)}><Edit className="h-4 w-4" /></Button>{isAdmin && <Button variant="ghost" size="icon" onClick={() => { deleteLead(lead.id); toast({ title: 'Deleted' }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div></TableCell></TableRow>))}
        </TableBody></Table></CardContent></Card>
      </div>
    </MockAppLayout>
  );
};

export default Leads;
