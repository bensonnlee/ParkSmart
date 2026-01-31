import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Calendar, MapPin, Clock, Upload, Settings, ChevronRight } from 'lucide-react';
import { format, addMinutes } from 'date-fns';

interface TodayClass {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  building: string;
  room: string;
}

export default function Home() {
  const navigate = useNavigate();
  const [hasSchedule, setHasSchedule] = useState(true); // Change to false for no-schedule state

  // Mock today's classes - would come from uploaded schedule
  const todayClasses: TodayClass[] = [
    {
      id: '1',
      name: 'CS 100 - Software Construction',
      startTime: new Date(2025, 0, 31, 10, 0),
      endTime: new Date(2025, 0, 31, 11, 15),
      building: 'Olmsted Hall',
      room: '2'
    },
    {
      id: '2',
      name: 'MATH 009A - Calculus',
      startTime: new Date(2025, 0, 31, 14, 0),
      endTime: new Date(2025, 0, 31, 15, 15),
      building: 'Skye Hall',
      room: '268'
    },
    {
      id: '3',
      name: 'ENGL 001A - English Composition',
      startTime: new Date(2025, 0, 31, 16, 30),
      endTime: new Date(2025, 0, 31, 17, 45),
      building: 'Humanities',
      room: '1500'
    }
  ];

  const getNextClass = () => {
    const now = new Date();
    return todayClasses.find(c => c.startTime > now) || todayClasses[0];
  };

  const getClassStatus = (startTime: Date) => {
    const now = new Date();
    const minutesUntil = Math.floor((startTime.getTime() - now.getTime()) / 60000);
    
    if (minutesUntil < 0) return { text: 'In progress', color: 'text-green-600' };
    if (minutesUntil < 30) return { text: `Starts in ${minutesUntil} min`, color: 'text-orange-600' };
    return { text: format(startTime, 'h:mm a'), color: 'text-gray-600' };
  };

  const nextClass = getNextClass();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-ucr-blue">Today's Classes</h1>
              <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM d')}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="text-gray-600"
            >
              <Settings className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {!hasSchedule ? (
          /* No Schedule State */
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <div className="bg-ucr-blue/10 rounded-full size-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="size-8 text-ucr-blue" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No schedule uploaded</h2>
              <p className="text-sm text-gray-600 mb-6">
                Upload your class schedule to get personalized parking recommendations
              </p>
              <Button
                onClick={() => navigate('/upload')}
                className="bg-ucr-blue hover:bg-ucr-blue/90"
              >
                <Upload className="size-4 mr-2" />
                Upload Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Next Class Highlight */}
            {nextClass && (
              <Card className="mb-6 border-l-4 border-l-ucr-gold bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="size-4 text-ucr-gold" />
                    <span className="text-xs font-semibold text-ucr-gold uppercase tracking-wide">
                      Next Class
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{nextClass.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                    <MapPin className="size-3" />
                    {nextClass.building} {nextClass.room}
                  </p>
                  <Button
                    onClick={() => navigate(`/parking/${nextClass.id}`)}
                    className="w-full bg-ucr-blue hover:bg-ucr-blue/90"
                    size="lg"
                  >
                    Get Parking Recommendations
                    <ChevronRight className="size-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-ucr-blue">{todayClasses.length}</p>
                  <p className="text-xs text-gray-600">Classes Today</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-ucr-gold">
                    {nextClass ? format(nextClass.startTime, 'h:mm a') : '--'}
                  </p>
                  <p className="text-xs text-gray-600">Next Class</p>
                </CardContent>
              </Card>
            </div>

            {/* All Classes List */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                All Classes
              </h2>
              {todayClasses.map((classItem) => {
                const status = getClassStatus(classItem.startTime);
                return (
                  <Card key={classItem.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-medium ${status.color}`}>
                              {status.text}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {format(classItem.endTime, 'h:mm a')}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{classItem.name}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="size-3" />
                            {classItem.building} {classItem.room}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/parking/${classItem.id}`)}
                          className="flex-shrink-0"
                        >
                          Get Parking
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Upload Different Schedule */}
            <Button
              variant="ghost"
              onClick={() => navigate('/upload')}
              className="w-full mt-6 text-gray-600"
            >
              <Upload className="size-4 mr-2" />
              Upload Different Schedule
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
