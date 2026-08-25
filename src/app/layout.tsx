import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DVT-MarketPlace | Pazaryeri Finansal Analiz ve Fiyatlandırma Sistemi",
  description: "Trendyol, Hepsiburada ve Amazon TR kârlılık takibi ve tersine fiyatlandırma motoru.",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
