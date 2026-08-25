import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FF7855",
};

export const metadata: Metadata = {
  title: "DVT-MarketPlace | Pazaryeri Finansal Analiz ve Fiyatlandırma Sistemi",
  description: "Trendyol, Hepsiburada ve Amazon TR kârlılık takibi ve tersine fiyatlandırma motoru.",
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
      </head>
      <body className="antialiased font-sans bg-canvas text-dark selection:bg-primary-tint-200">
        {children}
      </body>
    </html>
  );
}
