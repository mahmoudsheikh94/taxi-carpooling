import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, Badge } from '../components/ui';
import { Navbar } from '../components/layout';
import { useAuthStore } from '../store';
import { useChatStore } from '../store/chatStore';
import { ROUTES } from '../constants';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { chatRooms, totalUnreadCount, getChatRooms } = useChatStore();

  // Load chat rooms on mount
  useEffect(() => {
    if (user?.id) {
      getChatRooms(user.id);
    }
  }, [user?.id, getChatRooms]);

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
              <p className="text-gray-500">No trips yet</p>
              <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium">
                Create your first trip
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Trip Matches"
              subtitle="Compatible trips found for you"
            />
            <div className="text-center py-8">
              <p className="text-gray-500">No matches yet</p>
              <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium">
                Find matches
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader
              title={
                <div className="flex items-center space-x-2">
                  <span>Messages</span>
                  {totalUnreadCount > 0 && (
                    <Badge color="red" size="sm">
                      {totalUnreadCount}
                    </Badge>
                  )}
                </div>
              }
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
              title="Phase 2 Complete! 🎉"
              subtitle="Authentication system is fully functional"
            />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">✅ User authentication with Supabase</p>
              <p className="text-sm text-gray-600">✅ Protected routes and auth guards</p>
              <p className="text-sm text-gray-600">✅ Form validation with React Hook Form + Zod</p>
              <p className="text-sm text-gray-600">✅ Toast notifications</p>
              <p className="text-sm text-gray-600">✅ User profile management ready</p>
              <p className="text-sm text-blue-600 font-medium mt-4">
                Ready for Phase 3: Trip Management System
              </p>
            </div>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}