import { Navigate } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/MockDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaymentMode } from '@/types/database';
import { CreditCard, Banknote, Smartphone } from 'lucide-react';
import { format } from 'date-fns';

const modeColors: Record<PaymentMode, string> = { cash: 'bg-green-100 text-green-800', upi: 'bg-purple-100 text-purple-800', bank: 'bg-blue-100 text-blue-800' };
const modeIcons: Record<PaymentMode, React.ElementType> = { cash: Banknote, upi: Smartphone, bank: CreditCard };

const Payments = () => {
  const { isAdmin, payments, transactions, accounts, getLeadById } = useMockData();
  if (!isAdmin) return <Navigate to="/" replace />;

  const stats = { total: payments.length, totalAmount: payments.reduce((s, p) => s + p.amount, 0), cash: payments.filter(p => p.payment_mode === 'cash').reduce((s, p) => s + p.amount, 0), upi: payments.filter(p => p.payment_mode === 'upi').reduce((s, p) => s + p.amount, 0), bank: payments.filter(p => p.payment_mode === 'bank').reduce((s, p) => s + p.amount, 0) };

  return (
    <MockAppLayout title="Payments" subtitle="Payment records (Admin Only)">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Collected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div><p className="text-xs text-muted-foreground">{stats.total} payments</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Cash</CardTitle><Banknote className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.cash.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">UPI</CardTitle><Smartphone className="h-4 w-4 text-purple-600" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.upi.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Bank</CardTitle><CreditCard className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.bank.toLocaleString()}</div></CardContent></Card>
        </div>
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Transaction</TableHead><TableHead>Buyer</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Reference</TableHead></TableRow></TableHeader><TableBody>
          {payments.map((p) => { const txn = transactions.find(t => t.id === p.transaction_id); const lead = txn ? getLeadById(txn.lead_id) : null; const Icon = modeIcons[p.payment_mode]; return (<TableRow key={p.id}><TableCell>{format(new Date(p.payment_date), 'dd MMM yyyy')}</TableCell><TableCell className="font-medium">{txn?.transaction_number}</TableCell><TableCell>{lead?.name}</TableCell><TableCell className="font-semibold">₹{p.amount.toLocaleString()}</TableCell><TableCell><Badge className={modeColors[p.payment_mode]}><Icon className="mr-1 h-3 w-3" />{p.payment_mode.toUpperCase()}</Badge></TableCell><TableCell className="text-muted-foreground">{p.reference_id || '-'}</TableCell></TableRow>); })}
        </TableBody></Table></CardContent></Card>
      </div>
    </MockAppLayout>
  );
};

export default Payments;
