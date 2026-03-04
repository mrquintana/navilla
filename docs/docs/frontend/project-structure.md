---
sidebar_position: 2
title: Project Structure
---

# Frontend Project Structure

## Directory Layout

```
frontend/
├── src/
│   ├── main.tsx              # App entry point (renders App)
│   ├── App.tsx               # Root component with providers
│   ├── router.tsx            # React Router v7 configuration
│   ├── queryClient.ts        # TanStack Query client setup
│   ├── i18n.ts               # i18n configuration (react-i18next)
│   ├── index.css             # TailwindCSS global styles
│   │
│   ├── sw.ts                  # Custom service worker (Workbox + push)
│   │
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client initialization
│   │   ├── api.ts            # Centralized API client
│   │   └── pushNotifications.ts # Push subscription utilities
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx   # Auth state management
│   │
│   ├── hooks/
│   │   ├── useAuth.ts        # Auth hook (re-export)
│   │   ├── useUser.ts        # User profile query (/api/users/me)
│   │   ├── usePushNotifications.ts # Push permission + subscribe/unsubscribe
│   │   ├── usePwaInstall.ts  # PWA install prompt management
│   │   └── useConnections.ts # (planned)
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx  # Route guard
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Nav with auth state
│   │   │   ├── Layout.tsx          # Main layout + PWA components
│   │   │   └── AuthLayout.tsx      # Centered auth pages
│   │   ├── pwa/
│   │   │   ├── InstallPrompt.tsx   # PWA install banner
│   │   │   ├── OfflineIndicator.tsx # Offline status bar
│   │   │   └── PwaUpdatePrompt.tsx # App update notification
│   │   ├── ui/               # (planned) Base UI components
│   │   └── features/         # (planned) Feature components
│   │
│   ├── pages/
│   │   ├── HomePage.tsx      # Landing page
│   │   ├── LoginPage.tsx     # Login form
│   │   ├── SignUpPage.tsx    # Registration form
│   │   ├── DashboardPage.tsx # Protected dashboard
│   │   ├── ForgotPasswordPage.tsx # Forgot password form
│   │   ├── ResetPasswordPage.tsx  # Reset password form
│   │   ├── Connections.tsx   # (planned)
│   │   ├── Health.tsx        # (planned)
│   │   └── Settings.tsx      # (planned)
│   │
│   ├── locales/
│   │   ├── en_US.json        # English translations
│   │   └── es_MX.json        # Spanish translations
│   │
│   └── types/
│       └── index.ts          # (planned) TypeScript types
│
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Key Files

### App.tsx
The root component that sets up all providers:
- `QueryClientProvider` - TanStack Query for server state
- `AuthProvider` - Supabase auth context
- `RouterProvider` - React Router v7

### router.tsx
Configures all application routes:
- Public routes: `/`, `/login`, `/signup`
- Protected routes: `/dashboard` (requires authentication)

### AuthContext.tsx
Manages authentication state:
- Listens to Supabase auth state changes
- Provides `signIn`, `signUp`, `signOut` functions
- Exposes `session`, `user`, and `isLoading` state
