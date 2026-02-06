---
sidebar_position: 1
title: Overview
---

# Navilla Overview

**Navilla** is a privacy-preserving sexual health platform that helps users understand their potential STI exposure through an anonymized connection network.

## Licensing

Navilla is proprietary software. Unauthorized copying, modification, or redistribution is prohibited.
See `LICENSE` for details.

## Core Principle

> "Numbers, not names."

Users can see statistics about their exposure risk (degrees of separation, potential exposures) without ever learning the identities of who may have exposed them.

## Key Features

- **Private Testing History**: Track your own STI testing history securely
- **Anonymous Connections**: Connect with past partners without revealing identities
- **Exposure Statistics**: See aggregate exposure data without identifying anyone
- **Timely Alerts**: Receive anonymous notifications when potential exposure occurs

## Privacy Architecture

| Feature | Implementation |
|---------|----------------|
| **Zero names revealed** | Hashed IDs, encrypted PII |
| **Statistics only** | Users see numbers, not identities |
| **Mutual consent** | Connections require both parties to confirm |
| **Minimum threshold** | 3+ connections required before specific alerts |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + TypeScript + TailwindCSS |
| Backend | Java 25 + Spring Boot 4.0 + Maven |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (JWT) |
| Docs | Docusaurus |

## Quick Links

- [Setup Guide](./setup) - Get your development environment running
- [Architecture Overview](../architecture/overview) - Understand the system design
- [API Reference](../api/overview) - Explore the API endpoints
- [Dev Tools](../development/dev-tools) - Dev-only endpoints and UI helpers
