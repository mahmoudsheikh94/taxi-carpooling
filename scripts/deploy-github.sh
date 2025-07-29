#!/bin/bash

# 🚀 GitHub Deployment Automation Script
# This script automates the complete GitHub repository setup and deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="taxi-carpooling"
REPO_DESCRIPTION="Modern taxi carpooling web application built with React, TypeScript, and Supabase"
DEFAULT_BRANCH="main"

echo -e "${BLUE}🚀 Starting GitHub Deployment Automation${NC}"
echo "================================================="

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Please install it first:"
    echo "  macOS: brew install gh"
    echo "  Ubuntu: sudo apt install gh"
    echo "  Windows: winget install --id GitHub.cli"
    exit 1
fi

# Check if user is authenticated with GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}🔐 Please authenticate with GitHub first${NC}"
    echo "Running: gh auth login"
    gh auth login
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"

# Get GitHub username
GITHUB_USER=$(gh api user --jq '.login')
echo -e "${BLUE}📝 GitHub User: $GITHUB_USER${NC}"

# Check if repository already exists
if gh repo view "$GITHUB_USER/$REPO_NAME" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Repository $GITHUB_USER/$REPO_NAME already exists${NC}"
    read -p "Do you want to continue with existing repository? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
    REPO_EXISTS=true
else
    REPO_EXISTS=false
fi

# Create repository if it doesn't exist
if [ "$REPO_EXISTS" = false ]; then
    echo -e "${BLUE}📦 Creating GitHub repository...${NC}"
    gh repo create "$REPO_NAME" \
        --public \
        --description "$REPO_DESCRIPTION" \
        --homepage "https://$REPO_NAME.vercel.app" \
        --add-readme=false
    
    echo -e "${GREEN}✅ Repository created: https://github.com/$GITHUB_USER/$REPO_NAME${NC}"
fi

# Add remote if not exists
if ! git remote get-url origin &> /dev/null; then
    echo -e "${BLUE}🔗 Adding remote origin...${NC}"
    git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
else
    echo -e "${BLUE}🔗 Updating remote origin...${NC}"
    git remote set-url origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
fi

# Push to GitHub
echo -e "${BLUE}📤 Pushing code to GitHub...${NC}"
git push -u origin main

echo -e "${GREEN}✅ Code pushed to GitHub${NC}"

# Configure repository settings
echo -e "${BLUE}⚙️  Configuring repository settings...${NC}"

# Enable issues and wiki
gh repo edit "$GITHUB_USER/$REPO_NAME" \
    --enable-issues \
    --enable-wiki \
    --enable-projects

# Set up branch protection rules
echo -e "${BLUE}🛡️  Setting up branch protection...${NC}"
gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/$GITHUB_USER/$REPO_NAME/branches/main/protection" \
    --field required_status_checks='{"strict":true,"contexts":["CI Pipeline / test (ubuntu-latest, 18.x)","CI Pipeline / test (ubuntu-latest, 20.x)"]}' \
    --field enforce_admins=true \
    --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
    --field restrictions=null \
    --field allow_force_pushes=false \
    --field allow_deletions=false

echo -e "${GREEN}✅ Branch protection rules configured${NC}"

# Create repository secrets
echo -e "${BLUE}🔐 Setting up repository secrets...${NC}"
echo "You'll need to provide the following environment variables:"

# Function to add secret
add_secret() {
    local secret_name=$1
    local secret_description=$2
    local is_required=${3:-true}
    
    if [ "$is_required" = true ]; then
        echo -e "${YELLOW}Required: $secret_name${NC} - $secret_description"
    else
        echo -e "${BLUE}Optional: $secret_name${NC} - $secret_description"
    fi
    
    read -p "Enter value for $secret_name (or press Enter to skip): " -s secret_value
    echo
    
    if [ -n "$secret_value" ]; then
        gh secret set "$secret_name" --body "$secret_value" --repo "$GITHUB_USER/$REPO_NAME"
        echo -e "${GREEN}✅ Secret $secret_name added${NC}"
    else
        if [ "$is_required" = true ]; then
            echo -e "${YELLOW}⚠️  Skipped required secret $secret_name${NC}"
        else
            echo -e "${BLUE}ℹ️  Skipped optional secret $secret_name${NC}"
        fi
    fi
}

