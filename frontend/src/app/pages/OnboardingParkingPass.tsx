import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { CreditCard, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from "react";

interface ParkingPass {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export default function OnboardingParkingPass() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  
  let user: any = null;
  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const uid = user?.id || user?.user_id || user?.supabase_id;
  const prefsKey = uid ? `prefs:${uid}` : "prefs:guest";

  const [selectedPass, setSelectedPass] = useState("blue");

  useEffect(() => {
    const raw = localStorage.getItem(prefsKey);
    if (!raw) return;

    try {
      const prefs = JSON.parse(raw);
      if (prefs.parkingPass) setSelectedPass(prefs.parkingPass);
    } catch {
      // ignore bad JSON
    }
  }, [prefsKey]);

  useEffect(() => {
    const raw = localStorage.getItem(prefsKey);
    let prefs: any = {};
    try {
      prefs = raw ? JSON.parse(raw) : {};
    } catch {
      prefs = {};
    }

    prefs.parkingPass = selectedPass;
    localStorage.setItem(prefsKey, JSON.stringify(prefs));
  }, [prefsKey, selectedPass]);


  const parkingPasses: ParkingPass[] = [
    {
      id: 'blue',
      name: 'Blue Pass',
      description: 'Perimeter parking. Lowest cost option suitable for long-term parking.',
      icon: '🅿️',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'gold',
      name: 'Gold Pass',
      description: 'Core campus access. Standard availability closer to academic buildings.',
      icon: '⭐',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'gold-plus',
      name: 'Gold Plus Pass',
      description: 'Reserved garage access. Guaranteed spots and weather protection.',
      icon: '👑',
      color: 'from-amber-500 to-amber-600'
    },
    {
      id: 'red',
      name: 'Red Pass',
      description: 'Graduate student permit. Access to graduate-designated parking areas.',
      icon: '🎓',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'orange',
      name: 'Orange Pass',
      description: 'Faculty/Staff permit. Reserved spots closest to campus buildings.',
      icon: '🏫',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handleFinish = () => {
  localStorage.setItem(prefsKey, selectedPass);

  toast.success('Setup complete! Welcome to Campus Parking Optimizer');
  navigate('/dashboard');
  };

  const handleBack = () => {
    navigate('/onboarding/upload');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">STEP 2 OF 2</span>
            <span className="text-sm text-green-600 font-medium">100%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Select Your Parking Pass
              </h1>
              <p className="text-gray-600">
                Select your active permit so we can guide you to the right lots.
              </p>
            </div>

            {/* Parking Pass Selection */}
            <RadioGroup value={selectedPass} onValueChange={setSelectedPass} className="space-y-3">
              {parkingPasses.map((pass) => (
                <label
                  key={pass.id}
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPass === pass.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value={pass.id} id={pass.id} className="mt-1" />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{pass.icon}</span>
                      <Label htmlFor={pass.id} className="font-semibold text-gray-900 cursor-pointer">
                        {pass.name}
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">{pass.description}</p>
                  </div>
                  {selectedPass === pass.id && (
                    <div className="bg-green-500 rounded-full p-1 ml-2">
                      <Check className="size-4 text-white" />
                    </div>
                  )}
                </label>
              ))}
            </RadioGroup>

            {/* Helper Text */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-xs text-gray-600">
                Don't have a pass yet?{' '}
                <button
                  onClick={() => window.open('https://transportation.ucr.edu/', '_blank')}
                  className="text-ucr-blue hover:underline font-medium"
                >
                  Purchase one here
                </button>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Back
              </Button>
              <Button
                onClick={handleFinish}
                className="flex-1 bg-green-500 hover:bg-green-600"
                size="lg"
              >
                Finish Setup
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}