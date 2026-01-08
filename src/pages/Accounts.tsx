import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccounts } from '@/hooks/useAccounts';
import { Loader2 } from 'lucide-react';

const Accounts = () => {
  const { data: accounts, isLoading } = useAccounts();

  return (
    <AppLayout title="Accounts" subtitle="Manage payment accounts">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Accounts</CardTitle>
              <CardDescription>Manage payment destination accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {accounts && accounts.length > 0 ? (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{account.name}</h3>
                          {account.upi_details && (
                            <p className="text-sm text-muted-foreground">UPI: {account.upi_details}</p>
                          )}
                          {account.bank_details && (
                            <p className="text-sm text-muted-foreground">Bank: {account.bank_details}</p>
                          )}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No accounts found.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Accounts;

