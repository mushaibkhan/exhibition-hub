import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useMockData } from '@/contexts/SupabaseDataContext';
import { useExhibition } from '@/contexts/ExhibitionContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Edit, Trash2, Loader2, Calendar, Building2 } from 'lucide-react';
import { Exhibition } from '@/contexts/ExhibitionContext';
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
import { format } from 'date-fns';

const SettingsPage = () => {
  const { isAdmin, addExhibition, updateExhibition, deleteExhibition } = useMockData();
  const { exhibitions, isLoading: exhibitionsLoading } = useExhibition();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exhibitionToDelete, setExhibitionToDelete] = useState<Exhibition | null>(null);
  const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  if (!isAdmin) return <Navigate to="/" replace />;

  const resetForm = () => {
    setFormData({
      name: '',
      short_name: '',
      description: '',
      start_date: '',
      end_date: '',
    });
    setEditingExhibition(null);
  };

  const handleOpenDialog = (exhibition?: Exhibition) => {
    if (exhibition) {
      setEditingExhibition(exhibition);
      setFormData({
        name: exhibition.name,
        short_name: exhibition.shortName,
        description: exhibition.description || '',
        start_date: exhibition.startDate,
        end_date: exhibition.endDate,
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
        description: 'Exhibition name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.short_name?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Short name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.start_date) {
      toast({
        title: 'Validation Error',
        description: 'Start date is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.end_date) {
      toast({
        title: 'Validation Error',
        description: 'End date is required.',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast({
        title: 'Validation Error',
        description: 'End date must be after start date.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExhibition) {
        await updateExhibition(editingExhibition.id, {
          name: formData.name,
          short_name: formData.short_name,
          description: formData.description || null,
          start_date: formData.start_date,
          end_date: formData.end_date,
        });
        toast({
          title: 'Success',
          description: `Exhibition "${formData.name}" updated successfully`,
        });
      } else {
        await addExhibition({
          name: formData.name,
          short_name: formData.short_name,
          description: formData.description || null,
          start_date: formData.start_date,
          end_date: formData.end_date,
        });
        toast({
          title: 'Success',
          description: `Exhibition "${formData.name}" created successfully`,
        });
      }
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save exhibition. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (exhibition: Exhibition) => {
    setExhibitionToDelete(exhibition);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!exhibitionToDelete) return;

    try {
      await deleteExhibition(exhibitionToDelete.id);
      toast({
        title: 'Success',
        description: `Exhibition "${exhibitionToDelete.name}" deleted successfully`,
      });
      setDeleteDialogOpen(false);
      setExhibitionToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete exhibition. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (exhibitionsLoading) {
    return (
      <MockAppLayout title="Settings" subtitle="Manage Exhibitions (Admin Only)">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MockAppLayout>
    );
  }

  return (
    <MockAppLayout title="Settings" subtitle="Manage Exhibitions (Admin Only)">
      <div className="space-y-6">
        {/* Add Exhibition Button */}
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Exhibition
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingExhibition ? 'Edit Exhibition' : 'Add New Exhibition'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Exhibition Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Business - Kings Crown"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="short_name">
                    Short Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="short_name"
                    value={formData.short_name}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                    placeholder="e.g., KC Business"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the exhibition..."
                    className="w-full min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">
                      End Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full"
                    />
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
                      {editingExhibition ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingExhibition ? 'Update Exhibition' : 'Create Exhibition'
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
                  <TableHead>Short Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exhibitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No exhibitions found. Click "Add Exhibition" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  exhibitions.map((exhibition) => {
                    const startDate = new Date(exhibition.startDate);
                    const endDate = new Date(exhibition.endDate);
                    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    
                    return (
                      <TableRow key={exhibition.id}>
                        <TableCell className="font-medium">{exhibition.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{exhibition.shortName}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {exhibition.description || '-'}
                        </TableCell>
                        <TableCell>{format(startDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(endDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{duration} day{duration !== 1 ? 's' : ''}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(exhibition)}
                              className="h-8 w-8"
                              title="Edit Exhibition"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(exhibition)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Delete Exhibition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {exhibitions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No exhibitions found. Click "Add Exhibition" to create one.
              </CardContent>
            </Card>
          ) : (
            exhibitions.map((exhibition) => {
              const startDate = new Date(exhibition.startDate);
              const endDate = new Date(exhibition.endDate);
              const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              
              return (
                <Card key={exhibition.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{exhibition.name}</h3>
                        <Badge variant="outline" className="mt-1">{exhibition.shortName}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(exhibition)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(exhibition)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {exhibition.description && (
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="text-sm">{exhibition.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="text-sm font-medium">{format(startDate, 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="text-sm font-medium">{format(endDate, 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium">{duration} day{duration !== 1 ? 's' : ''}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Exhibition</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{exhibitionToDelete?.name}"? 
                This action cannot be undone.
                {exhibitionToDelete && (
                  <span className="block mt-2 text-sm text-muted-foreground">
                    Note: Exhibitions with stalls cannot be deleted. Delete all stalls first.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setExhibitionToDelete(null)}>Cancel</AlertDialogCancel>
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
    </MockAppLayout>
  );
};

export default SettingsPage;
