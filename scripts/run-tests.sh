#!/bin/bash

# Comprehensive Test Execution Script for Taxi Carpooling App
# This script runs all necessary tests and generates a complete report

set -e  # Exit on any error

echo "🚀 Starting comprehensive testing for Taxi Carpooling App"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status $BLUE "🔍 Checking prerequisites..."

if ! command_exists node; then
    print_status $RED "❌ Node.js not found. Please install Node.js."
    exit 1
fi

if ! command_exists npm; then
    print_status $RED "❌ npm not found. Please install npm."
    exit 1
fi

if [ ! -f ".env" ]; then
    print_status $RED "❌ .env file not found. Please create .env file with required variables."
    exit 1
fi

print_status $GREEN "✅ Prerequisites check passed"

# Check environment variables
print_status $BLUE "🔍 Checking environment variables..."

if [ -z "$VITE_SUPABASE_URL" ] && ! grep -q "VITE_SUPABASE_URL" .env; then
    print_status $RED "❌ VITE_SUPABASE_URL not set in environment or .env file"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ] && ! grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    print_status $RED "❌ VITE_SUPABASE_ANON_KEY not set in environment or .env file"
    exit 1
fi

print_status $GREEN "✅ Environment variables check passed"

# Install dependencies if needed
print_status $BLUE "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status $YELLOW "Installing dependencies..."
    npm install
fi
print_status $GREEN "✅ Dependencies ready"

# Run TypeScript check
print_status $BLUE "🔧 Running TypeScript check..."
if npm run type-check; then
    print_status $GREEN "✅ TypeScript check passed"
else
    print_status $YELLOW "⚠️ TypeScript check has issues, but continuing with tests..."
fi

# Run linting
print_status $BLUE "🔍 Running linting check..."
if npm run lint; then
    print_status $GREEN "✅ Linting check passed"
else
    print_status $YELLOW "⚠️ Linting has issues, but continuing with tests..."
fi

# Create test results directory
mkdir -p test-results
TEST_LOG="test-results/test-$(date +%Y%m%d-%H%M%S).log"

print_status $BLUE "📋 Running automated signup tests..."
echo "Test started at: $(date)" > "$TEST_LOG"
echo "===========================================" >> "$TEST_LOG"

# Run the main signup tests
if npm run test:signup 2>&1 | tee -a "$TEST_LOG"; then
    print_status $GREEN "✅ Automated signup tests completed successfully"
    echo "✅ Automated tests PASSED" >> "$TEST_LOG"
else
    print_status $RED "❌ Some automated tests failed. Check the log for details."
    echo "❌ Automated tests FAILED" >> "$TEST_LOG"
fi

# Generate summary report
print_status $BLUE "📊 Generating test summary report..."

cat << EOF > "test-results/test-summary-$(date +%Y%m%d-%H%M%S).md"
# Test Execution Summary

**Date:** $(date)
**Environment:** $(node --version)
**Test Duration:** Started at $(date)

## Automated Test Results

$(cat "$TEST_LOG")

## Manual Testing Checklist

Use the following checklist for manual testing:

### Database Configuration
- [ ] Database triggers applied
- [ ] RLS policies configured
- [ ] User table structure verified

### Supabase Dashboard Configuration
- [ ] Site URL set to production domain
- [ ] Redirect URLs configured for both production and development
- [ ] Email templates configured

### Signup Flow Testing
- [ ] Standard signup works
- [ ] Email confirmation sent
- [ ] Confirmation link redirects correctly
- [ ] Profile creation successful

### Login Flow Testing
- [ ] Standard login works
- [ ] Profile data loads correctly
- [ ] No 406 errors in console
- [ ] Missing profile recovery works

### Error Handling
- [ ] Duplicate email handled gracefully
- [ ] Weak password validation works
- [ ] Network issues handled properly
- [ ] User-friendly error messages shown

## Next Steps

1. Review automated test results above
2. Complete manual testing checklist
3. Fix any identified issues
4. Re-run tests after fixes
5. Document any remaining issues

## Database Verification

To verify database configuration, run the following in Supabase SQL Editor:

\`\`\`sql
-- Copy contents of scripts/verify-database.sql
\`\`\`

## Support

If tests fail, check:
1. Environment variables in .env file
2. Supabase dashboard configuration
3. Database trigger and RLS policies
4. Network connectivity

For detailed troubleshooting, see TESTING_GUIDE.md
EOF

print_status $GREEN "✅ Test summary report generated: test-results/test-summary-$(date +%Y%m%d-%H%M%S).md"

# Final summary
echo ""
print_status $BLUE "🎯 TEST EXECUTION COMPLETED"
print_status $BLUE "=============================="
print_status $BLUE "📄 Detailed logs: $TEST_LOG"
print_status $BLUE "📊 Summary report: test-results/"
print_status $BLUE "📖 Manual testing guide: TESTING_GUIDE.md"
print_status $BLUE "🗄️ Database verification: scripts/verify-database.sql"

echo ""
print_status $YELLOW "Next steps:"
print_status $YELLOW "1. Review the test results above"
print_status $YELLOW "2. Run database verification script in Supabase SQL Editor"
print_status $YELLOW "3. Complete manual testing using TESTING_GUIDE.md"
print_status $YELLOW "4. Fix any identified issues and re-run tests"

echo ""
print_status $GREEN "🎉 Testing framework setup complete!"
print_status $GREEN "Your application is ready for comprehensive testing."