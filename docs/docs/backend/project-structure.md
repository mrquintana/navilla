---
sidebar_position: 2
title: Project Structure
---

# Backend Project Structure

Detailed breakdown of the Spring Boot backend structure.

:::note Work in Progress
This documentation will be updated as the backend is implemented.
:::

## Directory Layout

```
backend/
├── src/
│   ├── main/
│   │   ├── java/app/navilla/
│   │   │   ├── NavillaApplication.java
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── WebConfig.java
│   │   │   │   └── EncryptionConfig.java
│   │   │   ├── controller/
│   │   │   │   ├── UserController.java
│   │   │   │   ├── ConnectionController.java
│   │   │   │   ├── HealthController.java
│   │   │   │   └── ExposureController.java
│   │   │   ├── service/
│   │   │   │   ├── UserService.java
│   │   │   │   ├── ConnectionService.java
│   │   │   │   ├── HealthService.java
│   │   │   │   ├── ExposureService.java
│   │   │   │   └── NotificationService.java
│   │   │   ├── repository/
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── ConnectionRepository.java
│   │   │   │   ├── HealthStatusRepository.java
│   │   │   │   └── NotificationRepository.java
│   │   │   ├── model/
│   │   │   │   ├── User.java
│   │   │   │   ├── Connection.java
│   │   │   │   ├── HealthStatus.java
│   │   │   │   └── ExposureSnapshot.java
│   │   │   ├── dto/
│   │   │   │   ├── request/
│   │   │   │   └── response/
│   │   │   ├── security/
│   │   │   │   ├── JwtTokenFilter.java
│   │   │   │   └── EncryptionService.java
│   │   │   └── util/
│   │   │       └── HashUtil.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/
│   │           ├── V1__initial_schema.sql
│   │           └── V2__add_indexes.sql
│   └── test/
│       └── java/app/navilla/
├── build.gradle
├── settings.gradle
└── gradle.properties
```

## Package Descriptions

### config

Spring configuration classes:
- Security setup
- CORS configuration
- Encryption beans

### controller

REST API endpoints:
- Input validation
- Response mapping
- Error handling

### service

Business logic:
- Graph traversal algorithms
- Encryption/decryption
- Notification scheduling

### repository

Data access layer:
- Spring Data JPA repositories
- Custom queries for graph operations

### model

JPA entities mapping to database tables.

### dto

Data Transfer Objects:
- Request DTOs (validated input)
- Response DTOs (API output)

### security

Security components:
- JWT validation filter
- Encryption service
