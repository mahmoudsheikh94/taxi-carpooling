# 🚀 Deployment Guide

This guide covers deploying the Taxi Carpooling application to production using Vercel, along with setting up all required services and monitoring.

## 📋 Prerequisites

Before deploying, ensure you have:

- [x] **GitHub Account** with repository access
- [x] **Vercel Account** connected to GitHub
- [x] **Supabase Production Project** set up
- [x] **Google Cloud Console Account** with Maps API enabled
- [x] **Sentry Account** for error tracking (optional)
- [x] **Domain Name** (optional, for custom domain)

## 🏗️ Production Services Setup

### 1. Supabase Production Configuration

#### Create Production Project
```bash
# Create new Supabase project for production
# Go to https://supabase.com/dashboard
# Click "New Project"
# Choose organization and set project details
```

#### Database Setup
```sql
-- Copy and run the schema from database/schema.sql
-- In your Supabase SQL Editor, paste and execute:
\copy database/schema.sql

-- Verify all tables are created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

#### Row Level Security Policies
```sql
-- Ensure all RLS policies are enabled
-- Check with:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All tables should have rowsecurity = true
```

#### Production Settings
- **Database Password**: Use strong, unique password
- **JWT Secret**: Auto-generated, keep secure
- **API Keys**: Note down the `anon` and `service_role` keys
- **Domain**: Add your production domain to allowed origins

### 2. Google Maps API Configuration

#### Create Production API Key
```bash
# Go to Google Cloud Console
# Navigate to APIs & Services > Credentials
# Create new API key for production
```

#### API Key Restrictions
```bash
# Application restrictions:
- HTTP referrers (web sites)
- Add your production domain: https://your-domain.com/*
- Add Vercel preview domains: https://*.vercel.app/*

# API restrictions:
- Maps JavaScript API
- Places API  
- Directions API
- Geocoding API
- Distance Matrix API
```

#### Enable Required APIs
```bash
# In Google Cloud Console, enable:
- Maps JavaScript API
- Places API
- Directions API
- Geocoding API
- Distance Matrix API
```

### 3. Sentry Setup (Optional)

#### Create Production Project
```bash
# Go to https://sentry.io
# Create new project
# Choose "React" as platform
# Note down the DSN
```

#### Configure Source Maps
```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Create .sentryclirc file (add to .gitignore)
echo "
[defaults]
url=https://sentry.io/
org=your-org-slug
project=your-project-slug

[auth]
token=your-auth-token
" > .sentryclirc
```

## 🔧 Environment Variables Configuration

### Production Environment Variables

Create these in your Vercel dashboard:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC-your-production-api-key

# Application Configuration
VITE_APP_URL=https://your-production-domain.com
VITE_APP_NAME=Taxi Carpooling

# Error Tracking (Optional)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Analytics (Optional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_PLAUSIBLE_DOMAIN=your-domain.com

# Build Information (Auto-set by GitHub Actions)
VITE_BUILD_VERSION=1.0.0
VITE_BUILD_TIME=2024-01-01T00:00:00Z

# Environment
NODE_ENV=production

# Sentry Configuration (for source maps)
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Vercel Integration
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

### Environment Variable Validation

The app includes built-in environment validation. Missing required variables will:
- Show clear error messages in development
- Prevent builds in production
- Display user-friendly error pages

## 🚀 Vercel Deployment

### Method 1: GitHub Integration (Recommended)

1. **Connect Repository to Vercel**
   ```bash
   # Go to https://vercel.com/dashboard
   # Click "New Project"
   # Import your GitHub repository
   # Configure project settings
   ```

2. **Project Configuration**
   ```json
   {
     "framework": "vite",
     "buildCommand": "npm run build && npm run type-check",
     "outputDirectory": "dist",
     "installCommand": "npm install",
     "nodeVersion": "18.x"
   }
   ```

3. **Environment Variables**
   - Add all production environment variables in Vercel dashboard
   - Go to Project Settings > Environment Variables
   - Add each variable with appropriate scope (Production, Preview, Development)

4. **Deploy**
   ```bash
   # Push to main branch triggers automatic deployment
   git push origin main
   ```

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login and Link Project**
   ```bash
   vercel login
   vercel --confirm
   ```

3. **Set Environment Variables**
   ```bash
   # Set each environment variable
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   # ... repeat for all variables
   ```

4. **Deploy**
   ```bash
   # Deploy to production
   vercel --prod
   ```

## 🌐 Custom Domain Setup (Optional)

### Add Custom Domain

1. **In Vercel Dashboard**
   ```bash
   # Go to Project Settings > Domains
   # Add your custom domain
   # Follow DNS configuration instructions
   ```

2. **DNS Configuration**
   ```bash
   # Add CNAME record:
   # Type: CNAME
   # Name: www (or @ for apex domain)
   # Value: your-project.vercel.app
   ```

3. **SSL Certificate**
   ```bash
   # Vercel automatically provisions SSL certificates
   # Wait for DNS propagation (can take up to 48 hours)
   # Certificate will be issued automatically
   ```

### Domain Redirect Setup

```json
// In vercel.json
{
  "redirects": [
    {
      "source": "https://www.your-domain.com/(.*)",
      "destination": "https://your-domain.com/$1",
      "permanent": true
    }
  ]
}
```

## 🔍 GitHub Actions Setup

### Repository Secrets

Add these secrets in GitHub repository settings:

```bash
# Vercel Integration
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id  
VERCEL_PROJECT_ID=your-vercel-project-id

