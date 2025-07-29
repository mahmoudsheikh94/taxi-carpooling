import { loadGoogleMapsApi, geocodeAddress, reverseGeocode } from '../maps/googleMaps';
import type { LocationData, MeetingPoint } from '../../types';

export interface MeetingPointOptions {
  maxWalkingDistance: number; // meters
  preferredTypes: string[]; // e.g., ['transit_station', 'parking', 'establishment']
  avoidTypes: string[]; // e.g., ['cemetery', 'hospital']
  accessibilityRequired: boolean;
}

export interface MeetingPointAnalysis {
  point: MeetingPoint;
  safetyScore: number; // 0-1
  convenienceScore: number; // 0-1
  accessibilityScore: number; // 0-1
  overallScore: number; // 0-1
  nearbyPOIs: google.maps.places.PlaceResult[];
}

export class MeetingPointService {
  private static readonly DEFAULT_OPTIONS: MeetingPointOptions = {
    maxWalkingDistance: 500,
    preferredTypes: ['transit_station', 'shopping_mall', 'gas_station', 'parking'],
    avoidTypes: ['cemetery', 'hospital', 'funeral_home'],
    accessibilityRequired: false,
  };

  /**
   * Find optimal meeting points along a route
   */
  static async findOptimalMeetingPoints(
    routeResult: google.maps.DirectionsResult,
    passengerLocation: LocationData,
    options: Partial<MeetingPointOptions> = {}
  ): Promise<MeetingPointAnalysis[]> {
    const activeOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      await loadGoogleMapsApi();
      
      const route = routeResult.routes[0];
      if (!route || !route.overview_path) {
        throw new Error('Invalid route data');
      }

      // Get candidate points along the route
      const candidatePoints = this.getCandidatePointsAlongRoute(
        route.overview_path,
        passengerLocation,
        activeOptions.maxWalkingDistance
      );

      // Analyze each candidate point
      const analyses: MeetingPointAnalysis[] = [];
      
      for (const point of candidatePoints) {
        try {
          const analysis = await this.analyzeMeetingPoint(point, activeOptions);
          if (analysis.overallScore > 0.3) { // Only include viable options
            analyses.push(analysis);
          }
        } catch (error) {
          console.error('Error analyzing meeting point:', error);
        }
      }

      // Sort by overall score and return top options
      return analyses
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 5); // Return top 5 options
    } catch (error) {
      console.error('Error finding meeting points:', error);
      return this.getFallbackMeetingPoints(routeResult, passengerLocation);
    }
  }

  /**
   * Get candidate points along the route within walking distance
   */
  private static getCandidatePointsAlongRoute(
    routePath: google.maps.LatLng[],
    passengerLocation: LocationData,
    maxWalkingDistance: number
  ): google.maps.LatLng[] {
    const candidatePoints: google.maps.LatLng[] = [];
    const passengerLatLng = new google.maps.LatLng(
      passengerLocation.coordinates.lat,
      passengerLocation.coordinates.lng
    );

    // Check points along the route at regular intervals
    const stepSize = Math.max(1, Math.floor(routePath.length / 20)); // Sample ~20 points
    
    for (let i = 0; i < routePath.length; i += stepSize) {
      const routePoint = routePath[i];
      
      // Calculate walking distance to this point
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        passengerLatLng,
        routePoint
      );
      
      if (distance <= maxWalkingDistance) {
        candidatePoints.push(routePoint);
      }
    }

    return candidatePoints;
  }

  /**
   * Analyze a meeting point for viability
   */
  private static async analyzeMeetingPoint(
    point: google.maps.LatLng,
    options: MeetingPointOptions
  ): Promise<MeetingPointAnalysis> {
    const maps = await loadGoogleMapsApi();
    
    // Get address for the point
    const geocodeResult = await reverseGeocode({
      lat: point.lat(),
      lng: point.lng(),
    });

    // Search for nearby places
    const nearbyPOIs = await this.getNearbyPOIs(point, options);
    
    // Calculate scores
    const safetyScore = this.calculateSafetyScore(nearbyPOIs, geocodeResult);
    const convenienceScore = this.calculateConvenienceScore(nearbyPOIs, options);
    const accessibilityScore = this.calculateAccessibilityScore(nearbyPOIs, options);
    
    // Overall score with weights
    const overallScore = (
      safetyScore * 0.4 +
      convenienceScore * 0.35 +
      accessibilityScore * 0.25
    );

    const meetingPoint: MeetingPoint = {
      address: geocodeResult.formatted_address,
      coordinates: {
        lat: point.lat(),
        lng: point.lng(),
      },
      walkingDistance: 0, // Will be calculated by caller
      accessibility: accessibilityScore > 0.7 ? 'high' : accessibilityScore > 0.4 ? 'medium' : 'low',
    };

    return {
      point: meetingPoint,
      safetyScore,
      convenienceScore,
      accessibilityScore,
      overallScore,
      nearbyPOIs,
    };
  }

  /**
   * Get nearby points of interest
   */
  private static async getNearbyPOIs(
    location: google.maps.LatLng,
    options: MeetingPointOptions
  ): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {
      const service = new google.maps.places.PlacesService(
        document.createElement('div')
      );

      service.nearbySearch(
        {
          location,
          radius: Math.min(options.maxWalkingDistance, 500),
          type: 'establishment',
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            resolve([]); // Return empty array instead of rejecting
          }
        }
      );
    });
  }

  /**
   * Calculate safety score based on nearby places and location
   */
  private static calculateSafetyScore(
    nearbyPOIs: google.maps.places.PlaceResult[],
    geocodeResult: google.maps.GeocoderResult
  ): number {
    let score = 0.5; // Base score
    
    // Positive safety indicators
    const safetyPositives = [
      'police', 'hospital', 'shopping_mall', 'bank', 'gas_station',
      'transit_station', 'school', 'university', 'library'
    ];
    
    // Negative safety indicators
    const safetyNegatives = [
      'night_club', 'bar', 'liquor_store', 'cemetery'
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    nearbyPOIs.forEach(poi => {
      if (poi.types) {
        const hasPositive = poi.types.some(type => safetyPositives.includes(type));
        const hasNegative = poi.types.some(type => safetyNegatives.includes(type));
        
        if (hasPositive) positiveCount++;
        if (hasNegative) negativeCount++;
      }
    });

    // Adjust score based on nearby POIs
    score += (positiveCount * 0.1) - (negativeCount * 0.15);
    
    // Consider address components for additional context
    const addressComponents = geocodeResult.address_components || [];
    const hasMainStreet = addressComponents.some(component =>
      component.types.includes('route') && 
      /\b(main|central|downtown|plaza|square)\b/i.test(component.long_name)
    );
    
    if (hasMainStreet) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate convenience score based on nearby amenities
   */
  private static calculateConvenienceScore(
    nearbyPOIs: google.maps.places.PlaceResult[],
    options: MeetingPointOptions
  ): number {
    let score = 0.3; // Base score
    
    const convenientTypes = [
      'gas_station', 'convenience_store', 'restaurant', 'cafe',
      'shopping_mall', 'supermarket', 'pharmacy', 'bank', 'atm'
    ];

    let convenientCount = 0;
    let totalRating = 0;
    let ratedPlaces = 0;

    nearbyPOIs.forEach(poi => {
      if (poi.types) {
        const isConvenient = poi.types.some(type => convenientTypes.includes(type));
        if (isConvenient) {
          convenientCount++;
          
          if (poi.rating) {
            totalRating += poi.rating;
            ratedPlaces++;
          }
        }
      }
    });

    // More convenient places = higher score
    score += Math.min(0.4, convenientCount * 0.08);
    
    // High-rated places boost the score
    if (ratedPlaces > 0) {
      const averageRating = totalRating / ratedPlaces;
      score += (averageRating - 3) * 0.1; // Boost for ratings above 3
    }

    // Preferred types boost
    nearbyPOIs.forEach(poi => {
      if (poi.types) {
        const hasPreferredType = poi.types.some(type => 
          options.preferredTypes.includes(type)
        );
        if (hasPreferredType) {
          score += 0.05;
        }
      }
    });

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate accessibility score
   */
  private static calculateAccessibilityScore(
    nearbyPOIs: google.maps.places.PlaceResult[],
    options: MeetingPointOptions
  ): number {
    let score = 0.5; // Base score
    
    const accessibilityPositives = [
      'transit_station', 'subway_station', 'bus_station',
      'hospital', 'shopping_mall', 'parking'
    ];

    let accessiblePlaces = 0;

    nearbyPOIs.forEach(poi => {
      if (poi.types) {
        const isAccessible = poi.types.some(type => 
          accessibilityPositives.includes(type)
        );
        if (isAccessible) {
          accessiblePlaces++;
        }
      }
    });

    score += Math.min(0.3, accessiblePlaces * 0.1);

    // If accessibility is required, be more strict
    if (options.accessibilityRequired) {
      if (accessiblePlaces === 0) {
        score *= 0.3; // Heavily penalize if no accessible places
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get fallback meeting points when analysis fails
   */
  private static getFallbackMeetingPoints(
    routeResult: google.maps.DirectionsResult,
    passengerLocation: LocationData
  ): MeetingPointAnalysis[] {
    const route = routeResult.routes[0];
    if (!route || !route.overview_path) {
      return [];
    }

    // Use route waypoints as fallback
    const midPoint = route.overview_path[Math.floor(route.overview_path.length / 2)];
    
    const fallbackPoint: MeetingPoint = {
      address: 'Meeting point along route',
      coordinates: {
        lat: midPoint.lat(),
        lng: midPoint.lng(),
      },
      walkingDistance: 0,
      accessibility: 'unknown',
    };

    return [{
      point: fallbackPoint,
      safetyScore: 0.5,
      convenienceScore: 0.3,
      accessibilityScore: 0.5,
      overallScore: 0.4,
      nearbyPOIs: [],
    }];
  }

  /**
   * Calculate walking distance between two points
   */
  static async calculateWalkingDistance(
    from: LocationData,
    to: MeetingPoint
  ): Promise<{ distance: number; duration: number }> {
    try {
      const maps = await loadGoogleMapsApi();
      
      return new Promise((resolve, reject) => {
        const service = new maps.DistanceMatrixService();
        
        service.getDistanceMatrix(
          {
            origins: [from.coordinates],
            destinations: [to.coordinates],
            travelMode: maps.TravelMode.WALKING,
            unitSystem: maps.UnitSystem.METRIC,
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
                reject(new Error('Walking distance calculation failed'));
              }
            } else {
              reject(new Error('Distance matrix service failed'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Walking distance calculation error:', error);
      // Fallback to straight-line distance
      const maps = await loadGoogleMapsApi();
      const distance = maps.geometry.spherical.computeDistanceBetween(
        new maps.LatLng(from.coordinates.lat, from.coordinates.lng),
        new maps.LatLng(to.coordinates.lat, to.coordinates.lng)
      );
      
      return {
        distance,
        duration: distance * 12, // Rough estimate: 5 km/h walking speed
      };
    }
  }

  /**
   * Find meeting points between two locations
   */
  static async findMeetingPointsBetween(
    location1: LocationData,
    location2: LocationData,
    options: Partial<MeetingPointOptions> = {}
  ): Promise<MeetingPointAnalysis[]> {
    try {
      // Get route between the two locations
      const route = await import('../maps/googleMaps').then(maps => 
        maps.getRoute(location1.coordinates, location2.coordinates)
      );
      
      // Find meeting points along this route
      return this.findOptimalMeetingPoints(route, location1, options);
    } catch (error) {
      console.error('Error finding meeting points between locations:', error);
      
      // Fallback: suggest midpoint
      const midLat = (location1.coordinates.lat + location2.coordinates.lat) / 2;
      const midLng = (location1.coordinates.lng + location2.coordinates.lng) / 2;
      
      const midPoint: MeetingPoint = {
        address: 'Midpoint between locations',
        coordinates: { lat: midLat, lng: midLng },
        walkingDistance: 0,
        accessibility: 'unknown',
      };

      return [{
        point: midPoint,
        safetyScore: 0.5,
        convenienceScore: 0.3,
        accessibilityScore: 0.5,
        overallScore: 0.4,
        nearbyPOIs: [],
      }];
    }
  }
}