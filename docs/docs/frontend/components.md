---
sidebar_position: 3
title: Components
---

# Frontend Components

## Implemented Components

### Layout Components

#### Header (`components/layout/Header.tsx`)
Navigation header with auth-aware content:
- Shows app name with link to home
- When logged in: Dashboard link, user email, Sign Out button
- When logged out: Sign In and Sign Up buttons

#### Layout (`components/layout/Layout.tsx`)
Main layout wrapper for authenticated pages:
- Header component
- Main content area with `<Outlet />`

#### AuthLayout (`components/layout/AuthLayout.tsx`)
Centered layout for auth pages (login/signup):
- App name link at top
- Centered card container for forms

### Auth Components

#### ProtectedRoute (`components/auth/ProtectedRoute.tsx`)
Route guard for protected pages:
- Shows loading state while checking auth
- Redirects to `/login` if not authenticated
- Preserves intended destination for redirect after login

## Page Components

### HomePage (`pages/HomePage.tsx`)
Landing page with:
- App name and tagline
- Privacy description
- CTA buttons (Sign Up / Sign In or Dashboard)

### LoginPage (`pages/LoginPage.tsx`)
Login form with:
- Email/password inputs
- Error handling and display
- Loading state during submission
- Redirect to intended page after success
- Link to sign up page
- Redirects to dashboard if already logged in

### SignUpPage (`pages/SignUpPage.tsx`)
Registration form with:
- Email/password/confirm password inputs
- Client-side validation (password match, min length)
- Email confirmation message after success
- Link to login page
- Redirects to dashboard if already logged in

### DashboardPage (`pages/DashboardPage.tsx`)
Protected dashboard with:
- Welcome message with user email
- Exposure status card
- Profile card (fetches from /api/users/me)

## Component Patterns

### i18n
All UI text uses `useTranslation` hook:
```tsx
const { t } = useTranslation();
return <button>{t('auth.signIn')}</button>;
```

### Styling
Components use Tailwind utilities and predefined classes:
- `.btn` - Base button styles
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary action button
- `.card` - Card container
- `.input` - Form input

### Auth State
Components access auth via `useAuth` hook:
```tsx
const { session, user, signOut, isLoading } = useAuth();
```

## Planned Components

### UI Components
- Button
- Card
- Input
- Modal
- Badge
- Alert

### Feature Components
- ExposureCard
- ConnectionList
- HealthStatusForm
- AlertNotification
