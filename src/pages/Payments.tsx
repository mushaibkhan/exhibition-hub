import { Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/SupabaseDataContext';
import { useExhibition } from '@/contexts/ExhibitionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildInvoiceData, generateInvoiceNumber } from '@/lib/invoiceUtils';
import { downloadInvoicePDF } from '@/lib/generateInvoicePDF';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaymentMode } from '@/types/database';
import { CreditCard, Banknote, Smartphone, Download, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, formatDateForExport, formatCurrencyForExport } from '@/lib/exportUtils';

const modeColors: Record<PaymentMode, string> = { cash: 'bg-green-100 text-green-800', upi: 'bg-purple-100 text-purple-800', bank: 'bg-blue-100 text-blue-800' };
const modeIcons: Record<PaymentMode, React.ElementType> = { cash: Banknote, upi: Smartphone, bank: CreditCard };

const Payments = () => {
  const { payments, transactions, accounts, transactionItems, getLeadById, getItemsByTransactionId, getPaymentsByTransactionId } = useMockData();
  const { currentExhibition } = useExhibition();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);

  const handleGenerateInvoice = async (payment: any) => {
    if (!currentExhibition) {
      toast({
        title: 'Error',
        description: 'No exhibition selected.',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingInvoice(payment.id);
    try {
      const txn = transactions.find(t => t.id === payment.transaction_id);
      if (!txn) {
        throw new Error('Transaction not found');
      }

      const lead = getLeadById(txn.lead_id);
      if (!lead) {
        throw new Error('Lead not found');
      }

      const items = getItemsByTransactionId(txn.id);
      const allPayments = getPaymentsByTransactionId(txn.id);

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(payments);

      // Build invoice data
      const invoiceData = buildInvoiceData(
        { ...payment, invoice_number: invoiceNumber } as any,
        txn,
        lead,
        items,
        allPayments,
        {
          id: currentExhibition.id,
          name: currentExhibition.name,
          short_name: currentExhibition.shortName,
          description: currentExhibition.description || null,
          start_date: currentExhibition.startDate,
          end_date: currentExhibition.endDate,
          created_at: '',
          updated_at: '',
        }
      );

      invoiceData.invoiceNumber = invoiceNumber;

      // Generate and download invoice HTML file (user can print to PDF)
      downloadInvoicePDF(invoiceData);
      
      toast({
        title: 'Invoice Generated',
        description: 'Invoice generated and downloaded successfully.',
      });
    } catch (error: any) {
      const errorMsg = error?.message || '';
      const isTemplateError = errorMsg.includes('Failed to write') || errorMsg.includes('template');
      toast({
        title: 'Error',
        description: isTemplateError 
          ? 'Invoice generation failed – template mismatch.'
          : (errorMsg || 'Failed to generate invoice.'),
        variant: 'destructive',
      });
    } finally {
      setGeneratingInvoice(null);
    }
  };

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
          'Booking Number': txn?.transaction_number || '',
          'Buyer Name': lead?.name || '',
          'Company': lead?.company || '',
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
    <MockAppLayout title="Payments" subtitle="Payment records">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleExport} disabled={payments.length === 0 || isExporting} className="w-full sm:w-auto h-10 min-h-[44px]">
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
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Collected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div><p className="text-xs text-muted-foreground">{stats.total} payments</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Cash</CardTitle><Banknote className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.cash.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">UPI</CardTitle><Smartphone className="h-4 w-4 text-purple-600" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.upi.toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Bank</CardTitle><CreditCard className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{stats.bank.toLocaleString()}</div></CardContent></Card>
        </div>
        <Card><CardContent className="p-0 overflow-x-auto"><div className="min-w-full"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Transaction</TableHead><TableHead>Buyer</TableHead><TableHead>Company</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
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
                <TableCell className="text-muted-foreground">{lead?.company || '-'}</TableCell>
                <TableCell className="font-semibold">₹{p.amount.toLocaleString()}</TableCell>
                <TableCell><Badge className={modeColors[p.payment_mode]}><Icon className="mr-1 h-3 w-3" />{p.payment_mode.toUpperCase()}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{p.reference_id || '-'}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGenerateInvoice(p)}
                    disabled={generatingInvoice === p.id}
                    className="h-8"
                  >
                    {generatingInvoice === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ); 
          })}
          {payments.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-64 text-center">
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
          </TableBody></Table></div></CardContent></Card>
      </div>
    </MockAppLayout>
  );
};

export default Payments;
