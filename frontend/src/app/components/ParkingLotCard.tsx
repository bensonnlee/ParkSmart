import { MapPin, Car, TrendingUp, Clock, Navigation2, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { ParkingLot } from './ucr-types';

interface ParkingLotCardProps {
  lot: ParkingLot;
  distance?: number;
  walkingTime?: number;
  isRecommended?: boolean;
  isPredicted?: boolean;
  onClick?: () => void;
}

export function ParkingLotCard({
  lot,
  distance,
  walkingTime,
  isRecommended,
  isPredicted,
  onClick,
}: ParkingLotCardProps) {
  const getOccupancyColor = (rate: number) => {
    if (rate < 30) return 'text-green-600';
    if (rate < 70) return 'text-ucr-gold-dark';
    return 'text-red-600';
  };

  const getAvailabilityStatus = (openSpaces: number) => {
    if (openSpaces === 0) return { label: 'Full', variant: 'destructive' as const };
    if (openSpaces < 50) return { label: 'Limited', variant: 'secondary' as const };
    return { label: 'Available', variant: 'default' as const };
  };

  const status = getAvailabilityStatus(lot.openSpaces);

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isRecommended ? 'ring-2 ring-ucr-blue bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {lot.name}
              {isRecommended && (
                <Badge className="bg-ucr-blue hover:bg-ucr-blue-dark">Recommended</Badge>
              )}
              {isPredicted && (
                <Badge variant="outline" className="border-ucr-gold text-ucr-gold-dark">
                  Predicted
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{lot.address}</p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Availability */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Car className="size-4 text-ucr-blue" />
              <span className="text-sm font-medium">
                {lot.openSpaces > 0 ? (
                  <>
                    <span className="text-2xl font-bold text-green-600">
                      {lot.openSpaces}
                    </span>
                    <span className="text-gray-600"> / {lot.totalSpaces} spots</span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-red-600">
                    Data Unavailable
                  </span>
                )}
              </span>
            </div>
          </div>
          {lot.totalSpaces > 0 && (
            <>
              <Progress value={(lot.openSpaces / lot.totalSpaces) * 100} className="h-2" />
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="size-4 text-gray-500" />
                <span className={`text-sm font-semibold ${getOccupancyColor(lot.occupancyRate)}`}>
                  {lot.occupancyRate}% Occupied
                </span>
              </div>
            </>
          )}
        </div>

        {/* Distance and Walking Time */}
        {distance !== undefined && walkingTime !== undefined && (
          <div className="flex items-center gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Navigation2 className="size-4 text-ucr-blue" />
              <span className="text-sm">
                <span className="font-semibold">{distance.toFixed(2)}</span> mi
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-ucr-blue" />
              <span className="text-sm">
                <span className="font-semibold">{walkingTime}</span> min walk
              </span>
            </div>
          </div>
        )}

        {/* Permit Types */}
        {lot.permitTypes && lot.permitTypes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {lot.permitTypes.map((permit) => (
              <Badge key={permit} variant="outline" className="text-xs border-ucr-blue text-ucr-blue">
                {permit}
              </Badge>
            ))}
            {lot.hasEVCharging && (
              <Badge variant="outline" className="text-xs border-green-600 text-green-600">
                <Zap className="size-3 mr-1" />
                EV Charging
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}