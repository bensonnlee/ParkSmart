import { AlertTriangle } from 'lucide-react';

export function ForecastPausedBanner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 ${className}`}>
      <AlertTriangle className="size-5 text-red-500 shrink-0" />
      <p className="text-sm text-red-700">
        <span className="font-semibold">Predictions temporarily unavailable.</span> We're working on fixing an issue and will resume shortly.
      </p>
    </div>
  );
}
