import { ChevronDown, Building2 } from 'lucide-react';
import { useExhibition } from '@/contexts/ExhibitionContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ExhibitionSelector = () => {
  const { currentExhibition, setCurrentExhibition, exhibitions, isLoading } = useExhibition();

  if (isLoading || !currentExhibition) {
    return (
      <div className="px-3 py-3 border-b border-sidebar-border">
        <div className="text-xs font-medium text-sidebar-foreground/60 mb-2 px-1">
          Current Exhibition
        </div>
        <div className="text-sm text-sidebar-foreground/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 border-b border-sidebar-border">
      <div className="text-xs font-medium text-sidebar-foreground/60 mb-2 px-1">
        Current Exhibition
      </div>
      <Select
        value={currentExhibition.id}
        onValueChange={(value) => {
          const exhibition = exhibitions.find(e => e.id === value);
          if (exhibition) setCurrentExhibition(exhibition);
        }}
      >
        <SelectTrigger className="w-full bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-sidebar-primary" />
            <SelectValue>
              <span className="truncate">{currentExhibition.shortName}</span>
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="w-[240px]">
          {exhibitions.map((exhibition) => (
            <SelectItem 
              key={exhibition.id} 
              value={exhibition.id}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">{exhibition.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(exhibition.startDate).toLocaleDateString('en-IN', { 
                    month: 'short', 
                    day: 'numeric' 
                  })} - {new Date(exhibition.endDate).toLocaleDateString('en-IN', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
