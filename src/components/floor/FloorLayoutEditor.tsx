import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hall, CellType } from '@/types/layout';
import { cn } from '@/lib/utils';
import { Save, X, Grid3x3 } from 'lucide-react';

interface FloorLayoutEditorProps {
  halls: Hall[];
  onSave: (halls: Hall[]) => void;
  onCancel: () => void;
}

const cellTypeColors: Record<CellType, string> = {
  STALL: 'bg-blue-200 border-blue-400 hover:bg-blue-300',
  AISLE: 'bg-gray-100 border-gray-300 hover:bg-gray-200',
  BLOCKED: 'bg-red-200 border-red-400 hover:bg-red-300',
  EMPTY: 'bg-white border-gray-200 hover:bg-gray-50',
};

const cellTypeLabels: Record<CellType, string> = {
  STALL: 'Stall',
  AISLE: 'Aisle',
  BLOCKED: 'Blocked',
  EMPTY: 'Empty',
};

export const FloorLayoutEditor = ({ halls, onSave, onCancel }: FloorLayoutEditorProps) => {
  const [editedHalls, setEditedHalls] = useState<Hall[]>(halls);
  const [selectedCellType, setSelectedCellType] = useState<CellType>('STALL');
  const [selectedHall, setSelectedHall] = useState<string>(halls[0]?.id || '');

  const currentHall = editedHalls.find(h => h.id === selectedHall);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!currentHall) return;

    setEditedHalls(prev => prev.map(hall => {
      if (hall.id !== selectedHall) return hall;

      const newGrid = hall.grid.map((r, rIdx) =>
        r.map((cell, cIdx) => {
          if (rIdx === row && cIdx === col) {
            return selectedCellType;
          }
          return cell;
        })
      );

      return {
        ...hall,
        grid: newGrid,
      };
    }));
  }, [selectedHall, selectedCellType, currentHall]);

  const handleSave = () => {
    onSave(editedHalls);
  };

  if (!currentHall) {
    return <div>No hall selected</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Edit Layout</span>
          </div>
          
          <Select value={selectedHall} onValueChange={setSelectedHall}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {editedHalls.map(hall => (
                <SelectItem key={hall.id} value={hall.id}>
                  {hall.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Cell Type:</span>
            <Select value={selectedCellType} onValueChange={(v) => setSelectedCellType(v as CellType)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(cellTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Layout
          </Button>
        </div>
      </div>

      {/* Grid Editor */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{currentHall.name}</h3>
          <p className="text-sm text-muted-foreground">
            Grid: {currentHall.columns} × {currentHall.rows} | Click cells to change type
          </p>
        </div>

        {/* Column Headers */}
        <div className="mb-2 flex">
          <div className="w-12"></div>
          <div className="flex flex-1 gap-1">
            {Array.from({ length: currentHall.columns }, (_, i) => (
              <div
                key={i}
                className="flex h-8 w-full items-center justify-center border-b text-xs font-medium text-muted-foreground"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex">
          {/* Row Headers */}
          <div className="flex flex-col gap-1">
            {Array.from({ length: currentHall.rows }, (_, i) => (
              <div
                key={i}
                className="flex h-12 w-12 items-center justify-center border-r text-xs font-medium text-muted-foreground"
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="flex-1">
            {currentHall.grid.map((row, rowIdx) => (
              <div key={rowIdx} className="flex gap-1 mb-1">
                {row.map((cell, colIdx) => (
                  <button
                    key={`${rowIdx}-${colIdx}`}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                    className={cn(
                      'h-12 w-full rounded border-2 transition-colors',
                      cellTypeColors[cell],
                      'hover:ring-2 hover:ring-primary hover:ring-offset-1'
                    )}
                    title={`${cellTypeLabels[cell]} - Click to change to ${cellTypeLabels[selectedCellType]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 rounded-lg bg-muted/50 p-4">
          {Object.entries(cellTypeLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={cn('h-6 w-6 rounded border-2', cellTypeColors[type as CellType])} />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
