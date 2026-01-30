---
sidebar_position: 1
title: Architecture Overview
---

# Architecture Overview

Navilla follows a three-tier architecture with a React frontend, Spring Boot backend, and Supabase for authentication and database.

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Client
        FE[React Frontend]
    end

    subgraph Auth
        SA[Supabase Auth]
    end

    subgraph Backend
        API[Spring Boot API]
    end

    subgraph Database
        DB[(PostgreSQL)]
    end

    FE -->|1. Login/Signup| SA
    SA -->|2. JWT Token| FE
    FE -->|3. API Calls + JWT| API
    API -->|4. Validate JWT| SA
    API -->|5. Query/Mutate| DB
```

## Request Flow

1. **User authenticates** via Supabase Auth (frontend SDK)
2. **Supabase returns JWT** containing user ID and claims
3. **Frontend includes JWT** in `Authorization` header for API calls
4. **Spring Boot validates JWT** using Supabase's public key
5. **Backend queries PostgreSQL** with Row Level Security enforced

## Component Responsibilities

| Component | Responsibilities |
|-----------|------------------|
| **React Frontend** | UI rendering, user interactions, Supabase Auth integration |
| **Spring Boot API** | Business logic, graph traversal, exposure calculations, encryption |
| **Supabase Auth** | User registration, login, OAuth, JWT issuance |
| **PostgreSQL** | Data persistence, Row Level Security, encrypted storage |

## Key Design Decisions

### Why Supabase for Auth?

- Built-in email verification
- OAuth providers (Google, Apple) out of the box
- JWT tokens with customizable claims
- Free tier supports 50K monthly active users

### Why Spring Boot for Backend?

- Type-safe Java for complex business logic
- Robust ecosystem for encryption, graph algorithms
- Easy JWT validation with Spring Security
- Good PostgreSQL integration

### Why Not Direct Supabase Access?

While Supabase supports direct database access from the frontend with RLS, we chose a dedicated backend because:

1. **Complex graph traversal** - Exposure calculations require multi-step queries
2. **Encryption at application layer** - More control over encryption/decryption
3. **Batching logic** - Notification queuing and weekly batch processing
4. **Future flexibility** - Easier to add caching, rate limiting, etc.

## Security Boundaries

```mermaid
flowchart LR
    subgraph Public
        User[User Device]
    end

    subgraph DMZ
        FE[Frontend CDN]
    end

    subgraph Private
        API[API Server]
        DB[(Database)]
    end

    User --> FE
    User --> API
    API --> DB
```

- **Frontend** is publicly accessible, contains no secrets
- **Backend** validates all requests, never trusts client input
- **Database** only accessible from backend, RLS as defense-in-depth
