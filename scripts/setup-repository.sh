#!/bin/bash

# 🔧 Repository Configuration Automation Script
# This script sets up and configures the repository with all necessary files and settings

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

echo -e "${BLUE}🔧 Starting Repository Configuration${NC}"
echo "================================================="

# Function to create .gitignore if it doesn't exist or update it
setup_gitignore() {
    local gitignore_file="$PROJECT_ROOT/.gitignore"
    
    echo -e "${BLUE}📝 Setting up .gitignore...${NC}"
    
    if [ ! -f "$gitignore_file" ]; then
        cat > "$gitignore_file" << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Build outputs
dist/
build/
.next/
out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# ESLint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Vite
.vite/

# TypeScript
*.tsbuildinfo

# VS Code
.vscode/

# JetBrains IDEs
.idea/

# macOS
.DS_Store

# Windows
Thumbs.db
ehthumbs.db
Desktop.ini

# Linux
*~

# Temporary files
*.tmp
*.temp

# Test results
test-results/

# Playwright
playwright-report/
playwright/.cache/

# Deployment info
.vercel
.netlify

# Generated files
.deployment-verification-results.json
.health-check-results.json
.vercel-deployment-info.json

# Sentry
.sentryclirc

# Local development
.local

# Husky
.husky/_

# Cache directories
.cache/
.turbo/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
EOF
        echo -e "${GREEN}✅ .gitignore created${NC}"
    else
        echo -e "${GREEN}✅ .gitignore already exists${NC}"
    fi
}

# Function to create GitHub issue templates
setup_github_templates() {
    local github_dir="$PROJECT_ROOT/.github"
    local templates_dir="$github_dir/ISSUE_TEMPLATE"
    
    echo -e "${BLUE}🐛 Setting up GitHub issue templates...${NC}"
    
    mkdir -p "$templates_dir"
    
    # Bug report template
    cat > "$templates_dir/bug_report.md" << 'EOF'
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: 'bug'
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment (please complete the following information):**
- OS: [e.g. macOS, Windows, Linux]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]
- Device: [e.g. iPhone6, Desktop]

**Additional context**
Add any other context about the problem here.
EOF

    # Feature request template
    cat > "$templates_dir/feature_request.md" << 'EOF'
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: 'enhancement'
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
EOF

    echo -e "${GREEN}✅ GitHub issue templates created${NC}"
}

# Function to create pull request template
setup_pr_template() {
    local github_dir="$PROJECT_ROOT/.github"
    
    echo -e "${BLUE}🔄 Setting up pull request template...${NC}"
    
    mkdir -p "$github_dir"
    
    cat > "$github_dir/pull_request_template.md" << 'EOF'
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)  
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes, no api changes)
- [ ] Performance improvement
- [ ] Test updates

## Testing
- [ ] I have tested this code locally
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have checked that my code does not introduce new linting errors

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published

## Additional Notes
Add any additional notes about the changes here.
EOF

    echo -e "${GREEN}✅ Pull request template created${NC}"
}

# Function to create contributing guidelines
setup_contributing() {
    local contributing_file="$PROJECT_ROOT/CONTRIBUTING.md"
    
    echo -e "${BLUE}🤝 Setting up contributing guidelines...${NC}"
    
    if [ ! -f "$contributing_file" ]; then
        cat > "$contributing_file" << 'EOF'
# Contributing to Taxi Carpooling

Thank you for your interest in contributing to the Taxi Carpooling project! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and configure your environment variables
5. Start the development server: `npm run dev`

## Development Workflow

1. Create a new branch from `main` for your feature/fix
2. Make your changes
3. Write or update tests as needed
4. Run the test suite: `npm run test`
5. Run linting: `npm run lint`
6. Run type checking: `npm run type-check`
7. Commit your changes with a descriptive message
8. Push to your fork and submit a pull request

## Code Style

- We use ESLint and Prettier for code formatting
- Run `npm run format` to format your code
- Follow TypeScript best practices
- Write meaningful commit messages

## Testing

- Write tests for new features and bug fixes
- Ensure all tests pass before submitting a PR
- Aim for good test coverage
- Use descriptive test names

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure CI checks pass
4. Request review from maintainers
5. Address any feedback

## Reporting Issues

- Use the issue templates provided
- Include steps to reproduce for bugs
- Provide as much context as possible
- Search existing issues before creating new ones

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.
EOF
        echo -e "${GREEN}✅ Contributing guidelines created${NC}"
    else
        echo -e "${GREEN}✅ Contributing guidelines already exist${NC}"
    fi
}

