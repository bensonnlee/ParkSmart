import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { ArrowLeft, Clock, MapPin, Navigation, ChevronDown, ChevronUp, TrendingUp, AlertCircle } from 'lucide-react';
import { format, subMinutes } from 'date-fns';

interface ParkingLotRecommendation {
  id: string;
  name: string;
  walkingTime: number;
  currentSpots: number;
  totalSpots: number;
  predictedSpots: number;
  confidence: 'high' | 'medium' | 'low';
  status: 'available' | 'limited' | 'full';
}

export default function ParkingRecommendations() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Mock class data - would come from route state or API
  const classInfo = {
    name: 'CS 100 - Software Construction',
    startTime: new Date(2025, 0, 31, 10, 0),
    building: 'Olmsted Hall',
    room: '2'
  };

  // Calculate leave time
  const driveTime = 15;
  const parkingSearchTime = 5;
  const walkingTime = 8;
  const buffer = 5;
  const totalMinutes = driveTime + parkingSearchTime + walkingTime + buffer;
  const leaveByTime = subMinutes(classInfo.startTime, totalMinutes);

  // Mock recommendations
  const recommendations: ParkingLotRecommendation[] = [
    {
      id: '1',
      name: 'Lot 13 - Engineering Area',
      walkingTime: 8,
      currentSpots: 45,
      totalSpots: 120,
      predictedSpots: 32,
      confidence: 'high',
      status: 'available'
    },
    {
      id: '2',
      name: 'Lot 6 - Student Services',
      walkingTime: 12,
      currentSpots: 18,
      totalSpots: 85,
      predictedSpots: 12,
      confidence: 'medium',
      status: 'limited'
    },
    {
      id: '3',
      name: 'Lot 30 - West Campus',
      walkingTime: 15,
      currentSpots: 62,
      totalSpots: 200,
      predictedSpots: 48,
      confidence: 'high',
      status: 'available'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'limited':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'full':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-50 text-green-700',
      medium: 'bg-yellow-50 text-yellow-700',
      low: 'bg-red-50 text-red-700'
    };
    return colors[confidence as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Class Context Header - Sticky */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-3 -ml-2"
          >
            <ArrowLeft className="size-4 mr-1" />
            Back to Classes
          </Button>
          <div>
            <h2 className="font-semibold text-gray-900">{classInfo.name}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {format(classInfo.startTime, 'h:mm a')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {classInfo.building} {classInfo.room}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Departure Time Card */}
        <Card className="mb-6 border-l-4 border-l-ucr-blue">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">YOU SHOULD LEAVE BY</p>
              <p className="text-4xl font-bold text-ucr-blue mb-4">
                {format(leaveByTime, 'h:mm a')}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="text-gray-600"
              >
                {showBreakdown ? 'Hide' : 'Show'} time breakdown
                {showBreakdown ? <ChevronUp className="size-4 ml-1" /> : <ChevronDown className="size-4 ml-1" />}
              </Button>
            </div>

            {showBreakdown && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Drive to campus</span>
                  <span className="font-medium">{driveTime} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Find parking spot</span>
                  <span className="font-medium">{parkingSearchTime} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Walk to class</span>
                  <span className="font-medium">{walkingTime} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Safety buffer</span>
                  <span className="font-medium">{buffer} min</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Total time needed</span>
                  <span className="text-ucr-blue">{totalMinutes} min</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Recommended Parking Lots
          </h3>
          <span className="text-xs text-gray-500">
            Updated {format(new Date(), 'h:mm a')}
          </span>
        </div>

        {/* Parking Lot Recommendations */}
        <div className="space-y-4">
          {recommendations.map((lot, index) => (
            <Card key={lot.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                {/* Header with Rank Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-ucr-blue text-white rounded-full size-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{lot.name}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Navigation className="size-3" />
                        {lot.walkingTime} min walk to class
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(lot.status)}`}>
                    {lot.status.charAt(0).toUpperCase() + lot.status.slice(1)}
                  </span>
                </div>

                {/* Availability Stats */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Current Availability</p>
                    <p className="text-lg font-bold text-gray-900">
                      {lot.currentSpots} <span className="text-sm font-normal text-gray-500">/ {lot.totalSpots}</span>
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-ucr-blue h-1.5 rounded-full"
                        style={{ width: `${(lot.currentSpots / lot.totalSpots) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      Predicted @ {format(classInfo.startTime, 'h:mm a')}
                    </p>
                    <p className="text-lg font-bold text-ucr-blue">
                      ~{lot.predictedSpots} <span className="text-sm font-normal text-gray-600">spots</span>
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceBadge(lot.confidence)} inline-block mt-2`}>
                      {lot.confidence} confidence
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full bg-ucr-gold hover:bg-ucr-gold/90 text-white"
                  onClick={() => {
                    // In real app, would open maps with directions
                    window.open(`https://maps.google.com/?q=UCR+${lot.name}`, '_blank');
                  }}
                >
                  <Navigation className="size-4 mr-2" />
                  Get Directions
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Box */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="size-5 text-ucr-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Predictions based on historical data
                </p>
                <p className="text-xs text-gray-600">
                  Availability is estimated using 5 years of parking patterns. Actual availability may vary.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
