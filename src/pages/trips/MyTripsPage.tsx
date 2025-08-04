import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { TripCard } from '../../components/trips';
import { Button, Card, Badge, LoadingSpinner, EmptyState, Tabs } from '../../components/ui';
import { ROUTES } from '../../constants';
import type { Trip } from '../../types';

type TripTab = 'active' | 'completed' | 'cancelled' | 'all';

export function MyTripsPage() {
  const { user } = useAuthStore();
  const { userTrips, isLoading, error, getUserTrips, cancelTrip, deleteTrip } = useTripStore();
  
  const [activeTab, setActiveTab] = useState<TripTab>('active');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Load all user trips
      getUserTrips(user.id);
    }
  }, [user, getUserTrips]);

  const handleCancelTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to cancel this trip? This action cannot be undone.')) {
      return;
    }

    setActionLoading(tripId);
    try {
      await cancelTrip(tripId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return;
    }

    setActionLoading(tripId);
    try {
      await deleteTrip(tripId);
    } finally {
      setActionLoading(null);
    }
  };

  const filterTripsByStatus = (trips: Trip[], status: TripTab): Trip[] => {
    if (status === 'all') return trips;
    return trips.filter(trip => trip.status.toLowerCase() === status.toUpperCase());
  };

  const getTabCounts = (trips: Trip[]) => {
    return {
      active: trips.filter(t => t.status === 'ACTIVE').length,
      completed: trips.filter(t => t.status === 'COMPLETED').length,
      cancelled: trips.filter(t => t.status === 'CANCELLED').length,
      all: trips.length,
    };
  };

  const getStatusStats = (trips: Trip[]) => {
    const activeTrips = trips.filter(t => t.status === 'ACTIVE');
    const completedTrips = trips.filter(t => t.status === 'COMPLETED');
    const upcomingTrips = activeTrips.filter(t => new Date(t.departure_time) > new Date());
    const totalPassengers = activeTrips.reduce((sum, trip) => sum + trip.current_passengers, 0);

    return {
      total: trips.length,
      active: activeTrips.length,
      completed: completedTrips.length,
      upcoming: upcomingTrips.length,
      totalPassengers,
    };
  };

  if (!user) {
    return null;
  }

  const tabCounts = getTabCounts(userTrips);
  const stats = getStatusStats(userTrips);
  const filteredTrips = filterTripsByStatus(userTrips, activeTab);

  const tabs = [
    { id: 'active' as TripTab, label: 'Active', count: tabCounts.active },
    { id: 'completed' as TripTab, label: 'Completed', count: tabCounts.completed },
    { id: 'cancelled' as TripTab, label: 'Cancelled', count: tabCounts.cancelled },
    { id: 'all' as TripTab, label: 'All', count: tabCounts.all },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
              <p className="mt-2 text-gray-600">
                Manage your taxi sharing trips and view your travel history
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <Link to={ROUTES.CREATE_TRIP}>
                <Button>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Trip
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3v13" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Trips</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPassengers}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Trip Tabs */}
        <Card className="mb-6">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId: string) => setActiveTab(tabId as TripTab)}
            showCount={true}
          />
        </Card>

        {/* Trip List */}
        {isLoading && userTrips.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">Loading your trips...</span>
          </div>
        )}

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

        {!isLoading && filteredTrips.length === 0 && !error && (
          <EmptyState
            icon={
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3v13" />
              </svg>
            }
            title={`No ${activeTab === 'all' ? '' : activeTab} trips found`}
            description={
              activeTab === 'active' 
                ? "You don't have any active trips. Create one to start sharing rides!"
                : `You don't have any ${activeTab} trips yet.`
            }
            action={
              activeTab === 'active' && (
                <Link to={ROUTES.CREATE_TRIP}>
                  <Button>Create Your First Trip</Button>
                </Link>
              )
            }
          />
        )}

        {filteredTrips.length > 0 && (
          <div className="space-y-6">
            {filteredTrips.map((trip) => (
              <div key={trip.id} className="relative">
                <TripCard
                  trip={trip}
                  showJoinButton={false}
                  className="hover:shadow-lg transition-shadow"
                />
                
                {/* Action Buttons for Trip Owner */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  {trip.status === 'ACTIVE' && (
                    <>
                      <Link to={`${ROUTES.TRIPS}/${trip.id}/edit`}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelTrip(trip.id)}
                        disabled={actionLoading === trip.id}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {actionLoading === trip.id ? (
                          <LoadingSpinner className="w-4 h-4" />
                        ) : (
                          'Cancel'
                        )}
                      </Button>
                    </>
                  )}
                  
                  {trip.status === 'CANCELLED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTrip(trip.id)}
                      disabled={actionLoading === trip.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {actionLoading === trip.id ? (
                        <LoadingSpinner className="w-4 h-4" />
                      ) : (
                        'Delete'
                      )}
                    </Button>
                  )}

                  <Link to={`${ROUTES.TRIPS}/${trip.id}`}>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {userTrips.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to={ROUTES.CREATE_TRIP}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Create Trip</p>
                      <p className="text-sm text-gray-600">Start a new journey</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to={ROUTES.TRIPS}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Browse Trips</p>
                      <p className="text-sm text-gray-600">Find rides to join</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to={ROUTES.REQUESTS}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">View Requests</p>
                      <p className="text-sm text-gray-600">Manage join requests</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to={ROUTES.CHAT}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Messages</p>
                      <p className="text-sm text-gray-600">Chat with passengers</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}