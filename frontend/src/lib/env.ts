/**
 * Safe access to Vite's import.meta.env.
 *
 * import.meta.env is injected by Vite at build time and is available in the
 * browser bundle. In Node.js contexts (tsx prerender, unit tests), it is
 * undefined. Use this helper instead of import.meta.env directly so that
 * lib files are safe to import during SSR prerender.
 */
const _env: Record<string, string | boolean | undefined> =
  (typeof import.meta !== 'undefined' && import.meta.env != null)
    ? (import.meta.env as Record<string, string | boolean | undefined>)
    : {};

export const env = {
  DEV: _env['DEV'] === true || _env['DEV'] === 'true',
  PROD: _env['PROD'] === true || _env['PROD'] === 'true',
  get: (key: string): string | undefined => _env[key] as string | undefined,
} as const;