# Application Environment Variables
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-production-maps-key
VITE_APP_URL=https://your-production-domain.com

# Sentry (Optional)
VITE_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Analytics (Optional)
VITE_GA_MEASUREMENT_ID=your-ga-measurement-id

# Testing (Optional)
CODECOV_TOKEN=your-codecov-token
LHCI_GITHUB_APP_TOKEN=your-lighthouse-ci-token
```

### Branch Protection Rules

```bash
# In GitHub repository settings > Branches
# Add rule for main branch:
- Require pull request reviews before merging
- Require status checks to pass before merging
  - CI Pipeline / test (ubuntu-latest, 18.x)
  - CI Pipeline / test (ubuntu-latest, 20.x)
  - Security Audit / dependency-check
  - CodeQL / Analyze
- Require branches to be up to date before merging
- Restrict pushes that create files larger than 100 MB
```

## 📊 Monitoring & Analytics

### Vercel Analytics

```bash
# Enable in Vercel Dashboard
# Go to Project Settings > Analytics
# Enable Web Analytics and Speed Insights
```

### Sentry Monitoring

```bash
# Configure alerts in Sentry dashboard
# Set up error rate thresholds
# Configure performance monitoring
# Set up release tracking
```

### Uptime Monitoring

Consider setting up uptime monitoring with:
- **UptimeRobot** (free tier available)
- **Pingdom** (comprehensive monitoring)
- **StatusPage** (status page for users)

## 🚦 Health Checks & Testing

### Production Health Check

```typescript
// Create src/pages/health.tsx
export function HealthCheck() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VITE_BUILD_VERSION,
    services: {
      database: 'connected',
      maps: 'available',
      sentry: 'active'
    }
  });
}
```

### Automated Testing

```bash
# Tests run automatically on each deployment
# Lighthouse CI runs performance audits
# Security scanning checks for vulnerabilities
```

## 🔒 Security Checklist

- [ ] **Environment Variables**: All sensitive data in environment variables
- [ ] **API Keys**: Production keys with proper restrictions
- [ ] **HTTPS**: SSL certificate configured and working
- [ ] **Security Headers**: CSP, HSTS, X-Frame-Options configured
- [ ] **Database**: RLS policies enabled and tested
- [ ] **Domain**: Custom domain configured (if applicable)
- [ ] **Monitoring**: Error tracking and uptime monitoring active

## 📈 Performance Optimization

### Pre-Launch Checklist

- [ ] **Lighthouse Score**: 90+ on all metrics
- [ ] **Core Web Vitals**: Pass all thresholds
- [ ] **Bundle Size**: Main bundle < 500KB gzipped
- [ ] **Images**: Optimized and properly formatted
- [ ] **Caching**: Proper cache headers configured
- [ ] **CDN**: Static assets served from CDN

### Performance Monitoring

```bash
# Vercel Speed Insights automatically tracks:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)  
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
```

## 🔄 Deployment Workflow

### Automatic Deployment (Recommended)

```bash
# 1. Push to main branch
git push origin main

# 2. GitHub Actions runs:
- Code quality checks
- Security scanning  
- Build verification
- Test suite execution

# 3. If all checks pass:
- Automatic deployment to Vercel
- Lighthouse CI performance audit
- Health check verification

# 4. Post-deployment:
- Sentry release tracking
- Performance monitoring
- Error tracking active
```

### Manual Deployment

```bash
# For emergency fixes or special deployments
vercel --prod --confirm
```

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in Vercel dashboard
# Verify all environment variables are set
# Check for TypeScript errors
npm run type-check
```

#### Environment Variable Issues
```bash
# Verify variables in Vercel dashboard
# Check variable names (case-sensitive)
# Ensure required variables are set for production
```

#### Database Connection Issues
```bash
# Verify Supabase URL and keys
# Check RLS policies
# Test connection in development
```

#### Domain Issues
```bash
# Check DNS propagation: https://dnschecker.org
# Verify CNAME records are correct
# Wait up to 48 hours for full propagation
```

### Getting Help

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support  
- **GitHub Issues**: For application-specific problems
- **Documentation**: Check all relevant service docs

## 📚 Additional Resources

- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-to-production)
- [Google Maps API Best Practices](https://developers.google.com/maps/premium/optimization)
- [Sentry Performance Monitoring](https://docs.sentry.io/performance-monitoring/)

---

**Success!** 🎉 Your Taxi Carpooling application is now live in production!

**Next Steps:**
1. Monitor error rates and performance metrics
2. Set up regular backups and maintenance
3. Plan feature updates and improvements
4. Collect user feedback and iterate

For questions or issues, please refer to the troubleshooting section or create a GitHub issue.