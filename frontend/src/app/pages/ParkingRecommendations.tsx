import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { ArrowLeft, MapPin, Footprints, CheckCircle, Navigation } from 'lucide-react';
import { format, subMinutes } from 'date-fns';

export default function ParkingRecommendations() {
  const { classId } = useParams<{ classId: string }>(); 
  const navigate = useNavigate();

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
        const baseUrl = "https://parksmart-api.onrender.com/api";

        // We fetch both the classroom details and the list of associated parking lots
        const [classRes, listRes] = await Promise.all([
          fetch(`${baseUrl}/classrooms/${classId}`),
          fetch(`${baseUrl}/classrooms/${classId}/lots`)
        ]);

        const classData = await classRes.json();
        const listData = await listRes.json();
        const rawLots = listData.lots || [];


         // fetch the specific details for the top 3 recommended lots.
        const detailedLots = await Promise.all(
          rawLots.slice(0, 3).map(async (lot: any) => {
            const detailRes = await fetch(`${baseUrl}/lots/${lot.id}`);
            return await detailRes.json();
          })
        );

        // Classroom Info
        setClassInfo({
          name: classData.building?.name || "Building",
          room: classData.location_string?.split('Room:')[1]?.trim() || "1501",
          startTime: new Date().setHours(11, 0, 0) // Static 11:00 AM for demo
        });

        // Mapping hydrated API data into our UI component's expected structure
        const formattedLots = detailedLots.map((lot: any, index: number) => ({
          id: lot.id,
          name: lot.name,
          currentSpots: lot.free_spaces ?? 0, 
          totalSpots: lot.total_spaces ?? 0,   
          walkingTime: lot.walking_distance_minutes ?? 5,
          lat: lot.latitude,
          lng: lot.longitude,
          badge: index === 0 ? "BEST MATCH" : "VALUE"
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
  }, [classId]);

  // Opens Google Maps in a new tab with the lot coordinates
  const handleNavigate = (lat: string, lng: string) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F8FB]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="font-bold text-gray-500">Syncing live parking availability...</p>
    </div>
  );

  // Logic: Leave Time = Class Start - (Buffer Time + Walking Time)
  const walkTime = recommendations[0]?.walkingTime || 8;
  const leaveByTime = subMinutes(classInfo?.startTime || new Date(), (20 + walkTime));

  return (
    <div className="min-h-screen bg-[#F6F8FB] p-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="size-5 mr-2" /> Back
        </Button>

        {/* Header Section */}
        <h1 className="text-2xl font-black mb-1">
          {classInfo?.name}{' '}Room {classInfo?.room}
        </h1>

        {/* Hero Leave Time Card */}
        <Card className="mb-8 border-none shadow-lg bg-blue-700 text-white p-10 text-center rounded-[2.5rem]">
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2">Leave By</p>
          <p className="text-6xl font-black">{format(leaveByTime, 'h:mm a')}</p>
        </Card>

        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <CheckCircle className="size-4 text-green-500" /> Optimal Parking Lots
        </h2>

        {/* Lot Recommendation List */}
        {recommendations.map((lot) => (
          <Card key={lot.id} className="mb-4 border-none shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-gray-900">{lot.name}</h3>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase">
                      {lot.badge}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Footprints className="size-4" /> {lot.walkingTime} min walk
                  </p>
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
        ))}
      </div>
    </div>
  );
}