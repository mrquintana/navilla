# ADR-007: Icon Set

## Status
Accepted

## Context
The UI needs a consistent, minimalist icon system for navigation and UI accents. We want a free, lightweight option that looks modern, works well with React, and doesn’t add heavy styling or complex build steps.

## Decision
Adopt **Lucide** (`lucide-react`) as the standard icon set for the web app.

## Consequences
- **Pros:**
  - Clean, minimalist visuals that match the product style.
  - Tree-shakeable React package; only the icons we use are bundled.
  - Free (MIT) and widely adopted.
- **Cons:**
  - Adds a dependency to the frontend bundle.
  - Requires discipline to keep icon usage minimal and consistent.

## Usage Guidelines
- Use icons only where they aid scanning (nav, key actions, empty states).
- Keep size consistent (16px in nav, 18–20px in cards).
- Avoid mixing icon sets.
