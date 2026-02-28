/**
 * Layer 0 + Content page SSR prerender script
 *
 * Generates static HTML for public pages after `npm run build`.
 * Uses react-dom/server + StaticRouter + i18next — no Puppeteer, no extra deps.
 *
 * Usage:
 *   npm run prerender          # prerender only
 *   npm run build:full         # build then prerender
 *
 * Two categories of pages:
 *   1. Layer 0 tools (calculator, guides, testing-cost) — no i18n needed, English only
 *   2. Content pages (how-it-works, security, privacy, etc.) — use i18next for English SSR
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

// Layer 0 tool pages
import { WindowPeriodCalculatorPage } from '../src/pages/WindowPeriodCalculatorPage';
import { GuidesIndexPage } from '../src/pages/GuidesIndexPage';
import { GuideDetailPage } from '../src/pages/GuideDetailPage';
import { TestingCostPage } from '../src/pages/TestingCostPage';

// Content pages (use i18n)
import { HowItWorksPage } from '../src/pages/HowItWorksPage';
import { SecurityPage } from '../src/pages/SecurityPage';
import { PrivacyPage } from '../src/pages/PrivacyPage';
import { PrivacyPolicyPage } from '../src/pages/PrivacyPolicyPage';
import { TermsPage } from '../src/pages/TermsPage';
import { CookiePolicyPage } from '../src/pages/CookiePolicyPage';
import { HelpPage } from '../src/pages/HelpPage';
import { AboutPage } from '../src/pages/AboutPage';
import { ContactPage } from '../src/pages/ContactPage';
import { CareersPage } from '../src/pages/CareersPage';
import { StatusPage } from '../src/pages/StatusPage';
import { AccessibilityPage } from '../src/pages/AccessibilityPage';

// Locale data
import en_US from '../src/locales/en_US.json';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

// Initialize i18next for SSR (English only, no browser detection)
await i18n
  .use(initReactI18next)
  .init({
    resources: { en_US: { translation: en_US } },
    lng: 'en_US',
    fallbackLng: 'en_US',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

interface RouteConfig {
  path: string;
  Component: React.ComponentType;
  title: string;
  description: string;
  /** If true, wrap in I18nextProvider for SSR */
  needsI18n?: boolean;
}

