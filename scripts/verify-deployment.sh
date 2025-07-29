#!/bin/bash

# 🔍 Deployment Verification and Health Check Script
# This script performs comprehensive health checks on deployed applications

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Health check timeouts and retries
TIMEOUT_SECONDS=30
MAX_RETRIES=3
RETRY_DELAY=5

echo -e "${BLUE}🔍 Starting Deployment Verification${NC}"
echo "================================================="

# Function to check if a URL is reachable
check_url() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    local timeout=${4:-$TIMEOUT_SECONDS}
    
    echo -e "${BLUE}Checking $name: $url${NC}"
    
    local response_code
    local response_time
    local start_time=$(date +%s%3N)
    
    if response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null); then
        local end_time=$(date +%s%3N)
        response_time=$((end_time - start_time))
        
        if [ "$response_code" -eq "$expected_status" ]; then
            echo -e "${GREEN}✅ $name is responding (${response_code}) - ${response_time}ms${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  $name returned unexpected status: ${response_code} (expected ${expected_status})${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ $name is not responding or timed out${NC}"
        return 1
    fi
}

# Function to check URL with retries
check_url_with_retry() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    local attempts=0
    
    while [ $attempts -lt $MAX_RETRIES ]; do
        if check_url "$url" "$name" "$expected_status"; then
            return 0
        fi
        
        attempts=$((attempts + 1))
        if [ $attempts -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}Retrying in ${RETRY_DELAY} seconds... (attempt $attempts/$MAX_RETRIES)${NC}"
            sleep $RETRY_DELAY
        fi
    done
    
    echo -e "${RED}❌ $name failed after $MAX_RETRIES attempts${NC}"
    return 1
}

# Function to check JSON API endpoint
check_json_api() {
    local url=$1
    local name=$2
    local expected_field=$3
    local expected_value=$4
    
    echo -e "${BLUE}Checking JSON API $name: $url${NC}"
    
    local response
    if response=$(curl -s --max-time "$TIMEOUT_SECONDS" -H "Accept: application/json" "$url" 2>/dev/null); then
        if command -v jq >/dev/null 2>&1; then
            local field_value
            if field_value=$(echo "$response" | jq -r ".$expected_field" 2>/dev/null); then
                if [ "$field_value" = "$expected_value" ]; then
                    echo -e "${GREEN}✅ $name JSON API is valid ($expected_field: $field_value)${NC}"
                    return 0
                else
                    echo -e "${YELLOW}⚠️  $name JSON API field mismatch ($expected_field: $field_value, expected: $expected_value)${NC}"
                    return 1
                fi
            else
                echo -e "${YELLOW}⚠️  $name JSON API missing field: $expected_field${NC}"
                return 1
            fi
        else
            echo -e "${YELLOW}⚠️  jq not available, skipping JSON validation for $name${NC}"
            echo -e "${GREEN}✅ $name JSON API is responding${NC}"
            return 0
        fi
    else
        echo -e "${RED}❌ $name JSON API is not responding${NC}"
        return 1
    fi
}

# Function to check SSL certificate
check_ssl_certificate() {
    local url=$1
    local name=$2
    
    echo -e "${BLUE}Checking SSL certificate for $name${NC}"
    
    local domain
    domain=$(echo "$url" | sed -E 's/^https?:\/\/([^\/]+).*/\1/')
    
    if command -v openssl >/dev/null 2>&1; then
        local cert_info
        if cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
            local not_after
            not_after=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
            echo -e "${GREEN}✅ $name SSL certificate is valid (expires: $not_after)${NC}"
            return 0
        else
            echo -e "${RED}❌ $name SSL certificate check failed${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  openssl not available, skipping SSL check for $name${NC}"
        return 0
    fi
}

# Function to check performance metrics
check_performance() {
    local url=$1
    local name=$2
    local max_response_time=${3:-3000}  # 3 seconds default
    
    echo -e "${BLUE}Checking performance for $name${NC}"
    
    local total_time
    if total_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT_SECONDS" "$url" 2>/dev/null); then
        local response_time_ms
        response_time_ms=$(echo "$total_time * 1000" | bc 2>/dev/null || echo "unknown")
        
        if command -v bc >/dev/null 2>&1; then
            if (( $(echo "$total_time * 1000 < $max_response_time" | bc -l) )); then
                echo -e "${GREEN}✅ $name performance is good (${response_time_ms}ms < ${max_response_time}ms)${NC}"
                return 0
            else
                echo -e "${YELLOW}⚠️  $name performance is slow (${response_time_ms}ms > ${max_response_time}ms)${NC}"
                return 1
            fi
        else
            echo -e "${YELLOW}⚠️  bc not available, skipping performance check for $name${NC}"
            return 0
        fi
    else
        echo -e "${RED}❌ $name performance check failed${NC}"
        return 1
    fi
}

