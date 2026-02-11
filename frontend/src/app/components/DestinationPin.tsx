interface DestinationPinProps {
  name: string;
  x: number;
  y: number;
  subtitle: string;
  showCard: boolean;
  onHover: (show: boolean) => void;
  icon?: 'graduation-cap' | 'building' | 'flag';
}

export function DestinationPin({
  name,
  x,
  y,
  subtitle,
  showCard,
  onHover,
  icon = 'graduation-cap',
}: DestinationPinProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -100%)',
        zIndex: 25,
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="group cursor-pointer"
    >
      {/* Red Destination Pin - Component with Icon Variant */}
      <div className="relative">
        <svg
          width="64"
          height="72"
          viewBox="0 0 64 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-2xl"
        >
          {/* Pin Shape - Larger for destination */}
          <path
            d="M32 0C14.327 0 0 14.327 0 32c0 21.6 32 40 32 40s32-18.4 32-40C64 14.327 49.673 0 32 0z"
            fill="#EF4444"
            stroke="#003DA5"
            strokeWidth="3"
          />
          {/* White Circle */}
          <circle cx="32" cy="28" r="16" fill="white" />
          
          {/* Graduation Cap Icon */}
          {icon === 'graduation-cap' && (
            <g transform="translate(20, 18)">
              <path
                d="M12 2L2 7l10 5 10-5-10-5z"
                fill="#EF4444"
                stroke="#EF4444"
                strokeWidth="1"
              />
              <path
                d="M2 7v6c0 2 4 4 10 4s10-2 10-4V7"
                fill="none"
                stroke="#EF4444"
                strokeWidth="1.5"
              />
              <line x1="22" y1="7" x2="22" y2="13" stroke="#EF4444" strokeWidth="1.5" />
              <circle cx="22" cy="14" r="1" fill="#EF4444" />
            </g>
          )}
        </svg>
        
        {/* Pulsing Ring Effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-20 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '2s' }} />
        </div>

        {/* Building Label Badge */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white whitespace-nowrap">
          Chemistry Bldg
        </div>
      </div>

      {/* Floating Information Card - Opens on Hover like Figma Overlay */}
      {showCard && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-5 bg-white rounded-xl shadow-2xl border-2 border-red-500 p-4 w-72 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <div className="size-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              {/* Graduation cap icon */}
              <svg className="size-7 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">{name}</h4>
              <p className="text-sm text-gray-600 mb-2">{subtitle}</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md">
                  <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-semibold">25 mins</span>
                </div>
                <div className="size-1.5 bg-gray-300 rounded-full" />
                <span className="text-xs text-gray-500">Your Destination</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}