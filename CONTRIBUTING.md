# Contributing to Taxi Carpooling

Thank you for your interest in contributing to Taxi Carpooling! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git knowledge
- Familiarity with React, TypeScript, and modern web development

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/taxi-carpooling.git
   cd taxi-carpooling
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Fill in your development configuration
   ```
5. **Start the development server**:
   ```bash
   npm run dev
   ```

## 📋 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - Feature development branches
- `hotfix/fix-name` - Critical production fixes

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** following our coding standards

3. **Write or update tests** for your changes

4. **Run the test suite**:
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

5. **Commit your changes** using conventional commits:
   ```bash
   git commit -m "feat: add amazing new feature"
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Create a Pull Request** on GitHub

## 🎯 Coding Standards

### TypeScript

- Use strict TypeScript mode
- Define interfaces for all data structures
- Prefer `interface` over `type` for object shapes
- Use proper generic types where applicable

### React

- Use functional components with hooks
- Prefer composition over inheritance
- Use proper prop types and default values
- Follow React best practices for performance

### Code Style

- Use ESLint and Prettier (configured in the project)
- Use semantic and descriptive variable names
- Write self-documenting code with clear intentions
- Follow the existing code patterns and structure

### File Organization

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── forms/        # Form components
│   ├── feature/      # Feature-specific components
│   └── layout/       # Layout components
├── hooks/            # Custom React hooks
├── services/         # API services and external integrations
├── store/            # State management
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
└── __tests__/        # Test files
```

## 🧪 Testing Guidelines

### Test Types

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test component interactions
3. **E2E Tests** - Test complete user workflows

### Writing Tests

- Write tests for all new features
- Update tests when modifying existing code
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies appropriately

### Test Commands

```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run test:ui         # Run tests with UI
```

## 📝 Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Examples

```bash
feat: add trip request system with custom messages
fix: resolve infinite loop in matching algorithm
docs: update API documentation for reviews endpoint
refactor: extract reusable form validation hooks
```

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] Tests are written and passing
- [ ] Documentation is updated (if applicable)
- [ ] No console errors or warnings
- [ ] Build passes successfully

### PR Description Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots or GIFs to demonstrate the changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automated Checks** - CI pipeline runs automatically
2. **Code Review** - At least one maintainer reviews the PR
3. **Testing** - Changes are tested on a preview deployment
4. **Approval** - PR is approved and merged

## 🏗️ Project Architecture

### State Management

We use Zustand for state management:

```typescript
// Example store structure
interface FeatureStore {
  data: FeatureData[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  updateItem: (id: string, data: Partial<FeatureData>) => void;
  reset: () => void;
}
```

### API Services

API services are organized by feature:

```typescript
// Example service structure
class FeatureService {
  async getAll(): Promise<FeatureData[]> {
    // Implementation
  }
  
  async create(data: CreateFeatureData): Promise<FeatureData> {
    // Implementation
  }
  
  async update(id: string, data: UpdateFeatureData): Promise<FeatureData> {
    // Implementation
  }
}
```

### Component Structure

```typescript
interface ComponentProps {
  // Props definition
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
}
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the bug
3. **Expected behavior** vs actual behavior
4. **Browser and OS information**
5. **Screenshots or error messages** (if applicable)
6. **Code samples** (if relevant)

## 💡 Feature Requests

When suggesting features:

1. **Describe the problem** you're trying to solve
2. **Explain your proposed solution**
3. **Consider alternative solutions**
4. **Provide use cases** and examples
5. **Consider implementation complexity**

## 📚 Resources

### Documentation

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Project-Specific Docs

- [CLAUDE.md](CLAUDE.md) - Complete project context
- [Database Schema](database/schema.sql) - Database structure
- [API Documentation](docs/api.md) - API reference

## 🤝 Community

- **Be respectful** and inclusive
- **Help others** when you can
- **Ask questions** if you're unsure
- **Share knowledge** and experiences
- **Follow the Code of Conduct**

## 📞 Getting Help

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and community discussions
- **Documentation** - Check existing docs first

## 🎉 Recognition

Contributors are recognized in:

- **README.md** - Contributor section
- **Release Notes** - Feature and fix acknowledgments
- **GitHub** - Contributor graphs and statistics

Thank you for contributing to Taxi Carpooling! 🚕✨