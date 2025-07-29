# Taxi Carpooling App - Rebuild Prompts

This document contains optimized prompts for rebuilding the taxi carpooling application from scratch using Claude Code. Each phase should be executed sequentially, and you should paste the complete prompt for each phase.

## 🚀 PHASE 1: Project Foundation & Setup

```
I want to build a modern taxi carpooling web application from scratch. This will be a React + TypeScript + Vite application with Supabase backend, similar to BlaBlaCar but focused on taxi sharing.

**Core Features Needed:**
- User authentication (email/social login)
- Trip creation and management
- Intelligent trip matching algorithm
- Real-time chat between matched users
- Google Maps integration for locations
- Trip requests and approval system
- User ratings and reviews
- Mobile-responsive UI

**Technical Stack:**
- Frontend: React 19, TypeScript, Vite
- Styling: Tailwind CSS + Headless UI
- State Management: Zustand
- Backend: Supabase (auth, database, realtime)
- Maps: Google Maps API
- Deployment: Vercel

**Project Structure Requirements:**
- Clean, scalable folder structure
- Strict TypeScript configuration
- ESLint + Prettier setup
- Modern development tooling

Please:
1. Initialize the project with create-vite
2. Install all necessary dependencies
3. Configure TypeScript, ESLint, Tailwind CSS
4. Set up basic folder structure
5. Create initial configuration files
6. Set up environment variables template

Current directory: /Users/mahmoud/Desktop/taxi_carpooling
```

## 🔐 PHASE 2: Authentication & User Management

```
Now implement the complete authentication system using Supabase. 

**Requirements:**
- Email/password authentication
- Google OAuth integration
- User registration with profile setup
- Protected routes and auth guards
- User profile management
- Persistent authentication state with Zustand

**Database Schema Needed:**
- Enhanced users table with profile information
- User preferences table
- Authentication triggers and RLS policies

**Components to Build:**
- Login/Signup forms with validation
- Social login buttons
- User profile pages
- Navigation with auth state
- Route protection wrapper

**Key Features:**
- Form validation using react-hook-form + zod
- Toast notifications for auth feedback
- Remember me functionality
- Password reset flow
- Email verification

**Needed Supabase Credentials:**

NEXT_PUBLIC_SUPABASE_URL=https://dwrknslxhbgxknvjwtaz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cmtuc2x4aGJneGtudmp3dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjg1MDEsImV4cCI6MjA2OTMwNDUwMX0.cSu40FImvr_dfIwc6ctTjMUnhBA0WJcK7Zj4BcciU4s
Database_passowrd: 5822075Mm94$



Please implement the complete authentication flow with proper error handling and user experience.
```

## 🚗 PHASE 3: Trip Management System

```
Build the core trip management system with Google Maps integration.

**Trip Features Required:**
- Create trip with origin/destination (Google Places API)
- Visual map integration for route display
- Trip listing with filters (date, location, passengers)
- Trip details page with all information
- Trip editing and cancellation
- Trip status management (ACTIVE, CANCELLED, MATCHED, COMPLETED)

**Database Tables:**
- trips table with enhanced location data (JSONB)
- Proper indexing for location queries
- RLS policies for trip privacy

**Components Needed:**
- Trip creation form with location picker
- Trip cards for listing
- Interactive map component
- Trip filters and search
- Trip details modal/page

**Google Maps Integration:**
- Places Autocomplete for locations
- Route visualization on maps
- Distance and duration calculations
- Geolocation for current position

**Key Requirements:**
- Mobile-responsive design
- Real-time updates
- Proper loading states
- Error handling for API failures
- Validation for trip data

Implement with modern React patterns and TypeScript strict mode.
```

## 🎯 PHASE 4: Intelligent Matching Algorithm

```
Implement the advanced trip matching system that automatically finds compatible trips.

**Matching Algorithm Requirements:**
- Route compatibility analysis (shared path calculation)
- Time compatibility (departure time flexibility)
- User preferences matching
- Distance and detour calculations
- Scoring system (0-1 compatibility score)

**Matching Types:**
- exact_route: Same origin/destination
- partial_overlap: Shared portion of route
- detour_pickup: Slight detour to pick up passenger
- detour_dropoff: Slight detour to drop off passenger

**Database Schema:**
- trip_matches table with detailed analysis
- user_preferences table for matching criteria
- notifications table for match alerts

**Features to Implement:**
- Automatic matching when trip is created
- Manual search for compatible trips
- Match recommendations with scoring
- Meeting point suggestions
- Cost sharing calculations

**UI Components:**
- Match results display
- Compatibility score visualization
- Route comparison maps
- Match details modal
- Notification system for new matches

**Notification System:**
- Real-time notifications for new matches
- In-app notification bell with count
- Email notifications (optional)
- Push notifications setup

Focus on creating a smart, BlaBlaCar-style matching experience.
```

