---
sidebar_position: 3
title: "ADR-002: Technology Stack"
---

# ADR-002: Technology Stack

## Status

Accepted

## Date

2026-01-30

## Context

Navilla requires:
- Secure handling of sensitive health data
- Complex graph traversal for exposure calculation
- Strong encryption capabilities
- Modern, responsive UI
- Authentication with OAuth support
- Cost-effective for MVP phase

## Decision

### Frontend: React + Vite + TypeScript

**Why React:**
- Large ecosystem, easy to hire for
- Strong TypeScript support
- Good testing tools

**Why Vite:**
- Fast development experience
- Modern build tool
- Better than Create React App

### Backend: Java + Spring Boot

**Why Java:**
- Type-safe, catches errors at compile time
- Mature encryption libraries (Bouncy Castle)
- Good for complex business logic
- Easy to write graph algorithms

**Why Spring Boot:**
- Industry standard
- Excellent security (Spring Security)
- Easy JWT validation
- Good PostgreSQL support

### Database: PostgreSQL via Supabase

**Why PostgreSQL:**
- Robust, ACID-compliant
- Row Level Security support
- Good encryption extensions
- Recursive CTEs for graph queries

**Why Supabase:**
- Managed PostgreSQL
- Built-in Auth (OAuth, email)
- Free tier (50K MAU, 500MB DB)
- Real-time subscriptions (future use)

### Authentication: Supabase Auth

**Why Supabase Auth:**
- OAuth providers built-in
- Email verification included
- JWT tokens for API auth
- Free tier sufficient for MVP

## Consequences

### Positive

- **Type safety**: Both Java and TypeScript catch errors early
- **Security**: Mature, battle-tested libraries
- **Cost**: Free tiers cover MVP needs
- **Hiring**: Common technologies, easy to find developers

### Negative

- **Java verbosity**: More boilerplate than Node.js
- **Two languages**: Need proficiency in both Java and TypeScript
- **Supabase coupling**: Some lock-in to Supabase services

### Neutral

- **Learning curve**: Standard technologies, most developers familiar
- **Deployment**: Multiple services to deploy (frontend, backend, docs)

## Alternatives Considered

### Backend Alternatives

| Option | Pros | Cons |
|--------|------|------|
| Node.js/Express | Same language as frontend | Less type safety, weaker ecosystem for encryption |
| Go | Performance, simplicity | Smaller ecosystem, harder to hire |
| Python/Django | Rapid development | Performance concerns for graph traversal |

### Database Alternatives

| Option | Pros | Cons |
|--------|------|------|
| MongoDB | Flexible schema | Less suited for graph relationships |
| Neo4j | Native graph DB | More expensive, specialized |
| Firebase | Google ecosystem | Less control over data, privacy concerns |

### Auth Alternatives

| Option | Pros | Cons |
|--------|------|------|
| Auth0 | Feature-rich | More expensive at scale |
| Clerk | Modern DX | Newer, less proven |
| Self-hosted | Full control | Security responsibility, more work |
