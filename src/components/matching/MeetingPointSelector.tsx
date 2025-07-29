import { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, LoadingSpinner } from '../ui';
import { MeetingPointService } from '../../services/matching/meetingPoints';
import type { MeetingPointAnalysis } from '../../services/matching/meetingPoints';
import type { LocationData } from '../../types';

interface MeetingPointSelectorProps {
  sourceLocation: LocationData;
  targetLocation: LocationData;
  onPointSelect?: (point: MeetingPointAnalysis) => void;
  maxPoints?: number;
  className?: string;
}

export function MeetingPointSelector({
  sourceLocation,
  targetLocation,
  onPointSelect,
  maxPoints = 5,
  className = '',
}: MeetingPointSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [meetingPoints, setMeetingPoints] = useState<MeetingPointAnalysis[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MeetingPointAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      zoom: 13,
      center: {
        lat: (sourceLocation.lat + targetLocation.lat) / 2,
        lng: (sourceLocation.lng + targetLocation.lng) / 2,
      },
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    setMap(mapInstance);
  }, [sourceLocation, targetLocation]);

  // Find optimal meeting points
  useEffect(() => {
    if (!map) return;

    const findMeetingPoints = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Create a mock route result for the meeting point service
        const directionsService = new google.maps.DirectionsService();
        
        const routeResult = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(
            {
              origin: { lat: sourceLocation.lat, lng: sourceLocation.lng },
              destination: { lat: targetLocation.lat, lng: targetLocation.lng },
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                resolve(result);
              } else {
                reject(new Error(`Failed to get route: ${status}`));
              }
            }
          );
        });

        // Find optimal meeting points along the route
        const points = await MeetingPointService.findOptimalMeetingPoints(
          routeResult,
          targetLocation,
          { maxPoints }
        );

        setMeetingPoints(points);
        
        // Clear existing markers
        markers.forEach(marker => marker.setMap(null));
        
        // Add new markers for meeting points
        const newMarkers: google.maps.Marker[] = [];
        
        // Add source and target location markers
        const sourceMarker = new google.maps.Marker({
          position: { lat: sourceLocation.lat, lng: sourceLocation.lng },
          map,
          title: 'Your Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
        });
        
        const targetMarker = new google.maps.Marker({
          position: { lat: targetLocation.lat, lng: targetLocation.lng },
          map,
          title: 'Match Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
        });
        
        newMarkers.push(sourceMarker, targetMarker);

        // Add meeting point markers
        points.forEach((point, index) => {
          const marker = new google.maps.Marker({
            position: { lat: point.location.lat, lng: point.location.lng },
            map,
            title: `Meeting Point ${index + 1}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#F59E0B',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          marker.addListener('click', () => {
            setSelectedPoint(point);
            onPointSelect?.(point);
          });

          newMarkers.push(marker);
        });

        setMarkers(newMarkers);

        // Fit bounds to show all points
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: sourceLocation.lat, lng: sourceLocation.lng });
        bounds.extend({ lat: targetLocation.lat, lng: targetLocation.lng });
        points.forEach(point => {
          bounds.extend({ lat: point.location.lat, lng: point.location.lng });
        });
        map.fitBounds(bounds);

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to find meeting points');
        setIsLoading(false);
      }
    };

    findMeetingPoints();
  }, [map, sourceLocation, targetLocation, maxPoints, onPointSelect]);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'blue';
    if (score >= 0.4) return 'yellow';
    return 'red';
  };

  const getScoreText = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Meeting Points</h3>
        {meetingPoints.length > 0 && (
          <Badge color="blue" variant="outline">
            {meetingPoints.length} {meetingPoints.length === 1 ? 'option' : 'options'} found
          </Badge>
        )}
      </div>

      {/* Map Container */}
      <Card className="relative overflow-hidden">
        <div className="h-80 w-full" ref={mapRef}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600 mt-4">Finding optimal meeting points...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center text-red-600">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="font-medium">Failed to find meeting points</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Map Legend */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 z-10">
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">Your Location</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Match Location</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-gray-700">Meeting Points</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Meeting Points List */}
      {meetingPoints.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Recommended Meeting Points</h4>
          
          <div className="space-y-3">
            {meetingPoints.map((point, index) => (
              <Card
                key={index}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedPoint === point ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => {
                  setSelectedPoint(point);
                  onPointSelect?.(point);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge color={getScoreColor(point.overallScore)} size="sm">
                        {getScoreText(point.overallScore)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {Math.round(point.overallScore * 100)}% match
                      </span>
                    </div>
                    
                    <div className="font-medium text-gray-900 mb-1">
                      {point.location.address || 'Meeting Point'}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {point.nearbyPOIs.slice(0, 2).map(poi => poi.name).join(', ')}
                      {point.nearbyPOIs.length > 2 && ` +${point.nearbyPOIs.length - 2} more`}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{formatDistance(point.walkingDistance)} walk</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>
                          {point.safetyScore >= 0.8 ? 'Very Safe' :
                           point.safetyScore >= 0.6 ? 'Safe' :
                           point.safetyScore >= 0.4 ? 'Moderately Safe' : 'Use Caution'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>
                          {point.convenienceScore >= 0.8 ? 'Very Convenient' :
                           point.convenienceScore >= 0.6 ? 'Convenient' :
                           point.convenienceScore >= 0.4 ? 'Moderately Convenient' : 'Basic'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      #{index + 1}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Rank {index + 1}
                    </div>
                  </div>
                </div>

                {/* Detailed scores */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {Math.round(point.safetyScore * 100)}%
                      </div>
                      <div className="text-gray-500">Safety</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {Math.round(point.convenienceScore * 100)}%
                      </div>
                      <div className="text-gray-500">Convenience</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {Math.round(point.accessibilityScore * 100)}%
                      </div>
                      <div className="text-gray-500">Accessibility</div>
                    </div>
                  </div>
                </div>

                {selectedPoint === point && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPointSelect?.(point);
                      }}
                      size="sm"
                      className="w-full"
                    >
                      Select This Meeting Point
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No points found state */}
      {!isLoading && !error && meetingPoints.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">No Meeting Points Found</p>
            <p className="text-sm">
              We couldn't find suitable meeting points along this route.
              Try adjusting your locations or contact the other user directly.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}