import { useState } from 'react';
import { Navbar } from '../../components/layout';
import { TripRequestList } from '../../components/requests';
import { Button, Badge } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useRequestStore } from '../../store/requestStore';

export function RequestsPage() {
  const { user } = useAuthStore();
  const { sentRequests, receivedRequests } = useRequestStore();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  const pendingReceived = receivedRequests.filter(r => r.status === 'PENDING').length;
  const pendingSent = sentRequests.filter(r => r.status === 'PENDING').length;

  const tabs = [
    {
      key: 'received',
      label: 'Received',
      count: receivedRequests.length,
      pending: pendingReceived,
      description: 'Requests from others to join your trips'
    },
    {
      key: 'sent',
      label: 'Sent',
      count: sentRequests.length,
      pending: pendingSent,
      description: 'Your requests to join other trips'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trip Requests
          </h1>
          <p className="text-gray-600">
            Manage requests to join trips and track your own trip applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all ${
                activeTab === tab.key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {tab.label} Requests
                </h3>
                <div className="flex items-center space-x-2">
                  <Badge color="blue" variant="outline">
                    {tab.count} total
                  </Badge>
                  {tab.pending > 0 && (
                    <Badge color="orange" size="sm">
                      {tab.pending} pending
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {tab.description}
              </p>
              
              {tab.pending > 0 && (
                <div className="flex items-center space-x-2 text-sm font-medium text-orange-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Requires attention</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <Badge 
                        color={activeTab === tab.key ? 'blue' : 'gray'} 
                        size="sm"
                      >
                        {tab.count}
                      </Badge>
                    )}
                    {tab.pending > 0 && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Request List */}
          <div className="p-6">
            {user?.id && (
              <TripRequestList
                type={activeTab}
                showFilters={true}
              />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => window.location.href = '/trips'}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Browse Trips</span>
            </Button>
            
            <Button
              onClick={() => window.location.href = '/trips/create'}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Trip</span>
            </Button>
            
            <Button
              onClick={() => window.location.href = '/matches'}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Find Matches</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}