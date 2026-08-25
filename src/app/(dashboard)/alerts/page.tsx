"use client";
import React from "react";
import { AlertOctagon, AlertTriangle, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AlertsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h3 className="text-lg font-bold text-dark">Akıllı Uyarı ve Anomali Listesi</h3>
        <p className="text-xs text-muted-foreground">Zararına yapılan satışlar, düşük marjlar ve eksik maliyet bildirimleri</p>
      </div>

      <div className="space-y-3">
        <div className="bg-red-50/50 border border-red-200 p-4 rounded-2xl flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h5 className="text-xs font-bold text-red-950">Zararına Satış Uyarısı (-₺18.40)</h5>
                <Badge variant="danger">Kritik</Badge>
              </div>
              <p className="text-xs text-red-900 mt-1">#TY-9921442 nolu siparişte komisyon ve kargo kesintileri sonrasında negatif kâr oluştu.</p>
            </div>
          </div>
          <Button size="sm" variant="destructive" className="h-8 text-xs font-bold shrink-0">
            Siparişi İncele
          </Button>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h5 className="text-xs font-bold text-amber-950">Düşük Kâr Marjı Uyarısı (%4.2)</h5>
                <Badge variant="warning">Uyarı</Badge>
              </div>
              <p className="text-xs text-amber-900 mt-1">#TY-9921390 nolu siparişte kâr marjınız belirlenen %15.0 güvenlik eşiğinin altında kaldı.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs font-bold shrink-0">
            Detay Gör
          </Button>
        </div>
      </div>
    </div>
  );
}
