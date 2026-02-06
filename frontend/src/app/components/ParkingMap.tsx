import { MapPin } from 'lucide-react';
import { ParkingSpot } from './types';

interface ParkingMapProps {
  spots: ParkingSpot[];
  onSpotClick: (spot: ParkingSpot) => void;
  selectedSpot: ParkingSpot | null;
}

export function ParkingMap({ spots, onSpotClick, selectedSpot }: ParkingMapProps) {
  const getSpotColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600';
      case 'occupied':
        return 'bg-red-500 hover:bg-red-600';
      case 'reserved':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-400';
    }
  };

  const getSpotPosition = (spot: ParkingSpot) => {
    return {
      gridColumn: spot.gridPosition.col,
      gridRow: spot.gridPosition.row,
    };
  };

  return (
    <div className="bg-gray-100 rounded-lg p-6 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="size-5 text-gray-700" />
        <h2 className="text-xl font-semibold text-gray-800">Parking Lot - Level 1</h2>
      </div>
      
      <div 
        className="grid gap-2 bg-white p-4 rounded-md"
        style={{
          gridTemplateColumns: 'repeat(10, 1fr)',
          gridTemplateRows: 'repeat(6, 60px)',
        }}
      >
        {spots.map((spot) => (
          <button
            key={spot.id}
            onClick={() => onSpotClick(spot)}
            style={getSpotPosition(spot)}
            className={`
              ${getSpotColor(spot.status)}
              ${selectedSpot?.id === spot.id ? 'ring-4 ring-blue-500' : ''}
              rounded-md flex items-center justify-center
              text-white font-semibold text-sm
              transition-all cursor-pointer
              hover:scale-105 active:scale-95
            `}
            title={`Spot ${spot.number} - ${spot.status}`}
          >
            {spot.number}
          </button>
        ))}

        {/* Road markings */}
        <div 
          className="bg-gray-200 flex items-center justify-center"
          style={{ gridColumn: '1 / -1', gridRow: '4' }}
        >
          <div className="w-full h-1 bg-yellow-400 border-t-2 border-b-2 border-dashed border-yellow-600"></div>
        </div>
      </div>

      <div className="mt-4 flex gap-4 justify-center flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-700">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-4 bg-yellow-500 rounded"></div>
          <span className="text-sm text-gray-700">Reserved</span>
        </div>
      </div>
    </div>
  );
}
