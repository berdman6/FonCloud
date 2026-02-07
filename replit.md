# Foncloud

## Overview

Foncloud is a mobile-first application built with Expo (React Native) and an Express.js backend. It's a referral-based platform where users can register (with a referral code), manufacture virtual devices, trade them on a marketplace, manage a wallet with transfers and withdrawals, and earn commissions through a multi-level referral system. The app features a dark neon-green theme with Bengali/English bilingual support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)
- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Navigation Structure**: Three route groups:
  - `app/index.tsx` - Splash/loading screen that redirects based on auth state
  - `app/(auth)/` - Login and register screens (modal presentation)
  - `app/(main)/` - Authenticated screens: home, wallet, manufacturing, marketplace, withdrawals, profile, referrals
- **Main Layout**: Custom animated drawer navigation in `app/(main)/_layout.tsx` (not using a tab bar or standard drawer library)
- **State Management**: TanStack React Query for server state, React Context for auth (`lib/auth-context.tsx`) and i18n (`lib/i18n.tsx`)
- **Styling**: StyleSheet-based with a centralized color theme in `constants/colors.ts` (dark mode only, neon green accent `#00FF88`)
- **Fonts**: Rajdhani font family (Google Fonts via `@expo-google-fonts/rajdhani`)
- **Animations**: react-native-reanimated throughout for entrance animations, drawer, and manufacturing timer
- **i18n**: Custom implementation supporting Bengali (`bn`) and English (`en`), stored in AsyncStorage

### Backend (Express.js)
- **Runtime**: Node.js with TypeScript (tsx for dev, esbuild for production build)
- **API Structure**: RESTful routes registered in `server/routes.ts`
  - `/api/auth/*` - Authentication (register, login, logout, me)
  - `/api/wallet/*` - Wallet transfers and transaction history
  - `/api/manufacturing/*` - Device manufacturing system
  - `/api/marketplace/*` - Device listing and trading
  - `/api/referrals/*` - Referral network and commissions
  - `/api/withdrawals/*` - Withdrawal requests
- **Authentication**: Express sessions with `connect-pg-simple` for PostgreSQL session storage. Password hashing with `bcryptjs`
- **CORS**: Dynamic CORS setup supporting Replit domains and localhost for development

### Database (PostgreSQL + Drizzle ORM)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema** (`shared/schema.ts`): Tables include:
  - `users` - User accounts with wallet balance, earnings, referral tracking
  - `transactions` - Financial transaction records
  - `commissions` - Multi-level referral commission records
  - `devices` - Manufactured virtual devices
  - `marketListings` - Marketplace listings for devices
  - `withdrawals` - Withdrawal requests
  - `likes` - Marketplace listing likes
- **Validation**: `drizzle-zod` for schema-based validation with Zod
- **Migrations**: Use `drizzle-kit push` (schema push approach, not migration files)
- **Storage Layer**: `server/storage.ts` provides a data access interface abstracting all database operations

### Business Logic
- **Signup Fee**: 500 units required to register
- **Referral Commissions**: 4-level deep: 10%, 5%, 2%, 1%
- **Manufacturing**: Timer-based device creation (5-minute timer) with brand selection (Apple, Samsung, FonCloud Special)
- **Marketplace**: Users can list manufactured devices for sale, with a like system

### Build & Deployment
- **Development**: Two processes - `expo:dev` for the mobile/web client, `server:dev` for the Express API
- **Production Build**: `expo:static:build` creates a static web export, `server:build` bundles the server with esbuild
- **Production Run**: `server:prod` serves both the API and static web assets
- **Environment**: `EXPO_PUBLIC_DOMAIN` connects the client to the API server; `DATABASE_URL` for PostgreSQL

## External Dependencies

- **Database**: PostgreSQL (required, connected via `DATABASE_URL` environment variable)
- **Session Store**: `connect-pg-simple` stores sessions in PostgreSQL
- **Key npm packages**:
  - `expo` ~54.0 - Mobile/web app framework
  - `express` ^5.0 - HTTP server
  - `drizzle-orm` + `drizzle-kit` - Database ORM and tooling
  - `@tanstack/react-query` - Data fetching/caching
  - `bcryptjs` - Password hashing
  - `react-native-reanimated` - Animations
  - `react-native-gesture-handler` - Touch gestures
  - `react-native-keyboard-controller` - Keyboard handling
  - `expo-haptics` - Haptic feedback on native
  - `patch-package` - Post-install patching (runs on `postinstall`)