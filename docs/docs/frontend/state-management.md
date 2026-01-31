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

## API Calls with Auth

All API calls include the JWT token:

```typescript
async function fetchUser(accessToken: string) {
  const response = await fetch('/api/users/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}
```
