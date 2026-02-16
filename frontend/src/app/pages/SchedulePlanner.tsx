import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Calendar, MapPin, Info, Upload, Settings, ChevronLeft } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';

interface ApiEvent {
  id: string;
  event_name: string;
  classroom_id: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
}

export default function SchedulePlanner() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIdx, setSelectedDayIdx] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  
  const [roomNames, setRoomNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSchedule = async () => {
      const token = localStorage.getItem("token");
      if (!token) { setLoading(false); return; }

      try {
        const response = await fetch('https://parksmart-api.onrender.com/api/schedules/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  useEffect(() => {
    events.forEach(async (event) => {
      if (!event.classroom_id || roomNames[event.classroom_id]) return;
  
      try {
        const res = await fetch(`https://parksmart-api.onrender.com/api/classrooms/${event.classroom_id}`);
        
        if (res.ok) {
          const data = await res.json();
          const displayName = data.building?.name 
            ? `${data.building.name}: ${data.location_string}`
            : data.location_string;
          
          setRoomNames(prev => ({ ...prev, [event.classroom_id]: displayName }));
        } else {
          setRoomNames(prev => ({ ...prev, [event.classroom_id]: `Room ${event.classroom_id.slice(0, 4)} (unlisted)` }));
        }
      } catch (e) {
        console.warn("Could not fetch room details for:", event.classroom_id);
      }
    });
  }, [events]);

  const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const WEEK_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const { weekDates, rangeString } = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return {
      weekDates: Array.from({ length: 7 }, (_, i) => addDays(start, i).getDate()),
      rangeString: `${format(start, 'MMM d')} - ${format(addDays(start, 6), 'MMM d')}`
    };
  }, []);

  const classesForSelectedDay = useMemo(() => {
    return events
      .filter(event => event.days_of_week.includes(selectedDayIdx))
      .map(event => ({
        ...event,
        shortTime: event.start_time.slice(0, 5)
      }))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [events, selectedDayIdx]);

  if (loading) return <div className="p-10 text-center font-bold text-ucr-blue">Loading Your Plan...</div>;

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-20 px-4 pt-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="hover:bg-gray-200">
              <ChevronLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Weekly Plan</h1>
              <p className="text-gray-500 text-xs font-medium italic">Optimized parking based on your schedule</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => navigate('/dashboard/upload')}
              variant="outline"
              className="bg-white border-gray-200 text-gray-600 hover:text-ucr-blue hover:border-ucr-blue shadow-sm transition-all"
            >
              <Upload className="size-4 mr-2" />
              <span className="font-bold text-xs uppercase tracking-tight">Update ICS</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/settings')} className="text-gray-400 hover:text-gray-600">
              <Settings className="size-5" />
            </Button>
          </div>
        </div>

        <Card className="shadow-xl border-none rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="bg-ucr-blue p-6 text-white flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Current Range</p>
                <h2 className="text-xl font-bold">{rangeString}</h2>
              </div>
              <Calendar className="size-8 text-blue-300 opacity-50" />
            </div>

            <div className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-10">
                {WEEK_LABELS_SHORT.map((day, i) => {
                  const isSelected = selectedDayIdx === i;
                  const hasClasses = events.some(event => event.days_of_week.includes(i));
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDayIdx(i)}
                      className={`relative flex flex-col items-center p-3 rounded-2xl transition-all border-2 ${
                        isSelected ? 'border-ucr-blue bg-blue-50 shadow-md transform scale-105' : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`text-[10px] font-black uppercase mb-1 ${isSelected ? 'text-ucr-blue' : 'text-gray-400'}`}>{day}</span>
                      <span className={`text-xl font-black ${isSelected ? 'text-ucr-blue' : 'text-gray-900'}`}>{weekDates[i]}</span>
                      {hasClasses && (
                        <div className={`absolute -top-1 -right-1 size-3 rounded-full border-2 border-white ${isSelected ? 'bg-ucr-gold' : 'bg-gray-300'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
                  
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-px bg-gray-200 flex-1" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
                        {WEEK_DAYS[selectedDayIdx]} Events
                    </span>
                    <div className="h-px bg-gray-200 flex-1" />
                </div>

                {classesForSelectedDay.length > 0 ? (
                  classesForSelectedDay.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => navigate(`/dashboard/parking/${item.classroom_id}`)} // Updated to pass real ID
                      className="group flex items-center justify-between p-5 border border-gray-100 rounded-2xl bg-white hover:border-ucr-blue hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-ucr-blue p-3 rounded-xl transition-colors font-black text-xs">
                            {item.shortTime}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-ucr-blue transition-colors">
                            {item.event_name}
                          </h3>
                          <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              {/* UPDATED: Show live name from roomNames, fallback to original logic */}
                              {roomNames[item.classroom_id] || `Room ${item.classroom_id.slice(0,4)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100">
                          <p className="text-[8px] text-ucr-blue font-black uppercase tracking-widest mb-1">Recommended</p>
                          <p className="font-black text-gray-900">LOT 30</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl">
                    <Info className="size-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No classes scheduled</p>
                    <p className="text-gray-300 text-[10px] mt-1">Enjoy your day off!</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}