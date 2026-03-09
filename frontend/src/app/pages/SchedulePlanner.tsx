import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { PageHeader } from '@/app/components/PageHeader';
import { Calendar, MapPin, Info, Upload, Settings, Plus } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { cachedFetch, invalidateCache } from '@/api/apiCache';
import { getAccessToken } from '@/api/tokenStorage';
import { API_BASE } from '@/api/config';
import ClassEventDialog from '@/app/components/ClassEventDialog';

interface ApiEvent {
  id: string;
  event_name: string;
  classroom_id: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
}

interface ClassroomInfo {
  location_string: string;
  building_id?: string | null;
  building_name?: string | null;
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEK_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SchedulePlanner() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIdx, setSelectedDayIdx] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

  const [classroomData, setClassroomData] = useState<Record<string, ClassroomInfo>>({});
  const fetchedClassrooms = useRef(new Set<string>());
  const [refreshKey, setRefreshKey] = useState(0);

  // Dialog state — mode is derived from editingEvent
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{
    id: string;
    event_name: string;
    building_id?: string | null;
    building_name?: string | null;
    room_number?: string | null;
    start_time: string;
    end_time: string;
    days_of_week: number[];
  } | undefined>(undefined);

  const dialogMode = editingEvent ? 'edit' : 'add';

  const handleDialogSuccess = useCallback(() => {
    invalidateCache('/api/schedules');
    invalidateCache('/api/classrooms');
    fetchedClassrooms.current.clear();
    setClassroomData({});
    setRefreshKey(k => k + 1);
  }, []);

  const handleAddClass = useCallback(() => {
    setEditingEvent(undefined);
    setDialogOpen(true);
  }, []);

  const handleEditEvent = useCallback((event: ApiEvent) => {
    const classroom = classroomData[event.classroom_id];
    const locationStr = classroom?.location_string || '';
    const parts = locationStr.split(' Room: ');
    const buildingName = parts.length === 2 ? parts[0] : null;
    const roomNum = parts.length === 2 ? parts[1] : null;

    setEditingEvent({
      id: event.id,
      event_name: event.event_name,
      building_id: classroom?.building_id || null,
      building_name: buildingName || classroom?.building_name || null,
      room_number: roomNum,
      start_time: event.start_time,
      end_time: event.end_time,
      days_of_week: event.days_of_week,
    });
    setDialogOpen(true);
  }, [classroomData]);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!getAccessToken()) { setLoading(false); return; }

      try {
        const data = await cachedFetch(`${API_BASE}/api/schedules/me`, {
          authenticated: true,
        });
        setEvents(data.events || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [refreshKey]);

  useEffect(() => {
    const toFetch = events.filter(
      e => e.classroom_id && !fetchedClassrooms.current.has(e.classroom_id)
    );
    toFetch.forEach(event => fetchedClassrooms.current.add(event.classroom_id));

    Promise.all(
      toFetch.map(async (event) => {
        try {
          const data = await cachedFetch(`${API_BASE}/api/classrooms/${event.classroom_id}`);
          setClassroomData(prev => ({
            ...prev,
            [event.classroom_id]: {
              location_string: data.location_string,
              building_id: data.building_id || null,
              building_name: data.building?.name || null,
            },
          }));
        } catch (e) {
          console.warn("Could not fetch details for:", event.classroom_id);
          setClassroomData(prev => ({
            ...prev,
            [event.classroom_id]: { location_string: `Room ${event.classroom_id.slice(0, 4)}` },
          }));
        }
      })
    );
  }, [events]);

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

  if (loading) return <div className="p-10 text-center font-bold text-ucr-blue">Loading Schedule...</div>;

  return (
    <div>
      <PageHeader
        title="My Schedule"
        subtitle="Your weekly class calendar"
        actions={
          <>
            <Button
              size="sm"
              onClick={handleAddClass}
              className="flex bg-ucr-blue hover:bg-ucr-blue-dark text-white transition-colors"
            >
              <Plus className="size-4 sm:mr-1" />
              <span className="hidden sm:inline-block">Add Class</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/upload')}
              className="flex text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-ucr-blue transition-colors"
            >
              <Upload className="size-4 sm:mr-2" />
              <span className="hidden sm:inline-block">Update Schedule</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/settings')} className="text-gray-500 hover:text-gray-900">
              <Settings className="size-5" />
            </Button>
          </>
        }
      />

      <div className="max-w-4xl mx-auto">
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
                      onClick={() => handleEditEvent(item)}
                      className="p-4 border border-gray-100 rounded-2xl bg-white cursor-pointer hover:border-ucr-blue/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex gap-3 items-start">
                        <div className="shrink-0 bg-gray-50 text-gray-400 p-3 rounded-xl font-black text-xs">
                            {item.shortTime}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-base sm:text-lg wrap-break-word">
                            {item.event_name}
                          </h3>
                          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-1">
                            <MapPin className="size-3 shrink-0" />
                            {classroomData[item.classroom_id]?.location_string || `Room ${item.classroom_id.slice(0,4)}`}
                          </div>
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

      <ClassEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        editData={editingEvent}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
