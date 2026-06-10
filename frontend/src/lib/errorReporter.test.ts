import { describe, it, expect, vi } from 'vitest';
import { createErrorReporter, MAX_REPORTS_PER_SESSION } from './errorReporter';

describe('createErrorReporter', () => {
  it('sends a report with context and returns true', () => {
    const send = vi.fn();
    const reporter = createErrorReporter(send, () => ({
      url: 'https://www.navilla.app/dashboard',
      userAgent: 'TestAgent/1.0',
    }));

    const sent = reporter.report('TypeError: x is undefined', 'stack-trace');

    expect(sent).toBe(true);
    expect(send).toHaveBeenCalledWith({
      message: 'TypeError: x is undefined',
      stack: 'stack-trace',
      url: 'https://www.navilla.app/dashboard',
      userAgent: 'TestAgent/1.0',
    });
  });

  it('truncates fields to the backend DTO caps', () => {
    const send = vi.fn();
    const reporter = createErrorReporter(send, () => ({
      url: 'u'.repeat(600),
      userAgent: 'a'.repeat(400),
    }));

    reporter.report('m'.repeat(600), 's'.repeat(6000));

    const report = send.mock.calls[0][0];
    expect(report.message).toHaveLength(500);
    expect(report.stack).toHaveLength(5000);
    expect(report.url).toHaveLength(500);
    expect(report.userAgent).toHaveLength(300);
  });

  it('dedupes identical messages within a session', () => {
    const send = vi.fn();
    const reporter = createErrorReporter(send);

    expect(reporter.report('same error')).toBe(true);
    expect(reporter.report('same error')).toBe(false);

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('stops reporting after the per-session cap', () => {
    const send = vi.fn();
    const reporter = createErrorReporter(send, () => ({}), 3);

    for (let i = 0; i < 5; i++) {
      reporter.report(`error ${i}`);
    }

    expect(send).toHaveBeenCalledTimes(3);
    expect(reporter.report('one more')).toBe(false);
  });

  it('ignores empty and undefined messages', () => {
    const send = vi.fn();
    const reporter = createErrorReporter(send);

    expect(reporter.report('')).toBe(false);
    expect(reporter.report(undefined)).toBe(false);

    expect(send).not.toHaveBeenCalled();
  });

  it('exposes a sane default session cap', () => {
    expect(MAX_REPORTS_PER_SESSION).toBeGreaterThan(0);
    expect(MAX_REPORTS_PER_SESSION).toBeLessThanOrEqual(20);
  });
});
