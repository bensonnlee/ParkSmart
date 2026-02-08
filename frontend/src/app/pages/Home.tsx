import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Calendar, MapPin, Clock, Upload, Settings, Eye, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TodayClass {
  id: string;
  name: string;
  courseCode: string;
  startTime: Date;
  endTime: Date;
  building: string;
  room: string;
  imageUrl: string;
  parkingStatus: 'good' | 'tight' | 'full';
}

export default function Home() {
  const storedUser = localStorage.getItem("user");
const user = storedUser ? JSON.parse(storedUser) : null;

const displayName =
  user?.display_name || user?.name || user?.email?.split("@")?.[0] || "there";

  const navigate = useNavigate();
  const [hasSchedule, setHasSchedule] = useState(true);
const [currentTime, setCurrentTime] = useState(new Date());
const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);


  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const uid = user?.id || user?.user_id || user?.supabase_id;
  const scheduleKey = uid ? `schedule:${uid}` : "schedule:guest";
  const raw = localStorage.getItem(scheduleKey);

  if (!raw) {
    setHasSchedule(false);
    setTodayClasses([]);
    return;
  }

  const eventsRaw = JSON.parse(raw);
  const events = Array.isArray(eventsRaw) ? eventsRaw : (eventsRaw.events ?? []);

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const todays = events
    .map((e: any, idx: number) => {
      const start = new Date(e.startTime ?? e.start ?? e.dtstart);
      const end = new Date(e.endTime ?? e.end ?? e.dtend);


      return {
        id: e.id || String(idx),
        name: e.name || e.title || e.summary || "Class",
        courseCode: e.courseCode || "",
        startTime: start,
        endTime: end,
        building: e.building || "TBD",
        room: e.room || "",
        imageUrl: "",
        parkingStatus: "good" as const,
      };
    })
    .filter((c: any) => c.startTime >= startOfDay && c.startTime < endOfDay)
    .sort((a: any, b: any) => a.startTime.getTime() - b.startTime.getTime());

  setHasSchedule(todays.length > 0);
  setTodayClasses(todays);
}, []);

  const getNextClass = () => {
    const now = currentTime;
    return todayClasses.find(c => c.startTime > now) || todayClasses[0];
  };

  const getTimeUntilClass = (startTime: Date) => {
    const diff = startTime.getTime() - currentTime.getTime();
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (diff < 0) {
      const pastMinutes = Math.abs(totalMinutes);
      return { text: `Started ${pastMinutes}m ago`, color: 'text-gray-500' };
    }
    
    if (hours > 0) {
      return { text: `${hours}h ${minutes}m`, color: 'text-gray-900' };
    }
    
    if (minutes > 30) {
      return { text: `${minutes} min`, color: 'text-gray-900' };
    }
    
    if (minutes > 10) {
      return { text: `${minutes} min`, color: 'text-amber-600' };
    }
    
    return { text: `${minutes} min`, color: 'text-red-600' };
  };

  const getParkingStatusBadge = (status: 'good' | 'tight' | 'full') => {
    const statusConfig = {
      good: {
        icon: CheckCircle,
        text: 'Good',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        iconColor: 'text-green-600'
      },
      tight: {
        icon: AlertTriangle,
        text: 'Tight',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        iconColor: 'text-amber-600'
      },
      full: {
        icon: XCircle,
        text: 'Full',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        iconColor: 'text-red-600'
      }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${config.bgColor}`}>
        <Icon className={`size-3.5 ${config.iconColor}`} />
        <span className={`text-xs font-medium ${config.textColor}`}>{config.text}</span>
      </div>
    );
  };

  const getStatusBorderColor = (status: 'good' | 'tight' | 'full') => {
    const colors = {
      good: 'border-l-green-500',
      tight: 'border-l-amber-500',
      full: 'border-l-red-500'
    };
    return colors[status];
  };

  const nextClass = getNextClass();
  const timeInfo = nextClass ? getTimeUntilClass(nextClass.startTime) : null;

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}</h1>
              <p className="text-sm text-gray-500">Here is your schedule and parking status for today.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/settings')}
              className="text-gray-600"
            >
              <Settings className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {!hasSchedule ? (
          /* No Schedule State */
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <div className="bg-blue-50 rounded-full size-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="size-8 text-ucr-blue" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No schedule uploaded</h2>
              <p className="text-sm text-gray-600 mb-6">
                Upload your class schedule to get personalized parking recommendations
              </p>
              <Button
                onClick={() => navigate('/dashboard/upload')}
                className="bg-ucr-blue hover:bg-ucr-blue-dark"
              >
                <Upload className="size-4 mr-2" />
                Upload Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <Calendar className="size-6 text-ucr-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Today's Date</p>
                      <p className="text-xl font-bold text-gray-900">{format(currentTime, 'MMM d')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <Eye className="size-6 text-ucr-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Classes Today</p>
                      <p className="text-xl font-bold text-gray-900">{todayClasses.length} Classes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <Clock className="size-6 text-ucr-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Class Starts In</p>
                      {timeInfo ? (
                        <p className={`text-xl font-bold ${timeInfo.color}`}>
                          {timeInfo.text}
                        </p>
                      ) : (
                        <p className="text-xl font-bold text-gray-400">--:--</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
                <span className="text-sm text-gray-500">{todayClasses.length} events</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard/map')}
                  className="text-ucr-blue border-ucr-blue hover:bg-ucr-blue hover:text-white hidden sm:flex"
                >
                  <MapPin className="size-4 mr-1" />
                  View Map
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/dashboard/planner')}
                  className="text-ucr-blue hover:text-ucr-blue-dark"
                >
                  View Full Calendar →
                </Button>
              </div>
            </div>

            {/* Class Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {todayClasses.map((classItem, index) => (
                <Card 
                  key={classItem.id} 
                  className={`overflow-hidden hover:shadow-lg transition-shadow border-l-4 ${getStatusBorderColor(classItem.parkingStatus)}`}
                >
                  <CardContent className="p-0">
                    {/* Thin Blue Header Strip */}
                    <div className="bg-gradient-to-r from-ucr-blue to-ucr-blue-dark h-2"></div>
                    
                    {/* Card Header */}
                    <div className="p-5 pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              {classItem.courseCode}
                            </span>
                            {index === 0 && (
                              <div className="bg-[#FFD966] text-gray-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                UPCOMING
                              </div>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg">{classItem.name}</h3>
                        </div>
                      </div>

                      {/* Parking Status */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-600">Parking:</span>
                        {getParkingStatusBadge(classItem.parkingStatus)}
                      </div>
                    </div>

                    {/* Class Details */}
                    <div className="px-5 pb-5">
                      <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="size-4 text-gray-500" />
                          <span>
                            {format(classItem.startTime, 'h:mm a')} - {format(classItem.endTime, 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin className="size-4 text-gray-500" />
                          <span>{classItem.building}, {classItem.room}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => navigate(`/dashboard/parking/${classItem.id}`)}
                        className="w-full bg-ucr-blue hover:bg-ucr-blue-dark text-white"
                      >
                        🅿️ Get Parking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}