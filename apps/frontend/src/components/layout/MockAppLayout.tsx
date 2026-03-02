import { ReactNode, useState, useEffect } from 'react';
import { MockSidebar } from './MockSidebar';
import { MobileHeader } from './MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MockAppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const MockAppLayout = ({ children, title, subtitle }: MockAppLayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Close sidebar on navigation (when route changes)
  useEffect(() => {
    setSidebarOpen(false);
  }, [title]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, sidebarOpen]);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <MockSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden android-overlay-fix"
          onClick={() => setSidebarOpen(false)}
          onTouchStart={(e) => e.preventDefault()} // Android: Prevent touch events from passing through
        />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:hidden android-sidebar-fix",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <MockSidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      <main className={cn(
        "min-h-screen transition-[margin] duration-300",
        "md:ml-64"
      )}>
        <MobileHeader 
          title={title} 
          subtitle={subtitle}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Content */}
        <div className="p-3 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
