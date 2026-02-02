import { X, Navigation, Clock, MapPin, Car } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';

interface MapTooltipProps {
  lotName: string;
  available: number;
  total: number;
  walkTime: number;
  distance: string;
  cost: string;
  entry: string;
  status: 'available' | 'limited' | 'full';
  onClose: () => void;
  onStartRoute: () => void;
}

export function MapTooltip({
  lotName,
  available,
  total,
  walkTime,
  distance,
  cost,
  entry,
  status,
  onClose,
  onStartRoute,
}: MapTooltipProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'limited':
        return 'bg-yellow-500';
      case 'full':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'limited':
        return 'Limited Availability';
      case 'full':
        return 'Full';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="w-80 shadow-xl border-2 border-ucr-blue rounded-xl" style={{ borderRadius: '12px' }}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">{lotName}</h3>
            <div className="flex items-center gap-2">
              <span className={`${getStatusColor()} size-2 rounded-full`} />
              <span className="text-xs text-gray-600">{getStatusLabel()}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-8 p-0 rounded-lg"
            style={{ borderRadius: '8px' }}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center bg-gray-50 rounded-lg p-2" style={{ borderRadius: '8px' }}>
            <div className="flex items-center justify-center mb-1">
              <Clock className="size-4 text-ucr-blue" />
            </div>
            <p className="text-xs text-gray-600">Walk Time</p>
            <p className="text-sm font-bold text-gray-900">{walkTime} min</p>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-2" style={{ borderRadius: '8px' }}>
            <div className="flex items-center justify-center mb-1">
              <Navigation className="size-4 text-ucr-blue" />
            </div>
            <p className="text-xs text-gray-600">Distance</p>
            <p className="text-sm font-bold text-gray-900">{distance}</p>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-2" style={{ borderRadius: '8px' }}>
            <div className="flex items-center justify-center mb-1">
              <Car className="size-4 text-ucr-blue" />
            </div>
            <p className="text-xs text-gray-600">Cost</p>
            <p className="text-sm font-bold text-gray-900">{cost}</p>
          </div>
        </div>

        {/* Availability Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Availability</span>
            <span>
              {available} / {total} spots
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`${getStatusColor()} h-2.5 rounded-full transition-all`}
              style={{ width: `${(available / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Entry Info */}
        <div className="mb-3 bg-gray-50 p-3 rounded-lg" style={{ borderRadius: '10px' }}>
          <div className="flex items-start gap-2">
            <MapPin className="size-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-700">Entry Point</p>
              <p className="text-xs text-gray-600">{entry}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          className="w-full bg-ucr-blue hover:bg-ucr-blue-dark rounded-xl"
          onClick={onStartRoute}
          style={{ borderRadius: '10px' }}
        >
          🅿️ Park Here & Start Route
        </Button>
      </CardContent>
    </Card>
  );
}