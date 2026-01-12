import { ReactNode } from 'react';
import { MockSidebar } from './MockSidebar';
import { RoleSwitcher } from './RoleSwitcher';
import { useExhibition } from '@/contexts/ExhibitionContext';
import { Badge } from '@/components/ui/badge';

interface MockAppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const MockAppLayout = ({ children, title, subtitle }: MockAppLayoutProps) => {
  const { currentExhibition } = useExhibition();
  
  return (
    <div className="min-h-screen bg-background">
      <MockSidebar />
      
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <Badge variant="outline" className="hidden sm:flex">
              {currentExhibition.shortName}
            </Badge>
          </div>
          <RoleSwitcher />
        </header>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
