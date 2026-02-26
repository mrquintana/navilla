/**
 * Layer 0 SSR prerender script
 *
 * Generates static HTML for public Layer 0 pages after `npm run build`.
 * Uses react-dom/server + StaticRouter — no Puppeteer, no extra deps.
 *
 * Usage:
 *   npm run prerender          # prerender only
 *   npm run build:full         # build then prerender
 *
 * RULES for Layer 0 page components (so this script works):
 *   - No import.meta.env — not available in Node.js
 *   - No auth hooks (useAuth, useSession) — public pages only
 *   - No React Query (useQuery) — static content only
 *   - No CSS file imports — use Tailwind classes only
 *   - No useTranslation — use hardcoded English for SSR output
 *
 * Add entries to ROUTES as pages are built in Weeks 2–4.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

interface RouteConfig {
  /** URL path, e.g. '/calculator' */
  path: string;
  /** The React component to render */
  Component: React.ComponentType;
  /** Page-specific <title> content */
  title: string;
  /** Page-specific <meta name="description"> content */
  description: string;
}

/**
 * Layer 0 routes to prerender.
 * Populate as pages are built in Weeks 2–4:
 *
 * import { CalculatorPage } from '../src/pages/layer0/CalculatorPage';
 * import { STIGuidePage } from '../src/pages/layer0/STIGuidePage';
 *
 * { path: '/calculator', Component: CalculatorPage, title: 'Window Period Calculator | Navilla', description: '...' },
 * { path: '/guide/chlamydia', Component: STIGuidePage, title: 'Chlamydia Guide | Navilla', description: '...' },
 * { path: '/clinics', Component: ClinicFinderPage, title: 'Find STI Clinics | Navilla', description: '...' },
 */
const ROUTES: RouteConfig[] = [];

async function prerender() {
  if (ROUTES.length === 0) {
    console.log('[prerender] No routes configured — add Layer 0 pages as they are built.');
    return;
  }

  const template = readFileSync(resolve(distDir, 'index.html'), 'utf-8');
  let rendered = 0;

  for (const { path, Component, title, description } of ROUTES) {
    const body = renderToStaticMarkup(
      createElement(StaticRouter, { location: path }, createElement(Component))
    );

    const html = template
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}" />`)
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

    const outDir = resolve(distDir, path.replace(/^\//, ''));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, 'index.html'), html);
    console.log(`[prerender] ✓ ${path}`);
    rendered++;
  }

  console.log(`[prerender] Done — ${rendered} routes rendered.`);
}

prerender().catch((err) => {
  console.error('[prerender] Failed:', err);
  process.exit(1);
});
