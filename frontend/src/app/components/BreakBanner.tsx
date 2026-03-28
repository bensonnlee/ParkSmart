import { Calendar } from 'lucide-react';

export function BreakBanner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 ${className}`}>
      <Calendar className="size-5 text-amber-500 shrink-0" />
      <p className="text-sm text-amber-700">
        <span className="font-semibold">Enjoy your break!</span> Parking predictions are paused until the next term.
      </p>
    </div>
  );
}
