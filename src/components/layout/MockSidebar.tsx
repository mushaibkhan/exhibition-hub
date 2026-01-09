import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMockData } from '@/contexts/MockDataContext';
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
}

const navItems: NavItem[] = [
  { label: 'Floor Layout', path: '/', icon: LayoutGrid },
  { label: 'Dashboard', path: '/dashboard', icon: BarChart3, adminOnly: true },
  { label: 'Leads', path: '/leads', icon: Users },
  { label: 'Stalls', path: '/stalls', icon: Square },
  { label: 'Services', path: '/services', icon: Package },
  { label: 'Transactions', path: '/transactions', icon: Receipt },
  { label: 'Payments', path: '/payments', icon: CreditCard, adminOnly: true },
  { label: 'Accounts', path: '/accounts', icon: Building2, adminOnly: true },
  { label: 'Users', path: '/users', icon: UserCog, adminOnly: true },
];

export const MockSidebar = () => {
  const location = useLocation();
  const { isAdmin, role } = useMockData();

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
          {filteredNavItems.map((item) => {
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
        </nav>

        {/* Role indicator */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-accent/50 px-3 py-2">
            <p className="text-xs text-sidebar-foreground/60">Current Role</p>
            <p className="text-sm font-semibold capitalize">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
