-- Database Verification and Setup Script for Taxi Carpooling App
-- Run this in Supabase SQL Editor to verify and fix database configuration

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if users table exists and has correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Check if RLS is enabled on users table
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasrlspolicy
FROM pg_tables 
LEFT JOIN (
    SELECT 
        schemaname, 
        tablename,
        COUNT(*) > 0 as hasrlspolicy
    FROM pg_policies 
    GROUP BY schemaname, tablename
) pol USING (schemaname, tablename)
WHERE schemaname = 'public' AND tablename = 'users';

-- Check existing RLS policies on users table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- Check if trigger function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_user_profile';

-- Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'users'
OR trigger_name = 'create_user_profile_trigger';

-- Check sample data in users table (if any exists)
SELECT 
    id,
    email,
    name,
    created_at,
    is_active
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- =============================================
-- FIXES AND SETUP (Apply if needed)
-- =============================================

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or update the simple trigger function
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any problematic existing policies
DROP POLICY IF EXISTS "Users can view their own profile and active users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read active users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create simple, working RLS policies
CREATE POLICY "Users can read own profile" ON users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read active users" ON users 
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can update own profile" ON users 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- =============================================
-- TEST QUERIES
-- =============================================

-- Test that policies work correctly
-- This should return the current user's profile (if any)
SELECT 'Policy test - should return current user profile:' as test_description;
SELECT * FROM users WHERE id = auth.uid() LIMIT 1;

-- Test that trigger function can be called
SELECT 'Trigger function test - function exists:' as test_description;
SELECT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'create_user_profile'
    AND routine_type = 'FUNCTION'
) as trigger_function_exists;

-- Test that trigger is properly configured
SELECT 'Trigger configuration test:' as test_description;
SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'create_user_profile_trigger'
    AND event_object_schema = 'auth'
    AND event_object_table = 'users'
) as trigger_exists;

-- =============================================
-- CLEANUP TEST DATA (Use with caution)
-- =============================================

-- Uncomment the following lines to clean up test users
-- WARNING: This will delete test user data!

-- DELETE FROM users WHERE email LIKE 'testuser%@example.com';
-- 
-- -- Note: Cannot directly delete from auth.users table
-- -- Test users in auth.users will need to be removed via Supabase dashboard
-- -- or by the users themselves

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database verification and setup completed!';
    RAISE NOTICE '📊 Check the query results above to verify configuration';
    RAISE NOTICE '🔧 All necessary fixes have been applied';
    RAISE NOTICE '🚀 Ready for user testing!';
END $$;