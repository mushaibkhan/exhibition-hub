import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { StallBox } from '@/components/floor/StallBox';
import { FloorLegend } from '@/components/floor/FloorLegend';
import { StallDrawer } from '@/components/floor/StallDrawer';
import { useData } from '@/contexts/DataContext';
import { Stall } from '@/types/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { stalls, getLeadById, transactions, getServiceAllocationsByStallId, getTransactionsByStallId } = useData();
  const location = useLocation();
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Handle navigation state to auto-open stall drawer
  useEffect(() => {
    const stallId = (location.state as any)?.stallId;
    if (stallId) {
      const stall = stalls.find(s => s.id === stallId);
      if (stall) {
        setSelectedStall(stall);
        setDrawerOpen(true);
      }
    }
  }, [location.state, stalls]);

  const handleStallClick = (stall: Stall) => {
    setSelectedStall(stall);
    setDrawerOpen(true);
  };

  const floor1Stalls = stalls?.filter(s => s && s.zone === 'Floor 1') || [];
  const floor2Stalls = stalls?.filter(s => s && s.zone === 'Floor 2') || [];

  const getStallInfo = (stall: Stall) => {
    if (!stall || !stall.id) {
      return { hasServices: false, hasPendingPayment: false, serviceCount: 0 };
    }
    const stallTransactions = getTransactionsByStallId(stall.id);
    const services = getServiceAllocationsByStallId(stall.id);
    const hasServices = services && services.length > 0;
    const serviceCount = services ? services.length : 0;
    
    // Check for pending payments across all transactions for this stall
    const hasPendingPayment = stallTransactions && stallTransactions.some(txn => txn && txn.payment_status !== 'paid');
    
    // Get lead from first transaction (stall.lead_id was removed, lead comes from transaction)
    if (stallTransactions && stallTransactions.length > 0) {
      const firstTxn = stallTransactions[0];
      if (firstTxn && firstTxn.lead_id) {
        const lead = getLeadById(firstTxn.lead_id);
        return { 
          assignedTo: lead?.name || null, 
          amountPaid: firstTxn.amount_paid || 0, 
          totalAmount: firstTxn.total_amount || 0,
          hasServices,
          hasPendingPayment,
          serviceCount
        };
      }
    }
    return { hasServices, hasPendingPayment: false, serviceCount };
  };

  const renderFloorGrid = (floorStalls: Stall[]) => {
    if (!floorStalls || floorStalls.length === 0) return null;
    const sortedStalls = [...floorStalls]
      .filter(stall => stall && stall.id && (stall.position_x !== undefined && stall.position_y !== undefined))
      .sort((a, b) => {
        const posY = (a.position_y ?? 0) - (b.position_y ?? 0);
        if (posY !== 0) return posY;
        return (a.position_x ?? 0) - (b.position_x ?? 0);
      });

    const cols = sortedStalls.length > 0
      ? Math.max(...sortedStalls.map(s => (s.position_x ?? 0) + (s.width ?? 1)))
      : 12;
    const rows = sortedStalls.length > 0
      ? Math.max(...sortedStalls.map(s => (s.position_y ?? 0) + (s.height ?? 1)))
      : 1;

    return (
      <div 
        className="floor-layout-container overflow-auto max-h-[70vh] md:max-h-none"
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
      >
        <div 
          className="grid gap-0.5 sm:gap-1 p-2 sm:p-4 bg-muted/30 rounded-lg min-w-full sm:min-w-[500px]" 
          style={{ 
            gridTemplateColumns: `repeat(${cols}, minmax(35px, 1fr))`, 
            gridTemplateRows: `repeat(${rows}, minmax(35px, auto))`,
          }}
        >
          {sortedStalls.map((stall) => {
        const info = getStallInfo(stall);
            return <StallBox 
              key={stall.id} 
              stall={stall} 
              assignedTo={info.assignedTo} 
              amountPaid={info.amountPaid} 
              totalAmount={info.totalAmount}
              hasServices={info.hasServices}
              hasPendingPayment={info.hasPendingPayment}
              serviceCount={info.serviceCount}
              onClick={() => handleStallClick(stall)} 
            />;
      })}
        </div>
    </div>
  );
  };

  return (
    <MockAppLayout title="Floor Layout" subtitle="Exhibition floor stall overview">
      <div className="space-y-6">
        <FloorLegend />
        <Tabs defaultValue="floor1" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-10">
            <TabsTrigger value="floor1" className="text-xs md:text-sm">Floor 1 (Ground)</TabsTrigger>
            <TabsTrigger value="floor2" className="text-xs md:text-sm">Floor 2 (First)</TabsTrigger>
          </TabsList>
          <TabsContent value="floor1" className="mt-4">
            <div className="rounded-xl border bg-card p-3 sm:p-6 shadow-sm">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Ground Floor - {floor1Stalls.length} Stalls</h3>
              {renderFloorGrid(floor1Stalls)}
            </div>
          </TabsContent>
          <TabsContent value="floor2" className="mt-4">
            <div className="rounded-xl border bg-card p-3 sm:p-6 shadow-sm">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">First Floor - {floor2Stalls.length} Stalls</h3>
              {renderFloorGrid(floor2Stalls)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <StallDrawer stall={selectedStall} open={drawerOpen} onOpenChange={setDrawerOpen} onUpdate={() => {}} />
    </MockAppLayout>
  );
};

export default Index;
