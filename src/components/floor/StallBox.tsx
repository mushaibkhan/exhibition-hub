import { cn } from '@/lib/utils';
import { Stall, StallStatus } from '@/types/database';
import { useMockData } from '@/contexts/MockDataContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
interface StallBoxProps {
  stall: Stall;
  assignedTo?: string | null;
  amountPaid?: number;
  totalAmount?: number;
  onClick: () => void;
}

const statusStyles: Record<StallStatus, string> = {
  available: 'bg-stall-available border-stall-available-border hover:shadow-lg',
  reserved: 'bg-stall-reserved border-stall-reserved-border hover:shadow-lg',
  sold: 'bg-stall-sold border-stall-sold-border hover:shadow-lg',
  pending: 'bg-stall-pending border-stall-pending-border hover:shadow-lg',
  blocked: 'bg-stall-blocked border-stall-blocked-border cursor-not-allowed opacity-60',
};

const statusLabels: Record<StallStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
  pending: 'Payment Pending',
  blocked: 'Blocked',
};

export const StallBox = ({ stall, assignedTo, amountPaid, totalAmount, onClick }: StallBoxProps) => {
  const { isAdmin } = useMockData();

  const gridColumn = `${stall.position_x + 1} / span ${stall.width}`;
  const gridRow = `${stall.position_y + 1} / span ${stall.height}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          style={{ gridColumn, gridRow }}
          className={cn(
            'flex min-h-[80px] flex-col items-center justify-center rounded-lg border-2 p-2 text-foreground transition-all duration-200',
            statusStyles[stall.status]
          )}
        >
          <span className="text-lg font-bold">{stall.stall_number}</span>
          <span className="text-xs opacity-70">{stall.size}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">{stall.stall_number}</span>
            <span className={cn(
              'rounded px-2 py-0.5 text-xs font-medium',
              stall.status === 'available' && 'bg-pink-200 text-pink-800',
              stall.status === 'reserved' && 'bg-yellow-200 text-yellow-800',
              stall.status === 'sold' && 'bg-green-200 text-green-800',
              stall.status === 'pending' && 'bg-orange-200 text-orange-800',
              stall.status === 'blocked' && 'bg-gray-200 text-gray-800',
            )}>
              {statusLabels[stall.status]}
            </span>
          </div>
          <div className="text-sm">
            <p><span className="text-muted-foreground">Size:</span> {stall.size}</p>
            <p><span className="text-muted-foreground">Zone:</span> {stall.zone || 'N/A'}</p>
            {assignedTo && (
              <p><span className="text-muted-foreground">Buyer:</span> {assignedTo}</p>
            )}
            {isAdmin && totalAmount !== undefined && (
              <p>
                <span className="text-muted-foreground">Payment:</span>{' '}
                ₹{(amountPaid || 0).toLocaleString()} / ₹{totalAmount.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
