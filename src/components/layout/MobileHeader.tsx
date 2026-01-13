import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExhibition } from '@/contexts/ExhibitionContext';
import { RoleSwitcher } from './RoleSwitcher';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const MobileHeader = ({ title, subtitle, sidebarOpen, onToggleSidebar }: MobileHeaderProps) => {
  const { currentExhibition } = useExhibition();

  return (
    <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center justify-between border-b bg-background/95 px-3 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 h-9 w-9"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-xl font-semibold truncate">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>}
        </div>
        
        <Badge variant="outline" className="hidden sm:flex shrink-0 text-xs">
          {currentExhibition.shortName}
        </Badge>
      </div>
      
      <div className="shrink-0 ml-2">
        <RoleSwitcher />
      </div>
    </header>
  );
};
