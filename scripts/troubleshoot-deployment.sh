#!/bin/bash

# 🔧 Deployment Troubleshooting Tool
# This script helps diagnose and resolve common deployment issues

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🔧 Deployment Troubleshooting Tool${NC}"
echo "================================================="

# Function to check system requirements
check_system_requirements() {
    echo -e "\n${CYAN}🔍 Checking System Requirements${NC}"
    echo "----------------------------------------"
    
    local issues=0
    
    # Check Node.js version
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version | sed 's/v//')
        echo -e "${GREEN}✅ Node.js: $node_version${NC}"
        
        # Check if version is >= 18
        if ! node -e "process.exit(process.version.split('.')[0].slice(1) >= 18 ? 0 : 1)" 2>/dev/null; then
            echo -e "${RED}❌ Node.js version should be >= 18${NC}"
            issues=$((issues + 1))
        fi
    else
        echo -e "${RED}❌ Node.js is not installed${NC}"
        issues=$((issues + 1))
    fi
    
    # Check npm version
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        echo -e "${GREEN}✅ npm: $npm_version${NC}"
    else
        echo -e "${RED}❌ npm is not installed${NC}"
        issues=$((issues + 1))
    fi
    
    # Check Git
    if command -v git >/dev/null 2>&1; then
        local git_version=$(git --version | cut -d' ' -f3)
        echo -e "${GREEN}✅ Git: $git_version${NC}"
    else
        echo -e "${RED}❌ Git is not installed${NC}"
        issues=$((issues + 1))
    fi
    
    # Check GitHub CLI (optional but recommended)
    if command -v gh >/dev/null 2>&1; then
        local gh_version=$(gh --version | head -n1 | cut -d' ' -f3)
        echo -e "${GREEN}✅ GitHub CLI: $gh_version${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub CLI is not installed (optional)${NC}"
    fi
    
    # Check Vercel CLI (optional but recommended)
    if command -v vercel >/dev/null 2>&1; then
        local vercel_version=$(vercel --version)
        echo -e "${GREEN}✅ Vercel CLI: $vercel_version${NC}"
    else
        echo -e "${YELLOW}⚠️  Vercel CLI is not installed (optional)${NC}"
    fi
    
    if [ $issues -eq 0 ]; then
        echo -e "${GREEN}✅ All system requirements met${NC}"
        return 0
    else
        echo -e "${RED}❌ $issues system requirement issues found${NC}"
        return 1
    fi
}

# Function to validate environment variables
validate_environment_variables() {
    echo -e "\n${CYAN}🔐 Validating Environment Variables${NC}"
    echo "----------------------------------------"
    
    local env_file="$PROJECT_ROOT/.env"
    local issues=0
    
    if [ ! -f "$env_file" ]; then
        echo -e "${RED}❌ .env file not found${NC}"
        echo "💡 Run: cp .env.example .env"
        return 1
    fi
    
    echo -e "${GREEN}✅ .env file found${NC}"
    
    # Check required environment variables
    local required_vars=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
        "VITE_GOOGLE_MAPS_API_KEY"
        "VITE_APP_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" "$env_file" && ! grep -q "^$var=$" "$env_file" && ! grep -q "^$var=your-" "$env_file"; then
            echo -e "${GREEN}✅ $var is set${NC}"
        else
            echo -e "${RED}❌ $var is missing or not configured${NC}"
            issues=$((issues + 1))
        fi
    done
    
    # Test environment variable loading
    if cd "$PROJECT_ROOT" && npm run build:vercel >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Environment variables load correctly${NC}"
    else
        echo -e "${RED}❌ Environment variables failed validation${NC}"
        issues=$((issues + 1))
    fi
    
    if [ $issues -eq 0 ]; then
        echo -e "${GREEN}✅ All environment variables are properly configured${NC}"
        return 0
    else
        echo -e "${RED}❌ $issues environment variable issues found${NC}"
        return 1
    fi
}

