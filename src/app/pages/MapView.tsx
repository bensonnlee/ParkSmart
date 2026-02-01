import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { ArrowLeft, Search, MapPin as MapPinIcon, ExternalLink, Info } from 'lucide-react';
import { MapContainer } from '@/app/components/MapContainer';
import { ParkingPin } from '@/app/components/ParkingPin';
import { DestinationPin } from '@/app/components/DestinationPin';
import { MapTooltip } from '@/app/components/MapTooltip';
import { MapControls } from '@/app/components/MapControls';
import { RouteOverlay } from '@/app/components/RouteOverlay';
import { MapViewPlaceholder } from '@/app/components/MapViewPlaceholder';

interface ParkingLotPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  available: number;
  total: number;
  walkTime: number;
  distance: string;
  cost: string;
  entry: string;
  status: 'available' | 'limited' | 'full';
  validPasses: string[];
}

export default function MapView() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('Chemistry Building');
  const [selectedLotId, setSelectedLotId] = useState<string | null>('lot-6');
  const [showDestinationCard, setShowDestinationCard] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showLayers, setShowLayers] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    bestMatch: true,
    freeParking: false,
    visitor: false,
    covered: false,
  });

  // Destination coordinates
  const destination = {
    name: 'Chemistry 101',
    x: 65,
    y: 40,
    subtitle: 'Class starts in 25 mins',
  };

  // Initialize parking lot positions
  const [parkingLots, setParkingLots] = useState<ParkingLotPosition[]>([
    {
      id: 'lot-6',
      name: 'Lot 6 (Engineering Deck)',
      x: 45,
      y: 35,
      available: 341,
      total: 487,
      walkTime: 5,
      distance: '0.2 mi',
      cost: 'Free w/ Blue Pass',
      entry: 'East Campus Drive',
      status: 'available',
      validPasses: ['Blue', 'Gold', 'Gold+'],
    },
    {
      id: 'lot-13',
      name: 'Lot 13',
      x: 55,
      y: 25,
      available: 112,
      total: 155,
      walkTime: 8,
      distance: '0.3 mi',
      cost: 'Free w/ Blue Pass',
      entry: 'Aberdeen Drive',
      status: 'available',
      validPasses: ['Blue', 'Gold', 'Gold+'],
    },
    {
      id: 'lot-30',
      name: 'Lot 30 (Main Structure)',
      x: 30,
      y: 65,
      available: 1842,
      total: 2143,
      walkTime: 12,
      distance: '0.5 mi',
      cost: '$2.50',
      entry: 'Big Springs Road',
      status: 'available',
      validPasses: ['Visitor'],
    },
    {
      id: 'lot-24',
      name: 'Lot 24',
      x: 60,
      y: 70,
      available: 266,
      total: 496,
      walkTime: 10,
      distance: '0.4 mi',
      cost: 'Free w/ Blue Pass',
      entry: 'Canyon Crest Drive',
      status: 'limited',
      validPasses: ['Blue', 'Gold', 'Gold+'],
    },
    {
      id: 'lot-1',
      name: 'Lot 1 [EV Charging]',
      x: 50,
      y: 20,
      available: 128,
      total: 180,
      walkTime: 7,
      distance: '0.25 mi',
      cost: 'Free w/ Blue Pass',
      entry: 'Campus Drive',
      status: 'available',
      validPasses: ['Blue', 'Gold', 'Gold+', 'Red'],
    },
  ]);

  const selectedLot = parkingLots.find((lot) => lot.id === selectedLotId);

  const handlePinClick = (lotId: string) => {
    setSelectedLotId(lotId);
  };

  const handlePinPositionChange = (id: string, x: number, y: number) => {
    setParkingLots((prev) =>
      prev.map((lot) => (lot.id === id ? { ...lot, x, y } : lot))
    );
  };

  const handleStartRoute = () => {
    console.log('Starting route to', selectedLot?.name);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const getStatusColor = (status: string) => {
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
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b z-10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <h1 className="font-bold text-gray-900">Interactive Campus Map</h1>
              <span className="bg-ucr-blue/10 text-ucr-blue text-xs px-2 py-1 rounded-full font-medium ml-auto">
                Live Updates
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-full md:w-96 bg-white border-r flex flex-col overflow-hidden md:block hidden">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search building or class..."
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 mt-3 flex-wrap">
                <Button
                  variant={activeFilters.bestMatch ? 'default' : 'outline'}
                  size="sm"
                  className={
                    activeFilters.bestMatch
                      ? 'bg-ucr-blue hover:bg-ucr-blue-dark'
                      : ''
                  }
                  onClick={() =>
                    setActiveFilters((prev) => ({
                      ...prev,
                      bestMatch: !prev.bestMatch,
                    }))
                  }
                >
                  Best Match
                </Button>
                <Button
                  variant={activeFilters.freeParking ? 'default' : 'outline'}
                  size="sm"
                  className={
                    activeFilters.freeParking
                      ? 'bg-ucr-blue hover:bg-ucr-blue-dark'
                      : ''
                  }
                  onClick={() =>
                    setActiveFilters((prev) => ({
                      ...prev,
                      freeParking: !prev.freeParking,
                    }))
                  }
                >
                  Free Parking
                </Button>
                <Button
                  variant={activeFilters.visitor ? 'default' : 'outline'}
                  size="sm"
                  className={
                    activeFilters.visitor
                      ? 'bg-ucr-blue hover:bg-ucr-blue-dark'
                      : ''
                  }
                  onClick={() =>
                    setActiveFilters((prev) => ({
                      ...prev,
                      visitor: !prev.visitor,
                    }))
                  }
                >
                  Visitor
                </Button>
                <Button
                  variant={activeFilters.covered ? 'default' : 'outline'}
                  size="sm"
                  className={
                    activeFilters.covered
                      ? 'bg-ucr-blue hover:bg-ucr-blue-dark'
                      : ''
                  }
                  onClick={() =>
                    setActiveFilters((prev) => ({
                      ...prev,
                      covered: !prev.covered,
                    }))
                  }
                >
                  Covered
                </Button>
              </div>
            </div>

            {/* Destination */}
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-b">
              <div className="flex items-center gap-2">
                <div className="size-10 bg-red-500 rounded-xl flex items-center justify-center">
                  <MapPinIcon className="size-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
                    Destination
                  </p>
                  <p className="font-bold text-gray-900">{destination.name}</p>
                  <p className="text-xs text-red-600 font-semibold">{destination.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Selected Lot Details */}
            {selectedLot && (
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-ucr-blue text-white text-xs px-2 py-1 rounded-full font-semibold">
                    BEST MATCH
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">
                  {selectedLot.name}
                </h3>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">Walk Time</p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedLot.walkTime} min
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Distance</p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedLot.distance}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Cost</p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedLot.cost}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Availability</span>
                    <span>
                      {selectedLot.available} / {selectedLot.total} spots
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`${getStatusColor(selectedLot.status)} h-2.5 rounded-full transition-all`}
                      style={{
                        width: `${(selectedLot.available / selectedLot.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    <strong>Entry:</strong> {selectedLot.entry}
                  </p>
                  <Button
                    className="w-full bg-ucr-blue hover:bg-ucr-blue-dark rounded-xl"
                    onClick={handleStartRoute}
                    style={{ borderRadius: '12px' }}
                  >
                    🅿️ Park Here & Start Route
                  </Button>
                </div>
              </div>
            )}

            {/* Other Nearby Lots */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Other Parking Lots
                </h4>
                <div className="space-y-3">
                  {parkingLots
                    .filter((lot) => lot.id !== selectedLotId)
                    .map((lot) => (
                      <Card
                        key={lot.id}
                        className="cursor-pointer hover:shadow-md transition-all rounded-xl"
                        onClick={() => handlePinClick(lot.id)}
                        style={{ borderRadius: '12px' }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`${getStatusColor(lot.status)} size-2 rounded-full`}
                                />
                                <h5 className="font-semibold text-sm text-gray-900">
                                  {lot.name}
                                </h5>
                              </div>
                              <p className="text-xs text-gray-600">
                                {lot.walkTime} min walk • {lot.cost}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {lot.available} / {lot.total} spots available
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-lg ${
                                lot.status === 'available'
                                  ? 'bg-green-100 text-green-700'
                                  : lot.status === 'limited'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                              style={{ borderRadius: '8px' }}
                            >
                              {lot.status === 'available'
                                ? 'Available'
                                : lot.status === 'limited'
                                  ? 'Limited'
                                  : 'Full'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            <MapContainer
              mapImageUrl="https://images.unsplash.com/photo-1669348656236-b5bcab3deb17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYXRlbGxpdGUlMjBjYW1wdXMlMjBidWlsZGluZ3MlMjBhZXJpYWx8ZW58MXx8fHwxNzY5OTQ2Mzk3fDA&ixlib=rb-4.1.0&q=80&w=1080"
              onDrop={(x, y) => console.log('Dropped at', x, y)}
              zoom={zoom}
            >
              {/* Route Overlay */}
              {selectedLot && (
                <RouteOverlay
                  start={{ x: selectedLot.x, y: selectedLot.y }}
                  end={{ x: destination.x, y: destination.y }}
                  walkTime={selectedLot.walkTime}
                  distance={selectedLot.distance}
                />
              )}

              {/* Render all parking lot pins */}
              {parkingLots.map((lot) => (
                <ParkingPin
                  key={lot.id}
                  id={lot.id}
                  name={lot.name}
                  x={lot.x}
                  y={lot.y}
                  available={lot.available}
                  total={lot.total}
                  status={lot.status}
                  isSelected={lot.id === selectedLotId}
                  onClick={() => handlePinClick(lot.id)}
                  onPositionChange={handlePinPositionChange}
                  validPasses={lot.validPasses}
                />
              ))}

              {/* Destination Pin */}
              <DestinationPin
                name={destination.name}
                x={destination.x}
                y={destination.y}
                subtitle={destination.subtitle}
                showCard={showDestinationCard}
                onHover={setShowDestinationCard}
              />

              {/* Map Tooltip for selected lot */}
              {selectedLot && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${selectedLot.x}%`,
                    top: `${selectedLot.y}%`,
                    transform: 'translate(-50%, calc(-100% - 60px))',
                    zIndex: 30,
                  }}
                >
                  <MapTooltip
                    lotName={selectedLot.name}
                    available={selectedLot.available}
                    total={selectedLot.total}
                    walkTime={selectedLot.walkTime}
                    distance={selectedLot.distance}
                    cost={selectedLot.cost}
                    entry={selectedLot.entry}
                    status={selectedLot.status}
                    onClose={() => setSelectedLotId(null)}
                    onStartRoute={handleStartRoute}
                  />
                </div>
              )}
            </MapContainer>

            {/* Open Official Map Button - Top Right */}
            <div className="absolute top-4 right-4 z-20">
              <Button
                className="bg-ucr-blue hover:bg-ucr-blue-dark text-white shadow-lg rounded-xl"
                onClick={() =>
                  window.open('https://campusmap.ucr.edu/?id=2106', '_blank')
                }
                style={{ borderRadius: '12px' }}
              >
                <ExternalLink className="size-4 mr-2" />
                Open Official UCR Map
              </Button>
            </div>

            {/* Map Controls - Bottom Right */}
            <div className="absolute bottom-4 right-4 z-20">
              <MapControls
                zoom={zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onToggleLayers={() => setShowLayers(!showLayers)}
                showLayers={showLayers}
              />
            </div>

            {/* Instructions - Bottom Left */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-xl text-xs max-w-xs z-20 border border-gray-200" style={{ borderRadius: '12px' }}>
              <div className="flex items-start gap-2">
                <div className="size-8 bg-ucr-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="size-4 text-ucr-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">
                    Interactive Controls
                  </p>
                  <p className="text-gray-600">
                    Click pins for details • Drag to reposition • Hover destination for info
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}