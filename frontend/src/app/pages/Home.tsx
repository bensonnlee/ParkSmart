import { useState, useMemo } from 'react';
import { LocationInput } from '@/app/components/LocationInput';
import { DestinationSelect } from '@/app/components/DestinationSelect';
import { TimeSelector } from '@/app/components/TimeSelector';
import { ParkingLotCard } from '@/app/components/ParkingLotCard';
import { RecommendationCard } from '@/app/components/RecommendationCard';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { ucrParkingLots, campusLocations, calculateDistance, calculateWalkingTime, predictParkingAvailability } from '@/app/components/ucr-data';
import { ParkingRecommendation, ParkingLot } from '@/app/components/ucr-types';
import { Navigation, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [timeMode, setTimeMode] = useState<'depart' | 'arrive'>('depart');
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());

  // Get current location using browser geolocation
  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setCurrentLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          toast.success('Location accessed successfully!');
        },
        (error) => {
          toast.error('Unable to access location. Please enter manually.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  // Get predicted parking data for selected time
  const predictedLots = useMemo(() => {
    return ucrParkingLots.map(lot => {
      const predicted = predictParkingAvailability(lot, selectedTime);
      return {
        ...lot,
        openSpaces: predicted.openSpaces,
        occupancyRate: predicted.occupancyRate,
      };
    });
  }, [selectedTime]);

  // Determine if we're using prediction (if time is in future)
  const isPredicted = selectedTime > new Date();

  // Use either predicted or current data
  const lotsData = isPredicted ? predictedLots : ucrParkingLots;

  // Calculate recommendations
  const recommendation = useMemo<ParkingRecommendation | null>(() => {
    if (!destination) return null;

    const destinationLocation = campusLocations.find(loc => loc.id === destination);
    if (!destinationLocation) return null;

    // Calculate scores for each lot
    const lotsWithScores = lotsData
      .filter(lot => lot.openSpaces > 0) // Only consider lots with available spaces
      .map(lot => {
        const distance = calculateDistance(
          lot.coordinates.lat,
          lot.coordinates.lng,
          destinationLocation.coordinates.lat,
          destinationLocation.coordinates.lng
        );
        const walkingTime = calculateWalkingTime(distance);

        // Scoring algorithm:
        // - Distance (40%): Closer is better
        // - Availability (40%): More spaces is better
        // - Occupancy rate (20%): Lower occupancy is better

        const distanceScore = Math.max(0, 100 - (distance * 1000)); // Penalize distance heavily
        const availabilityScore = (lot.openSpaces / lot.totalSpaces) * 100;
        const occupancyScore = 100 - lot.occupancyRate;

        const totalScore = (distanceScore * 0.4) + (availabilityScore * 0.4) + (occupancyScore * 0.2);

        return {
          lot,
          score: totalScore,
          distance,
          walkingTime,
        };
      })
      .sort((a, b) => b.score - a.score);

    if (lotsWithScores.length === 0) return null;

    const best = lotsWithScores[0];
    
    // Generate reason
    let reason = '';
    if (best.distance < 0.2) {
      reason = `This lot is very close to your destination (${best.walkingTime} min walk) and has ${best.lot.openSpaces} available spaces.`;
    } else if (best.lot.openSpaces > 300) {
      reason = `This lot has plenty of available spaces (${best.lot.openSpaces}) and is within reasonable walking distance.`;
    } else if (best.lot.occupancyRate < 20) {
      reason = `This lot has low occupancy (${best.lot.occupancyRate}%) and good availability near your destination.`;
    } else {
      reason = `This lot offers the best balance of proximity (${best.walkingTime} min walk) and availability (${best.lot.openSpaces} spaces).`;
    }

    return {
      ...best,
      reason,
    };
  }, [destination, lotsData]);

  // Calculate distances for all lots if destination is selected
  const lotsWithDistances = useMemo(() => {
    if (!destination) return lotsData;

    const destinationLocation = campusLocations.find(loc => loc.id === destination);
    if (!destinationLocation) return lotsData;

    return lotsData.map(lot => {
      const distance = calculateDistance(
        lot.coordinates.lat,
        lot.coordinates.lng,
        destinationLocation.coordinates.lat,
        destinationLocation.coordinates.lng
      );
      const walkingTime = calculateWalkingTime(distance);

      return {
        ...lot,
        distance,
        walkingTime,
      };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [destination, lotsData]);

  const destinationName = campusLocations.find(loc => loc.id === destination)?.name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-ucr-blue mb-2">
            Parking Finder
          </h2>
          <p className="text-gray-600 text-lg">
            Find the best parking spot based on availability and proximity
          </p>
        </div>

        {/* Location & Time Inputs */}
        <Card className="mb-8 border-2 border-ucr-blue/20 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-ucr-blue mb-4">Plan Your Trip</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <LocationInput
                value={currentLocation}
                onChange={setCurrentLocation}
                onUseCurrentLocation={handleUseCurrentLocation}
                label="Your Current Location"
                placeholder="Enter address or use GPS"
              />
              <DestinationSelect
                value={destination}
                onChange={setDestination}
              />
              <TimeSelector
                mode={timeMode}
                selectedTime={selectedTime}
                onModeChange={setTimeMode}
                onTimeChange={setSelectedTime}
              />
            </div>

            {destination && (
              <div className="mt-6 flex justify-center">
                <Button
                  size="lg"
                  className="bg-ucr-blue hover:bg-ucr-blue-dark text-white"
                  onClick={() => {
                    if (recommendation) {
                      toast.success('Recommendation updated!');
                    }
                  }}
                >
                  <Navigation className="size-5 mr-2" />
                  Find Best Parking Spot
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert className="mb-6 border-ucr-blue bg-blue-50">
          <Info className="size-4 text-ucr-blue" />
          <AlertDescription className="text-ucr-blue">
            <strong>{isPredicted ? 'Predicted data:' : 'Real-time data:'}</strong>{' '}
            {isPredicted 
              ? 'Availability is predicted based on historical patterns for your selected time.'
              : 'Parking availability updates every few minutes. Walking times calculated at 3 mph average.'}
          </AlertDescription>
        </Alert>

        {/* Recommendation */}
        {recommendation && destinationName && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-ucr-blue mb-4">
              Recommended for {destinationName}
            </h3>
            <RecommendationCard recommendation={recommendation} isPredicted={isPredicted} />
          </div>
        )}

        {/* Warning for no destination */}
        {!destination && (
          <Alert className="mb-6 border-ucr-gold bg-yellow-50">
            <AlertCircle className="size-4 text-ucr-gold-dark" />
            <AlertDescription className="text-ucr-gold-dark">
              Select your campus destination to get personalized parking recommendations.
            </AlertDescription>
          </Alert>
        )}

        {/* All Parking Lots */}
        <div>
          <h3 className="text-2xl font-bold text-ucr-blue mb-4">
            {destination ? 'All Parking Options' : 'Available Parking Lots'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lotsWithDistances.map((lot) => (
              <ParkingLotCard
                key={lot.id}
                lot={lot}
                distance={'distance' in lot ? lot.distance : undefined}
                walkingTime={'walkingTime' in lot ? lot.walkingTime : undefined}
                isRecommended={recommendation?.lot.id === lot.id}
                isPredicted={isPredicted}
              />
            ))}
          </div>
        </div>

        {/* Statistics Summary */}
        <Card className="mt-8 border-2 border-ucr-gold/30">
          <CardContent className="p-6">
            <h4 className="font-semibold text-lg mb-4 text-ucr-blue">
              Campus Parking Summary {isPredicted && '(Predicted)'}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-ucr-blue">
                  {lotsData.reduce((sum, lot) => sum + lot.openSpaces, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Available</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-ucr-gold-dark">
                  {lotsData.reduce((sum, lot) => sum + lot.totalSpaces, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Capacity</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {lotsData.filter(lot => lot.openSpaces > 100).length}
                </p>
                <p className="text-sm text-gray-600">Lots with 100+ Spaces</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-ucr-blue">
                  {Math.round(
                    lotsData.reduce((sum, lot) => sum + lot.occupancyRate, 0) /
                    lotsData.filter(lot => lot.totalSpaces > 0).length
                  )}%
                </p>
                <p className="text-sm text-gray-600">Avg Occupancy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}