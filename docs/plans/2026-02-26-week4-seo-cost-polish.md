# Week 4: SEO + Cost Estimator + Polish + Deploy — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Layer 0 with a testing cost estimator, full SEO infrastructure (JSON-LD, sitemap, OG image, prerender fixes), and conversion CTAs on every public tool page.

**Architecture:** New `TestingCostPage` follows the same pattern as `WindowPeriodCalculatorPage` — hero + body + CTA. Cost data lives in `stiContent.ts` alongside existing STI data. A shared `<SignUpCTA />` component replaces the inline CTA in `GuideDetailPage` and is added to all Layer 0 pages. JSON-LD is injected per-page via React 19 metadata hoisting.

**Tech Stack:** React 19, TypeScript, react-i18next, react-router-dom, lucide-react. No new dependencies.

---

## Task 1: Add cost tier data to stiContent.ts

**Files:**
- Modify: `frontend/src/lib/stiContent.ts`

**Step 1: Add the CostTier type and PROVIDER_TIERS constant**

Add after the `STIContent` interface (~line 53):

```typescript
export type CostTier = 'free' | '$' | '$$' | '$$$' | 'n/a';

export interface ProviderTier {
  key: string;
  label: { en: string; es: string };
  description: { en: string; es: string };
}

export const PROVIDER_TIERS: ProviderTier[] = [
  {
    key: 'capasits',
    label: { en: 'CAPASITS / SAI', es: 'CAPASITS / SAI' },
    description: {
      en: 'Government sexual health clinics. Free testing and treatment. Walk-in or by appointment.',
      es: 'Clínicas gubernamentales de salud sexual. Pruebas y tratamiento gratuitos. Sin cita o con cita.',
    },
  },
  {
    key: 'imss',
    label: { en: 'IMSS / ISSSTE', es: 'IMSS / ISSSTE' },
    description: {
      en: 'Social security hospitals. Free with coverage. Requires enrollment.',
      es: 'Hospitales de seguridad social. Gratis con cobertura. Requiere afiliación.',
    },
  },
  {
    key: 'private_lab',
    label: { en: 'Private Lab', es: 'Laboratorio Privado' },
    description: {
      en: 'Chopo, Olab, Salud Digna. Walk-in, fast results. Moderate cost.',
      es: 'Chopo, Olab, Salud Digna. Sin cita, resultados rápidos. Costo moderado.',
    },
  },
  {
    key: 'private_clinic',
    label: { en: 'Private Clinic', es: 'Clínica Privada' },
    description: {
      en: 'Private medical practices. Consultation + testing. Higher cost.',
      es: 'Consultorios médicos privados. Consulta + pruebas. Costo más alto.',
    },
  },
  {
    key: 'specialist',
    label: { en: 'Specialist', es: 'Especialista' },
    description: {
      en: 'Infectious disease or dermatology specialist. Highest cost.',
      es: 'Especialista en infectología o dermatología. Costo más alto.',
    },
  },
];
```

**Step 2: Add `costTiers` to each STI entry in STI_DATA**

Add a `costTiers` field to the `STIContent` interface:

```typescript
/** Cost tier per provider type (Mexico) */
costTiers?: Record<string, CostTier>;
```

Then add to each STI entry, e.g. for chlamydia:

```typescript
costTiers: {
  capasits: 'free',
  imss: 'free',
  private_lab: '$',
  private_clinic: '$$',
  specialist: '$$$',
},
```

Repeat for all 10 STIs. Most bacterial STIs follow the same pattern. HIV testing is free at CAPASITS. HPV has `n/a` for some tiers (no routine test for most people).

**Step 3: Commit**

```bash
git add frontend/src/lib/stiContent.ts
git commit -m "feat: add cost tier data and provider tiers to stiContent"
git push
```

---

## Task 2: Write TestingCostPage test

**Files:**
- Create: `frontend/src/pages/TestingCostPage.test.tsx`

**Step 1: Write the failing test**

