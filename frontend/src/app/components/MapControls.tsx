import { ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface MapControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleLayers: () => void;
  showLayers: boolean;
}

export function MapControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onToggleLayers,
  showLayers,
}: MapControlsProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Zoom In */}
      <Button
        onClick={onZoomIn}
        disabled={zoom >= 2}
        className="size-12 bg-white hover:bg-gray-50 text-gray-900 shadow-lg border border-gray-200 rounded-xl p-0 disabled:opacity-50"
        style={{ borderRadius: '12px' }}
      >
        <ZoomIn className="size-5" />
      </Button>

      {/* Zoom Level Indicator */}
      <div className="bg-white shadow-lg border border-gray-200 rounded-xl px-3 py-2 text-center" style={{ borderRadius: '12px' }}>
        <span className="text-xs font-semibold text-gray-700">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Zoom Out */}
      <Button
        onClick={onZoomOut}
        disabled={zoom <= 0.5}
        className="size-12 bg-white hover:bg-gray-50 text-gray-900 shadow-lg border border-gray-200 rounded-xl p-0 disabled:opacity-50"
        style={{ borderRadius: '12px' }}
      >
        <ZoomOut className="size-5" />
      </Button>

      {/* Divider */}
      <div className="h-px bg-gray-200 my-1" />

      {/* Layers Toggle */}
      <Button
        onClick={onToggleLayers}
        className={`size-12 shadow-lg border border-gray-200 rounded-xl p-0 ${
          showLayers
            ? 'bg-ucr-blue hover:bg-ucr-blue-dark text-white'
            : 'bg-white hover:bg-gray-50 text-gray-900'
        }`}
        style={{ borderRadius: '12px' }}
      >
        <Layers className="size-5" />
      </Button>

      {/* Layers Panel */}
      {showLayers && (
        <div className="absolute right-full mr-3 top-0 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-56" style={{ borderRadius: '12px' }}>
          <h4 className="font-bold text-gray-900 mb-3 text-sm">Map Layers</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="size-4 rounded accent-ucr-blue"
              />
              <span className="text-sm text-gray-700">Satellite View</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="size-4 rounded accent-ucr-blue"
              />
              <span className="text-sm text-gray-700">Building Labels</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="size-4 rounded accent-ucr-blue"
              />
              <span className="text-sm text-gray-700">Parking Lots</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="size-4 rounded accent-ucr-blue"
              />
              <span className="text-sm text-gray-700">Walking Paths</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="size-4 rounded accent-ucr-blue"
              />
              <span className="text-sm text-gray-700">Traffic</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
