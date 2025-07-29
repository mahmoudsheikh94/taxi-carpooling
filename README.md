# 🚕 Taxi Carpooling

> **A modern, production-ready web application for sharing taxi rides with compatible travelers.**

[![CI Pipeline](https://github.com/yourusername/taxi-carpooling/workflows/CI%20Pipeline/badge.svg)](https://github.com/yourusername/taxi-carpooling/actions)
[![Deploy to Vercel](https://github.com/yourusername/taxi-carpooling/workflows/Deploy%20to%20Vercel/badge.svg)](https://github.com/yourusername/taxi-carpooling/actions)
[![Security Checks](https://github.com/yourusername/taxi-carpooling/workflows/Security%20Checks/badge.svg)](https://github.com/yourusername/taxi-carpooling/actions)
[![codecov](https://codecov.io/gh/yourusername/taxi-carpooling/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/taxi-carpooling)

## ✨ Features

### 🔐 **Authentication & Security**
- Secure user authentication with Supabase Auth
- Google OAuth integration
- Row Level Security (RLS) for data protection
- JWT-based session management

### 🗺️ **Trip Management**
- Create and manage taxi trips with Google Maps integration
- Interactive route visualization
- Real-time trip updates
- Advanced filtering and search capabilities

### 🤝 **Intelligent Matching**
- AI-powered compatibility scoring algorithm
- Route overlap analysis using Google Directions API
- Time compatibility with flexible departure windows
- User preference matching (smoking, pets, conversation level)

### 💬 **Real-time Communication**
- Instant messaging system with Supabase Realtime
- Typing indicators and message status
- Chat room management for matched travelers
- File sharing capabilities

### 📱 **Progressive Web App**
- Offline functionality with service worker
- App installation prompts
- Push notifications support
- Background sync for offline actions

### ⭐ **Reviews & Ratings**
- 5-star rating system with written reviews
- Aspect-based ratings (punctuality, cleanliness, communication)
- User reputation and statistics
- Anonymous review options

## 🛠️ Technology Stack

### **Frontend**
- **React 19** - Latest React with Concurrent Features
- **TypeScript** - Strict type safety and better developer experience
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Accessible UI components

### **Backend & Services**
- **Supabase** - PostgreSQL database with realtime subscriptions
- **Google Maps API** - Places, Directions, and Geocoding services
- **Sentry** - Error tracking and performance monitoring
- **Vercel** - Deployment and hosting platform

### **State Management & Data**
- **Zustand** - Lightweight state management
- **React Hook Form** - Performant form handling
- **Zod** - Runtime type validation

### **Testing & Quality**
- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **MSW** - API mocking for tests
- **ESLint & Prettier** - Code linting and formatting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/taxi-carpooling.git
cd taxi-carpooling
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Fill in your environment variables:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Application Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Taxi Carpooling
```

### 4. Database Setup
```bash
# Run the database schema
psql -d your_database -f database/schema.sql
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see the application.

## 📖 Development Guide

### Using the Rebuild Prompts

This project includes comprehensive rebuild prompts in `REBUILD_PROMPTS.md`. To rebuild the entire application:

1. **Read CLAUDE.md** for complete project context
2. **Follow REBUILD_PROMPTS.md** phase by phase
3. **Execute each phase sequentially** for best results
4. **Test thoroughly** after each phase

### Project Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── services/      # API and external services
├── store/         # Zustand state management
├── types/         # TypeScript definitions
├── utils/         # Utility functions
└── assets/        # Static assets
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Type checking

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Headless UI
- **State**: Zustand
- **Backend**: Supabase (Auth, Database, Realtime)
- **Maps**: Google Maps JavaScript API
- **Deployment**: Vercel

## 📚 Key Features

- 🔐 **Authentication** - Email/password and social login
- 🗺️ **Trip Management** - Create and manage trips with maps
- 🎯 **Smart Matching** - Intelligent trip compatibility algorithm
- 💬 **Real-time Chat** - Chat between matched users
- 📱 **Mobile Responsive** - Works great on all devices
- 🔔 **Notifications** - Real-time notifications for matches

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic builds on push

### Environment Variables
See `.env.example` for all required variables.

## 📖 Documentation

- **CLAUDE.md** - Complete project context and guidelines
- **REBUILD_PROMPTS.md** - Phase-by-phase rebuild instructions
- **database/** - Database schema and setup

## 🤝 Contributing

1. Read `CLAUDE.md` for project context
2. Follow the established code patterns
3. Use TypeScript strict mode
4. Test your changes thoroughly
5. Follow conventional commit messages

## 📄 License

This project is private and proprietary.

---

**Need help?** Check `CLAUDE.md` for detailed context and `REBUILD_PROMPTS.md` for step-by-step rebuild instructions.