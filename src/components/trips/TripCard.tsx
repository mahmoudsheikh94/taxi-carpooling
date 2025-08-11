import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../ui';
import { formatDistanceToNow, format } from 'date-fns';
import type { Trip, TripRequest } from '../../types';

interface TripCardProps {
  trip: Trip;
  onJoinRequest?: (tripId: string) => void;
  showJoinButton?: boolean;
  className?: string;
  userRequest?: TripRequest | null; // User's existing request for this trip
  currentUserId?: string; // Current user's ID to check if it's their own trip
}

export function TripCard({ 
  trip, 
  onJoinRequest, 
  showJoinButton = true, 
  className = '',
  userRequest,
  currentUserId
}: TripCardProps) {
  const departureDate = new Date(trip.departure_time);
  const isUpcoming = departureDate > new Date();
  const availableSeats = trip.available_seats ?? (trip.max_passengers - trip.current_passengers);
  
  // Check if this is the user's own trip
  const isOwnTrip = currentUserId && trip.user_id === currentUserId;
  
  // Get request status information
  const getRequestStatus = () => {
    if (!userRequest) return null;
    
    switch (userRequest.status) {
      case 'PENDING':
        return { text: 'Request Sent', color: 'orange', icon: '⏳' };
      case 'ACCEPTED':
        return { text: 'Request Accepted', color: 'green', icon: '✅' };
      case 'DECLINED':
        return { text: 'Request Declined', color: 'red', icon: '❌' };
      case 'CANCELLED':
        return { text: 'Request Cancelled', color: 'gray', icon: '🚫' };
      default:
        return null;
    }
  };
  
  const requestStatus = getRequestStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'CANCELLED':
        return 'red';
      case 'COMPLETED':
        return 'gray';
      case 'IN_PROGRESS':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'CANCELLED':
        return 'Cancelled';
      case 'COMPLETED':
        return 'Completed';
      case 'IN_PROGRESS':
        return 'In Progress';
      default:
        return status;
    }
  };

  const handleJoinRequest = (e: React.MouseEvent) => {
    e.preventDefault();
    onJoinRequest?.(trip.id);
  };

  return (
    <Card className={`p-6 hover:shadow-md transition-shadow ${className}`}>
      <Link to={`/trips/${trip.id}`} className="block">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge color={getStatusColor(trip.status)}>
                  {getStatusText(trip.status)}
                </Badge>
                {availableSeats > 0 && trip.status === 'ACTIVE' && (
                  <Badge color="blue" variant="outline">
                    {availableSeats} {availableSeats === 1 ? 'seat' : 'seats'} available
                  </Badge>
                )}
                {requestStatus && (
                  <Badge color={requestStatus.color as any} variant="outline">
                    {requestStatus.icon} {requestStatus.text}
                  </Badge>
                )}
                {isOwnTrip && (
                  <Badge color="purple" variant="outline">
                    👤 Your Trip
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                {isUpcoming ? (
                  <>Departing {formatDistanceToNow(departureDate, { addSuffix: true })}</>
                ) : (
                  <>Departed {formatDistanceToNow(departureDate, { addSuffix: true })}</>
                )}
              </div>
            </div>
            
            {trip.price_per_seat && (
              <div className="text-right">
                <div className="text-lg font-semibold text-green-600">
                  {trip.currency === 'USD' ? '$' : trip.currency}{trip.price_per_seat}
                </div>
                <div className="text-xs text-gray-500">per seat</div>
              </div>
            )}
          </div>

          {/* Route */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{trip.origin}</div>
                <div className="text-sm text-gray-500 truncate">
                  {trip.origin_location?.address || trip.origin}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-0.5 h-6 bg-gray-300 ml-1.25"></div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{trip.destination}</div>
                <div className="text-sm text-gray-500 truncate">
                  {trip.destination_location?.address || trip.destination}
                </div>
              </div>
            </div>
          </div>

          {/* Departure Time */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {format(departureDate, 'MMM d, yyyy')} at {format(departureDate, 'h:mm a')}
            </span>
          </div>

          {/* Driver Info */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {trip.user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">{trip.user.name}</div>
              <div className="text-sm text-gray-500">
                {trip.user.rating_average && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {trip.user.rating_average.toFixed(1)}
                  </span>
                )}
                {trip.user.trips_completed && (
                  <span className="ml-2">{trip.user.trips_completed} trips completed</span>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          {(trip.vehicle_make || trip.vehicle_model || trip.vehicle_color) && (
            <div className="text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {[trip.vehicle_color, trip.vehicle_make, trip.vehicle_model]
                    .filter(Boolean)
                    .join(' ')}
                </span>
              </div>
            </div>
          )}

          {/* Preferences */}
          <div className="flex flex-wrap gap-2">
            {trip.smoking_allowed && (
              <Badge variant="outline" color="gray" size="sm">
                🚬 Smoking OK
              </Badge>
            )}
            {trip.pets_allowed && (
              <Badge variant="outline" color="gray" size="sm">
                🐕 Pets OK
              </Badge>
            )}
            {trip.music_preference === 'yes' && (
              <Badge variant="outline" color="gray" size="sm">
                🎵 Music
              </Badge>
            )}
            {trip.conversation_level === 'chatty' && (
              <Badge variant="outline" color="gray" size="sm">
                💬 Chatty
              </Badge>
            )}
            {trip.conversation_level === 'quiet' && (
              <Badge variant="outline" color="gray" size="sm">
                🤫 Quiet
              </Badge>
            )}
          </div>

          {/* Notes */}
          {trip.notes && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p className="line-clamp-2">{trip.notes}</p>
            </div>
          )}
        </div>
      </Link>

      {/* Action Button */}
      {showJoinButton && trip.status === 'ACTIVE' && isUpcoming && !isOwnTrip && (
        <div className="mt-4 pt-4 border-t">
          {!userRequest && availableSeats > 0 && (
            <Button
              onClick={handleJoinRequest}
              className="w-full"
              size="sm"
            >
              Request to Join
            </Button>
          )}
          
          {!userRequest && availableSeats === 0 && (
            <Button
              disabled
              className="w-full"
              size="sm"
              variant="outline"
            >
              Trip is Full
            </Button>
          )}
          
          {userRequest?.status === 'PENDING' && (
            <div className="text-center">
              <div className="text-sm text-orange-600 font-medium mb-2">
                ⏳ Request Pending
              </div>
              <div className="text-xs text-gray-500">
                Waiting for driver to respond
              </div>
            </div>
          )}
          
          {userRequest?.status === 'ACCEPTED' && (
            <div className="text-center">
              <div className="text-sm text-green-600 font-medium mb-2">
                ✅ Request Accepted!
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = `/chat`}
              >
                💬 Open Chat
              </Button>
            </div>
          )}
          
          {userRequest?.status === 'DECLINED' && availableSeats > 0 && (
            <div className="text-center">
              <div className="text-sm text-red-600 font-medium mb-2">
                ❌ Request Declined
              </div>
              <Button
                onClick={handleJoinRequest}
                className="w-full"
                size="sm"
                variant="outline"
              >
                Request Again
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Own Trip Actions */}
      {showJoinButton && isOwnTrip && trip.status === 'ACTIVE' && isUpcoming && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `/trips/${trip.id}/edit`}
            >
              ✏️ Edit Trip
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `/requests?trip=${trip.id}`}
            >
              📋 Manage Requests
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}