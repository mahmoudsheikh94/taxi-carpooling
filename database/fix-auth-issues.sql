-- Comprehensive fix for authentication and user creation issues
-- Apply this in Supabase SQL Editor to resolve login problems

-- =============================================
-- STEP 1: Fix RLS Policies for Users Table
-- =============================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile and active users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create comprehensive RLS policies that allow proper user profile management
CREATE POLICY "Users can read own profile" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read active users" ON users 
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- CRITICAL: Add missing INSERT policy to allow profile creation
CREATE POLICY "Users can insert own profile" ON users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: Fix Trigger Function with Proper Security
-- =============================================

-- Create improved trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER -- This is CRITICAL - allows trigger to bypass RLS
AS $$
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'Creating user profile for user ID: %', NEW.id;
  
  -- Insert user profile with proper error handling
  INSERT INTO public.users (id, email, name) 
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', 'user@example.com'),
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'display_name',
      'User'
    )
  );
  
  RAISE LOG 'User profile created successfully for: %', NEW.email;
  RETURN NEW;
  
EXCEPTION 
  WHEN unique_violation THEN
    -- Profile already exists (race condition), this is OK
    RAISE LOG 'User profile already exists for: %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Failed to create user profile for %: % %', NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with proper setup
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- =============================================
-- STEP 3: Grant Proper Permissions
-- =============================================

-- Ensure the trigger function has the right permissions
GRANT EXECUTE ON FUNCTION create_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile() TO anon;

-- Grant table permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Ensure the trigger function can access the users table
GRANT ALL ON users TO postgres;

-- =============================================
-- STEP 4: Test the Setup
-- =============================================

-- Function to test user profile creation manually (for debugging)
CREATE OR REPLACE FUNCTION test_user_profile_creation(test_user_id UUID, test_email TEXT, test_name TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (id, email, name) 
  VALUES (test_user_id, test_email, test_name);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Test failed: % %', SQLSTATE, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SUCCESS MESSAGE & VERIFICATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Authentication fixes applied successfully!';
    RAISE NOTICE '🔧 RLS policies updated to allow user profile creation';
    RAISE NOTICE '🚀 Trigger function enhanced with SECURITY DEFINER';
    RAISE NOTICE '🔒 Proper permissions granted for authenticated users';
    RAISE NOTICE '';
    RAISE NOTICE '📋 To verify the fix works:';
    RAISE NOTICE '   1. Try creating a new user account';
    RAISE NOTICE '   2. Check that a row appears in the users table';
    RAISE NOTICE '   3. Verify login works without PGRST116 errors';
    RAISE NOTICE '';
    RAISE NOTICE '🐛 If issues persist, check the Supabase logs for trigger execution messages';
END $$;