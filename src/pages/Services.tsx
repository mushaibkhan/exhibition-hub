import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useServices } from '@/hooks/useServices';
import { Loader2 } from 'lucide-react';

const Services = () => {
  const { data: services, isLoading } = useServices();

  return (
    <AppLayout title="Services" subtitle="Manage exhibition services">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>Manage available services and add-ons</CardDescription>
            </CardHeader>
            <CardContent>
              {services && services.length > 0 ? (
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">{service.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{service.price.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {service.is_unlimited ? 'Unlimited' : `${service.sold_quantity}/${service.quantity} sold`}
                          </p>
                        </div>
                      </div>
                      {service.description && (
                        <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No services found.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Services;

