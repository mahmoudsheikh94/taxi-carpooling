import { Loader } from '@googlemaps/js-api-loader';

// Simple feature flag based on environment variable only
// This avoids circular dependency with env.ts
const isGoogleMapsEnabled = (): boolean => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return !!(apiKey && apiKey !== 'your_google_maps_api_key');
};

// Google Maps configuration
const getGoogleMapsConfig = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isProd = import.meta.env.PROD;
  
  if (!apiKey || apiKey === 'your_google_maps_api_key') {
    return null;
  }

  return {
    apiKey,
    version: 'weekly' as const,
    libraries: ['places', 'geometry'] as const,
    language: 'en',
    region: 'US',
    // Add additional configuration for production
    ...(isProd && {
      nonce: 'google-maps-nonce',
      retries: 3,
    }),
  };
};

// Lazy loader initialization
let loader: Loader | null = null;
const getLoader = (): Loader | null => {
  if (loader) {
    return loader;
  }

  const config = getGoogleMapsConfig();
  if (!config) {
    return null;
  }

  loader = new Loader(config);
  return loader;
};

// Global reference to Google Maps API
let googleMapsApi: typeof google.maps | null = null;

// Load Google Maps API
export const loadGoogleMapsApi = async (): Promise<any> => {
  const loader = getLoader();
  
  if (!loader) {
    throw new Error('Google Maps API is not available. Please configure VITE_GOOGLE_MAPS_API_KEY.');
  }

  if (googleMapsApi) {
    return googleMapsApi;
  }

  try {
    await loader.load();
    googleMapsApi = google.maps;
    return googleMapsApi;
  } catch (error) {
    console.error('Failed to load Google Maps API:', error);
    throw new Error('Failed to load Google Maps API');
  }
};

// Check if Google Maps API is loaded
export const isGoogleMapsLoaded = (): boolean => {
  return isGoogleMapsEnabled() && googleMapsApi !== null && typeof google !== 'undefined';
};

// Check if Google Maps is available
export const isGoogleMapsAvailable = (): boolean => {
  return isGoogleMapsEnabled();
};

// Get current location using browser geolocation
export const getCurrentLocation = (): Promise<google.maps.LatLngLiteral> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

// Calculate distance between two points
export const calculateDistance = async (
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral
): Promise<{ distance: number; duration: number }> => {
  const maps = await loadGoogleMapsApi();
  
  return new Promise((resolve, reject) => {
    const service = new maps.DistanceMatrixService();
    
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: maps.TravelMode.DRIVING,
        unitSystem: maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
      },
      (response, status) => {
        if (status === maps.DistanceMatrixStatus.OK && response) {
          const element = response.rows[0]?.elements[0];
          
          if (element?.status === 'OK') {
            resolve({
              distance: element.distance?.value || 0, // meters
              duration: element.duration?.value || 0, // seconds
            });
          } else {
            reject(new Error('Unable to calculate distance'));
          }
        } else {
          reject(new Error('Distance calculation failed'));
        }
      }
    );
  });
};

// Get route between two points
export const getRoute = async (
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral
): Promise<google.maps.DirectionsResult> => {
  const maps = await loadGoogleMapsApi();
  
  return new Promise((resolve, reject) => {
    const directionsService = new maps.DirectionsService();
    
    directionsService.route(
      {
        origin,
        destination,
        travelMode: maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        provideRouteAlternatives: false,
      },
      (result, status) => {
        if (status === maps.DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          reject(new Error('Route calculation failed'));
        }
      }
    );
  });
};

// Geocode an address to coordinates
export const geocodeAddress = async (
  address: string
): Promise<google.maps.GeocoderResult> => {
  const maps = await loadGoogleMapsApi();
  
  return new Promise((resolve, reject) => {
    const geocoder = new maps.Geocoder();
    
    geocoder.geocode({ address }, (results, status) => {
      if (status === maps.GeocoderStatus.OK && results && results[0]) {
        resolve(results[0]);
      } else {
        reject(new Error('Geocoding failed'));
      }
    });
  });
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (
  location: google.maps.LatLngLiteral
): Promise<google.maps.GeocoderResult> => {
  const maps = await loadGoogleMapsApi();
  
  return new Promise((resolve, reject) => {
    const geocoder = new maps.Geocoder();
    
    geocoder.geocode({ location }, (results, status) => {
      if (status === maps.GeocoderStatus.OK && results && results[0]) {
        resolve(results[0]);
      } else {
        reject(new Error('Reverse geocoding failed'));
      }
    });
  });
};

// Default map configuration
export const DEFAULT_MAP_CONFIG: google.maps.MapOptions = {
  zoom: 13,
  center: { lat: 40.7128, lng: -74.0060 }, // New York City default
  mapTypeId: 'roadmap' as google.maps.MapTypeId,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  gestureHandling: 'cooperative',
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};