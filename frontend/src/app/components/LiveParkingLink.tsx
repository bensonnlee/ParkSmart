import { ExternalLink } from 'lucide-react';

export function LiveParkingLink({ className = '' }: { className?: string }) {
  return (
    <a
      href="https://openspaces.ucr.edu/home"
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 transition-colors hover:bg-blue-100 ${className}`}
    >
      <ExternalLink className="size-5 text-blue-500 shrink-0" />
      <p className="text-sm text-blue-700">
        <span className="font-semibold">Need live availability?</span> See real-time lot data on UCR OpenSpaces.
      </p>
    </a>
  );
}
