import { useState, useEffect } from 'react';
import { MatchCard } from './MatchCard';
import { Card, Button, LoadingSpinner, EmptyState } from '../ui';
import { useMatchStore } from '../../store/matchStore';
import { useAuthStore } from '../../store/authStore';
import type { TripMatch } from '../../types';
import type { MatchFilters } from '../../services/supabase/matches';

interface MatchListProps {
  tripId?: string;
  userId?: string;
  filters?: MatchFilters;
  showFilters?: boolean;
  onMatchSelect?: (match: TripMatch) => void;
  onMatchContact?: (match: TripMatch) => void;
  onMatchAccept?: (match: TripMatch) => void;
  onMatchDecline?: (match: TripMatch) => void;
  className?: string;
}

export function MatchList({
  tripId,
  userId,
  filters,
  showFilters = false,
  onMatchSelect,
  onMatchContact,
  onMatchAccept,
  onMatchDecline,
  className = '',
}: MatchListProps) {
  const { user } = useAuthStore();
  const {
    matches,
    isLoading,
    error,
    hasMore,
    currentPage,
    totalCount,
    activeFilters,
    getTripMatches,
    getUserMatches,
    setFilters,
    clearFilters,
    setCurrentPage,
    subscribeToUserMatches,
    clearError,
  } = useMatchStore();

  const [localFilters, setLocalFilters] = useState<MatchFilters>(filters || {});
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Determine which ID to use for loading matches
  const effectiveTripId = tripId;
  const effectiveUserId = userId || user?.id;

  // Load matches on mount and when dependencies change
  useEffect(() => {
    if (effectiveTripId) {
      getTripMatches(effectiveTripId, 1);
    } else if (effectiveUserId) {
      getUserMatches(effectiveUserId, 1, localFilters);
    }
  }, [effectiveTripId, effectiveUserId, localFilters]);

  // Set up real-time subscription for user matches
  useEffect(() => {
    if (effectiveUserId && !effectiveTripId && !isSubscribed) {
      const unsubscribe = subscribeToUserMatches(effectiveUserId);
      setIsSubscribed(true);
      
      return () => {
        unsubscribe();
        setIsSubscribed(false);
      };
    }
  }, [effectiveUserId, effectiveTripId, isSubscribed, subscribeToUserMatches]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    if (effectiveTripId) {
      getTripMatches(effectiveTripId, nextPage);
    } else if (effectiveUserId) {
      getUserMatches(effectiveUserId, nextPage, activeFilters);
    }
  };

  const handleApplyFilters = () => {
    setFilters(localFilters);
    if (effectiveUserId) {
      getUserMatches(effectiveUserId, 1, localFilters);
    }
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    clearFilters();
    if (effectiveUserId) {
      getUserMatches(effectiveUserId, 1, {});
    }
  };

  const handleFilterChange = (key: keyof MatchFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">Failed to load matches</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <Button onClick={clearError} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters Section */}
      {showFilters && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Filter Matches</h3>
              <div className="flex space-x-2">
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  size="sm"
                  disabled={Object.keys(activeFilters).length === 0}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  size="sm"
                  disabled={JSON.stringify(localFilters) === JSON.stringify(activeFilters)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={localFilters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="SUGGESTED">Suggested</option>
                  <option value="VIEWED">Viewed</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="DECLINED">Declined</option>
                </select>
              </div>

              {/* Match Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match Type
                </label>
                <select
                  value={localFilters.matchType || ''}
                  onChange={(e) => handleFilterChange('matchType', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="exact_route">Same Route</option>
                  <option value="partial_overlap">Shared Path</option>
                  <option value="detour_pickup">Pickup Detour</option>
                  <option value="detour_dropoff">Dropoff Detour</option>
                </select>
              </div>

              {/* Minimum Score Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min. Compatibility
                </label>
                <select
                  value={localFilters.minScore || ''}
                  onChange={(e) => handleFilterChange('minScore', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Score</option>
                  <option value="0.8">Excellent (80%+)</option>
                  <option value="0.6">Good (60%+)</option>
                  <option value="0.4">Fair (40%+)</option>
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {effectiveTripId ? 'Trip Matches' : 'Your Matches'}
          </h2>
          {totalCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {totalCount} {totalCount === 1 ? 'match' : 'matches'} found
              {Object.keys(activeFilters).length > 0 && ' (filtered)'}
            </p>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && matches.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Finding your matches...</p>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && matches.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          title="No matches found"
          description={
            Object.keys(activeFilters).length > 0
              ? "Try adjusting your filters to find more matches."
              : effectiveTripId
              ? "No compatible trips found for this route yet. Check back later!"
              : "No matches available yet. Create a trip to start finding compatible rides!"
          }
          action={
            Object.keys(activeFilters).length > 0 ? (
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Match Cards */}
      {matches.length > 0 && (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onViewDetails={onMatchSelect}
              onContact={onMatchContact}
              onAccept={onMatchAccept}
              onDecline={onMatchDecline}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && matches.length > 0 && (
        <div className="text-center pt-6">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            disabled={isLoading}
            className="min-w-32"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              'Load More Matches'
            )}
          </Button>
        </div>
      )}

      {/* Real-time indicator */}
      {isSubscribed && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live updates enabled</span>
          </div>
        </div>
      )}
    </div>
  );
}