import { cn } from '@/lib/utils';
import { Stall, StallStatus } from '@/types/database';
import { useMockData } from '@/contexts/SupabaseDataContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sparkles } from 'lucide-react';
interface StallBoxProps {
  stall: Stall;
  assignedTo?: string | null;
  amountPaid?: number;
  totalAmount?: number;
  hasServices?: boolean;
  hasPendingPayment?: boolean;
  serviceCount?: number;
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

export const StallBox = ({ stall, assignedTo, amountPaid, totalAmount, hasServices, hasPendingPayment, serviceCount, onClick }: StallBoxProps) => {
  const { isAdmin } = useMockData();

  // Explicit grid positioning - CSS Grid uses 1-based indexing
  // position_x and position_y are 0-based, so add 1 for grid-row-start and grid-column-start
  // Handle optional position fields (from layout table)
  const gridColumnStart = (stall.position_x ?? 0) + 1;
  const gridColumnEnd = gridColumnStart + (stall.width ?? 1);
  const gridRowStart = (stall.position_y ?? 0) + 1;
  const gridRowEnd = gridRowStart + (stall.height ?? 1);

  // Determine border style for pending payment - use orange/amber color
  const borderStyle = hasPendingPayment 
    ? 'border-dashed border-4 border-orange-500 dark:border-orange-400' 
    : 'border-2';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          style={{ 
            gridColumnStart,
            gridColumnEnd,
            gridRowStart,
            gridRowEnd
          }}
          className={cn(
            'relative flex min-h-[60px] sm:min-h-[80px] flex-col items-center justify-center rounded-lg p-1 sm:p-2 text-foreground transition-all duration-200 touch-manipulation',
            statusStyles[stall.status],
            borderStyle
          )}
        >
          {hasServices && (
            <div className="absolute top-1 right-1 flex items-center gap-0.5">
              <Sparkles className="h-4 w-4 text-yellow-500 drop-shadow-sm" />
              {serviceCount && serviceCount > 1 && (
                <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/50 rounded-full px-1 min-w-[14px] text-center">
                  {serviceCount}
                </span>
              )}
            </div>
          )}
          <span className="text-sm sm:text-lg font-bold">{stall.stall_number}</span>
          <span className="text-[10px] sm:text-xs opacity-70">3×2</span>
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
            <p><span className="text-muted-foreground">Size:</span> 3×2</p>
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
            {hasServices && (
              <p>
                <span className="text-muted-foreground">Services:</span>{' '}
                {serviceCount && serviceCount > 1 ? `${serviceCount} services allocated` : 'Allocated'}
              </p>
            )}
            {hasPendingPayment && (
              <p>
                <span className="text-muted-foreground">Payment:</span>{' '}
                <span className="text-orange-600 dark:text-orange-400 font-medium">Pending</span>
              </p>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
