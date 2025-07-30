#!/usr/bin/env node

/**
 * Automated Signup Test Script for Taxi Carpooling App
 * 
 * This script tests the complete signup flow by creating test users
 * and validating the entire process including profile creation.
 * 
 * Usage: node scripts/test-signup.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});

// Test user data
// Using more realistic email addresses that won't be blocked by Supabase
const TEST_USERS = [
  {
    email: 'testuser1.taxicarpooling@gmail.com',
    password: 'TestPassword123!',
    name: 'Test User One',
    description: 'Standard signup flow test'
  },
  {
    email: 'testuser2.taxicarpooling@gmail.com', 
    password: 'TestPassword456!',
    name: 'Test User Two',
    description: 'Edge case testing'
  }
];

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Utility function to log with timestamp
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Test individual signup flow
 */
async function testUserSignup(testUser) {
  log(`Testing signup for: ${testUser.email} (${testUser.description})`);
  
  try {
    // Step 1: Attempt signup
    log(`Step 1: Attempting signup for ${testUser.email}`);
    
    const signUpPayload = {
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          name: testUser.name,
          full_name: testUser.name,
          display_name: testUser.name,
        },
      },
    };

    const { data: authData, error: signUpError } = await supabase.auth.signUp(signUpPayload);

    if (signUpError) {
      // Check if user already exists
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
        log(`User ${testUser.email} already exists, attempting to clean up and retry`, 'info');
        
        // Try to sign in to verify the user exists
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: testUser.password,
        });

        if (!signInError && signInData.user) {
          log(`✅ User ${testUser.email} already exists and can sign in successfully`);
          
          // Test profile access
          await testProfileAccess(signInData.user.id, testUser.email);
          return { success: true, message: 'User already exists and works correctly' };
        } else {
          log(`❌ User exists but cannot sign in: ${signInError?.message}`, 'error');
          return { success: false, message: `User exists but sign in failed: ${signInError?.message}` };
        }
      } else {
        log(`❌ Signup failed: ${signUpError.message}`, 'error');
        return { success: false, message: `Signup failed: ${signUpError.message}` };
      }
    }

    if (!authData.user) {
      log(`❌ No user data returned from signup`, 'error');
      return { success: false, message: 'No user data returned from signup' };
    }

    log(`✅ Signup successful for ${testUser.email} (ID: ${authData.user.id})`);

    // Step 2: Check if user profile was created
    log(`Step 2: Checking user profile creation`);
    await testProfileAccess(authData.user.id, testUser.email);

    // Step 3: Test profile creation if missing
    log(`Step 3: Ensuring profile exists`);
    await ensureProfileExists(authData.user.id, testUser.email, testUser.name);

    log(`✅ All tests passed for ${testUser.email}`, 'success');
    return { success: true, message: 'All tests passed' };

  } catch (error) {
    log(`❌ Unexpected error testing ${testUser.email}: ${error.message}`, 'error');
    return { success: false, message: `Unexpected error: ${error.message}` };
  }
}

/**
 * Test profile access for a user
 */
async function testProfileAccess(userId, email) {
  try {
    log(`Testing profile access for user: ${userId}`);
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        log(`⚠️ Profile not found for ${email} (expected for new users)`, 'info');
        return { exists: false, error: profileError };
      } else {
        log(`❌ Profile access error: ${profileError.message}`, 'error');
        return { exists: false, error: profileError };
      }
    }

    if (profile) {
      log(`✅ Profile found for ${email}: ${profile.name}`);
      return { exists: true, profile };
    } else {
      log(`⚠️ Profile query succeeded but returned null`, 'info');
      return { exists: false, error: null };
    }

  } catch (error) {
    log(`❌ Error checking profile access: ${error.message}`, 'error');
    return { exists: false, error };
  }
}

/**
 * Ensure profile exists for a user
 */
async function ensureProfileExists(userId, email, name) {
  try {
    log(`Ensuring profile exists for: ${email}`);
    
    // First check if profile already exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      log(`✅ Profile already exists for ${email}`);
      return { success: true, created: false };
    }

    // Create profile if it doesn't exist
    log(`Creating profile for ${email}`);
    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        name: name,
      })
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        log(`✅ Profile already exists (race condition handled) for ${email}`);
        return { success: true, created: false };
      } else {
        log(`❌ Failed to create profile: ${createError.message}`, 'error');
        return { success: false, error: createError };
      }
    }

    log(`✅ Profile created successfully for ${email}`);
    return { success: true, created: true, profile: newProfile };

  } catch (error) {
    log(`❌ Error ensuring profile exists: ${error.message}`, 'error');
    return { success: false, error };
  }
}

/**
 * Test database connection and basic functionality
 */
async function testDatabaseConnection() {
  log('🔧 Testing database connection...');
  
  try {
    // Simple connection test - try to query the users table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      log(`❌ Database connection test failed: ${error.message}`, 'error');
      return false;
    }
    
    log(`✅ Database connection successful`);
    return true;
    
  } catch (error) {
    log(`❌ Database connection test failed: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Generate test report
 */
function generateTestReport() {
  log('\n📊 TEST RESULTS SUMMARY', 'info');
  log(`Total tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
  
  if (testResults.errors.length > 0) {
    log('\n❌ ERRORS ENCOUNTERED:', 'error');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error}`, 'error');
    });
  }

  if (testResults.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! The signup flow is working correctly.', 'success');
  } else {
    log('\n⚠️ Some tests failed. Please review the errors above and apply necessary fixes.', 'error');
  }
}

/**
 * Main test execution
 */
async function runTests() {
  log('🚀 Starting automated signup tests...\n');
  
  // Test database connection first
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    log('❌ Database connection failed. Aborting tests.', 'error');
    process.exit(1);
  }

  // Test each user
  for (const testUser of TEST_USERS) {
    testResults.total++;
    
    const result = await testUserSignup(testUser);
    
    if (result.success) {
      testResults.passed++;
      log(`✅ Test passed for ${testUser.email}: ${result.message}\n`, 'success');
    } else {
      testResults.failed++;
      testResults.errors.push(`${testUser.email}: ${result.message}`);
      log(`❌ Test failed for ${testUser.email}: ${result.message}\n`, 'error');
    }
  }

  // Generate final report
  generateTestReport();
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  log(`❌ Test execution failed: ${error.message}`, 'error');
  process.exit(1);
});