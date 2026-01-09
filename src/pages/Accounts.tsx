import { Navigate } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/MockDataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2 } from 'lucide-react';

const Accounts = () => {
  const { isAdmin, accounts } = useMockData();
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <MockAppLayout title="Accounts" subtitle="Payment accounts (Admin Only)">
      <div className="space-y-6">
        <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-muted-foreground" /><span className="text-muted-foreground">{accounts.length} accounts configured</span></div>
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>UPI</TableHead><TableHead>Bank Details</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader><TableBody>
          {accounts.map((a) => (<TableRow key={a.id}><TableCell className="font-medium">{a.name}</TableCell><TableCell>{a.upi_details || '-'}</TableCell><TableCell className="max-w-[200px] truncate">{a.bank_details || '-'}</TableCell><TableCell><Badge variant={a.is_active ? 'default' : 'secondary'}>{a.is_active ? 'Active' : 'Inactive'}</Badge></TableCell><TableCell className="max-w-[150px] truncate text-muted-foreground">{a.notes || '-'}</TableCell></TableRow>))}
        </TableBody></Table></CardContent></Card>
      </div>
    </MockAppLayout>
  );
};

export default Accounts;
