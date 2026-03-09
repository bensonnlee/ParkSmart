import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/app/components/ui/drawer';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/app/components/ui/command';
import { ToggleGroup, ToggleGroupItem } from '@/app/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Building2, Search, Trash2, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/app/components/ui/use-mobile';
import { useDebounce } from '@/app/hooks/useDebounce';
import { cachedFetch } from '@/api/apiCache';
import { API_BASE } from '@/api/config';
import { addScheduleEvent, updateScheduleEvent, deleteScheduleEvent } from '@/api/schedule';
import type { ManualEventData } from '@/api/schedule';
import { toast } from 'sonner';

interface BuildingOption {
  id: string;
  name: string;
  nickname: string;
}

interface ClassEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  onSuccess?: () => void;
  onSubmitOverride?: (data: ManualEventData) => void;
  editData?: {
    id: string;
    event_name: string;
    building_id?: string | null;
    building_name?: string | null;
    room_number?: string | null;
    start_time: string;
    end_time: string;
    days_of_week: number[];
  };
}

const DAY_LABELS = [
  { value: '0', label: 'M' },
  { value: '1', label: 'T' },
  { value: '2', label: 'W' },
  { value: '3', label: 'Th' },
  { value: '4', label: 'F' },
  { value: '5', label: 'Sa' },
  { value: '6', label: 'Su' },
];

function generateTimeOptions(): string[] {
  const minutes = [0, 20, 30, 50];
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of minutes) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return times;
}

const TIME_OPTIONS = generateTimeOptions();

