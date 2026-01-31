import { useMemo, useState } from 'react';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { useSupabaseData } from '@/contexts/SupabaseDataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Save, RotateCcw } from 'lucide-react';
import type { Stall } from '@/types/database';

interface DraftValues {
  base_rent: string;
  notes: string;
}

const StallPrices = () => {
  const { stalls, isAdmin, updateStall } = useSupabaseData();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [drafts, setDrafts] = useState<Record<string, DraftValues>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [savingAll, setSavingAll] = useState(false);

  const zones = useMemo(() => {
    const unique = new Set<string>();
    stalls.forEach((stall) => {
      if (stall.zone) unique.add(stall.zone);
    });
    return Array.from(unique).sort();
  }, [stalls]);

  const filteredStalls = useMemo(() => {
    const lower = search.toLowerCase();
    return stalls.filter((stall) => {
      const matchesSearch = stall.stall_number.toLowerCase().includes(lower) || (stall.zone || '').toLowerCase().includes(lower);
      const matchesZone = zoneFilter === 'all' || stall.zone === zoneFilter;
      return matchesSearch && matchesZone;
    });
  }, [stalls, search, zoneFilter]);

  const getDraft = (stall: Stall): DraftValues => {
    return drafts[stall.id] ?? { base_rent: String(stall.base_rent ?? 0), notes: stall.notes ?? '' };
  };

  const isDirty = (stall: Stall) => {
    const draft = drafts[stall.id];
    if (!draft) return false;
    const baseRentValue = Number(draft.base_rent);
    const notesValue = draft.notes ?? '';
    return baseRentValue !== (stall.base_rent ?? 0) || notesValue !== (stall.notes ?? '');
  };

  const updateDraft = (stall: Stall, updates: Partial<DraftValues>) => {
    const current = getDraft(stall);
    setDrafts((prev) => ({
      ...prev,
      [stall.id]: { ...current, ...updates },
    }));
  };

  const validateDraft = (stall: Stall) => {
    const draft = getDraft(stall);
    const baseRentValue = Number(draft.base_rent);
    if (!Number.isFinite(baseRentValue) || baseRentValue < 0) {
      toast({
        title: 'Invalid base rent',
        description: `Enter a valid amount for stall ${stall.stall_number}.`,
        variant: 'destructive',
      });
      return null;
    }

    return {
      base_rent: baseRentValue,
      notes: draft.notes?.trim() || null,
    } as Partial<Stall>;
  };

  const handleSave = async (stall: Stall) => {
    if (!isDirty(stall)) {
      toast({ title: 'No changes', description: 'This stall has no updates to save.' });
      return;
    }

    const updates = validateDraft(stall);
    if (!updates) return;

    setSavingIds((prev) => ({ ...prev, [stall.id]: true }));
    try {
      await updateStall(stall.id, updates);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[stall.id];
        return next;
      });
      toast({ title: 'Saved', description: `Updated stall ${stall.stall_number}.` });
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error?.message || 'Failed to update stall. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingIds((prev) => ({ ...prev, [stall.id]: false }));
    }
  };

  const handleReset = (stall: Stall) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[stall.id];
      return next;
    });
  };

  const handleSaveAll = async () => {
    const dirtyStalls = filteredStalls.filter(isDirty);
    if (dirtyStalls.length === 0) {
      toast({ title: 'No changes', description: 'There are no edited stalls to save.' });
      return;
    }

    setSavingAll(true);
    try {
      for (const stall of dirtyStalls) {
        const updates = validateDraft(stall);
        if (!updates) {
          setSavingAll(false);
          return;
        }
        await updateStall(stall.id, updates);
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[stall.id];
          return next;
        });
      }
      toast({ title: 'Saved', description: `Updated ${dirtyStalls.length} stall(s).` });
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error?.message || 'Failed to update stalls. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingAll(false);
    }
  };

  if (!isAdmin) {
    return (
      <MockAppLayout title="Stall Prices" subtitle="Update stall pricing">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You do not have permission to edit stall prices.
          </CardContent>
        </Card>
      </MockAppLayout>
    );
  }

  const editedCount = filteredStalls.filter(isDirty).length;

  return (
    <MockAppLayout title="Stall Prices" subtitle="Edit base rent and notes per stall">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search stall number or zone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="All zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All zones</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="default"
            onClick={handleSaveAll}
            disabled={savingAll || editedCount === 0}
            className="h-10 min-h-[44px]"
          >
            <Save className="mr-2 h-4 w-4" />
            {savingAll ? 'Saving...' : `Save all (${editedCount})`}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stall No.</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Base Rent</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStalls.map((stall) => {
                    const draft = getDraft(stall);
                    const dirty = isDirty(stall);
                    return (
                      <TableRow key={stall.id}>
                        <TableCell className="font-medium">{stall.stall_number}</TableCell>
                        <TableCell>{stall.zone || '—'}</TableCell>
                        <TableCell className="w-[180px]">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              value={draft.base_rent}
                              onChange={(e) => updateDraft(stall, { base_rent: e.target.value })}
                              className="h-9"
                            />
                            {dirty && <Badge variant="outline">Edited</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[220px]">
                          <Input
                            placeholder="Add notes (optional)"
                            value={draft.notes}
                            onChange={(e) => updateDraft(stall, { notes: e.target.value })}
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReset(stall)}
                              disabled={!dirty}
                            >
                              <RotateCcw className="mr-1 h-4 w-4" />
                              Reset
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSave(stall)}
                              disabled={!dirty || savingIds[stall.id]}
                            >
                              <Save className="mr-1 h-4 w-4" />
                              {savingIds[stall.id] ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredStalls.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-56 text-center text-muted-foreground">
                        No stalls match your search.
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

export default StallPrices;
