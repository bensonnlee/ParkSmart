import { Car, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { ParkingSpot } from './types';

interface ParkingStatsProps {
  spots: ParkingSpot[];
}

export function ParkingStats({ spots }: ParkingStatsProps) {
  const available = spots.filter(s => s.status === 'available').length;
  const occupied = spots.filter(s => s.status === 'occupied').length;
  const reserved = spots.filter(s => s.status === 'reserved').length;
  const total = spots.length;
  const occupancyRate = Math.round((occupied / total) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Car className="size-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spots</p>
              <p className="text-2xl font-bold text-gray-800">{total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="size-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{available}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="size-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-red-600">{occupied}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="size-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reserved</p>
              <p className="text-2xl font-bold text-yellow-600">{reserved}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
