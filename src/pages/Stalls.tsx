import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStalls } from '@/hooks/useStalls';
import { Loader2 } from 'lucide-react';

const Stalls = () => {
  const { data: stalls, isLoading } = useStalls();

  return (
    <AppLayout title="Stalls" subtitle="Manage exhibition stalls">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Stalls</CardTitle>
              <CardDescription>View and manage all exhibition stalls</CardDescription>
            </CardHeader>
            <CardContent>
              {stalls && stalls.length > 0 ? (
                <div className="space-y-4">
                  {stalls.map((stall) => (
                    <div key={stall.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Stall {stall.stall_number}</h3>
                          <p className="text-sm text-muted-foreground">
                            {stall.size} • {stall.zone || 'No zone'}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          stall.status === 'available' ? 'bg-green-100 text-green-800' :
                          stall.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                          stall.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {stall.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>Base Rent: ₹{stall.base_rent.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No stalls found.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Stalls;

