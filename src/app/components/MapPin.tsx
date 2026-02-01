import { useDrag } from 'react-dnd';
import { MapPin as MapPinIcon } from 'lucide-react';

interface MapPinProps {
  id: string;
  name: string;
  x: number;
  y: number;
  available: number;
  total: number;
  status: 'available' | 'limited' | 'full';
  isSelected: boolean;
  onClick: () => void;
  onPositionChange: (id: string, x: number, y: number) => void;
}

export function MapPin({
  id,
  name,
  x,
  y,
  available,
  total,
  status,
  isSelected,
  onClick,
  onPositionChange,
}: MapPinProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'MAP_PIN',
    item: { id, x, y },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ x: number; y: number }>();
      if (item && dropResult) {
        onPositionChange(id, dropResult.x, dropResult.y);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [id, x, y]);

  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'text-green-500';
      case 'limited':
        return 'text-yellow-500';
      case 'full':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBg = () => {
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

  return (
    <div
      ref={drag}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -100%)',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        zIndex: isSelected ? 20 : 10,
      }}
      className="group"
    >
      {/* Pin Icon */}
      <div className="relative">
        <MapPinIcon
          className={`size-8 ${getStatusColor()} transition-all duration-200 ${
            isSelected ? 'scale-125' : 'group-hover:scale-110'
          }`}
          fill="currentColor"
        />
        
        {/* Badge showing available spots */}
        <div
          className={`absolute -top-2 -right-2 ${getStatusBg()} text-white text-xs font-bold rounded-full size-6 flex items-center justify-center border-2 border-white shadow-md`}
        >
          {available}
        </div>
      </div>

      {/* Tooltip on hover */}
      {!isSelected && (
        <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap z-30">
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-gray-600">
            {available} / {total} spots
          </p>
        </div>
      )}
    </div>
  );
}
