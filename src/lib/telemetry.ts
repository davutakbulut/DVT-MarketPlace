"use client";

/**
 * DVT MarketPlace In-App Telemetry, Crash Reporting & Heatmap Tracker
 */

export interface CrashReportPayload {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  pageUrl: string;
  componentName?: string;
  severity?: 'critical' | 'error' | 'warning';
  metadata?: Record<string, any>;
}

export interface AnalyticsPayload {
  pageUrl: string;
  pageTitle?: string;
  dwellTimeSeconds: number;
  loadTimeMs: number;
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
  clickXPercent: number;
  clickYPercent: number;
  viewportWidth: number;
  viewportHeight: number;
}

// In-app error dispatcher
export async function reportCrash(payload: CrashReportPayload) {
  try {
    const body = JSON.stringify({
      error_type: payload.errorType,
      error_message: payload.errorMessage,
      stack_trace: payload.stackTrace,
      page_url: payload.pageUrl || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      component_name: payload.componentName || 'ClientGlobal',
      severity: payload.severity || 'error',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      metadata: payload.metadata || {},
    });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/system/crash-report', body);
    } else {
      await fetch('/api/system/crash-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    }
  } catch (err) {
    console.error('Telemetry report error:', err);
  }
}

// In-app page performance and dwell dispatcher
export async function reportPageAnalytics(payload: AnalyticsPayload) {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/system/analytics/collect', body);
    } else {
      await fetch('/api/system/analytics/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    }
  } catch (err) {
    console.error('Analytics report error:', err);
  }
}

// In-app click event dispatcher for heatmaps
export async function reportClickEvent(payload: ClickEventPayload) {
  try {
    const body = JSON.stringify({ clickEvent: payload });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/system/analytics/collect', body);
    } else {
      await fetch('/api/system/analytics/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    }
  } catch (err) {
    // Silently ignore telemetry click errors to not disturb UX
  }
}
