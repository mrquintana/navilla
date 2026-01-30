---
sidebar_position: 2
title: Code Style
---

# Code Style Guide

## Java (Backend)

### Formatting

- Use Google Java Style Guide
- Indent with 4 spaces
- Max line length: 120 characters

### Naming

```java
// Classes: PascalCase
public class ConnectionService {}

// Methods: camelCase
public void confirmConnection() {}

// Constants: SCREAMING_SNAKE_CASE
private static final int MAX_DEGREE = 3;

// Variables: camelCase
String userHash = hashEmail(email);
```

### Best Practices

```java
// Prefer Optional over null
public Optional<User> findByEmail(String email);

// Use records for DTOs
public record ConnectionRequest(String targetEmail) {}

// Use streams judiciously
connections.stream()
    .filter(Connection::isConfirmed)
    .map(this::toResponse)
    .toList();
```

## TypeScript (Frontend)

### Formatting

- Use Prettier with default config
- Indent with 2 spaces

### Naming

```typescript
// Components: PascalCase
function ConnectionCard() {}

// Hooks: camelCase with use prefix
function useConnections() {}

// Types: PascalCase
interface ConnectionResponse {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_CONNECTIONS = 100;
```

### Best Practices

```typescript
// Explicit return types for functions
function getConnections(): Promise<Connection[]> {}

// Use TypeScript strict mode
// No any types without justification

// Prefer const over let
const connections = await fetchConnections();
```

## SQL

```sql
-- Use SCREAMING_SNAKE_CASE for SQL keywords
SELECT id, email_hash
FROM users
WHERE verified = TRUE;

-- Use snake_case for identifiers
CREATE TABLE health_status (
    user_hash VARCHAR(64) NOT NULL
);
```
