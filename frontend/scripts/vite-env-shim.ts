/**
 * Shim for import.meta.env in Node.js / tsx prerender context.
 *
 * Vite replaces import.meta.env at build time. When running tsx directly
 * (e.g. for SSR prerender), import.meta.env is undefined. This shim sets
 * it to an empty object so lib files that access import.meta.env don't crash.
 *
 * Loaded via: tsx --import ./scripts/vite-env-shim.ts
 */

// In ESM the import.meta object is sealed, but we can attach env via
// a global used by our guard pattern in lib files. For direct import.meta.env
// access we patch the env property if it doesn't exist.
if (typeof import.meta.env === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).env = {};
}
