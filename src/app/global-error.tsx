"use client";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { reportCrash } from "@/lib/telemetry";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportCrash({
      errorType: 'GlobalAppCrash',
      errorMessage: error.message || 'Kritik uygulama seviyesi çökmesi',
      stackTrace: error.stack || (error.digest ? `Digest: ${error.digest}` : ''),
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : '/',
      componentName: 'RootGlobalErrorBoundary',
      severity: 'critical',
      metadata: { digest: error.digest }
    });
  }, [error]);

  return (
    <html lang="tr">
      <body className="bg-canvas text-dark min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-border shadow-2xl max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-dark">Sistem Güvenlik & İzolasyon Koruması</h3>
            <p className="text-xs text-gray-500">
              Beklenmeyen bir durum oluştu ancak verileriniz güvende ve hata günlüğe kaydedildi. Yeniden başlatma ile oturumunuza devam edebilirsiniz.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => reset()}
            className="text-xs font-bold gap-1.5 h-9 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white shadow-xs mx-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sistemi Yenile</span>
          </Button>
        </div>
      </body>
    </html>
  );
}
