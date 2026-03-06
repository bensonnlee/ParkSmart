import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Slider } from '@/app/components/ui/slider';
import { ExternalLink, ChevronLeft } from 'lucide-react';
import { WALKING_SPEEDS, PERMIT_OPTIONS } from '@/lib/prefs';
import type { PermitSlug } from '@/lib/prefs';

interface StepPreferencesProps {
  parkingPass: PermitSlug;
  setParkingPass: (v: PermitSlug) => void;
  arrivalBuffer: number;
  setArrivalBuffer: (v: number) => void;
  walkingSpeed: number;
  setWalkingSpeed: (v: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export default function StepPreferences({
  parkingPass,
  setParkingPass,
  arrivalBuffer,
  setArrivalBuffer,
  walkingSpeed,
  setWalkingSpeed,
  onSubmit,
  onBack,
}: StepPreferencesProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Set Your Preferences</h1>
        <p className="text-muted-foreground mt-1">
          Help us find the best parking spots for you
        </p>
      </div>

      {/* Parking Permit */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 block mb-2">Parking Permit</Label>
        <p className="text-xs text-muted-foreground mb-3">
          We'll only show lots where your permit is valid
        </p>
        <div className="grid grid-cols-3 gap-3">
          {PERMIT_OPTIONS.map((permit) => (
            <button
              type="button"
              key={permit.slug}
              onClick={() => setParkingPass(permit.slug)}
              className={`rounded-lg border-2 py-6 text-center transition-all cursor-pointer ${
                parkingPass === permit.slug
                  ? permit.activeClass
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-lg font-bold block">{permit.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-2">
          <button
            type="button"
            className="text-sm text-primary hover:underline inline-flex items-center"
            onClick={() => window.open('https://transportation.ucr.edu/undergrad/undergrad-commuter', '_blank')}
          >
            View UCR permit details <ExternalLink className="size-3 ml-1" />
          </button>
        </div>
      </div>

      {/* Arrival Buffer */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold text-gray-700">Arrival Buffer</Label>
          <span className="text-sm font-bold text-primary tabular-nums">{arrivalBuffer} min</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          How early do you arrive before class? We'll recommend lots likely to be available at that time.
        </p>
        <Slider value={[arrivalBuffer]} onValueChange={([v]) => setArrivalBuffer(v)} max={30} step={5} />
        <div className="flex justify-between mt-2 px-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          <span>0 min</span>
          <span>30 min</span>
        </div>
      </div>

      {/* Walking Speed */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Walking Speed</Label>
        <p className="text-xs text-muted-foreground mb-3">
          This affects how far from your building we'll suggest parking.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {WALKING_SPEEDS.map((speed) => (
            <button
              type="button"
              key={speed.value}
              onClick={() => setWalkingSpeed(speed.value)}
              className={`rounded-lg border-2 py-4 px-3 text-center transition-all cursor-pointer ${
                walkingSpeed === speed.value
                  ? 'border-primary bg-blue-50 text-primary shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="block text-base font-bold">{speed.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onBack} className="text-muted-foreground">
          <ChevronLeft className="size-4 mr-1" /> Back
        </Button>
        <Button
          type="button"
          className="flex-1 bg-primary hover:bg-ucr-blue-dark"
          onClick={onSubmit}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
