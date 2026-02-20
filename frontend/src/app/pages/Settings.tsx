import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Slider } from '@/app/components/ui/slider';
import { ArrowLeft, User, CreditCard, Sliders, Calendar, LogOut, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from "react";

export default function Settings() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
const user = storedUser ? JSON.parse(storedUser) : null;

const displayName =
  user?.display_name || user?.name || user?.email?.split("@")?.[0] || "User";

const email = user?.email || "—";
const studentId = user?.student_id || user?.sid || user?.id || "—";

const uid = user?.id || user?.user_id || user?.supabase_id;
const prefsKey = uid ? `prefs:${uid}` : "prefs:guest";

  const [parkingPass, setParkingPass] = useState('blue');
  const [arrivalBuffer, setArrivalBuffer] = useState([10]);
  const [walkingSpeed, setWalkingSpeed] = useState([3]);

  useEffect(() => {
  const raw = localStorage.getItem(prefsKey);
  if (!raw) return;

  try {
    const prefs = JSON.parse(raw);

    if (prefs.parkingPass) setParkingPass(prefs.parkingPass);
    if (typeof prefs.arrivalBuffer === "number") setArrivalBuffer([prefs.arrivalBuffer]);
    if (typeof prefs.walkingSpeed === "number") setWalkingSpeed([prefs.walkingSpeed]);
  } catch {
    // ignore bad JSON
  }
}, [prefsKey]);

useEffect(() => {
  const prefs = {
    parkingPass,
    arrivalBuffer: arrivalBuffer[0],
    walkingSpeed: walkingSpeed[0],
  };
  localStorage.setItem(prefsKey, JSON.stringify(prefs));
}, [prefsKey, parkingPass, arrivalBuffer, walkingSpeed]);

  const handleSaveChanges = () => {
    const prefs = {
    parkingPass,
    arrivalBuffer: arrivalBuffer[0],
    walkingSpeed: walkingSpeed[0],
  };

  localStorage.setItem(prefsKey, JSON.stringify(prefs));
  toast.success("Settings saved successfully!");
  };

  const handleLogout = () => {
  localStorage.clear();
  toast.success("Logged out successfully");
  navigate("/welcome");
};

  return (
    /* pb-24 ensures content scrolls above the bottom navigation bar */
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mb-3 -ml-2"
          >
            <ArrowLeft className="size-4 mr-1" />
            Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500">Manage your account data and parking preferences</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Account Data */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 rounded-full p-3">
                <User className="size-6 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Account Data</h2>
                <p className="text-xl text-gray-800">{displayName}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Full Name</Label>
                <Input value={displayName} className="mt-1" readOnly />
              </div>
              <div>
                <Label className="text-sm text-gray-600">Email Address</Label>
                <Input value={email} className="mt-1" readOnly />
              </div>
              <div className="flex items-end">
                <Button variant="outline"
                  className="w-full"
                  onClick={() => navigate("/dashboard/change-password")}
                >
                  Change Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parking Logistics */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 rounded-full p-3">
                <CreditCard className="size-6 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Parking Logistics</h2>
              </div>
            </div>

            <div className="mb-6">
              <Label className="text-sm text-gray-700 mb-2 block">Parking Permit Type</Label>
              
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Commuter Permits</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  variant={parkingPass === 'gold-plus' ? 'default' : 'outline'}
                  onClick={() => setParkingPass('gold-plus')}
                  className={`flex-col h-auto py-6 ${parkingPass === 'gold-plus' ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white border-transparent' : ''}`}
                >
                  <span className="text-[20px] font-semibold">Gold Plus</span>
                </Button>
                <Button
                  variant={parkingPass === 'gold' ? 'default' : 'outline'}
                  onClick={() => setParkingPass('gold')}
                  className={`flex-col h-auto py-6 ${parkingPass === 'gold' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white border-transparent' : ''}`}
                >
                  <span className="text-[20px] font-semibold">Gold</span>
                </Button>
                <Button
                  variant={parkingPass === 'orange' ? 'default' : 'outline'}
                  onClick={() => setParkingPass('orange')}
                  className={`flex-col h-auto py-4 ${parkingPass === 'orange' ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white border-transparent' : ''}`}
                >
                  <span className="text-[20px] font-semibold">Orange</span>
                </Button>
                <Button
                  variant={parkingPass === 'evening' ? 'default' : 'outline'}
                  onClick={() => setParkingPass('evening')}
                  className={`flex-col h-auto py-4 ${parkingPass === 'evening' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent' : ''}`}
                >
                  <span className="text-[20px] font-semibold">Evening</span>
                  <span className="text-[12px] opacity-75">After 6 PM</span>
                </Button>
              </div>

              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Resident Permits</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  variant={parkingPass === 'residence-hall' ? 'default' : 'outline'}
                  onClick={() => setParkingPass('residence-hall')}
                  className={`flex-col h-auto py-6 ${parkingPass === 'residence-hall' ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-transparent' : ''}`}
                >
                  <span className="text-[20px] font-semibold">Residence Hall</span>
                </Button>
                <Button
                  variant={parkingPass === 'apartment' ? 'default' : 'outline'}
                  onClick={() => setParkingPass('apartment')}
                  className={`flex-col h-auto py-6 ${parkingPass === 'apartment' ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white border-transparent' : ''}`}
                >
                  <span className="text-[20px] font-semibold">Apartment</span>
                </Button>
              </div>

              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Other Permits</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={parkingPass === 'red' ? 'default' : 'outline'}
                  onClick={() => setParkingPass('red')}
                  className={`flex-col h-auto py-6 ${parkingPass === 'red' ? 'bg-gradient-to-br from-red-500 to-red-700 text-white border-transparent' : ''}`}
                >
                  <span className="text-[20px] font-semibold">Red</span>
                </Button>
                <Button
                  variant={parkingPass === 'blue' ? 'default' : 'outline'}
                  onClick={() => setParkingPass('blue')}
                  className={`flex-col h-auto py-6 ${parkingPass === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white border-transparent' : ''}`}
                >
                  <span className="text-[20px] font-semibold">Blue</span>
                </Button>
              </div>
            </div>

            {/* Links fixed for mobile: flex-col on small screens, flex-row on larger */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button 
                variant="link" 
                size="sm" 
                className="text-blue-600 px-0 h-auto justify-start"
                onClick={() => window.open('https://transportation.ucr.edu/undergrad/undergrad-commuter', '_blank')}
              >
                View commuter permits <ExternalLink className="size-3 ml-1" />
              </Button>
              <Button 
                variant="link" 
                size="sm" 
                className="text-blue-600 px-0 h-auto justify-start"
                onClick={() => window.open('https://transportation.ucr.edu/undergrad/undergrad-resident', '_blank')}
              >
                View resident permits <ExternalLink className="size-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Preferences */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 rounded-full p-3">
                <Sliders className="size-6 text-green-600" />
              </div>
              <h2 className="font-bold text-gray-900 text-lg">Optimization Preferences</h2>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm text-gray-700">Arrival Buffer</Label>
                <span className="text-sm font-bold text-green-600">{arrivalBuffer[0]} min</span>
              </div>
              <Slider value={arrivalBuffer} onValueChange={setArrivalBuffer} max={20} step={1} />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm text-gray-700">Walking Speed</Label>
                <span className="text-sm font-bold text-green-600">{walkingSpeed[0]} mph</span>
              </div>
              <Slider value={walkingSpeed} onValueChange={setWalkingSpeed} max={5} min={2} step={0.5} />
            </div>
          </CardContent>
        </Card>

        {/* Schedule Integration */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 rounded-full p-3">
                <Calendar className="size-6 text-green-600" />
              </div>
              <h2 className="font-bold text-gray-900 text-lg">Schedule Integration</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 gap-3">
                <div>
                  <p className="font-semibold text-sm text-gray-900">Google UMR Work</p>
                  <p className="text-xs text-gray-600">Last synced: 15 mins ago</p>
                </div>
                <Button variant="outline" size="sm">Manage Sync</Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout and Save */}
        <div className="flex justify-between items-center mt-8">
          <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:bg-red-50">
            <LogOut className="size-4 mr-2" /> Logout
          </Button>
          <Button onClick={handleSaveChanges} className="bg-green-500 hover:bg-green-600 px-8">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}