```typescript
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { TestingCostPage } from './TestingCostPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <TestingCostPage />
    </MemoryRouter>
  );
}

describe('TestingCostPage', () => {
  it('renders the page title', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/testing cost/i);
  });

  it('renders all 10 STI names', () => {
    renderPage();
    expect(screen.getByText('Chlamydia')).toBeInTheDocument();
    expect(screen.getByText('HIV')).toBeInTheDocument();
    expect(screen.getByText('Syphilis')).toBeInTheDocument();
  });

  it('renders provider tier column headers', () => {
    renderPage();
    expect(screen.getByText('CAPASITS / SAI')).toBeInTheDocument();
    expect(screen.getByText('Private Lab')).toBeInTheDocument();
  });

  it('renders cost tier symbols', () => {
    renderPage();
    // At least some "Free" labels and "$" symbols should be present
    const freeLabels = screen.getAllByText('Free');
    expect(freeLabels.length).toBeGreaterThan(0);
  });

  it('renders provider footnotes', () => {
    renderPage();
    expect(screen.getByText(/government sexual health clinics/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/pages/TestingCostPage.test.tsx`
Expected: FAIL — module not found

**Step 3: Commit**

```bash
git add frontend/src/pages/TestingCostPage.test.tsx
git commit -m "test: add TestingCostPage tests (red)"
```

---

## Task 3: Implement TestingCostPage

**Files:**
- Create: `frontend/src/pages/TestingCostPage.tsx`
- Modify: `frontend/src/router.tsx` (add route)
- Modify: `frontend/src/index.css` (add styles)

**Step 1: Create TestingCostPage.tsx**

Follow the exact pattern of `WindowPeriodCalculatorPage`:
- React 19 metadata hoisting: `<title>`, `<meta name="description">`, `<link rel="canonical">`, `<link rel="alternate" hrefLang>`
- Hero section with `.landing-surface`
- Disclaimer
- Desktop: HTML `<table>` with STIs as rows, provider tiers as columns
- Mobile: card-per-STI layout (CSS `display: none` / `display: block` at breakpoint)
- Provider footnotes section below the table
- Import `STI_DATA`, `STI_ORDER`, `PROVIDER_TIERS` from `stiContent.ts`
- Use `useTranslation()` for i18n, `i18n.language` for lang detection
- Icon: `DollarSign` from lucide-react for the kicker

**Step 2: Add route to router.tsx**

Add after the `guide/:slug` route (line 85):

```typescript
import { TestingCostPage } from './pages/TestingCostPage';
// ...
{ path: 'testing-cost', element: <TestingCostPage /> },
```

**Step 3: Add CSS**

Add to `frontend/src/index.css` — follow the naming pattern of `.calculator-*` and `.guide-*`:
- `.cost-page`, `.cost-hero`, `.cost-body`
- `.cost-table` — standard table styling, warm stone borders
- `.cost-cell--free` (green), `.cost-cell--low` ($, muted), `.cost-cell--mid` ($$), `.cost-cell--high` ($$$, amber), `.cost-cell--na` (gray)
- `.cost-cards` — mobile card layout, hidden on desktop
- `.cost-footnotes` — provider descriptions

**Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/pages/TestingCostPage.test.tsx`
Expected: PASS

**Step 5: Run lint**

Run: `cd frontend && npm run lint`
Expected: Clean

**Step 6: Commit**

```bash
git add frontend/src/pages/TestingCostPage.tsx frontend/src/router.tsx frontend/src/index.css
git commit -m "feat: add TestingCostPage with provider tier cost table"
git push
```

---

## Task 4: Add locale keys for cost estimator

**Files:**
- Modify: `frontend/src/locales/en_US.json`
- Modify: `frontend/src/locales/es_MX.json`

**Step 1: Add keys to en_US.json**

```json
"cost.kicker": "Testing Costs",
"cost.title": "STI Testing Costs in Mexico",
"cost.subtitle": "Approximate cost tiers by provider type. Actual prices vary by location and test.",
"cost.disclaimer": "Costs are approximate and may vary. Contact providers directly for current pricing.",
"cost.free": "Free",
"cost.na": "N/A",
"cost.footnotesTitle": "Provider Types",
"cost.sourcesLabel": "Pricing data from publicly available clinic information, 2025–2026."
```

**Step 2: Add keys to es_MX.json**

```json
"cost.kicker": "Costos de Pruebas",
"cost.title": "Costos de Pruebas de ITS en México",
"cost.subtitle": "Rangos aproximados de costos por tipo de proveedor. Los precios reales varían por ubicación y prueba.",
"cost.disclaimer": "Los costos son aproximados y pueden variar. Contacta directamente a los proveedores para precios actuales.",
"cost.free": "Gratis",
"cost.na": "N/A",
"cost.footnotesTitle": "Tipos de Proveedores",
"cost.sourcesLabel": "Datos de precios de información pública de clínicas, 2025–2026."
```

**Step 3: Commit**

```bash
git add frontend/src/locales/en_US.json frontend/src/locales/es_MX.json
git commit -m "feat: add cost estimator locale keys (en_US + es_MX)"
git push
```

---

## Task 5: Create shared SignUpCTA component

**Files:**
- Create: `frontend/src/components/layer0/SignUpCTA.tsx`
- Create: `frontend/src/components/layer0/SignUpCTA.test.tsx`

**Step 1: Write the failing test**

```typescript
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { SignUpCTA } from './SignUpCTA';

