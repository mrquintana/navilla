---
sidebar_position: 5
title: Styling
---

# Styling Guide

:::note Work in Progress
This documentation will be updated as the frontend is implemented.
:::

## TailwindCSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        foreground: '#1A1A1A',
        muted: '#666666',
        border: '#E5E5E5',
        accent: '#333333',
        success: '#2D5A3D',
        warning: '#8B7355',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| Minimal | Black & white, shadows, no clutter |
| Clinical | Professional, healthcare-appropriate |
| Calming | No alarming reds, neutral tones |
| Accessible | High contrast, readable fonts |
