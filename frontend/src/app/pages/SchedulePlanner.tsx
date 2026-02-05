import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { 
  Upload, Globe, Info, Calendar, MapPin, 
  ParkingCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleClass {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  courseName: string;
  location: string;
  startTime: string;
  recommendedLeaveTime: string;
  targetLot: string;
  availability: number;
  status: 'OPTIMAL PLAN' | 'BUSY MORNING' | 'PEAK HOURS' | 'LOW TRAFFIC';
}

export default function SchedulePlanner() {
  const [scheduleUploaded, setScheduleUploaded] = useState(false);

  // Define mockSchedule FIRST so it is available for the calendar grid
  const mockSchedule: ScheduleClass[] = [
    {
      id: '1',
      day: 'Monday',
      courseName: 'CS 100 - Software Construction',
      location: 'Olmsted Hall 2',
      startTime: '10:00 AM',
      recommendedLeaveTime: '9:32 AM',
      targetLot: 'Lot 13',
      availability: 92,
      status: 'OPTIMAL PLAN'
    },
    {
      id: '2',
      day: 'Tuesday',
      courseName: 'PSYC 002 - Intro Psychology',
      location: 'UNLH 1000',
      startTime: '8:30 AM',
      recommendedLeaveTime: '7:55 AM',
      targetLot: 'Big Springs 2',
      availability: 65,
      status: 'BUSY MORNING'
    },
    {
      id: '3',
      day: 'Wednesday',
      courseName: 'CS 100 - Software Construction',
      location: 'Olmsted Hall 2',
      startTime: '10:00 AM',
      recommendedLeaveTime: '9:32 AM',
      targetLot: 'Lot 13',
      availability: 92,
      status: 'OPTIMAL PLAN'
    },
    {
      id: '4',
      day: 'Thursday',
      courseName: 'MATH 009A - Calculus',
      location: 'Skye Hall 268',
      startTime: '2:00 PM',
      recommendedLeaveTime: '1:35 PM',
      targetLot: 'Lot 30',
      availability: 78,
      status: 'LOW TRAFFIC'
    },
    {
      id: '5',
      day: 'Friday',
      courseName: 'ENGL 001A - English Composition',
      location: 'Humanities 1500',
      startTime: '11:00 AM',
      recommendedLeaveTime: '10:28 AM',
      targetLot: 'Lot 6',
      availability: 55,
      status: 'PEAK HOURS'
    }
  ];

  // Helper function to calculate the dynamic date range
  const getWeekData = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); 
    
    const monday = new Date(now);
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(now.getDate() + diffToMonday);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDates.push(day.getDate());
    }

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const rangeString = `${monday.toLocaleDateString('en-US', options)} - ${friday.toLocaleDateString('en-US', options)}`;

    return { weekDates, rangeString };
  };

  const { weekDates, rangeString } = getWeekData();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPTIMAL PLAN': return 'bg-green-100 text-green-700';
      case 'BUSY MORNING': return 'bg-yellow-100 text-yellow-700';
      case 'PEAK HOURS': return 'bg-orange-100 text-orange-700';
      case 'LOW TRAFFIC': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ucr-blue mb-2 uppercase tracking-tight">Parking Planner</h1>
          <p className="text-gray-600">Your personalized commute schedule based on R'Web data.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Import Column */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="size-5 text-ucr-blue" />
                  <h2 className="font-semibold text-lg">Import Schedule</h2>
                </div>
                
                <div className="border-2 border-dashed border-ucr-gold rounded-lg p-8 text-center bg-amber-50 mb-4">
                  <Upload className="size-6 text-ucr-blue mx-auto mb-3" />
                  <p className="text-sm font-medium">Drop PDF here</p>
                  <input type="file" className="hidden" id="pdf-upload" onChange={() => setScheduleUploaded(true)} />
                  <label htmlFor="pdf-upload" className="mt-3 block">
                    <Button variant="outline" size="sm" asChild>
                      <span>Browse Files</span>
                    </Button>
                  </label>
                </div>

                <Button onClick={() => setScheduleUploaded(true)} className="w-full bg-ucr-blue">
                  <Globe className="size-4 mr-2" />
                  Connect R'Web Portal
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Column */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-xl flex items-center gap-2">
                    <Calendar className="size-5 text-ucr-gold" />
                    Weekly Predictions
                  </h2>
                  <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {rangeString}
                  </span>
                </div>

                {!scheduleUploaded ? (
                  <div className="text-center py-20 text-gray-400 border-2 border-dotted rounded-xl">
                    <Info className="size-10 mx-auto mb-4 opacity-20" />
                    <p>Sync your portal to see lot predictions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockSchedule.map((item) => (
                      <div key={item.id} className="border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-ucr-blue">{item.day}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-800">{item.courseName}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><MapPin className="size-3" />{item.location}</span>
                            <span className="flex items-center gap-1"><ParkingCircle className="size-3 text-ucr-gold" />{item.targetLot}</span>
                          </div>
                        </div>
                        <div className="text-right bg-ucr-blue text-white px-4 py-2 rounded-lg">
                          <p className="text-[10px] opacity-80 uppercase">Leave By</p>
                          <p className="text-xl font-black">{item.recommendedLeaveTime}</p>
                        </div>
                      </div>
                    ))}

                    {/* Dynamic Calendar Grid */}
                    <div className="mt-8 pt-6 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">Overview</h3>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="size-8"><ChevronLeft /></Button>
                          <Button variant="ghost" size="icon" className="size-8"><ChevronRight /></Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((day, i) => (
                          <div key={day} className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{day}</p>
                            <div className="border rounded-lg py-2 bg-white">
                              <p className="text-sm font-black">{weekDates[i]}</p>
                              {/* Error Fix: 'c' now has a type from the mockSchedule map */}
                              {mockSchedule.some(c => c.day.startsWith(day)) && (
                                <div className="size-1.5 bg-ucr-gold rounded-full mx-auto mt-1" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}