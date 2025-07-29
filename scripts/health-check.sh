#!/bin/bash

# 🏥 Application Health Check Script
# This script performs quick health checks on the deployed application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT_SECONDS=10
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default URLs (can be overridden)
DEFAULT_PRODUCTION_URL="https://taxi-carpooling.vercel.app"
DEFAULT_PREVIEW_URL=""

# Parse command line arguments
PRODUCTION_URL=""
PREVIEW_URL=""
VERBOSE=false
JSON_OUTPUT=false

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --production URL    Production URL to check"
    echo "  -s, --preview URL       Preview/staging URL to check" 
    echo "  -v, --verbose          Enable verbose output"
    echo "  -j, --json             Output results in JSON format"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 -p https://taxi-carpooling.vercel.app -v"
    echo "  $0 --json > health-report.json"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--production)
            PRODUCTION_URL="$2"
            shift 2
            ;;
        -s|--preview)
            PREVIEW_URL="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -j|--json)
            JSON_OUTPUT=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Function to log output (respects verbose and JSON flags)
log() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "$1"
    fi
}

verbose_log() {
    if [ "$VERBOSE" = true ] && [ "$JSON_OUTPUT" = false ]; then
        echo -e "$1"
    fi
}

# Initialize results tracking
declare -A results

# Function to perform a simple health check
simple_health_check() {
    local url=$1
    local name=$2
    
    verbose_log "${BLUE}Checking $name health: $url${NC}"
    
    local start_time=$(date +%s%3N)
    local response_code
    local response_time
    
    if response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT_SECONDS" "$url" 2>/dev/null); then
        local end_time=$(date +%s%3N)
        response_time=$((end_time - start_time))
        
        if [ "$response_code" -eq 200 ]; then
            verbose_log "${GREEN}✅ $name is healthy (${response_code}) - ${response_time}ms${NC}"
            results["${name}_status"]="healthy"
            results["${name}_response_code"]="$response_code"
            results["${name}_response_time"]="$response_time"
            return 0
        else
            verbose_log "${YELLOW}⚠️  $name returned status: ${response_code}${NC}"
            results["${name}_status"]="unhealthy"
            results["${name}_response_code"]="$response_code"
            results["${name}_response_time"]="$response_time"
            return 1
        fi
    else
        verbose_log "${RED}❌ $name is not responding${NC}"
        results["${name}_status"]="down"
        results["${name}_response_code"]="0"
        results["${name}_response_time"]="timeout"
        return 1
    fi
}

# Function to check API health endpoint  
check_api_health() {
    local url=$1
    local name=$2
    
    local api_url="$url/api/health.json"
    verbose_log "${BLUE}Checking $name API health: $api_url${NC}"
    
    local start_time=$(date +%s%3N)
    local response
    local response_code
    
    if response=$(curl -s -w "\n%{http_code}" --max-time "$TIMEOUT_SECONDS" -H "Accept: application/json" "$api_url" 2>/dev/null); then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        response_code=$(echo "$response" | tail -n1)
        local json_response=$(echo "$response" | head -n -1)
        
        if [ "$response_code" -eq 200 ]; then
            if command -v jq >/dev/null 2>&1; then
                local status
                if status=$(echo "$json_response" | jq -r '.status' 2>/dev/null) && [ "$status" = "ok" ]; then
                    verbose_log "${GREEN}✅ $name API is healthy - ${response_time}ms${NC}"
                    results["${name}_api_status"]="healthy"
                    results["${name}_api_response_time"]="$response_time"
                    return 0
                else
                    verbose_log "${YELLOW}⚠️  $name API status is not ok: $status${NC}"
                    results["${name}_api_status"]="unhealthy"
                    results["${name}_api_response_time"]="$response_time"
                    return 1
                fi
            else
                verbose_log "${GREEN}✅ $name API is responding - ${response_time}ms${NC}"
                results["${name}_api_status"]="healthy"
                results["${name}_api_response_time"]="$response_time"
                return 0
            fi
        else
            verbose_log "${YELLOW}⚠️  $name API returned status: ${response_code}${NC}"
            results["${name}_api_status"]="unhealthy"
            results["${name}_api_response_time"]="$response_time"
            return 1
        fi
    else
        verbose_log "${RED}❌ $name API is not responding${NC}"
        results["${name}_api_status"]="down"
        results["${name}_api_response_time"]="timeout"
        return 1
    fi
}

