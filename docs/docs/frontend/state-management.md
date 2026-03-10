---
sidebar_position: 4
title: State Management
---

# State Management

Navilla uses **TanStack Query** (React Query) for server state, **React Context** for client state, and **localStorage** for persistent UI preferences.

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

## Client State (Contexts)

### AuthContext (`contexts/AuthContext.tsx`)

Manages authentication state via Supabase Auth:

```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, metadata: UserMetadata) => Promise<{ error: AuthError | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}
```

Auth state flow:
1. App mounts -- `AuthProvider` calls `supabase.auth.getSession()`
2. Sets `isLoading: true` during initial check
3. Sets up `onAuthStateChange` listener
4. Updates `session` on any auth changes (login, logout, token refresh)
5. Components re-render with new auth state

Also exports `useAuthOptional()` for components that may render outside the auth provider (e.g., Layer 0 pages).

### ToastContext (`contexts/ToastContext.tsx`)

Manages global toast notifications:

```typescript
type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}
```

- Toasts auto-dismiss after 4 seconds
- Consumed via `useToast()` hook
- Rendered by `<ToastContainer />` component in App.tsx

## Provider Hierarchy

```tsx
// src/App.tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <ToastProvider>
      <Suspense fallback={<FullPageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
      <ToastContainer />
    </ToastProvider>
  </AuthProvider>
</QueryClientProvider>
```

## API Client (`lib/api.ts`)

All API calls use the centralized API client that handles authentication, error handling, and E2E mock support.

```typescript
export async function apiRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestOptions = {}
): Promise<T>
```

Features:
- Automatic `Bearer` token injection
- JSON serialization/deserialization
- 204 No Content handling
- Custom `ApiError` class with `status` and `data`
- E2E mode bypass for Playwright tests

### API Namespaces (16 total)

| Namespace | Endpoints | Auth | Description |
|-----------|-----------|------|-------------|
| `api.system` | `check` | No | Health check endpoint |
| `api.users` | `me`, `search`, `update`, `delete` | Yes | User profile management |
| `api.connections` | `list`, `confirmed`, `pendingIncoming`, `pendingSent`, `create`, `accept`, `deny`, `delete`, `stats` | Yes | Connection (encounter) management |
| `api.notifications` | `list`, `markRead`, `markAllRead` | Yes | In-app notifications |
| `api.health` | `list`, `report`, `clear`, `activate`, `delete` | Yes | Health status reports |
| `api.exposures` | `get`, `recompute` | Yes | Exposure analysis snapshots |
| `api.journal` | `list`, `create`, `update`, `delete`, `summary`, `templates.get`, `templates.save`, `partners.*`, `recentAliases` | Yes | Encounter journal + partners |
| `api.healthLog` | `visits.*`, `summary`, `condition`, `labs.*` | Yes | Test visits, labs, condition history |
| `api.catalog` | `get`, `conditions`, `stages` | No | Static catalog data (med types, vaccines, conditions, stages) |
| `api.medications` | `list`, `create`, `get`, `update`, `delete`, `logDose`, `adherence`, `prepStreak` | Yes | Medication tracking + PrEP |
| `api.vaccinations` | `list`, `create`, `update`, `delete` | Yes | Vaccination series management |
| `api.reminders` | `list`, `upcoming`, `snooze`, `complete`, `toggle`, `delete`, `settings.get`, `settings.update` | Yes | Smart reminders + preferences |
| `api.insights` | `get` | Yes | Personal insights dashboard data |
| `api.push` | `vapidPublicKey`, `subscribe`, `unsubscribe`, `list` | Mixed | Push notification subscriptions |
| `api.reciprocity` | `status`, `optIn`, `optOut` | Yes | Reciprocity opt-in management |
| `api.labs` | `providers`, `verify`, `confirm` | Yes | Lab verification (Chopo, Salud Digna) |
| `api.phoneMatch` | `pending`, `confirm`, `deny`, `block` | Yes | Phone-based encounter matching |

## Query Keys and Hooks

### User Profile