# Function to check security headers
check_security_headers() {
    local url=$1
    local name=$2
    
    echo -e "${BLUE}Checking security headers for $name${NC}"
    
    local headers
    if headers=$(curl -s -I --max-time "$TIMEOUT_SECONDS" "$url" 2>/dev/null); then
        local score=0
        local max_score=6
        
        # Check for important security headers
        if echo "$headers" | grep -qi "x-content-type-options: nosniff"; then
            echo -e "${GREEN}  ✅ X-Content-Type-Options header present${NC}"
            score=$((score + 1))
        else
            echo -e "${YELLOW}  ⚠️  X-Content-Type-Options header missing${NC}"
        fi
        
        if echo "$headers" | grep -qi "x-frame-options"; then
            echo -e "${GREEN}  ✅ X-Frame-Options header present${NC}"
            score=$((score + 1))
        else
            echo -e "${YELLOW}  ⚠️  X-Frame-Options header missing${NC}"
        fi
        
        if echo "$headers" | grep -qi "x-xss-protection"; then
            echo -e "${GREEN}  ✅ X-XSS-Protection header present${NC}"
            score=$((score + 1))
        else
            echo -e "${YELLOW}  ⚠️  X-XSS-Protection header missing${NC}"
        fi
        
        if echo "$headers" | grep -qi "strict-transport-security"; then
            echo -e "${GREEN}  ✅ Strict-Transport-Security header present${NC}"
            score=$((score + 1))
        else
            echo -e "${YELLOW}  ⚠️  Strict-Transport-Security header missing${NC}"
        fi
        
        if echo "$headers" | grep -qi "content-security-policy"; then
            echo -e "${GREEN}  ✅ Content-Security-Policy header present${NC}"
            score=$((score + 1))
        else
            echo -e "${YELLOW}  ⚠️  Content-Security-Policy header missing${NC}"
        fi
        
        if echo "$headers" | grep -qi "referrer-policy"; then
            echo -e "${GREEN}  ✅ Referrer-Policy header present${NC}"
            score=$((score + 1))
        else
            echo -e "${YELLOW}  ⚠️  Referrer-Policy header missing${NC}"
        fi
        
        local percentage=$((score * 100 / max_score))
        if [ $score -ge 4 ]; then
            echo -e "${GREEN}✅ $name security headers score: $score/$max_score ($percentage%)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  $name security headers score: $score/$max_score ($percentage%) - consider improving${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ $name security headers check failed${NC}"
        return 1
    fi
}

# Function to check PWA manifest
check_pwa_manifest() {
    local url=$1
    local name=$2
    
    echo -e "${BLUE}Checking PWA manifest for $name${NC}"
    
    local manifest_url="$url/manifest.json"
    local manifest_content
    
    if manifest_content=$(curl -s --max-time "$TIMEOUT_SECONDS" -H "Accept: application/json" "$manifest_url" 2>/dev/null); then
        if command -v jq >/dev/null 2>&1; then
            local app_name
            local icons_count
            
            if app_name=$(echo "$manifest_content" | jq -r '.name // .short_name' 2>/dev/null) && [ "$app_name" != "null" ]; then
                echo -e "${GREEN}  ✅ PWA manifest has app name: $app_name${NC}"
            else
                echo -e "${YELLOW}  ⚠️  PWA manifest missing app name${NC}"
            fi
            
            if icons_count=$(echo "$manifest_content" | jq '.icons | length' 2>/dev/null) && [ "$icons_count" -gt 0 ]; then
                echo -e "${GREEN}  ✅ PWA manifest has $icons_count icons${NC}"
            else
                echo -e "${YELLOW}  ⚠️  PWA manifest missing icons${NC}"
            fi
            
            echo -e "${GREEN}✅ $name PWA manifest is accessible${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  jq not available, basic PWA manifest check passed for $name${NC}"
            return 0
        fi
    else
        echo -e "${YELLOW}⚠️  $name PWA manifest not accessible${NC}"
        return 1
    fi
}

