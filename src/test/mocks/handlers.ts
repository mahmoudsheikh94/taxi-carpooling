import { http, HttpResponse } from 'msw';
import { mockUser, mockTrip, mockMatch } from '../utils';

const API_BASE_URL = 'https://test.supabase.co';

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      user: mockUser,
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
    });
  }),

  http.post(`${API_BASE_URL}/auth/v1/signup`, () => {
    return HttpResponse.json({
      user: mockUser,
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      },
    });
  }),

  http.post(`${API_BASE_URL}/auth/v1/logout`, () => {
    return HttpResponse.json({});
  }),

  // Trips endpoints
  http.get(`${API_BASE_URL}/rest/v1/trips`, () => {
    return HttpResponse.json([mockTrip]);
  }),

  http.post(`${API_BASE_URL}/rest/v1/trips`, () => {
    return HttpResponse.json(mockTrip);
  }),

  http.patch(`${API_BASE_URL}/rest/v1/trips`, () => {
    return HttpResponse.json(mockTrip);
  }),

  http.delete(`${API_BASE_URL}/rest/v1/trips`, () => {
    return HttpResponse.json({});
  }),

  // Matches endpoints
  http.get(`${API_BASE_URL}/rest/v1/trip_matches`, () => {
    return HttpResponse.json([mockMatch]);
  }),

  http.post(`${API_BASE_URL}/rest/v1/trip_matches`, () => {
    return HttpResponse.json(mockMatch);
  }),

  // Requests endpoints
  http.get(`${API_BASE_URL}/rest/v1/trip_requests`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_BASE_URL}/rest/v1/trip_requests`, () => {
    return HttpResponse.json({
      id: 'request-123',
      trip_id: mockTrip.id,
      user_id: mockUser.id,
      status: 'PENDING',
      message: 'Test request',
      created_at: new Date().toISOString(),
    });
  }),

  // Reviews endpoints
  http.get(`${API_BASE_URL}/rest/v1/trip_reviews`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_BASE_URL}/rest/v1/trip_reviews`, () => {
    return HttpResponse.json({
      id: 'review-123',
      trip_id: mockTrip.id,
      reviewer_id: mockUser.id,
      reviewed_user_id: 'other-user-id',
      rating: 5,
      comment: 'Great trip!',
      created_at: new Date().toISOString(),
    });
  }),

  // Chat endpoints
  http.get(`${API_BASE_URL}/rest/v1/chat_rooms`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE_URL}/rest/v1/messages`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_BASE_URL}/rest/v1/messages`, () => {
    return HttpResponse.json({
      id: 'message-123',
      room_id: 'room-123',
      user_id: mockUser.id,
      content: 'Test message',
      created_at: new Date().toISOString(),
    });
  }),

  // Google Maps API mock
  http.get('https://maps.googleapis.com/maps/api/js', () => {
    return HttpResponse.text('// Mock Google Maps API');
  }),

  http.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', () => {
    return HttpResponse.json({
      status: 'OK',
      predictions: [
        {
          place_id: 'mock-place-id',
          description: '123 Test Street, Test City, Test State',
          structured_formatting: {
            main_text: '123 Test Street',
            secondary_text: 'Test City, Test State',
          },
        },
      ],
    });
  }),

  http.get('https://maps.googleapis.com/maps/api/directions/json', () => {
    return HttpResponse.json({
      status: 'OK',
      routes: [
        {
          legs: [
            {
              distance: { text: '5.2 km', value: 5200 },
              duration: { text: '12 mins', value: 720 },
              start_address: '123 Start St, Test City',
              end_address: '456 End Ave, Test City',
            },
          ],
          overview_polyline: {
            points: 'mock_encoded_polyline_string',
          },
        },
      ],
    });
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = [
  http.post(`${API_BASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_BASE_URL}/rest/v1/trips`, () => {
    return HttpResponse.json(
      { error: 'Invalid trip data' },
      { status: 400 }
    );
  }),

  http.get(`${API_BASE_URL}/rest/v1/trips`, () => {
    return HttpResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }),
];