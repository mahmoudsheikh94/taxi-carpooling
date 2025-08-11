import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, TextArea, Select } from '../ui';
import { PlacesAutocomplete } from '../maps';
import { useRequestStore } from '../../store/requestStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import type { Trip, LocationData } from '../../types';

const requestSchema = z.object({
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
  seats_requested: z.number().min(1, 'Must request at least 1 seat').max(4, 'Cannot request more than 4 seats'),
  departure_flexibility: z.number().min(0, 'Flexibility cannot be negative').max(120, 'Maximum flexibility is 2 hours'),
  pickup_location: z.object({
    address: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    placeId: z.string(),
  }).optional(),
  dropoff_location: z.object({
    address: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    placeId: z.string(),
  }).optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface TripRequestFormProps {
  trip: Trip;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function TripRequestForm({ 
  trip, 
  onSuccess, 
  onCancel, 
  className = '' 
}: TripRequestFormProps) {
  const { user } = useAuthStore();
  const { createRequest, isSending } = useRequestStore();
  const { showToast } = useToast();
  const [useCustomLocations, setUseCustomLocations] = useState(false);
  
  // Calculate available seats with fallback and safety checks
  const calculateAvailableSeats = () => {
    // Direct available seats if provided
    if (typeof trip.available_seats === 'number' && trip.available_seats >= 0) {
      return trip.available_seats;
    }
    
    // Calculate from max and current passengers with fallbacks
    const maxPassengers = trip.max_passengers || 4;
    const currentPassengers = trip.current_passengers || 0;
    const calculated = Math.max(0, maxPassengers - currentPassengers);
    
    return calculated;
  };

  const availableSeats = calculateAvailableSeats();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    reset,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      seats_requested: 1,
      departure_flexibility: 15,
      message: '',
    },
    mode: 'onChange',
  });

  const watchedSeats = watch('seats_requested');
  const watchedMessage = watch('message');

  const onSubmit = async (data: RequestFormData) => {
    console.log('🚀 TripRequestForm onSubmit:', { data, trip, user: user?.id });
    
    if (!user?.id || !trip.user_id) {
      console.log('❌ Authentication required');
      showToast('Authentication required', 'error');
      return;
    }

    if (user.id === trip.user_id) {
      console.log('❌ Cannot request to join your own trip');
      showToast('Cannot request to join your own trip', 'error');
      return;
    }

    console.log('💺 Available seats check:', {
      requested: data.seats_requested,
      available: availableSeats,
      fromTrip: trip.available_seats,
      maxPassengers: trip.max_passengers,
      currentPassengers: trip.current_passengers
    });

    if (data.seats_requested > availableSeats) {
      showToast(`Only ${availableSeats} seats available`, 'error');
      return;
    }

    try {
      const request = await createRequest({
        trip_id: trip.id,
        sender_id: user.id,
        receiver_id: trip.user_id,
        message: data.message,
        seats_requested: data.seats_requested,
        departure_flexibility: data.departure_flexibility,
        pickup_location: data.pickup_location,
        dropoff_location: data.dropoff_location,
      });

      if (request) {
        showToast('Trip request sent successfully!', 'success');
        reset();
        onSuccess?.();
      }
    } catch (error) {
      showToast('Failed to send request', 'error');
    }
  };

  const handleLocationSelect = (field: 'pickup_location' | 'dropoff_location') => (location: LocationData) => {
    setValue(field, location, { shouldValidate: true });
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Request to Join Trip
        </h3>
        <div className="text-sm text-gray-600">
          <p className="mb-1">
            <span className="font-medium">From:</span> {trip.origin}
          </p>
          <p className="mb-1">
            <span className="font-medium">To:</span> {trip.destination}
          </p>
          <p className="mb-1">
            <span className="font-medium">Available seats:</span> {availableSeats}
          </p>
          <p>
            <span className="font-medium">Driver:</span> {trip.user?.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Seats Requested */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Seats *
          </label>
          <Select
            {...register('seats_requested', { valueAsNumber: true })}
            error={errors.seats_requested?.message}
            disabled={isSending}
          >
            {availableSeats > 0 ? (
              Array.from({ length: Math.min(availableSeats, 4) }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} seat{i > 0 ? 's' : ''}
                </option>
              ))
            ) : (
              <option value="" disabled>No seats available</option>
            )}
          </Select>
        </div>

        {/* Departure Flexibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Departure Flexibility (minutes)
          </label>
          <Select
            {...register('departure_flexibility', { valueAsNumber: true })}
            error={errors.departure_flexibility?.message}
            disabled={isSending}
          >
            <option value={0}>Exact time only</option>
            <option value={15}>±15 minutes</option>
            <option value={30}>±30 minutes</option>
            <option value={60}>±1 hour</option>
            <option value={120}>±2 hours</option>
          </Select>
        </div>

        {/* Custom Pickup/Dropoff Locations */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={useCustomLocations}
              onChange={(e) => setUseCustomLocations(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isSending}
            />
            <span>Specify different pickup/dropoff locations</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            If your pickup or dropoff differs from the trip's main route
          </p>
        </div>

        {useCustomLocations && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* Custom Pickup */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Location (optional)
              </label>
              <PlacesAutocomplete
                onPlaceSelect={handleLocationSelect('pickup_location')}
                placeholder="Enter pickup location..."
                disabled={isSending}
              />
              {errors.pickup_location && (
                <p className="text-sm text-red-600 mt-1">
                  Please select a valid pickup location
                </p>
              )}
            </div>

            {/* Custom Dropoff */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dropoff Location (optional)
              </label>
              <PlacesAutocomplete
                onPlaceSelect={handleLocationSelect('dropoff_location')}
                placeholder="Enter dropoff location..."
                disabled={isSending}
              />
              {errors.dropoff_location && (
                <p className="text-sm text-red-600 mt-1">
                  Please select a valid dropoff location
                </p>
              )}
            </div>
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message to Driver (optional)
          </label>
          <TextArea
            {...register('message')}
            placeholder="Introduce yourself or add any relevant details..."
            rows={3}
            error={errors.message?.message}
            disabled={isSending}
          />
          <div className="text-xs text-gray-500 mt-1 flex justify-between">
            <span>Be polite and provide relevant information</span>
            <span>{watchedMessage?.length || 0}/500</span>
          </div>
        </div>

        {/* Request Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Request Summary</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Requesting {watchedSeats} seat{watchedSeats > 1 ? 's' : ''}</p>
            <p>• Flexible with departure time by {watch('departure_flexibility')} minutes</p>
            {useCustomLocations && (
              <p>• Will specify custom pickup/dropoff locations</p>
            )}
            <p>• Request expires in 24 hours if not responded to</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSending}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={!isValid || isSending}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending Request...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send Request</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}