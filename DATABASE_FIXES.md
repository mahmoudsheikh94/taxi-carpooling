# Database Fixes - Step by Step Guide

## Overview

This guide provides step-by-step instructions to apply the database fixes identified during testing. These fixes will enable automatic profile creation and resolve RLS policy issues.

## Issues Being Fixed

1. **Database Trigger Not Working** - User profiles not automatically created during signup
2. **RLS Policies Too Restrictive** - Manual profile creation blocked by security policies
3. **Missing Test User Profiles** - Previously created test users lack profile records

## Step-by-Step Fix Instructions

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `dwrknslxhbgxknvjwtaz`
4. Navigate to **SQL Editor** in the left sidebar

### Step 2: Apply Database Fixes

1. In the SQL Editor, create a new query
2. Copy the **entire contents** of `database/apply-fixes.sql`
3. Paste the contents into the SQL Editor
4. Click **Run** to execute the script

**Expected Output:**
```
✅ All fixes applied successfully!
🔧 Database trigger recreated
🔒 RLS policies updated  
👥 Test user profiles created
🚀 Ready for testing!
```

### Step 3: Verify the Fixes

Run the verification test script to confirm everything is working:

```bash
npm run test:fixes
```

**Expected Results:**
- ✅ Existing test users have profiles
- ✅ RLS policies allow proper access
- ✅ Database trigger creates profiles for new users (or fallback works)

### Step 4: Test Complete Signup Flow

Run the full signup test to verify end-to-end functionality:

```bash
npm run test:signup
```

**Expected Results:**
- ✅ New users can sign up successfully
- ✅ Profiles are created automatically (via trigger or fallback)
- ✅ All tests pass without errors

## What the Fixes Do

### Database Trigger Fix
```sql
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name) 
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', 'user@example.com'),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Purpose:** Automatically creates user profiles when users sign up

### RLS Policy Fixes
```sql
CREATE POLICY "Users can read own profile" ON users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users 
FOR INSERT WITH CHECK (auth.uid() = id);
```

**Purpose:** Allows users to read their own profiles and create profiles when needed

### Test User Profile Creation
```sql
INSERT INTO users (id, email, name) VALUES 
  ('7d25b909-5cd3-44fe-9dc4-db66d7bb6a78', 'testuser1.taxicarpooling@gmail.com', 'Test User One'),
  ('76c78682-3649-4566-8e61-95cfcd61795a', 'testuser2.taxicarpooling@gmail.com', 'Test User Two');
```

**Purpose:** Creates profiles for the test users that were created during testing

## Verification Checklist

After applying the fixes, verify the following:

### Database Configuration
- [ ] Trigger function `create_user_profile` exists
- [ ] Trigger `create_user_profile_trigger` is active on `auth.users`
- [ ] RLS policies allow authenticated users to read/insert their own profiles
- [ ] Test user profiles exist in the `users` table

### Application Testing  
- [ ] `npm run test:fixes` passes all tests
- [ ] `npm run test:signup` passes all tests
- [ ] New user signup creates profiles automatically
- [ ] Existing users can login and access their profiles

### Manual Testing
- [ ] Create a new user via the web interface
- [ ] Verify profile is created automatically
- [ ] Test login with existing users
- [ ] Confirm no 406 errors in browser console

## Troubleshooting

### Issue: SQL Script Fails to Execute
**Cause:** Insufficient permissions or syntax error  
**Solution:** 
- Ensure you're using the project owner account
- Check that you're in the correct project
- Copy the script exactly as provided

### Issue: Tests Still Fail After Fixes
**Cause:** Changes may take time to propagate  
**Solution:**
- Wait 2-3 minutes after applying fixes
- Clear browser cache and cookies
- Re-run the tests

### Issue: Trigger Not Working
**Cause:** Trigger may not be properly attached  
**Solution:**
- Verify trigger exists with this query:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'create_user_profile_trigger';
```

### Issue: RLS Policies Still Blocking
**Cause:** Old policies may still be active  
**Solution:**
- Check existing policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```
- Drop and recreate if necessary

## Success Indicators

### When Everything is Working Correctly:

1. **New User Signup:**
   - User created in `auth.users` table
   - Profile automatically created in `users` table
   - No errors in application logs

2. **Existing User Login:**
   - User can authenticate successfully
   - Profile data loads without 406 errors
   - User can access all protected features

3. **Test Results:**
   - All automated tests pass
   - No errors in console logs
   - Database queries work as expected

## Next Steps After Fixes

1. **Deploy Latest Code** (if not already done)
2. **Test Email Confirmation Flow** with real email addresses
3. **Configure Supabase Dashboard Settings** as per `SUPABASE_CONFIG.md`
4. **Monitor Application** for any remaining issues
5. **Document Any Additional Findings** for future reference

## Support

If you encounter issues during the fix process:

1. Check the SQL execution results for error messages
2. Verify you're using the correct Supabase project
3. Ensure you have admin/owner permissions
4. Review the verification test results for specific failure points
5. Check browser console for additional error details

The fixes are designed to be safe and non-destructive. They only add missing functionality and don't modify existing data (except creating missing test user profiles).