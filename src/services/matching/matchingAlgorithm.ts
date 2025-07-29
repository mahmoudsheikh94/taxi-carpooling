import { calculateDistance, getRoute, loadGoogleMapsApi } from '../maps/googleMaps';
import type { Trip, TripMatch, UserPreferences, LocationData } from '../../types';
import type { CreateTripData } from '../supabase/trips';

export interface MatchingCriteria {
  maxDetourDistance: number; // km
  maxDetourTime: number; // minutes
  maxWalkingDistance: number; // meters
  timeFlexibility: number; // minutes
  priceRangeMin: number;
  priceRangeMax: number;
}

export interface RouteOverlapResult {
  overlapPercentage: number;
  sharedDistance: number; // km
  totalOriginalDistance: number; // km
  deviationDistance: number; // km
  commonPath: google.maps.LatLng[];
  pickupPoints: google.maps.LatLng[];
  dropoffPoints: google.maps.LatLng[];
}

export interface CompatibilityAnalysis {
  routeCompatibility: number; // 0-1
  timeCompatibility: number; // 0-1
  preferencesCompatibility: number; // 0-1
  priceCompatibility: number; // 0-1
  overallScore: number; // 0-1
  matchType: 'exact_route' | 'partial_overlap' | 'detour_pickup' | 'detour_dropoff';
  detourDistance: number; // km
  detourTime: number; // minutes
  estimatedSavings: number; // cost per person
}

export class MatchingAlgorithm {
  private static readonly WEIGHTS = {
    route: 0.4,
    time: 0.25,
    preferences: 0.2,
    distance: 0.1,
    price: 0.05,
  };

  private static readonly EXACT_ROUTE_THRESHOLD = 0.95;
  private static readonly PARTIAL_OVERLAP_THRESHOLD = 0.3;

