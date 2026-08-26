"use client";
import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { reportCrash, reportPageAnalytics, reportClickEvent } from '@/lib/telemetry';

export function TelemetryTracker() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());
  const hasReportedLoadRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. GLOBAL CRASH / ERROR LISTENERS
    const handleGlobalError = (event: ErrorEvent) => {
      reportCrash({
        errorType: event.error?.name || 'Error',
        errorMessage: event.message || 'Bilinmeyen istemci hatası',
        stackTrace: event.error?.stack || '',
        pageUrl: window.location.pathname,
        componentName: 'WindowOnError',
        severity: 'critical',
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportCrash({
        errorType: 'UnhandledPromiseRejection',
        errorMessage: typeof event.reason === 'string' ? event.reason : (event.reason?.message || 'Promise reddedildi'),
        stackTrace: event.reason?.stack || '',
        pageUrl: window.location.pathname,
        componentName: 'UnhandledPromise',
        severity: 'error',
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // 2. CLICK HEATMAP TRACKER
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const rect = document.documentElement.getBoundingClientRect();
      const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      const docWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);

      const clickXPercent = Math.round(((e.pageX) / docWidth) * 10000) / 100;
      const clickYPercent = Math.round(((e.pageY) / docHeight) * 10000) / 100;

      const text = (target.innerText || target.getAttribute('placeholder') || target.getAttribute('aria-label') || target.tagName).slice(0, 80).trim();

      reportClickEvent({
        pageUrl: window.location.pathname,
        elementTag: target.tagName,
        elementId: target.id || undefined,
        elementClasses: target.className ? String(target.className).slice(0, 150) : undefined,
        elementText: text || undefined,
        clickXPercent,
        clickYPercent,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
    };

    document.addEventListener('click', handleDocumentClick, { passive: true });

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  // 3. PAGE LOAD PERFORMANCE & DWELL TIME
  useEffect(() => {
    startTimeRef.current = Date.now();
    hasReportedLoadRef.current = false;

    const timer = setTimeout(() => {
      if (!hasReportedLoadRef.current && typeof window !== 'undefined') {
        const perf = window.performance;
        let loadTime = 120;
        let ttfb = 30;
        let fcp = 75;
        let bytes = 150000;

        if (perf) {
          const navEntries = perf.getEntriesByType('navigation');
          if (navEntries.length > 0) {
            const nav = navEntries[0] as PerformanceNavigationTiming;
            loadTime = Math.round(nav.loadEventEnd || nav.duration || 120);
            ttfb = Math.round(nav.responseStart - nav.requestStart || 30);
            fcp = Math.round(nav.domContentLoadedEventEnd || 75);
            bytes = Math.round(nav.transferSize || 150000);
          }
        }

        reportPageAnalytics({
          pageUrl: pathname,
          pageTitle: document.title,
          dwellTimeSeconds: 0,
          loadTimeMs: Math.max(40, loadTime),
          ttfbMs: Math.max(10, ttfb),
          fcpMs: Math.max(25, fcp),
          dataTransferBytes: Math.max(50000, bytes),
          apiCallsCount: 3,
          errorsCount: 0,
        });
        hasReportedLoadRef.current = true;
      }
    }, 1500);

    return () => {
      clearTimeout(timer);
      const dwellSeconds = Math.round(((Date.now() - startTimeRef.current) / 1000) * 10) / 10;
      if (dwellSeconds > 1) {
        reportPageAnalytics({
          pageUrl: pathname,
          pageTitle: document.title,
          dwellTimeSeconds: dwellSeconds,
          loadTimeMs: 0,
        });
      }
    };
  }, [pathname]);

  return null;
}
