/**
 * Minimal client-side error reporting.
 *
 * Backend logs only cover the API — without this hook, production frontend
 * failures die silently in users' browsers. Uncaught errors and unhandled
 * rejections are posted fire-and-forget to a public endpoint that turns them
 * into a single WARN log line (visible in Loki/Grafana).
 *
 * Deliberately not a Sentry-style SDK: no breadcrumbs, no user context, no
 * persistence. Privacy-first product — the report carries only the error
 * itself, the page URL, and the user agent.
 */

import { API_URL } from './api';
import { E2E_MODE } from './e2eMocks';
import { env } from './env';

export interface ClientErrorReport {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
}

interface ReportContext {
  url?: string;
  userAgent?: string;
}

export const MAX_REPORTS_PER_SESSION = 10;

// Mirror the backend DTO caps (ClientErrorRequest) so reports always validate.
const MAX_MESSAGE = 500;
const MAX_STACK = 5000;
const MAX_URL = 500;
const MAX_USER_AGENT = 300;

/**
 * Creates a reporter that dedupes messages and stops after maxReports, so a
 * render-loop error cannot flood the backend. The send function is injected
 * to keep this logic free of fetch/window (testable, RN-portable).
 */
export function createErrorReporter(
  send: (report: ClientErrorReport) => void,
  context: () => ReportContext = () => ({}),
  maxReports: number = MAX_REPORTS_PER_SESSION
) {
  const seen = new Set<string>();
  let sent = 0;

  return {
    report(message: string | undefined, stack?: string): boolean {
      if (!message || sent >= maxReports || seen.has(message)) {
        return false;
      }
      seen.add(message);
      sent += 1;
      const ctx = context();
      send({
        message: message.slice(0, MAX_MESSAGE),
        stack: stack?.slice(0, MAX_STACK),
        url: ctx.url?.slice(0, MAX_URL),
        userAgent: ctx.userAgent?.slice(0, MAX_USER_AGENT),
      });
      return true;
    },
  };
}

function postReport(report: ClientErrorReport): void {
  // keepalive lets the request survive page unloads; failures are swallowed —
  // error reporting must never generate its own errors.
  void fetch(`${API_URL}/api/public/client-errors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Wires window error events to the reporter. Call once from main.tsx.
 * No-op during local dev, E2E runs, and prerendering.
 */
export function initErrorReporting(): void {
  if (env.DEV || E2E_MODE || typeof window === 'undefined') {
    return;
  }

  const reporter = createErrorReporter(postReport, () => ({
    url: window.location.href,
    userAgent: navigator.userAgent,
  }));

  window.addEventListener('error', (event) => {
    reporter.report(event.message || 'Unknown error', event.error?.stack);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason: unknown = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    reporter.report(
      `Unhandled rejection: ${message}`,
      reason instanceof Error ? reason.stack : undefined
    );
  });
}