# Function to set up pre-commit hooks with Husky
setup_husky() {
    echo -e "${BLUE}🪝 Setting up pre-commit hooks with Husky...${NC}"
    
    # Check if husky is already installed
    if [ ! -d "$PROJECT_ROOT/.husky" ]; then
        # Install husky
        echo -e "${BLUE}Installing Husky...${NC}"
        cd "$PROJECT_ROOT"
        npx husky install
        
        # Create pre-commit hook
        npx husky add .husky/pre-commit "npm run lint && npm run type-check"
        
        # Create commit-msg hook for conventional commits
        npx husky add .husky/commit-msg 'npx --no -- commitlint --edit $1'
        
        echo -e "${GREEN}✅ Husky pre-commit hooks set up${NC}"
    else
        echo -e "${GREEN}✅ Husky is already configured${NC}"
    fi
}

# Function to create commitlint configuration
setup_commitlint() {
    local commitlint_config="$PROJECT_ROOT/.commitlintrc.js"
    
    echo -e "${BLUE}📝 Setting up commit linting...${NC}"
    
    if [ ! -f "$commitlint_config" ]; then
        cat > "$commitlint_config" << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build',
        'revert'
      ]
    ],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72]
  }
};
EOF
        echo -e "${GREEN}✅ Commitlint configuration created${NC}"
    else
        echo -e "${GREEN}✅ Commitlint configuration already exists${NC}"
    fi
}

# Function to create security policy
setup_security_policy() {
    local security_file="$PROJECT_ROOT/SECURITY.md"
    
    echo -e "${BLUE}🔒 Setting up security policy...${NC}"
    
    if [ ! -f "$security_file" ]; then
        cat > "$security_file" << 'EOF'
# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

1. **Do not** create a public GitHub issue
2. Send an email to [security@your-domain.com] with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- We will acknowledge receipt within 24 hours
- We will provide an initial assessment within 72 hours
- We will keep you updated on our progress
- We will coordinate disclosure timing with you

## Security Best Practices

When contributing to this project:

- Never commit API keys, passwords, or other secrets
- Use environment variables for sensitive configuration
- Follow the principle of least privilege
- Keep dependencies up to date
- Report security issues privately

## Bug Bounty

We currently do not offer a bug bounty program, but we appreciate responsible disclosure and will acknowledge contributors in our security hall of fame.

Thank you for helping keep our project secure!
EOF
        echo -e "${GREEN}✅ Security policy created${NC}"
    else
        echo -e "${GREEN}✅ Security policy already exists${NC}"
    fi
}

# Function to create license file
setup_license() {
    local license_file="$PROJECT_ROOT/LICENSE"
    
    echo -e "${BLUE}📜 Setting up license...${NC}"
    
    if [ ! -f "$license_file" ]; then
        cat > "$license_file" << 'EOF'
MIT License

Copyright (c) 2024 Taxi Carpooling

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
        echo -e "${GREEN}✅ MIT License created${NC}"
    else
        echo -e "${GREEN}✅ License already exists${NC}"
    fi
}

