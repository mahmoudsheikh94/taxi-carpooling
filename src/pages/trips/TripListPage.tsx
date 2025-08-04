import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { TripCard, TripList, TripFilters } from '../../components/trips';
import { Button, LoadingSpinner, EmptyState } from '../../components/ui';
import { ROUTES } from '../../constants';
import type { TripFilterFormData } from '../../utils/validations';

export function TripListPage() {
  const { user } = useAuthStore();
  const { 
    trips, 
    isLoading, 
    error, 
    currentPage, 
    hasMore, 
    totalCount,
    getTrips, 
    setFilters, 
    clearFilters, 
    setCurrentPage 
  } = useTripStore();

  const [activeFilters, setActiveFilters] = useState<TripFilterFormData>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load trips on component mount
    getTrips();
  }, [getTrips]);

  const handleFilterChange = (filters: TripFilterFormData) => {
    setActiveFilters(filters);
    setFilters(filters);
    getTrips(filters, 1); // Reset to first page with new filters
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    clearFilters();
    getTrips({}, 1);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      getTrips(activeFilters, nextPage);
    }
  };

  const handleJoinRequest = (tripId: string) => {
    // Navigate to trip details page for join request
    window.location.href = `${ROUTES.TRIPS}/${tripId}`;
  };

  const hasActiveFilters = Object.keys(activeFilters).some(key => {
    const value = activeFilters[key as keyof TripFilterFormData];
    return value !== undefined && value !== '' && value !== null;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Find a Ride</h1>
              <p className="mt-2 text-gray-600">
                Discover shared taxi rides and split the cost with fellow travelers
              </p>
              {totalCount > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  {totalCount} trip{totalCount !== 1 ? 's' : ''} available
                </p>
              )}
            </div>
            
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {hasActiveFilters && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
              
              <Link to={ROUTES.CREATE_TRIP}>
                <Button>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Trip
                </Button>
              </Link>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {activeFilters.departure_date && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Date: {new Date(activeFilters.departure_date).toLocaleDateString()}
                  </span>
                )}
                {activeFilters.min_price !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Min Price: ${activeFilters.min_price}
                  </span>
                )}
                {activeFilters.max_price !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Max Price: ${activeFilters.max_price}
                  </span>
                )}
                {activeFilters.max_passengers && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Seats: {activeFilters.max_passengers}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-8">
              <TripFilters
                onFiltersChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                initialFilters={activeFilters}
              />
            </div>
          </div>

          {/* Trip List */}
          <div className="flex-1">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading trips</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {isLoading && trips.length === 0 && (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading trips...</span>
              </div>
            )}

            {!isLoading && trips.length === 0 && !error && (
              <EmptyState
                icon={
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3v13" />
                  </svg>
                }
                title="No trips found"
                description={
                  hasActiveFilters
                    ? "No trips match your current filters. Try adjusting your search criteria."
                    : "No trips are currently available. Be the first to create one!"
                }
                action={
                  <Link to={ROUTES.CREATE_TRIP}>
                    <Button>Create Trip</Button>
                  </Link>
                }
              />
            )}

            {trips.length > 0 && (
              <div className="space-y-6">
                <TripList
                  trips={trips}
                  onJoinRequest={handleJoinRequest}
                  showJoinButton={true}
                />

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center pt-6">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="min-w-32"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner className="mr-2" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}

                {!hasMore && trips.length > 10 && (
                  <div className="text-center py-6">
                    <p className="text-gray-500">You've reached the end of the list</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}