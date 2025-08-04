import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { useRequestStore } from '../../store/requestStore';
import { RouteDisplay } from '../../components/maps';
import { Button, Card, Badge, LoadingSpinner } from '../../components/ui';
import { TripRequestModal } from '../../components/requests';
import { ROUTES } from '../../constants';
import type { Trip } from '../../types';

export function TripDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTrip, isLoading, error, getTripById, setCurrentTrip } = useTripStore();
  const { sendTripRequest, isLoading: requestLoading } = useRequestStore();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRequestSent, setJoinRequestSent] = useState(false);

  useEffect(() => {
    if (id) {
      getTripById(id);
    }

    // Cleanup current trip when component unmounts
    return () => {
      setCurrentTrip(null);
    };
  }, [id, getTripById, setCurrentTrip]);

  const handleJoinRequestSuccess = () => {
    setJoinRequestSent(true);
    setShowJoinModal(false);
  };

  const canJoinTrip = (trip: Trip): boolean => {
    if (!user) return false;
    if (trip.user.id === user.id) return false; // Can't join own trip
    if (trip.status !== 'ACTIVE') return false;
    if (trip.available_seats <= 0) return false;
    if (new Date(trip.departure_time) <= new Date()) return false; // Trip already departed
    return true;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'green', text: 'Active', description: 'Accepting passengers' };
      case 'CANCELLED':
        return { color: 'red', text: 'Cancelled', description: 'Trip has been cancelled' };
      case 'COMPLETED':
        return { color: 'gray', text: 'Completed', description: 'Trip has been completed' };
      case 'IN_PROGRESS':
        return { color: 'blue', text: 'In Progress', description: 'Trip is currently active' };
      default:
        return { color: 'gray', text: status, description: '' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading trip details...</span>
      </div>
    );
  }

  if (error || !currentTrip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'The trip you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <Link to={ROUTES.TRIPS}>
            <Button>Browse Trips</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(currentTrip.status);
  const departureDate = new Date(currentTrip.departure_time);
  const isUpcoming = departureDate > new Date();
  const canJoin = canJoinTrip(currentTrip);
  const isOwner = user?.id === currentTrip.user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trip Details</h1>
              <p className="text-gray-600">
                {currentTrip.origin} → {currentTrip.destination}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge color={statusInfo.color as any}>
              {statusInfo.text}
            </Badge>
            {currentTrip.available_seats > 0 && currentTrip.status === 'ACTIVE' && (
              <Badge color="blue" variant="outline">
                {currentTrip.available_seats} {currentTrip.available_seats === 1 ? 'seat' : 'seats'} available
              </Badge>
            )}
            {isOwner && (
              <Badge color="purple" variant="outline">
                Your Trip
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Route</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-4 h-4 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{currentTrip.origin}</div>
                    <div className="text-sm text-gray-600">
                      {currentTrip.origin_location?.address || 'Pick-up location'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-0.5 h-8 bg-gray-300 ml-1.75"></div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-4 h-4 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{currentTrip.destination}</div>
                    <div className="text-sm text-gray-600">
                      {currentTrip.destination_location?.address || 'Drop-off location'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Maps Route Display */}
              {currentTrip.origin_location && currentTrip.destination_location && (
                <div className="mt-6">
                  <RouteDisplay
                    origin={currentTrip.origin_location}
                    destination={currentTrip.destination_location}
                    height="300px"
                    showDetails={true}
                    onError={(error) => console.error('Route display error:', error)}
                  />
                </div>
              )}
            </Card>

            {/* Trip Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Departure</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {format(departureDate, 'MMM d, yyyy')}
                  </div>
                  <div className="text-gray-600">
                    {format(departureDate, 'h:mm a')}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {isUpcoming ? (
                      <>Departing {formatDistanceToNow(departureDate, { addSuffix: true })}</>
                    ) : (
                      <>Departed {formatDistanceToNow(departureDate, { addSuffix: true })}</>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium">Passengers</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {currentTrip.current_passengers} / {currentTrip.max_passengers}
                  </div>
                  <div className="text-gray-600">
                    {currentTrip.available_seats} seats available
                  </div>
                </div>

                {currentTrip.price_per_seat && (
                  <div>
                    <div className="flex items-center space-x-2 text-gray-600 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="font-medium">Price per Seat</span>
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      {currentTrip.currency === 'USD' ? '$' : currentTrip.currency}{currentTrip.price_per_seat}
                    </div>
                    {currentTrip.payment_method && (
                      <div className="text-gray-600 capitalize">
                        {currentTrip.payment_method} payment
                      </div>
                    )}
                  </div>
                )}

                {currentTrip.distance && (
                  <div>
                    <div className="flex items-center space-x-2 text-gray-600 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3v13" />
                      </svg>
                      <span className="font-medium">Distance</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {currentTrip.distance} km
                    </div>
                    {currentTrip.estimated_duration && (
                      <div className="text-gray-600">
                        ~{Math.round(currentTrip.estimated_duration)} minutes
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Preferences */}
              {(currentTrip.smoking_allowed || currentTrip.pets_allowed || 
                currentTrip.music_preference !== 'indifferent' || 
                currentTrip.conversation_level !== 'indifferent') && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium text-gray-900 mb-3">Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentTrip.smoking_allowed && (
                      <Badge variant="outline" color="gray" size="sm">
                        🚬 Smoking OK
                      </Badge>
                    )}
                    {currentTrip.pets_allowed && (
                      <Badge variant="outline" color="gray" size="sm">
                        🐕 Pets OK
                      </Badge>
                    )}
                    {currentTrip.music_preference === 'yes' && (
                      <Badge variant="outline" color="gray" size="sm">
                        🎵 Music
                      </Badge>
                    )}
                    {currentTrip.music_preference === 'no' && (
                      <Badge variant="outline" color="gray" size="sm">
                        🔇 No Music
                      </Badge>
                    )}
                    {currentTrip.conversation_level === 'chatty' && (
                      <Badge variant="outline" color="gray" size="sm">
                        💬 Chatty
                      </Badge>
                    )}
                    {currentTrip.conversation_level === 'quiet' && (
                      <Badge variant="outline" color="gray" size="sm">
                        🤫 Quiet
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {currentTrip.notes && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium text-gray-900 mb-3">Additional Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {currentTrip.notes}
                  </p>
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
                    {currentTrip.user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{currentTrip.user.name}</div>
                  {currentTrip.user.rating_average && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {currentTrip.user.rating_average.toFixed(1)}
                    </div>
                  )}
                  {currentTrip.user.trips_completed && (
                    <div className="text-sm text-gray-500">
                      {currentTrip.user.trips_completed} trips completed
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Information */}
              {(currentTrip.vehicle_make || currentTrip.vehicle_model || currentTrip.vehicle_color) && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium text-gray-900 mb-2">Vehicle</h3>
                  <div className="text-gray-700">
                    {[currentTrip.vehicle_color, currentTrip.vehicle_make, currentTrip.vehicle_model]
                      .filter(Boolean)
                      .join(' ')}
                  </div>
                  {currentTrip.vehicle_plate && (
                    <div className="text-sm text-gray-500 mt-1">
                      License: {currentTrip.vehicle_plate}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Action Buttons */}
            <Card className="p-6">
              <div className="space-y-3">
                {canJoin && !joinRequestSent && (
                  <Button
                    onClick={() => setShowJoinModal(true)}
                    className="w-full"
                    disabled={requestLoading}
                  >
                    {requestLoading ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        Sending Request...
                      </>
                    ) : (
                      'Request to Join'
                    )}
                  </Button>
                )}

                {joinRequestSent && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-800 font-medium">Request Sent!</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      The driver will review your request and get back to you.
                    </p>
                  </div>
                )}

                {isOwner && (
                  <>
                    <Link to={`${ROUTES.TRIPS}/${currentTrip.id}/edit`}>
                      <Button variant="outline" className="w-full">
                        Edit Trip
                      </Button>
                    </Link>
                    <Link to={ROUTES.REQUESTS}>
                      <Button variant="outline" className="w-full">
                        View Requests
                      </Button>
                    </Link>
                  </>
                )}

                {!canJoin && !isOwner && currentTrip.status === 'ACTIVE' && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      {currentTrip.available_seats <= 0 
                        ? 'This trip is full'
                        : !isUpcoming 
                        ? 'This trip has already departed'
                        : 'Unable to join this trip'
                      }
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Join Request Modal */}
      <TripRequestModal
        trip={currentTrip}
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={handleJoinRequestSuccess}
      />
    </div>
  );
}