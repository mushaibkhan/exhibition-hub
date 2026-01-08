import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Users = () => {
  return (
    <AppLayout title="Users" subtitle="Manage system users">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage system users and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">User management page is under development.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Users;

