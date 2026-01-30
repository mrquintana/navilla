---
sidebar_position: 1
title: Backend Overview
---

# Backend Overview

The Navilla backend is a Spring Boot application that handles business logic, graph traversal, and encrypted data management.

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 21 | Language |
| Spring Boot | 3.x | Framework |
| Spring Security | 6.x | Authentication/Authorization |
| Spring Data JPA | 3.x | Database access |
| PostgreSQL | 15+ | Database |
| Gradle | 8.x | Build tool |

## Project Structure

```
backend/
├── src/main/java/app/navilla/
│   ├── NavillaApplication.java
│   ├── config/           # Configuration classes
│   ├── controller/       # REST controllers
│   ├── service/          # Business logic
│   ├── repository/       # Data access
│   ├── model/            # Domain entities
│   ├── dto/              # Data transfer objects
│   ├── security/         # Auth & encryption
│   └── util/             # Utilities
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/     # Flyway migrations
└── build.gradle
```

## Key Components

### Controllers

REST API endpoints following OpenAPI 3.0 specification.

### Services

- **UserService**: User management, profile operations
- **ConnectionService**: Connection requests, confirmations
- **HealthService**: Health status management
- **ExposureService**: Graph traversal, exposure calculations
- **NotificationService**: Notification queuing, delivery

### Security

- JWT validation via Supabase public keys
- Per-user encryption key derivation
- Rate limiting
- Input validation

## Getting Started

See [Development Setup](../getting-started/setup) for instructions.

## API Documentation

See [API Reference](../api/overview) for endpoint details.
