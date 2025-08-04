import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, Badge, Button } from '../components/ui';
import { Navbar } from '../components/layout';
import { useAuthStore } from '../store';
import { useChatStore } from '../store/chatStore';
import { useTripStore } from '../store/tripStore';
import { ROUTES } from '../constants';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { chatRooms, totalUnreadCount, getChatRooms } = useChatStore();
  const { trips, isLoading, getTrips, getUserTrips } = useTripStore();

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      getChatRooms(user.id);
      getUserTrips(user.id); // Load user's trips
      getTrips({}, 1); // Load recent trips for matches
    }
  }, [user?.id, getChatRooms, getUserTrips, getTrips]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your trips and find compatible travel companions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader
              title="Your Trips"
              subtitle="Manage your upcoming and past trips"
            />
            <div className="text-center py-8">
              {isLoading ? (
                <p className="text-gray-500">Loading trips...</p>
              ) : trips.filter(trip => trip.driver_id === user?.id).length > 0 ? (
                <>
                  <p className="text-gray-600 font-medium text-lg">
                    {trips.filter(trip => trip.driver_id === user?.id).length}
                  </p>
                  <p className="text-gray-500 text-sm">Active trips</p>
                  <Link 
                    to={ROUTES.MY_TRIPS}
                    className="inline-block mt-2 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Manage trips
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-gray-500">No trips yet</p>
                  <Link 
                    to={ROUTES.CREATE_TRIP}
                    className="inline-block mt-2 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Create your first trip
                  </Link>
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Available Trips"
              subtitle="Find and join compatible rides"
            />
            <div className="text-center py-8">
              {isLoading ? (
                <p className="text-gray-500">Loading available trips...</p>
              ) : trips.filter(trip => trip.driver_id !== user?.id).length > 0 ? (
                <>
                  <p className="text-gray-600 font-medium text-lg">
                    {trips.filter(trip => trip.driver_id !== user?.id).length}
                  </p>
                  <p className="text-gray-500 text-sm">Available trips</p>
                  <Link 
                    to={ROUTES.TRIPS}
                    className="inline-block mt-2 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Browse trips
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-gray-500">No trips available</p>
                  <Link 
                    to={ROUTES.TRIPS}
                    className="inline-block mt-2 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Check for new trips
                  </Link>
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Messages"
              subtitle="Chat with your travel companions"
            />
            <div className="text-center py-8">
              {chatRooms.length === 0 ? (
                <>
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start by matching with other trips</p>
                </>
              ) : (
                <>
                  <p className="text-gray-600">
                    {chatRooms.length} conversation{chatRooms.length !== 1 ? 's' : ''}
                  </p>
                  {totalUnreadCount > 0 && (
                    <p className="text-sm text-blue-600 mt-1">
                      {totalUnreadCount} unread message{totalUnreadCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </>
              )}
              <Link 
                to={ROUTES.CHAT}
                className="inline-block mt-3 text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                View all chats
              </Link>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader
              title="Quick Actions"
              subtitle="Get started with your carpooling journey"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to={ROUTES.CREATE_TRIP}>
                <Button className="w-full h-16 text-left justify-start bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200">
                  <div>
                    <div className="font-medium">Create Trip</div>
                    <div className="text-xs text-blue-600">Share your ride</div>
                  </div>
                </Button>
              </Link>
              
              <Link to={ROUTES.TRIPS}>
                <Button className="w-full h-16 text-left justify-start bg-green-50 hover:bg-green-100 text-green-700 border border-green-200">
                  <div>
                    <div className="font-medium">Find Rides</div>
                    <div className="text-xs text-green-600">Join existing trips</div>
                  </div>
                </Button>
              </Link>
              
              <Link to={ROUTES.MY_TRIPS}>
                <Button className="w-full h-16 text-left justify-start bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200">
                  <div>
                    <div className="font-medium">My Trips</div>
                    <div className="text-xs text-purple-600">Manage your rides</div>
                  </div>
                </Button>
              </Link>
              
              <Link to={ROUTES.CHAT}>
                <Button className="w-full h-16 text-left justify-start bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200">
                  <div>
                    <div className="font-medium">Messages</div>
                    <div className="text-xs text-orange-600">Chat with travelers</div>
                  </div>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}