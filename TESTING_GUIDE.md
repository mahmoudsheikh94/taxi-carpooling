# Testing Guide - Taxi Carpooling App

## Overview

This guide provides comprehensive testing procedures for the taxi carpooling application, focusing on user authentication and profile management.

## Automated Testing

### Running Signup Tests

Execute the automated signup test script:
```bash
npm run test:signup
```

This script will:
- Test signup flow for two test users
- Verify profile creation (trigger and fallback)
- Check database consistency
- Generate a detailed test report

### Test Users

The script creates the following test users:

**Test User 1:**
- Email: `testuser1@example.com`
- Password: `TestPassword123!`
- Name: `Test User One`
- Purpose: Standard signup flow testing

**Test User 2:**
- Email: `testuser2@example.com`
- Password: `TestPassword456!`
- Name: `Test User Two`
- Purpose: Edge case and error handling testing

## Manual Testing Procedures

### 1. Pre-Test Setup

#### Database Configuration
1. Run the database verification script in Supabase SQL Editor:
   ```sql
   -- Copy and paste contents of scripts/verify-database.sql
   ```

2. Verify the following configurations in Supabase dashboard:
   - **Authentication > URL Configuration**
     - Site URL: `https://taxi-carpooling.vercel.app`
     - Redirect URLs include both production and localhost URLs

#### Environment Variables
Ensure these are set in Vercel dashboard:
```bash
VITE_SUPABASE_URL=https://dwrknslxhbgxknvjwtaz.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_URL=https://taxi-carpooling.vercel.app
```

### 2. Signup Flow Testing

#### Test Case 1: Happy Path Signup
1. Navigate to registration page
2. Fill in valid user details:
   - Email: Use a real email you can access
   - Password: Strong password (8+ characters)
   - Name: Full name
3. Submit form
4. Check browser console for detailed logs
5. Verify email confirmation sent
6. Click confirmation link in email
7. Verify redirect to production domain
8. Complete login process
9. Verify profile data loads correctly

**Expected Results:**
- ✅ Signup completes without errors
- ✅ Console shows successful profile creation
- ✅ Email confirmation sent to correct address
- ✅ Confirmation link redirects to production domain
- ✅ Login works after confirmation
- ✅ User profile displays correctly

#### Test Case 2: Duplicate Email
1. Attempt to signup with existing email
2. Verify appropriate error message
3. Attempt to login with existing credentials
4. Verify login works correctly

**Expected Results:**
- ✅ Clear error message about existing account
- ✅ Suggestion to sign in instead
- ✅ Login works with existing credentials

#### Test Case 3: Weak Password
1. Attempt signup with weak password
2. Verify password strength validation
3. Use strong password and retry

**Expected Results:**
- ✅ Password strength requirements shown
- ✅ Form validation prevents submission
- ✅ Strong password allows signup to proceed

### 3. Login Flow Testing

#### Test Case 4: Standard Login
1. Use credentials from previous signup
2. Navigate to login page
3. Enter valid credentials
4. Submit form
5. Check browser console for detailed logs
6. Verify successful login and profile loading

**Expected Results:**
- ✅ Authentication successful
- ✅ Profile data loads without 406 errors
- ✅ User redirected to dashboard
- ✅ All user data displays correctly

#### Test Case 5: Missing Profile Recovery
1. Manually delete user profile from database (keep auth user)
   ```sql
   DELETE FROM users WHERE email = 'test@example.com';
   ```
2. Attempt to login
3. Verify automatic profile recreation
4. Check that login completes successfully

**Expected Results:**
- ✅ Console shows profile not found
- ✅ Fallback profile creation triggered
- ✅ Login completes successfully
- ✅ Profile data available after login

### 4. Database Testing

#### Test Case 6: Trigger Functionality
1. Signup new user
2. Check auth.users table for new record
3. Check users table for profile record
4. Verify data consistency between tables

