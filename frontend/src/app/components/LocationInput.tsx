import { MapPin, Navigation } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onUseCurrentLocation: () => void;
  label: string;
  placeholder: string;
}

export function LocationInput({
  value,
  onChange,
  onUseCurrentLocation,
  label,
  placeholder,
}: LocationInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onUseCurrentLocation}
          title="Use current location"
        >
          <Navigation className="size-4" />
        </Button>
      </div>
    </div>
  );
}
