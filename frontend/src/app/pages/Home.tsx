import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Calendar, MapPin, Clock, Upload, Settings, Eye, CheckCircle, AlertTriangle, XCircle, Edit2, Check } from 'lucide-react';
import { format, startOfWeek, addDays, nextMonday, isWeekend } from 'date-fns';
import { useLocation } from '../hooks/useLocation';

interface TodayClass {
  id: string;
  classroomId: string;
  name: string;
  courseCode: string;
  startTime: Date;
  endTime: Date;
  room: string;
  buildingName: string; 
}

export default function Home() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const displayName = user?.display_name || user?.name || user?.email?.split("@")?.[0] || "there";

  const navigate = useNavigate();
  
  // Location States
  const { latitude, longitude, error: locError, loading: locLoading } = useLocation();
  const [address, setAddress] = useState<string>("Locating...");
  const [isEditing, setIsEditing] = useState(false);
  const [manualAddress, setManualAddress] = useState("");

  const [hasSchedule, setHasSchedule] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [roomNames, setRoomNames] = useState<Record<string, string>>({});
  const [recommendedLots, setRecommendedLots] = useState<Record<string, string>>({});

  // Reverse Geocoding Effect
  useEffect(() => {
    if (latitude && longitude && !manualAddress) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        .then(res => res.json())
        .then(data => {
          const road = data.address.road || "";
          const city = data.address.city || data.address.town || data.address.village || data.address.suburb || "";
          const displayStr = road ? `${road}, ${city}` : city;
          setAddress(displayStr || "Location Found");
        })
        .catch(() => setAddress("Location Found"));
    }
  }, [latitude, longitude, manualAddress]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    todayClasses.forEach(async (item) => {
      if (!item.classroomId) return;

      if (!roomNames[item.classroomId]) {
        try {
          const response = await fetch(`https://parksmart-api.onrender.com/api/classrooms/${item.classroomId}`);
          if (response.ok) {
            const data = await response.json();
            const displayName = data.building?.name 
              ? `${data.building.name} - ${data.location_string}`
              : data.location_string;
            setRoomNames(prev => ({ ...prev, [item.classroomId]: displayName }));
          }
        } catch (error) {
          console.error("Error fetching room name:", error);
        }
      }
      if (!recommendedLots[item.classroomId]) {
        try {
          const lotRes = await fetch(`https://parksmart-api.onrender.com/api/lots/from-location?lat=${latitude}&lon=${longitude}`);
          if (lotRes.ok) {
            const lotData = await lotRes.json();
            if (lotData.lots && lotData.lots.length > 0) {
              const topLotName = lotData.lots[0].name; 
              setRecommendedLots(prev => ({ ...prev, [item.classroomId]: topLotName }));
            } else {
              setRecommendedLots(prev => ({ ...prev, [item.classroomId]: "Lot 30" }));
            }
          }
        } catch (error) {
          console.error("Error fetching lots:", error);
          setRecommendedLots(prev => ({ ...prev, [item.classroomId]: "Lot 30" }));
        }
      }
    });
  }, [todayClasses]);

  useEffect(() => {
    const fetchSchedule = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setHasSchedule(false);
        return;
      }

      try {
        const response = await fetch('https://parksmart-api.onrender.com/api/schedules/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        const events = data.events || [];

        const now = new Date();
        const todayDayOfWeek = now.getDay(); 
        const weekend = isWeekend(now);
        setIsPreview(weekend);
        
        const targetDayIdx = weekend ? 0 : (todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1);
        const referenceDate = weekend ? nextMonday(now) : now;

        const todays = events
          .filter((e: any) => e.days_of_week.includes(targetDayIdx))
          .map((e: any) => {
            const [hours, minutes] = e.start_time.split(':');
            const [eHours, eMinutes] = e.end_time.split(':');
            
            const startDate = new Date(referenceDate);
            startDate.setHours(parseInt(hours), parseInt(minutes), 0);
            
            const endDate = new Date(referenceDate);
            endDate.setHours(parseInt(eHours), parseInt(eMinutes), 0);

            return {
              id: e.id,
              classroomId: e.classroom_id,
              name: e.event_name,
              courseCode: e.event_name.split(' ').slice(-2).join(' '),
              startTime: startDate,
              endTime: endDate,
              building: "TBD",
              room: "Room " + (e.classroom_id.slice(0, 4)), 
              imageUrl: "",
              parkingStatus: "good" as const,
            };
          })
          .sort((a: TodayClass, b: TodayClass) => a.startTime.getTime() - b.startTime.getTime());

        setTodayClasses(todays);
        setHasSchedule(todays.length > 0);
      } catch (error) {
        console.error("Error:", error);
        setHasSchedule(false);
      }
    };

    fetchSchedule();
  }, []);

  const getTimeUntilClass = (classItem: TodayClass) => {
    const diff = classItem.startTime.getTime() - currentTime.getTime();
    const totalMinutes = Math.floor(diff / (1000 * 60));
    
    if (totalMinutes > 0) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const timeStr = hours > 0 ? `${hours}hr ${minutes}m` : `${minutes}m`;
      return { 
        text: timeStr, 
        color: totalMinutes <= 30 ? 'text-amber-600' : 'text-gray-900' 
      };
    }
    
    if (currentTime >= classItem.startTime && currentTime <= classItem.endTime) {
      return { text: "In Progress", color: 'text-amber-600' };
    }
    
    return { text: "Completed", color: 'text-gray-400' };
  };

  const nextClass = todayClasses.find(c => c.endTime > currentTime) || todayClasses[0];
  const timeInfo = nextClass ? getTimeUntilClass(nextClass) : null;

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <div className="bg-white border-b sticky top-0 z-10 px-4 py-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">
              Hello, {displayName}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {isPreview ? "Monday's Schedule Preview" : "Your schedule for today"}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/dashboard/upload')}
              className="flex text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-ucr-blue transition-colors"
            >
              <Upload className="size-4 mr-2" />
              <span className="inline-block">Update Schedule</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard/settings')}
              className="text-gray-500 hover:text-gray-900"
            >
              <Settings className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {!hasSchedule ? (
          <Card className="mt-8 text-center p-12 border-dashed border-2">
            <div className="bg-blue-50 size-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="size-8 text-ucr-blue" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Schedule Found</h2>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto">Upload your .ics file to see your classes and parking recommendations.</p>
            <Button onClick={() => navigate('/dashboard/upload')} className="bg-ucr-blue hover:bg-ucr-blue-dark px-8">
              <Upload className="size-4 mr-2" />
              Upload Now
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-5 border-none shadow-sm flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl"><Calendar className="text-ucr-blue size-6" /></div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-black tracking-wider">Date</p>
                  <p className="text-lg font-bold text-gray-900">{format(currentTime, 'MMM d, yyyy')}</p>
                </div>
              </Card>

              <Card className="p-5 border-none shadow-sm flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl"><Eye className="text-ucr-blue size-6" /></div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-black tracking-wider">Events</p>
                  <p className="text-lg font-bold text-gray-900">{todayClasses.length} {todayClasses.length === 1 ? 'Class' : 'Classes'}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      {isPreview ? 'Monday' : 'Today'}
                    </span>
                  </p>
                </div>
              </Card>

              <Card className="p-5 border-none shadow-sm flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl"><Clock className="text-ucr-blue size-6" /></div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-black tracking-wider">Next Start</p>
                  <p className={`text-lg font-bold ${timeInfo?.color || 'text-gray-400'}`}>
                    {timeInfo?.text || "--:--"}
                  </p>
                </div>
              </Card>

              <Card 
                className="p-5 border-none shadow-sm flex items-center gap-4 cursor-pointer group relative"
                onClick={() => !isEditing && setIsEditing(true)}
              >
                <div className="bg-blue-50 p-3 rounded-2xl"><MapPin className="text-ucr-blue size-6" /></div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] text-gray-400 uppercase font-black flex justify-between items-center">
                    My Location
                    {!isEditing && <Edit2 className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </p>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                      <input 
                        autoFocus
                        className="text-sm font-bold bg-gray-50 border-b-2 border-ucr-blue outline-none w-full py-0.5"
                        value={manualAddress}
                        placeholder="Type city..."
                        onChange={(e) => setManualAddress(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                        onBlur={() => setIsEditing(false)}
                      />
                      <button onClick={() => setIsEditing(false)} className="text-ucr-blue">
                        <Check className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-gray-900 leading-tight">
                        {manualAddress || (locLoading ? "Locating..." : locError ? "Location Hidden" : address)}
                      </p>
                      {!manualAddress && !locLoading && !locError && (
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                          ({latitude?.toFixed(4)}, {longitude?.toFixed(4)})
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {isPreview ? "Upcoming Monday" : "Current Schedule"}
                <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full uppercase">Live</span>
               </h2>
               <Button 
                  variant="link" 
                  onClick={() => navigate('/dashboard/planner')} 
                  className="text-ucr-blue font-semibold hover:no-underline p-0 h-auto"
                >
                  View Full Calendar →
               </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {todayClasses.map((item) => {
                const isNext = nextClass?.id === item.id;
                return (
                  <Card key={item.id} className={`group relative overflow-hidden transition-all hover:shadow-md ${isNext ? 'ring-2 ring-ucr-blue ring-offset-2' : ''}`}>
                    <div className="bg-ucr-blue h-1.5 w-full" />
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[10px] font-bold text-ucr-blue uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                            {item.courseCode}
                          </span>
                          <h3 className="font-extrabold text-xl text-gray-900 mt-2 group-hover:text-ucr-blue transition-colors">
                            {item.name}
                          </h3>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-green-100">
                             <CheckCircle className="size-3.5" /> 
                             {recommendedLots[item.classroomId] || "Lot 30"}
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                          <Clock className="size-4 text-gray-400" />
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase font-bold">Time</p>
                            <p className="text-sm font-semibold">{format(item.startTime, 'h:mm a')}</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                          <MapPin className="size-4 text-gray-400" />
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase font-bold">Location</p>
                            <p className="text-sm font-semibold truncate max-w-[100px]">
                              {roomNames[item.classroomId] || item.room}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={() => navigate(`/dashboard/parking/${item.classroomId}`)} 
                        className="w-full bg-ucr-blue hover:bg-ucr-blue-dark py-6 text-md font-bold rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                      >
                      Find Optimal Parking
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}