const ROUTES: RouteConfig[] = [
  // ── Layer 0 tools ──────────────────────────────────────────────
  {
    path: '/calculator',
    Component: WindowPeriodCalculatorPage,
    title: 'Window Period Calculator — Navilla',
    description: 'Calculate when you can get tested for STIs after an exposure. Interactive tool based on CDC and WHO guidelines.',
  },
  {
    path: '/guides',
    Component: GuidesIndexPage,
    title: 'STI Guides — Symptoms, Testing & Treatment | Navilla',
    description: 'Clear, non-judgmental STI guides covering symptoms, testing, treatment, and prevention. Based on CDC and WHO data.',
  },
  {
    path: '/guide/chlamydia',
    Component: () => createElement(GuideDetailPage, { forcedSlug: 'chlamydia' }),
    title: 'Chlamydia Guide — Symptoms, Testing & Treatment | Navilla',
    description: 'Everything about chlamydia: transmission, symptoms, NAAT testing, antibiotic treatment, and prevention. Based on CDC guidelines.',
  },
  {
    path: '/guide/gonorrhea',
    Component: () => createElement(GuideDetailPage, { forcedSlug: 'gonorrhea' }),
    title: 'Gonorrhea Guide — Symptoms, Testing & Treatment | Navilla',
    description: 'Complete guide to gonorrhea: transmission, symptoms, NAAT testing, ceftriaxone treatment, and antibiotic resistance.',
  },
  {
    path: '/guide/syphilis',
    Component: () => createElement(GuideDetailPage, { forcedSlug: 'syphilis' }),
    title: 'Syphilis Guide — Stages, Testing & Treatment | Navilla',
    description: 'Complete guide to syphilis: primary, secondary, latent and tertiary stages, blood test window period, and penicillin treatment.',
  },
  {
    path: '/guide/hiv',
    Component: () => createElement(GuideDetailPage, { forcedSlug: 'hiv' }),
    title: 'HIV Guide — Testing, Treatment & Prevention | Navilla',
    description: 'Complete guide to HIV: transmission, Ag/Ab testing window period, antiretroviral therapy (ART), PrEP, and U=U.',
  },
  {
    path: '/guide/herpes',
    Component: () => createElement(GuideDetailPage, { forcedSlug: 'herpes' }),
    title: 'Herpes (HSV) Guide — Testing, Treatment & Prevention | Navilla',
    description: 'Complete guide to herpes simplex: HSV-1 vs HSV-2, blood test limitations, antiviral treatment, and daily suppressive therapy.',
  },
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
  {
    path: '/testing-cost',
    Component: TestingCostPage,
    title: 'STI Testing Costs in Mexico — Navilla',
    description: 'Compare STI testing costs across provider types in Mexico: CAPASITS, IMSS, private labs, clinics, and specialists.',
  },

  // ── Content pages (i18n) ───────────────────────────────────────
  {
    path: '/how-it-works',
    Component: HowItWorksPage,
    title: 'How Navilla Works — Your Private Sexual Health Companion',
    description: 'Learn how Navilla helps you track encounters, monitor your testing history, and stay informed with private tools, encrypted data, and anonymized exposure signals.',
    needsI18n: true,
  },
  {
    path: '/security',
    Component: SecurityPage,
    title: 'Security — Navilla',
    description: 'How Navilla encrypts and secures your data. Current encryption architecture and our roadmap toward end-to-end encryption.',
    needsI18n: true,
  },
  {
    path: '/privacy',
    Component: PrivacyPage,
    title: 'Privacy — Navilla',
    description: 'How Navilla protects your privacy by design. No tracking, no ads, encrypted health data.',
    needsI18n: true,
  },
  {
    path: '/privacy-policy',
    Component: PrivacyPolicyPage,
    title: 'Privacy Policy — Navilla',
    description: 'Navilla privacy policy. What data we collect, how we use it, and your rights.',
    needsI18n: true,
  },
  {
    path: '/terms',
    Component: TermsPage,
    title: 'Terms of Service — Navilla',
    description: 'Navilla terms of service. Rules for using the platform.',
    needsI18n: true,
  },
  {
    path: '/cookie-policy',
    Component: CookiePolicyPage,
    title: 'Cookie Policy — Navilla',
    description: 'How Navilla uses cookies. Minimal, privacy-first cookie policy.',
    needsI18n: true,
  },
  {
    path: '/help',
    Component: HelpPage,
    title: 'Help & FAQ — Navilla',
    description: 'Frequently asked questions about Navilla. Get help with your account, privacy, and features.',
    needsI18n: true,
  },
  {
    path: '/about',
    Component: AboutPage,
    title: 'About — Navilla',
    description: 'About Navilla. Our mission to make sexual health tools private, accessible, and non-judgmental.',
    needsI18n: true,
  },
  {
    path: '/contact',
    Component: ContactPage,
    title: 'Contact — Navilla',
    description: 'Get in touch with the Navilla team.',
    needsI18n: true,
  },
  {
    path: '/careers',
    Component: CareersPage,
    title: 'Careers — Navilla',
    description: 'Join the Navilla team. Open positions and how to apply.',
    needsI18n: true,
  },
  {
    path: '/status',
    Component: StatusPage,
    title: 'System Status — Navilla',
    description: 'Navilla system status and uptime information.',
    needsI18n: true,
  },
  {
    path: '/accessibility',
    Component: AccessibilityPage,
    title: 'Accessibility — Navilla',
    description: 'Navilla accessibility statement. WCAG 2.1 AA compliance and our commitment to inclusive design.',
    needsI18n: true,
  },
];

async function prerender() {
  if (ROUTES.length === 0) {
    console.log('[prerender] No routes configured.');
    return;
  }

  const template = readFileSync(resolve(distDir, 'index.html'), 'utf-8');
  let rendered = 0;

  for (const { path, Component, title, description, needsI18n } of ROUTES) {
    try {
      const page = createElement(Component);

      // Wrap in I18nextProvider if the component uses useTranslation
      const content = needsI18n
        ? createElement(I18nextProvider, { i18n }, page)
        : page;

      const body = renderToStaticMarkup(
        createElement(StaticRouter, { location: path }, content)
      );

      const html = template
        .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}" />`)
        .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`)
        .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}" />`)
        .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="https://www.navilla.app${path}" />`)
        .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}" />`)
        .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${description}" />`)
        .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

      const outDir = resolve(distDir, path.replace(/^\//, ''));
      mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, 'index.html'), html);
      console.log(`[prerender] ✓ ${path}`);
      rendered++;
    } catch (err) {
      console.error(`[prerender] ✗ ${path}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[prerender] Done — ${rendered}/${ROUTES.length} routes rendered.`);
}

prerender().catch((err) => {
  console.error('[prerender] Failed:', err);
  process.exit(1);
});
