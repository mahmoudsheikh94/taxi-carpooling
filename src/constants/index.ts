// Application constants

export const APP_NAME = 'Taxi Carpooling';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  AUTH_CALLBACK: '/auth/callback',
  DASHBOARD: '/dashboard',
  TRIPS: '/trips',
  CREATE_TRIP: '/trips/create',
  TRIP_DETAILS: '/trips/:id',
  EDIT_TRIP: '/trips/:id/edit',
  MY_TRIPS: '/my-trips',
  MATCHES: '/matches',
  REQUESTS: '/requests',
  CHAT: '/chat',
  CHAT_ROOM: '/chat/:roomId',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
} as const;

export const TRIP_STATUS = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  MATCHED: 'MATCHED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  CANCELLED: 'CANCELLED',
} as const;

export const MATCH_TYPES = {
  EXACT_ROUTE: 'exact_route',
  PARTIAL_OVERLAP: 'partial_overlap',
  DETOUR_PICKUP: 'detour_pickup',
  DETOUR_DROPOFF: 'detour_dropoff',
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  LOCATION: 'location',
  SYSTEM: 'system',
} as const;

export const NOTIFICATION_TYPES = {
  NEW_MATCH: 'new_match',
  MATCH_ACCEPTED: 'match_accepted',
  MATCH_DECLINED: 'match_declined',
  TRIP_REQUEST: 'trip_request',
  REQUEST_ACCEPTED: 'request_accepted',
  REQUEST_DECLINED: 'request_declined',
  NEW_MESSAGE: 'new_message',
  TRIP_UPDATE: 'trip_update',
  TRIP_CANCELLED: 'trip_cancelled',
  TRIP_COMPLETED: 'trip_completed',
  REVIEW_RECEIVED: 'review_received',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
} as const;

export const VERIFICATION_LEVELS = {
  BASIC: 'basic',
  PHONE: 'phone',
  IDENTITY: 'identity',
  PREMIUM: 'premium',
} as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export const PREFERENCES = {
  SMOKING: [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'indifferent', label: 'No preference' },
  ],
  MUSIC: [
    { value: 'yes', label: 'Music preferred' },
    { value: 'no', label: 'No music' },
    { value: 'indifferent', label: 'No preference' },
  ],
  CONVERSATION: [
    { value: 'chatty', label: 'Chatty' },
    { value: 'quiet', label: 'Quiet' },
    { value: 'indifferent', label: 'No preference' },
  ],
} as const;

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'app', label: 'Mobile Payment' },
  { value: 'split', label: 'Split Payment' },
] as const;

export const DEFAULT_SETTINGS = {
  MAX_PASSENGERS: 4,
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_TIMEZONE: 'UTC',
  MAX_DETOUR_DISTANCE: 10, // km
  MAX_DETOUR_TIME: 30, // minutes
  MAX_WALKING_DISTANCE: 500, // meters
  TIME_FLEXIBILITY: 15, // minutes
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  TRIPS: {
    LIST: '/trips',
    CREATE: '/trips',
    GET: '/trips/:id',
    UPDATE: '/trips/:id',
    DELETE: '/trips/:id',
    SEARCH: '/trips/search',
  },
  MATCHES: {
    LIST: '/matches',
    GET: '/matches/:id',
    CONTACT: '/matches/:id/contact',
  },
  REQUESTS: {
    LIST: '/requests',
    CREATE: '/requests',
    UPDATE: '/requests/:id',
    DELETE: '/requests/:id',
  },
  CHAT: {
    ROOMS: '/chat/rooms',
    MESSAGES: '/chat/rooms/:roomId/messages',
    SEND: '/chat/rooms/:roomId/messages',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
  },
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
    PREFERENCES: '/profile/preferences',
  },
} as const;