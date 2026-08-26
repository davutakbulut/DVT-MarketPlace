export interface CrashReportPayload {
  errorType?: string;
  errorMessage: string;
  stackTrace?: string;
  pageUrl?: string;
  componentName?: string;
  severity?: 'critical' | 'error' | 'warning';
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface PageAnalyticsPayload {
  pageUrl: string;
  pageTitle?: string;
  dwellTimeSeconds?: number;
  loadTimeMs?: number;
  ttfbMs?: number;
  fcpMs?: number;
  dataTransferBytes?: number;
  apiCallsCount?: number;
  errorsCount?: number;
}

export interface ClickEventPayload {
  pageUrl: string;
  elementTag: string;
  elementId?: string;
  elementClasses?: string;
  elementText?: string;
  clickXPercent?: number;
  clickYPercent?: number;
  viewportWidth?: number;
  viewportHeight?: number;
}

/**
 * Client-side Crash Reporter via Fetch
 */
export async function reportClientCrash(payload: CrashReportPayload) {
  if (typeof window === 'undefined') return;

  try {
    const body = {
      error_type: payload.errorType || 'ClientError',
      error_message: payload.errorMessage,
      stack_trace: payload.stackTrace || '',
      page_url: payload.pageUrl || window.location.pathname,
      component_name: payload.componentName || 'UIComponent',
      severity: payload.severity || 'error',
      user_agent: navigator.userAgent,
      metadata: payload.metadata || {}
    };

    await fetch('/api/system/crash-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('Client telemetry transmission failed:', err);
  }
}

export const reportCrash = reportClientCrash;

/**
 * Report Page Analytics
 */
export async function reportPageAnalytics(payload: PageAnalyticsPayload) {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/system/analytics/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {}
}

/**
 * Report Click Event
 */
export async function reportClickEvent(payload: ClickEventPayload) {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/system/analytics/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clickEvent: payload }),
    });
  } catch {}
}

/**
 * Global Client Error Listener Init (Invoked once on app boot)
 */
export function initClientErrorTracker() {
  if (typeof window === 'undefined' || (window as any).__DVT_TRACKER_INITIALIZED__) return;
  (window as any).__DVT_TRACKER_INITIALIZED__ = true;

  // 1. Uncaught JS Runtime Errors
  window.addEventListener('error', (event) => {
    try {
      const msg = event.message || '';
      const fn = event.filename || '';
      if (
        msg.includes("startTime") ||
        msg.includes("reportAllChanges") ||
        fn.includes("chrome-extension") ||
        fn.includes("moz-extension")
      ) {
        return;
      }

      reportClientCrash({
        errorType: event.error?.name || 'UncaughtException',
        errorMessage: msg || 'Bilinmeyen istemci çalışma zamanı hatası',
        stackTrace: event.error?.stack || `${fn}:${event.lineno}:${event.colno}`,
        pageUrl: window.location.pathname,
        componentName: 'WindowGlobalError',
        severity: 'error',
        metadata: { lineno: event.lineno, colno: event.colno, filename: fn }
      });
    } catch {}
  });

  // 2. Unhandled Promise Rejections (Async/Await crashes)
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason;
      const errorMsg = reason instanceof Error ? reason.message : String(reason || 'Unhandled Promise Rejection');
      if (errorMsg.includes("startTime") || errorMsg.includes("reportAllChanges")) {
        return;
      }
      const stack = reason instanceof Error ? reason.stack : '';

      reportClientCrash({
        errorType: 'UnhandledPromiseRejection',
        errorMessage: errorMsg,
        stackTrace: stack,
        pageUrl: window.location.pathname,
        componentName: 'PromiseRejectionHandler',
        severity: 'warning',
        metadata: { reasonType: typeof reason }
      });
    } catch {}
  });

  console.log('🛡️ [DVT Telemetry] 24/7 Client Watchdog Aktif.');
}
