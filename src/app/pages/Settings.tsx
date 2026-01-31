import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { ArrowLeft, CreditCard, Clock, Navigation, Upload, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const [parkingPass, setParkingPass] = useState('blue');
  const [arrivalBuffer, setArrivalBuffer] = useState(5);
  const [transportation, setTransportation] = useState('walk');
  const [riskTolerance, setRiskTolerance] = useState('moderate');

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    navigate('/sign-in');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-3 -ml-2"
          >
            <ArrowLeft className="size-4 mr-1" />
            Back to Home
          </Button>
          <h1 className="text-xl font-bold text-ucr-blue">Settings</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        {/* Account Section */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="size-5 text-ucr-blue" />
              <h2 className="font-semibold text-gray-900">Account</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-600">Email</Label>
                <p className="text-sm font-medium text-gray-900 mt-1">student@ucr.edu</p>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Parking Pass Section */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="size-5 text-ucr-blue" />
              <h2 className="font-semibold text-gray-900">Parking Pass</h2>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">What parking pass do you have?</Label>
              <Select value={parkingPass} onValueChange={setParkingPass}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue Permit (Student General)</SelectItem>
                  <SelectItem value="gold">Gold Permit (Reserved)</SelectItem>
                  <SelectItem value="gold-plus">Gold Plus Permit (Premium)</SelectItem>
                  <SelectItem value="visitor">Visitor Pass</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                This determines which parking lots are available to you
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Preferences</h2>
            
            {/* Arrival Buffer */}
            <div className="space-y-3 mb-5">
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="size-4" />
                Arrival Buffer Time
              </Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={arrivalBuffer}
                  onChange={(e) => setArrivalBuffer(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium text-ucr-blue w-16 text-right">
                  {arrivalBuffer} min
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Extra time to arrive before class starts
              </p>
            </div>

            {/* Transportation Method */}
            <div className="space-y-2 mb-5">
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <Navigation className="size-4" />
                Transportation on Campus
              </Label>
              <Select value={transportation} onValueChange={setTransportation}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk">Walking</SelectItem>
                  <SelectItem value="scooter">E-Scooter</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="bus">Campus Shuttle</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Affects walking time calculations
              </p>
            </div>

            {/* Risk Tolerance */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Parking Risk Tolerance</Label>
              <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative (Always recommend backup lots)</SelectItem>
                  <SelectItem value="moderate">Moderate (Balanced approach)</SelectItem>
                  <SelectItem value="optimistic">Optimistic (Trust predictions more)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                How cautious should we be with parking predictions?
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Management */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="size-5 text-ucr-blue" />
              <h2 className="font-semibold text-gray-900">Schedule Management</h2>
            </div>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/upload')}
              >
                <Upload className="size-4 mr-2" />
                Upload New Schedule
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/planner')}
              >
                View Full Week Schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full bg-ucr-blue hover:bg-ucr-blue/90"
          size="lg"
        >
          Save Settings
        </Button>

        {/* Logout & About */}
        <Card>
          <CardContent className="p-5">
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="size-4 mr-2" />
                Logout
              </Button>
              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500 text-center">
                  UCR Parking Optimizer v1.0.0
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
