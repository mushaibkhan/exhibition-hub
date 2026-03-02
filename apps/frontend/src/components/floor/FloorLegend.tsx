const legendItems = [
  { label: 'Available', className: 'bg-stall-available border-stall-available-border' },
  { label: 'Reserved', className: 'bg-stall-reserved border-stall-reserved-border' },
  { label: 'Sold', className: 'bg-stall-sold border-stall-sold-border' },
  { label: 'Payment Pending', className: 'bg-stall-pending border-stall-pending-border' },
  { label: 'Blocked', className: 'bg-stall-blocked border-stall-blocked-border' },
];

export const FloorLegend = () => {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg bg-card p-4 shadow-sm">
      <span className="text-sm font-medium text-muted-foreground">Legend:</span>
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={`h-5 w-5 rounded border-2 ${item.className}`} />
          <span className="text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  );
};