# Required secrets
echo -e "\n${BLUE}=== Required Secrets ===${NC}"
add_secret "VITE_SUPABASE_URL" "Your Supabase project URL"
add_secret "VITE_SUPABASE_ANON_KEY" "Your Supabase anonymous key"
add_secret "VITE_GOOGLE_MAPS_API_KEY" "Your Google Maps API key"
add_secret "VITE_APP_URL" "Your production app URL (e.g., https://taxi-carpooling.vercel.app)"

# Vercel secrets (if using GitHub Actions deployment)
echo -e "\n${BLUE}=== Vercel Integration Secrets (for GitHub Actions) ===${NC}"
add_secret "VERCEL_TOKEN" "Your Vercel token" false
add_secret "VERCEL_ORG_ID" "Your Vercel organization ID" false
add_secret "VERCEL_PROJECT_ID" "Your Vercel project ID" false

# Optional secrets
echo -e "\n${BLUE}=== Optional Secrets ===${NC}"
add_secret "VITE_SENTRY_DSN" "Your Sentry DSN for error tracking" false
add_secret "VITE_GA_MEASUREMENT_ID" "Your Google Analytics measurement ID" false
add_secret "SENTRY_ORG" "Your Sentry organization" false
add_secret "SENTRY_PROJECT" "Your Sentry project name" false
add_secret "SENTRY_AUTH_TOKEN" "Your Sentry auth token" false
add_secret "CODECOV_TOKEN" "Your Codecov token" false

# Enable GitHub Actions
echo -e "${BLUE}🔄 Enabling GitHub Actions...${NC}"
gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/$GITHUB_USER/$REPO_NAME/actions/permissions" \
    --field enabled=true \
    --field allowed_actions="all"

# Create environment for production
echo -e "${BLUE}🌍 Creating production environment...${NC}"
gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/$GITHUB_USER/$REPO_NAME/environments/production" \
    --field wait_timer=0 \
    --field reviewers='[]' \
    --field deployment_branch_policy='{"protected_branches":true,"custom_branch_policies":false}'

echo -e "${GREEN}✅ Production environment created${NC}"

# Enable Dependabot
echo -e "${BLUE}🤖 Enabling Dependabot...${NC}"
cat > .github/dependabot.yml << EOF
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    commit-message:
      prefix: "chore(deps):"
    reviewers:
      - "$GITHUB_USER"
    assignees:
      - "$GITHUB_USER"
EOF

git add .github/dependabot.yml
git commit -m "chore: add Dependabot configuration for automated dependency updates"
git push origin main

echo -e "${GREEN}✅ Dependabot configuration added${NC}"

# Add repository topics
echo -e "${BLUE}🏷️  Adding repository topics...${NC}"
gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/$GITHUB_USER/$REPO_NAME/topics" \
    --field names='["react","typescript","supabase","vite","tailwindcss","pwa","carpooling","taxi","ride-sharing","vercel"]'

echo -e "${GREEN}✅ Repository topics added${NC}"

# Generate deployment summary
echo -e "\n${GREEN}🎉 GitHub Deployment Complete!${NC}"
echo "================================================="
echo -e "${BLUE}Repository URL:${NC} https://github.com/$GITHUB_USER/$REPO_NAME"
echo -e "${BLUE}Actions URL:${NC} https://github.com/$GITHUB_USER/$REPO_NAME/actions"
echo -e "${BLUE}Settings URL:${NC} https://github.com/$GITHUB_USER/$REPO_NAME/settings"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. 🔧 Review and configure any missing secrets in the repository settings"
echo "2. 🚀 Deploy to Vercel using the deploy-vercel.sh script"
echo "3. 🧪 Wait for GitHub Actions to run and verify all checks pass"
echo "4. 🌍 Set up custom domain if desired"
echo "5. 📊 Configure monitoring and analytics"

echo -e "\n${BLUE}Repository Features Enabled:${NC}"
echo "✅ Branch protection with required status checks"
echo "✅ Required pull request reviews"
echo "✅ GitHub Actions workflows"
echo "✅ Dependabot for security updates"
echo "✅ Issues and project management"
echo "✅ Production environment"
echo "✅ Repository secrets configured"
echo "✅ Repository topics and metadata"

echo -e "\n${GREEN}GitHub deployment completed successfully! 🎉${NC}"