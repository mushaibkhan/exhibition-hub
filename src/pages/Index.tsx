import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StallBox } from '@/components/floor/StallBox';
import { FloorLegend } from '@/components/floor/FloorLegend';
import { StallDrawer } from '@/components/floor/StallDrawer';
import { useStalls } from '@/hooks/useStalls';
import { useAuth } from '@/contexts/AuthContext';
import { Stall } from '@/types/database';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, role, isLoading: authLoading } = useAuth();
  const { data: stalls, isLoading, refetch } = useStalls();
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Pending</h1>
          <p className="text-muted-foreground">Please wait for an admin to assign your role.</p>
        </div>
      </div>
    );
  }

  const handleStallClick = (stall: Stall) => {
    setSelectedStall(stall);
    setDrawerOpen(true);
  };

  return (
    <AppLayout title="Floor Layout" subtitle="Exhibition hall stall overview">
      <div className="space-y-6">
        <FloorLegend />
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div 
              className="grid gap-3"
              style={{ 
                gridTemplateColumns: 'repeat(5, minmax(100px, 1fr))',
                gridTemplateRows: 'repeat(5, minmax(80px, auto))'
              }}
            >
              {stalls?.map((stall) => (
                <StallBox 
                  key={stall.id} 
                  stall={stall} 
                  onClick={() => handleStallClick(stall)} 
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <StallDrawer
        stall={selectedStall}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdate={() => refetch()}
      />
    </AppLayout>
  );
};

export default Index;
