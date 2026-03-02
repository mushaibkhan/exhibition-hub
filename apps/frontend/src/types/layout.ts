export type CellType = 'STALL' | 'AISLE' | 'BLOCKED' | 'EMPTY';

export interface Hall {
  id: string;
  name: string;
  rows: number;
  columns: number;
  grid: CellType[][];
}

export interface Stall {
  id: string;
  stall_number: string;
  hall_id: string;
  position: { x: number; y: number };
  span: { w: number; h: number };
  size: string;
  base_rent: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'BLOCKED';
}
