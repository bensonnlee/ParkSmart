import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { ArrowLeft, Clock, MapPin, Navigation, Share2, Bell, Car, ParkingCircle, Footprints, TrendingUp } from 'lucide-react';
import { format, subMinutes } from 'date-fns';
import { toast } from 'sonner';

interface ParkingLotRecommendation {
  id: string;
  name: string;
  badge: string;
  walkingTime: number;
  cost: string;
  currentSpots: number;
  totalSpots: number;
  predictedAvailability: number;
  confidence: 'high' | 'medium' | 'low';
  status: 'available' | 'limited' | 'full';
}

export default function ParkingRecommendations() {
  const navigate = useNavigate();
  const { classId } = useParams();

  // Mock class data
  const classInfo = {
    name: 'Physics 201',
    location: 'Science Hall',
    startTime: new Date(2025, 0, 31, 14, 0)
  };

  // Trip breakdown
  const tripDetails = {
    driveToCampus: 20,
    parkAtLot: 5,
    walkToClass: 10
  };

  const totalTime = Object.values(tripDetails).reduce((a, b) => a + b, 0);
  const leaveByTime = subMinutes(classInfo.startTime, totalTime);

  // Mock recommendations
  const recommendations: ParkingLotRecommendation[] = [
    {
      id: '1',
      name: 'North Parking Structure',
      badge: 'BEST BET',
      walkingTime: 5,
      cost: '$2.50/hr',
      currentSpots: 89,
      totalSpots: 250,
      predictedAvailability: 95,
      confidence: 'high',
      status: 'available'
    },
    {
      id: '2',
      name: 'Lot C (Economy)',
      badge: 'GOOD VALUE',
      walkingTime: 12,
      cost: 'Free',
      currentSpots: 34,
      totalSpots: 120,
      predictedAvailability: 50,
      confidence: 'medium',
      status: 'limited'
    },
    {
      id: '3',
      name: 'Garage 4 (Covered)',
      badge: 'HIGH DEMAND',
      walkingTime: 5,
      cost: '$4.00/hr',
      currentSpots: 12,
      totalSpots: 180,
      predictedAvailability: 15,
      confidence: 'medium',
      status: 'limited'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'border-green-500 bg-green-50';
      case 'limited':
        return 'border-yellow-500 bg-yellow-50';
      case 'full':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getBadgeColor = (badge: string) => {
    if (badge.includes('BEST')) return 'bg-green-500 text-white';
    if (badge.includes('VALUE')) return 'bg-blue-500 text-white';
    if (badge.includes('DEMAND')) return 'bg-orange-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const handleSetReminder = () => {
    toast.success(`Reminder set for ${format(leaveByTime, 'h:mm a')}`);
  };

  const handleShare = () => {
    toast.success('Parking details copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
            Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{classInfo.name} @ {classInfo.location}</h2>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <Clock className="size-4" />
                Course begins: {format(classInfo.startTime, 'h:mm a')} • Today, Oct 24
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/map')}
              className="text-green-600 hover:text-green-700"
            >
              📍 View Campus Map
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Optimal Departure & Trip Breakdown */}
          <div className="lg:col-span-1 space-y-4">
            {/* Optimal Departure Card */}
            <Card className="border-green-500 border-2">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Optimal Departure</p>
                  <div className="mb-4">
                    <p className="text-5xl font-bold text-green-600">
                      {format(leaveByTime, 'h:mm')}
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      {format(leaveByTime, 'a')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Arrive by {format(classInfo.startTime, 'h:mm a')} (0 min early) to ensure parking spot
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSetReminder}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      size="sm"
                    >
                      <Bell className="size-4 mr-2" />
                      Set Reminder
                    </Button>
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      size="sm"
                    >
                      <Share2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trip Breakdown Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Trip Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-lg p-2">
                      <Car className="size-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Drive to Campus</p>
                      <p className="text-xs text-gray-500">Typical commute time</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{tripDetails.driveToCampus} min</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-lg p-2">
                      <ParkingCircle className="size-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Park at Lot</p>
                      <p className="text-xs text-gray-500">Finding & payment</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{tripDetails.parkAtLot} min</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-lg p-2">
                      <Footprints className="size-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Walk to Class</p>
                      <p className="text-xs text-gray-500">From park to Science Hall</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{tripDetails.walkToClass} min</span>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">Total Time</span>
                      <span className="text-lg font-bold text-green-600">{totalTime} min</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recommended Lots */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recommended Lots</h3>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/map')}
                className="text-green-600"
              >
                View All Options →
              </Button>
            </div>

            <div className="space-y-4">
              {recommendations.map((lot, index) => (
                <Card key={lot.id} className={`border-l-4 ${getStatusColor(lot.status)}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">{lot.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getBadgeColor(lot.badge)}`}>
                            {lot.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Footprints className="size-3" />
                            {lot.walkingTime} min walk
                          </span>
                          <span className="flex items-center gap-1">
                            💰 {lot.cost}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Current Availability */}
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-xs text-gray-600 mb-1">Current Availability</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {lot.currentSpots}
                          <span className="text-sm font-normal text-gray-500"> / {lot.totalSpots}</span>
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${(lot.currentSpots / lot.totalSpots) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Predicted Availability */}
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                          <TrendingUp className="size-3" />
                          Predicted @ 2:00 PM
                        </p>
                        <p className="text-2xl font-bold text-green-700">
                          {lot.predictedAvailability}%
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {lot.confidence} confidence
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-green-500 hover:bg-green-600"
                      onClick={() => {
                        toast.success(`Opening directions to ${lot.name}`);
                        window.open(`https://maps.google.com/?q=UCR+${lot.name}`, '_blank');
                      }}
                    >
                      <Navigation className="size-4 mr-2" />
                      Navigate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}