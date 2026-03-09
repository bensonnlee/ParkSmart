import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { ArrowLeft, MapPin, Footprints, Car, CheckCircle, Navigation, AlertCircle, Clock, type LucideIcon } from 'lucide-react';
import { format, subMinutes } from 'date-fns';
import { cachedFetch } from '@/api/apiCache';
import { API_BASE } from '@/api/config';
import { loadPrefs, WALK_SPEED_MULTIPLIER } from '@/lib/prefs';
import { openMapsDirections } from '@/lib/maps';
import { getPredictedSpots } from '@/lib/forecast';
import { AvailabilityStrip } from '@/app/components/AvailabilityStrip';

function TimelineConnector({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="flex-1 relative flex items-center justify-center">
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-300" />
      <Icon className="size-3.5 text-gray-400 bg-gray-50 px-0.5 relative z-10" />
    </div>
  );
}

export default function ParkingRecommendations() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userLat = searchParams.get('lat');
  const userLng = searchParams.get('lng');
  const startTimeParam = searchParams.get('startTime');
  const usingUserLocation = !!(userLat && userLng);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [otherLots, setOtherLots] = useState<any[]>([]);

  const prefs = useMemo(() => loadPrefs(), []);
  const walkMultiplier = WALK_SPEED_MULTIPLIER[prefs.walkingSpeed] ?? 1.0;
  const preferredPermitId = prefs.preferredPermitId;

  useEffect(() => {
    if (!classId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setOtherLots([]);

      try {
        // Always fetch classroom + walking-distance lots; optionally fetch driving distances + permit-accessible lots
        const fetches: [Promise<any>, Promise<any>, Promise<any> | null, Promise<any> | null] = [
          cachedFetch(`${API_BASE}/api/classrooms/${classId}`),
          cachedFetch(`${API_BASE}/api/classrooms/${classId}/lots`),
          userLat && userLng
            ? cachedFetch(`${API_BASE}/api/classrooms/lots/from-location?latitude=${userLat}&longitude=${userLng}`)
            : null,
          preferredPermitId
            ? cachedFetch(`${API_BASE}/api/permits/${preferredPermitId}/lots`, { ttl: 60_000 }).catch(() => null)
            : null,
        ];

        const [classData, walkData, driveData, permitLotsData] = await Promise.all(
          fetches.map(p => p ?? Promise.resolve(null))
        );

        // Walking lots from /{classId}/lots (always available)
        const walkLots: any[] = walkData?.lots || [];
        // Driving lots from from-location (only when user location provided)
        const driveLots: any[] = driveData ? (Array.isArray(driveData) ? driveData : []) : [];

        // Use driving-sorted order when available, otherwise walking-sorted
        const rawLots = driveLots.length > 0 ? driveLots : walkLots;

        // Filter to only permit-accessible lots when a permit preference is set
        const accessibleLotIds: Set<string> | null = permitLotsData
          ? new Set((Array.isArray(permitLotsData) ? permitLotsData : []).map((lot: any) => lot.id))
          : null;
        const filteredLots = accessibleLotIds
          ? rawLots.filter((lot: any) => accessibleLotIds.has(lot.id))
          : [...rawLots];

        // Build lookup maps for both travel times
        const walkTimeMap = new Map(walkLots.map((lot: any) => [lot.id, lot.travel_minutes]));
        const driveTimeMap = new Map(driveLots.map((lot: any) => [lot.id, lot.travel_minutes]));

        // Sort by total travel time (driving + walking) when user location is available
        if (usingUserLocation) {
          filteredLots.sort((a: any, b: any) => {
            const totalA = (driveTimeMap.get(a.id) ?? 0) + (walkTimeMap.get(a.id) ?? 0) * walkMultiplier;
            const totalB = (driveTimeMap.get(b.id) ?? 0) + (walkTimeMap.get(b.id) ?? 0) * walkMultiplier;
            return totalA - totalB;
          });
        }

        // Fetch specific details (availability) + forecasts for the top 3 recommended lots
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

        // Classroom Info
        setClassInfo({
          name: classData.building?.name || "Building",
          room: classData.location_string?.split('Room:')[1]?.trim() || classData.location_string || "",
        });

        // Mapping hydrated API data into our UI component's expected structure
        const now = Date.now();
        const classStart = startTimeParam ? new Date(Number(startTimeParam)) : null;
        const formattedLots = detailedLots.map((lot: any) => {
          const driveMin = driveTimeMap.get(lot.id) ?? 0;
          const rawWalk = walkTimeMap.get(lot.id);
          const walkMin = rawWalk != null ? Math.round(rawWalk * walkMultiplier) : 0;

          // Arrival at lot: schedule-based when class start is known, otherwise "if you leave now"
          const arrivalTime = classStart
            ? subMinutes(classStart, prefs.arrivalBuffer + walkMin)
            : (driveMin > 0 ? new Date(now + driveMin * 60_000) : null);

          const predictedSpots = getPredictedSpots(arrivalTime, lot.forecasts);

          return {
            id: lot.id,
            name: lot.name,
            currentSpots: lot.free_spaces ?? 0,
            totalSpots: lot.total_spaces ?? 0,
            walkMinutes: rawWalk != null ? walkMin : null,
            driveMinutes: driveTimeMap.get(lot.id) ?? null,
            lat: lot.latitude,
            lng: lot.longitude,
            predictedSpots,
            arrivalTime,
            leaveByTime: classStart
              ? subMinutes(classStart, prefs.arrivalBuffer + walkMin + driveMin)
              : null,
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
        console.error("Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, userLat, userLng, startTimeParam, walkMultiplier, preferredPermitId]);

  const handleNavigate = (lat: string, lng: string) => {
    openMapsDirections(lat, lng);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F8FB]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="font-bold text-gray-500">Syncing live parking availability...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F8FB] p-6">
      <AlertCircle className="size-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-500 mb-6 text-center max-w-xs">{error}</p>
      <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white">
        Back to Dashboard
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F8FB] p-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="size-5 mr-2" /> Back
        </Button>

        {/* Header Section */}
        <h1 className="text-2xl font-black mb-1">
          {classInfo?.name}{classInfo?.room ? ` Room ${classInfo.room}` : ''}
        </h1>

        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
          <CheckCircle className="size-4 text-green-500" /> Parking Lots
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          {usingUserLocation ? "Sorted by total driving + walking time" : "Sorted by walking distance from classroom"}
        </p>

        {/* Empty state */}
        {recommendations.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300 p-10 text-center rounded-2xl">
            <MapPin className="size-8 text-gray-300 mx-auto mb-3" />
            {preferredPermitId ? (
              <>
                <h3 className="font-bold text-gray-500 mb-1">No Accessible Lots Right Now</h3>
                <p className="text-sm text-gray-400">Your permit doesn't have access to nearby lots at this time. Check back later or update your permit in Settings.</p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-gray-500 mb-1">No Parking Lots Found</h3>
                <p className="text-sm text-gray-400">We couldn't find any nearby parking lots for this classroom.</p>
              </>
            )}
          </Card>
        ) : (
          /* Lot Recommendation List */
          recommendations.map((lot) => {
            const classArrival = lot.arrivalTime && lot.walkMinutes != null
              ? new Date(lot.arrivalTime.getTime() + lot.walkMinutes * 60_000)
              : null;

            return (
              <Card key={lot.id} className="mb-4 border-none shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-0 last:pb-0">
                  {/* Zone 1 — Leave By banner */}
                  {lot.leaveByTime && (
                    <div className="bg-blue-600 px-6 py-3 flex items-center justify-between rounded-t-2xl">
                      <span className="text-blue-200 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="size-3.5" /> Leave By
                      </span>
                      <span className="text-white text-2xl font-black">{format(lot.leaveByTime, 'h:mm a')}</span>
                    </div>
                  )}

                  {/* Zone 2 — Lot name + durations */}
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
                    className="mx-4 sm:mx-6 mb-3"
                  />

                  {/* Journey timeline */}
                  {lot.arrivalTime && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs bg-gray-50 rounded-xl mx-4 sm:mx-6 mb-4 px-3 sm:px-4 py-3">
                      <div className="text-center shrink-0">
                        <p className="font-bold text-gray-900">{format(lot.leaveByTime || lot.arrivalTime, 'h:mm a')}</p>
                        <p className="text-gray-400">Depart</p>
                      </div>
                      <TimelineConnector icon={Car} />
                      <div className="text-center shrink-0">
                        <p className="font-bold text-gray-900">{format(lot.arrivalTime, 'h:mm a')}</p>
                        <p className="text-gray-400">At Lot</p>
                      </div>
                      {classArrival && (
                        <>
                          <TimelineConnector icon={Footprints} />
                          <div className="text-center shrink-0">
                            <p className="font-bold text-gray-900">{format(classArrival, 'h:mm a')}</p>
                            <p className="text-gray-400">At Class</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Navigation button — flush to card bottom, card's overflow-hidden handles rounding */}
                  <button
                    onClick={() => handleNavigate(lot.lat, lot.lng)}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3.5 flex items-center justify-center gap-2 text-xs font-bold text-white transition-colors uppercase tracking-wide"
                  >
                    <Navigation className="size-3.5" /> Start Navigation
                  </button>
                </CardContent>
              </Card>
            );
          })
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
                    onClick={() => handleNavigate(lot.lat, lot.lng)}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 flex items-center justify-center gap-2 text-xs font-bold text-white transition-colors uppercase tracking-wide"
                  >
                    <Navigation className="size-3.5" /> Start Navigation
                  </button>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
