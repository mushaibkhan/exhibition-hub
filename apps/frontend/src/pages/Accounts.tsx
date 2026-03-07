import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Account } from '@/types/database';
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

const Accounts = () => {
  const { isAdmin, accounts, addAccount, updateAccount, deleteAccount } = useData();
  const { toast } = useToast();
  
  // Safety check
  if (!isAdmin) return <Navigate to="/" replace />;
  
  const safeAccounts = accounts || [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    upi_details: '',
    bank_details: '',
    notes: '',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      upi_details: '',
      bank_details: '',
      notes: '',
      is_active: true,
    });
    setEditingAccount(null);
  };

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        upi_details: account.upi_details || '',
        bank_details: account.bank_details || '',
        notes: account.notes || '',
        is_active: account.is_active,
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

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate required fields
    if (!formData.name?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Account name is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, formData);
        toast({
          title: 'Success',
          description: `Account "${formData.name}" updated successfully`,
        });
      } else {
        await addAccount(formData);
        toast({
          title: 'Success',
          description: `Account "${formData.name}" added successfully`,
        });
      }
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (account: Account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    try {
      await deleteAccount(accountToDelete.id);
      toast({
        title: 'Success',
        description: `Account "${accountToDelete.name}" deleted successfully`,
      });
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout title="Accounts" subtitle="Payment accounts (Admin Only)">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">{safeAccounts.length} accounts configured</span>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Account Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., HDFC Bank, PhonePe, etc."
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upi_details">UPI Details</Label>
                  <Input
                    id="upi_details"
                    value={formData.upi_details}
                    onChange={(e) => setFormData({ ...formData, upi_details: e.target.value })}
                    placeholder="e.g., example@paytm, 9876543210@upi"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_details">Bank Details</Label>
                  <Textarea
                    id="bank_details"
                    value={formData.bank_details}
                    onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
                    placeholder="e.g., Account Number: 1234567890, IFSC: HDFC0001234, Account Holder: John Doe"
                    className="w-full min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes or instructions..."
                    className="w-full min-h-[80px]"
                  />
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
                      {editingAccount ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingAccount ? 'Update Account' : 'Add Account'
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
                  <TableHead>UPI</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No accounts configured. Click "Add Account" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  safeAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{account.upi_details || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{account.bank_details || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={account.is_active ? 'default' : 'secondary'}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground">
                        {account.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(account)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(account)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
          {safeAccounts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No accounts configured. Click "Add Account" to create one.
              </CardContent>
            </Card>
          ) : (
            safeAccounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{account.name}</h3>
                      <Badge variant={account.is_active ? 'default' : 'secondary'} className="mt-1">
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(account)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(account)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {account.upi_details && (
                    <div>
                      <p className="text-sm text-muted-foreground">UPI</p>
                      <p className="text-sm">{account.upi_details}</p>
                    </div>
                  )}
                  {account.bank_details && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Details</p>
                      <p className="text-sm whitespace-pre-wrap">{account.bank_details}</p>
                    </div>
                  )}
                  {account.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="text-sm">{account.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{accountToDelete?.name}"? This action cannot be undone.
                {accountToDelete && (
                  <span className="block mt-2 text-sm text-muted-foreground">
                    Note: Accounts that are used in payments cannot be deleted. You can deactivate them instead.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAccountToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Accounts;
