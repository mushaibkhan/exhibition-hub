import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
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
  Settings,
  LogOut,
  DollarSign,
  Tag,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  section?: string; // Optional section label
}

// Reordered to follow operational workflow
const navItems: NavItem[] = [
  // Top level - Dashboard
  { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  { label: 'Floor Layout', path: '/floor-layout', icon: LayoutGrid },
  
  // Operations section
  { label: 'Leads', path: '/leads', icon: Users, section: 'Operations' },
  { label: 'Bookings', path: '/transactions', icon: Receipt, section: 'Operations' },
  { label: 'Receipts', path: '/receipts', icon: CreditCard, section: 'Operations' },
  { label: 'Expenses', path: '/expenses', icon: DollarSign, adminOnly: true, section: 'Operations' },
  { label: 'Team Ledger', path: '/team-ledger', icon: Wallet, section: 'Operations' },
  
  // Reference section
  { label: 'Stalls', path: '/stalls', icon: Square, section: 'Reference' },
  { label: 'Stall Prices', path: '/stall-prices', icon: Tag, adminOnly: true, section: 'Reference' },
  { label: 'Services', path: '/services', icon: Package, section: 'Reference' },
  
  // Admin section
  { label: 'Accounts', path: '/accounts', icon: Building2, adminOnly: true, section: 'Admin' },
  { label: 'Users', path: '/users', icon: UserCog, adminOnly: true, section: 'Admin' },
  { label: 'Settings', path: '/settings', icon: Settings, adminOnly: true, section: 'Admin' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { isAdmin, signOut, user } = useAuth();

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground">
      <div className="flex h-full flex-col">
        {/* Logo / Header */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <LayoutGrid className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">HydExpo</h1>
              <p className="text-xs text-sidebar-foreground/70">Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {(() => {
            const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);
            const groupedItems: { [key: string]: NavItem[] } = {};
            const topLevelItems: NavItem[] = [];
            
            // Group items by section
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
                {/* Top level items (Dashboard, Floor Layout) */}
                {topLevelItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
                
                {/* Grouped sections */}
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
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                isActive
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
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

        {/* User / Logout */}
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 px-2">
            <p className="text-xs text-sidebar-foreground/60">Signed in as</p>
            <p className="truncate text-sm font-medium">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
};
