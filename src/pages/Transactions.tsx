import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { Loader2 } from 'lucide-react';

const Transactions = () => {
  const { data: transactions, isLoading } = useTransactions();

  return (
    <AppLayout title="Transactions" subtitle="Manage all transactions">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>View and manage all transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{transaction.transaction_number}</h3>
                          <p className="text-sm text-muted-foreground">
                            {transaction.lead?.name || 'No lead'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{transaction.total_amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            Paid: ₹{transaction.amount_paid.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          transaction.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                          transaction.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.payment_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No transactions found.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Transactions;

