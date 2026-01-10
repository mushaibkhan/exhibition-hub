import { useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { StallBox } from '@/components/floor/StallBox';
import { FloorLegend } from '@/components/floor/FloorLegend';
import { StallDrawer } from '@/components/floor/StallDrawer';
import { useMockData } from '@/contexts/MockDataContext';
import { Stall } from '@/types/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { stalls, getLeadById, transactions } = useMockData();
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleStallClick = (stall: Stall) => {
    setSelectedStall(stall);
    setDrawerOpen(true);
  };

  const floor1Stalls = stalls.filter(s => s.zone === 'Floor 1');
  const floor2Stalls = stalls.filter(s => s.zone === 'Floor 2');

  const getStallInfo = (stall: Stall) => {
    if (stall.lead_id) {
      const lead = getLeadById(stall.lead_id);
      const txn = transactions.find(t => t.lead_id === stall.lead_id);
      return { assignedTo: lead?.name, amountPaid: txn?.amount_paid, totalAmount: txn?.total_amount };
    }
    return {};
  };

  const renderFloorGrid = (floorStalls: Stall[], cols: number, rows: number) => (
    <div className="grid gap-1 p-4 bg-muted/30 rounded-lg overflow-auto" style={{ gridTemplateColumns: `repeat(${cols}, minmax(50px, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(50px, auto))` }}>
      {floorStalls.map((stall) => {
        const info = getStallInfo(stall);
        return <StallBox key={stall.id} stall={stall} assignedTo={info.assignedTo} amountPaid={info.amountPaid} totalAmount={info.totalAmount} onClick={() => handleStallClick(stall)} />;
      })}
    </div>
  );

  return (
    <MockAppLayout title="Floor Layout" subtitle="Exhibition floor stall overview">
      <div className="space-y-6">
        <FloorLegend />
        <Tabs defaultValue="floor1" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="floor1">Floor 1 (Ground)</TabsTrigger>
            <TabsTrigger value="floor2">Floor 2 (First)</TabsTrigger>
          </TabsList>
          <TabsContent value="floor1" className="mt-4">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Ground Floor - {floor1Stalls.length} Stalls</h3>
              {renderFloorGrid(floor1Stalls, 14, 6)}
            </div>
          </TabsContent>
          <TabsContent value="floor2" className="mt-4">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">First Floor - {floor2Stalls.length} Stalls</h3>
              {renderFloorGrid(floor2Stalls, 12, 5)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <StallDrawer stall={selectedStall} open={drawerOpen} onOpenChange={setDrawerOpen} onUpdate={() => {}} />
    </MockAppLayout>
  );
};

export default Index;
