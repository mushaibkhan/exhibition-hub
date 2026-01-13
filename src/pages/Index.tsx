import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { StallBox } from '@/components/floor/StallBox';
import { FloorLegend } from '@/components/floor/FloorLegend';
import { StallDrawer } from '@/components/floor/StallDrawer';
import { useMockData } from '@/contexts/MockDataContext';
import { Stall } from '@/types/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { stalls, getLeadById, transactions, getServiceAllocationsByStallId, getTransactionsByStallId } = useMockData();
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

  const floor1Stalls = stalls.filter(s => s.zone === 'Floor 1');
  const floor2Stalls = stalls.filter(s => s.zone === 'Floor 2');

  const getStallInfo = (stall: Stall) => {
    const stallTransactions = getTransactionsByStallId(stall.id);
    const services = getServiceAllocationsByStallId(stall.id);
    const hasServices = services.length > 0;
    const serviceCount = services.length;
    
    // Check for pending payments across all transactions for this stall
    const hasPendingPayment = stallTransactions.some(txn => txn.payment_status !== 'paid');
    
    if (stall.lead_id) {
      const lead = getLeadById(stall.lead_id);
      // Use the first transaction for legacy compatibility (or sum all)
      const firstTxn = stallTransactions[0];
      return { 
        assignedTo: lead?.name, 
        amountPaid: firstTxn?.amount_paid || 0, 
        totalAmount: firstTxn?.total_amount || 0,
        hasServices,
        hasPendingPayment,
        serviceCount
      };
    }
    return { hasServices, hasPendingPayment: false, serviceCount };
  };

  const renderFloorGrid = (floorStalls: Stall[], cols: number, rows: number) => {
    // Sort stalls by position to ensure consistent rendering order
    const sortedStalls = [...floorStalls].sort((a, b) => {
      if (a.position_y !== b.position_y) return a.position_y - b.position_y;
      return a.position_x - b.position_x;
    });

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
            // Explicit positioning - no auto-flow
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
              {renderFloorGrid(floor1Stalls, 12, 7)}
            </div>
          </TabsContent>
          <TabsContent value="floor2" className="mt-4">
            <div className="rounded-xl border bg-card p-3 sm:p-6 shadow-sm">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">First Floor - {floor2Stalls.length} Stalls</h3>
              {renderFloorGrid(floor2Stalls, 12, 7)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <StallDrawer stall={selectedStall} open={drawerOpen} onOpenChange={setDrawerOpen} onUpdate={() => {}} />
    </MockAppLayout>
  );
};

export default Index;
