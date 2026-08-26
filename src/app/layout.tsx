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
                  // Capture & suppress web-vitals / devtools startTime undefined errors
                  window.addEventListener('error', function(event) {
                    var msg = (event && event.message) ? event.message : '';
                    var fn = (event && event.filename) ? event.filename : '';
                    if (
                      msg.indexOf('startTime') !== -1 || 
                      msg.indexOf('reportAllChanges') !== -1 ||
                      fn.indexOf('chrome-extension') !== -1 ||
                      fn.indexOf('moz-extension') !== -1
                    ) {
                      if (event.preventDefault) event.preventDefault();
                      if (event.stopPropagation) event.stopPropagation();
                      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
                      return true;
                    }
                  }, true);

                  window.addEventListener('unhandledrejection', function(event) {
                    var reason = event && event.reason;
                    var msg = (typeof reason === 'string') ? reason : (reason && reason.message ? reason.message : '');
                    if (msg.indexOf('startTime') !== -1 || msg.indexOf('reportAllChanges') !== -1) {
                      if (event.preventDefault) event.preventDefault();
                      if (event.stopPropagation) event.stopPropagation();
                      return true;
                    }
                  }, true);
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