# Function to check service worker
check_service_worker() {
    local url=$1
    local name=$2
    
    echo -e "${BLUE}Checking service worker for $name${NC}"
    
    local sw_url="$url/sw.js"
    
    if check_url "$sw_url" "$name Service Worker" 200 10; then
        echo -e "${GREEN}✅ $name service worker is accessible${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $name service worker not accessible${NC}"
        return 1
    fi
}

# Read deployment info if available
DEPLOYMENT_INFO_FILE="$PROJECT_ROOT/.vercel-deployment-info.json"
PREVIEW_URL=""
PRODUCTION_URL=""

if [ -f "$DEPLOYMENT_INFO_FILE" ]; then
    echo -e "${BLUE}📋 Reading deployment information...${NC}"
    
    if command -v jq >/dev/null 2>&1; then
        PREVIEW_URL=$(jq -r '.previewUrl // empty' "$DEPLOYMENT_INFO_FILE" 2>/dev/null)
        PRODUCTION_URL=$(jq -r '.productionUrl // empty' "$DEPLOYMENT_INFO_FILE" 2>/dev/null)
        
        echo -e "${GREEN}✅ Deployment information loaded${NC}"
        
        if [ -n "$PREVIEW_URL" ] && [ "$PREVIEW_URL" != "Not deployed" ]; then
            echo -e "${BLUE}Preview URL: $PREVIEW_URL${NC}"
        fi
        
        if [ -n "$PRODUCTION_URL" ] && [ "$PRODUCTION_URL" != "Not deployed" ]; then
            echo -e "${BLUE}Production URL: $PRODUCTION_URL${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  jq not available, manual URL input required${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No deployment info file found, manual URL input required${NC}"
fi

# Get URLs if not available from deployment info
if [ -z "$PREVIEW_URL" ] || [ -z "$PRODUCTION_URL" ]; then
    echo -e "\n${BLUE}Please provide deployment URLs to verify:${NC}"
    
    if [ -z "$PREVIEW_URL" ]; then
        read -p "Preview/Staging URL (or press Enter to skip): " PREVIEW_URL
    fi
    
    if [ -z "$PRODUCTION_URL" ]; then
        read -p "Production URL (or press Enter to skip): " PRODUCTION_URL
    fi
fi

