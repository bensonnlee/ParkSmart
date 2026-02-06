import { useState } from 'react';
import { Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { format, addDays, addMinutes, setHours, setMinutes } from 'date-fns';

interface TimeSelectorProps {
  mode: 'depart' | 'arrive';
  selectedTime: Date;
  onModeChange: (mode: 'depart' | 'arrive') => void;
  onTimeChange: (time: Date) => void;
}

export function TimeSelector({ mode, selectedTime, onModeChange, onTimeChange }: TimeSelectorProps) {
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [leaveNow, setLeaveNow] = useState(false);

  const adjustTime = (minutes: number) => {
    onTimeChange(addMinutes(selectedTime, minutes));
  };

  const adjustDate = (days: number) => {
    onTimeChange(addDays(selectedTime, days));
  };

  const setSpecificTime = (hours: number, mins: number) => {
    let newTime = setHours(selectedTime, hours);
    newTime = setMinutes(newTime, mins);
    onTimeChange(newTime);
    setIsTimeOpen(false);
  };

  const handleModeChange = (value: string) => {
    if (value === 'now') {
      setLeaveNow(true);
      onTimeChange(new Date());
      onModeChange('depart');
    } else {
      setLeaveNow(false);
      onModeChange(value as 'depart' | 'arrive');
    }
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        times.push({ hours: h, minutes: m });
      }
    }
    return times;
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">Time</Label>
      <div className="bg-white rounded-lg border p-3 space-y-3">
        {/* Depart/Arrive/Leave Now Toggle - Top Row */}
        <Select value={leaveNow ? 'now' : mode} onValueChange={handleModeChange}>
          <SelectTrigger className="w-full border-0 focus:ring-0 h-auto p-0">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-ucr-blue flex-shrink-0" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="now">Leave now</SelectItem>
            <SelectItem value="depart">Depart at</SelectItem>
            <SelectItem value="arrive">Arrive by</SelectItem>
          </SelectContent>
        </Select>

        {/* Time and Date Controls - Bottom Row */}
        <div className="flex items-center gap-3">
          {/* Time Selector */}
          <div className="flex items-center gap-1 flex-1">
            <Popover open={isTimeOpen} onOpenChange={setIsTimeOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="font-medium hover:bg-gray-50 px-2 h-auto w-full justify-start">
                  <Clock className="size-4 mr-2 text-ucr-blue flex-shrink-0" />
                  <span className="whitespace-nowrap">{format(selectedTime, 'h:mm a')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex items-center justify-between p-2 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjustTime(-15)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="font-semibold">{format(selectedTime, 'h:mm a')}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjustTime(15)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {generateTimeOptions().map(({ hours, minutes }) => (
                    <Button
                      key={`${hours}-${minutes}`}
                      variant="ghost"
                      className="w-full justify-start hover:bg-ucr-blue/10"
                      onClick={() => setSpecificTime(hours, minutes)}
                    >
                      {format(setMinutes(setHours(new Date(), hours), minutes), 'h:mm a')}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-1 flex-1">
            <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="font-medium hover:bg-gray-50 px-2 h-auto w-full justify-start">
                  <Calendar className="size-4 mr-2 text-ucr-blue flex-shrink-0" />
                  <span className="whitespace-nowrap">{format(selectedTime, 'EEE, MMM d')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="space-y-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                    const date = addDays(new Date(), day);
                    return (
                      <Button
                        key={day}
                        variant="ghost"
                        className="w-full justify-start hover:bg-ucr-blue/10"
                        onClick={() => {
                          adjustDate(day - Math.floor((selectedTime.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                          setIsDateOpen(false);
                        }}
                      >
                        {format(date, 'EEEE, MMMM d, yyyy')}
                      </Button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}