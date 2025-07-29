import { useEffect, useState } from 'react';
import { getRoute } from '../../services/maps';
import { GoogleMap } from './GoogleMap';
import { Card, Button, LoadingSpinner } from '../ui';
import type { LocationFormData } from '../../utils/validations';

interface RouteDisplayProps {
  origin: LocationFormData;
  destination: LocationFormData;
  onRouteCalculated?: (route: google.maps.DirectionsResult) => void;
  onError?: (error: string) => void;
  className?: string;
  height?: string;
  showDetails?: boolean;
  travelMode?: google.maps.TravelMode;
}

interface RouteInfo {
  distance: string;
  duration: string;
  durationInTraffic?: string;
  steps: Array<{
    instructions: string;
    distance: string;
    duration: string;
  }>;
}

export function RouteDisplay({
  origin,
  destination,
  onRouteCalculated,
  onError,
  className,
  height = '400px',
  showDetails = true,
  travelMode = google.maps.TravelMode.DRIVING,
}: RouteDisplayProps) {
  const [route, setRoute] = useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const calculateRoute = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getRoute(
          origin.coordinates,
          destination.coordinates,
          travelMode
        );

        if (result && result.routes && result.routes.length > 0) {
          const firstRoute = result.routes[0];
          const leg = firstRoute.legs[0];

          const routeDetails: RouteInfo = {
            distance: leg.distance?.text || 'Unknown distance',
            duration: leg.duration?.text || 'Unknown duration',
            durationInTraffic: leg.duration_in_traffic?.text,
            steps: leg.steps.map(step => ({
              instructions: step.instructions,
              distance: step.distance?.text || '',
              duration: step.duration?.text || '',
            })),
          };

          setRoute(result);
          setRouteInfo(routeDetails);
          onRouteCalculated?.(result);
        } else {
          throw new Error('No route found');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to calculate route';
        setError(errorMessage);
        onError?.(errorMessage);
        console.error('Route calculation error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (origin.coordinates && destination.coordinates) {
      calculateRoute();
    }
  }, [origin, destination, travelMode, onRouteCalculated, onError]);

  const formatInstructions = (instructions: string): string => {
    // Remove HTML tags from Google's turn-by-turn instructions
    return instructions.replace(/<[^>]*>/g, '');
  };

  const markers = [
    {
      position: origin.coordinates,
      title: 'Origin',
      info: `<div><strong>Starting Point</strong><br/>${origin.address}</div>`,
    },
    {
      position: destination.coordinates,
      title: 'Destination',
      info: `<div><strong>Destination</strong><br/>${destination.address}</div>`,
    },
  ];

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-2 text-sm text-gray-600">Calculating route...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card className="p-6 text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Route Calculation Failed</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            size="sm"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!route || !routeInfo) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Map Display */}
        <GoogleMap
          center={origin.coordinates}
          zoom={12}
          markers={markers}
          route={route}
          height={height}
          className="rounded-lg border"
        />

        {/* Route Details */}
        {showDetails && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Route Details</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{routeInfo.distance}</span>
                <span>•</span>
                <span>{routeInfo.duration}</span>
                {routeInfo.durationInTraffic && (
                  <>
                    <span>•</span>
                    <span className="text-orange-600">
                      {routeInfo.durationInTraffic} in traffic
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Route Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">From</p>
                <p className="text-sm text-gray-600">{origin.address}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">To</p>
                <p className="text-sm text-gray-600">{destination.address}</p>
              </div>
            </div>

            {/* Turn-by-Turn Directions Toggle */}
            <div className="border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSteps(!showSteps)}
                className="w-full md:w-auto"
              >
                {showSteps ? 'Hide' : 'Show'} Turn-by-Turn Directions
                <svg 
                  className={`w-4 h-4 ml-2 transition-transform ${showSteps ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </div>

            {/* Turn-by-Turn Directions */}
            {showSteps && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Turn-by-Turn Directions ({routeInfo.steps.length} steps)
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {routeInfo.steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {formatInstructions(step.instructions)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                          <span>{step.distance}</span>
                          <span>•</span>
                          <span>{step.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}