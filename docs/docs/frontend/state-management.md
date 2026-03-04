---
sidebar_position: 4
title: State Management
---

# State Management

Navilla uses **TanStack Query** (React Query) for server state and **React Context** for client state.

## Server State (TanStack Query)

### Query Client Setup

```typescript
// src/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});
```

### User Profile Query

```typescript
// src/hooks/useUser.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useUser() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => fetchUser(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000,
  });
}
```

### Query Patterns

```typescript
// Fetching data
const { data, isLoading, error } = useUser();

// Mutations with cache invalidation
const mutation = useMutation({
  mutationFn: api.updateProfile,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
  },
});
```

## Client State (Auth Context)

### AuthContext

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}
```

### Usage

```typescript
// In components
const { session, user, signOut, isLoading } = useAuth();

// Check if authenticated
if (isLoading) return <Loading />;
if (!session) return <Navigate to="/login" />;
```

### Auth State Flow

1. App mounts → `AuthProvider` calls `supabase.auth.getSession()`
2. Sets `isLoading: true` during initial check
3. Sets up `onAuthStateChange` listener
4. Updates `session` on any auth changes (login, logout, token refresh)
5. Components re-render with new auth state

## Provider Hierarchy

```tsx
// src/App.tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  </AuthProvider>
</QueryClientProvider>
```

## API Client

All API calls use the centralized API client that handles authentication and error handling:

```typescript
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(message, response.status);
  }

  return response.json();
}

// Pre-built API methods
export const api = {
  users: {
    me: (token: string) => apiRequest<UserProfile>('/api/users/me', token),
    update: (token: string, data: UpdateProfileData) =>
      apiRequest<UserProfile>('/api/users/me', token, {
        method: 'PUT',
        body: data,
      }),
  },
  connections: {
    list: (token: string) => apiRequest<Connection[]>('/api/connections', token),
    // ... other methods
  },
};
```

### Using the API Client

```typescript
// In hooks
import { api } from '../lib/api';

export function useUser() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.users.me(session!.access_token),
    enabled: !!session?.access_token,
  });
}
```

### Push Notifications

```typescript
// src/hooks/usePushNotifications.ts
const {
  isSupported,  // browser supports Push API
  permission,   // 'default' | 'granted' | 'denied'
  isSubscribed, // currently subscribed
  isLoading,    // operation in progress
  subscribe,    // subscribe to push
  unsubscribe,  // unsubscribe from push
} = usePushNotifications();
```

### PWA Install

```typescript
// src/hooks/usePwaInstall.ts
const {
  canInstall,      // beforeinstallprompt captured
  isInstalled,     // already installed as PWA
  isDismissed,     // user dismissed (7-day cooldown)
  promptInstall,   // trigger install prompt
  dismiss,         // dismiss for 7 days
} = usePwaInstall();
```

### Environment Configuration

Set `VITE_API_URL` in your `.env` file:

```bash
# Development
VITE_API_URL=http://localhost:8080

# Production
VITE_API_URL=https://api.navilla.app
```
