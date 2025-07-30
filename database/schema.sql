-- Complete Supabase Schema for Taxi Carpooling App
-- Execute this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE (Enhanced)
-- =============================================
-- Note: Supabase auth.users table exists by default
-- We extend it with a public users table for additional profile data

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  
  -- Profile information
  bio TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  
  -- Verification status
  is_verified BOOLEAN DEFAULT FALSE,
  verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'phone', 'identity', 'premium')),
  
  -- Settings
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  
  -- Trip statistics
  trips_completed INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  
  -- Account status
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TRIPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic trip information
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  
  -- Enhanced location data with coordinates and place details
  origin_location JSONB NOT NULL, -- { address, coordinates: {lat, lng}, placeId, name?, types? }
  destination_location JSONB NOT NULL,
  
  -- Legacy coordinate fields for backward compatibility
  origin_lat DECIMAL,
  origin_lng DECIMAL,
  destination_lat DECIMAL,
  destination_lng DECIMAL,
  
  -- Trip timing
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ, -- Estimated or actual arrival
  
  -- Passenger information
  max_passengers INTEGER NOT NULL DEFAULT 4,
  current_passengers INTEGER NOT NULL DEFAULT 1,
  available_seats INTEGER GENERATED ALWAYS AS (max_passengers - current_passengers) STORED,
  
  -- Trip status and metadata
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED')),
  notes TEXT,
  
  -- Pricing information
  price_per_seat DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'app', 'split')),
  
  -- Trip metadata
  distance DECIMAL(10,2), -- in kilometers
  estimated_duration INTEGER, -- in minutes
  
  -- Preferences
  smoking_allowed BOOLEAN DEFAULT FALSE,
  pets_allowed BOOLEAN DEFAULT TRUE,
  music_preference TEXT DEFAULT 'indifferent' CHECK (music_preference IN ('yes', 'no', 'indifferent')),
  conversation_level TEXT DEFAULT 'indifferent' CHECK (conversation_level IN ('chatty', 'quiet', 'indifferent')),
  
  -- Vehicle information (for drivers)
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_plate TEXT,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TRIP REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS trip_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Request details
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
  message TEXT,
  seats_requested INTEGER DEFAULT 1 CHECK (seats_requested > 0),
  
  -- Pickup/dropoff preferences
  pickup_location JSONB, -- Optional specific pickup point
  dropoff_location JSONB, -- Optional specific dropoff point
  
  -- Timing preferences
  departure_flexibility INTEGER DEFAULT 0, -- minutes before/after
  
  -- Response tracking
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent duplicate requests
  UNIQUE(trip_id, sender_id)
);

