# CLAUDE.md - Taxi Carpooling App Context

## 🎯 Project Overview

This is a modern taxi carpooling web application built with React, TypeScript, and Supabase. The app enables users to share taxi rides, find compatible trips, and communicate with other travelers - similar to BlaBlaCar but focused on taxi sharing.

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 5+ for fast development and optimized builds
- **Styling**: Tailwind CSS with Headless UI components
- **State Management**: Zustand for global state
- **Forms**: React Hook Form with Zod validation
- **Maps**: Google Maps JavaScript API with Places API
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios for API calls
- **Real-time**: Supabase Realtime for chat and notifications

### Backend Services
- **Database**: Supabase PostgreSQL with RLS (Row Level Security)
- **Authentication**: Supabase Auth with social providers (Google, Apple)
- **Real-time**: Supabase Realtime for chat and live updates
- **Storage**: Supabase Storage for user avatars (future)
- **APIs**: Google Maps API (Places, Directions, Geocoding)

### Development Tools
- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Modern configuration with React and TypeScript rules
- **Prettier**: Code formatting (integrated with ESLint)
- **Git**: Version control with conventional commits
- **Vercel**: Deployment and hosting platform

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, Modal, etc.)
│   ├── forms/          # Form components with validation
│   ├── maps/           # Google Maps related components
│   ├── chat/           # Chat system components
│   └── layout/         # Navigation, headers, footers
├── pages/              # Page components for routes
│   ├── auth/           # Login, signup, password reset
│   ├── trips/          # Trip listing, creation, details
│   ├── matches/        # Trip matching and recommendations
│   ├── profile/        # User profile and settings
│   └── chat/           # Chat interface
├── hooks/              # Custom React hooks
├── services/           # API services and external integrations
│   ├── supabase/       # Supabase client and helpers
│   ├── maps/           # Google Maps API integration
│   └── api/            # HTTP API services
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and helpers
├── constants/          # App constants and configuration
└── assets/             # Static assets (images, icons)
```

## 🗄️ Database Schema

### Core Tables
- **users**: User profiles with authentication data
- **trips**: Trip information with enhanced location data (JSONB)
- **trip_requests**: Join requests between users
- **trip_matches**: Intelligent matching results with compatibility scores
- **notifications**: Real-time notifications for matches and requests
- **chat_rooms**: Chat rooms for matched users
- **messages**: Chat messages with real-time subscriptions
- **user_preferences**: Matching preferences and user settings
- **trip_reviews**: Post-trip ratings and reviews

### Key Features
- TEXT-based UUIDs for all primary keys
- JSONB columns for complex location data with GIN indexes
- Row Level Security (RLS) for data privacy
- Real-time subscriptions for chat and notifications
- Automatic triggers for updated_at timestamps

## 🔧 Development Guidelines

### Code Standards
- **TypeScript**: Always use strict mode, prefer interfaces over types
- **Components**: Functional components with proper TypeScript props
- **State**: Zustand for global state, useState for local component state
- **Styling**: Tailwind CSS with semantic class names
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Performance**: React.memo for expensive components, useMemo/useCallback when needed

### API Integration
- **Supabase**: Use the official JavaScript client with proper TypeScript types
- **Google Maps**: Implement with proper API key management and error handling
- **Real-time**: Supabase Realtime for chat and live updates
- **Caching**: React Query for API state management (if needed)

### Security Best Practices
- **Environment Variables**: All sensitive keys in .env files
- **RLS Policies**: Strict database access control
- **Input Validation**: Zod schemas for all user inputs
- **Authentication**: Proper JWT handling and session management
- **CORS**: Configured for production domains only

## 🚀 Key Features Implementation

### 1. Authentication System
- Email/password login with validation
- Google OAuth integration
- User registration with profile setup
- Password reset functionality
- Protected routes with auth guards
- Persistent authentication state

### 2. Trip Management
- Trip creation with Google Places autocomplete
- Interactive map integration for route visualization
- Trip listing with advanced filters
- Trip editing and status management
- Real-time trip updates

### 3. Intelligent Matching Algorithm
- Route compatibility analysis using Google Directions API
- Time compatibility with flexible departure windows
- User preference matching (smoking, pets, conversation level)
- Compatibility scoring (0-1 scale)
- Multiple match types: exact_route, partial_overlap, detour_pickup, detour_dropoff
- Automatic matching when trips are created

### 4. Real-time Chat System
- Supabase Realtime for instant messaging
- Chat rooms automatically created for matches
- Typing indicators and message status
- Message history with pagination
- Mobile-optimized chat interface

### 5. Trip Request System
- Send join requests with custom messages
- Accept/decline with notifications
- Passenger seat management
- Request status tracking

### 6. Notification System
- Real-time notifications for matches and requests
- In-app notification bell with unread count
- Email notifications (configurable)
- Push notifications (future enhancement)

## 🎨 UI/UX Guidelines

### Design System
- **Colors**: Primary blue (#3B82F6), success green (#10B981), warning amber (#F59E0B), error red (#EF4444)
- **Typography**: Inter font family, clear hierarchy with Tailwind typography scale
- **Spacing**: Consistent spacing using Tailwind's spacing scale
- **Animations**: Subtle animations using Framer Motion for better UX
- **Mobile First**: Responsive design starting from mobile (320px+)

### Component Guidelines
- **Consistency**: Reuse UI components from the `/components/ui` directory
- **Accessibility**: Basic ARIA labels and keyboard navigation
- **Loading States**: Skeleton loaders and proper loading indicators
- **Error States**: User-friendly error messages with retry options
- **Empty States**: Helpful empty states with clear call-to-actions

## 🔍 Testing Strategy

### Testing Tools
- **Unit Tests**: Vitest for fast unit testing
- **Component Tests**: React Testing Library for UI testing
- **E2E Tests**: Playwright for critical user flows (optional)
- **Type Checking**: TypeScript compiler for static analysis

### Test Coverage Priorities
1. Authentication flows
2. Trip Creation and matching
3. Chat functionality
4. Critical user journeys
5. Utility functions and services

## 📦 Deployment Configuration

### Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Application Configuration
VITE_APP_URL=https://your-domain.vercel.app
VITE_APP_NAME=Taxi Carpooling

# Optional: Analytics and Monitoring
VITE_SENTRY_DSN=your_sentry_dsn
```

