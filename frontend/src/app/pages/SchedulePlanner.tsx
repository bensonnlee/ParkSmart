import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Upload, Globe, Info, Calendar, MapPin, ParkingCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentWeek, setCurrentWeek] = useState(0);

  // Mock schedule data - this would come from uploaded schedule or R'Web
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast.success(`Schedule uploaded: ${file.name}`);
      setScheduleUploaded(true);
    }
  };

  const handleRWebConnect = () => {
    toast.info('Redirecting to UCR Single Sign-On...');
    // In real implementation, this would redirect to UCR SSO
    setTimeout(() => {
      toast.success('Connected to R\'Web Portal');
      setScheduleUploaded(true);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPTIMAL PLAN':
        return 'bg-green-100 text-green-700';
      case 'BUSY MORNING':
        return 'bg-yellow-100 text-yellow-700';
      case 'PEAK HOURS':
        return 'bg-orange-100 text-orange-700';
      case 'LOW TRAFFIC':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDates = [27, 28, 29, 30, 31, 1, 2];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ucr-blue mb-2">Schedule-Based Parking Planner</h1>
          <p className="text-gray-600">
            Upload your class schedule to generate a personalized parking plan based on historical data and real-time walk speeds.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Import Schedule */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="size-5 text-ucr-blue" />
                  <h2 className="font-semibold text-lg">Import Your Schedule</h2>
                </div>

                {/* File Upload Area */}
                <div className="mb-4">
                  <div className="border-2 border-dashed border-ucr-gold rounded-lg p-8 text-center bg-amber-50">
                    <div className="flex justify-center mb-3">
                      <div className="bg-white p-3 rounded-full">
                        <Upload className="size-6 text-ucr-blue" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">Drop your schedule PDF here</p>
                    <p className="text-xs text-gray-500 mb-3">or click to browse files</p>
                    <label htmlFor="file-upload">
                      <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                        <span className="text-xs">PDF, ICS, or Sownload</span>
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.ics"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500 my-3">OR</div>

                {/* R'Web Connect Button */}
                <Button
                  onClick={handleRWebConnect}
                  className="w-full bg-ucr-blue hover:bg-ucr-blue/90"
                >
                  <Globe className="size-4 mr-2" />
                  Connect R'Web Portal
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">Secured with UCR Single Sign-On (CAS)</p>

                {/* How It Works */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="size-4 text-ucr-blue mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-ucr-blue mb-1">How it works</h3>
                      <p className="text-xs text-gray-700">
                        We analyze your class locations and times against 5 years of parking data to predict which lots will have spaces when you arrive.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Predicted Schedule */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-5 text-ucr-gold" />
                    <h2 className="font-semibold text-lg">Predicted Parking Schedule</h2>
                  </div>
                  <span className="text-sm text-gray-500">Jan 27 - Jan 31</span>
                </div>

                {!scheduleUploaded ? (
                  <div className="text-center py-12 text-gray-400">
                    <Upload className="size-12 mx-auto mb-3 opacity-50" />
                    <p>Upload your schedule to see personalized recommendations</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockSchedule.map((classItem) => (
                      <Card key={classItem.id} className="border-l-4 border-l-ucr-blue">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Day and Status */}
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">{classItem.day}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(classItem.status)}`}>
                                  {classItem.status}
                                </span>
                              </div>

                              {/* Class Info */}
                              <div className="flex items-start gap-3 mb-3">
                                <div className="bg-ucr-blue/10 p-2 rounded">
                                  <Calendar className="size-5 text-ucr-blue" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500 uppercase tracking-wide">First Class</p>
                                  <p className="font-semibold text-gray-900">{classItem.courseName}</p>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <MapPin className="size-3" />
                                    {classItem.location} • {classItem.startTime}
                                  </p>
                                </div>
                              </div>

                              {/* Parking Target */}
                              <div className="flex items-center gap-2 text-sm">
                                <ParkingCircle className="size-4 text-ucr-gold" />
                                <span className="font-medium">Target: {classItem.targetLot}</span>
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                  {classItem.availability}% Historical Availability
                                </span>
                              </div>
                            </div>

                            {/* Recommended Leave Time */}
                            <div className="bg-ucr-blue text-white rounded-lg p-4 text-center min-w-[140px]">
                              <p className="text-xs opacity-90 mb-1">RECOMMENDED LEAVE BY</p>
                              <p className="text-2xl font-bold">{classItem.recommendedLeaveTime}</p>
                              <p className="text-xs opacity-75 mt-1">Includes 8 min walk + 10 min buffer</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Weekly Calendar View */}
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Week Overview</h3>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <ChevronLeft className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="size-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((day, index) => (
                          <div key={day} className="text-center">
                            <p className="text-xs text-gray-500 mb-2">{day}</p>
                            <div className="bg-white border rounded-lg p-2 min-h-[60px]">
                              <p className="text-sm font-semibold text-gray-900 mb-1">{weekDates[index]}</p>
                              {mockSchedule.find(c => c.day.startsWith(day.slice(0, 3))) && (
                                <p className="text-xs text-ucr-blue font-medium">
                                  {mockSchedule.find(c => c.day.startsWith(day.slice(0, 3)))?.targetLot}
                                </p>
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
