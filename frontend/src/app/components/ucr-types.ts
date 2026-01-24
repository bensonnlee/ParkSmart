export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  openSpaces: number;
  totalSpaces: number;
  occupancyRate: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  permitTypes?: string[];
  hasEVCharging?: boolean;
}

export interface CampusLocation {
  id: string;
  name: string;
  category: 'academic' | 'administrative' | 'recreation' | 'housing' | 'dining';
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface ParkingRecommendation {
  lot: ParkingLot;
  score: number;
  distance: number; // in miles
  walkingTime: number; // in minutes
  reason: string;
}