import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TelemetryTracker } from "@/components/common/TelemetryTracker";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FF7855",
};

export const metadata: Metadata = {
  title: "DVT MarketPlace | Akıllı Pazaryeri Finans & Kârlılık Zekası",
  description: "Trendyol, Hepsiburada ve Amazon TR için çoklu mağaza finansal yönetim, kargo barem denetimi, otomatik net kâr ve tersine fiyatlandırma motoru.",
  keywords: [
    "DVT MarketPlace", "Trendyol Kârlılık", "Pazaryeri Finans", 
    "Kargo Barem Desteği", "Komisyon Hesaplama", "E-Ticaret Net Kâr",
    "Tersine Fiyatlandırma", "Hakediş Denetimi"
  ],
  authors: [{ name: "Davut Akbulut" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 1. Direct window.onerror handler for VM and Chrome Extension errors
                  var origOnError = window.onerror;
                  window.onerror = function(msg, url, lineNo, columnNo, error) {
                    var strMsg = String(msg || '');
                    var strUrl = String(url || '');
                    if (
                      strMsg.indexOf('startTime') !== -1 || 
                      strMsg.indexOf('reportAllChanges') !== -1 ||
                      strUrl.indexOf('chrome-extension') !== -1 ||
                      strUrl.indexOf('moz-extension') !== -1 ||
                      strUrl.indexOf('VM') !== -1
                    ) {
                      return true; // Suppress
                    }
                    if (origOnError) return origOnError.apply(this, arguments);
                    return false;
                  };

                  // 2. Global Event Listener Capture
                  window.addEventListener('error', function(event) {
                    var msg = (event && event.message) ? String(event.message) : '';
                    var fn = (event && event.filename) ? String(event.filename) : '';
                    if (
                      msg.indexOf('startTime') !== -1 || 
                      msg.indexOf('reportAllChanges') !== -1 ||
                      fn.indexOf('chrome-extension') !== -1 ||
                      fn.indexOf('moz-extension') !== -1 ||
                      fn.indexOf('VM') !== -1
                    ) {
                      if (event.preventDefault) event.preventDefault();
                      if (event.stopPropagation) event.stopPropagation();
                      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
                      return true;
                    }
                  }, true);

                  window.addEventListener('unhandledrejection', function(event) {
                    var reason = event && event.reason;
                    var msg = (typeof reason === 'string') ? reason : (reason && reason.message ? String(reason.message) : '');
                    if (msg.indexOf('startTime') !== -1 || msg.indexOf('reportAllChanges') !== -1) {
                      if (event.preventDefault) event.preventDefault();
                      if (event.stopPropagation) event.stopPropagation();
                      return true;
                    }
                  }, true);

                  // 3. requestIdleCallback Safe Wrapper
                  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
                    var origRIC = window.requestIdleCallback;
                    window.requestIdleCallback = function(cb, opts) {
                      var safeCb = function(deadline) {
                        try {
                          return cb(deadline);
                        } catch (err) {
                          var errStr = String((err && err.message) || err || '');
                          if (errStr.indexOf('startTime') !== -1 || errStr.indexOf('reportAllChanges') !== -1) {
                            return;
                          }
                          console.warn('Silent idle error handled:', err);
                        }
                      };
                      return origRIC.call(this, safeCb, opts);
                    };
                  }

                  // 4. PerformanceObserver Guard: Ensure entries are never undefined
                  if (typeof window !== 'undefined' && typeof window.PerformanceObserver !== 'undefined') {
                    var OrigPerfObs = window.PerformanceObserver;
                    window.PerformanceObserver = function(callback) {
                      var guardedCallback = function(list, observer) {
                        try {
                          if (list && typeof list.getEntries === 'function') {
                            var rawEntries = list.getEntries() || [];
                            var validEntries = rawEntries.filter(function(e) { return e && typeof e.startTime !== 'undefined'; });
                            var safeList = {
                              getEntries: function() { return validEntries; },
                              getEntriesByName: function(name, type) { 
                                return (list.getEntriesByName(name, type) || []).filter(function(e) { return e && typeof e.startTime !== 'undefined'; }); 
                              },
                              getEntriesByType: function(type) { 
                                return (list.getEntriesByType(type) || []).filter(function(e) { return e && typeof e.startTime !== 'undefined'; }); 
                              }
                            };
                            return callback(safeList, observer);
                          }
                        } catch (err) {}
                        return callback(list, observer);
                      };
                      return new OrigPerfObs(guardedCallback);
                    };
                    window.PerformanceObserver.prototype = OrigPerfObs.prototype;
                    window.PerformanceObserver.supportedEntryTypes = OrigPerfObs.supportedEntryTypes;
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans bg-canvas text-dark selection:bg-primary-tint-200">
        <TelemetryTracker />
        {children}
      </body>
    </html>
  );
}