  /**
   * Find compatible trips for a given trip
   */
  static async findCompatibleTrips(
    sourceTrip: Trip | CreateTripData,
    availableTrips: Trip[],
    userPreferences?: UserPreferences,
    criteria?: MatchingCriteria
  ): Promise<CompatibilityAnalysis[]> {
    const matches: CompatibilityAnalysis[] = [];
    
    const defaultCriteria: MatchingCriteria = {
      maxDetourDistance: userPreferences?.max_detour_distance ?? 10,
      maxDetourTime: userPreferences?.max_detour_time ?? 30,
      maxWalkingDistance: userPreferences?.max_walking_distance ?? 500,
      timeFlexibility: userPreferences?.time_flexibility ?? 15,
      priceRangeMin: userPreferences?.price_range_min ?? 0,
      priceRangeMax: userPreferences?.price_range_max ?? 100,
    };

    const activeCriteria = { ...defaultCriteria, ...criteria };

    for (const candidateTrip of availableTrips) {
      // Skip if same trip or same user
      if ('id' in sourceTrip && candidateTrip.id === sourceTrip.id) continue;
      if ('user_id' in sourceTrip && candidateTrip.user_id === sourceTrip.user_id) continue;
      
      // Skip if trip is not active or has no available seats
      if (candidateTrip.status !== 'ACTIVE' || candidateTrip.available_seats <= 0) continue;

      try {
        const compatibility = await this.analyzeCompatibility(
          sourceTrip,
          candidateTrip,
          activeCriteria,
          userPreferences
        );

        // Only include matches above minimum threshold
        if (compatibility.overallScore >= 0.3) {
          matches.push(compatibility);
        }
      } catch (error) {
        console.error(`Error analyzing compatibility with trip ${candidateTrip.id}:`, error);
      }
    }

    // Sort by compatibility score (highest first)
    return matches.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Analyze compatibility between two trips
   */
  static async analyzeCompatibility(
    sourceTrip: Trip | CreateTripData,
    candidateTrip: Trip,
    criteria: MatchingCriteria,
    userPreferences?: UserPreferences
  ): Promise<CompatibilityAnalysis> {
    // 1. Route compatibility analysis
    const routeAnalysis = await this.analyzeRouteCompatibility(
      sourceTrip.origin_location,
      sourceTrip.destination_location,
      candidateTrip.origin_location,
      candidateTrip.destination_location
    );

    // 2. Time compatibility analysis
    const timeCompatibility = this.analyzeTimeCompatibility(
      sourceTrip.departure_time,
      candidateTrip.departure_time,
      criteria.timeFlexibility
    );

    // 3. User preferences compatibility
    const preferencesCompatibility = this.analyzePreferencesCompatibility(
      sourceTrip,
      candidateTrip,
      userPreferences
    );

    // 4. Price compatibility analysis
    const priceCompatibility = this.analyzePriceCompatibility(
      candidateTrip.price_per_seat,
      criteria.priceRangeMin,
      criteria.priceRangeMax
    );

    // 5. Determine match type
    const matchType = this.determineMatchType(routeAnalysis);

    // 6. Calculate detour metrics
    const { detourDistance, detourTime } = await this.calculateDetourMetrics(
      sourceTrip.origin_location,
      sourceTrip.destination_location,
      candidateTrip.origin_location,
      candidateTrip.destination_location,
      routeAnalysis
    );

    // 7. Apply distance and time constraints
    const distanceCompatibility = detourDistance <= criteria.maxDetourDistance ? 1 : 
      Math.max(0, 1 - (detourDistance - criteria.maxDetourDistance) / criteria.maxDetourDistance);
    
    const timeDeviationScore = detourTime <= criteria.maxDetourTime ? 1 :
      Math.max(0, 1 - (detourTime - criteria.maxDetourTime) / criteria.maxDetourTime);

    // 8. Calculate overall compatibility score
    const overallScore = Math.min(1, Math.max(0,
      (routeAnalysis.overlapPercentage * this.WEIGHTS.route) +
      (timeCompatibility * this.WEIGHTS.time) +
      (preferencesCompatibility * this.WEIGHTS.preferences) +
      (distanceCompatibility * this.WEIGHTS.distance) +
      (priceCompatibility * this.WEIGHTS.price)
    )) * timeDeviationScore; // Apply time constraint as multiplier

    // 9. Calculate estimated savings
    const estimatedSavings = this.calculateEstimatedSavings(
      candidateTrip.price_per_seat || 0,
      routeAnalysis.sharedDistance,
      routeAnalysis.totalOriginalDistance
    );

    return {
      routeCompatibility: routeAnalysis.overlapPercentage,
      timeCompatibility,
      preferencesCompatibility,
      priceCompatibility,
      overallScore,
      matchType,
      detourDistance,
      detourTime,
      estimatedSavings,
    };
  }

  /**
   * Analyze route compatibility using Google Maps
   */
  static async analyzeRouteCompatibility(
    sourceOrigin: LocationData,
    sourceDestination: LocationData,
    candidateOrigin: LocationData,
    candidateDestination: LocationData
  ): Promise<RouteOverlapResult> {
    try {
      await loadGoogleMapsApi();

      // Check for exact route match first
      const originDistance = await calculateDistance(
        sourceOrigin.coordinates,
        candidateOrigin.coordinates
      );
      const destinationDistance = await calculateDistance(
        sourceDestination.coordinates,
        candidateDestination.coordinates
      );

      // If both origin and destination are very close (within 1km), consider it exact route
      if (originDistance.distance <= 1000 && destinationDistance.distance <= 1000) {
        const totalDistance = await calculateDistance(
          sourceOrigin.coordinates,
          sourceDestination.coordinates
        );

        return {
          overlapPercentage: 0.98,
          sharedDistance: totalDistance.distance / 1000, // Convert to km
          totalOriginalDistance: totalDistance.distance / 1000,
          deviationDistance: 0.1, // Minimal deviation
          commonPath: [],
          pickupPoints: [new google.maps.LatLng(candidateOrigin.coordinates.lat, candidateOrigin.coordinates.lng)],
          dropoffPoints: [new google.maps.LatLng(candidateDestination.coordinates.lat, candidateDestination.coordinates.lng)],
        };
      }

      // Get routes for both trips
      const [sourceRoute, candidateRoute] = await Promise.all([
        getRoute(sourceOrigin.coordinates, sourceDestination.coordinates),
        getRoute(candidateOrigin.coordinates, candidateDestination.coordinates),
      ]);

      // Analyze route overlap using geometry
      const overlapAnalysis = await this.calculateRouteOverlap(sourceRoute, candidateRoute);
      
      return overlapAnalysis;
    } catch (error) {
      console.error('Route compatibility analysis failed:', error);
      // Fallback to basic distance analysis
      return this.fallbackRouteAnalysis(sourceOrigin, sourceDestination, candidateOrigin, candidateDestination);
    }
  }

  /**
   * Calculate route overlap using Google Maps geometry
   */
  static async calculateRouteOverlap(
    sourceRoute: google.maps.DirectionsResult,
    candidateRoute: google.maps.DirectionsResult
  ): Promise<RouteOverlapResult> {
    const maps = await loadGoogleMapsApi();
    
    const sourcePath = sourceRoute.routes[0].overview_path;
    const candidatePath = candidateRoute.routes[0].overview_path;
    
    const sourceDistance = sourceRoute.routes[0].legs.reduce(
      (total, leg) => total + (leg.distance?.value || 0), 0
    ) / 1000; // Convert to km

    let overlapDistance = 0;
    const overlapThreshold = 500; // meters
    const commonPath: google.maps.LatLng[] = [];
    const pickupPoints: google.maps.LatLng[] = [];
    const dropoffPoints: google.maps.LatLng[] = [];

    // Find overlapping segments
    for (let i = 0; i < sourcePath.length - 1; i++) {
      const sourceSegmentStart = sourcePath[i];
      const sourceSegmentEnd = sourcePath[i + 1];
      
      for (let j = 0; j < candidatePath.length - 1; j++) {
        const candidateSegmentStart = candidatePath[j];
        const candidateSegmentEnd = candidatePath[j + 1];
        
        // Check if segments are close enough to be considered overlapping
        const startDistance = maps.geometry.spherical.computeDistanceBetween(
          sourceSegmentStart,
          candidateSegmentStart
        );
        const endDistance = maps.geometry.spherical.computeDistanceBetween(
          sourceSegmentEnd,
          candidateSegmentEnd
        );
        
        if (startDistance <= overlapThreshold && endDistance <= overlapThreshold) {
          const segmentDistance = maps.geometry.spherical.computeDistanceBetween(
            sourceSegmentStart,
            sourceSegmentEnd
          ) / 1000; // Convert to km
          
          overlapDistance += segmentDistance;
          commonPath.push(sourceSegmentStart, sourceSegmentEnd);
          
          // Potential pickup/dropoff points
          if (pickupPoints.length < 3) {
            pickupPoints.push(sourceSegmentStart);
          }
          if (dropoffPoints.length < 3) {
            dropoffPoints.push(sourceSegmentEnd);
          }
        }
      }
    }

    const overlapPercentage = Math.min(1, overlapDistance / sourceDistance);
    const deviationDistance = sourceDistance - overlapDistance;

    return {
      overlapPercentage,
      sharedDistance: overlapDistance,
      totalOriginalDistance: sourceDistance,
      deviationDistance,
      commonPath,
      pickupPoints: pickupPoints.slice(0, 3), // Limit to top 3 options
      dropoffPoints: dropoffPoints.slice(0, 3),
    };
  }

  /**
   * Fallback route analysis using basic distance calculations
   */
  static async fallbackRouteAnalysis(
    sourceOrigin: LocationData,
    sourceDestination: LocationData,
    candidateOrigin: LocationData,
    candidateDestination: LocationData
  ): Promise<RouteOverlapResult> {
    // Basic analysis using haversine distances
    const sourceDistance = await calculateDistance(
      sourceOrigin.coordinates,
      sourceDestination.coordinates
    );

    // Calculate how close the routes are
    const originProximity = await calculateDistance(
      sourceOrigin.coordinates,
      candidateOrigin.coordinates
    );
    const destinationProximity = await calculateDistance(
      sourceDestination.coordinates,
      candidateDestination.coordinates
    );

    // Rough overlap estimation based on endpoint proximity
    const maxProximity = Math.max(originProximity.distance, destinationProximity.distance);
    const overlapPercentage = Math.max(0, 1 - (maxProximity / 10000)); // 10km max reasonable distance

    return {
      overlapPercentage,
      sharedDistance: (sourceDistance.distance / 1000) * overlapPercentage,
      totalOriginalDistance: sourceDistance.distance / 1000,
      deviationDistance: maxProximity / 1000,
      commonPath: [],
      pickupPoints: [new google.maps.LatLng(candidateOrigin.coordinates.lat, candidateOrigin.coordinates.lng)],
      dropoffPoints: [new google.maps.LatLng(candidateDestination.coordinates.lat, candidateDestination.coordinates.lng)],
    };
  }

  /**
   * Analyze time compatibility between trips
   */
  static analyzeTimeCompatibility(
    sourceDepartureTime: string,
    candidateDepartureTime: string,
    flexibilityMinutes: number
  ): number {
    const sourceTime = new Date(sourceDepartureTime);
    const candidateTime = new Date(candidateDepartureTime);
    
    const timeDifferenceMinutes = Math.abs(sourceTime.getTime() - candidateTime.getTime()) / (1000 * 60);
    
    if (timeDifferenceMinutes <= flexibilityMinutes) {
      return 1; // Perfect time compatibility
    }
    
    // Gradual decrease in compatibility as time difference increases
    const maxReasonableDelay = flexibilityMinutes * 3; // Up to 3x flexibility is somewhat acceptable
    return Math.max(0, 1 - (timeDifferenceMinutes - flexibilityMinutes) / maxReasonableDelay);
  }

  /**
   * Analyze user preferences compatibility
   */
  static analyzePreferencesCompatibility(
    sourceTrip: Trip | CreateTripData,
    candidateTrip: Trip,
    userPreferences?: UserPreferences
  ): number {
    let compatibilityScore = 0;
    let criteriaCount = 0;

    // Smoking preference
    criteriaCount++;
    if (userPreferences?.smoking_preference === 'indifferent' || 
        candidateTrip.smoking_allowed === (userPreferences?.smoking_preference === 'yes')) {
      compatibilityScore++;
    } else if (userPreferences?.smoking_preference === 'no' && !candidateTrip.smoking_allowed) {
      compatibilityScore++;
    }

    // Pets preference
    criteriaCount++;
    if (userPreferences?.pets_preference === undefined || 
        candidateTrip.pets_allowed === userPreferences.pets_preference) {
      compatibilityScore++;
    }

    // Music preference
    criteriaCount++;
    if (userPreferences?.music_preference === 'indifferent' || 
        candidateTrip.music_preference === userPreferences?.music_preference ||
        candidateTrip.music_preference === 'indifferent') {
      compatibilityScore++;
    }

    // Conversation level
    criteriaCount++;
    if (userPreferences?.conversation_level === 'indifferent' || 
        candidateTrip.conversation_level === userPreferences?.conversation_level ||
        candidateTrip.conversation_level === 'indifferent') {
      compatibilityScore++;
    }

    return criteriaCount > 0 ? compatibilityScore / criteriaCount : 1;
  }

  /**
   * Analyze price compatibility
   */
  static analyzePriceCompatibility(
    tripPrice: number | undefined,
    minPrice: number,
    maxPrice: number
  ): number {
    if (!tripPrice) return 1; // Free rides are always compatible
    
    if (tripPrice >= minPrice && tripPrice <= maxPrice) {
      return 1; // Perfect price match
    }
    
    if (tripPrice < minPrice) {
      // Cheaper than expected - generally good
      return 0.9;
    }
    
    // More expensive than preferred
    const excessAmount = tripPrice - maxPrice;
    const tolerance = maxPrice * 0.5; // 50% over budget tolerance
    return Math.max(0, 1 - (excessAmount / tolerance));
  }

  /**
   * Determine match type based on route analysis
   */
  static determineMatchType(routeAnalysis: RouteOverlapResult): 'exact_route' | 'partial_overlap' | 'detour_pickup' | 'detour_dropoff' {
    if (routeAnalysis.overlapPercentage >= this.EXACT_ROUTE_THRESHOLD) {
      return 'exact_route';
    }
    
    if (routeAnalysis.overlapPercentage >= this.PARTIAL_OVERLAP_THRESHOLD) {
      return 'partial_overlap';
    }
    
    // Determine if it's pickup or dropoff based on deviation pattern
    // This is a simplified heuristic - in practice, you'd analyze the route geometry more carefully
    const deviationRatio = routeAnalysis.deviationDistance / routeAnalysis.totalOriginalDistance;
    
    if (deviationRatio < 0.3) {
      return 'detour_pickup';
    } else {
      return 'detour_dropoff';
    }
  }

  /**
   * Calculate detour metrics
   */
  static async calculateDetourMetrics(
    sourceOrigin: LocationData,
    sourceDestination: LocationData,
    candidateOrigin: LocationData,
    candidateDestination: LocationData,
    routeAnalysis: RouteOverlapResult
  ): Promise<{ detourDistance: number; detourTime: number }> {
    try {
      // Calculate additional distance/time for pickup and dropoff
      const pickupDetour = await calculateDistance(
        sourceOrigin.coordinates,
        candidateOrigin.coordinates
      );
      
      const dropoffDetour = await calculateDistance(
        candidateDestination.coordinates,
        sourceDestination.coordinates
      );
      
      const detourDistance = (pickupDetour.distance + dropoffDetour.distance) / 1000; // Convert to km
      const detourTime = (pickupDetour.duration + dropoffDetour.duration) / 60; // Convert to minutes
      
      return { detourDistance, detourTime };
    } catch (error) {
      console.error('Error calculating detour metrics:', error);
      return {
        detourDistance: routeAnalysis.deviationDistance,
        detourTime: routeAnalysis.deviationDistance * 2, // Rough estimate: 2 minutes per km
      };
    }
  }

  /**
   * Calculate estimated cost savings
   */
  static calculateEstimatedSavings(
    tripPrice: number,
    sharedDistance: number,
    totalDistance: number
  ): number {
    if (!tripPrice || !sharedDistance || !totalDistance) return 0;
    
    const sharedPortion = sharedDistance / totalDistance;
    return tripPrice * sharedPortion * 0.5; // 50% savings on shared portion
  }
}