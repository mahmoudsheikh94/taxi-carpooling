#!/usr/bin/env node

/**
 * Build script that handles environment variable setup for different deployment contexts
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function getBuildVersion() {
  // Try to get version from various sources
  if (process.env.VITE_BUILD_VERSION) {
    return process.env.VITE_BUILD_VERSION;
  }
  
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7);
  }
  
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.substring(0, 7);
  }
  
  // Try to get from git if available
  try {
    const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    if (gitHash) return gitHash;
  } catch (error) {
    // Git not available, continue
  }
  
  // Fallback to timestamp-based version
  return `dev-${Date.now().toString(36)}`;
}

function getBuildTime() {
  if (process.env.VITE_BUILD_TIME) {
    return process.env.VITE_BUILD_TIME;
  }
  
  if (process.env.VERCEL_GIT_COMMIT_TIMESTAMP) {
    return new Date(parseInt(process.env.VERCEL_GIT_COMMIT_TIMESTAMP) * 1000).toISOString();
  }
  
  return new Date().toISOString();
}

// Set build environment variables
process.env.VITE_BUILD_VERSION = getBuildVersion();
process.env.VITE_BUILD_TIME = getBuildTime();

// Remove NODE_ENV from process.env to let Vite set it
delete process.env.NODE_ENV;

console.log(`🏗️  Building with version: ${process.env.VITE_BUILD_VERSION}`);
console.log(`📅 Build time: ${process.env.VITE_BUILD_TIME}`);

// Run the actual build (skip TypeScript check for now)
try {
  execSync('vite build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}