export function formatTimeLabel(t: string): string {
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${ampm}`;
}

export default function ClassEventDialog({ open, onOpenChange, mode, onSuccess, onSubmitOverride, editData }: ClassEventDialogProps) {
  const isMobile = useIsMobile();

  // Form state
  const [eventName, setEventName] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingOption | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Building search state
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [buildingQuery, setBuildingQuery] = useState('');
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const debouncedBuildingQuery = useDebounce(buildingQuery, 300);

  const resetForm = useCallback(() => {
    setEventName('');
    setSelectedBuilding(null);
    setRoomNumber('');
    setStartTime('09:00');
    setEndTime('10:00');
    setSelectedDays([]);
    setConfirmDelete(false);
    setBuildingQuery('');
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (open && mode === 'edit' && editData) {
      setEventName(editData.event_name);
      setStartTime(editData.start_time.slice(0, 5));
      setEndTime(editData.end_time.slice(0, 5));
      setSelectedDays(editData.days_of_week.map(String));
      setRoomNumber(editData.room_number || '');
      setConfirmDelete(false);
      setBuildingQuery('');
      if (editData.building_id && editData.building_name) {
        setSelectedBuilding({ id: editData.building_id, name: editData.building_name, nickname: '' });
      } else {
        setSelectedBuilding(null);
      }
    } else if (open && mode === 'add') {
      resetForm();
    }
  }, [open, mode, editData, resetForm]);

  // Fetch buildings on debounced query (empty query returns all buildings)
  useEffect(() => {
    let stale = false;
    (async () => {
      try {
        const url = debouncedBuildingQuery
          ? `${API_BASE}/api/buildings?q=${encodeURIComponent(debouncedBuildingQuery)}`
          : `${API_BASE}/api/buildings`;
        const data = await cachedFetch(url, { ttl: 60 * 60 * 1000 });
        if (!stale) setBuildings(data);
      } catch {
        if (!stale) setBuildings([]);
      }
    })();
    return () => { stale = true; };
  }, [debouncedBuildingQuery]);

  const handleSubmit = async () => {
    if (!eventName.trim()) {
      toast.error('Please enter a class name');
      return;
    }
    if (selectedDays.length === 0) {
      toast.error('Please select at least one day');
      return;
    }
    if (endTime <= startTime) {
      toast.error('End time must be after start time');
      return;
    }

    setSubmitting(true);
    try {
      const payload: ManualEventData = {
        event_name: eventName.trim(),
        building_id: selectedBuilding?.id || null,
        room_number: roomNumber.trim() || null,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        days_of_week: selectedDays.map(Number),
      };

      if (mode === 'add' && onSubmitOverride) {
        onSubmitOverride(payload);
        toast.success('Class added');
        setSubmitting(false);
        onOpenChange(false);
        return;
      } else if (mode === 'add') {
        await addScheduleEvent(payload);
        toast.success('Class added successfully');
      } else if (editData) {
        await updateScheduleEvent(editData.id, payload);
        toast.success('Class updated successfully');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editData) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setSubmitting(true);
    try {
      await deleteScheduleEvent(editData.id);
      toast.success('Class deleted');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectBuilding = (b: BuildingOption) => {
    setSelectedBuilding(b);
    setBuildingOpen(false);
    setBuildingQuery('');
  };

  const formContent = (
    <div className="space-y-5 px-1">
      {/* Class name */}
      <div className="space-y-2">
        <Label htmlFor="event-name" className="text-sm font-semibold text-gray-700">Class Name</Label>
        <Input
          id="event-name"
          placeholder="e.g. CS 100 — Software Construction"
          value={eventName}
          onChange={e => setEventName(e.target.value)}
          autoFocus={!isMobile}
        />
      </div>

      {/* Building search */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">Building</Label>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={buildingOpen}
          onClick={() => setBuildingOpen(!buildingOpen)}
          className="w-full justify-between text-left font-normal h-10"
        >
          {selectedBuilding ? (
            <span className="flex items-center gap-2 truncate">
              <Building2 className="size-4 text-ucr-blue shrink-0" />
              <span className="truncate">{selectedBuilding.name}</span>
              {selectedBuilding.nickname && (
                <span className="text-gray-400 text-xs truncate">({selectedBuilding.nickname})</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
              <Search className="size-4" />
              Search buildings...
            </span>
          )}
        </Button>
        {buildingOpen && (
          <Command shouldFilter={false} className="border rounded-md">
            <CommandInput
              placeholder="Type a building name..."
              value={buildingQuery}
              onValueChange={setBuildingQuery}
            />
            <CommandList>
              <CommandEmpty>No buildings found.</CommandEmpty>
              <CommandGroup>
                {buildings.map((b) => (
                  <CommandItem
                    key={b.id}
                    value={b.id}
                    onSelect={() => handleSelectBuilding(b)}
                    className="flex items-center gap-2"
                  >
                    <Building2 className="size-4 text-gray-400 shrink-0" />
                    <span className="font-medium">{b.name}</span>
                    <span className="text-gray-400 text-xs ml-auto">{b.nickname}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </div>

      {/* Room number */}
      <div className="space-y-2">
        <Label htmlFor="room-number" className="text-sm font-semibold text-gray-700">Room Number</Label>
        <Input
          id="room-number"
          placeholder="e.g. 104"
          value={roomNumber}
          onChange={e => setRoomNumber(e.target.value)}
        />
      </div>

      {/* Days of week */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">Days</Label>
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={selectedDays}
          onValueChange={setSelectedDays}
          className="w-full"
        >
          {DAY_LABELS.map(d => (
            <ToggleGroupItem
              key={d.value}
              value={d.value}
              className="flex-1 h-10 text-xs font-bold data-[state=on]:bg-ucr-blue data-[state=on]:text-white data-[state=on]:border-ucr-blue"
            >
              {d.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Time pickers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Start Time</Label>
          {isMobile ? (
            <Input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="h-10"
            />
          ) : (
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger className="h-10">
                <SelectValue>{formatTimeLabel(startTime)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map(t => (
                  <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">End Time</Label>
          {isMobile ? (
            <Input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="h-10"
            />
          ) : (
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger className="h-10">
                <SelectValue>{formatTimeLabel(endTime)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map(t => (
                  <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );

  const footerContent = confirmDelete ? (
    <div className="flex gap-2 w-full">
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={submitting}
        className="flex-1 text-sm"
      >
        {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Trash2 className="size-4 mr-1" />}
        Confirm Delete
      </Button>
      <Button
        variant="outline"
        onClick={() => setConfirmDelete(false)}
        disabled={submitting}
        className="flex-1 text-sm"
      >
        Cancel
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2 sm:gap-3 w-full">
      {mode === 'edit' && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={submitting}
          className="mr-auto text-sm"
        >
          <Trash2 className="size-4 mr-1" />
          Delete
        </Button>
      )}
      <div className="flex gap-2 sm:gap-3 ml-auto">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="text-sm">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="text-sm bg-ucr-blue hover:bg-ucr-blue-dark text-white"
        >
          {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
          {mode === 'add' ? 'Add Class' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85dvh] overflow-hidden">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold">
              {mode === 'add' ? 'Add Class' : 'Edit Class'}
            </DrawerTitle>
            <DrawerDescription>
              {mode === 'add' ? 'Add a class to your schedule' : 'Update or remove this class'}
            </DrawerDescription>
          </DrawerHeader>
          <div data-vaul-no-drag className="flex-1 overflow-y-auto min-h-0 px-4 pb-2">
            {formContent}
          </div>
          <DrawerFooter>
            {footerContent}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {mode === 'add' ? 'Add Class' : 'Edit Class'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Add a class to your schedule' : 'Update or remove this class'}
          </DialogDescription>
        </DialogHeader>
        {formContent}
        <DialogFooter>
          {footerContent}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
