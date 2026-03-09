import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/app/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { PageHeader } from '@/app/components/PageHeader';
import {
  MapPin, Footprints, Car, CheckCircle, Navigation,
  AlertCircle, Clock, Building2, Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { cachedFetch } from '@/api/apiCache';
import { API_BASE } from '@/api/config';
import { loadPrefs, WALK_SPEED_MULTIPLIER } from '@/lib/prefs';
import { openMapsDirections } from '@/lib/maps';
import { useDebounce } from '@/app/hooks/useDebounce';
import { useLocation } from '@/app/hooks/useLocation';
import { getPredictedSpots } from '@/lib/forecast';
import { AvailabilityStrip } from '@/app/components/AvailabilityStrip';

interface BuildingOption {
  id: string;
  name: string;
  nickname: string;
}

export default function FindByBuilding() {
  const { latitude, longitude } = useLocation();
  const prefs = useMemo(() => loadPrefs(), []);
  const walkMultiplier = WALK_SPEED_MULTIPLIER[prefs.walkingSpeed] ?? 1.0;

  // Search state
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingOption | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Results state — null means "hasn't searched yet", [] means "searched, no results"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[] | null>(null);
  const [otherLots, setOtherLots] = useState<any[]>([]);

  // Fetch buildings on debounced query change (empty query returns all buildings)
  useEffect(() => {
    let stale = false;
    const fetchBuildings = async () => {
      try {
        const url = debouncedQuery
          ? `${API_BASE}/api/buildings?q=${encodeURIComponent(debouncedQuery)}`
          : `${API_BASE}/api/buildings`;
        const data = await cachedFetch(url, { ttl: 30_000 });
        if (!stale) setBuildings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching buildings:', err);
        if (!stale) setBuildings([]);
      }
    };
    fetchBuildings();
    return () => { stale = true; };
  }, [debouncedQuery]);

  const handleSelectBuilding = (building: BuildingOption) => {
    setSelectedBuilding(building);
    setOpen(false);
    setQuery('');
    // Reset previous results
    setRecommendations(null);
    setOtherLots([]);
    setError(null);
  };

  const handleFindParking = async () => {
    if (!selectedBuilding) return;
    setLoading(true);
    setError(null);
    setOtherLots([]);

    try {
      const usingUserLocation = !!(latitude && longitude);

      // Parallel fetches: walking lots, driving lots (optional), permit lots (optional)
      const fetches: [Promise<any>, Promise<any> | null, Promise<any> | null] = [
        cachedFetch(`${API_BASE}/api/buildings/${selectedBuilding.id}/lots`),
        usingUserLocation
          ? cachedFetch(`${API_BASE}/api/classrooms/lots/from-location?latitude=${latitude}&longitude=${longitude}`)
          : null,
        prefs.preferredPermitId
          ? cachedFetch(`${API_BASE}/api/permits/${prefs.preferredPermitId}/lots`, { ttl: 60_000 }).catch(() => null)
          : null,
      ];

      const [walkData, driveData, permitLotsData] = await Promise.all(
        fetches.map(p => p ?? Promise.resolve(null))
      );

      const walkLots: any[] = walkData?.lots || [];
      const driveLots: any[] = driveData ? (Array.isArray(driveData) ? driveData : []) : [];

      // Use driving-sorted order when available, otherwise walking-sorted
      const rawLots = driveLots.length > 0 ? driveLots : walkLots;

      // Filter by permit access
      const accessibleLotIds: Set<string> | null = permitLotsData
        ? new Set((Array.isArray(permitLotsData) ? permitLotsData : []).map((lot: any) => lot.id))
        : null;
      const filteredLots = accessibleLotIds
        ? rawLots.filter((lot: any) => accessibleLotIds.has(lot.id))
        : [...rawLots];

      // Build lookup maps
      const walkTimeMap = new Map(walkLots.map((lot: any) => [lot.id, lot.travel_minutes]));
      const driveTimeMap = new Map(driveLots.map((lot: any) => [lot.id, lot.travel_minutes]));

      // Sort by total travel time when user location is available
      if (usingUserLocation) {
        filteredLots.sort((a: any, b: any) => {
          const totalA = (driveTimeMap.get(a.id) ?? 0) + (walkTimeMap.get(a.id) ?? 0) * walkMultiplier;
          const totalB = (driveTimeMap.get(b.id) ?? 0) + (walkTimeMap.get(b.id) ?? 0) * walkMultiplier;
          return totalA - totalB;
        });
      }

      // Fetch availability + forecasts for top 3
      const settledResults = await Promise.allSettled(
        filteredLots.slice(0, 3).map(async (lot: any) => {
          const [detail, forecast] = await Promise.all([
            cachedFetch(`${API_BASE}/api/lots/${lot.id}`, { ttl: 60_000 }),
            cachedFetch(`${API_BASE}/api/lots/${lot.id}/forecast`, { ttl: 60_000 }).catch(() => ({ forecasts: [] })),
          ]);
          return { ...detail, forecasts: forecast.forecasts ?? [] };
        })
      );

      const detailedLots = settledResults
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value);

      // Map to UI structure
      const now = Date.now();
      const formattedLots = detailedLots.map((lot: any) => {
        const driveMin = driveTimeMap.get(lot.id) ?? 0;
        const rawWalk = walkTimeMap.get(lot.id);
        const walkMin = rawWalk != null ? Math.round(rawWalk * walkMultiplier) : 0;

        // "Arrive By" = if you leave now, when you'd reach the building
        const totalMinutes = driveMin + walkMin;
        const arriveByTime = totalMinutes > 0 ? new Date(now + totalMinutes * 60_000) : null;

        const predictedSpots = getPredictedSpots(arriveByTime, lot.forecasts);

        return {
          id: lot.id,
          name: lot.name,
          currentSpots: lot.free_spaces ?? 0,
          totalSpots: lot.total_spaces ?? 0,
          walkMinutes: rawWalk != null ? walkMin : null,
          driveMinutes: driveTimeMap.get(lot.id) ?? null,
          lat: lot.latitude,
          lng: lot.longitude,
          arriveByTime,
          predictedSpots,
        };
      });

      setRecommendations(formattedLots);

      // Fetch availability for remaining lots (beyond top 3)
      const remainingLots = filteredLots.slice(3);
      if (remainingLots.length > 0) {
        const otherSettled = await Promise.allSettled(
          remainingLots.map((lot: any) =>
            cachedFetch(`${API_BASE}/api/lots/${lot.id}`, { ttl: 60_000 }).catch(() => null)
          )
        );

        const otherFormatted = remainingLots.map((lot: any, i: number) => {
          const result = otherSettled[i];
          const detail = result.status === 'fulfilled' ? result.value : null;
          const rawWalk = walkTimeMap.get(lot.id);
          const walkMin = rawWalk != null ? Math.round(rawWalk * walkMultiplier) : null;
          const driveMin = driveTimeMap.get(lot.id) ?? null;

          return {
            id: lot.id,
            name: detail?.name ?? lot.name ?? lot.id,
            walkMinutes: walkMin,
            driveMinutes: driveMin,
            lat: detail?.latitude ?? lot.latitude,
            lng: detail?.longitude ?? lot.longitude,
            currentSpots: detail?.free_spaces ?? null,
            totalSpots: detail?.total_spaces ?? null,
          };
        });

        setOtherLots(otherFormatted);
      }
    } catch (err: any) {
      console.error('FindByBuilding fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Find by Building"
        subtitle="Search any campus building for parking"
      />

      <div className="max-w-2xl mx-auto">
        {/* Search + Select */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Select a building</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between text-left font-normal h-12"
              >
                {selectedBuilding ? (
                  <span className="flex items-center gap-2">
                    <Building2 className="size-4 text-ucr-blue shrink-0" />
                    <span className="truncate">{selectedBuilding.name}</span>
                    <span className="text-gray-400 text-xs truncate">({selectedBuilding.nickname})</span>
                  </span>
                ) : (
                  <span className="text-gray-400 flex items-center gap-2">
                    <Search className="size-4" />
                    Search buildings...
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Type a building name..."
                  value={query}
                  onValueChange={setQuery}
                />
                <CommandList>
                  <CommandEmpty>No buildings found.</CommandEmpty>
                  <CommandGroup>
                    {buildings.map((b) => (
                      <CommandItem
                        key={b.id}
                        value={b.id}
                        onSelect={() => handleSelectBuilding(b)}
                        className="flex items-center gap-2"
                      >
                        <Building2 className="size-4 text-gray-400 shrink-0" />
                        <span className="font-medium">{b.name}</span>
                        <span className="text-gray-400 text-xs ml-auto">{b.nickname}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Button
          onClick={handleFindParking}
          disabled={!selectedBuilding || loading}
          className="w-full py-6 text-md font-bold rounded-xl bg-ucr-blue hover:bg-ucr-blue-dark shadow-lg shadow-blue-100 transition-all active:scale-[0.98] mb-8"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Finding parking...
            </>
          ) : (
            'Find Parking'
          )}
        </Button>

        {/* Results */}
        {recommendations !== null && !loading && (
          <>
            {error ? (
              <div className="text-center py-12">
                <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                <p className="text-gray-500 mb-6 text-center max-w-xs mx-auto">{error}</p>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-500" /> Parking Lots
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  {latitude && longitude
                    ? 'Sorted by total driving + walking time'
                    : 'Sorted by walking distance from building'}
                </p>

                {recommendations.length === 0 ? (
                  <Card className="border-dashed border-2 border-gray-300 p-10 text-center rounded-2xl">
                    <MapPin className="size-8 text-gray-300 mx-auto mb-3" />
                    {prefs.preferredPermitId ? (
                      <>
                        <h3 className="font-bold text-gray-500 mb-1">No Accessible Lots</h3>
                        <p className="text-sm text-gray-400">Your permit doesn't have access to nearby lots. Try updating your permit in Settings.</p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-bold text-gray-500 mb-1">No Parking Lots Found</h3>
                        <p className="text-sm text-gray-400">We couldn't find any nearby parking lots for this building.</p>
                      </>
                    )}
                  </Card>
                ) : (
                  recommendations.map((lot) => (
                    <Card key={lot.id} className="mb-4 border-none shadow-sm rounded-2xl overflow-hidden">
                      <CardContent className="p-0 last:pb-0">
                        {/* Arrive By banner */}
                        {lot.arriveByTime && (
                          <div className="bg-blue-600 px-6 py-3 flex items-center justify-between rounded-t-2xl">
                            <span className="text-blue-200 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                              <Clock className="size-3.5" /> Arrive By
                            </span>
                            <span className="text-white text-2xl font-black">{format(lot.arriveByTime, 'h:mm a')}</span>
                          </div>
                        )}

                        {/* Lot name + durations */}
                        <div className="px-4 sm:px-6 pt-5 pb-4">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{lot.name}</h3>
                          <div className="flex items-center gap-1.5 text-sm text-gray-400 flex-wrap">
                            {lot.driveMinutes != null && (
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <Car className="size-3.5 shrink-0" /> ~{Math.round(lot.driveMinutes)} min drive
                              </span>
                            )}
                            {lot.driveMinutes != null && lot.walkMinutes != null && (
                              <span className="text-gray-300">{'\u00B7'}</span>
                            )}
                            {lot.walkMinutes != null && (
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <Footprints className="size-3.5 shrink-0" /> ~{Math.round(lot.walkMinutes)} min walk
                              </span>
                            )}
                            {lot.driveMinutes == null && lot.walkMinutes == null && (
                              <span className="flex items-center gap-1">
                                <Footprints className="size-3.5" /> —
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Availability strip */}
                        <AvailabilityStrip
                          currentSpots={lot.currentSpots}
                          totalSpots={lot.totalSpots}
                          predictedSpots={lot.predictedSpots}
                          className="mx-4 sm:mx-6 mb-4"
                        />

                        {/* Navigation button */}
                        <button
                          onClick={() => openMapsDirections(lot.lat, lot.lng)}
                          className="w-full bg-blue-600 hover:bg-blue-700 py-3.5 flex items-center justify-center gap-2 text-xs font-bold text-white transition-colors uppercase tracking-wide"
                        >
                          <Navigation className="size-3.5" /> Start Navigation
                        </button>
                      </CardContent>
                    </Card>
                  ))
                )}

                {/* All Other Lots */}
                {otherLots.length > 0 && (
                  <>
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1 mt-8 flex items-center gap-2">
                      <MapPin className="size-4 text-gray-400" /> All Other Lots
                    </h2>
                    <p className="text-xs text-gray-400 mb-4">
                      {otherLots.length} additional lot{otherLots.length !== 1 ? 's' : ''} nearby
                    </p>

                    {otherLots.map((lot) => (
                      <Card key={lot.id} className="mb-3 border-none shadow-sm rounded-2xl overflow-hidden">
                        <CardContent className="p-0 last:pb-0">
                          <div className="px-4 sm:px-6 pt-4 pb-3">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-bold text-base text-gray-900">{lot.name}</h3>
                              {lot.currentSpots != null && lot.totalSpots != null && (
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                                  {lot.currentSpots} / {lot.totalSpots} spots
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-gray-400 flex-wrap">
                              {lot.driveMinutes != null && (
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  <Car className="size-3.5 shrink-0" /> ~{Math.round(lot.driveMinutes)} min drive
                                </span>
                              )}
                              {lot.driveMinutes != null && lot.walkMinutes != null && (
                                <span className="text-gray-300">{'\u00B7'}</span>
                              )}
                              {lot.walkMinutes != null && (
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  <Footprints className="size-3.5 shrink-0" /> ~{Math.round(lot.walkMinutes)} min walk
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => openMapsDirections(lot.lat, lot.lng)}
                            className="w-full bg-blue-600 hover:bg-blue-700 py-3 flex items-center justify-center gap-2 text-xs font-bold text-white transition-colors uppercase tracking-wide"
                          >
                            <Navigation className="size-3.5" /> Start Navigation
                          </button>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