# Initialize test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test and track results
run_test() {
    local test_name=$1
    shift
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "\n${BLUE}Running test: $test_name${NC}"
    if "$@"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Run verification tests
echo -e "\n${BLUE}🧪 Running Deployment Verification Tests${NC}"
echo "================================================="

# Test Preview Environment
if [ -n "$PREVIEW_URL" ] && [ "$PREVIEW_URL" != "Not deployed" ]; then
    echo -e "\n${YELLOW}🔍 PREVIEW ENVIRONMENT TESTS${NC}"
    echo "----------------------------------------"
    
    run_test "Preview Home Page" check_url_with_retry "$PREVIEW_URL" "Preview Home"
    run_test "Preview Health API" check_json_api "$PREVIEW_URL/api/health.json" "Preview Health" "status" "ok"
    run_test "Preview PWA Manifest" check_pwa_manifest "$PREVIEW_URL" "Preview"
    run_test "Preview Service Worker" check_service_worker "$PREVIEW_URL" "Preview"
    run_test "Preview Performance" check_performance "$PREVIEW_URL" "Preview" 5000
    
    if [[ "$PREVIEW_URL" == https://* ]]; then
        run_test "Preview SSL Certificate" check_ssl_certificate "$PREVIEW_URL" "Preview"
        run_test "Preview Security Headers" check_security_headers "$PREVIEW_URL" "Preview"
    fi
fi

# Test Production Environment
if [ -n "$PRODUCTION_URL" ] && [ "$PRODUCTION_URL" != "Not deployed" ]; then
    echo -e "\n${GREEN}🚀 PRODUCTION ENVIRONMENT TESTS${NC}"
    echo "----------------------------------------"
    
    run_test "Production Home Page" check_url_with_retry "$PRODUCTION_URL" "Production Home"
    run_test "Production Health API" check_json_api "$PRODUCTION_URL/api/health.json" "Production Health" "status" "ok"
    run_test "Production PWA Manifest" check_pwa_manifest "$PRODUCTION_URL" "Production"
    run_test "Production Service Worker" check_service_worker "$PRODUCTION_URL" "Production"
    run_test "Production Performance" check_performance "$PRODUCTION_URL" "Production" 3000
    
    if [[ "$PRODUCTION_URL" == https://* ]]; then
        run_test "Production SSL Certificate" check_ssl_certificate "$PRODUCTION_URL" "Production"
        run_test "Production Security Headers" check_security_headers "$PRODUCTION_URL" "Production"
    fi
fi

# Additional API endpoint tests
echo -e "\n${BLUE}🔌 API ENDPOINT TESTS${NC}"
echo "----------------------------------------"

if [ -n "$PRODUCTION_URL" ] && [ "$PRODUCTION_URL" != "Not deployed" ]; then
    run_test "Production 404 Handling" check_url "$PRODUCTION_URL/non-existent-page" "Production 404" 200  # Should redirect to index.html for SPA
fi

# Performance and SEO tests
echo -e "\n${BLUE}📊 PERFORMANCE AND SEO TESTS${NC}"
echo "----------------------------------------"

if [ -n "$PRODUCTION_URL" ] && [ "$PRODUCTION_URL" != "Not deployed" ]; then
    # Check if robots.txt exists (optional)
    if check_url "$PRODUCTION_URL/robots.txt" "Robots.txt" 200 5 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ robots.txt is accessible${NC}"
    else
        echo -e "${YELLOW}ℹ️  robots.txt not found (optional)${NC}"
    fi
    
    # Check if sitemap.xml exists (optional)
    if check_url "$PRODUCTION_URL/sitemap.xml" "Sitemap.xml" 200 5 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ sitemap.xml is accessible${NC}"
    else
        echo -e "${YELLOW}ℹ️  sitemap.xml not found (optional)${NC}"
    fi
fi

# Generate verification report
echo -e "\n${BLUE}📊 DEPLOYMENT VERIFICATION REPORT${NC}"
echo "================================================="

SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo -e "${BLUE}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed Tests:${NC} $PASSED_TESTS"
echo -e "${RED}Failed Tests:${NC} $FAILED_TESTS"
echo -e "${BLUE}Success Rate:${NC} $SUCCESS_RATE%"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Deployment verification successful.${NC}"
    exit_code=0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️  Most tests passed ($SUCCESS_RATE%), but some issues were found.${NC}"
    echo -e "${YELLOW}Consider reviewing the failed tests and fixing any critical issues.${NC}"
    exit_code=0
else
    echo -e "\n${RED}❌ Many tests failed ($SUCCESS_RATE% success rate).${NC}"
    echo -e "${RED}Please review and fix the issues before considering the deployment ready.${NC}"
    exit_code=1
fi

# Recommendations
echo -e "\n${BLUE}💡 RECOMMENDATIONS${NC}"
echo "----------------------------------------"

if [ $FAILED_TESTS -gt 0 ]; then
    echo "• Review failed tests and address any critical issues"
    echo "• Ensure all required environment variables are properly set"
    echo "• Verify SSL certificates are valid and not expiring soon"
    echo "• Check security headers configuration in vercel.json"
    echo "• Monitor application performance and optimize if needed"
fi

echo "• Set up monitoring and alerting for production"
echo "• Configure uptime monitoring (e.g., UptimeRobot, Pingdom)"
echo "• Set up error tracking and performance monitoring"
echo "• Consider implementing automated health checks"
echo "• Document any known issues or limitations"

# Save verification results
VERIFICATION_RESULTS_FILE="$PROJECT_ROOT/.deployment-verification-results.json"
cat > "$VERIFICATION_RESULTS_FILE" << EOF
{
  "verificationDate": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "totalTests": $TOTAL_TESTS,
  "passedTests": $PASSED_TESTS,
  "failedTests": $FAILED_TESTS,
  "successRate": $SUCCESS_RATE,
  "previewUrl": "${PREVIEW_URL:-""}",
  "productionUrl": "${PRODUCTION_URL:-""}",
  "status": "$([ $exit_code -eq 0 ] && echo "passed" || echo "failed")"
}
EOF

echo -e "\n${GREEN}Verification results saved to .deployment-verification-results.json${NC}"
echo -e "\n${GREEN}Deployment verification completed! 🎉${NC}"

exit $exit_code