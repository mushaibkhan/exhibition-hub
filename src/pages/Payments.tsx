import { Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/MockDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaymentMode } from '@/types/database';
import { CreditCard, Banknote, Smartphone, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, formatDateForExport, formatCurrencyForExport } from '@/lib/exportUtils';

const modeColors: Record<PaymentMode, string> = { cash: 'bg-green-100 text-green-800', upi: 'bg-purple-100 text-purple-800', bank: 'bg-blue-100 text-blue-800' };
const modeIcons: Record<PaymentMode, React.ElementType> = { cash: Banknote, upi: Smartphone, bank: CreditCard };

const Payments = () => {
  const { isAdmin, payments, transactions, accounts, getLeadById } = useMockData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  if (!isAdmin) return <Navigate to="/" replace />;

  const stats = { total: payments.length, totalAmount: payments.reduce((s, p) => s + p.amount, 0), cash: payments.filter(p => p.payment_mode === 'cash').reduce((s, p) => s + p.amount, 0), upi: payments.filter(p => p.payment_mode === 'upi').reduce((s, p) => s + p.amount, 0), bank: payments.filter(p => p.payment_mode === 'bank').reduce((s, p) => s + p.amount, 0) };

  const handleExport = async () => {
    if (isExporting || payments.length === 0) return;
    setIsExporting(true);
    
    try {
      const exportData = payments.map(p => {
        const txn = transactions.find(t => t.id === p.transaction_id);
        const lead = txn ? getLeadById(txn.lead_id) : null;
        const account = accounts.find(a => a.id === p.account_id);
        
        return {
          'Payment Date': formatDateForExport(p.payment_date),
          'Transaction Number': txn?.transaction_number || '',
          'Buyer Name': lead?.name || '',
          'Amount': formatCurrencyForExport(p.amount),
          'Payment Mode': p.payment_mode.toUpperCase(),
          'Reference ID': p.reference_id || '',
          'Account': account?.name || '',
          'Notes': p.notes || '',
        };
      });

      exportToExcel(exportData, 'Payments_Export', 'Payments');
      toast({ title: 'Success', description: `Exported ${exportData.length} payment(s) to Excel` });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MockAppLayout title="Payments" subtitle="Payment records (Admin Only)">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleExport} disabled={payments.length === 0 || isExporting}>
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
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Collected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div><p className="text-xs text-muted-foreground">{stats.total} payments</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Cash</CardTitle><Banknote className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.cash.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">UPI</CardTitle><Smartphone className="h-4 w-4 text-purple-600" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.upi.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Bank</CardTitle><CreditCard className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.bank.toLocaleString()}</div></CardContent></Card>
        </div>
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Transaction</TableHead><TableHead>Buyer</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Reference</TableHead></TableRow></TableHeader><TableBody>
          {payments.map((p) => { 
            const txn = transactions.find(t => t.id === p.transaction_id); 
            const lead = txn ? getLeadById(txn.lead_id) : null; 
            const Icon = modeIcons[p.payment_mode]; 
            return (
              <TableRow key={p.id}>
                <TableCell>{format(new Date(p.payment_date), 'dd MMM yyyy')}</TableCell>
                <TableCell 
                  className="font-medium hover:text-primary hover:underline cursor-pointer"
                  onClick={() => navigate('/transactions', { state: { highlightTransaction: p.transaction_id } })}
                >
                  {txn?.transaction_number}
                </TableCell>
                <TableCell 
                  className="hover:text-primary hover:underline cursor-pointer"
                  onClick={() => navigate('/leads')}
                >
                  {lead?.name}
                </TableCell>
                <TableCell className="font-semibold">₹{p.amount.toLocaleString()}</TableCell>
                <TableCell><Badge className={modeColors[p.payment_mode]}><Icon className="mr-1 h-3 w-3" />{p.payment_mode.toUpperCase()}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{p.reference_id || '-'}</TableCell>
              </TableRow>
            ); 
          })}
          {payments.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-64 text-center">
                <div className="flex flex-col items-center justify-center space-y-3 py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground/50" />
                  <div className="space-y-1">
                    <p className="text-lg font-medium text-muted-foreground">No payments recorded yet</p>
                    <p className="text-sm text-muted-foreground">
                      Payments will appear here once transactions are created and payments are recorded.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody></Table></CardContent></Card>
      </div>
    </MockAppLayout>
  );
};

export default Payments;
