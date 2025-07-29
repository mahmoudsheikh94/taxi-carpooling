// Global TypeScript types and interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  is_verified: boolean;
  verification_level: 'basic' | 'phone' | 'identity' | 'premium';
  language: string;
  timezone: string;
  trips_completed: number;
  rating_average: number;
  rating_count: number;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  origin_location: LocationData;
  destination_location: LocationData;
  departure_time: string;
  arrival_time?: string;
  max_passengers: number;
  current_passengers: number;
  available_seats: number;
  status: 'ACTIVE' | 'CANCELLED' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  price_per_seat?: number;
  currency: string;
  payment_method?: 'cash' | 'card' | 'app' | 'split';
  distance?: number;
  estimated_duration?: number;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  music_preference: 'yes' | 'no' | 'indifferent';
  conversation_level: 'chatty' | 'quiet' | 'indifferent';
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_plate?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface LocationData {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId: string;
  name?: string;
  types?: string[];
}

export interface TripRequest {
  id: string;
  trip_id: string;
  sender_id: string;
  receiver_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  message?: string;
  seats_requested: number;
  pickup_location?: LocationData;
  dropoff_location?: LocationData;
  departure_flexibility: number;
  responded_at?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  trip?: Trip;
  sender?: User;
  receiver?: User;
}

export interface TripMatch {
  id: string;
  trip_id: string;
  matched_trip_id: string;
  compatibility_score: number;
  match_type: 'exact_route' | 'partial_overlap' | 'detour_pickup' | 'detour_dropoff';
  route_analysis: RouteAnalysis;
  estimated_savings?: number;
  shared_distance?: number;
  detour_distance?: number;
  detour_time?: number;
  suggested_pickup_point?: MeetingPoint;
  suggested_dropoff_point?: MeetingPoint;
  alternative_meeting_points?: MeetingPoint[];
  time_difference: number;
  time_compatibility_score: number;
  status: 'SUGGESTED' | 'VIEWED' | 'CONTACTED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  viewed_at?: string;
  contacted_at?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  trip?: Trip;
  matched_trip?: Trip;
}

export interface RouteAnalysis {
  commonPath: Record<string, unknown>;
  deviationFromOriginal: number;
  pickupPoints: Record<string, unknown>[];
  dropoffPoints: Record<string, unknown>[];
}

export interface MeetingPoint {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  walkingDistance: number;
  accessibility?: string;
}

export interface ChatRoom {
  id: string;
  match_id?: string;
  trip_id?: string;
  user1_id: string;
  user2_id: string;
  is_active: boolean;
  last_message_at?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  user1?: User;
  user2?: User;
  latest_message?: Message;
}

export interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'location' | 'system';
  attachment_url?: string;
  attachment_type?: string;
  attachment_size?: number;
  is_edited: boolean;
  edited_at?: string;
  delivered_at: string;
  read_at?: string;
  created_at: string;
  sender?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'new_match' | 'match_accepted' | 'match_declined' | 'trip_request' | 'request_accepted' | 'request_declined' | 'new_message' | 'trip_update' | 'trip_cancelled' | 'trip_completed' | 'review_received' | 'system_announcement';
  title: string;
  message: string;
  trip_id?: string;
  match_id?: string;
  request_id?: string;
  chat_room_id?: string;
  data?: Record<string, unknown>;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  sent_at?: string;
  scheduled_for?: string;
  expires_at?: string;
  sent_via_email: boolean;
  sent_via_push: boolean;
  sent_via_sms: boolean;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  max_detour_distance: number;
  max_detour_time: number;
  max_walking_distance: number;
  time_flexibility: number;
  price_range_min: number;
  price_range_max: number;
  currency: string;
  smoking_preference: 'yes' | 'no' | 'indifferent';
  pets_preference: boolean;
  music_preference: 'yes' | 'no' | 'indifferent';
  conversation_level: 'chatty' | 'quiet' | 'indifferent';
  gender_preference: 'same' | 'any';
  min_age?: number;
  max_age?: number;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  notify_new_matches: boolean;
  notify_trip_requests: boolean;
  notify_messages: boolean;
  notify_trip_updates: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  trip_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment?: string;
  is_anonymous: boolean;
  aspects?: {
    punctuality?: number;
    communication?: number;
    cleanliness?: number;
    driving?: number;
    friendliness?: number;
  };
  created_at: string;
  updated_at: string;
  reviewer?: User;
  reviewed_user?: User;
  trip?: Trip;
}

// Legacy interface - keeping for backward compatibility
export interface TripReview {
  id: string;
  trip_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  review?: string;
  punctuality?: number;
  communication?: number;
  cleanliness?: number;
  friendliness?: number;
  driving_quality?: number;
  vehicle_condition?: number;
  is_anonymous: boolean;
  is_verified: boolean;
  created_at: string;
  reviewer?: User;
  reviewee?: User;
  trip?: Trip;
}