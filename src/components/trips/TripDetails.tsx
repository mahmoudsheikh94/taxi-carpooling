import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { RouteDisplay } from '../maps';
import { Card, Button, Badge, LoadingSpinner, EmptyState } from '../ui';
import { useToast } from '../../hooks/useToast';
import type { Trip } from '../../types';

interface TripDetailsProps {
  tripId?: string;
  trip?: Trip;
  className?: string;
}

export function TripDetails({ tripId: propTripId, trip: propTrip, className = '' }: TripDetailsProps) {
  const { tripId: paramTripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentTrip, 
    isLoading, 
    error, 
    getTripById, 
    cancelTrip, 
    deleteTrip,
    subscribeToTrip,
    unsubscribeFromTrip,
  } = useTripStore();
  
  const { showToast } = useToast();
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Determine which trip ID to use
  const tripId = propTripId || paramTripId;
  
  // Determine which trip data to use
  const trip = propTrip || currentTrip;

  useEffect(() => {
    if (tripId && !propTrip) {
      getTripById(tripId);
      
      // Subscribe to real-time updates for this trip
      subscribeToTrip(tripId);
      
      return () => {
        unsubscribeFromTrip(tripId);
      };
    }
  }, [tripId, propTrip, getTripById, subscribeToTrip, unsubscribeFromTrip]);

  const handleCancelTrip = async () => {
    if (!trip || !user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel this trip? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    setIsActionLoading(true);
    try {
      const result = await cancelTrip(trip.id);
      if (result.success) {
        showToast('Trip cancelled successfully', 'success');
      } else {
        showToast(result.error || 'Failed to cancel trip', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!trip || !user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this trip? This action cannot be undone and will remove all associated data.'
    );
    
    if (!confirmed) return;

    setIsActionLoading(true);
    try {
      const result = await deleteTrip(trip.id);
      if (result.success) {
        showToast('Trip deleted successfully', 'success');
        navigate('/trips');
      } else {
        showToast(result.error || 'Failed to delete trip', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleJoinRequest = () => {
    showToast('Join request feature coming soon!', 'info');
  };

  const handleEditTrip = () => {
    if (trip) {
      navigate(`/trips/${trip.id}/edit`);
    }
  };

  // Loading state
  if (isLoading && !trip) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-2 text-sm text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !trip) {
    return (
      <div className={className}>
        <EmptyState
          title="Trip not found"
          description={error}
          action={
            <Button onClick={() => navigate('/trips')} variant="outline">
              Back to Trips
            </Button>
          }
        />
      </div>
    );
  }

  // No trip state
  if (!trip) {
    return (
      <div className={className}>
        <EmptyState
          title="Trip not found"
          description="The trip you're looking for doesn't exist or has been removed."
          action={
            <Button onClick={() => navigate('/trips')} variant="outline">
              Back to Trips
            </Button>
          }
        />
      </div>
    );
  }

  const departureDate = new Date(trip.departure_time);
  const isUpcoming = departureDate > new Date();
  const availableSeats = trip.max_passengers - trip.current_passengers;
  const isOwner = user?.id === trip.user_id;
  const canJoin = !isOwner && trip.status === 'ACTIVE' && availableSeats > 0 && isUpcoming;
  const canEdit = isOwner && ['ACTIVE', 'CANCELLED'].includes(trip.status);
  const canCancel = isOwner && trip.status === 'ACTIVE' && isUpcoming;
  const canDelete = isOwner && ['CANCELLED', 'COMPLETED'].includes(trip.status);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'CANCELLED': return 'red';
      case 'COMPLETED': return 'gray';
      case 'IN_PROGRESS': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'CANCELLED': return 'Cancelled';
      case 'COMPLETED': return 'Completed';
      case 'IN_PROGRESS': return 'In Progress';
      default: return status;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Trip Details</h1>
            <Badge color={getStatusColor(trip.status)}>
              {getStatusText(trip.status)}
            </Badge>
          </div>
          
          <div className="text-sm text-gray-500">
            Created {formatDistanceToNow(new Date(trip.created_at), { addSuffix: true })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {canJoin && (
            <Button onClick={handleJoinRequest}>
              Request to Join
            </Button>
          )}
          
          {canEdit && (
            <Button variant="outline" onClick={handleEditTrip}>
              Edit Trip
            </Button>
          )}
          
          {canCancel && (
            <Button 
              variant="outline" 
              onClick={handleCancelTrip}
              disabled={isActionLoading}
            >
              {isActionLoading ? <LoadingSpinner className="mr-2" /> : null}
              Cancel Trip
            </Button>
          )}
          
          {canDelete && (
            <Button 
              variant="outline" 
              onClick={handleDeleteTrip}
              disabled={isActionLoading}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              {isActionLoading ? <LoadingSpinner className="mr-2" /> : null}
              Delete Trip
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Route</h2>
            
            {trip.origin_location && trip.destination_location && (
              <RouteDisplay
                origin={trip.origin_location}
                destination={trip.destination_location}
                height="300px"
                showDetails={true}
              />
            )}
          </Card>

          {/* Trip Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Departure</h3>
                <div className="text-sm text-gray-900">
                  <div>{format(departureDate, 'EEEE, MMMM d, yyyy')}</div>
                  <div>{format(departureDate, 'h:mm a')}</div>
                  <div className="text-gray-500 mt-1">
                    {isUpcoming ? (
                      <>Departing {formatDistanceToNow(departureDate, { addSuffix: true })}</>
                    ) : (
                      <>Departed {formatDistanceToNow(departureDate, { addSuffix: true })}</>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Passengers</h3>
                <div className="text-sm text-gray-900">
                  <div>{trip.current_passengers} / {trip.max_passengers} passengers</div>
                  <div className="text-gray-500 mt-1">
                    {availableSeats > 0 ? (
                      <>{availableSeats} {availableSeats === 1 ? 'seat' : 'seats'} available</>
                    ) : (
                      <>Trip is full</>
                    )}
                  </div>
                </div>
              </div>

              {trip.price_per_seat && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Price</h3>
                  <div className="text-sm text-gray-900">
                    <div className="text-lg font-semibold text-green-600">
                      {trip.currency === 'USD' ? '$' : trip.currency}{trip.price_per_seat}
                    </div>
                    <div className="text-gray-500">per seat</div>
                  </div>
                </div>
              )}

              {trip.payment_method && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h3>
                  <div className="text-sm text-gray-900 capitalize">
                    {trip.payment_method.replace('_', ' ')}
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Information */}
            {(trip.vehicle_make || trip.vehicle_model || trip.vehicle_color || trip.vehicle_plate) && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {(trip.vehicle_make || trip.vehicle_model) && (
                    <div>
                      <span className="text-gray-500">Vehicle:</span>
                      <span className="ml-2 text-gray-900">
                        {[trip.vehicle_make, trip.vehicle_model].filter(Boolean).join(' ')}
                      </span>
                    </div>
                  )}
                  {trip.vehicle_color && (
                    <div>
                      <span className="text-gray-500">Color:</span>
                      <span className="ml-2 text-gray-900">{trip.vehicle_color}</span>
                    </div>
                  )}
                  {trip.vehicle_plate && (
                    <div>
                      <span className="text-gray-500">License Plate:</span>
                      <span className="ml-2 text-gray-900">{trip.vehicle_plate}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trip Notes */}
            {trip.notes && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Notes</h3>
                <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {trip.notes}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Driver Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Driver</h2>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-lg font-medium text-gray-600">
                  {trip.user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{trip.user.name}</div>
                <div className="text-sm text-gray-500">{trip.user.email}</div>
              </div>
            </div>

            {trip.user.rating_average && (
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium">{trip.user.rating_average.toFixed(1)}</span>
                <span className="text-sm text-gray-500">rating</span>
              </div>
            )}

            {trip.user.trips_completed && (
              <div className="text-sm text-gray-500">
                {trip.user.trips_completed} trips completed
              </div>
            )}

            {!isOwner && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  View Profile
                </Button>
              </div>
            )}
          </Card>

          {/* Trip Preferences */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Smoking</span>
                <Badge variant="outline" size="sm" color={trip.smoking_allowed ? 'green' : 'red'}>
                  {trip.smoking_allowed ? 'Allowed' : 'Not Allowed'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Pets</span>
                <Badge variant="outline" size="sm" color={trip.pets_allowed ? 'green' : 'red'}>
                  {trip.pets_allowed ? 'Allowed' : 'Not Allowed'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Music</span>
                <Badge variant="outline" size="sm" color="gray">
                  {trip.music_preference === 'yes' ? 'Welcome' : 
                   trip.music_preference === 'no' ? 'Prefer Quiet' : 'No Preference'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Conversation</span>
                <Badge variant="outline" size="sm" color="gray">
                  {trip.conversation_level === 'chatty' ? 'Chatty' : 
                   trip.conversation_level === 'quiet' ? 'Quiet' : 'No Preference'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}