```typescript
// hooks/useUser.ts
useUser()
// queryKey: ['user', 'me']
// staleTime: 5 min
```

### Catalog (public, no auth)

```typescript
// hooks/useCatalog.ts
useCatalog()            // queryKey: ['catalog'],             staleTime: 30 min
useConditionCatalog()   // queryKey: ['catalog', 'conditions'], staleTime: 60 min
useNetworkStages()      // queryKey: ['catalog', 'stages'],    staleTime: 60 min
```

### Journal

```typescript
// hooks/useJournal.ts
useJournalEntries(month?)       // queryKey: ['journal', 'list', month ?? 'all'], staleTime: 2 min
useJournalSummary(year)         // queryKey: ['journal', 'summary', year],        staleTime: 5 min
useJournalTemplates()           // queryKey: ['journal', 'templates'],            staleTime: 10 min
useJournalPartners()            // queryKey: ['journal', 'partners'],             staleTime: 2 min
useJournalPartner(id)           // queryKey: ['journal', 'partner', id],          staleTime: 2 min
useJournalPartnerEntries(id)    // queryKey: ['journal', 'partner', id, 'entries'], staleTime: 2 min
useRecentAliases()              // queryKey: ['journal', 'recent-aliases'],       staleTime: 2 min

// Mutations — all invalidate ['journal']
useCreateJournalEntry()
useUpdateJournalEntry()
useDeleteJournalEntry()
useSaveJournalTemplates()  // invalidates ['journal', 'templates']
useCreatePartner()
useUpdatePartner()
useDeletePartner()
usePromoteAlias()
```

### Health Log

```typescript
// hooks/useHealthLog.ts
useHealthLogSummary()            // queryKey: ['health-log', 'summary'],         staleTime: 2 min
useHealthLogVisits()             // queryKey: ['health-log', 'visits'],           staleTime: 2 min
useHealthLogVisit(id)            // queryKey: ['health-log', 'visit', id],        staleTime: 2 min
useConditionHistory(type)        // queryKey: ['health-log', 'condition', type],  staleTime: 2 min
useHealthLogLabs()               // queryKey: ['health-log', 'labs'],             staleTime: 5 min

// Mutations
useCreateTestVisit()   // invalidates ['health-log']
useUpdateTestVisit()   // invalidates ['health-log']
useDeleteTestVisit()   // invalidates ['health-log']
useCreateLab()         // invalidates ['health-log', 'labs']
useUpdateLab()         // invalidates ['health-log', 'labs']
useDeleteLab()         // invalidates ['health-log', 'labs']
```

### Medications

```typescript
// hooks/useMedications.ts
useMedications()                   // queryKey: ['medications'],                    staleTime: 2 min
useMedication(id)                  // queryKey: ['medications', id]
useAdherence(id, month)            // queryKey: ['medications', id, 'adherence', month]
usePrepStreak()                    // queryKey: ['medications', 'prep-streak'],     staleTime: 5 min

// Mutations — all invalidate ['medications'] AND ['reminders']
useCreateMedication()
useUpdateMedication()
useDeleteMedication()
useLogDose()
```

### Vaccinations

```typescript
// hooks/useVaccinations.ts
useVaccinations()                  // queryKey: ['vaccinations'],                   staleTime: 2 min

// Mutations — all invalidate ['vaccinations'] AND ['reminders']
useCreateVaccination()
useUpdateVaccination()
useDeleteVaccination()
```

### Reminders

```typescript
// hooks/useReminders.ts
useReminders()                     // queryKey: ['reminders'],                      staleTime: 1 min
useUpcomingReminders(days)         // queryKey: ['reminders', 'upcoming', days],    staleTime: 1 min
useReminderSettings()              // queryKey: ['reminders', 'settings'],          staleTime: 5 min

// Mutations
useSnoozeReminder()            // invalidates ['reminders']
useCompleteReminder()          // invalidates ['reminders']
useToggleReminder()            // invalidates ['reminders']
useDeleteReminder()            // invalidates ['reminders']
useUpdateReminderSettings()    // invalidates ['reminders', 'settings']
```

### Insights