**Database Queries:**
```sql
-- Check auth user (admin access required)
SELECT id, email, created_at FROM auth.users 
WHERE email = 'test@example.com';

-- Check profile
SELECT id, email, name, created_at FROM users 
WHERE email = 'test@example.com';
```

#### Test Case 7: RLS Policy Testing
1. Login as test user
2. Attempt to access other users' profiles via API
3. Verify access is denied
4. Verify own profile is accessible

**API Tests:**
```javascript
// Should work - own profile
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', currentUserId);

// Should fail - other user's profile
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', 'other-user-id');
```

### 5. Email Confirmation Testing

#### Test Case 8: Email Delivery
1. Signup with real email address
2. Check email arrival (including spam folder)
3. Verify email content and branding
4. Check confirmation link format

#### Test Case 9: Confirmation Link Functionality
1. Click confirmation link from email
2. Verify redirect URL is correct
3. Check that confirmation completes
4. Verify user can now login

### 6. Error Handling Testing

#### Test Case 10: Network Issues
1. Disable network connection during signup
2. Verify appropriate error handling
3. Restore connection and retry
4. Verify recovery works correctly

#### Test Case 11: Database Connection Issues
1. Monitor behavior during high load
2. Verify graceful degradation
3. Check error messages are user-friendly
4. Verify retry mechanisms work

## Troubleshooting Common Issues

### Issue: 406 Not Acceptable Errors
**Symptoms:** Login gets stuck, console shows 406 errors
**Solutions:**
1. Verify Supabase client headers are correctly set
2. Check RLS policies allow profile access
3. Run RLS policy fixes from `scripts/verify-database.sql`

### Issue: Email Confirmation Redirects to Localhost
**Symptoms:** Confirmation emails link to localhost
**Solutions:**
1. Update Site URL in Supabase dashboard
2. Verify VITE_APP_URL environment variable
3. Check redirect URLs configuration

### Issue: Profile Creation Fails
**Symptoms:** User auth succeeds but no profile created
**Solutions:**
1. Check database trigger is working
2. Apply simple trigger from `database/simple-trigger.sql`
3. Verify fallback profile creation in auth service

### Issue: Database Trigger Not Working
**Symptoms:** No profile records created automatically
**Solutions:**
1. Run database verification script
2. Check trigger function permissions
3. Apply trigger fixes from database scripts

## Performance Testing

### Load Testing
1. Create multiple users simultaneously
2. Monitor database performance
3. Check for race conditions
4. Verify all profiles created correctly

### Stress Testing
1. Attempt rapid signup/login cycles
2. Monitor memory usage
3. Check for connection leaks
4. Verify error recovery

## Security Testing

### Authentication Security
1. Verify JWT tokens are properly handled
2. Check session management
3. Test logout functionality
4. Verify token refresh works

### Data Security
1. Confirm RLS policies prevent unauthorized access
2. Test SQL injection prevention
3. Verify input sanitization
4. Check CORS configuration

## Test Results Documentation

### Success Criteria
For each test case, document:
- ✅ Expected behavior occurred
- ✅ No console errors
- ✅ Appropriate user feedback
- ✅ Data consistency maintained

### Failure Documentation
For any failures, record:
- ❌ Specific error messages
- ❌ Browser console logs
- ❌ Network request details
- ❌ Database state before/after

## Cleanup Procedures

### Test Data Cleanup
```sql
-- Remove test users (use with caution)
DELETE FROM users WHERE email LIKE 'testuser%@example.com';

-- Note: auth.users records must be removed via Supabase dashboard
-- or user self-deletion
```

### Environment Reset
1. Clear browser storage and cookies
2. Reset any modified database settings
3. Verify production environment is clean

## Automated Monitoring

### Continuous Testing
Set up automated tests to run:
- After each deployment
- Daily health checks
- Before major releases

### Monitoring Alerts
Configure alerts for:
- Signup success rate drops
- Login failure rate increases
- Database trigger failures
- Email delivery issues

---

**Note:** Always test in a development environment first before applying changes to production. Keep backups of important data before running test scripts.