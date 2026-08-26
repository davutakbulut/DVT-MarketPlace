"use client";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertOctagon, RefreshCw, Home, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard route error caught by Next.js Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
        <AlertOctagon className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-black text-dark">Bu Sayfa Yüklenirken Bir Sorun Oluştu</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Diğer tüm sayfalar ve arka plan servisleri güvenle çalışmaya devam etmektedir. Sayfayı yeniden yükleyerek oturumunuza devam edebilirsiniz.
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          size="sm"
          onClick={() => reset()}
          className="text-xs font-bold gap-1.5 h-9 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sayfayı Yeniden Dene</span>
        </Button>

        <Link href="/dashboard">
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold gap-1.5 h-9 px-4 rounded-xl bg-white hover:bg-canvas text-dark border-border"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Kontrol Paneline Dön</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
