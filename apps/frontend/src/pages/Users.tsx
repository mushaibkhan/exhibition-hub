import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, User, Users, Plus, Edit, Trash2, Loader2, Key, CheckCircle2, XCircle } from 'lucide-react';
import { Profile, AppRole } from '@/types/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

const UsersPage = () => {
  const { isAdmin, profiles, userRoles, createUser, updateUser, updateUserPassword, deactivateUser, activateUser, assignUserRole, removeUserRole } = useData();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [userForPassword, setUserForPassword] = useState<Profile | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    roles: [] as AppRole[],
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  if (!isAdmin) return <Navigate to="/" replace />;

  // Combine profiles with roles
  const usersWithRoles = useMemo(() => {
    return profiles.map(profile => {
      const roles = userRoles
        .filter(ur => ur.user_id === profile.id)
        .map(ur => ur.role);
      return { ...profile, roles };
    });
  }, [profiles, userRoles]);

  const stats = useMemo(() => {
    const total = usersWithRoles.length;
    const admins = usersWithRoles.filter(u => u.roles.includes('admin')).length;
    const maintainers = usersWithRoles.filter(u => u.roles.includes('maintainer')).length;
    const active = usersWithRoles.filter(u => u.is_active).length;
    return { total, admins, maintainers, active };
  }, [usersWithRoles]);

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      roles: [],
    });
    setEditingUser(null);
  };

  const handleOpenDialog = (user?: Profile & { roles?: AppRole[] }) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email || '',
        password: '', // Don't show password
        full_name: user.full_name || '',
        phone: user.phone || '',
        roles: user.roles || [],
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleOpenPasswordDialog = (user: Profile) => {
    setUserForPassword(user);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setPasswordDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate required fields
    if (!formData.email?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.full_name?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Full name is required.',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    // For new users, password is required
    if (!editingUser && !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Password is required for new users.',
        variant: 'destructive',
      });
      return;
    }

    // Password validation for new users
    if (!editingUser && formData.password.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Update existing user
        await updateUser(editingUser.id, {
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || null,
        });

        // Update roles
        const currentRoles = userRoles
          .filter(ur => ur.user_id === editingUser.id)
          .map(ur => ur.role);
        
        // Remove roles that are no longer selected
        for (const role of currentRoles) {
          if (!formData.roles.includes(role)) {
            await removeUserRole(editingUser.id, role);
          }
        }

        // Add new roles
        for (const role of formData.roles) {
          if (!currentRoles.includes(role)) {
            await assignUserRole(editingUser.id, role);
          }
        }

        toast({
          title: 'Success',
          description: `User "${formData.full_name}" updated successfully`,
        });
      } else {
        // Create new user
        await createUser({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone || undefined,
          roles: formData.roles.length > 0 ? formData.roles : undefined,
        });

        toast({
          title: 'Success',
          description: `User "${formData.full_name}" created successfully`,
        });
      }
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!userForPassword) return;

    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserPassword(userForPassword.id, passwordData.newPassword);
      toast({
        title: 'Success',
        description: `Password updated successfully for "${userForPassword.full_name || userForPassword.email}"`,
      });
      setPasswordDialogOpen(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!userToDelete) return;

    try {
      await deactivateUser(userToDelete.id);
      toast({
        title: 'Success',
        description: `User "${userToDelete.full_name || userToDelete.email}" deactivated successfully`,
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to deactivate user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      await activateUser(userId);
      toast({
        title: 'Success',
        description: 'User activated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to activate user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const toggleRole = async (userId: string, role: AppRole, currentRoles: AppRole[]) => {
    try {
      if (currentRoles.includes(role)) {
        await removeUserRole(userId, role);
        toast({
          title: 'Success',
          description: `${role} role removed`,
        });
      } else {
        await assignUserRole(userId, role);
        toast({
          title: 'Success',
          description: `${role} role assigned`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <MockAppLayout title="Users" subtitle="System users (Admin Only)">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">{stats.admins}</p>
                </div>
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Maintainers</p>
                  <p className="text-2xl font-bold">{stats.maintainers}</p>
                </div>
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add User Button */}
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full"
                    disabled={!!editingUser} // Email cannot be changed
                  />
                  {editingUser && (
                    <p className="text-xs text-muted-foreground">Email cannot be changed after user creation</p>
                  )}
                </div>
                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="w-full"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Roles</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="role-admin"
                        checked={formData.roles.includes('admin')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, roles: [...formData.roles, 'admin'] });
                          } else {
                            setFormData({ ...formData, roles: formData.roles.filter(r => r !== 'admin') });
                          }
                        }}
                      />
                      <Label htmlFor="role-admin" className="font-normal cursor-pointer">
                        Admin
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="role-maintainer"
                        checked={formData.roles.includes('maintainer')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, roles: [...formData.roles, 'maintainer'] });
                          } else {
                            setFormData({ ...formData, roles: formData.roles.filter(r => r !== 'maintainer') });
                          }
                        }}
                      />
                      <Label htmlFor="role-maintainer" className="font-normal cursor-pointer">
                        Maintainer
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingUser ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingUser ? 'Update User' : 'Create User'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Desktop Table View */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found. Click "Add User" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  usersWithRoles.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.length === 0 ? (
                            <Badge variant="outline">No Role</Badge>
                          ) : (
                            user.roles.map((role) => (
                              <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                                {role === 'admin' && <Shield className="mr-1 h-3 w-3" />}
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(user)}
                            className="h-8 w-8"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenPasswordDialog(user)}
                            className="h-8 w-8"
                            title="Change Password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          {user.is_active ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setUserToDelete(user)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Deactivate User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleActivate(user.id)}
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                              title="Activate User"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {usersWithRoles.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No users found. Click "Add User" to create one.
              </CardContent>
            </Card>
          ) : (
            usersWithRoles.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{user.full_name || 'No Name'}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      )}
                    </div>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Roles</p>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.length === 0 ? (
                        <Badge variant="outline">No Role</Badge>
                      ) : (
                        user.roles.map((role) => (
                          <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(user)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPasswordDialog(user)}
                      className="flex-1"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Password
                    </Button>
                    {user.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserToDelete(user)}
                        className="flex-1 text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivate(user.id)}
                        className="flex-1 text-green-600"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Activate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Password Change Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  New Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full"
                />
              </div>
        </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deactivate Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to deactivate "{userToDelete?.full_name || userToDelete?.email}"? 
                The user will not be able to access the system, but their data will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeactivate}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MockAppLayout>
  );
};

export default UsersPage;
