import { useDrop } from 'react-dnd';
import { ReactNode } from 'react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface MapContainerProps {
  mapImageUrl: string;
  children: ReactNode;
  onDrop: (x: number, y: number) => void;
  zoom?: number;
}

export function MapContainer({ mapImageUrl, children, onDrop, zoom = 1 }: MapContainerProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'MAP_PIN',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const containerElement = document.getElementById('map-container');
      
      if (offset && containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const x = ((offset.x - containerRect.left) / containerRect.width) * 100;
        const y = ((offset.y - containerRect.top) / containerRect.height) * 100;
        
        return { x, y };
      }
      return { x: 50, y: 50 };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), []);

  return (
    <div
      id="map-container"
      ref={drop}
      className="relative w-full h-full overflow-hidden bg-gray-900"
      style={{
        cursor: isOver ? 'crosshair' : 'default',
      }}
    >
      {/* Map Image with Zoom */}
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease-out',
          width: '100%',
          height: '100%',
        }}
      >
        <ImageWithFallback
          src={mapImageUrl}
          alt="UCR Campus Map"
          className="w-full h-full object-cover"
          style={{
            filter: isOver ? 'brightness(0.9)' : 'brightness(1.1) contrast(1.05)',
          }}
        />
      </div>

      {/* Drop indicator overlay */}
      {isOver && (
        <div className="absolute inset-0 bg-ucr-blue/10 pointer-events-none" />
      )}

      {/* Pins and other overlays */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}