import { Hall, CellType } from '@/types/layout';
import { Stall, StallStatus } from '@/types/database';

/**
 * Convert existing stalls to Hall grid model
 */
export function stallsToHalls(stalls: Stall[]): Hall[] {
  // Group stalls by zone (hall)
  const hallsMap = new Map<string, Stall[]>();
  
  stalls.forEach(stall => {
    const zone = stall.zone || 'Hall A';
    if (!hallsMap.has(zone)) {
      hallsMap.set(zone, []);
    }
    hallsMap.get(zone)!.push(stall);
  });

  const halls: Hall[] = [];

  hallsMap.forEach((hallStalls, zoneName) => {
    // Calculate grid dimensions based on stall positions
    let maxX = 0;
    let maxY = 0;

    hallStalls.forEach(stall => {
      const endX = stall.position_x + stall.width;
      const endY = stall.position_y + stall.height;
      if (endX > maxX) maxX = endX;
      if (endY > maxY) maxY = endY;
    });

    // Default to 5x6 if no stalls or small dimensions
    const columns = Math.max(maxX, 5);
    const rows = Math.max(maxY, 6);

    // Initialize grid with EMPTY
    const grid: CellType[][] = Array(rows)
      .fill(null)
      .map(() => Array(columns).fill('EMPTY' as CellType));

    // Mark stall positions
    hallStalls.forEach(stall => {
      for (let y = stall.position_y; y < stall.position_y + stall.height; y++) {
        for (let x = stall.position_x; x < stall.position_x + stall.width; x++) {
          if (y < rows && x < columns) {
            if (stall.status === 'blocked') {
              grid[y][x] = 'BLOCKED';
            } else {
              grid[y][x] = 'STALL';
            }
          }
        }
      }
    });

    // Add aisles (simple pattern: every 3rd column as aisle)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        if (x > 0 && x % 3 === 0 && grid[y][x] === 'EMPTY') {
          grid[y][x] = 'AISLE';
        }
      }
    }

    halls.push({
      id: zoneName.toLowerCase().replace(/\s+/g, '-'),
      name: zoneName,
      rows,
      columns,
      grid,
    });
  });

  // Ensure at least Hall A and Hall B exist
  if (!halls.find(h => h.name === 'Hall A')) {
    halls.push({
      id: 'hall-a',
      name: 'Hall A',
      rows: 6,
      columns: 5,
      grid: Array(6).fill(null).map(() => Array(5).fill('EMPTY' as CellType)),
    });
  }

  if (!halls.find(h => h.name === 'Hall B')) {
    halls.push({
      id: 'hall-b',
      name: 'Hall B',
      rows: 6,
      columns: 5,
      grid: Array(6).fill(null).map(() => Array(5).fill('EMPTY' as CellType)),
    });
  }

  return halls;
}

/**
 * Convert Hall grid model back to stalls
 * This is a simplified conversion - in a real app, you'd need more sophisticated logic
 */
export function hallsToStalls(halls: Hall[], existingStalls: Stall[]): Stall[] {
  const newStalls: Stall[] = [];
  let stallCounter = 1;

  halls.forEach(hall => {
    const hallStalls = existingStalls.filter(s => s.zone === hall.name);
    const stallMap = new Map<string, Stall>();

    // Create a map of existing stalls by position
    hallStalls.forEach(stall => {
      const key = `${stall.position_x},${stall.position_y}`;
      stallMap.set(key, stall);
    });

    // Scan grid for STALL cells and group them into contiguous regions
    const visited = new Set<string>();
    const stallRegions: Array<{ x: number; y: number; w: number; h: number }> = [];

    for (let y = 0; y < hall.rows; y++) {
      for (let x = 0; x < hall.columns; x++) {
        if (hall.grid[y][x] === 'STALL' && !visited.has(`${x},${y}`)) {
          // Find contiguous STALL cells
          const region = findContiguousRegion(hall.grid, x, y, 'STALL', hall.rows, hall.columns);
          
          // Mark as visited
          region.forEach(pos => visited.add(`${pos.x},${pos.y}`));

          if (region.length > 0) {
            const minX = Math.min(...region.map(p => p.x));
            const minY = Math.min(...region.map(p => p.y));
            const maxX = Math.max(...region.map(p => p.x));
            const maxY = Math.max(...region.map(p => p.y));
            
            stallRegions.push({
              x: minX,
              y: minY,
              w: maxX - minX + 1,
              h: maxY - minY + 1,
            });
          }
        }
      }
    }

    // Convert regions to stalls
    stallRegions.forEach((region, idx) => {
      const key = `${region.x},${region.y}`;
      const existing = stallMap.get(key);
      
      const size = `${region.w * 3}x${region.h * 3}`;
      const baseRent = calculateBaseRent(region.w, region.h);

      if (existing) {
        // Update existing stall
        newStalls.push({
          ...existing,
          position_x: region.x,
          position_y: region.y,
          width: region.w,
          height: region.h,
          size,
          base_rent: baseRent,
        });
      } else {
        // Create new stall
        const stallNumber = hall.name === 'Hall A' ? `A${stallCounter}` : `B${stallCounter}`;
        newStalls.push({
          id: `stall-${Date.now()}-${idx}`,
          stall_number: stallNumber,
          size,
          zone: hall.name,
          base_rent: baseRent,
          status: 'available' as StallStatus,
          notes: null,
          position_x: region.x,
          position_y: region.y,
          width: region.w,
          height: region.h,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        stallCounter++;
      }
    });
  });

  return newStalls;
}

function findContiguousRegion(
  grid: CellType[][],
  startX: number,
  startY: number,
  targetType: CellType,
  maxRows: number,
  maxCols: number
): Array<{ x: number; y: number }> {
  const region: Array<{ x: number; y: number }> = [];
  const visited = new Set<string>();
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (x < 0 || x >= maxCols || y < 0 || y >= maxRows) continue;
    if (grid[y][x] !== targetType) continue;

    visited.add(key);
    region.push({ x, y });

    // Check neighbors
    queue.push({ x: x + 1, y });
    queue.push({ x: x - 1, y });
    queue.push({ x, y: y + 1 });
    queue.push({ x, y: y - 1 });
  }

  return region;
}

function calculateBaseRent(width: number, height: number): number {
  const basePrice = 25000;
  const area = width * height;
  return basePrice * area;
}
