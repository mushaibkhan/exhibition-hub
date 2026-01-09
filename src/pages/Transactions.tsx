import { useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/MockDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentStatus } from '@/types/database';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<PaymentStatus, string> = { unpaid: 'bg-red-100 text-red-800', partial: 'bg-orange-100 text-orange-800', paid: 'bg-green-100 text-green-800' };
const statusLabels: Record<PaymentStatus, string> = { unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid' };

const Transactions = () => {
  const { transactions, getLeadById, getItemsByTransactionId, getPaymentsByTransactionId, isAdmin } = useMockData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredTxns = transactions.filter(t => { const lead = getLeadById(t.lead_id); return (t.transaction_number.toLowerCase().includes(search.toLowerCase()) || lead?.name.toLowerCase().includes(search.toLowerCase())) && (statusFilter === 'all' || t.payment_status === statusFilter); });
  const stats = { total: transactions.length, totalAmount: transactions.reduce((s, t) => s + t.total_amount, 0), collected: transactions.reduce((s, t) => s + t.amount_paid, 0) };

  return (
    <MockAppLayout title="Transactions" subtitle="Manage sales and bookings">
      <div className="space-y-6">
        {isAdmin && <div className="grid gap-4 md:grid-cols-4"><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Collected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">₹{stats.collected.toLocaleString()}</div></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">₹{(stats.totalAmount - stats.collected).toLocaleString()}</div></CardContent></Card></div>}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="unpaid">Unpaid</SelectItem><SelectItem value="partial">Partial</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select>
        </div>
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead>Transaction #</TableHead><TableHead>Buyer</TableHead>{isAdmin && <TableHead>Total</TableHead>}{isAdmin && <TableHead>Paid</TableHead>}<TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>
          {filteredTxns.map((txn) => { const lead = getLeadById(txn.lead_id); const items = getItemsByTransactionId(txn.id); const payments = getPaymentsByTransactionId(txn.id); const isExpanded = expandedRow === txn.id; return (<>
            <TableRow key={txn.id} className="cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : txn.id)}><TableCell>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell><TableCell className="font-medium">{txn.transaction_number}</TableCell><TableCell><div><p className="font-medium">{lead?.name}</p><p className="text-sm text-muted-foreground">{lead?.company}</p></div></TableCell>{isAdmin && <TableCell>₹{txn.total_amount.toLocaleString()}</TableCell>}{isAdmin && <TableCell>₹{txn.amount_paid.toLocaleString()}</TableCell>}<TableCell><Badge className={statusColors[txn.payment_status]}>{statusLabels[txn.payment_status]}</Badge></TableCell><TableCell>{format(new Date(txn.created_at), 'dd MMM yyyy')}</TableCell></TableRow>
            {isExpanded && <TableRow><TableCell colSpan={isAdmin ? 7 : 5} className="bg-muted/50 p-4"><div className="grid gap-4 md:grid-cols-2"><div><h4 className="font-semibold mb-2">Items</h4>{items.map(i => <div key={i.id} className="flex justify-between text-sm p-2 bg-background rounded mb-1"><span>{i.item_name}</span>{isAdmin && <span>₹{i.final_price.toLocaleString()}</span>}</div>)}</div>{isAdmin && <div><h4 className="font-semibold mb-2">Payments</h4>{payments.length ? payments.map(p => <div key={p.id} className="flex justify-between text-sm p-2 bg-background rounded mb-1"><span>{format(new Date(p.payment_date), 'dd MMM')} - {p.payment_mode.toUpperCase()}</span><span>₹{p.amount.toLocaleString()}</span></div>) : <p className="text-sm text-muted-foreground">No payments</p>}</div>}</div></TableCell></TableRow>}
          </>); })}
        </TableBody></Table></CardContent></Card>
      </div>
    </MockAppLayout>
  );
};

export default Transactions;
