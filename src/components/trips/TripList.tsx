import { useEffect, useState } from 'react';
import { useTripStore } from '../../store/tripStore';
import { TripCard } from './TripCard';
import { TripFilters } from './TripFilters';
import { Button, LoadingSpinner, EmptyState } from '../ui';
import { useToast } from '../../hooks/useToast';
import type { TripFilterFormData } from '../../utils/validations';

interface TripListProps {
  showFilters?: boolean;
  userId?: string;
  status?: string;
  limit?: number;
  className?: string;
}

export function TripList({ 
  showFilters = true, 
  userId, 
  status, 
  limit,
  className = '' 
}: TripListProps) {
  const {
    trips,
    isLoading,
    error,
    hasMore,
    currentPage,
    activeFilters,
    getTrips,
    getUserTrips,
    setFilters,
    setCurrentPage,
    subscribeToTrips,
    unsubscribeFromTrips,
  } = useTripStore();

  const { showToast } = useToast();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load initial trips
  useEffect(() => {
    const loadTrips = async () => {
      if (userId) {
        await getUserTrips(userId, status);
      } else {
        await getTrips(activeFilters, 1);
      }
    };

    loadTrips();

    // Subscribe to real-time updates if not filtering by user
    if (!userId) {
      subscribeToTrips();
      return () => unsubscribeFromTrips();
    }
  }, [userId, status, activeFilters, getTrips, getUserTrips, subscribeToTrips, unsubscribeFromTrips]);

  // Handle filter changes
  const handleFiltersChange = async (filters: TripFilterFormData) => {
    setFilters(filters);
    setCurrentPage(1);
    await getTrips(filters, 1);
  };

  // Handle load more
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    try {
      if (userId) {
        await getUserTrips(userId, status);
      } else {
        await getTrips(activeFilters, nextPage);
      }
    } catch (err) {
      showToast('Failed to load more trips', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle join request
  const handleJoinRequest = (tripId: string) => {
    // This would typically open a modal or navigate to a join request page
    showToast('Join request feature coming soon!', 'info');
    console.log('Join request for trip:', tripId);
  };

  // Show error state
  if (error && !isLoading && trips.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          title="Failed to load trips"
          description={error}
          action={
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  // Show empty state
  if (!isLoading && trips.length === 0) {
    const emptyTitle = userId ? 'No trips found' : 'No trips available';
    const emptyDescription = userId 
      ? 'You haven\'t created any trips yet.' 
      : 'No trips match your search criteria. Try adjusting your filters or check back later.';
    
    return (
      <div className={className}>
        {showFilters && (
          <div className="mb-6">
            <TripFilters
              onFiltersChange={handleFiltersChange}
              initialFilters={activeFilters}
            />
          </div>
        )}
        
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            !userId ? (
              <Button onClick={() => handleFiltersChange({})}>
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filters */}
      {showFilters && (
        <div className="mb-6">
          <TripFilters
            onFiltersChange={handleFiltersChange}
            initialFilters={activeFilters}
          />
        </div>
      )}

      {/* Loading state for initial load */}
      {isLoading && trips.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-2 text-sm text-gray-600">Loading trips...</p>
          </div>
        </div>
      )}

      {/* Trip List */}
      {trips.length > 0 && (
        <div className="space-y-4">
          {/* Results count */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {trips.length} {trips.length === 1 ? 'trip' : 'trips'} found
            </div>
            
            {/* Sort options could go here */}
          </div>

          {/* Trip Cards */}
          <div className="grid grid-cols-1 gap-4">
            {trips.slice(0, limit).map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onJoinRequest={handleJoinRequest}
                showJoinButton={!userId && trip.status === 'ACTIVE'}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && !limit && (
            <div className="flex justify-center pt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore && <LoadingSpinner className="mr-2" />}
                {isLoadingMore ? 'Loading...' : 'Load More Trips'}
              </Button>
            </div>
          )}

          {/* No more trips message */}
          {!hasMore && trips.length >= 20 && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">
                You've seen all available trips. Try adjusting your filters to see more results.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error banner for partial failures */}
      {error && trips.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}