# Function to create VS Code settings
setup_vscode_settings() {
    local vscode_dir="$PROJECT_ROOT/.vscode"
    
    echo -e "${BLUE}💻 Setting up VS Code configuration...${NC}"
    
    mkdir -p "$vscode_dir"
    
    # VS Code settings
    cat > "$vscode_dir/settings.json" << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true,
    "**/.DS_Store": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "typescript.preferences.quoteStyle": "single",
  "javascript.preferences.quoteStyle": "single"
}
EOF

    # VS Code extensions recommendations
    cat > "$vscode_dir/extensions.json" << 'EOF'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "ms-playwright.playwright"
  ]
}
EOF

    echo -e "${GREEN}✅ VS Code settings configured${NC}"
}

# Function to create docs directory structure
setup_docs_structure() {
    echo -e "${BLUE}📚 Setting up documentation structure...${NC}"
    
    local docs_dir="$PROJECT_ROOT/docs"
    mkdir -p "$docs_dir"/{api,deployment,development,architecture}
    
    # Create README files for each docs section
    echo "# API Documentation" > "$docs_dir/api/README.md"
    echo "# Deployment Documentation" > "$docs_dir/deployment/README.md"
    echo "# Development Documentation" > "$docs_dir/development/README.md"
    echo "# Architecture Documentation" > "$docs_dir/architecture/README.md"
    
    echo -e "${GREEN}✅ Documentation structure created${NC}"
}

# Function to initialize Git repository if not already initialized
setup_git_repository() {
    echo -e "${BLUE}📋 Setting up Git repository...${NC}"
    
    cd "$PROJECT_ROOT"
    
    if [ ! -d ".git" ]; then
        git init
        echo -e "${GREEN}✅ Git repository initialized${NC}"
    else
        echo -e "${GREEN}✅ Git repository already exists${NC}"
    fi
    
    # Create initial commit if there are no commits
    if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
        git add .
        git commit -m "feat: initial commit with project setup

🚀 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
        echo -e "${GREEN}✅ Initial commit created${NC}"
    else
        echo -e "${GREEN}✅ Git repository already has commits${NC}"
    fi
}

# Main execution
echo -e "${BLUE}Setting up repository configuration...${NC}"

# Run all setup functions
setup_gitignore
setup_github_templates
setup_pr_template
setup_contributing
setup_security_policy
setup_license
setup_vscode_settings
setup_docs_structure
setup_commitlint
setup_husky
setup_git_repository

# Final summary
echo -e "\n${GREEN}🎉 Repository Configuration Complete!${NC}"
echo "================================================="
echo -e "${BLUE}✅ Files Created/Updated:${NC}"
echo "• .gitignore"
echo "• .github/ISSUE_TEMPLATE/ (bug_report.md, feature_request.md)"
echo "• .github/pull_request_template.md"
echo "• CONTRIBUTING.md"
echo "• SECURITY.md"
echo "• LICENSE"
echo "• .vscode/ (settings.json, extensions.json)"
echo "• .commitlintrc.js"
echo "• .husky/ (pre-commit hooks)"
echo "• docs/ (directory structure)"

echo -e "\n${BLUE}🛠️ Repository Features Configured:${NC}"
echo "✅ Git repository initialization"
echo "✅ Comprehensive .gitignore"
echo "✅ GitHub issue and PR templates"
echo "✅ Contributing guidelines"
echo "✅ Security policy"
echo "✅ MIT License"
echo "✅ VS Code workspace settings"
echo "✅ Pre-commit hooks with Husky"
echo "✅ Conventional commit linting"
echo "✅ Documentation structure"

echo -e "\n${YELLOW}💡 Next Steps:${NC}"
echo "1. Review and customize the generated files as needed"
echo "2. Update contact information in SECURITY.md"
echo "3. Customize the license year and holder if needed"
echo "4. Add project-specific documentation"
echo "5. Configure branch protection rules in GitHub"
echo "6. Set up continuous integration workflows"

echo -e "\n${GREEN}Repository is now properly configured! 🎉${NC}"