### Vercel Configuration
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Framework Preset**: Vite
- **Environment Variables**: Set all VITE_ prefixed variables

## 🛠️ Development Commands

### Essential Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Database
npm run db:migrate   # Run database migrations (if using migrations)
npm run db:seed      # Seed development data
npm run db:reset     # Reset database (development only)

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run test:e2e     # Run E2E tests (if configured)
```

## 🐛 Common Issues & Solutions

### 1. Supabase Connection Issues
- Verify environment variables are correctly set
- Check Supabase project URL and anon key
- Ensure RLS policies allow the operation
- Check network connectivity and CORS settings

### 2. Google Maps API Issues
- Verify API key has required services enabled (Places, Maps JavaScript, Directions)
- Check API key restrictions and quotas
- Ensure HTTPS is used in production
- Handle API errors gracefully with fallbacks

### 3. Real-time Chat Issues
- Verify Supabase Realtime is enabled for your project
- Check RLS policies allow reading/writing chat messages
- Ensure proper subscription cleanup in useEffect
- Handle connection drops and reconnection

### 4. TypeScript Errors
- Run `npm run type-check` to identify issues
- Ensure all props interfaces are properly defined
- Use proper type guards for runtime type checking
- Keep TypeScript strict mode enabled

## 📚 Learning Resources

### Documentation Links
- [React 19 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

### Best Practices References
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Google Maps React Integration](https://developers.google.com/maps/documentation/javascript/react-map)

## 🎯 Success Metrics

### Technical Metrics
- **Performance**: Lighthouse score > 90
- **Type Safety**: Zero TypeScript errors
- **Bundle Size**: Main bundle < 500KB gzipped
- **Test Coverage**: > 80% for critical features

### User Experience Metrics
- **Loading Time**: Initial page load < 3 seconds
- **Interactive Time**: Time to interactive < 2 seconds
- **Mobile Experience**: Fully responsive on all devices
- **Error Rate**: < 1% error rate for critical flows

## 🚀 Future Enhancements

### Phase 2 Features
- Push notifications
- Trip scheduling and recurring trips
- Advanced route optimization
- In-app payments with Stripe
- User verification and background checks
- Trip insurance integration

### Technical Improvements
- PWA (Progressive Web App) capabilities
- Offline functionality for basic features
- Advanced caching strategies
- Performance monitoring with Core Web Vitals
- A/B testing framework
- Advanced analytics and user insights

---

This context document should be referenced throughout development to ensure consistency and quality. Update this file as the project evolves and new requirements emerge.