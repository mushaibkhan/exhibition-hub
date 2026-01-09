import { useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { StallBox } from '@/components/floor/StallBox';
import { FloorLegend } from '@/components/floor/FloorLegend';
import { StallDrawer } from '@/components/floor/StallDrawer';
import { useMockData } from '@/contexts/MockDataContext';
import { Stall } from '@/types/database';

const Index = () => {
  const { stalls, getLeadById, transactions, getTransactionsByLeadId } = useMockData();
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleStallClick = (stall: Stall) => {
    setSelectedStall(stall);
    setDrawerOpen(true);
  };

  // Group stalls by zone
  const hallAStalls = stalls.filter(s => s.zone === 'Hall A');
  const hallBStalls = stalls.filter(s => s.zone === 'Hall B');

  // Get assignment info for stalls
  const getStallInfo = (stall: Stall) => {
    // Find transaction that includes this stall
    const txn = transactions.find(t => {
      const lead = getLeadById(t.lead_id);
      return lead && (stall.status === 'sold' || stall.status === 'pending' || stall.status === 'reserved');
    });
    
    if (txn) {
      const lead = getLeadById(txn.lead_id);
      return {
        assignedTo: lead?.name,
        amountPaid: txn.amount_paid,
        totalAmount: txn.total_amount,
      };
    }
    return {};
  };

  return (
    <MockAppLayout title="Floor Layout" subtitle="Exhibition hall stall overview">
      <div className="space-y-6">
        <FloorLegend />
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Hall A */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Hall A</h3>
            <div 
              className="grid gap-2"
              style={{ 
                gridTemplateColumns: 'repeat(5, minmax(60px, 1fr))',
                gridTemplateRows: 'repeat(6, minmax(60px, auto))'
              }}
            >
              {hallAStalls.map((stall) => {
                const info = getStallInfo(stall);
                return (
                  <StallBox 
                    key={stall.id} 
                    stall={stall}
                    assignedTo={info.assignedTo}
                    amountPaid={info.amountPaid}
                    totalAmount={info.totalAmount}
                    onClick={() => handleStallClick(stall)} 
                  />
                );
              })}
            </div>
          </div>

          {/* Hall B */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Hall B</h3>
            <div 
              className="grid gap-2"
              style={{ 
                gridTemplateColumns: 'repeat(5, minmax(60px, 1fr))',
                gridTemplateRows: 'repeat(6, minmax(60px, auto))'
              }}
            >
              {hallBStalls.map((stall) => {
                const info = getStallInfo(stall);
                // Adjust position for Hall B (offset by 6)
                const adjustedStall = {
                  ...stall,
                  position_x: stall.position_x - 6,
                };
                return (
                  <StallBox 
                    key={stall.id} 
                    stall={adjustedStall}
                    assignedTo={info.assignedTo}
                    amountPaid={info.amountPaid}
                    totalAmount={info.totalAmount}
                    onClick={() => handleStallClick(stall)} 
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <StallDrawer
        stall={selectedStall}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdate={() => {}}
      />
    </MockAppLayout>
  );
};

export default Index;
