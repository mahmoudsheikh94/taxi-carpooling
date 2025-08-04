import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tripSchema } from '../../utils/validations';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { PlacesAutocomplete, RouteDisplay } from '../maps';
import { Input, TextArea, Select, Button, Card, Checkbox, LoadingSpinner } from '../ui';
import { useToast } from '../../hooks/useToast';
import type { TripFormData, LocationFormData } from '../../utils/validations';

interface TripFormProps {
  onSuccess?: (tripId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function TripForm({ onSuccess, onCancel, className }: TripFormProps) {
  const { user } = useAuthStore();
  const { createTrip, isLoading } = useTripStore();
  const { showToast } = useToast();
  
  const [originLocation, setOriginLocation] = useState<LocationFormData | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationFormData | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeCalculated, setRouteCalculated] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      smoking_allowed: false,
      pets_allowed: true,
      music_preference: 'indifferent',
      conversation_level: 'indifferent',
      max_passengers: 2,
    },
  });

  const watchedOrigin = watch('origin');
  const watchedDestination = watch('destination');

  const handleOriginChange = (value: string, location?: LocationFormData) => {
    setValue('origin', value);
    if (location) {
      setOriginLocation(location);
      setValue('origin_location', location);
      
      // Show route if both locations are set
      if (destinationLocation) {
        setShowRoute(true);
      }
    } else {
      setOriginLocation(null);
      setShowRoute(false);
      setRouteCalculated(false);
    }
  };

  const handleDestinationChange = (value: string, location?: LocationFormData) => {
    setValue('destination', value);
    if (location) {
      setDestinationLocation(location);
      setValue('destination_location', location);
      
      // Show route if both locations are set
      if (originLocation) {
        setShowRoute(true);
      }
    } else {
      setDestinationLocation(null);
      setShowRoute(false);
      setRouteCalculated(false);
    }
  };

  const handleRouteCalculated = (route: google.maps.DirectionsResult) => {
    setRouteCalculated(true);
    
    // Extract additional information from the route if needed
    const leg = route.routes[0]?.legs[0];
    if (leg) {
      // You could set estimated duration, distance, etc. here
      console.log('Route calculated:', {
        distance: leg.distance?.text,
        duration: leg.duration?.text,
      });
    }
  };

  const onSubmit = async (data: TripFormData) => {
    if (!user) {
      showToast('You must be logged in to create a trip', 'error');
      return;
    }

    if (!originLocation || !destinationLocation) {
      showToast('Please select valid origin and destination locations', 'error');
      return;
    }

    try {
      const tripData = {
        ...data,
        origin_location: originLocation,
        destination_location: destinationLocation,
      };

      const result = await createTrip(user.id, tripData);
      
      if (result.success && result.trip) {
        showToast('Trip created successfully!', 'success');
        reset();
        setOriginLocation(null);
        setDestinationLocation(null);
        setShowRoute(false);
        setRouteCalculated(false);
        onSuccess?.(result.trip.id);
      } else {
        showToast(result.error || 'Failed to create trip', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
      console.error('Trip creation error:', error);
    }
  };

  const handleCancel = () => {
    reset();
    setOriginLocation(null);
    setDestinationLocation(null);
    setShowRoute(false);
    setRouteCalculated(false);
    onCancel?.();
  };

  return (
    <div className={className}>
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Share a Taxi Ride</h2>
          <p className="text-gray-600">
            Looking for travel companions to share a taxi? Enter your trip details and we'll find people going the same way to split the cost.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Route Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Route Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <PlacesAutocomplete
                label="Pick-up Location"
                value={watchedOrigin || ''}
                onChange={handleOriginChange}
                placeholder="Enter pick-up address"
                error={errors.origin?.message}
                required
                types={['geocode']}
              />
              
              <PlacesAutocomplete
                label="Drop-off Location"
                value={watchedDestination || ''}
                onChange={handleDestinationChange}
                placeholder="Enter drop-off address"
                error={errors.destination?.message}
                required
                types={['geocode']}
              />
            </div>

            {/* Route Display */}
            {showRoute && originLocation && destinationLocation && (
              <div className="mt-6">
                <RouteDisplay
                  origin={originLocation}
                  destination={destinationLocation}
                  onRouteCalculated={handleRouteCalculated}
                  onError={(error) => showToast(error, 'error')}
                  height="300px"
                  showDetails={true}
                />
              </div>
            )}
          </div>

          {/* Trip Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Trip Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Departure Date & Time"
                type="datetime-local"
                {...register('departure_time')}
                error={errors.departure_time?.message}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
              
              <Input
                label="How many seats do you need?"
                type="number"
                {...register('max_passengers', { valueAsNumber: true })}
                error={errors.max_passengers?.message}
                required
                min={1}
                max={8}
                placeholder="e.g., 2"
                helperText="Total number of people traveling (including yourself)"
              />
            </div>


            <TextArea
              label="Additional Notes (Optional)"
              {...register('notes')}
              error={errors.notes?.message}
              placeholder="Any additional information about the trip..."
              rows={3}
            />
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Trip Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Checkbox
                  label="Smoking Allowed"
                  {...register('smoking_allowed')}
                  error={errors.smoking_allowed?.message}
                />
                
                <Checkbox
                  label="Pets Allowed"
                  {...register('pets_allowed')}
                  error={errors.pets_allowed?.message}
                />
              </div>
              
              <div className="space-y-4">
                <Select
                  label="Music Preference"
                  {...register('music_preference')}
                  error={errors.music_preference?.message}
                  options={[
                    { value: 'yes', label: 'Music Welcome' },
                    { value: 'no', label: 'Prefer Quiet' },
                    { value: 'indifferent', label: 'No Preference' },
                  ]}
                />
                
                <Select
                  label="Conversation Level"
                  {...register('conversation_level')}
                  error={errors.conversation_level?.message}
                  options={[
                    { value: 'chatty', label: 'Chatty' },
                    { value: 'quiet', label: 'Quiet Ride' },
                    { value: 'indifferent', label: 'No Preference' },
                  ]}
                />
              </div>
            </div>
          </div>


          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 sm:flex-none"
            >
              {(isSubmitting || isLoading) && <LoadingSpinner className="mr-2" />}
              Find Travel Companions
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || isLoading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>

        </form>
      </Card>
    </div>
  );
}