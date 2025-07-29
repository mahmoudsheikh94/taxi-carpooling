import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsApi, DEFAULT_MAP_CONFIG, isGoogleMapsAvailable } from '../../services/maps';
import { LoadingSpinner } from '../ui';
import { features } from '../../config/env';

interface GoogleMapProps {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  markers?: Array<{
    position: google.maps.LatLngLiteral;
    title?: string;
    info?: string;
  }>;
  route?: google.maps.DirectionsResult;
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  onMapLoad?: (map: google.maps.Map) => void;
  className?: string;
  height?: string;
}

export function GoogleMap({
  center,
  zoom = 13,
  markers = [],
  route,
  onMapClick,
  onMapLoad,
  className = '',
  height = '400px',
}: GoogleMapProps) {
  // Show fallback if Google Maps is not available
  if (!features.enableGoogleMaps) {
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-dashed border-blue-300 ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-blue-800 font-medium mb-1">Map View Unavailable</p>
          <p className="text-blue-600 text-sm">Google Maps API key not configured</p>
          <p className="text-blue-500 text-xs mt-2">The app works without maps functionality</p>
        </div>
      </div>
    );
  }

  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        await loadGoogleMapsApi();

        const mapConfig: google.maps.MapOptions = {
          ...DEFAULT_MAP_CONFIG,
          center: center || DEFAULT_MAP_CONFIG.center,
          zoom,
        };

        const mapInstance = new google.maps.Map(mapRef.current, mapConfig);

        // Add click listener
        if (onMapClick) {
          mapInstance.addListener('click', onMapClick);
        }

        setMap(mapInstance);
        onMapLoad?.(mapInstance);
        setError(null);
      } catch (err) {
        setError('Failed to load Google Maps');
        console.error('Failed to initialize Google Maps:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
  }, [center, zoom, onMapClick, onMapLoad]);

  // Update markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
      });

      // Add info window if info provided
      if (markerData.info) {
        const infoWindow = new google.maps.InfoWindow({
          content: markerData.info,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      }

      markersRef.current.push(marker);
    });
  }, [map, markers]);

  // Update route
  useEffect(() => {
    if (!map) return;

    // Clear existing route
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }

    // Add new route
    if (route) {
      const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: markers.length > 0, // Don't show default markers if we have custom ones
        polylineOptions: {
          strokeColor: '#2563eb',
          strokeOpacity: 0.8,
          strokeWeight: 4,
        },
      });

      directionsRenderer.setMap(map);
      directionsRenderer.setDirections(route);
      directionsRendererRef.current = directionsRenderer;
    }
  }, [map, route, markers.length]);

  // Update map center
  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  // Update map zoom
  useEffect(() => {
    if (map) {
      map.setZoom(zoom);
    }
  }, [map, zoom]);

  // Cleanup
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, []);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load map</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <LoadingSpinner />
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: height }}
      />
    </div>
  );
}