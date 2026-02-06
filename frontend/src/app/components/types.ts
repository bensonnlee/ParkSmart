export interface ParkingSpot {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'reserved';
  gridPosition: {
    row: number;
    col: number;
  };
  type: 'regular' | 'disabled' | 'ev-charging' | 'compact';
  floor: number;
  section: string;
  hourlyRate?: number;
}
