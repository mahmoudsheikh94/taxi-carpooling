import { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, LoadingSpinner } from '../ui';
import { CompatibilityScore } from './CompatibilityScore';
import type { Trip, TripMatch } from '../../types';
import type { CompatibilityAnalysis } from '../../services/matching/matchingAlgorithm';

interface RouteComparisonProps {
  sourceTrip: Trip;
  targetTrip: Trip;
  match?: TripMatch;
  compatibilityAnalysis?: CompatibilityAnalysis;
  onMeetingPointSelect?: (point: google.maps.LatLng) => void;
  className?: string;
}

export function RouteComparison({
  sourceTrip,
  targetTrip,
  match,
  compatibilityAnalysis,
  onMeetingPointSelect,
  className = '',
}: RouteComparisonProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer1, setDirectionsRenderer1] = useState<google.maps.DirectionsRenderer | null>(null);
  const [directionsRenderer2, setDirectionsRenderer2] = useState<google.maps.DirectionsRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: 0, lng: 0 },
      styles: [
        {
          featureType: 'poi',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    const service = new google.maps.DirectionsService();
    const renderer1 = new google.maps.DirectionsRenderer({
      map: mapInstance,
      polylineOptions: {
        strokeColor: '#3B82F6',
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
      markerOptions: {
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      },
    });

    const renderer2 = new google.maps.DirectionsRenderer({
      map: mapInstance,
      polylineOptions: {
        strokeColor: '#10B981',
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
      markerOptions: {
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      },
    });

    setMap(mapInstance);
    setDirectionsService(service);
    setDirectionsRenderer1(renderer1);
    setDirectionsRenderer2(renderer2);
  }, []);

  // Load route directions
  useEffect(() => {
    if (!directionsService || !directionsRenderer1 || !directionsRenderer2 || !map) return;

    const loadRoutes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [result1, result2] = await Promise.all([
          new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            directionsService.route(
              {
                origin: {
                  lat: sourceTrip.origin_location?.lat || 0,
                  lng: sourceTrip.origin_location?.lng || 0,
                },
                destination: {
                  lat: sourceTrip.destination_location?.lat || 0,
                  lng: sourceTrip.destination_location?.lng || 0,
                },
                travelMode: google.maps.TravelMode.DRIVING,
                optimizeWaypoints: true,
              },
              (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(new Error(`Failed to get directions for source trip: ${status}`));
                }
              }
            );
          }),
          new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            directionsService.route(
              {
                origin: {
                  lat: targetTrip.origin_location?.lat || 0,
                  lng: targetTrip.destination_location?.lng || 0,
                },
                destination: {
                  lat: targetTrip.destination_location?.lat || 0,
                  lng: targetTrip.destination_location?.lng || 0,
                },
                travelMode: google.maps.TravelMode.DRIVING,
                optimizeWaypoints: true,
              },
              (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(new Error(`Failed to get directions for target trip: ${status}`));
                }
              }
            );
          }),
        ]);

        directionsRenderer1.setDirections(result1);
        directionsRenderer2.setDirections(result2);

        // Fit bounds to show both routes
        const bounds = new google.maps.LatLngBounds();
        
        // Add all waypoints from both routes to bounds
        result1.routes[0].legs.forEach(leg => {
          bounds.extend(leg.start_location);
          bounds.extend(leg.end_location);
        });
        
        result2.routes[0].legs.forEach(leg => {
          bounds.extend(leg.start_location);
          bounds.extend(leg.end_location);
        });

        map.fitBounds(bounds);
        
        // Add meeting point markers if available
        if (match?.suggested_pickup_point) {
          new google.maps.Marker({
            position: {
              lat: match.suggested_pickup_point.lat,
              lng: match.suggested_pickup_point.lng,
            },
            map,
            title: 'Suggested Meeting Point',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#F59E0B',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
          });
        }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load routes');
        setIsLoading(false);
      }
    };

    loadRoutes();
  }, [directionsService, directionsRenderer1, directionsRenderer2, map, sourceTrip, targetTrip, match]);

  const getRouteStats = (trip: Trip) => {
    return {
      distance: trip.distance ? `${trip.distance.toFixed(1)} km` : 'Unknown',
      duration: trip.estimated_duration ? `${Math.round(trip.estimated_duration)} min` : 'Unknown',
      price: trip.price_per_seat ? `${trip.currency === 'USD' ? '$' : trip.currency}${trip.price_per_seat}` : 'Free',
    };
  };

  const sourceStats = getRouteStats(sourceTrip);
  const targetStats = getRouteStats(targetTrip);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Compatibility Score */}
      {(match || compatibilityAnalysis) && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Route Comparison</h3>
          <CompatibilityScore
            score={match?.compatibility_score || compatibilityAnalysis?.overallScore || 0}
            matchType={match?.match_type || compatibilityAnalysis?.matchType || 'partial_overlap'}
            showBreakdown={true}
            routeScore={compatibilityAnalysis?.scores.route}
            timeScore={compatibilityAnalysis?.scores.time}
            preferencesScore={compatibilityAnalysis?.scores.preferences}
            priceScore={compatibilityAnalysis?.scores.price}
          />
        </div>
      )}

      {/* Map Container */}
      <Card className="relative overflow-hidden">
        <div className="h-80 w-full" ref={mapRef}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600 mt-4">Loading route comparison...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center text-red-600">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="font-medium">Failed to load routes</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Map Legend */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 z-10">
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-blue-500 rounded"></div>
              <span className="text-gray-700">Your Route</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-green-500 rounded"></div>
              <span className="text-gray-700">Match Route</span>
            </div>
            {match?.suggested_pickup_point && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-gray-700">Meeting Point</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Route Details Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Route */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h4 className="font-medium text-gray-900">Your Route</h4>
            <Badge color="blue" size="sm">Source</Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{sourceTrip.origin}</div>
                <div className="text-xs text-gray-500 truncate">
                  {sourceTrip.origin_location?.address}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{sourceTrip.destination}</div>
                <div className="text-xs text-gray-500 truncate">
                  {sourceTrip.destination_location?.address}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xs text-gray-500">Distance</div>
              <div className="font-medium text-sm text-gray-900">{sourceStats.distance}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Duration</div>
              <div className="font-medium text-sm text-gray-900">{sourceStats.duration}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Price</div>
              <div className="font-medium text-sm text-gray-900">{sourceStats.price}</div>
            </div>
          </div>
        </Card>

        {/* Match Route */}
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h4 className="font-medium text-gray-900">Match Route</h4>
            <Badge color="green" size="sm">Target</Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{targetTrip.origin}</div>
                <div className="text-xs text-gray-500 truncate">
                  {targetTrip.origin_location?.address}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{targetTrip.destination}</div>
                <div className="text-xs text-gray-500 truncate">
                  {targetTrip.destination_location?.address}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xs text-gray-500">Distance</div>
              <div className="font-medium text-sm text-gray-900">{targetStats.distance}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Duration</div>
              <div className="font-medium text-sm text-gray-900">{targetStats.duration}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Price</div>
              <div className="font-medium text-sm text-gray-900">{targetStats.price}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detour and Savings Information */}
      {match && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-4">Trip Impact</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {match.detour_distance && (
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  +{match.detour_distance.toFixed(1)}km
                </div>
                <div className="text-xs text-gray-500">Extra Distance</div>
              </div>
            )}
            
            {match.detour_time && (
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  +{Math.round(match.detour_time)}min
                </div>
                <div className="text-xs text-gray-500">Extra Time</div>
              </div>
            )}
            
            {match.estimated_savings && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {targetTrip.currency === 'USD' ? '$' : targetTrip.currency}{match.estimated_savings.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">Estimated Savings</div>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((match.compatibility_score) * 100)}%
              </div>
              <div className="text-xs text-gray-500">Compatibility</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}