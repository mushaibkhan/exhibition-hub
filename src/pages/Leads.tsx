import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeads } from '@/hooks/useLeads';
import { Loader2 } from 'lucide-react';

const Leads = () => {
  const { data: leads, isLoading } = useLeads();

  return (
    <AppLayout title="Leads" subtitle="Manage potential customers">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Leads</CardTitle>
              <CardDescription>Manage and track potential customers</CardDescription>
            </CardHeader>
            <CardContent>
              {leads && leads.length > 0 ? (
                <div className="space-y-4">
                  {leads.map((lead) => (
                    <div key={lead.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{lead.name}</h3>
                          <p className="text-sm text-muted-foreground">{lead.company || 'No company'}</p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {lead.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>Phone: {lead.phone}</p>
                        {lead.email && <p>Email: {lead.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No leads found.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Leads;

