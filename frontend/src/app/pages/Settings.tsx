import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Slider } from '@/app/components/ui/slider';
import { ArrowLeft, User, CreditCard, Sliders, Calendar, LogOut, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const displayName = user?.display_name || user?.name || user?.email?.split("@")?.[0] || "User";
  const email = user?.email || "—";
  
  const uid = user?.id || user?.user_id || user?.supabase_id;
  const prefsKey = uid ? `prefs:${uid}` : "prefs:guest";

  const [parkingPass, setParkingPass] = useState('blue');
  const [arrivalBuffer, setArrivalBuffer] = useState([10]);
  const [walkingSpeed, setWalkingSpeed] = useState([2]); 

  const getWalkingLabel = (val: number) => {
    if (val === 1) return "Slow";
    if (val === 3) return "Fast";
    return "Medium";
  };

  useEffect(() => {
    const raw = localStorage.getItem(prefsKey);
    if (!raw) return;

    try {
      const prefs = JSON.parse(raw);
      if (prefs.parkingPass) setParkingPass(prefs.parkingPass);
      if (typeof prefs.arrivalBuffer === "number") setArrivalBuffer([prefs.arrivalBuffer]);
      if (typeof prefs.walkingSpeed === "number") setWalkingSpeed([prefs.walkingSpeed]);
    } catch {
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
            </div>
          </CardContent>
        </Card>

        {/* Parking Logistics - Gold Plus, Gold, and Blue */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 rounded-full p-3">
                <CreditCard className="size-6 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Parking Permit</h2>
              </div>
            </div>

            <div className="mb-6">
              <Label className="text-sm text-gray-700 mb-4 block font-semibold">Select Your Permit Type</Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant={parkingPass === 'gold-plus' ? 'default' : 'outline'}
                  onClick={() => setParkingPass('gold-plus')}
                  className={`flex-col h-auto py-8 ${parkingPass === 'gold-plus' ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white border-transparent' : ''}`}
                >
                  <span className="text-[20px] font-bold">Gold Plus</span>
                </Button>
                <Button
                  variant={parkingPass === 'gold' ? 'default' : 'outline'}
                  onClick={() => setParkingPass('gold')}
                  className={`flex-col h-auto py-8 ${parkingPass === 'gold' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white border-transparent' : ''}`}
                >
                  <span className="text-[20px] font-bold">Gold</span>
                </Button>
                <Button
                  variant={parkingPass === 'blue' ? 'default' : 'outline'}
                  onClick={() => setParkingPass('blue')}
                  className={`flex-col h-auto py-8 ${parkingPass === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white border-transparent' : ''}`}
                >
                  <span className="text-[20px] font-bold">Blue</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button 
                variant="link" 
                size="sm" 
                className="text-blue-600 px-0 h-auto justify-start"
                onClick={() => window.open('https://transportation.ucr.edu/undergrad/undergrad-commuter', '_blank')}
              >
                View UCR permit details <ExternalLink className="size-3 ml-1" />
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

            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm text-gray-700">Arrival Buffer</Label>
                <span className="text-sm font-bold text-green-600">{arrivalBuffer[0]} min</span>
              </div>
              <Slider value={arrivalBuffer} onValueChange={setArrivalBuffer} max={30} step={5} />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm text-gray-700">Walking Speed</Label>
                <span className="text-sm font-bold text-green-600 uppercase tracking-widest">
                  {getWalkingLabel(walkingSpeed[0])}
                </span>
              </div>
              <Slider 
                value={walkingSpeed} 
                onValueChange={setWalkingSpeed} 
                max={3} 
                min={1} 
                step={1} 
              />
              <div className="flex justify-between mt-2 px-1 text-[10px] text-gray-400 font-bold uppercase">
                <span>Slow</span>
                <span>Medium</span>
                <span>Fast</span>
              </div>
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