```typescript
// hooks/useInsights.ts
useInsights()                      // queryKey: ['insights'],                       staleTime: 5 min
```

### Reciprocity

```typescript
// hooks/useReciprocity.ts
useReciprocityStatus()             // queryKey: ['reciprocity', 'status'],          staleTime: 2 min

// Mutations — invalidate ['reciprocity'] AND ['exposures']
useOptIn()
useOptOut()
```

### Network Visualization

```typescript
// hooks/useNetworkVisualization.ts
useNetworkVisualization()
// Composes: useQuery(['exposures']) + useQuery(['catalog', 'stages'])
// Returns: { data: NetworkData | null, isLoading, isError }
// Resolves stage name from total node count
```

### Phone Match

```typescript
// hooks/usePhoneMatch.ts
usePendingPhoneMatches()           // queryKey: ['phone-match', 'pending'],         staleTime: 2 min

// Mutations
useConfirmPhoneMatch()     // invalidates ['phone-match'] AND ['connections']
useDenyPhoneMatch()        // invalidates ['phone-match']
useBlockPhoneNumber()      // invalidates ['phone-match']
```

### Lab Verification

```typescript
// hooks/useLabProviders.ts
useLabProviders()                  // queryKey: ['lab-providers'],                  staleTime: 60 min

// hooks/useLabVerification.ts
useLabVerify()             // mutation, no auto-invalidation
useLabConfirm()            // invalidates ['health-log'], ['healthLogSummary'], ['exposures']
```

### Symptom Filter (client-side only)

```typescript
// hooks/useSymptomFilter.ts
useSymptomFilter()
// Pure client-side state — no API calls
// Returns: selectedSymptoms, visibleSlugs, availableSymptoms, matchCounts
// Actions: addSymptom, removeSymptom, clearAll
// Also exports pure functions for testing: computeMatchCounts, computeVisibleSlugs, computeAvailableSymptoms
```

### Push Notifications

```typescript
// hooks/usePushNotifications.ts
usePushNotifications()
// Client-side state + side effects (Notification API, service worker)
// Returns: isSupported, permission, isSubscribed, isLoading, requestPermission, subscribe, unsubscribe
```

### PWA Install

```typescript
// hooks/usePwaInstall.ts
usePwaInstall()
// Client-side state (beforeinstallprompt event)
// Returns: canInstall, install, dismiss
// 7-day dismiss cooldown via localStorage
```

## Cache Invalidation Patterns

### Cross-Feature Invalidation

Some mutations invalidate queries from other features to keep data consistent:

| Mutation | Invalidates |
|----------|------------|
| Medication CRUD | `['medications']` + `['reminders']` |
| Vaccination CRUD | `['vaccinations']` + `['reminders']` |
| Reciprocity opt-in/out | `['reciprocity']` + `['exposures']` |
| Phone match confirm | `['phone-match']` + `['connections']` |
| Lab confirm | `['health-log']` + `['healthLogSummary']` + `['exposures']` |

### Broad vs. Narrow Invalidation

- **Broad invalidation** (prefix match): Journal mutations invalidate `['journal']`, which covers all journal queries (list, summary, partners, etc.)
- **Narrow invalidation**: Lab CRUD invalidates only `['health-log', 'labs']`, not all health-log queries
- **Health log mutations** invalidate `['health-log']` (broad) to refresh summary, visits, and condition history simultaneously

## localStorage Keys

| Key | Purpose | Duration |
|-----|---------|----------|
| `navilla_language` | Selected language (en_US / es_MX) | Permanent |
| `navilla_onboarding_complete` | Onboarding flow completed | Permanent |
| `navilla_pwa_install_dismissed` | PWA install banner dismissed | 7 days |
| `navilla_cookie_notice_ack_v1` | Cookie notice acknowledged | Permanent |

## Environment Configuration

Set `VITE_API_URL` in your `.env` file:

```bash
# Development
VITE_API_URL=http://localhost:8080

# Production
VITE_API_URL=https://api.navilla.app
```

The API client falls back to `http://localhost:8080` in development mode if `VITE_API_URL` is not set.
