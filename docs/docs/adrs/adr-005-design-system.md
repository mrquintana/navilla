---
sidebar_position: 5
title: ADR-005 Design System
---

# ADR-005: Design System and Theme

## Status

Accepted

## Date

2026-01-31

## Context

We needed to establish a consistent design system for the Navilla frontend application that:
- Matches the documentation site style for brand consistency
- Is accessible and modern
- Integrates well with Tailwind CSS
- Provides a professional healthcare-oriented appearance

## Decision

### Color Palette

We adopted a **blue primary color** palette inspired by Docusaurus/Infima:

| Variable | Value | Usage |
|----------|-------|-------|
| `--color-primary` | `#2563eb` | Primary actions, links |
| `--color-primary-dark` | `#1d4ed8` | Hover states |
| `--color-primary-light` | `#3b82f6` | Highlights |

**Rationale:** Blue conveys trust and professionalism, appropriate for a health-related application. The same palette is used in both the documentation site and the main application for brand consistency.

### Button Styles

Buttons use an Infima-inspired style:
- **Border radius:** 50px (pill shape)
- **Font weight:** 700 (bold)
- **Padding:** Generous (1rem 2.5rem for large buttons)
- **Transitions:** Smooth color and shadow transitions

### Typography

System font stack matching Docusaurus:
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Component Patterns

- **Cards:** White background, subtle border, light shadow
- **Inputs:** Full-width, clear focus states with primary color
- **Hero sections:** Gradient background, centered content, prominent CTAs

## Consequences

### Positive
- Consistent brand identity across docs and app
- Professional, trustworthy appearance
- Works well with Tailwind CSS utility classes
- Accessible color contrast ratios

### Negative
- Custom CSS required alongside Tailwind
- Must manually keep docs and app themes in sync

## Implementation

- Frontend: `/frontend/src/index.css` using CSS custom properties
- Docs: `/docs/src/css/custom.css` using Infima variables
