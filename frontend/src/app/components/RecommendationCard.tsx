import { Award, TrendingUp, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ParkingRecommendation } from './ucr-types';

interface RecommendationCardProps {
  recommendation: ParkingRecommendation;
  isPredicted?: boolean;
}

export function RecommendationCard({ recommendation, isPredicted }: RecommendationCardProps) {
  const { lot, distance, walkingTime, reason } = recommendation;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-yellow-50 border-2 border-ucr-blue shadow-lg">
      <CardHeader className="bg-ucr-blue text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Award className="size-6" />
          <div>
            <span className="text-xl">Best Parking Option</span>
            {isPredicted && (
              <p className="text-sm font-normal opacity-90 mt-1">
                Based on predicted availability
              </p>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="bg-white rounded-lg p-4 border-2 border-ucr-gold">
          <h3 className="text-2xl font-bold text-ucr-blue mb-1">{lot.name}</h3>
          <p className="text-gray-600">{lot.address}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="size-4 text-ucr-blue" />
              <span className="text-sm text-gray-600">Distance</span>
            </div>
            <p className="text-xl font-bold text-ucr-blue">{distance.toFixed(2)} mi</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="size-4 text-ucr-blue" />
              <span className="text-sm text-gray-600">Walking Time</span>
            </div>
            <p className="text-xl font-bold text-ucr-blue">{walkingTime} min</p>
          </div>

          <div className="bg-white rounded-lg p-3 col-span-2 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-green-600" />
              <span className="text-sm text-gray-600">
                {isPredicted ? 'Predicted Available Spaces' : 'Available Spaces'}
              </span>
            </div>
            <p className="text-xl font-bold text-green-600">
              {lot.openSpaces} / {lot.totalSpaces}
            </p>
          </div>
        </div>

        <div className="bg-ucr-blue text-white rounded-lg p-4">
          <p className="text-sm font-semibold mb-1">Why this lot?</p>
          <p className="text-sm">{reason}</p>
        </div>
      </CardContent>
    </Card>
  );
}
