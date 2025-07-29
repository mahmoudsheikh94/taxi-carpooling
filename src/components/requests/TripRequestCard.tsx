import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { Card, Button, Badge, TextArea } from '../ui';
import { useRequestStore } from '../../store/requestStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import { ROUTES } from '../../constants';
import type { TripRequest } from '../../types';

interface TripRequestCardProps {
  request: TripRequest;
  type: 'sent' | 'received';
  onUpdate?: () => void;
  className?: string;
}

export function TripRequestCard({ 
  request, 
  type, 
  onUpdate, 
  className = '' 
}: TripRequestCardProps) {
  const { user } = useAuthStore();
  const { acceptRequest, declineRequest, cancelRequest, isLoading } = useRequestStore();
  const { showToast } = useToast();
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [actionType, setActionType] = useState<'accept' | 'decline' | null>(null);

  const isExpired = new Date(request.expires_at) < new Date();
  const isOwner = user?.id === (type === 'sent' ? request.sender_id : request.receiver_id);
  
  const otherUser = type === 'sent' ? request.receiver : request.sender;
  const departureDate = new Date(request.trip?.departure_time || '');

  const getStatusBadge = () => {
    const statusConfig = {
      PENDING: { color: 'yellow' as const, text: 'Pending' },
      ACCEPTED: { color: 'green' as const, text: 'Accepted' },
      DECLINED: { color: 'red' as const, text: 'Declined' },
      CANCELLED: { color: 'gray' as const, text: 'Cancelled' },
      EXPIRED: { color: 'gray' as const, text: 'Expired' },
    };

    const config = statusConfig[request.status as keyof typeof statusConfig];
    return <Badge color={config.color} size="sm">{config.text}</Badge>;
  };

  const handleAccept = async () => {
    if (!responseMessage.trim()) {
      setActionType('accept');
      setShowResponseForm(true);
      return;
    }

    try {
      const updatedRequest = await acceptRequest(request.id, responseMessage);
      if (updatedRequest) {
        showToast('Request accepted successfully!', 'success');
        setShowResponseForm(false);
        setResponseMessage('');
        onUpdate?.();
      }
    } catch (error) {
      showToast('Failed to accept request', 'error');
    }
  };

  const handleDecline = async () => {
    if (!responseMessage.trim()) {
      setActionType('decline');
      setShowResponseForm(true);
      return;
    }

    try {
      const updatedRequest = await declineRequest(request.id, responseMessage);
      if (updatedRequest) {
        showToast('Request declined', 'info');
        setShowResponseForm(false);
        setResponseMessage('');
        onUpdate?.();
      }
    } catch (error) {
      showToast('Failed to decline request', 'error');
    }
  };

  const handleCancel = async () => {
    try {
      const updatedRequest = await cancelRequest(request.id);
      if (updatedRequest) {
        showToast('Request cancelled', 'info');
        onUpdate?.();
      }
    } catch (error) {
      showToast('Failed to cancel request', 'error');
    }
  };

  const submitResponse = () => {
    if (actionType === 'accept') {
      handleAccept();
    } else if (actionType === 'decline') {
      handleDecline();
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge color="blue" variant="outline">
                {type === 'sent' ? 'Sent Request' : 'Received Request'}
              </Badge>
              {getStatusBadge()}
              {isExpired && request.status === 'PENDING' && (
                <Badge color="red" size="sm">Expired</Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              {type === 'sent' ? 'To' : 'From'}: {otherUser?.name}
              <span className="mx-2">•</span>
              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Trip Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Trip Details</h4>
            <Link
              to={`${ROUTES.TRIPS}/${request.trip_id}`}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Trip →
            </Link>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{request.trip?.origin}</span>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <div className="w-0.5 h-4 bg-gray-300" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>{request.trip?.destination}</span>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
              <span>
                <span className="font-medium">Departure:</span>{' '}
                {format(departureDate, 'MMM d, h:mm a')}
              </span>
              <span>
                <span className="font-medium">Price:</span>{' '}
                {request.trip?.currency === 'USD' ? '$' : request.trip?.currency}
                {request.trip?.price_per_seat}/seat
              </span>
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              <span className="font-medium">Seats requested:</span> {request.seats_requested}
            </span>
            <span className="text-gray-600">
              <span className="font-medium">Flexibility:</span> ±{request.departure_flexibility}min
            </span>
          </div>

          {(request.pickup_location || request.dropoff_location) && (
            <div className="text-sm">
              <p className="font-medium text-gray-700 mb-1">Custom Locations:</p>
              {request.pickup_location && (
                <p className="text-gray-600">
                  <span className="font-medium">Pickup:</span> {request.pickup_location.address}
                </p>
              )}
              {request.dropoff_location && (
                <p className="text-gray-600">
                  <span className="font-medium">Dropoff:</span> {request.dropoff_location.address}
                </p>
              )}
            </div>
          )}

          {request.message && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Message:</p>
              <p className="text-sm text-blue-800">{request.message}</p>
            </div>
          )}
        </div>

        {/* Response Message (if responded) */}
        {request.responded_at && request.status !== 'PENDING' && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-900">Response:</p>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.responded_at), { addSuffix: true })}
              </span>
            </div>
            {request.message && (
              <p className="text-sm text-gray-700">{request.message}</p>
            )}
          </div>
        )}

        {/* Response Form */}
        {showResponseForm && (
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {actionType === 'accept' ? 'Acceptance Message' : 'Decline Reason'} (optional)
            </label>
            <TextArea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder={
                actionType === 'accept'
                  ? "Welcome aboard! Looking forward to the trip..."
                  : "Sorry, but I have to decline because..."
              }
              rows={3}
              className="mb-3"
            />
            <div className="flex space-x-3">
              <Button
                onClick={submitResponse}
                disabled={isLoading}
                size="sm"
                className={actionType === 'accept' ? '' : 'bg-red-600 hover:bg-red-700'}
              >
                {actionType === 'accept' ? 'Accept Request' : 'Decline Request'}
              </Button>
              <Button
                onClick={() => {
                  setShowResponseForm(false);
                  setResponseMessage('');
                  setActionType(null);
                }}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!showResponseForm && (
          <div className="border-t border-gray-200 pt-4">
            {type === 'received' && request.status === 'PENDING' && !isExpired && (
              <div className="flex space-x-3">
                <Button
                  onClick={handleAccept}
                  disabled={isLoading}
                  size="sm"
                  className="flex-1"
                >
                  Accept
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  disabled={isLoading}
                  size="sm"
                  className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                >
                  Decline
                </Button>
              </div>
            )}

            {type === 'sent' && request.status === 'PENDING' && !isExpired && (
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isLoading}
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Cancel Request
              </Button>
            )}

            {request.status === 'ACCEPTED' && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Request accepted! You can now coordinate with {otherUser?.name}.</span>
              </div>
            )}

            {(request.status === 'DECLINED' || request.status === 'CANCELLED') && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Request {request.status.toLowerCase()}
                  {request.responded_at && ` ${formatDistanceToNow(new Date(request.responded_at), { addSuffix: true })}`}
                </span>
              </div>
            )}

            {isExpired && request.status === 'PENDING' && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Request expired. No action can be taken.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}