---
sidebar_position: 1
title: Architecture Decision Records
---

# Architecture Decision Records (ADRs)

This section documents significant architectural decisions made during Navilla development.

## What is an ADR?

An Architecture Decision Record captures a significant architectural decision along with its context and consequences.

## ADR Template

```markdown
# ADR-XXX: Title

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing/making?

## Consequences
What becomes easier or more difficult because of this change?
```

## ADR Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](./adr-001-documentation-platform) | Documentation Platform | Accepted |
| [ADR-002](./adr-002-tech-stack) | Technology Stack | Accepted |

## Creating New ADRs

1. Copy the template above
2. Create new file: `adr-XXX-short-title.md`
3. Fill in all sections
4. Add to sidebar in `sidebars.ts`
5. Update the index table above