## 💬 PHASE 5: Real-time Chat System

```
Implement a complete real-time chat system using Supabase Realtime for matched users.

**Chat Features Required:**
- Real-time messaging between matched users
- Chat rooms created automatically for matches
- Message history and persistence
- Typing indicators
- Message status (sent, delivered, read)
- File/image sharing capability

**Database Schema:**
- chat_rooms table linked to matches
- messages table with real-time subscriptions
- message_status tracking
- RLS policies for chat privacy

**Supabase Realtime Setup:**
- Real-time subscriptions for new messages
- Typing status broadcasting
- Online/offline user status
- Message read receipts

**Chat UI Components:**
- Chat window with message bubbles
- Message input with typing detection
- User status indicators
- Chat room list
- Message timestamps and status icons

**Key Features:**
- Auto-scroll to latest messages
- Message pagination for history
- Responsive design for mobile
- Emoji support
- Message search functionality

**Integration Requirements:**
- Chat accessible from matches page
- Notification integration for new messages
- User blocking functionality
- Report inappropriate messages

Build a modern, WhatsApp-style chat experience with excellent UX.
```

## 📱 PHASE 6: Advanced Features & UI Polish

```
Complete the application with advanced features and UI polish.

**Trip Request System:**
- Send trip join requests with messages
- Accept/decline requests with notifications
- Manage passenger count and seats
- Request status tracking

**User Experience Features:**
- Trip reviews and rating system
- User profiles with ratings display
- Saved trips functionality
- Trip history and analytics
- User preferences and settings

**Maps & Navigation:**
- Advanced route visualization
- Turn-by-turn directions integration
- Real-time location sharing (optional)
- Estimated arrival times
- Traffic information

**Mobile Optimization:**
- Progressive Web App (PWA) setup
- Mobile-first responsive design
- Touch-friendly interactions
- Offline functionality for basic features
- App-like navigation

**Performance & UX:**
- Loading skeletons and states
- Optimistic updates
- Image optimization
- Bundle splitting and lazy loading
- Error boundaries and fallbacks

**Additional Features:**
- Search and filter improvements
- Trip sharing functionality
- Calendar integration
- Payment integration (Stripe - optional)
- Admin dashboard for trip management

Focus on creating a polished, production-ready user experience.
```

## 🚀 PHASE 7: Testing, Deployment & Production

```
Finalize the application with testing, deployment, and production readiness.

**Testing Strategy:**
- Unit tests for utilities and services
- Component testing with React Testing Library
- Integration tests for critical flows
- E2E tests for user journeys (optional)

**Production Setup:**
- Environment variable management
- Supabase production configuration
- Google Maps API key setup
- Error tracking (Sentry integration)
- Analytics setup (optional)

**Vercel Deployment:**
- Production build optimization
- Environment variables configuration
- Custom domain setup (optional)
- Performance monitoring

**Security & Privacy:**
- Review RLS policies
- API key security
- User data privacy compliance
- Rate limiting implementation

**Performance Optimization:**
- Bundle analysis and optimization
- Image optimization and CDN
- Caching strategies
- Database query optimization

**Documentation:**
- API documentation
- Deployment guide
- User manual
- Developer onboarding

**Final Checklist:**
- Cross-browser testing
- Mobile device testing
- Performance audit
- Security review
- Accessibility compliance (basic)

Ensure the application is production-ready with proper monitoring and maintenance procedures.
```

---

## 📋 Usage Instructions

1. **Sequential Execution**: Execute phases in order - each phase builds on the previous one
2. **Complete Prompts**: Copy the entire prompt for each phase, including requirements and context
3. **Verification**: Test functionality after each phase before proceeding
4. **Customization**: Modify requirements based on specific needs
5. **Environment**: Ensure you have necessary API keys (Google Maps, Supabase)

## 🔧 Required Environment Variables

Create these environment variables during Phase 1:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Optional
VITE_SENTRY_DSN=your_sentry_dsn
VITE_APP_URL=http://localhost:5173
```

## 📝 Notes

- Each phase should take 1-2 hours to complete
- Test thoroughly before moving to the next phase
- Keep the existing database schema from the analysis as reference
- Focus on mobile-first responsive design throughout
- Maintain TypeScript strict mode for better code quality

This rebuild approach ensures a clean, modern, and maintainable codebase with proper architecture from the start.