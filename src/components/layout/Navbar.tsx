import { Fragment, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { 
  BellIcon, 
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  Cog8ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store';
import { useChatStore } from '../../store/chatStore';
import { useRequestStore } from '../../store/requestStore';
import { useToast } from '../ui';
import { Badge } from '../ui';
import { useInstallPrompt } from '../ui/InstallPrompt';
import { APP_NAME, ROUTES } from '../../constants';

export function Navbar() {
  const { user, signOut } = useAuthStore();
  const { totalUnreadCount } = useChatStore();
  const { receivedRequests, getUserRequests } = useRequestStore();
  const { canInstall, openPrompt } = useInstallPrompt();
  const toast = useToast();

  // Load user requests on mount
  useEffect(() => {
    if (user?.id) {
      getUserRequests(user.id, 'received');
    }
  }, [user?.id, getUserRequests]);

  const pendingRequestsCount = receivedRequests.filter(r => r.status === 'PENDING').length;

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out', 'You have been signed out successfully.');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link to={ROUTES.DASHBOARD}>
                <h1 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  🚕 {APP_NAME}
                </h1>
              </Link>
            </div>
            
            {/* Main Navigation */}
            <div className="hidden md:flex space-x-6">
              <Link 
                to={ROUTES.TRIPS}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Find Rides
              </Link>
              <Link 
                to={ROUTES.CREATE_TRIP}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Create Trip
              </Link>
              <Link 
                to={ROUTES.MY_TRIPS}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                My Trips
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Install App Button */}
            {canInstall && (
              <button
                onClick={openPrompt}
                className="navbar-install-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors pwa-touch-target"
                title="Install App"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}

            {/* Trip Requests */}
            <Link
              to={ROUTES.REQUESTS}
              className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
            >
              <span className="sr-only">View trip requests</span>
              <ClipboardDocumentListIcon className="h-6 w-6" />
              {pendingRequestsCount > 0 && (
                <div className="absolute -top-1 -right-1">
                  <Badge color="orange" size="sm" className="text-xs px-1.5 py-0.5">
                    {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                  </Badge>
                </div>
              )}
            </Link>

            {/* Chat Messages */}
            <Link
              to={ROUTES.CHAT}
              className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
            >
              <span className="sr-only">View messages</span>
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
              {totalUnreadCount > 0 && (
                <div className="absolute -top-1 -right-1">
                  <Badge color="red" size="sm" className="text-xs px-1.5 py-0.5">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Badge>
                </div>
              )}
            </Link>

            {/* Notifications */}
            <button
              type="button"
              className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" />
            </button>

            {/* Profile dropdown */}
            <Menu as="div" className="ml-3 relative">
              <Menu.Button className="bg-white flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full px-4 py-2 text-sm text-gray-700`}
                      >
                        <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Your Profile
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full px-4 py-2 text-sm text-gray-700`}
                      >
                        <Cog8ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Settings
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSignOut}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full px-4 py-2 text-sm text-gray-700`}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
}