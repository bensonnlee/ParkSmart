import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { ArrowLeft, MapPin, Footprints, Car, CheckCircle, Navigation, AlertCircle } from 'lucide-react';
import { format, subMinutes } from 'date-fns';
import { cachedFetch } from '@/api/apiCache';
import { API_BASE } from '@/api/config';
import { loadPrefs } from '@/lib/prefs';

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

  useEffect(() => {
    if (!classId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Always fetch classroom + walking-distance lots; optionally fetch driving distances
        const fetches: [Promise<any>, Promise<any>, Promise<any> | null] = [
          cachedFetch(`${API_BASE}/api/classrooms/${classId}`),
          cachedFetch(`${API_BASE}/api/classrooms/${classId}/lots`),
          userLat && userLng
            ? cachedFetch(`${API_BASE}/api/classrooms/lots/from-location?latitude=${userLat}&longitude=${userLng}`)
            : null,
        ];

        const [classData, walkData, driveData] = await Promise.all(
          fetches.map(p => p ?? Promise.resolve(null))
        );

        // Walking lots from /{classId}/lots (always available)
        const walkLots: any[] = walkData?.lots || [];
        // Driving lots from from-location (only when user location provided)
        const driveLots: any[] = driveData ? (Array.isArray(driveData) ? driveData : []) : [];

        // Use driving-sorted order when available, otherwise walking-sorted
        const rawLots = driveLots.length > 0 ? driveLots : walkLots;

        // Build lookup maps for both travel times
        const walkTimeMap = new Map(walkLots.map((lot: any) => [lot.id, lot.travel_minutes]));
        const driveTimeMap = new Map(driveLots.map((lot: any) => [lot.id, lot.travel_minutes]));

        // Fetch specific details (availability) for the top 3 recommended lots
        const settledResults = await Promise.allSettled(
          rawLots.slice(0, 3).map(async (lot: any) => {
            const detail = await cachedFetch(`${API_BASE}/api/lots/${lot.id}`, { ttl: 60_000 });
            return detail;
          })
        );

        const detailedLots = settledResults
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
          .map(r => r.value);

        // Classroom Info
        setClassInfo({
          name: classData.building?.name || "Building",
          room: classData.location_string?.split('Room:')[1]?.trim() || classData.location_string || "",
          startTime: startTimeParam ? new Date(Number(startTimeParam)) : null,
        });

        // Mapping hydrated API data into our UI component's expected structure
        const formattedLots = detailedLots.map((lot: any) => ({
          id: lot.id,
          name: lot.name,
          currentSpots: lot.free_spaces ?? 0,
          totalSpots: lot.total_spaces ?? 0,
          walkMinutes: walkTimeMap.get(lot.id) ?? null,
          driveMinutes: driveTimeMap.get(lot.id) ?? null,
          lat: lot.latitude,
          lng: lot.longitude,
        }));

        setRecommendations(formattedLots);

      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, userLat, userLng, startTimeParam]);

  // Opens Google Maps in a new tab with the lot coordinates
  const handleNavigate = (lat: string, lng: string) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  // Compute "Leave By" time from user prefs (memoized to avoid repeated localStorage reads)
  // Must be called before early returns to satisfy React's rules of hooks
  const prefs = useMemo(() => loadPrefs(), []);
  const hasStartTime = !!classInfo?.startTime;
  const leaveByTime = hasStartTime
    ? subMinutes(classInfo.startTime, prefs.arrivalBuffer + (recommendations[0]?.walkMinutes || 0) + (recommendations[0]?.driveMinutes || 0))
    : null;

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

        {/* Hero Leave Time Card */}
        {leaveByTime ? (
          <Card className="mb-8 border-none shadow-lg bg-blue-700 text-white p-10 text-center rounded-[2.5rem]">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2">Leave By</p>
            <p className="text-6xl font-black">{format(leaveByTime, 'h:mm a')}</p>
          </Card>
        ) : (
          <Card className="mb-8 border-dashed border-2 border-gray-300 bg-gray-50 p-10 text-center rounded-[2.5rem]">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Leave By</p>
            <p className="text-3xl font-bold text-gray-300">—</p>
            <p className="text-xs text-gray-400 mt-2">Navigate from your schedule for departure times</p>
          </Card>
        )}

        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
          <CheckCircle className="size-4 text-green-500" /> Optimal Parking Lots
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          {usingUserLocation ? "Sorted by driving distance from your location" : "Sorted by walking distance from classroom"}
        </p>

        {/* Empty state */}
        {recommendations.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300 p-10 text-center rounded-2xl">
            <MapPin className="size-8 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-500 mb-1">No Parking Lots Found</h3>
            <p className="text-sm text-gray-400">We couldn't find any nearby parking lots for this classroom.</p>
          </Card>
        ) : (
          /* Lot Recommendation List */
          recommendations.map((lot) => (
            <Card key={lot.id} className="mb-4 border-none shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{lot.name}</h3>
                    <div className="flex items-center gap-3">
                      {lot.driveMinutes != null && (
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <Car className="size-4" /> ~{Math.round(lot.driveMinutes)} min drive
                        </p>
                      )}
                      {lot.walkMinutes != null && (
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <Footprints className="size-4" /> ~{Math.round(lot.walkMinutes)} min walk
                        </p>
                      )}
                      {lot.driveMinutes == null && lot.walkMinutes == null && (
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <Footprints className="size-4" /> —
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-gray-900">
                      {lot.currentSpots}<span className="text-sm text-gray-300 font-bold">/{lot.totalSpots}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Spots Left</p>
                  </div>
                </div>

                <button
                  onClick={() => handleNavigate(lot.lat, lot.lng)}
                  className="w-full bg-gray-50 py-3 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] font-bold text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-all uppercase"
                >
                  <Navigation className="size-3" /> Start Navigation
                </button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
