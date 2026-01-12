import { Navigate } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/MockDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, User, Users } from 'lucide-react';

const mockUsers = [
  { id: '1', email: 'admin@expo.com', full_name: 'Admin User', role: 'admin', created_at: '2024-01-01' },
  { id: '2', email: 'maintainer1@expo.com', full_name: 'Sanjay Agarwal', role: 'maintainer', created_at: '2024-01-05' },
  { id: '3', email: 'maintainer2@expo.com', full_name: 'Dilip Kumar', role: 'maintainer', created_at: '2024-01-10' },
];

const UsersPage = () => {
  const { isAdmin } = useMockData();
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <MockAppLayout title="Users" subtitle="System users (Admin Only)">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Total</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{mockUsers.length}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Admins</CardTitle><Shield className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{mockUsers.filter(u => u.role === 'admin').length}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Maintainers</CardTitle><User className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{mockUsers.filter(u => u.role === 'maintainer').length}</div></CardContent></Card>
        </div>
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader><TableBody>
          {mockUsers.map((u) => (<TableRow key={u.id}><TableCell className="font-medium">{u.full_name}</TableCell><TableCell>{u.email}</TableCell><TableCell><Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role === 'admin' && <Shield className="mr-1 h-3 w-3" />}{u.role.charAt(0).toUpperCase() + u.role.slice(1)}</Badge></TableCell><TableCell className="text-muted-foreground">{u.created_at}</TableCell></TableRow>))}
        </TableBody></Table></CardContent></Card>
      </div>
    </MockAppLayout>
  );
};

export default UsersPage;
