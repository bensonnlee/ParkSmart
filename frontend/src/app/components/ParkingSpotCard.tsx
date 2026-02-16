import { MapPin, DollarSign, Zap, CircleParking } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent } from '@/app/components/ui/card';
import { ParkingSpot } from './types';

interface ParkingSpotCardProps {
  spot: ParkingSpot;
  onClick: () => void;
  isSelected: boolean;
}

export function ParkingSpotCard({ spot, onClick, isSelected }: ParkingSpotCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-red-500';
      case 'reserved':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'available':
        return 'default';
      case 'occupied':
        return 'destructive';
      case 'reserved':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ev-charging':
        return <Zap className="size-4" />;
      case 'disabled':
        return <CircleParking className="size-4" />;
      default:
        return <MapPin className="size-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ev-charging':
        return 'EV Charging';
      case 'disabled':
        return 'Accessible';
      case 'compact':
        return 'Compact';
      default:
        return 'Regular';
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`size-3 rounded-full ${getStatusColor(spot.status)}`}></div>
            <h3 className="font-semibold text-lg">Spot {spot.number}</h3>
          </div>
          <Badge variant={getStatusBadgeVariant(spot.status)}>
            {spot.status.charAt(0).toUpperCase() + spot.status.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            {getTypeIcon(spot.type)}
            <span>{getTypeLabel(spot.type)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="size-4" />
            <span>Section {spot.section} - Floor {spot.floor}</span>
          </div>

          {spot.hourlyRate && (
            <div className="flex items-center gap-2">
              <DollarSign className="size-4" />
              <span>${spot.hourlyRate}/hour</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
