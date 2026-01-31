import { useSupabaseData } from '@/contexts/SupabaseDataContext';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, User } from 'lucide-react';

export const RoleSwitcher = () => {
  const { role, setRole, isAdmin } = useSupabaseData();

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
