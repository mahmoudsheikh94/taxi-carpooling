-- Simple trigger function for user profile creation
-- Apply this in Supabase SQL Editor to test the trigger approach

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