# 🔐 Environment Variables Setup Guide

This guide walks you through setting up environment variables for the Taxi Carpooling application across different environments.

## 📋 Quick Setup Checklist

### Development Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Set up Supabase project and get credentials
- [ ] Create Google Maps API key
- [ ] Configure optional services (Sentry, Analytics)
- [ ] Test local development

### Production Setup
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Configure production Supabase project
- [ ] Set up production Google Maps API key with restrictions
- [ ] Configure Sentry for error tracking
- [ ] Set up Google Analytics
- [ ] Deploy environment variables to hosting platform

## 🚀 Required Environment Variables

### Supabase Configuration
```bash
# Get these from: https://app.supabase.com/project/_/settings/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Setup Steps:**
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Navigate to Settings → API
3. Copy the Project URL and anon public key
4. Run the database schema from `/database/schema.sql`

### Google Maps API Configuration
```bash
# Get your key from: https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API
4. Create credentials → API Key
5. Configure API key restrictions:
   - **Development**: HTTP referrers (web sites) → `http://localhost:*/*`
   - **Production**: HTTP referrers (web sites) → `https://your-domain.com/*`

### Application Configuration
```bash
VITE_APP_URL=http://localhost:5173  # Development
# VITE_APP_URL=https://your-domain.com  # Production
VITE_APP_NAME="Taxi Carpooling"
```

## 📊 Optional Environment Variables

### Error Tracking with Sentry
```bash
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

**Setup Steps:**
1. Create account at [sentry.io](https://sentry.io)
2. Create new project → React
3. Copy the DSN from project settings
4. Generate auth token in User Settings → Auth Tokens

### Google Analytics
```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Setup Steps:**
1. Create account at [analytics.google.com](https://analytics.google.com)
2. Create new property
3. Set up web data stream
4. Copy the Measurement ID

## 🌍 Environment-Specific Configuration

### Development (.env)
```bash
NODE_ENV=development
VITE_ENABLE_DEBUG_TOOLS=true
VITE_ENABLE_MOCK_DATA=false
VITE_API_TIMEOUT=10000
```

### Production (.env.production)
```bash
NODE_ENV=production
VITE_ENABLE_DEBUG_TOOLS=false
VITE_ENABLE_MOCK_DATA=false
VITE_API_TIMEOUT=5000
VITE_ENABLE_SENTRY=true
VITE_ENABLE_ANALYTICS=true
```

## 🔒 Security Best Practices

### API Key Restrictions

#### Google Maps API Key
- **Development**: Restrict to `http://localhost:*/*`
- **Production**: Restrict to your production domain
- Never use the same key for development and production

#### Supabase Configuration
- Enable Row Level Security (RLS) on all tables
- Use separate projects for development and production
- Never expose service role keys in client-side code

### Environment Variable Management
- Never commit `.env` files to version control
- Use different API keys for different environments
- Rotate keys regularly
- Monitor API usage and set quotas

## 🚀 Deployment Platform Setup

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
vercel link

# Add environment variables (run for each variable)
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_GOOGLE_MAPS_API_KEY production
```

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and link project
netlify login
netlify link

# Set environment variables
netlify env:set VITE_SUPABASE_URL "your-value"
netlify env:set VITE_SUPABASE_ANON_KEY "your-value"
netlify env:set VITE_GOOGLE_MAPS_API_KEY "your-value"
```

### GitHub Actions (for CI/CD)
Add secrets in GitHub repository settings:
- Go to Settings → Secrets and variables → Actions
- Add repository secrets for all environment variables
- Use in workflows with `${{ secrets.VARIABLE_NAME }}`

## 🧪 Testing Configuration

### Test Environment Variables
```bash
# Create .env.test file
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=your-test-anon-key
VITE_ENABLE_MOCK_DATA=true
```

### Running Tests with Environment Variables
```bash
# Load test environment
npm run test

# Run with specific environment
NODE_ENV=test npm run test
```

## 🔍 Validation and Troubleshooting

### Environment Variable Validation
The app includes built-in validation using Zod schemas. Invalid environment variables will cause startup errors with helpful messages.

### Common Issues

#### Supabase Connection Issues
- Verify project URL and anon key
- Check RLS policies allow the operation
- Ensure network connectivity

#### Google Maps API Issues
- Verify API key has required services enabled
- Check API key restrictions match your domain
- Monitor quota usage in Google Cloud Console

#### Build/Runtime Issues
- Check all required variables are set
- Verify no typos in variable names
- Ensure values don't contain special characters that need escaping

### Environment Variable Testing Script
```bash
# Run environment validation
npm run build:vercel  # Will validate all variables during build
```

## 📝 Environment Variables Reference

### Complete Variable List

| Variable | Required | Environment | Description |
|----------|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | ✅ | All | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | All | Supabase anonymous key |
| `VITE_GOOGLE_MAPS_API_KEY` | ✅ | All | Google Maps API key |
| `VITE_APP_URL` | ✅ | All | Application URL |
| `VITE_SENTRY_DSN` | ❌ | Production | Sentry error tracking DSN |
| `VITE_GA_MEASUREMENT_ID` | ❌ | Production | Google Analytics measurement ID |
| `VITE_ENABLE_SENTRY` | ❌ | All | Enable/disable Sentry |
| `VITE_ENABLE_ANALYTICS` | ❌ | All | Enable/disable analytics |
| `VITE_ENABLE_PWA` | ❌ | All | Enable/disable PWA features |
| `NODE_ENV` | ✅ | All | Environment mode |

### Future Environment Variables

These variables are planned for future features:

| Variable | Description |
|----------|-------------|
| `VITE_STRIPE_PUBLIC_KEY` | Stripe payment integration |
| `TWILIO_ACCOUNT_SID` | SMS/phone verification |
| `AI_SERVICE_API_KEY` | AI-powered matching |
| `SEARCH_API_KEY` | External search service |

## 🎯 Next Steps

1. **Set up development environment**: Copy `.env.example` and configure required variables
2. **Test locally**: Run `npm run dev` and verify all features work
3. **Configure production**: Set up production services and environment variables
4. **Deploy**: Use automated deployment scripts in `/scripts/` directory
5. **Monitor**: Set up error tracking and analytics
6. **Scale**: Add optional services as your application grows

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)