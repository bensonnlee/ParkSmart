import { TrendingDown, TrendingUp } from 'lucide-react';

interface AvailabilityStripProps {
  currentSpots: number;
  totalSpots: number;
  predictedSpots: number | null;
  className?: string;
}

export function AvailabilityStrip({ currentSpots, totalSpots, predictedSpots, className = '' }: AvailabilityStripProps) {
  return (
    <div className={`flex items-center bg-gray-50 rounded-xl px-4 py-3 gap-4 ${className}`}>
      <div className="flex-1">
        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Now</p>
        <p className="text-xl font-black text-gray-900">
          {currentSpots}<span className="text-xs text-gray-300 font-bold">/{totalSpots}</span>
        </p>
      </div>
      <div className="w-px h-9 bg-gray-200" />
      <div className="flex-1">
        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">At Arrival</p>
        {predictedSpots != null ? (
          <p className="text-xl font-black text-gray-900 flex items-center gap-1">
            {predictedSpots < currentSpots && <TrendingDown className="size-3.5 text-red-400" />}
            {predictedSpots > currentSpots && <TrendingUp className="size-3.5 text-green-500" />}
            {predictedSpots}<span className="text-xs text-gray-300 font-bold">/{totalSpots}</span>
          </p>
        ) : (
          <p className="text-xl font-black text-gray-300">—</p>
        )}
      </div>
    </div>
  );
}
