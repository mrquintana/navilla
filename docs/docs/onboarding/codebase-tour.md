---
sidebar_position: 2
title: Codebase Tour
---

# Codebase Tour

A guided tour through the Navilla codebase.

## Repository Structure

```
navilla/
├── CONTEXT.md           # Project context and decisions log
├── docs/                # Documentation (Docusaurus)
├── backend/             # Spring Boot API
└── frontend/            # React application
```

## Documentation (`/docs`)

Built with Docusaurus. Contains all project documentation.

```bash
cd docs
npm start  # Start docs server at localhost:3000
```

## Backend (`/backend`)

Spring Boot application handling all business logic.

### Key Files

| File | Purpose |
|------|---------|
| `NavillaApplication.java` | Application entry point |
| `SecurityConfig.java` | JWT validation setup |
| `ExposureService.java` | Graph traversal algorithm |
| `EncryptionService.java` | Data encryption/decryption |

### Important Patterns

```java
// All user data accessed via hashed ID
String userHash = encryptionService.hashEmail(email);
User user = userRepository.findByEmailHash(userHash);

// Sensitive data encrypted before storage
byte[] encrypted = encryptionService.encrypt(data, userHash);
```

## Frontend (`/frontend`)

React application with Vite and TypeScript.

### Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Root component, routing |
| `lib/supabase.ts` | Supabase client setup |
| `hooks/useAuth.ts` | Authentication hook |
| `pages/Dashboard.tsx` | Main dashboard view |

### Important Patterns

```typescript
// All API calls include JWT from Supabase
const { data, error } = await api.get('/exposures', {
  headers: { Authorization: `Bearer ${session.access_token}` }
});

// Server state managed with TanStack Query
const { data: connections } = useQuery({
  queryKey: ['connections'],
  queryFn: fetchConnections,
});
```

## Database

PostgreSQL hosted on Supabase. Schema defined in migrations.

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (encrypted PII) |
| `connections` | User-to-user relationships |
| `health_status` | STI test results |
| `exposure_snapshots` | Cached exposure calculations |

## Where to Find Things

| Looking for... | Location |
|----------------|----------|
| API endpoints | `backend/src/.../controller/` |
| Business logic | `backend/src/.../service/` |
| Database queries | `backend/src/.../repository/` |
| UI components | `frontend/src/components/` |
| Page layouts | `frontend/src/pages/` |
| Type definitions | `frontend/src/types/` |
| Database schema | `backend/src/.../db/migration/` |