# Function to check project dependencies
check_project_dependencies() {
    echo -e "\n${CYAN}📦 Checking Project Dependencies${NC}"
    echo "----------------------------------------"
    
    cd "$PROJECT_ROOT"
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json not found${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ package.json found${NC}"
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠️  node_modules not found, installing dependencies...${NC}"
        npm install
    else
        echo -e "${GREEN}✅ node_modules directory exists${NC}"
    fi
    
    # Check for package-lock.json
    if [ -f "package-lock.json" ]; then
        echo -e "${GREEN}✅ package-lock.json found${NC}"
    else
        echo -e "${YELLOW}⚠️  package-lock.json not found${NC}"
    fi
    
    # Check for security vulnerabilities
    echo -e "${BLUE}🔍 Checking for security vulnerabilities...${NC}"
    if npm audit --audit-level=high >/dev/null 2>&1; then
        echo -e "${GREEN}✅ No high-severity vulnerabilities found${NC}"
    else
        echo -e "${YELLOW}⚠️  High-severity vulnerabilities found${NC}"
        echo "💡 Run: npm audit fix"
    fi
    
    # Check for outdated packages
    echo -e "${BLUE}🔍 Checking for outdated packages...${NC}"
    local outdated_count=$(npm outdated --depth=0 2>/dev/null | wc -l)
    if [ "$outdated_count" -le 1 ]; then
        echo -e "${GREEN}✅ All packages are up to date${NC}"
    else
        echo -e "${YELLOW}⚠️  $((outdated_count - 1)) packages are outdated${NC}"
        echo "💡 Run: npm update"
    fi
    
    return 0
}

# Function to validate build process
validate_build_process() {
    echo -e "\n${CYAN}🏗️  Validating Build Process${NC}"
    echo "----------------------------------------"
    
    cd "$PROJECT_ROOT"
    
    # Clean previous builds
    if [ -d "dist" ]; then
        echo -e "${BLUE}🧹 Cleaning previous build...${NC}"
        rm -rf dist
    fi
    
    # Test TypeScript compilation
    echo -e "${BLUE}🔍 Testing TypeScript compilation...${NC}"
    if npm run type-check >/dev/null 2>&1; then
        echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
    else
        echo -e "${RED}❌ TypeScript compilation failed${NC}"
        echo "💡 Run: npm run type-check to see detailed errors"
        return 1
    fi
    
    # Test linting
    echo -e "${BLUE}🔍 Testing code linting...${NC}"
    if npm run lint >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Code linting passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Linting issues found${NC}"
        echo "💡 Run: npm run lint:fix to auto-fix issues"
    fi
    
    # Test build
    echo -e "${BLUE}🔍 Testing production build...${NC}"
    if npm run build >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Production build successful${NC}"
        
        # Check build output
        if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
            echo -e "${GREEN}✅ Build output generated${NC}"
            
            # Check for key files
            if [ -f "dist/index.html" ]; then
                echo -e "${GREEN}✅ index.html generated${NC}"
            else
                echo -e "${RED}❌ index.html not found in build output${NC}"
            fi
            
            if [ -d "dist/assets" ]; then
                echo -e "${GREEN}✅ Assets directory generated${NC}"
            else
                echo -e "${RED}❌ Assets directory not found${NC}"
            fi
        else
            echo -e "${RED}❌ Build output is empty${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Production build failed${NC}"
        echo "💡 Run: npm run build to see detailed errors"
        return 1
    fi
    
    return 0
}

# Function to check Git repository status
check_git_status() {
    echo -e "\n${CYAN}📋 Checking Git Repository Status${NC}"
    echo "----------------------------------------"
    
    cd "$PROJECT_ROOT"
    
    if [ ! -d ".git" ]; then
        echo -e "${RED}❌ Not a Git repository${NC}"
        echo "💡 Run: git init"
        return 1
    fi
    
    echo -e "${GREEN}✅ Git repository found${NC}"
    
    # Check if there are uncommitted changes
    if git diff --quiet && git diff --staged --quiet; then
        echo -e "${GREEN}✅ Working directory is clean${NC}"
    else
        echo -e "${YELLOW}⚠️  Uncommitted changes found${NC}"
        echo "💡 Commit your changes before deploying"
    fi
    
    # Check if there are untracked files
    if [ -z "$(git ls-files --others --exclude-standard)" ]; then
        echo -e "${GREEN}✅ No untracked files${NC}"
    else
        echo -e "${YELLOW}⚠️  Untracked files found${NC}"
        echo "💡 Add important files to Git or .gitignore"
    fi
    
    # Check current branch
    local current_branch=$(git branch --show-current)
    echo -e "${BLUE}Current branch: $current_branch${NC}"
    
    # Check remote origin
    if git remote get-url origin >/dev/null 2>&1; then
        local remote_url=$(git remote get-url origin)
        echo -e "${GREEN}✅ Remote origin configured: $remote_url${NC}"
    else
        echo -e "${YELLOW}⚠️  No remote origin configured${NC}"
        echo "💡 Add remote origin for deployment"
    fi
    
    return 0
}

# Function to test API endpoints
test_api_endpoints() {
    echo -e "\n${CYAN}🔌 Testing API Endpoints${NC}"
    echo "----------------------------------------"
    
    local base_url="http://localhost:5173"  # Vite dev server default
    
    # Check if dev server is running
    if curl -s --max-time 5 "$base_url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Development server is running${NC}"
        
        # Test health endpoint
        if curl -s --max-time 5 "$base_url/api/health.json" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Health API endpoint is accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  Health API endpoint not accessible${NC}"
        fi
        
        # Test manifest
        if curl -s --max-time 5 "$base_url/manifest.json" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ PWA manifest is accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  PWA manifest not accessible${NC}"
        fi
        
    else
        echo -e "${YELLOW}⚠️  Development server is not running${NC}"
        echo "💡 Run: npm run dev"
    fi
}

# Function to check external service connectivity
check_external_services() {
    echo -e "\n${CYAN}🌐 Checking External Service Connectivity${NC}"
    echo "----------------------------------------"
    
    local env_file="$PROJECT_ROOT/.env"
    
    if [ ! -f "$env_file" ]; then
        echo -e "${YELLOW}⚠️  .env file not found, skipping external service checks${NC}"
        return 0
    fi
    
    # Check Supabase connectivity
    local supabase_url=$(grep "^VITE_SUPABASE_URL=" "$env_file" | cut -d'=' -f2)
    if [ -n "$supabase_url" ] && [[ "$supabase_url" != "your-"* ]]; then
        if curl -s --max-time 10 "$supabase_url/rest/v1/" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Supabase is reachable${NC}"
        else
            echo -e "${RED}❌ Supabase is not reachable${NC}"
            echo "💡 Check your Supabase URL and network connection"
        fi
    else
        echo -e "${YELLOW}⚠️  Supabase URL not configured${NC}"
    fi
    
    # Check Google Maps API (basic connectivity)
    if curl -s --max-time 10 "https://maps.googleapis.com/maps/api/js" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Google Maps API is reachable${NC}"
    else
        echo -e "${RED}❌ Google Maps API is not reachable${NC}"
        echo "💡 Check your network connection"
    fi
    
    # Check Sentry (if configured)
    local sentry_dsn=$(grep "^VITE_SENTRY_DSN=" "$env_file" 2>/dev/null | cut -d'=' -f2)
    if [ -n "$sentry_dsn" ] && [[ "$sentry_dsn" != "your-"* ]]; then
        local sentry_domain=$(echo "$sentry_dsn" | sed -E 's|.*@([^/]+)/.*|\1|')
        if curl -s --max-time 10 "https://$sentry_domain" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Sentry is reachable${NC}"
        else
            echo -e "${RED}❌ Sentry is not reachable${NC}"
        fi
    else
        echo -e "${BLUE}ℹ️  Sentry not configured (optional)${NC}"
    fi
}

# Function to provide common solutions
provide_common_solutions() {
    echo -e "\n${CYAN}💡 Common Issues and Solutions${NC}"
    echo "================================================="
    
    echo -e "${YELLOW}🔧 Build Failures:${NC}"
    echo "• Clear node_modules and reinstall: rm -rf node_modules package-lock.json && npm install"
    echo "• Clear build cache: rm -rf dist .vite node_modules/.cache"
    echo "• Check TypeScript errors: npm run type-check"
    echo "• Fix linting errors: npm run lint:fix"
    
    echo -e "\n${YELLOW}🔐 Environment Issues:${NC}"
    echo "• Copy example: cp .env.example .env"
    echo "• Check variable format: VITE_VAR_NAME=value (no spaces around =)"
    echo "• Verify Supabase project URL and keys"
    echo "• Ensure Google Maps API key has required permissions"
    
    echo -e "\n${YELLOW}🚀 Deployment Issues:${NC}"
    echo "• Ensure all changes are committed: git add . && git commit -m 'fix: deployment'"
    echo "• Push to correct branch: git push origin main"
    echo "• Check Vercel dashboard for build logs"
    echo "• Verify environment variables in deployment platform"
    
    echo -e "\n${YELLOW}🌐 Network Issues:${NC}"
    echo "• Check internet connection"
    echo "• Verify firewall settings"
    echo "• Try using a VPN if services are blocked"
    echo "• Check if corporate proxy is interfering"
    
    echo -e "\n${YELLOW}📦 Dependency Issues:${NC}"
    echo "• Update npm: npm install -g npm@latest"
    echo "• Clear npm cache: npm cache clean --force"
    echo "• Delete lock file and reinstall: rm package-lock.json && npm install"
    echo "• Check for conflicting global packages"
}

# Function to generate diagnostic report
generate_diagnostic_report() {
    echo -e "\n${CYAN}📊 Generating Diagnostic Report${NC}"
    echo "----------------------------------------"
    
    local report_file="$PROJECT_ROOT/deployment-diagnostic-report.txt"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    
    {
        echo "Deployment Diagnostic Report"
        echo "Generated: $timestamp"
        echo "========================================"
        echo ""
        
        echo "System Information:"
        echo "- OS: $(uname -s)"
        echo "- Architecture: $(uname -m)"
        echo "- Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
        echo "- npm: $(npm --version 2>/dev/null || echo 'Not installed')"
        echo "- Git: $(git --version 2>/dev/null | cut -d' ' -f3 || echo 'Not installed')"
        echo ""
        
        echo "Project Information:"
        if [ -f "$PROJECT_ROOT/package.json" ]; then
            echo "- Project Name: $(cat "$PROJECT_ROOT/package.json" | grep '"name"' | cut -d'"' -f4)"
            echo "- Version: $(cat "$PROJECT_ROOT/package.json" | grep '"version"' | cut -d'"' -f4)"
        fi
        echo "- Directory: $PROJECT_ROOT"
        echo ""
        
        echo "Git Status:"
        if [ -d "$PROJECT_ROOT/.git" ]; then
            cd "$PROJECT_ROOT"
            echo "- Current Branch: $(git branch --show-current)"
            echo "- Remote Origin: $(git remote get-url origin 2>/dev/null || echo 'Not configured')"
            echo "- Uncommitted Changes: $(git status --porcelain | wc -l | tr -d ' ')"
        else
            echo "- Not a Git repository"
        fi
        echo ""
        
        echo "Environment Variables:"
        if [ -f "$PROJECT_ROOT/.env" ]; then
            echo "- .env file exists"
            echo "- Required variables configured:"
            for var in "VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_GOOGLE_MAPS_API_KEY" "VITE_APP_URL"; do
                if grep -q "^$var=" "$PROJECT_ROOT/.env" && ! grep -q "^$var=$" "$PROJECT_ROOT/.env" && ! grep -q "^$var=your-" "$PROJECT_ROOT/.env"; then
                    echo "  ✅ $var"
                else
                    echo "  ❌ $var"
                fi
            done
        else
            echo "- .env file missing"
        fi
        echo ""
        
        echo "Build Status:"
        cd "$PROJECT_ROOT"
        if npm run type-check >/dev/null 2>&1; then
            echo "- TypeScript: ✅ Pass"
        else
            echo "- TypeScript: ❌ Fail"
        fi
        
        if npm run lint >/dev/null 2>&1; then
            echo "- Linting: ✅ Pass"
        else
            echo "- Linting: ❌ Fail"
        fi
        
        if npm run build >/dev/null 2>&1; then
            echo "- Build: ✅ Pass"
        else
            echo "- Build: ❌ Fail"
        fi
        
    } > "$report_file"
    
    echo -e "${GREEN}✅ Diagnostic report saved to: $report_file${NC}"
}

# Main troubleshooting menu
show_troubleshooting_menu() {
    echo -e "\n${BLUE}🔧 Troubleshooting Options${NC}"
    echo "================================================="
    echo "1. Check system requirements"
    echo "2. Validate environment variables"
    echo "3. Check project dependencies"
    echo "4. Validate build process"
    echo "5. Check Git repository status"
    echo "6. Test API endpoints"
    echo "7. Check external service connectivity"
    echo "8. Run full diagnostic"
    echo "9. Show common solutions"
    echo "10. Generate diagnostic report"
    echo "0. Exit"
    echo ""
    
    read -p "Select an option (0-10): " choice
    
    case $choice in
        1) check_system_requirements ;;
        2) validate_environment_variables ;;
        3) check_project_dependencies ;;
        4) validate_build_process ;;
        5) check_git_status ;;
        6) test_api_endpoints ;;
        7) check_external_services ;;
        8) run_full_diagnostic ;;
        9) provide_common_solutions ;;
        10) generate_diagnostic_report ;;
        0) echo -e "${GREEN}Goodbye! 👋${NC}"; exit 0 ;;
        *) echo -e "${RED}Invalid option. Please try again.${NC}" ;;
    esac
    
    echo -e "\n${BLUE}Press Enter to continue...${NC}"
    read
    show_troubleshooting_menu
}

