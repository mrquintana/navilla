---
sidebar_position: 1
title: New Hire Guide
---

# Welcome to Navilla

Welcome to the Navilla team! This guide will help you get up to speed.

## Your First Day

### 1. Get Access

- [ ] GitHub repository access
- [ ] Supabase project access (staging)
- [ ] Vercel access (frontend deploys)
- [ ] Communication tools (Slack/Discord)

### 2. Set Up Development Environment

Follow the [Setup Guide](../getting-started/setup) to get your local environment running.

### 3. Understand the Product

**What is Navilla?**

A privacy-preserving sexual health platform that helps users understand their STI exposure risk without revealing anyone's identity.

**Core Principle:** "Numbers, not names"

Users see statistics (e.g., "2nd degree exposure to HIV") but never learn who in their network reported positive.

### 4. Understand the Architecture

Read these in order:
1. [Architecture Overview](../architecture/overview)
2. [Privacy Model](../architecture/privacy-model)
3. [Data Model](../architecture/data-model)

## Your First Week

### Day 1-2: Environment & Reading

- Complete dev setup
- Read all Getting Started docs
- Read Architecture docs
- Explore the codebase

### Day 3-4: First Task

- Pick up a "good first issue" from GitHub
- See [First Task Guide](./first-task)

### Day 5: Review & Questions

- Submit your first PR
- Document any questions
- Schedule 1:1 with team lead

## Key Concepts to Understand

### Privacy by Design

Everything we build must preserve user privacy:
- No names revealed, ever
- Hashed IDs everywhere
- Encrypted PII
- Minimum threshold (3 connections) for alerts

### The Graph Model

Users form a connection graph. Exposure calculation traverses this graph to find potential STI transmission paths.

```
User A ─── User B ─── User C (HIV+)
           │
           User D
```

User A has a "2nd degree" exposure through User B.

### Inference Attack Prevention

We prevent users from deducing who reported positive:
- Batched notifications (weekly, not real-time)
- Minimum 3 connections for specific alerts
- Aggregate statistics only

## Who to Ask

| Topic | Contact |
|-------|---------|
| Architecture | TBD |
| Backend | TBD |
| Frontend | TBD |
| Product | TBD |
| Security/Privacy | TBD |

## Resources

- Product Requirements: See `CONTEXT.md` in project root for location
- [Architecture Docs](../architecture/overview)
- [API Reference](../api/overview)
