import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaymentMode, ExpenseCategory, Expense } from '@/types/database';
import { 
  Receipt, Banknote, Smartphone, CreditCard, Download, Loader2, Plus, Edit, Trash2,
  Building2, Sofa, Megaphone, Zap, Users, Folder, FolderPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, formatDateForExport, formatCurrencyForExport } from '@/lib/exportUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const modeColors: Record<PaymentMode, string> = { 
  cash: 'bg-green-100 text-green-800', 
  upi: 'bg-purple-100 text-purple-800', 
  bank: 'bg-blue-100 text-blue-800' 
};
const modeIcons: Record<PaymentMode, React.ElementType> = { 
  cash: Banknote, 
  upi: Smartphone, 
  bank: CreditCard 
};

const categoryLabels: Record<ExpenseCategory, string> = {
  venue: 'Venue',
  furniture: 'Furniture',
  marketing: 'Marketing',
  utilities: 'Utilities',
  staff: 'Staff',
  misc: 'Misc',
};

const categoryIcons: Record<ExpenseCategory, React.ElementType> = {
  venue: Building2,
  furniture: Sofa,
  marketing: Megaphone,
  utilities: Zap,
  staff: Users,
  misc: Folder,
};

const categoryColors: Record<string, string> = {
  venue: 'text-blue-600',
  furniture: 'text-purple-600',
  marketing: 'text-orange-600',
  utilities: 'text-yellow-600',
  staff: 'text-green-600',
  misc: 'text-gray-600',
};

function getCategoryLabel(cat: string): string {
  const key = cat?.toLowerCase();
  return (key && categoryLabels[key as ExpenseCategory]) ?? cat ?? '';
}
function getCategoryIcon(cat: string): React.ElementType {
  const key = cat?.toLowerCase();
  return (key && categoryIcons[key as ExpenseCategory]) ?? Folder;
}