// Mock useAuthOptional
vi.mock('../../contexts/AuthContext', () => ({
  useAuthOptional: vi.fn(),
}));
import { useAuthOptional } from '../../contexts/AuthContext';

describe('SignUpCTA', () => {
  it('renders when user is not authenticated', () => {
    (useAuthOptional as ReturnType<typeof vi.fn>).mockReturnValue({ session: null });
    render(
      <MemoryRouter>
        <SignUpCTA
          titleEn="Track your testing history"
          titleEs="Lleva un registro de tus pruebas"
          bodyEn="Log results and see risk signals — privately."
          bodyEs="Registra resultados y ve señales de riesgo — de forma privada."
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Track your testing history')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create free account/i })).toHaveAttribute('href', '/signup');
  });

  it('does not render when user is authenticated', () => {
    (useAuthOptional as ReturnType<typeof vi.fn>).mockReturnValue({ session: { access_token: 'x' } });
    render(
      <MemoryRouter>
        <SignUpCTA
          titleEn="Track your testing history"
          titleEs="Lleva un registro"
          bodyEn="Log results."
          bodyEs="Registra resultados."
        />
      </MemoryRouter>
    );
    expect(screen.queryByText('Track your testing history')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/layer0/SignUpCTA.test.tsx`
Expected: FAIL

**Step 3: Implement SignUpCTA**

```typescript
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { useAuthOptional } from '../../contexts/AuthContext';
import type { Lang } from '../../lib/stiContent';

interface SignUpCTAProps {
  titleEn: string;
  titleEs: string;
  bodyEn: string;
  bodyEs: string;
}

export function SignUpCTA({ titleEn, titleEs, bodyEn, bodyEs }: SignUpCTAProps) {
  const { i18n } = useTranslation();
  const lang: Lang = i18n.language?.startsWith('es') ? 'es' : 'en';
  const session = useAuthOptional()?.session ?? null;

  if (session) return null;

  return (
    <div className="guide-cta">
      <h3>{lang === 'es' ? titleEs : titleEn}</h3>
      <p>{lang === 'es' ? bodyEs : bodyEn}</p>
      <Link to="/signup" className="btn">
        {lang === 'es' ? 'Crear cuenta gratis' : 'Create free account'}
        <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
      </Link>
    </div>
  );
}
```

Reuses existing `.guide-cta` CSS (already styled).

**Step 4: Run tests**

Run: `cd frontend && npx vitest run src/components/layer0/SignUpCTA.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/layer0/SignUpCTA.tsx frontend/src/components/layer0/SignUpCTA.test.tsx
git commit -m "feat: add shared SignUpCTA component for Layer 0 pages"
git push
```

---

## Task 6: Wire SignUpCTA into all Layer 0 pages + cross-tool links

**Files:**
- Modify: `frontend/src/pages/GuideDetailPage.tsx` — replace inline CTA with `<SignUpCTA />`
- Modify: `frontend/src/pages/WindowPeriodCalculatorPage.tsx` — add `<SignUpCTA />` after the clinic CTA
- Modify: `frontend/src/pages/GuidesIndexPage.tsx` — add `<SignUpCTA />` after the calculator CTA + add link to `/testing-cost`
- Modify: `frontend/src/pages/TestingCostPage.tsx` — add `<SignUpCTA />` at bottom + add cross-link to `/calculator`

**Step 1: Replace GuideDetailPage inline CTA**

Replace lines 169–186 (the `{!session && ...}` block) with:
```tsx
<SignUpCTA
  titleEn="Track your testing history"
  titleEs="Lleva un registro de tus pruebas"
  bodyEn="With Navilla you can log your results and see risk signals in your network — privately."
  bodyEs="Con Navilla puedes registrar tus resultados y ver señales de riesgo en tu red — de forma privada."
/>
```
Remove the `useAuthOptional` import from this file (SignUpCTA handles it internally).

**Step 2: Add to WindowPeriodCalculatorPage**

After the clinic CTA section (~line 255), add:
```tsx
<SignUpCTA
  titleEn="Track your results over time"
  titleEs="Lleva un registro de tus resultados"
  bodyEn="Log your test results and get reminders when it's time to retest."
  bodyEs="Registra tus resultados y recibe recordatorios cuando sea hora de repetir la prueba."
/>
```

Also add a cross-tool link to `/testing-cost` (a small card below the clinic CTA or as a sibling):
```tsx
<div className="calculator-clinic-cta">
  <div className="calculator-clinic-cta-inner">
    <div>
      <h3>{t('cost.crossLinkTitle', 'Know when to test? See what it costs')}</h3>
      <p>{t('cost.crossLinkBody', 'Compare testing costs across provider types in Mexico.')}</p>
    </div>
    <Link to="/testing-cost" className="btn btn-secondary">
      {lang === 'es' ? 'Ver costos' : 'See costs'}
      <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
    </Link>
  </div>
</div>
```

**Step 3: Add to GuidesIndexPage**

After the existing calculator CTA block (~line 178), add:
1. A cross-link card to `/testing-cost` (same `.calculator-clinic-cta` pattern)
2. `<SignUpCTA />` at the bottom

**Step 4: Add to TestingCostPage**

Add at the bottom of the page body:
1. Cross-link to `/calculator`
2. `<SignUpCTA />`

**Step 5: Run all tests**

Run: `cd frontend && npx vitest run`
Expected: All pass

**Step 6: Run lint**

Run: `cd frontend && npm run lint`

**Step 7: Commit**

```bash
git add frontend/src/pages/GuideDetailPage.tsx frontend/src/pages/WindowPeriodCalculatorPage.tsx frontend/src/pages/GuidesIndexPage.tsx frontend/src/pages/TestingCostPage.tsx
git commit -m "feat: add SignUpCTA and cross-tool links to all Layer 0 pages"
git push
```

---

## Task 7: Add JSON-LD structured data

**Files:**
- Create: `frontend/src/lib/structuredData.ts`
- Create: `frontend/src/lib/structuredData.test.ts`
- Modify: `frontend/src/pages/GuideDetailPage.tsx`
- Modify: `frontend/src/pages/WindowPeriodCalculatorPage.tsx`
- Modify: `frontend/src/pages/GuidesIndexPage.tsx`
- Modify: `frontend/src/pages/TestingCostPage.tsx`

**Step 1: Write tests for structuredData helpers**

```typescript
import { describe, it, expect } from 'vitest';
import { buildMedicalWebPageLD, buildWebApplicationLD, buildCollectionPageLD, buildWebPageLD } from './structuredData';

describe('structuredData', () => {
  it('buildMedicalWebPageLD returns valid schema', () => {
    const result = buildMedicalWebPageLD({
      name: 'Chlamydia Guide',
      description: 'Everything about chlamydia',
      url: 'https://www.navilla.app/guide/chlamydia',
    });
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('MedicalWebPage');
    expect(result.name).toBe('Chlamydia Guide');
  });

  it('buildWebApplicationLD returns valid schema', () => {
    const result = buildWebApplicationLD({
      name: 'Window Period Calculator',
      description: 'Calculate testing windows',
      url: 'https://www.navilla.app/calculator',
    });
    expect(result['@type']).toBe('WebApplication');
  });
});
```

**Step 2: Implement structuredData.ts**

```typescript
interface PageMeta {
  name: string;
  description: string;
  url: string;
}

export function buildMedicalWebPageLD({ name, description, url }: PageMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name,
    description,
    url,
    medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
    specialty: { '@type': 'MedicalSpecialty', name: 'Infectious Disease' },
    publisher: { '@type': 'Organization', name: 'Navilla', url: 'https://www.navilla.app' },
  };
}

export function buildWebApplicationLD({ name, description, url }: PageMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    publisher: { '@type': 'Organization', name: 'Navilla', url: 'https://www.navilla.app' },
  };
}

export function buildCollectionPageLD({ name, description, url }: PageMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    publisher: { '@type': 'Organization', name: 'Navilla', url: 'https://www.navilla.app' },
  };
}

export function buildWebPageLD({ name, description, url }: PageMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    publisher: { '@type': 'Organization', name: 'Navilla', url: 'https://www.navilla.app' },
  };
}
```

**Step 3: Inject into each page**

In each page component, add inside the `<>` fragment (React 19 hoists it to `<head>`):

```tsx
<script type="application/ld+json">
  {JSON.stringify(buildMedicalWebPageLD({ name: metaTitle, description: metaDescription, url: `https://www.navilla.app/guide/${slug}` }))}
</script>
```

Use the appropriate builder per page:
- `GuideDetailPage` → `buildMedicalWebPageLD`
- `WindowPeriodCalculatorPage` → `buildWebApplicationLD`
- `GuidesIndexPage` → `buildCollectionPageLD`
- `TestingCostPage` → `buildWebPageLD`

**Step 4: Run tests**

Run: `cd frontend && npx vitest run src/lib/structuredData.test.ts`

**Step 5: Run lint**

Run: `cd frontend && npm run lint`

**Step 6: Commit**

```bash
git add frontend/src/lib/structuredData.ts frontend/src/lib/structuredData.test.ts frontend/src/pages/*.tsx
git commit -m "feat: add JSON-LD structured data to all Layer 0 pages"
git push
```

---

## Task 8: OG image + meta tag updates

**Files:**
- Create: `frontend/public/images/og-default.png` (1200x630 brand image)
- Modify: `frontend/index.html`
- Modify: `frontend/src/pages/GuideDetailPage.tsx`

**Step 1: Create OG image**

Generate a 1200x630 PNG: indigo-900 to indigo-600 gradient background, white Navilla logo/wordmark centered, tagline "Your private sexual health companion" below in white. Save as `frontend/public/images/og-default.png`.

This can be created with an SVG→PNG pipeline or a simple canvas script. For now, create it as an SVG first (`frontend/public/images/og-default.svg`) and convert.

**Step 2: Add og:image and twitter:image to index.html**

After the existing `og:description` line (~line 24), add:

```html
<meta property="og:image" content="https://www.navilla.app/images/og-default.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:image" content="https://www.navilla.app/images/og-default.png" />
```

Also change `twitter:card` from `summary` to `summary_large_image` (line 27):
```html
<meta name="twitter:card" content="summary_large_image" />
```

**Step 3: Override og:type on guide detail pages**

In `GuideDetailPage.tsx`, add inside the `<>` fragment:
```tsx
<meta property="og:type" content="article" />
```

**Step 4: Commit**

```bash
git add frontend/public/images/og-default.png frontend/index.html frontend/src/pages/GuideDetailPage.tsx
git commit -m "feat: add OG image and twitter:image meta tags"
git push
```

---

## Task 9: Update sitemap.xml

**Files:**
- Modify: `frontend/public/sitemap.xml`

**Step 1: Add all Layer 0 URLs**

Add these entries with `<lastmod>2026-02-26</lastmod>`:

```xml
<url>
  <loc>https://www.navilla.app/calculator</loc>
  <changefreq>monthly</changefreq>
  <priority>0.9</priority>
  <lastmod>2026-02-26</lastmod>
</url>
<url>
  <loc>https://www.navilla.app/guides</loc>
  <changefreq>monthly</changefreq>
  <priority>0.9</priority>
  <lastmod>2026-02-26</lastmod>
</url>
<url>
  <loc>https://www.navilla.app/testing-cost</loc>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
  <lastmod>2026-02-26</lastmod>
</url>
<url>
  <loc>https://www.navilla.app/guide/chlamydia</loc>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
  <lastmod>2026-02-26</lastmod>
</url>
<!-- ... repeat for all 10 guide slugs ... -->
```

All 10 guide slugs: `chlamydia`, `gonorrhea`, `syphilis`, `hiv`, `herpes`, `hpv`, `hepatitis_b`, `hepatitis_c`, `trichomoniasis`, `mycoplasma_genitalium`.

**Step 2: Add `<lastmod>` to existing entries**

Add `<lastmod>2026-02-26</lastmod>` to existing entries that are missing it.

**Step 3: Commit**

```bash
git add frontend/public/sitemap.xml
git commit -m "feat: update sitemap with all Layer 0 URLs"
git push
```

---

## Task 10: Fix prerender script

**Files:**
- Modify: `frontend/scripts/prerender.ts`

**Step 1: Add missing 5 guide routes**

Add to the `ROUTES` array (after the herpes entry, ~line 98):

```typescript
{
  path: '/guide/hpv',
  Component: () => createElement(GuideDetailPage, { forcedSlug: 'hpv' }),
  title: 'HPV Guide — What You Need to Know | Navilla',
  description: 'Guide to HPV: types, cancer risk, Gardasil vaccine, screening (Pap/HPV test), and prevention.',
},
{
  path: '/guide/hepatitis_b',
  Component: () => createElement(GuideDetailPage, { forcedSlug: 'hepatitis_b' }),
  title: 'Hepatitis B Guide — Testing, Vaccination & Treatment | Navilla',
  description: 'Complete guide to hepatitis B: transmission, HBsAg testing, vaccine, and antiviral treatment.',
},
{
  path: '/guide/hepatitis_c',
  Component: () => createElement(GuideDetailPage, { forcedSlug: 'hepatitis_c' }),
  title: 'Hepatitis C Guide — Testing & Cure | Navilla',
  description: 'Complete guide to hepatitis C: transmission, antibody testing, DAA cure, and prevention.',
},
{
  path: '/guide/trichomoniasis',
  Component: () => createElement(GuideDetailPage, { forcedSlug: 'trichomoniasis' }),
  title: 'Trichomoniasis Guide — Symptoms, Testing & Treatment | Navilla',
  description: 'Guide to trichomoniasis: symptoms, NAAT testing, metronidazole treatment, and prevention.',
},
{
  path: '/guide/mycoplasma_genitalium',
  Component: () => createElement(GuideDetailPage, { forcedSlug: 'mycoplasma_genitalium' }),
  title: 'Mycoplasma Genitalium Guide — Testing & Treatment | Navilla',
  description: 'Guide to Mycoplasma genitalium: symptoms, NAAT testing, resistance-guided therapy.',
},
```

**Step 2: Add TestingCostPage route**

Import and add:
```typescript
import { TestingCostPage } from '../src/pages/TestingCostPage';
// ...
{
  path: '/testing-cost',
  Component: TestingCostPage,
  title: 'STI Testing Costs in Mexico — Navilla',
  description: 'Compare STI testing costs across provider types in Mexico: CAPASITS, IMSS, private labs, clinics, and specialists.',
},
```

**Step 3: Update template replacement to inject OG tags**

Currently (line 115-118) only replaces `<title>` and `<meta name="description">`. Add replacement for `og:title` and `og:description`:

```typescript
const html = template
  .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}" />`)
  .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`)
  .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}" />`)
  .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="https://www.navilla.app${path}" />`)
  .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}" />`)
  .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${description}" />`)
  .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
```

**Step 4: Verify prerender works**

Run: `cd frontend && npm run build:full`
Expected: All 18 routes rendered (1 calculator + 1 guides + 10 guide slugs + 1 testing-cost + existing ones if any)

**Step 5: Commit**

```bash
git add frontend/scripts/prerender.ts
git commit -m "fix: add missing guide slugs + testing-cost to prerender, inject OG tags"
git push
```

---

## Task 11: Final verification + deploy

**Files:** None new

**Step 1: Run full test suite**

```bash
cd frontend && npx vitest run
```

Expected: All tests pass (including new TestingCostPage, SignUpCTA, structuredData tests)

**Step 2: Run lint**

```bash
cd frontend && npm run lint
```

Expected: Clean

**Step 3: Run full build + prerender**

```bash
cd frontend && npm run build:full
```

Expected: All routes prerender successfully

**Step 4: Spot-check prerendered HTML**

```bash
# Check OG tags in prerendered guide
grep 'og:title' frontend/dist/guide/chlamydia/index.html
grep 'og:image' frontend/dist/guide/chlamydia/index.html
grep 'application/ld+json' frontend/dist/guide/chlamydia/index.html

# Check sitemap has all URLs
grep -c '<url>' frontend/public/sitemap.xml
# Expected: ~22 (9 existing + 13 new)
```

**Step 5: Push to develop**

```bash
git push origin develop
```

**Step 6: Merge to main for Railway deploy**

```bash
git checkout main
git merge develop
git push origin main
git checkout develop
```

**Step 7: Update CONTEXT.md and roadmap**

- Add Week 4 session notes to CONTEXT.md
- Update progress snapshot in UPCOMING_FEATURES_AND_ROADMAP.md to mark Week 4 complete

**Step 8: Commit docs update**

```bash
git add CONTEXT.md UPCOMING_FEATURES_AND_ROADMAP.md
git commit -m "docs: mark Week 4 complete, log SEO + cost estimator implementation"
git push
```
