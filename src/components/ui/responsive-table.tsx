import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveTableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTableWrapper({ children, className }: ResponsiveTableWrapperProps) {
  return (
    <div className={cn("overflow-x-auto -mx-4 md:mx-0", className)}>
      <div className="min-w-full inline-block align-middle px-4 md:px-0">
        {children}
      </div>
    </div>
  );
}

interface MobileCardViewProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
}

export function MobileCardView<T>({ data, renderCard, emptyState, className }: MobileCardViewProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => renderCard(item, index))}
    </div>
  );
}

interface ResponsiveDataViewProps<T> {
  data: T[];
  tableView: React.ReactNode;
  renderMobileCard: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
}

export function ResponsiveDataView<T>({ 
  data, 
  tableView, 
  renderMobileCard, 
  emptyState 
}: ResponsiveDataViewProps<T>) {
  const isMobile = useIsMobile();

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item, index) => renderMobileCard(item, index))}
      </div>
    );
  }

  return <ResponsiveTableWrapper>{tableView}</ResponsiveTableWrapper>;
}