-- =============================================
-- TRIP MATCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS trip_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  matched_trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  
  -- Match scoring
  compatibility_score DECIMAL(3,2) NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 1),
  match_type TEXT NOT NULL CHECK (match_type IN ('exact_route', 'partial_overlap', 'detour_pickup', 'detour_dropoff')),
  
  -- Detailed route analysis
  route_analysis JSONB NOT NULL, -- { commonPath, deviationFromOriginal, pickupPoints, dropoffPoints }
  
  -- Cost and efficiency analysis
  estimated_savings DECIMAL(10,2), -- cost savings per person
  shared_distance DECIMAL(10,2), -- distance of shared route in km
  detour_distance DECIMAL(10,2), -- extra distance required in km
  detour_time INTEGER, -- extra time required in minutes
  
  -- Meeting points
  suggested_pickup_point JSONB, -- { address, coordinates, walkingDistance, accessibility }
  suggested_dropoff_point JSONB,
  alternative_meeting_points JSONB, -- Array of alternative points
  
  -- Time compatibility
  time_difference INTEGER, -- minutes difference in departure times
  time_compatibility_score DECIMAL(3,2), -- 0-1 score for time compatibility
  
  -- Match status
  status TEXT DEFAULT 'SUGGESTED' CHECK (status IN ('SUGGESTED', 'VIEWED', 'CONTACTED', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
  viewed_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent duplicate matches (bidirectional uniqueness)
  UNIQUE(trip_id, matched_trip_id),
  CHECK (trip_id != matched_trip_id)
);

-- =============================================
-- CHAT ROOMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Link to trip match or direct user connection
  match_id UUID REFERENCES trip_matches(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Participants
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Room metadata
  is_active BOOLEAN DEFAULT TRUE,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique chat rooms between users
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- =============================================
-- MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Message content
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system')),
  
  -- File attachments (for future use)
  attachment_url TEXT,
  attachment_type TEXT,
  attachment_size INTEGER,
  
  -- Message status
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  
  -- Read receipts
  delivered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification type and content
  type TEXT NOT NULL CHECK (type IN (
    'new_match', 'match_accepted', 'match_declined', 
    'trip_request', 'request_accepted', 'request_declined', 
    'new_message', 'trip_update', 'trip_cancelled', 'trip_completed',
    'review_received', 'system_announcement'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  match_id UUID REFERENCES trip_matches(id) ON DELETE SET NULL,
  request_id UUID REFERENCES trip_requests(id) ON DELETE SET NULL,
  chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE SET NULL,
  
  -- Notification metadata
  data JSONB, -- Additional structured data
  action_url TEXT, -- Deep link to relevant page
  
  -- Status and scheduling
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ, -- For scheduled notifications
  expires_at TIMESTAMPTZ,
  
  -- Delivery channels
  sent_via_email BOOLEAN DEFAULT FALSE,
  sent_via_push BOOLEAN DEFAULT FALSE,
  sent_via_sms BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USER PREFERENCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Matching preferences
  max_detour_distance INTEGER DEFAULT 10, -- km
  max_detour_time INTEGER DEFAULT 30, -- minutes
  max_walking_distance INTEGER DEFAULT 500, -- meters to meeting point
  time_flexibility INTEGER DEFAULT 15, -- minutes before/after preferred time
  
  -- Price preferences
  price_range_min DECIMAL(10,2) DEFAULT 0,
  price_range_max DECIMAL(10,2) DEFAULT 100,
  currency TEXT DEFAULT 'USD',
  
  -- Personal preferences
  smoking_preference TEXT DEFAULT 'no' CHECK (smoking_preference IN ('yes', 'no', 'indifferent')),
  pets_preference BOOLEAN DEFAULT TRUE,
  music_preference TEXT DEFAULT 'indifferent' CHECK (music_preference IN ('yes', 'no', 'indifferent')),
  conversation_level TEXT DEFAULT 'indifferent' CHECK (conversation_level IN ('chatty', 'quiet', 'indifferent')),
  
  -- Gender preferences (for matching)
  gender_preference TEXT DEFAULT 'any' CHECK (gender_preference IN ('same', 'any')),
  
  -- Age preferences
  min_age INTEGER,
  max_age INTEGER,
  
  -- Notification preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  
  -- Notification types
  notify_new_matches BOOLEAN DEFAULT TRUE,
  notify_trip_requests BOOLEAN DEFAULT TRUE,
  notify_messages BOOLEAN DEFAULT TRUE,
  notify_trip_updates BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TRIP REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS trip_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Overall rating
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  
  -- Detailed ratings
  punctuality INTEGER CHECK (punctuality >= 1 AND punctuality <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),
  friendliness INTEGER CHECK (friendliness >= 1 AND friendliness <= 5),
  
  -- Driver-specific ratings (when reviewing driver)
  driving_quality INTEGER CHECK (driving_quality >= 1 AND driving_quality <= 5),
  vehicle_condition INTEGER CHECK (vehicle_condition >= 1 AND vehicle_condition <= 5),
  
  -- Review metadata
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE, -- For verified trip completion
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent duplicate reviews
  UNIQUE(trip_id, reviewer_id, reviewee_id)
);

-- =============================================
-- SAVED TRIPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS saved_trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  
  -- Save metadata
  notes TEXT, -- Personal notes about why this trip was saved
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent duplicate saves
  UNIQUE(user_id, trip_id)
);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_requests_updated_at ON trip_requests;
CREATE TRIGGER update_trip_requests_updated_at BEFORE UPDATE ON trip_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_matches_updated_at ON trip_matches;
CREATE TRIGGER update_trip_matches_updated_at BEFORE UPDATE ON trip_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_rooms_updated_at ON chat_rooms;
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION TO CREATE USER PROFILE (ULTRA-SIMPLE VERSION)
-- =============================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Ultra-simple trigger that should work in all cases
  INSERT INTO users (id, email, name) 
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', 'user@example.com'),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Don't fail the auth process if profile creation fails
    -- The application will handle profile creation as fallback
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when user signs up
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating_average DESC);

-- Trips table indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_departure_time ON trips(departure_time);
CREATE INDEX IF NOT EXISTS idx_trips_active_departures ON trips(departure_time, status) WHERE status = 'ACTIVE';

-- JSONB indexes with proper operator class specification
CREATE INDEX IF NOT EXISTS idx_trips_origin_location ON trips USING GIN (origin_location);
CREATE INDEX IF NOT EXISTS idx_trips_destination_location ON trips USING GIN (destination_location);

-- Trip requests indexes
CREATE INDEX IF NOT EXISTS idx_trip_requests_trip_id ON trip_requests(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_requests_sender_id ON trip_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_trip_requests_receiver_id ON trip_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_trip_requests_status ON trip_requests(status);

-- Trip matches indexes
CREATE INDEX IF NOT EXISTS idx_trip_matches_trip_id ON trip_matches(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_matches_matched_trip_id ON trip_matches(matched_trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_matches_compatibility_score ON trip_matches(compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_trip_matches_status ON trip_matches(status);

-- Chat and messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user1_id ON chat_rooms(user1_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user2_id ON chat_rooms(user2_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message ON chat_rooms(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread_recent ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_trip_reviews_reviewee_id ON trip_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_trip_reviews_trip_id ON trip_reviews(trip_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile and active users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

DROP POLICY IF EXISTS "Anyone can view active trips" ON trips;
DROP POLICY IF EXISTS "Users can create their own trips" ON trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON trips;

DROP POLICY IF EXISTS "Users can view requests they sent or received" ON trip_requests;
DROP POLICY IF EXISTS "Users can create trip requests" ON trip_requests;
DROP POLICY IF EXISTS "Users can update requests they received" ON trip_requests;

DROP POLICY IF EXISTS "Users can view matches for their trips" ON trip_matches;

DROP POLICY IF EXISTS "Users can view their chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their chat rooms" ON messages;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can create their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;

DROP POLICY IF EXISTS "Users can view reviews for trips they participated in" ON trip_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON trip_reviews;

DROP POLICY IF EXISTS "Users can view their own saved trips" ON saved_trips;
DROP POLICY IF EXISTS "Users can save trips" ON saved_trips;
DROP POLICY IF EXISTS "Users can delete their own saved trips" ON saved_trips;

-- USERS POLICIES
CREATE POLICY "Users can view their own profile and active users" ON users FOR SELECT USING (
  auth.uid() = id OR (is_active = TRUE)
);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- TRIPS POLICIES
CREATE POLICY "Anyone can view active trips" ON trips FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Users can create their own trips" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trips" ON trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trips" ON trips FOR DELETE USING (auth.uid() = user_id);

-- TRIP REQUESTS POLICIES
CREATE POLICY "Users can view requests they sent or received" ON trip_requests FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can create trip requests" ON trip_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update requests they received" ON trip_requests FOR UPDATE USING (auth.uid() = receiver_id);

-- TRIP MATCHES POLICIES
CREATE POLICY "Users can view matches for their trips" ON trip_matches FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM trips 
    WHERE (trips.id = trip_matches.trip_id OR trips.id = trip_matches.matched_trip_id) 
    AND trips.user_id = auth.uid()
  )
);

-- CHAT ROOMS POLICIES
CREATE POLICY "Users can view their chat rooms" ON chat_rooms FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- MESSAGES POLICIES
CREATE POLICY "Users can view messages in their chat rooms" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = messages.chat_room_id 
    AND (chat_rooms.user1_id = auth.uid() OR chat_rooms.user2_id = auth.uid())
  )
);
CREATE POLICY "Users can send messages in their chat rooms" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = messages.chat_room_id 
    AND (chat_rooms.user1_id = auth.uid() OR chat_rooms.user2_id = auth.uid())
  )
);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- USER PREFERENCES POLICIES
CREATE POLICY "Users can view their own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- TRIP REVIEWS POLICIES
CREATE POLICY "Users can view reviews for trips they participated in" ON trip_reviews FOR SELECT USING (
  auth.uid() = reviewer_id OR auth.uid() = reviewee_id OR
  EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_reviews.trip_id AND trips.user_id = auth.uid())
);
CREATE POLICY "Users can create reviews" ON trip_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- SAVED TRIPS POLICIES
CREATE POLICY "Users can view their own saved trips" ON saved_trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save trips" ON saved_trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved trips" ON saved_trips FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Taxi Carpooling database schema installation completed successfully!';
    RAISE NOTICE '📊 All tables created with proper relationships and constraints';
    RAISE NOTICE '🔍 Optimized indexes configured for performance';
    RAISE NOTICE '🔒 Row Level Security policies enabled and configured';
    RAISE NOTICE '🚀 Ready for application development!';
END $$;