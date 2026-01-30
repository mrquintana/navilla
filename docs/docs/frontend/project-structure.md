---
sidebar_position: 2
title: Project Structure
---

# Frontend Project Structure

:::note Work in Progress
This documentation will be updated as the frontend is implemented.
:::

## Directory Layout

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── ui/           # Base UI components
│   │   ├── layout/       # Layout components
│   │   └── features/     # Feature-specific components
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Connections.tsx
│   │   ├── Health.tsx
│   │   ├── Alerts.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useConnections.ts
│   │   └── useExposures.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```
