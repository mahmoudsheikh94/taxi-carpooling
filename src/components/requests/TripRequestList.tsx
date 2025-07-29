import { useState, useEffect } from 'react';
import { TripRequestCard } from './TripRequestCard';
import { EmptyState, LoadingSpinner, Button } from '../ui';
import { useRequestStore } from '../../store/requestStore';
import { useAuthStore } from '../../store/authStore';
import type { TripRequest } from '../../types';

interface TripRequestListProps {
  type?: 'sent' | 'received' | 'all';
  tripId?: string;
  showFilters?: boolean;
  className?: string;
}

export function TripRequestList({ 
  type = 'all', 
  tripId,
  showFilters = true,
  className = '' 
}: TripRequestListProps) {
  const { user } = useAuthStore();
  const { 
    requests,
    sentRequests, 
    receivedRequests,
    isLoading, 
    error,
    getUserRequests,
    getRequests,
    subscribeToUserRequests,
    unsubscribeAll,
    clearError
  } = useRequestStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'deadline'>('newest');

  // Load requests on mount
  useEffect(() => {
    if (!user?.id) return;

    const loadRequests = async () => {
      if (tripId) {
        // Load requests for specific trip
        await getRequests({ trip_id: tripId });
      } else {
        // Load user's requests
        await getUserRequests(user.id, type === 'all' ? 'all' : type);
      }
    };

    loadRequests();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserRequests(user.id);
    
    return () => {
      unsubscribe();
    };
  }, [user?.id, type, tripId]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, []);

  const getFilteredRequests = (): TripRequest[] => {
    let requestList: TripRequest[] = [];

    // Select the appropriate request list
    if (tripId) {
      requestList = requests.filter(r => r.trip_id === tripId);
    } else {
      switch (type) {
        case 'sent':
          requestList = sentRequests;
          break;
        case 'received':
          requestList = receivedRequests;
          break;
        default:
          requestList = [...sentRequests, ...receivedRequests];
      }
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      requestList = requestList.filter(request => {
        const status = request.status.toLowerCase();
        return status === activeFilter || (activeFilter === 'pending' && status === 'pending');
      });
    }

    // Apply sorting
    return [...requestList].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'deadline':
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  };

  const filteredRequests = getFilteredRequests();

  const getRequestStats = () => {
    const all = type === 'all' ? [...sentRequests, ...receivedRequests] : 
                type === 'sent' ? sentRequests : receivedRequests;
    
    return {
      total: all.length,
      pending: all.filter(r => r.status === 'PENDING').length,
      accepted: all.filter(r => r.status === 'ACCEPTED').length,
      declined: all.filter(r => r.status === 'DECLINED').length,
    };
  };

  const stats = getRequestStats();

  const handleRefresh = async () => {
    if (!user?.id) return;
    
    clearError();
    if (tripId) {
      await getRequests({ trip_id: tripId });
    } else {
      await getUserRequests(user.id, type === 'all' ? 'all' : type);
    }
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-medium">Failed to load requests</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading && filteredRequests.length === 0) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filters */}
      {showFilters && !tripId && (
        <div className="mb-6 space-y-4">
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Requests', count: stats.total },
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'accepted', label: 'Accepted', count: stats.accepted },
              { key: 'declined', label: 'Declined', count: stats.declined },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === key
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{label}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeFilter === key ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="deadline">Deadline (urgent first)</option>
              </select>
            </div>

            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      )}

      {/* Request List */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          title={
            activeFilter === 'all' ? 'No requests yet' :
            activeFilter === 'pending' ? 'No pending requests' :
            activeFilter === 'accepted' ? 'No accepted requests' :
            'No declined requests'
          }
          description={
            type === 'sent' ? 'You haven\'t sent any trip requests yet.' :
            type === 'received' ? 'You haven\'t received any trip requests yet.' :
            'No trip requests found matching your criteria.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            // Determine if this is a sent or received request for the current user
            const requestType = request.sender_id === user?.id ? 'sent' : 'received';
            
            return (
              <TripRequestCard
                key={request.id}
                request={request}
                type={requestType}
                onUpdate={handleRefresh}
              />
            );
          })}
        </div>
      )}

      {/* Loading more indicator */}
      {isLoading && filteredRequests.length > 0 && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" />
        </div>
      )}
    </div>
  );
}