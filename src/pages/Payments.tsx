import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePayments } from '@/hooks/usePayments';
import { Loader2 } from 'lucide-react';

const Payments = () => {
  const { data: payments, isLoading } = usePayments();

  return (
    <AppLayout title="Payments" subtitle="Manage payment records">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>View and manage all payment records</CardDescription>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {payment.transaction?.transaction_number || 'No transaction'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {payment.payment_mode} • {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{payment.amount.toLocaleString()}</p>
                          {payment.account && (
                            <p className="text-xs text-muted-foreground">{payment.account.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No payments found.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Payments;

