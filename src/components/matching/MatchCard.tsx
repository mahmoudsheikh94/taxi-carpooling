import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, Button, Badge } from '../ui';
import { CompatibilityScore } from './CompatibilityScore';
import { useMatchStore } from '../../store/matchStore';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import type { TripMatch } from '../../types';

interface MatchCardProps {
  match: TripMatch;
  onViewDetails?: (match: TripMatch) => void;
  onContact?: (match: TripMatch) => void;
  onAccept?: (match: TripMatch) => void;
  onDecline?: (match: TripMatch) => void;
  showActions?: boolean;
  className?: string;
}

export function MatchCard({
  match,
  onViewDetails,
  onContact,
  onAccept,
  onDecline,
  showActions = true,
  className = '',
}: MatchCardProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { updateMatchStatus } = useMatchStore();
  const { createChatRoom, getChatRoomByMatch } = useChatStore();
  const { showToast } = useToast();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Use matched_trip as the trip to display (the one we're matching with)
  const trip = match.matched_trip;
  const departureDate = new Date(trip?.departure_time || '');
  const isUpcoming = departureDate > new Date();
  
  const handleStatusUpdate = async (status: string, callback?: (match: TripMatch) => void) => {
    setIsActionLoading(true);
    try {
      const result = await updateMatchStatus(match.id, status);
      if (result.success) {
        showToast(`Match ${status.toLowerCase()} successfully`, 'success');
        callback?.(match);
      } else {
        showToast(result.error || `Failed to ${status.toLowerCase()} match`, 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleView = () => {
    handleStatusUpdate('VIEWED', onViewDetails);
  };

  const handleContact = () => {
    handleStatusUpdate('CONTACTED', onContact);
  };

  const handleAccept = () => {
    handleStatusUpdate('ACCEPTED', onAccept);
  };

  const handleDecline = () => {
    handleStatusUpdate('DECLINED', onDecline);
  };

  const handleStartChat = async () => {
    if (!user?.id || !trip?.user_id) return;

    setIsChatLoading(true);
    try {
      // Check if chat room already exists for this match
      let chatRoomId = await getChatRoomByMatch(match.id);
      
      if (!chatRoomId) {
        // Create new chat room
        chatRoomId = await createChatRoom(
          user.id,
          trip.user_id,
          match.id,
          trip.id
        );
      }

      if (chatRoomId) {
        // Mark match as contacted if not already
        if (match.status === 'SUGGESTED' || match.status === 'VIEWED') {
          await updateMatchStatus(match.id, 'CONTACTED');
        }
        
        // Navigate to chat
        navigate(`/chat/${chatRoomId}`);
        showToast('Chat room opened', 'success');
      } else {
        showToast('Failed to create chat room', 'error');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      showToast('Failed to start chat', 'error');
    } finally {
      setIsChatLoading(false);
    }
  };

  const getDetourInfo = () => {
    if (match.detour_distance || match.detour_time) {
      return {
        distance: match.detour_distance ? `+${match.detour_distance.toFixed(1)}km` : null,
        time: match.detour_time ? `+${Math.round(match.detour_time)}min` : null,
      };
    }
    return null;
  };

  const getSavingsInfo = () => {
    if (match.estimated_savings) {
      return `Save ${trip?.currency === 'USD' ? '$' : trip?.currency}${match.estimated_savings.toFixed(2)}`;
    }
    return null;
  };

  if (!trip) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <p>Trip information unavailable</p>
        </div>
      </Card>
    );
  }

  const detourInfo = getDetourInfo();
  const savingsInfo = getSavingsInfo();

  return (
    <Card className={`p-6 transition-shadow hover:shadow-md ${className}`}>
      <div className="space-y-4">
        {/* Header with Compatibility Score */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge color="blue" variant="outline">
                Match Found
              </Badge>
              {match.status === 'VIEWED' && (
                <Badge color="gray" size="sm">Viewed</Badge>
              )}
              {match.status === 'CONTACTED' && (
                <Badge color="green" size="sm">Contacted</Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Found {formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}
            </div>
          </div>
          
          <div className="ml-4">
            <CompatibilityScore
              score={match.compatibility_score}
              matchType={match.match_type}
              showBreakdown={false}
            />
          </div>
        </div>

        {/* Route Information */}
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
            <div className="flex-1 flex items-center space-x-2 text-xs text-gray-500">
              {detourInfo?.distance && (
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  {detourInfo.distance} detour
                </span>
              )}
              {detourInfo?.time && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {detourInfo.time} extra
                </span>
              )}
              {savingsInfo && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                  {savingsInfo}
                </span>
              )}
            </div>
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

        {/* Trip Details */}
        <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500 mb-1">Departure</div>
            <div className="text-sm font-medium text-gray-900">
              {format(departureDate, 'MMM d, h:mm a')}
            </div>
            <div className="text-xs text-gray-500">
              {isUpcoming ? (
                <>Departing {formatDistanceToNow(departureDate, { addSuffix: true })}</>
              ) : (
                <>Departed {formatDistanceToNow(departureDate, { addSuffix: true })}</>
              )}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 mb-1">Available Seats</div>
            <div className="text-sm font-medium text-gray-900">
              {trip.available_seats} of {trip.max_passengers}
            </div>
            {trip.price_per_seat && (
              <div className="text-xs text-green-600 font-medium">
                {trip.currency === 'USD' ? '$' : trip.currency}{trip.price_per_seat}/seat
              </div>
            )}
          </div>
        </div>

        {/* Driver Information */}
        <div className="flex items-center space-x-3 py-3 border-t border-gray-100">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-600">
              {trip.user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">{trip.user?.name}</div>
            <div className="text-sm text-gray-500 flex items-center space-x-2">
              {trip.user?.rating_average && (
                <span className="flex items-center">
                  <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {trip.user.rating_average.toFixed(1)}
                </span>
              )}
              {trip.user?.trips_completed && (
                <span>{trip.user.trips_completed} trips</span>
              )}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="flex flex-wrap gap-1 py-2">
          {trip.smoking_allowed && (
            <Badge variant="outline" color="gray" size="sm">🚬 Smoking OK</Badge>
          )}
          {trip.pets_allowed && (
            <Badge variant="outline" color="gray" size="sm">🐕 Pets OK</Badge>
          )}
          {trip.music_preference === 'yes' && (
            <Badge variant="outline" color="gray" size="sm">🎵 Music</Badge>
          )}
          {trip.conversation_level === 'chatty' && (
            <Badge variant="outline" color="gray" size="sm">💬 Chatty</Badge>
          )}
          {trip.conversation_level === 'quiet' && (
            <Badge variant="outline" color="gray" size="sm">🤫 Quiet</Badge>
          )}
        </div>

        {/* Meeting Point Info */}
        {(match.suggested_pickup_point || match.suggested_dropoff_point) && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs font-medium text-blue-900 mb-1">Suggested Meeting Point</div>
            <div className="text-sm text-blue-800">
              {match.suggested_pickup_point?.address || match.suggested_dropoff_point?.address}
            </div>
            {match.suggested_pickup_point?.walkingDistance && (
              <div className="text-xs text-blue-600 mt-1">
                {Math.round(match.suggested_pickup_point.walkingDistance)}m walk
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && isUpcoming && match.status === 'SUGGESTED' && (
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
            <Button
              onClick={handleView}
              variant="outline"
              size="sm"
              disabled={isActionLoading}
              className="flex-1"
            >
              View Details
            </Button>
            
            <Button
              onClick={handleStartChat}
              size="sm"
              disabled={isActionLoading || isChatLoading}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{isChatLoading ? 'Opening...' : 'Start Chat'}</span>
            </Button>
          </div>
        )}

        {showActions && match.status === 'VIEWED' && (
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
            <Button
              onClick={handleStartChat}
              variant="outline"
              size="sm"
              disabled={isActionLoading || isChatLoading}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{isChatLoading ? 'Opening...' : 'Chat'}</span>
            </Button>
            
            <Button
              onClick={handleAccept}
              size="sm"
              disabled={isActionLoading}
              className="flex-1"
            >
              Accept Match
            </Button>
            
            <Button
              onClick={handleDecline}
              variant="outline"
              size="sm"
              disabled={isActionLoading}
              className="flex-1"
            >
              Decline
            </Button>
          </div>
        )}

        {showActions && match.status === 'CONTACTED' && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Contact initiated</span>
              </div>
              
              <Button
                onClick={handleStartChat}
                variant="outline"
                size="sm"
                disabled={isChatLoading}
                className="flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{isChatLoading ? 'Opening...' : 'Continue Chat'}</span>
              </Button>
            </div>
          </div>
        )}

        {showActions && match.status === 'ACCEPTED' && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Match accepted - coordinate your trip!</span>
              </div>
              
              <Button
                onClick={handleStartChat}
                size="sm"
                disabled={isChatLoading}
                className="flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{isChatLoading ? 'Opening...' : 'Open Chat'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Link to full trip details */}
        <div className="pt-2">
          <Link
            to={`/trips/${trip.id}`}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            View full trip details →
          </Link>
        </div>
      </div>
    </Card>
  );
}