# Function to check critical assets
check_critical_assets() {
    local url=$1
    local name=$2
    
    local assets=("manifest.json" "sw.js")
    local healthy_assets=0
    local total_assets=${#assets[@]}
    
    verbose_log "${BLUE}Checking $name critical assets${NC}"
    
    for asset in "${assets[@]}"; do
        local asset_url="$url/$asset"
        if curl -s -o /dev/null --max-time 5 "$asset_url" 2>/dev/null; then
            verbose_log "${GREEN}  ✅ $asset is accessible${NC}"
            healthy_assets=$((healthy_assets + 1))
        else
            verbose_log "${YELLOW}  ⚠️  $asset is not accessible${NC}"
        fi
    done
    
    results["${name}_assets_healthy"]="$healthy_assets"
    results["${name}_assets_total"]="$total_assets"
    
    if [ $healthy_assets -eq $total_assets ]; then
        verbose_log "${GREEN}✅ All $name critical assets are healthy${NC}"
        return 0
    else
        verbose_log "${YELLOW}⚠️  Some $name critical assets are missing${NC}"
        return 1
    fi
}

# Try to read deployment info for URLs
DEPLOYMENT_INFO_FILE="$PROJECT_ROOT/.vercel-deployment-info.json"

if [ -f "$DEPLOYMENT_INFO_FILE" ] && command -v jq >/dev/null 2>&1; then
    if [ -z "$PRODUCTION_URL" ]; then
        PRODUCTION_URL=$(jq -r '.productionUrl // empty' "$DEPLOYMENT_INFO_FILE" 2>/dev/null)
    fi
    
    if [ -z "$PREVIEW_URL" ]; then
        PREVIEW_URL=$(jq -r '.previewUrl // empty' "$DEPLOYMENT_INFO_FILE" 2>/dev/null)
    fi
fi

# Use defaults if still not set
if [ -z "$PRODUCTION_URL" ]; then
    PRODUCTION_URL="$DEFAULT_PRODUCTION_URL"
fi

# Initialize health check
if [ "$JSON_OUTPUT" = false ]; then
    echo -e "${BLUE}🏥 Starting Application Health Check${NC}"
    echo "================================================="
fi

# Track overall health
overall_health=true
total_checks=0
successful_checks=0

# Check production environment
if [ -n "$PRODUCTION_URL" ] && [ "$PRODUCTION_URL" != "Not deployed" ]; then
    log "${GREEN}🚀 PRODUCTION HEALTH CHECK${NC}"
    log "URL: $PRODUCTION_URL"
    log "----------------------------------------"
    
    # Main application health
    total_checks=$((total_checks + 1))
    if simple_health_check "$PRODUCTION_URL" "production"; then
        successful_checks=$((successful_checks + 1))
    else
        overall_health=false
    fi
    
    # API health  
    total_checks=$((total_checks + 1))
    if check_api_health "$PRODUCTION_URL" "production"; then
        successful_checks=$((successful_checks + 1))
    else
        overall_health=false
    fi
    
    # Critical assets
    total_checks=$((total_checks + 1))
    if check_critical_assets "$PRODUCTION_URL" "production"; then
        successful_checks=$((successful_checks + 1))
    else
        overall_health=false
    fi
fi

# Check preview environment
if [ -n "$PREVIEW_URL" ] && [ "$PREVIEW_URL" != "Not deployed" ]; then
    log "\n${YELLOW}🔍 PREVIEW HEALTH CHECK${NC}"
    log "URL: $PREVIEW_URL"
    log "----------------------------------------"
    
    # Main application health
    total_checks=$((total_checks + 1))
    if simple_health_check "$PREVIEW_URL" "preview"; then
        successful_checks=$((successful_checks + 1))
    else
        overall_health=false
    fi
    
    # API health
    total_checks=$((total_checks + 1))
    if check_api_health "$PREVIEW_URL" "preview"; then
        successful_checks=$((successful_checks + 1))
    else
        overall_health=false
    fi
    
    # Critical assets
    total_checks=$((total_checks + 1))
    if check_critical_assets "$PREVIEW_URL" "preview"; then
        successful_checks=$((successful_checks + 1))
    else
        overall_health=false
    fi
fi

# Calculate health percentage
if [ $total_checks -gt 0 ]; then
    health_percentage=$((successful_checks * 100 / total_checks))
else
    health_percentage=0
fi

# Generate results
results["timestamp"]=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
results["overall_health"]=$([ "$overall_health" = true ] && echo "healthy" || echo "unhealthy")
results["total_checks"]="$total_checks"
results["successful_checks"]="$successful_checks"
results["health_percentage"]="$health_percentage"
results["production_url"]="$PRODUCTION_URL"
results["preview_url"]="$PREVIEW_URL"

# Output results
if [ "$JSON_OUTPUT" = true ]; then
    # Generate JSON output
    echo "{"
    echo "  \"timestamp\": \"${results[timestamp]}\","
    echo "  \"overall_health\": \"${results[overall_health]}\","
    echo "  \"total_checks\": ${results[total_checks]},"
    echo "  \"successful_checks\": ${results[successful_checks]},"
    echo "  \"health_percentage\": ${results[health_percentage]},"
    echo "  \"environments\": {"
    
    # Production results
    if [ -n "$PRODUCTION_URL" ] && [ "$PRODUCTION_URL" != "Not deployed" ]; then
        echo "    \"production\": {"
        echo "      \"url\": \"$PRODUCTION_URL\","
        echo "      \"status\": \"${results[production_status]}\","
        echo "      \"response_code\": \"${results[production_response_code]}\","
        echo "      \"response_time\": \"${results[production_response_time]}\","
        echo "      \"api_status\": \"${results[production_api_status]}\","
        echo "      \"api_response_time\": \"${results[production_api_response_time]}\","
        echo "      \"assets_healthy\": ${results[production_assets_healthy]},"
        echo "      \"assets_total\": ${results[production_assets_total]}"
        echo "    }"
        if [ -n "$PREVIEW_URL" ] && [ "$PREVIEW_URL" != "Not deployed" ]; then
            echo "    ,"
        fi
    fi
    
    # Preview results
    if [ -n "$PREVIEW_URL" ] && [ "$PREVIEW_URL" != "Not deployed" ]; then
        echo "    \"preview\": {"
        echo "      \"url\": \"$PREVIEW_URL\","
        echo "      \"status\": \"${results[preview_status]}\","
        echo "      \"response_code\": \"${results[preview_response_code]}\","
        echo "      \"response_time\": \"${results[preview_response_time]}\","
        echo "      \"api_status\": \"${results[preview_api_status]}\","
        echo "      \"api_response_time\": \"${results[preview_api_response_time]}\","
        echo "      \"assets_healthy\": ${results[preview_assets_healthy]},"
        echo "      \"assets_total\": ${results[preview_assets_total]}"
        echo "    }"
    fi
    
    echo "  }"
    echo "}"
else
    # Generate human-readable output
    log "\n${BLUE}📊 HEALTH CHECK SUMMARY${NC}"
    log "================================================="
    log "${BLUE}Overall Health:${NC} $([ "$overall_health" = true ] && echo -e "${GREEN}Healthy${NC}" || echo -e "${RED}Unhealthy${NC}")"
    log "${BLUE}Success Rate:${NC} $successful_checks/$total_checks ($health_percentage%)"
    log "${BLUE}Timestamp:${NC} ${results[timestamp]}"
    
    if [ "$overall_health" = true ]; then
        log "\n${GREEN}🎉 All systems are operational!${NC}"
    else
        log "\n${YELLOW}⚠️  Some issues detected. Please review the failed checks.${NC}"
    fi
    
    log "\n${BLUE}💡 Next Steps:${NC}"
    if [ "$overall_health" = false ]; then
        log "• Investigate any failed health checks"
        log "• Check application logs for errors"
        log "• Verify environment variables are set correctly"
        log "• Ensure all services are running properly"
    fi
    log "• Set up monitoring and alerting"
    log "• Schedule regular health checks"
    log "• Consider adding more comprehensive checks"
fi

# Save results to file
HEALTH_RESULTS_FILE="$PROJECT_ROOT/.health-check-results.json"
{
    echo "{"
    echo "  \"timestamp\": \"${results[timestamp]}\","
    echo "  \"overall_health\": \"${results[overall_health]}\","
    echo "  \"total_checks\": ${results[total_checks]},"
    echo "  \"successful_checks\": ${results[successful_checks]},"
    echo "  \"health_percentage\": ${results[health_percentage]}"
    echo "}"
} > "$HEALTH_RESULTS_FILE"

# Exit with appropriate code
if [ "$overall_health" = true ]; then
    exit 0
else
    exit 1
fi