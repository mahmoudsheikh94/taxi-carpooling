import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate } from 'react-router-dom';
import { tripSchema } from '../../utils/validations';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { PlacesAutocomplete, RouteDisplay } from '../maps';
import { Input, TextArea, Select, Button, Card, Checkbox, LoadingSpinner } from '../ui';
import { useToast } from '../ui/Toast';
import type { TripFormData, LocationFormData } from '../../utils/validations';
import type { Trip } from '../../types';

interface TripEditFormProps {
  tripId?: string;
  trip?: Trip;
  onSuccess?: (tripId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function TripEditForm({ 
  tripId: propTripId, 
  trip: propTrip, 
  onSuccess, 
  onCancel, 
  className 
}: TripEditFormProps) {
  const { tripId: paramTripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTrip, isLoading, updateTrip, getTripById } = useTripStore();
  const { showToast } = useToast();
  
  const tripId = propTripId || paramTripId;
  const trip = propTrip || currentTrip;
  
  const [originLocation, setOriginLocation] = useState<LocationFormData | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationFormData | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeCalculated, setRouteCalculated] = useState(true); // Allow editing without recalculating route

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
  });

  const watchedOrigin = watch('origin');
  const watchedDestination = watch('destination');

  // Load trip data if not provided
  useEffect(() => {
    if (tripId && !propTrip) {
      getTripById(tripId);
    }
  }, [tripId, propTrip, getTripById]);

  // Populate form when trip data is available
  useEffect(() => {
    if (trip) {
      // Check if user is authorized to edit
      if (user?.id !== trip.user_id) {
        showToast('You are not authorized to edit this trip', 'error');
        navigate(`/trips/${trip.id}`);
        return;
      }

      // Check if trip can be edited
      if (!['ACTIVE', 'CANCELLED'].includes(trip.status)) {
        showToast('This trip cannot be edited', 'error');
        navigate(`/trips/${trip.id}`);
        return;
      }

      // Populate form with trip data
      const formData: TripFormData = {
        origin: trip.origin,
        destination: trip.destination,
        origin_location: trip.origin_location,
        destination_location: trip.destination_location,
        departure_time: new Date(trip.departure_time).toISOString().slice(0, 16),
        max_passengers: trip.max_passengers,
        price_per_seat: trip.price_per_seat,
        currency: trip.currency,
        payment_method: trip.payment_method,
        notes: trip.notes || '',
        smoking_allowed: trip.smoking_allowed,
        pets_allowed: trip.pets_allowed,
        music_preference: trip.music_preference,
        conversation_level: trip.conversation_level,
        vehicle_make: trip.vehicle_make || '',
        vehicle_model: trip.vehicle_model || '',
        vehicle_color: trip.vehicle_color || '',
        vehicle_plate: trip.vehicle_plate || '',
      };

      reset(formData);
      setOriginLocation(trip.origin_location);
      setDestinationLocation(trip.destination_location);
      
      if (trip.origin_location && trip.destination_location) {
        setShowRoute(true);
      }
    }
  }, [trip, user, reset, navigate, showToast]);

  const handleOriginChange = (value: string, location?: LocationFormData) => {
    setValue('origin', value);
    if (location) {
      setOriginLocation(location);
      setValue('origin_location', location);
      
      if (destinationLocation) {
        setShowRoute(true);
        setRouteCalculated(false);
      }
    } else {
      setOriginLocation(null);
      setShowRoute(false);
      setRouteCalculated(true);
    }
  };

  const handleDestinationChange = (value: string, location?: LocationFormData) => {
    setValue('destination', value);
    if (location) {
      setDestinationLocation(location);
      setValue('destination_location', location);
      
      if (originLocation) {
        setShowRoute(true);
        setRouteCalculated(false);
      }
    } else {
      setDestinationLocation(null);
      setShowRoute(false);
      setRouteCalculated(true);
    }
  };

  const handleRouteCalculated = (route: google.maps.DirectionsResult) => {
    setRouteCalculated(true);
  };

  const onSubmit = async (data: TripFormData) => {
    if (!trip || !user) {
      showToast('Trip data not available', 'error');
      return;
    }

    if (!originLocation || !destinationLocation) {
      showToast('Please select valid origin and destination locations', 'error');
      return;
    }

    // Don't require route recalculation if locations haven't changed
    const locationsChanged = 
      JSON.stringify(originLocation) !== JSON.stringify(trip.origin_location) ||
      JSON.stringify(destinationLocation) !== JSON.stringify(trip.destination_location);

    if (locationsChanged && showRoute && !routeCalculated) {
      showToast('Please wait for the route to be calculated', 'warning');
      return;
    }

    try {
      const updateData = {
        ...data,
        origin_location: originLocation,
        destination_location: destinationLocation,
      };

      const result = await updateTrip(trip.id, updateData);
      
      if (result.success) {
        showToast('Trip updated successfully!', 'success');
        onSuccess?.(trip.id);
        navigate(`/trips/${trip.id}`);
      } else {
        showToast(result.error || 'Failed to update trip', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
      console.error('Trip update error:', error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    if (trip) {
      navigate(`/trips/${trip.id}`);
    } else {
      navigate('/trips');
    }
  };

  // Loading state
  if (isLoading && !trip) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-2 text-sm text-gray-600">Loading trip data...</p>
        </div>
      </div>
    );
  }

  // No trip state
  if (!trip) {
    return (
      <div className={className}>
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Trip Not Found</h2>
          <p className="text-gray-600 mb-4">
            The trip you're trying to edit doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/trips')} variant="outline">
            Back to Trips
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Trip</h2>
          <p className="text-gray-600">
            Update your trip details and preferences
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
                label="Maximum Passengers"
                type="number"
                {...register('max_passengers', { valueAsNumber: true })}
                error={errors.max_passengers?.message}
                required
                min={1}
                max={8}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Price per Seat (Optional)"
                type="number"
                step="0.01"
                {...register('price_per_seat', { valueAsNumber: true })}
                error={errors.price_per_seat?.message}
                placeholder="0.00"
              />
              
              <Select
                label="Currency"
                {...register('currency')}
                error={errors.currency?.message}
                options={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                  { value: 'CAD', label: 'CAD (C$)' },
                ]}
              />
            </div>

            <Select
              label="Payment Method (Optional)"
              {...register('payment_method')}
              error={errors.payment_method?.message}
              placeholder="Select payment method"
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Credit/Debit Card' },
                { value: 'app', label: 'Mobile Payment App' },
                { value: 'split', label: 'Split Payment' },
              ]}
            />

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

          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Vehicle Information (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Vehicle Make"
                {...register('vehicle_make')}
                error={errors.vehicle_make?.message}
                placeholder="e.g., Toyota"
              />
              
              <Input
                label="Vehicle Model"
                {...register('vehicle_model')}
                error={errors.vehicle_model?.message}
                placeholder="e.g., Camry"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Vehicle Color"
                {...register('vehicle_color')}
                error={errors.vehicle_color?.message}
                placeholder="e.g., Silver"
              />
              
              <Input
                label="License Plate"
                {...register('vehicle_plate')}
                error={errors.vehicle_plate?.message}
                placeholder="e.g., ABC-1234"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              type="submit"
              disabled={isSubmitting || (showRoute && !routeCalculated)}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting && <LoadingSpinner className="mr-2" />}
              Update Trip
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>

          {showRoute && !routeCalculated && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Please wait for the route to be recalculated before updating the trip.
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}