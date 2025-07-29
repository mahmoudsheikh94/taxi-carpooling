# 🚀 Deployment Automation Scripts

This directory contains comprehensive automation scripts for deploying and managing the Taxi Carpooling application.

## Scripts Overview

### 🔧 Core Deployment Scripts

#### `deploy-github.sh`
Automates the complete GitHub repository setup and deployment process.

**Features:**
- GitHub repository creation and configuration
- Branch protection rules setup
- Repository secrets management
- GitHub Actions enablement
- Dependabot configuration
- Repository metadata setup

**Usage:**
```bash
./scripts/deploy-github.sh
```

**Prerequisites:**
- GitHub CLI (`gh`) installed and authenticated
- Git repository initialized

---

#### `deploy-vercel.sh`
Automates the complete Vercel project setup and deployment process.

**Features:**
- Vercel project creation and linking
- Environment variables configuration
- Preview and production deployments
- Custom domain setup (optional)
- Health checks and validation
- Deployment information tracking

**Usage:**
```bash
./scripts/deploy-vercel.sh
```

**Prerequisites:**
- Vercel CLI installed and authenticated
- Project built successfully

---

### 🔍 Verification and Health Scripts

#### `verify-deployment.sh`
Performs comprehensive deployment verification and testing.

**Features:**
- Health endpoint testing
- SSL certificate validation
- Security headers verification
- Performance testing
- PWA manifest and service worker checks
- Detailed verification reporting

**Usage:**
```bash
./scripts/verify-deployment.sh
```

**What it checks:**
- ✅ Application responsiveness
- ✅ API endpoint health
- ✅ SSL certificates and security
- ✅ PWA functionality
- ✅ Performance metrics
- ✅ Error handling

---

#### `health-check.sh`
Quick health check for deployed applications.

**Features:**
- Fast health status checks
- API endpoint testing
- Critical asset verification
- JSON output support
- Verbose logging option

**Usage:**
```bash
# Basic health check
./scripts/health-check.sh

# With specific URLs
./scripts/health-check.sh -p https://your-domain.com -v

# JSON output for monitoring
./scripts/health-check.sh --json > health-report.json
```

**Options:**
- `-p, --production URL`: Production URL to check
- `-s, --preview URL`: Preview/staging URL to check
- `-v, --verbose`: Enable verbose output
- `-j, --json`: Output results in JSON format

---

### 🛠️ Setup and Configuration Scripts

#### `setup-repository.sh`
Configures the repository with all necessary files and settings.

**Features:**
- .gitignore setup
- GitHub templates (issues, PRs)
- Contributing guidelines
- Security policy
- License file
- VS Code settings
- Pre-commit hooks (Husky)
- Conventional commit linting
- Documentation structure

**Usage:**
```bash
./scripts/setup-repository.sh
```

**Files created:**
- `.gitignore`
- `.github/ISSUE_TEMPLATE/`
- `.github/pull_request_template.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `LICENSE`
- `.vscode/settings.json` and `.vscode/extensions.json`
- `.commitlintrc.js`
- `.husky/` (pre-commit hooks)

---

### 🔧 Troubleshooting and Diagnostics

#### `troubleshoot-deployment.sh`
Interactive troubleshooting tool for deployment issues.

**Features:**
- System requirements validation
- Environment variables checking
- Dependency verification
- Build process testing
- Git status validation
- API endpoint testing
- External service connectivity
- Diagnostic report generation

**Usage:**
```bash
# Interactive mode
./scripts/troubleshoot-deployment.sh

# Non-interactive (full diagnostic)
./scripts/troubleshoot-deployment.sh < /dev/null
```

**Diagnostic categories:**
1. System requirements
2. Environment variables
3. Project dependencies
4. Build process
5. Git repository status
6. API endpoints
7. External services
8. Common solutions

---

### 🏗️ Build and Utility Scripts

#### `build.js`
Custom build script with intelligent version detection.

**Features:**
- Multi-environment version detection
- Vercel, GitHub, and local git support
- Fallback version generation
- Build time tracking

**Usage:**
```bash
node scripts/build.js
# or
npm run build:vercel
```

---

## 📋 Environment Configuration

### Environment Variable Templates

#### `.env.example`
Comprehensive template with all possible environment variables organized by category:
- Application configuration
- Supabase settings
- Google Maps API
- Monitoring and analytics
- Security configuration
- Feature flags
- Development tools
- Future features

#### `.env.production.example`
Production-specific environment variables template with:
- Optimized production settings
- Required monitoring tools
- Security-focused configuration
- Performance optimizations

### Environment Setup Guide

See `docs/deployment/environment-setup.md` for detailed environment variable setup instructions.

---

## 🚀 Quick Start Deployment

### 1. Repository Setup
```bash
# Set up repository configuration
./scripts/setup-repository.sh

# Configure environment variables
cp .env.example .env
# Edit .env with your actual values
```

### 2. GitHub Deployment
```bash
# Deploy to GitHub with full automation
./scripts/deploy-github.sh
```

### 3. Vercel Deployment
```bash
# Deploy to Vercel with full automation
./scripts/deploy-vercel.sh
```

### 4. Verification
```bash
# Verify deployment health
./scripts/verify-deployment.sh

# Quick health check
./scripts/health-check.sh -p https://your-domain.com -v
```

---

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Run full diagnostic
./scripts/troubleshoot-deployment.sh

# Check specific issue
npm run type-check
npm run lint
npm run build
```

#### Environment Issues
```bash
# Validate environment variables
grep "^VITE_" .env

# Test environment loading
npm run build:vercel
```

#### Deployment Issues
```bash
# Check Git status
git status
git log --oneline -5

# Verify remote configuration
git remote -v
```

### Interactive Troubleshooting
Run the troubleshooting script for guided issue resolution:
```bash
./scripts/troubleshoot-deployment.sh
```

---

## 📊 Monitoring and Maintenance

### Health Monitoring
Set up automated health checks:
```bash
# Add to crontab for regular monitoring
*/5 * * * * /path/to/scripts/health-check.sh --json >> health-log.json
```

### Deployment Verification
After each deployment:
```bash
./scripts/verify-deployment.sh
```

### Continuous Integration
The scripts integrate with GitHub Actions for automated deployments. See `.github/workflows/` for CI/CD configurations.

---

## 🛡️ Security Considerations

### Environment Variables
- Never commit `.env` files
- Use different keys for different environments
- Rotate API keys regularly
- Monitor API usage and set quotas

### Repository Security
- Enable branch protection rules
- Require pull request reviews
- Enable Dependabot security updates
- Configure security scanning

### Deployment Security
- Use HTTPS for all environments
- Configure security headers
- Enable CSP policies
- Regular security audits

---

## 📚 Additional Resources

### Documentation
- [Deployment Environment Setup](../docs/deployment/environment-setup.md)
- [GitHub Actions Workflows](../.github/workflows/)
- [Vercel Configuration](../vercel.json)

### External Tools
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Maps API Documentation](https://developers.google.com/maps/documentation)

---

## 🤝 Contributing

When adding new scripts:
1. Follow existing naming conventions
2. Include comprehensive error handling
3. Add usage documentation
4. Test across different environments
5. Update this README

For questions or issues with deployment scripts, please open an issue or refer to the troubleshooting guide.

---

**Made with ❤️ for streamlined deployments**