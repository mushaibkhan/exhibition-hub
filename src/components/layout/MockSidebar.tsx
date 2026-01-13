import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMockData } from '@/contexts/MockDataContext';
import { ExhibitionSelector } from './ExhibitionSelector';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  BarChart3,
  Users,
  Square,
  Package,
  Receipt,
  CreditCard,
  Building2,
  UserCog,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  section?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: BarChart3, adminOnly: true },
  { label: 'Floor Layout', path: '/', icon: LayoutGrid },
  { label: 'Leads', path: '/leads', icon: Users, section: 'Operations' },
  { label: 'Transactions', path: '/transactions', icon: Receipt, section: 'Operations' },
  { label: 'Payments', path: '/payments', icon: CreditCard, adminOnly: true, section: 'Operations' },
  { label: 'Stalls', path: '/stalls', icon: Square, section: 'Reference' },
  { label: 'Services', path: '/services', icon: Package, section: 'Reference' },
  { label: 'Accounts', path: '/accounts', icon: Building2, adminOnly: true, section: 'Admin' },
  { label: 'Users', path: '/users', icon: UserCog, adminOnly: true, section: 'Admin' },
];

interface MockSidebarProps {
  onClose?: () => void;
}

export const MockSidebar = ({ onClose }: MockSidebarProps) => {
  const location = useLocation();
  const { isAdmin, role } = useMockData();

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="h-screen w-full md:w-64 bg-sidebar text-sidebar-foreground md:fixed md:left-0 md:top-0 flex flex-col">
      {/* Logo / Header */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <LayoutGrid className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">HydExpo</h1>
            <p className="text-xs text-sidebar-foreground/70">Management</p>
          </div>
        </div>
        {/* Close button for mobile */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Exhibition Selector */}
      <ExhibitionSelector />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {(() => {
          const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);
          const groupedItems: { [key: string]: NavItem[] } = {};
          const topLevelItems: NavItem[] = [];
          
          filteredItems.forEach(item => {
            if (item.section) {
              if (!groupedItems[item.section]) {
                groupedItems[item.section] = [];
              }
              groupedItems[item.section].push(item);
            } else {
              topLevelItems.push(item);
            }
          });
          
          return (
            <>
              {topLevelItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 md:py-2.5 text-sm font-medium transition-colors touch-target',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              {['Operations', 'Reference', 'Admin'].map((sectionName) => {
                const sectionItems = groupedItems[sectionName] || [];
                if (sectionItems.length === 0) return null;
                
                return (
                  <div key={sectionName} className="mt-4 first:mt-0">
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                        {sectionName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {sectionItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-3 md:py-2.5 text-sm font-medium transition-colors touch-target',
                              isActive
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          );
        })()}
      </nav>

      {/* Role indicator */}
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/50 px-3 py-2">
          <p className="text-xs text-sidebar-foreground/60">Current Role</p>
          <p className="text-sm font-semibold capitalize">{role}</p>
        </div>
      </div>
    </aside>
  );
};
