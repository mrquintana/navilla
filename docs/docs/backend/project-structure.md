---
sidebar_position: 2
title: Project Structure
---

# Backend Project Structure

Detailed breakdown of the Spring Boot backend structure.

## Directory Layout

```
backend/
├── src/
│   ├── main/
│   │   ├── java/app/navilla/
│   │   │   ├── NavillaBackendApplication.java
│   │   │   ├── config/           # Spring configuration classes
│   │   │   ├── controller/       # REST API endpoints
│   │   │   ├── service/          # Business logic
│   │   │   ├── repository/       # Data access layer
│   │   │   ├── model/            # Domain entities
│   │   │   ├── dto/              # Data transfer objects
│   │   │   ├── metrics/          # Micrometer instrumentation beans
│   │   │   ├── security/         # Security components (JWT, encryption)
│   │   │   └── util/             # Utility classes
│   │   └── resources/
│   │       ├── application.yaml
│   │       ├── application-development.yaml
│   │       ├── application-production.yaml
│   │       └── application-staging.yaml
│   ├── test/
│   │   └── java/app/navilla/
├── pom.xml
```

## Package Descriptions

### config

Spring configuration classes:
- Security setup (`SecurityConfig.java`)
- CORS configuration
- Message configuration (`MessageConfig.java`)

### controller

REST API endpoints:
- Handles incoming HTTP requests
- Input validation
- Response mapping
- Error handling

### service

Business logic:
- Orchestrates operations
- Contains core application logic
- Utilizes repositories and other services

### repository

Data access layer:
- Spring Data JPA repositories
- Custom queries for interacting with the database
- Translates business objects to database entities

### model

JPA entities representing the domain model and mapping to database tables.

### dto

Data Transfer Objects:
- Request DTOs (for validated input from clients)
- Response DTOs (for structured API output to clients)

### security

Security components:
- JWT validation logic (`SecurityConfig.java`)
- Encryption/decryption services (`EncryptionService.java`)

### metrics

Micrometer instrumentation beans — one per domain:
- `NavillaMetrics.java` — central registry of all metric name and tag key constants
- `ConnectionMetrics.java` — connection lifecycle counters
- `ExposureMetrics.java` — exposure snapshot cache counters, computation Timer, graph node DistributionSummary
- `HealthStatusMetrics.java` — health status CRUD counters tagged by condition and status
- `NotificationMetrics.java` — notification creation and read counters

See [Monitoring & Metrics](./monitoring) for full instrumentation reference.

### util

General utility classes that provide helper functions.
