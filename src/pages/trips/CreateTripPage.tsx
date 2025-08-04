import { useNavigate } from 'react-router-dom';
import { TripForm } from '../../components/forms';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store';
import { ROUTES } from '../../constants';

export function CreateTripPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const handleTripCreated = (tripId: string) => {
    addToast({
      type: 'success',
      title: 'Trip Created!',
      message: 'Your trip has been created successfully. Other users can now find and join your trip.',
      duration: 5000,
    });

    // Navigate to the trip details page
    navigate(`${ROUTES.TRIPS}/${tripId}`);
  };

  const handleCancel = () => {
    navigate(ROUTES.TRIPS);
  };

  // Redirect if not authenticated
  if (!user) {
    navigate(ROUTES.LOGIN);
    return null;
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
              <h1 className="text-3xl font-bold text-gray-900">Create New Trip</h1>
              <p className="mt-2 text-gray-600">
                Share your taxi ride and connect with fellow travelers
              </p>
            </div>
          </div>
        </div>

        {/* Trip Creation Form */}
        <TripForm
          onSuccess={handleTripCreated}
          onCancel={handleCancel}
          className="max-w-4xl"
        />

        {/* Tips Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            💡 Tips for Creating a Great Trip
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="font-medium">🗺️</span>
                <div>
                  <strong>Be specific with locations:</strong> Use exact addresses or landmarks for easy pickup and drop-off.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">⏰</span>
                <div>
                  <strong>Plan departure time:</strong> Allow extra time for pickup and potential traffic delays.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">💰</span>
                <div>
                  <strong>Fair pricing:</strong> Consider fuel, tolls, and wear-and-tear when setting your price.
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="font-medium">📝</span>
                <div>
                  <strong>Add helpful notes:</strong> Include special instructions, meeting points, or contact preferences.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">🚗</span>
                <div>
                  <strong>Vehicle details:</strong> Help passengers identify your car by providing make, model, and color.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">🤝</span>
                <div>
                  <strong>Set expectations:</strong> Clearly indicate your preferences for music, conversation, etc.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Notice */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="font-medium text-amber-900">Safety First</h4>
              <p className="text-amber-700 text-sm mt-1">
                Always verify passenger identities before pickup. Share your trip details with a trusted contact, 
                and trust your instincts. If something doesn't feel right, don't hesitate to cancel the trip.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}