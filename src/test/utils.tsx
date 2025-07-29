import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock Zustand stores for testing
export const mockAuthStore = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  initializeAuth: vi.fn(),
};

export const mockTripStore = {
  trips: [],
  isLoading: false,
  error: null,
  createTrip: vi.fn(),
  updateTrip: vi.fn(),
  deleteTrip: vi.fn(),
  getTrips: vi.fn(),
};

export const mockToastStore = {
  toasts: [],
  addToast: vi.fn(),
  removeToast: vi.fn(),
  clearAll: vi.fn(),
};

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data factories
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+1234567890',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  avatar_url: null,
  email_verified: true,
  phone_verified: false,
};

export const mockTrip = {
  id: '456e7890-e89b-12d3-a456-426614174001',
  user_id: mockUser.id,
  pickup_location: {
    address: '123 Start St, City, State',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  dropoff_location: {
    address: '456 End Ave, City, State',
    coordinates: { lat: 40.7589, lng: -73.9851 }
  },
  departure_time: '2024-12-30T10:00:00.000Z',
  max_passengers: 3,
  current_passengers: 1,
  price_per_person: 15.00,
  description: 'Test trip description',
  status: 'ACTIVE' as const,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  user: mockUser,
};

export const mockMatch = {
  id: '789e0123-e89b-12d3-a456-426614174002',
  user_id: mockUser.id,
  trip_id: mockTrip.id,
  matched_trip_id: '987e6543-e89b-12d3-a456-426614174003',
  compatibility_score: 0.85,
  match_type: 'exact_route' as const,
  meeting_point: {
    address: '789 Meeting Point, City, State',
    coordinates: { lat: 40.7489, lng: -73.9857 }
  },
  status: 'ACTIVE' as const,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  trip: mockTrip,
  matched_trip: { ...mockTrip, id: '987e6543-e89b-12d3-a456-426614174003' },
};

// Test helper functions
export const createMockEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  ...overrides,
});

export const waitFor = (callback: () => void, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      try {
        callback();
        resolve(undefined);
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          reject(error);
        } else {
          setTimeout(check, 100);
        }
      }
    };
    check();
  });
};