---
sidebar_position: 4
title: State Management
---

# State Management

:::note Work in Progress
This documentation will be updated as the frontend is implemented.
:::

## Approach

Navilla uses **TanStack Query** (React Query) for server state and React Context for client state.

### Server State (TanStack Query)

```typescript
// Fetching connections
const { data: connections } = useQuery({
  queryKey: ['connections'],
  queryFn: () => api.getConnections(),
});

// Mutations with optimistic updates
const mutation = useMutation({
  mutationFn: api.confirmConnection,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['connections'] });
  },
});
```

### Client State (Context)

```typescript
// Auth context
const AuthContext = createContext<AuthContextType>(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  // Supabase auth listener
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}
```
