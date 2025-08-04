import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store';
import { TripEditForm } from '../../components/forms';
import { LoadingSpinner } from '../../components/ui';
import { ROUTES } from '../../constants';

export function EditTripPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTrip, isLoading, error, getTripById, setCurrentTrip } = useTripStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (id) {
      getTripById(id);
    }

    // Cleanup current trip when component unmounts
    return () => {
      setCurrentTrip(null);
    };
  }, [id, getTripById, setCurrentTrip]);

  const handleTripUpdated = (tripId: string) => {
    addToast({
      type: 'success',
      title: 'Trip Updated!',
      message: 'Your trip has been updated successfully.',
      duration: 5000,
    });

    // Navigate back to trip details
    navigate(`${ROUTES.TRIPS}/${tripId}`);
  };

  const handleCancel = () => {
    if (currentTrip) {
      navigate(`${ROUTES.TRIPS}/${currentTrip.id}`);
    } else {
      navigate(ROUTES.TRIPS);
    }
  };

  // Redirect if not authenticated
  if (!user) {
    navigate(ROUTES.LOGIN);
    return null;
  }

  // Show loading while fetching trip
  if (isLoading && !currentTrip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading trip details...</span>
      </div>
    );
  }

  // Show error if trip not found or failed to load
  if (error || !currentTrip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'The trip you\'re trying to edit doesn\'t exist or has been removed.'}
          </p>
          <button
            onClick={() => navigate(ROUTES.TRIPS)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Browse Trips
          </button>
        </div>
      </div>
    );
  }

  // Check if user is the owner of the trip
  if (currentTrip.user.id !== user.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit this trip. Only the trip owner can make changes.
          </p>
          <button
            onClick={() => navigate(`${ROUTES.TRIPS}/${currentTrip.id}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Trip Details
          </button>
        </div>
      </div>
    );
  }

  // Check if trip can be edited (only active trips)
  if (currentTrip.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cannot Edit Trip</h2>
          <p className="text-gray-600 mb-6">
            This trip cannot be edited because it is {currentTrip.status.toLowerCase()}. 
            Only active trips can be modified.
          </p>
          <button
            onClick={() => navigate(`${ROUTES.TRIPS}/${currentTrip.id}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Trip Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Trip</h1>
              <p className="mt-2 text-gray-600">
                Update your trip details and preferences
              </p>
              <p className="text-sm text-gray-500">
                {currentTrip.origin} → {currentTrip.destination}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <TripEditForm
          trip={currentTrip}
          onSuccess={() => handleTripUpdated(currentTrip.id)}
          onCancel={handleCancel}
          className="max-w-4xl"
        />

        {/* Important Notes */}
        <div className="mt-12 space-y-6">
          {/* Warning about existing passengers */}
          {currentTrip.current_passengers > 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="font-medium text-amber-900">Passengers Already Joined</h4>
                  <p className="text-amber-700 text-sm mt-1">
                    This trip already has {currentTrip.current_passengers - 1} passenger(s) who have joined. 
                    Major changes like departure time or location may affect them. Consider messaging 
                    your passengers before making significant changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tips for editing */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              💡 Tips for Editing Your Trip
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="font-medium">⏰</span>
                  <div>
                    <strong>Departure time changes:</strong> Notify passengers at least 2 hours before the original time.
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">🗺️</span>
                  <div>
                    <strong>Location changes:</strong> Minor adjustments are fine, but major route changes should be discussed.
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="font-medium">💰</span>
                  <div>
                    <strong>Price increases:</strong> Can only be made if passengers haven't paid yet.
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">👥</span>
                  <div>
                    <strong>Reducing seats:</strong> Make sure you don't exceed the new passenger limit.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}