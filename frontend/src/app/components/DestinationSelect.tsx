import { Building2 } from 'lucide-react';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { campusLocations } from './ucr-data';

interface DestinationSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function DestinationSelect({ value, onChange }: DestinationSelectProps) {
  const groupedLocations = campusLocations.reduce((acc, location) => {
    if (!acc[location.category]) {
      acc[location.category] = [];
    }
    acc[location.category].push(location);
    return acc;
  }, {} as Record<string, typeof campusLocations>);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Campus Destination</Label>
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 z-10" />
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="pl-10">
            <SelectValue placeholder="Select your destination on campus" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedLocations).map(([category, locations]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                  {category}
                </div>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