# Function to run full diagnostic
run_full_diagnostic() {
    echo -e "\n${BLUE}🔍 Running Full Diagnostic${NC}"
    echo "================================================="
    
    local total_checks=0
    local passed_checks=0
    
    # Run all checks
    checks=(
        "check_system_requirements"
        "validate_environment_variables"
        "check_project_dependencies"
        "validate_build_process"
        "check_git_status"
        "test_api_endpoints"
        "check_external_services"
    )
    
    for check in "${checks[@]}"; do
        total_checks=$((total_checks + 1))
        if $check; then
            passed_checks=$((passed_checks + 1))
        fi
    done
    
    # Summary
    local success_rate=$((passed_checks * 100 / total_checks))
    echo -e "\n${BLUE}📊 Diagnostic Summary${NC}"
    echo "================================================="
    echo -e "${BLUE}Total Checks:${NC} $total_checks"
    echo -e "${GREEN}Passed:${NC} $passed_checks"
    echo -e "${RED}Failed:${NC} $((total_checks - passed_checks))"
    echo -e "${BLUE}Success Rate:${NC} $success_rate%"
    
    if [ $success_rate -ge 80 ]; then
        echo -e "\n${GREEN}🎉 System is mostly healthy and ready for deployment!${NC}"
    elif [ $success_rate -ge 60 ]; then
        echo -e "\n${YELLOW}⚠️  Some issues found, but deployment may still succeed.${NC}"
    else
        echo -e "\n${RED}❌ Multiple issues found. Please resolve them before deploying.${NC}"
    fi
    
    generate_diagnostic_report
}

# Check if running in interactive mode
if [ -t 0 ]; then
    # Interactive mode
    show_troubleshooting_menu
else
    # Non-interactive mode, run full diagnostic
    run_full_diagnostic
fi