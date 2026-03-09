import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { PageHeader } from '@/app/components/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Calendar, MapPin, Clock, Upload, Settings, Eye, Building2 } from 'lucide-react';
import { format, nextMonday, isWeekend } from 'date-fns';
import { useLocation } from '../hooks/useLocation';
import { cachedFetch } from '@/api/apiCache';
import { getAccessToken } from '@/api/tokenStorage';
import { API_BASE } from '@/api/config';

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
  const { latitude, longitude, loading: locLoading, isDenied, requestLocation } = useLocation();
  const [address, setAddress] = useState<string>("");
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const locationAvailable = !!(latitude && longitude);

  // Added hasAnyData to distinguish between "No Schedule Uploaded" and "No Classes Today"
  const [hasAnyData, setHasAnyData] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [roomNames, setRoomNames] = useState<Record<string, string>>({});

  // Reverse Geocoding Effect
  useEffect(() => {
    if (latitude && longitude) {
      cachedFetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        .then(data => {
          const road = data.address.road || "";
          const city = data.address.city || data.address.town || data.address.village || data.address.suburb || "";
          const displayStr = road ? `${road}, ${city}` : city;
          setAddress(displayStr || "Location Found");
        })
        .catch(() => setAddress("Location Found"));
    }
  }, [latitude, longitude]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    todayClasses.forEach(async (item) => {
      if (!item.classroomId) return;

      if (!roomNames[item.classroomId]) {
        try {
          const data = await cachedFetch(`${API_BASE}/api/classrooms/${item.classroomId}`);
          const displayName = data.building?.name
            ? `${data.building.name} - ${data.location_string}`
            : data.location_string;
          setRoomNames(prev => ({ ...prev, [item.classroomId]: displayName }));
        } catch (error) {
          console.error("Error fetching room name:", error);
        }
      }
    });
  }, [todayClasses]);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!getAccessToken()) {
        setHasAnyData(false);
        return;
      }

      try {
        const data = await cachedFetch(`${API_BASE}/api/schedules/me`, {
          authenticated: true,
        });
        const events = data.events || [];

        setHasAnyData(events.length > 0);

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
      } catch (error) {
        console.error("Error:", error);
        setHasAnyData(false);
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

  const handleLocationRequest = () => {
    if (isDenied) {
      setShowLocationDialog(true);
    } else {
      requestLocation();
    }
  };

  return (
    <div>
      <PageHeader
        title={`Hello, ${displayName}`}
        subtitle={isPreview ? "Monday's Schedule Preview" : "Your schedule for today"}
        actions={
          <>
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
          </>
        }
      />

      <div className="max-w-6xl mx-auto">
        {!hasAnyData ? (
          <Card className="mt-8 text-center p-12 border-dashed border-2">
            <div className="bg-blue-50 size-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="size-8 text-ucr-blue" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Schedule Found</h2>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto">Upload your .ics file to see your classes and parking recommendations.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/dashboard/upload')} className="bg-ucr-blue hover:bg-ucr-blue-dark px-8">
                <Upload className="size-4 mr-2" />
                Upload Now
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/find-by-building')} className="px-8">
                <Building2 className="size-4 mr-2" />
                Find by Building
              </Button>
            </div>
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

              {locationAvailable ? (
                <Card className="p-5 border-none shadow-sm flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-2xl"><MapPin className="text-ucr-blue size-6" /></div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[11px] text-gray-400 uppercase font-black tracking-wider">My Location</p>
                    <p className="text-sm font-bold text-gray-900 leading-tight">
                      {locLoading ? "Locating..." : address}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                      ({latitude?.toFixed(4)}, {longitude?.toFixed(4)})
                    </p>
                  </div>
                </Card>
              ) : (
                <Card
                  className="p-5 border border-amber-200 shadow-sm flex items-center gap-4 cursor-pointer hover:bg-amber-50/50 transition-colors"
                  onClick={handleLocationRequest}
                >
                  <div className="bg-amber-50 p-3 rounded-2xl"><MapPin className="text-amber-600 size-6" /></div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[11px] text-amber-600 uppercase font-black tracking-wider">
                      {locLoading ? "Locating..." : isDenied ? "Location Blocked" : "Location Required"}
                    </p>
                    <p className="text-sm font-bold text-gray-900 leading-tight">
                      {locLoading ? "Checking permissions..." : isDenied ? "Tap for instructions to re-enable" : "Tap to enable location"}
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {!locLoading && !locationAvailable && (
              <Card className="mb-8 border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 p-2 rounded-xl shrink-0">
                    <MapPin className="text-amber-600 size-5" />
                  </div>
                  <div className="flex-1">
                    {isDenied ? (
                      <div>
                        <p className="text-sm font-semibold text-gray-800 mb-1">Location access was blocked</p>
                        <p className="text-sm text-gray-600">
                          Tap the location card above for step-by-step instructions to re-enable location access.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        ParkSmart needs your location to find the closest parking lots. Tap the location card above to enable it.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {isPreview ? "Upcoming Monday" : "Current Schedule"}
               </h2>
               <Button 
                  variant="link" 
                  onClick={() => navigate('/dashboard/schedule')} 
                  className="text-ucr-blue font-semibold hover:no-underline p-0 h-auto"
                >
                  View Full Calendar →
               </Button>
            </div>

            {todayClasses.length === 0 ? (
              <Card className="p-12 text-center bg-white shadow-sm border-2 border-dashed">
                <p className="text-gray-500 font-medium">No classes scheduled for {isPreview ? "this Monday" : "today"}.</p>
              </Card>
            ) : (
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
                          onClick={locationAvailable
                            ? () => navigate(`/dashboard/parking/${item.classroomId}?lat=${latitude}&lng=${longitude}&startTime=${item.startTime.getTime()}`)
                            : handleLocationRequest}
                          disabled={!locationAvailable && locLoading}
                          className={`w-full py-6 text-md font-bold rounded-xl transition-all active:scale-[0.98] ${
                            locationAvailable
                              ? 'bg-ucr-blue hover:bg-ucr-blue-dark shadow-lg shadow-blue-100'
                              : 'bg-gray-400 hover:bg-gray-500'
                          }`}
                        >
                          {locationAvailable ? "Find Optimal Parking" : locLoading ? "Locating..." : "Allow Location to Find Parking"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Find by Building CTA */}
            <Card className="mt-8 p-5 border-none shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate('/dashboard/find-by-building')}
            >
              <div className="bg-blue-50 p-3 rounded-2xl shrink-0">
                <Building2 className="text-ucr-blue size-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Find Parking by Building</h3>
                <p className="text-sm text-gray-500">Search any campus building for optimal parking</p>
              </div>
              <span className="text-ucr-blue font-bold text-lg">→</span>
            </Card>
          </>
        )}
      </div>

      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-amber-600" />
              Re-enable Location Access
            </DialogTitle>
            <DialogDescription>
              You previously blocked location access. Follow these steps to re-enable it:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="bg-ucr-blue text-white size-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                <p className="text-sm text-gray-700">Click the <strong>lock icon</strong> (or site info icon) in your browser's address bar at the top of the page.</p>
              </div>
              <div className="flex gap-3">
                <span className="bg-ucr-blue text-white size-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                <p className="text-sm text-gray-700">Find <strong>"Location"</strong> in the permissions list and change it from "Block" to <strong>"Allow"</strong>.</p>
              </div>
              <div className="flex gap-3">
                <span className="bg-ucr-blue text-white size-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                <p className="text-sm text-gray-700">The page will automatically detect the change — no reload needed.</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">
                <strong>Tip:</strong> On mobile browsers, you may need to go to your device's Settings &gt; Browser &gt; Site Settings &gt; Location to update permissions.
              </p>
            </div>
            <Button
              className="w-full bg-ucr-blue hover:bg-ucr-blue-dark"
              onClick={() => {
                setShowLocationDialog(false);
                requestLocation();
              }}
            >
              I've Updated My Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}