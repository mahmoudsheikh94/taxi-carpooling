import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchingService } from '../matchingAlgorithm';
import { mockTrip, mockUser } from '../../../test/utils';

// Mock Google Maps API
const mockDirectionsService = {
  route: vi.fn(),
};

const mockDistanceMatrixService = {
  getDistanceMatrix: vi.fn(),
};

vi.mock('@googlemaps/js-api-loader', () => ({
  Loader: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue({
      maps: {
        DirectionsService: vi.fn(() => mockDirectionsService),
        DistanceMatrixService: vi.fn(() => mockDistanceMatrixService),
        DirectionsStatus: {
          OK: 'OK',
        },
        DistanceMatrixStatus: {
          OK: 'OK',
        },
        TravelMode: {
          DRIVING: 'DRIVING',
        },
        UnitSystem: {
          METRIC: 'METRIC',
        },
      },
    })),
  })),
}));

describe('MatchingService', () => {
  let matchingService: MatchingService;

  const mockTrip1 = {
    ...mockTrip,
    id: 'trip-1',
    pickup_location: {
      address: '123 Start St, City, State',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    dropoff_location: {
      address: '456 End Ave, City, State',
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    departure_time: '2024-12-30T10:00:00.000Z',
  };

  const mockTrip2 = {
    ...mockTrip,
    id: 'trip-2',
    user_id: 'different-user-id',
    pickup_location: {
      address: '789 Similar St, City, State',
      coordinates: { lat: 40.7150, lng: -74.0080 }
    },
    dropoff_location: {
      address: '321 Near Ave, City, State',
      coordinates: { lat: 40.7600, lng: -73.9800 }
    },
    departure_time: '2024-12-30T10:15:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    matchingService = new MatchingService();

    // Mock successful directions response
    mockDirectionsService.route.mockImplementation((request, callback) => {
      callback(
        {
          routes: [{
            legs: [{
              distance: { value: 5000 },
              duration: { value: 600 },
            }],
            overview_polyline: { points: 'mock_polyline' },
          }],
        },
        'OK'
      );
    });

    // Mock distance matrix response
    mockDistanceMatrixService.getDistanceMatrix.mockImplementation((request, callback) => {
      callback(
        {
          rows: [{
            elements: [{
              distance: { value: 500 },
              duration: { value: 120 },
              status: 'OK',
            }],
          }],
        },
        'OK'
      );
    });
  });

  describe('calculateRouteCompatibility', () => {
    it('should calculate high compatibility for similar routes', async () => {
      const compatibility = await matchingService.calculateRouteCompatibility(
        mockTrip1,
        mockTrip2
      );

      expect(compatibility).toBeGreaterThan(0.7);
      expect(mockDirectionsService.route).toHaveBeenCalledTimes(2);
    });

    it('should return 0 for incompatible routes', async () => {
      // Mock a failed directions request
      mockDirectionsService.route.mockImplementation((request, callback) => {
        callback(null, 'ZERO_RESULTS');
      });

      const compatibility = await matchingService.calculateRouteCompatibility(
        mockTrip1,
        mockTrip2
      );

      expect(compatibility).toBe(0);
    });

    it('should consider route overlap in compatibility calculation', async () => {
      // Mock overlapping routes
      mockDirectionsService.route.mockImplementation((request, callback) => {
        callback(
          {
            routes: [{
              legs: [{
                distance: { value: 3000 }, // Shorter distance indicates overlap
                duration: { value: 400 },
              }],
              overview_polyline: { points: 'overlapping_polyline' },
            }],
          },
          'OK'
        );
      });

      const compatibility = await matchingService.calculateRouteCompatibility(
        mockTrip1,
        mockTrip2
      );

      expect(compatibility).toBeGreaterThan(0.8);
    });
  });

  describe('calculateTimeCompatibility', () => {
    it('should return high compatibility for similar departure times', () => {
      const trip1 = { ...mockTrip1, departure_time: '2024-12-30T10:00:00.000Z' };
      const trip2 = { ...mockTrip2, departure_time: '2024-12-30T10:15:00.000Z' };

      const compatibility = matchingService.calculateTimeCompatibility(trip1, trip2);

      expect(compatibility).toBeGreaterThan(0.8);
    });

    it('should return low compatibility for different departure times', () => {
      const trip1 = { ...mockTrip1, departure_time: '2024-12-30T10:00:00.000Z' };
      const trip2 = { ...mockTrip2, departure_time: '2024-12-30T14:00:00.000Z' };

      const compatibility = matchingService.calculateTimeCompatibility(trip1, trip2);

      expect(compatibility).toBeLessThan(0.5);
    });

    it('should handle same departure time', () => {
      const trip1 = { ...mockTrip1, departure_time: '2024-12-30T10:00:00.000Z' };
      const trip2 = { ...mockTrip2, departure_time: '2024-12-30T10:00:00.000Z' };

      const compatibility = matchingService.calculateTimeCompatibility(trip1, trip2);

      expect(compatibility).toBe(1);
    });
  });

  describe('calculatePreferenceCompatibility', () => {
    it('should return high compatibility for matching preferences', () => {
      const preferences1 = {
        smoking_allowed: false,
        pets_allowed: true,
        music_allowed: true,
        conversation_level: 'MODERATE' as const,
      };

      const preferences2 = {
        smoking_allowed: false,
        pets_allowed: true,
        music_allowed: true,
        conversation_level: 'MODERATE' as const,
      };

      const compatibility = matchingService.calculatePreferenceCompatibility(
        preferences1,
        preferences2
      );

      expect(compatibility).toBe(1);
    });

    it('should return lower compatibility for conflicting preferences', () => {
      const preferences1 = {
        smoking_allowed: false,
        pets_allowed: false,
        music_allowed: false,
        conversation_level: 'QUIET' as const,
      };

      const preferences2 = {
        smoking_allowed: true,
        pets_allowed: true,
        music_allowed: true,
        conversation_level: 'CHATTY' as const,
      };

      const compatibility = matchingService.calculatePreferenceCompatibility(
        preferences1,
        preferences2
      );

      expect(compatibility).toBeLessThan(0.5);
    });

    it('should handle null preferences gracefully', () => {
      const compatibility = matchingService.calculatePreferenceCompatibility(
        null,
        null
      );

      expect(compatibility).toBe(0.8); // Default compatibility
    });
  });

  describe('findMatches', () => {
    it('should find compatible trips', async () => {
      const availableTrips = [mockTrip2];
      const userPreferences = null;

      const matches = await matchingService.findMatches(
        mockTrip1,
        availableTrips,
        userPreferences
      );

      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveProperty('trip_id', mockTrip1.id);
      expect(matches[0]).toHaveProperty('matched_trip_id', mockTrip2.id);
      expect(matches[0]).toHaveProperty('compatibility_score');
      expect(matches[0].compatibility_score).toBeGreaterThan(0);
    });

    it('should exclude trips by the same user', async () => {
      const sameUserTrip = { ...mockTrip2, user_id: mockTrip1.user_id };
      const availableTrips = [sameUserTrip];

      const matches = await matchingService.findMatches(
        mockTrip1,
        availableTrips,
        null
      );

      expect(matches).toHaveLength(0);
    });

    it('should filter out low compatibility matches', async () => {
      // Mock very low route compatibility
      mockDirectionsService.route.mockImplementation((request, callback) => {
        callback(
          {
            routes: [{
              legs: [{
                distance: { value: 50000 }, // Very long distance
                duration: { value: 3600 },
              }],
              overview_polyline: { points: 'different_route' },
            }],
          },
          'OK'
        );
      });

      const availableTrips = [mockTrip2];
      const matches = await matchingService.findMatches(
        mockTrip1,
        availableTrips,
        null
      );

      // Should filter out matches with very low compatibility
      const highCompatibilityMatches = matches.filter(m => m.compatibility_score > 0.3);
      expect(highCompatibilityMatches.length).toBeLessThan(matches.length);
    });

    it('should sort matches by compatibility score', async () => {
      const trip3 = {
        ...mockTrip,
        id: 'trip-3',
        user_id: 'third-user-id',
        departure_time: '2024-12-30T12:00:00.000Z', // Much later time
      };

      const availableTrips = [mockTrip2, trip3];

      const matches = await matchingService.findMatches(
        mockTrip1,
        availableTrips,
        null
      );

      expect(matches).toHaveLength(2);
      
      // First match should have higher compatibility score
      expect(matches[0].compatibility_score).toBeGreaterThanOrEqual(
        matches[1].compatibility_score
      );
    });
  });

  describe('determineMatchType', () => {
    it('should identify exact route matches', () => {
      const mockGeometry1 = 'route_geometry_1';
      const mockGeometry2 = 'route_geometry_1'; // Same geometry

      const matchType = matchingService.determineMatchType(
        0.95, // High route compatibility
        mockGeometry1,
        mockGeometry2
      );

      expect(matchType).toBe('exact_route');
    });

    it('should identify partial overlap matches', () => {
      const mockGeometry1 = 'route_geometry_1';
      const mockGeometry2 = 'different_geometry';

      const matchType = matchingService.determineMatchType(
        0.7, // Medium-high route compatibility
        mockGeometry1,
        mockGeometry2
      );

      expect(matchType).toBe('partial_overlap');
    });

    it('should identify detour pickup matches', () => {
      const mockGeometry1 = 'route_geometry_1';
      const mockGeometry2 = 'different_geometry';

      const matchType = matchingService.determineMatchType(
        0.45, // Medium route compatibility
        mockGeometry1,
        mockGeometry2
      );

      expect(matchType).toBe('detour_pickup');
    });

    it('should identify detour dropoff matches', () => {
      const mockGeometry1 = 'route_geometry_1';
      const mockGeometry2 = 'different_geometry';

      const matchType = matchingService.determineMatchType(
        0.25, // Low-medium route compatibility
        mockGeometry1,
        mockGeometry2
      );

      expect(matchType).toBe('detour_dropoff');
    });
  });

  describe('error handling', () => {
    it('should handle Google Maps API errors gracefully', async () => {
      mockDirectionsService.route.mockImplementation((request, callback) => {
        callback(null, 'REQUEST_DENIED');
      });

      const compatibility = await matchingService.calculateRouteCompatibility(
        mockTrip1,
        mockTrip2
      );

      expect(compatibility).toBe(0);
    });

    it('should handle missing location data', async () => {
      const tripWithoutLocation = {
        ...mockTrip1,
        pickup_location: null,
      };

      const matches = await matchingService.findMatches(
        tripWithoutLocation,
        [mockTrip2],
        null
      );

      expect(matches).toHaveLength(0);
    });
  });
});