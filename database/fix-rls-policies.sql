-- Fix RLS policies for users table to ensure proper access
-- Run this in Supabase SQL Editor if login issues persist

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile and active users" ON users;

-- Create simple, working RLS policies
CREATE POLICY "Users can read own profile" ON users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read active users" ON users 
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can update own profile" ON users 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Test query to verify policy works (should return user's own profile)
-- SELECT * FROM users WHERE id = auth.uid();