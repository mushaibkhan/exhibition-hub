import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Shield, User } from 'lucide-react';

export const RoleSwitcher = () => {
  const { role, setRole, isAdmin } = useData();
  const { user } = useAuth();

  const isRealAdmin = user?.roles?.includes('admin') ?? false;

  if (!isRealAdmin) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-card p-3 shadow-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        <Badge variant="secondary">MAINTAINER</Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Maintainer</span>
      </div>
      
      <Switch
        id="role-switch"
        checked={isAdmin}
        onCheckedChange={(checked) => setRole(checked ? 'admin' : 'maintainer')}
      />
      
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Admin</span>
      </div>
      
      <Badge variant={isAdmin ? 'default' : 'secondary'} className="ml-2">
        {role.toUpperCase()}
      </Badge>
    </div>
  );
};
