import { motion } from 'motion/react';

interface RoutePoint {
  x: number;
  y: number;
}

interface RouteOverlayProps {
  start: RoutePoint;
  end: RoutePoint;
  walkTime: number;
  distance: string;
}

export function RouteOverlay({ start, end, walkTime, distance }: RouteOverlayProps) {
  // Create a curved path with waypoints for a more realistic walking route
  const createPathData = () => {
    // Calculate midpoints for a curved path
    const midX1 = start.x + (end.x - start.x) * 0.3;
    const midY1 = start.y + (end.y - start.y) * 0.25;
    const midX2 = start.x + (end.x - start.x) * 0.7;
    const midY2 = start.y + (end.y - start.y) * 0.75;

    // Create smooth curve using quadratic bezier
    return `M ${start.x} ${start.y} Q ${midX1} ${midY1}, ${start.x + (end.x - start.x) * 0.5} ${start.y + (end.y - start.y) * 0.5} Q ${midX2} ${midY2}, ${end.x} ${end.y}`;
  };

  // Calculate path midpoint for info badge
  const midX = start.x + (end.x - start.x) * 0.5;
  const midY = start.y + (end.y - start.y) * 0.5;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Gradient for the path */}
        <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#003DA5" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.8" />
        </linearGradient>

        {/* Animated dashed pattern */}
        <pattern id="dashPattern" x="0" y="0" width="20" height="4" patternUnits="userSpaceOnUse">
          <motion.rect
            x="0"
            y="0"
            width="10"
            height="4"
            fill="white"
            animate={{ x: [0, 20] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </pattern>
      </defs>

      {/* Outer glow/shadow path */}
      <motion.path
        d={createPathData()}
        fill="none"
        stroke="url(#routeGradient)"
        strokeWidth="1.2"
        strokeOpacity="0.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />

      {/* Main route path */}
      <motion.path
        d={createPathData()}
        fill="none"
        stroke="url(#routeGradient)"
        strokeWidth="0.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />

      {/* Animated dots traveling along path */}
      <motion.circle
        r="0.4"
        fill="#003DA5"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0, 1, 1, 0],
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: 'linear',
          times: [0, 0.1, 0.9, 1]
        }}
      >
        <animateMotion
          dur="3s"
          repeatCount="indefinite"
          path={createPathData()}
        />
      </motion.circle>

      {/* Info badge at midpoint */}
      <foreignObject x={midX - 10} y={midY - 3} width="20" height="6">
        <div className="flex items-center justify-center h-full pointer-events-auto">
          <div className="bg-white rounded-lg shadow-xl border-2 border-ucr-blue px-3 py-1.5 flex items-center gap-2 whitespace-nowrap">
            <svg className="size-4 text-ucr-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
            </svg>
            <div className="text-xs">
              <span className="font-bold text-gray-900">{walkTime} min walk</span>
              <span className="text-gray-500 ml-1">• {distance}</span>
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>
  );
}