const Expenses = () => {
  const { isAdmin, expenses, accounts, expenseCategories, addExpense, updateExpense, deleteExpense, addExpenseCategory } = useData();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [formData, setFormData] = useState({
    expense_date: '',
    category: 'Misc',
    description: '',
    amount: 0,
    payment_mode: 'cash' as PaymentMode,
    account_id: '',
    notes: '',
  });

  if (!isAdmin) return <Navigate to="/" replace />;

  const filteredExpenses = expenses.filter(e => 
    categoryFilter === 'all' || e.category === categoryFilter
  );

  // Active accounts only (status === 'Active' via is_active)
  const activeAccounts = accounts.filter((a) => a.is_active === true);

  // Filter accounts by payment mode: Bank → bank_details, UPI → upi_details, Cash → none
  const filteredAccountsByMode = (() => {
    switch (formData.payment_mode) {
      case 'bank':
        return activeAccounts.filter((a) => a.bank_details && a.bank_details.trim() !== '');
      case 'upi':
        return activeAccounts.filter((a) => a.upi_details && a.upi_details.trim() !== '');
      case 'cash':
      default:
        return [];
    }
  })();

  const stats = {
    total: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
    byCategory: expenseCategories.reduce((acc, c) => {
      acc[c.name] = expenses.filter(e => e.category === c.name).reduce((s, e) => s + e.amount, 0);
      return acc;
    }, {} as Record<string, number>),
    other: expenses.filter(e => !expenseCategories.some(c => c.name === e.category)).reduce((s, e) => s + e.amount, 0),
  };

  const resetForm = () => {
    const defaultCategory = expenseCategories[0]?.name ?? 'Misc';
    setFormData({
      expense_date: '',
      category: defaultCategory,
      description: '',
      amount: 0,
      payment_mode: 'cash',
      account_id: '',
      notes: '',
    });
    setEditingExpense(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      expense_date: expense.expense_date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      payment_mode: expense.payment_mode,
      account_id: expense.account_id || '',
      notes: expense.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await deleteExpense(expenseToDelete.id);
      toast({
        title: 'Success',
        description: `Expense deleted successfully`,
      });
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete expense. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validation
    if (!formData.expense_date) {
      toast({
        title: 'Validation Error',
        description: 'Expense date is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.description?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Description is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: 'Validation Error',
        description: 'Category is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Amount must be greater than zero.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.payment_mode) {
      toast({
        title: 'Validation Error',
        description: 'Payment mode is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseData = {
        expense_date: formData.expense_date,
        category: formData.category,
        description: formData.description.trim(),
        amount: formData.amount,
        payment_mode: formData.payment_mode,
        account_id: formData.payment_mode === 'cash' ? null : (formData.account_id || null),
        notes: formData.notes || null,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
        toast({
          title: 'Success',
          description: `Expense updated successfully`,
        });
      } else {
        await addExpense(expenseData);
        toast({
          title: 'Success',
          description: `Expense added successfully`,
        });
      }
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save expense. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    if (isExporting || filteredExpenses.length === 0) return;
    setIsExporting(true);
    
    try {
      const exportData = filteredExpenses.map(e => {
        const account = accounts.find(a => a.id === e.account_id);
        const ModeIcon = modeIcons[e.payment_mode];
        
        return {
          'Date': formatDateForExport(e.expense_date),
          'Category': getCategoryLabel(e.category),
          'Description': e.description,
          'Amount': formatCurrencyForExport(e.amount),
          'Payment Mode': e.payment_mode.toUpperCase(),
          'Account': account?.name || '',
          'Notes': e.notes || '',
        };
      });

      exportToExcel(exportData, 'Expenses_Export', 'Expenses');
      toast({ title: 'Success', description: `Exported ${exportData.length} expense(s) to Excel` });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export expenses. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || isAddingCategory) return;
    setIsAddingCategory(true);
    try {
      await addExpenseCategory(name);
      setCategoryFilter(name);
      setAddCategoryOpen(false);
      setNewCategoryName('');
      toast({ title: 'Success', description: `Category "${name}" added. You can use it when adding expenses.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message ?? 'Failed to add category.', variant: 'destructive' });
    } finally {
      setIsAddingCategory(false);
    }
  };

  return (
    <MockAppLayout title="Expenses" subtitle="Track all costs incurred to run the exhibition (Admin Only)">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {expenseCategories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
              <Button variant="outline" size="sm" className="h-10 gap-1.5" onClick={() => { setAddCategoryOpen(true); setNewCategoryName(''); }}>
                <FolderPlus className="h-4 w-4" />
                Add Category
              </Button>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Add expense category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Label htmlFor="new_category">Category name</Label>
                  <Input
                    id="new_category"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Travel, Catering"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddCategoryOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddCategory} disabled={!newCategoryName.trim() || isAddingCategory}>
                    {isAddingCategory ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleExport} disabled={filteredExpenses.length === 0 || isExporting} className="h-10 min-h-[44px]">
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </>
              )}
            </Button>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto h-10 min-h-[44px]">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[600px] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="expense_date">
                    Expense Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Venue rental for event setup"
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      Amount (₹) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_mode">
                      Payment Mode <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.payment_mode}
                      onValueChange={(v) => {
                        const newMode = v as PaymentMode;
                        const nextFiltered =
                          newMode === 'bank'
                            ? activeAccounts.filter((a) => a.bank_details && a.bank_details.trim() !== '')
                            : newMode === 'upi'
                              ? activeAccounts.filter((a) => a.upi_details && a.upi_details.trim() !== '')
                              : [];
                        const keepAccount =
                          newMode !== 'cash' &&
                          formData.account_id &&
                          nextFiltered.some((a) => a.id === formData.account_id);
                        setFormData({
                          ...formData,
                          payment_mode: newMode,
                          account_id: keepAccount ? formData.account_id : '',
                        });
                      }}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(formData.payment_mode === 'bank' || formData.payment_mode === 'upi') && (
                  <div className="space-y-2">
                    <Label htmlFor="account_id">Account (Optional)</Label>
                    <Select
                      value={formData.account_id || 'none'}
                      onValueChange={(v) => setFormData({ ...formData, account_id: v === 'none' ? '' : v })}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {filteredAccountsByMode.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={handleCloseDialog} disabled={isSubmitting} className="w-full sm:w-auto h-10 min-h-[44px]">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto h-10 min-h-[44px]">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingExpense ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingExpense ? 'Update Expense' : 'Add Expense'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{stats.total} expenses</p>
            </CardContent>
          </Card>
          {expenseCategories.map((c) => {
            const Icon = getCategoryIcon(c.name);
            const amount = stats.byCategory[c.name] ?? 0;
            return (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">{c.name}</CardTitle>
                  <Icon className={`h-4 w-4 ${categoryColors[c.name.toLowerCase()] ?? 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{amount.toLocaleString()}</div>
                </CardContent>
              </Card>
            );
          })}
          {stats.other > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Other</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.other.toLocaleString()}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Expenses Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((e) => {
                    const Icon = modeIcons[e.payment_mode];
                    const CategoryIcon = getCategoryIcon(e.category);
                    const account = accounts.find(a => a.id === e.account_id);
                    return (
                      <TableRow key={e.id}>
                        <TableCell>{format(new Date(e.expense_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <CategoryIcon className="h-3 w-3" />
                            {getCategoryLabel(e.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{e.description}</TableCell>
                        <TableCell className="font-semibold">₹{e.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={modeColors[e.payment_mode]}>
                            <Icon className="mr-1 h-3 w-3" />
                            {e.payment_mode.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{account?.name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(e)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog open={deleteDialogOpen && expenseToDelete?.id === e.id} onOpenChange={setDeleteDialogOpen}>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(e)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the expense record.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteConfirm} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3 py-8">
                          <Receipt className="h-12 w-12 text-muted-foreground/50" />
                          <div className="space-y-1">
                            <p className="text-lg font-medium text-muted-foreground">No expenses recorded yet</p>
                            <p className="text-sm text-muted-foreground">
                              {categoryFilter === 'all' 
                                ? 'Click "Add Expense" to record your first expense.'
                                : `No expenses found in the ${getCategoryLabel(categoryFilter)} category.`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MockAppLayout>
  );
};

export default Expenses;
