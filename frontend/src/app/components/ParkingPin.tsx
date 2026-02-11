import { useDrag } from 'react-dnd';

interface ParkingPinProps {
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
  validPasses: string[];
}

export function ParkingPin({
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
  validPasses,
}: ParkingPinProps) {
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

  const getPinColor = () => {
    switch (status) {
      case 'available':
        return '#10B981'; // Green
      case 'limited':
        return '#F59E0B'; // Amber
      case 'full':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const getPinSize = () => {
    if (isSelected) return { width: 56, height: 66 };
    return { width: 44, height: 52 };
  };

  const pinSize = getPinSize();

  return (
    <div
      ref={drag}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -100%)',
        cursor: isDragging ? 'grabbing' : 'pointer',
        opacity: isDragging ? 0.5 : 1,
        zIndex: isSelected ? 20 : 10,
        transition: 'all 0.2s ease-out',
      }}
      className="group"
    >
      {/* UCR-style Parking Pin Component */}
      <div className="relative">
        {/* Pin Shadow/Glow Effect */}
        {isSelected && (
          <div 
            className="absolute inset-0 blur-lg opacity-40 animate-pulse"
            style={{
              background: getPinColor(),
              width: pinSize.width,
              height: pinSize.height,
            }}
          />
        )}
        
        <svg
          width={pinSize.width}
          height={pinSize.height}
          viewBox="0 0 44 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-xl transition-all duration-200 relative"
        >
          {/* Pin Shape */}
          <path
            d="M22 0C9.85 0 0 9.85 0 22c0 14.85 22 30 22 30s22-15.15 22-30C44 9.85 34.15 0 22 0z"
            fill={getPinColor()}
            stroke={isSelected ? '#003DA5' : 'white'}
            strokeWidth={isSelected ? '3' : '2'}
          />
          {/* White Circle for "P" */}
          <circle cx="22" cy="20" r="12" fill="white" />
          {/* "P" for Parking */}
          <text
            x="22"
            y="27"
            textAnchor="middle"
            fill={getPinColor()}
            fontSize="18"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            P
          </text>
        </svg>
        
        {/* Badge showing available spots - Component State Indicator */}
        <div
          className="absolute -top-1 -right-1 bg-white text-gray-900 text-xs font-bold rounded-full flex items-center justify-center border-2 shadow-lg transition-all"
          style={{ 
            borderColor: getPinColor(),
            width: isSelected ? '28px' : '24px',
            height: isSelected ? '28px' : '24px',
          }}
        >
          {available}
        </div>

        {/* Permit Badge - Shows valid pass types */}
        <div 
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 transition-all"
          style={{
            opacity: isSelected ? 1 : 0.8,
            transform: isSelected 
              ? 'translateX(-50%) scale(1.1)' 
              : 'translateX(-50%) scale(1)',
          }}
        >
          {validPasses.map((pass) => {
            // Determine color based on permit type
            let bgColor = '#6B7280'; // Default gray
            if (pass.toLowerCase().includes('blue')) bgColor = '#003DA5';
            else if (pass.toLowerCase().includes('gold+')) bgColor = '#F59E0B';
            else if (pass.toLowerCase().includes('gold')) bgColor = '#F1AB00';
            else if (pass.toLowerCase().includes('red')) bgColor = '#DC2626';
            else if (pass.toLowerCase().includes('orange')) bgColor = '#EA580C';
            else if (pass.toLowerCase().includes('green') || pass.toLowerCase().includes('resident') || pass.toLowerCase().includes('hall')) bgColor = '#059669';
            else if (pass.toLowerCase().includes('apartment')) bgColor = '#0891B2';
            else if (pass.toLowerCase().includes('evening')) bgColor = '#7C3AED';
            else if (pass.toLowerCase().includes('visitor')) bgColor = '#6B7280';

            return (
              <div
                key={pass}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border-2 border-white"
                style={{
                  backgroundColor: bgColor,
                  color: 'white',
                }}
              >
                {pass}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover Tooltip - Hidden when selected (click shows main tooltip) */}
      {!isSelected && (
        <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-3 bg-white px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap z-30 border-2 border-gray-200">
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-gray-600">
            {available} / {total} spots
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Click for details</p>
        </div>
      )}

      {/* Selection Indicator Ring */}
      {isSelected && (
        <div 
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            border: `2px solid ${getPinColor()}`,
            width: pinSize.width,
            height: pinSize.width,
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 0.4,
          }}
        />
      )}
    </div>
  );
}