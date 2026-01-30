---
sidebar_position: 2
title: "ADR-001: Documentation Platform"
---

# ADR-001: Documentation Platform

## Status

Accepted

## Date

2026-01-30

## Context

Navilla needs a documentation platform that supports:
- Technical documentation (architecture, API, setup guides)
- Onboarding materials (new hire guides, codebase tours)
- Diagrams (architecture diagrams, flow charts)
- Easy contribution by developers
- Free hosting
- Search functionality

Options considered:
1. **Confluence** - Industry standard but paid, heavy
2. **Notion** - Easy to use but limited export, lock-in concerns
3. **MkDocs** - Python-based, good but less React integration
4. **GitBook** - Good free tier but external hosting
5. **Docusaurus** - React-based, excellent features, self-hosted

## Decision

Use **Docusaurus** for all project documentation.

### Reasons

1. **React-based**: Matches our frontend stack, developers already know React
2. **Markdown**: Easy to write, version controlled with code
3. **Mermaid support**: Built-in diagram support for architecture docs
4. **Free hosting**: Deploy to Vercel/GitHub Pages at no cost
5. **Search**: Built-in search via Algolia or local search
6. **Versioning**: Can version docs alongside releases
7. **Customizable**: Full control over styling and features

## Consequences

### Positive

- Documentation lives alongside code in the repository
- Developers familiar with React can contribute easily
- Free hosting on same platform as frontend (Vercel)
- Diagrams rendered as code (Mermaid), easy to update
- Full-text search available

### Negative

- Requires Node.js to build docs locally
- Learning curve for Docusaurus-specific features
- Need to maintain another package.json

### Neutral

- Documentation updates go through same PR process as code
- Docs deployed separately from main application
