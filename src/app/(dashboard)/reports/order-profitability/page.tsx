"use client";
import React from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download } from "lucide-react";

export default function OrderProfitabilityReportPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-dark">Sipariş Kârlılık Raporu</h3>
          <p className="text-xs text-muted-foreground">Tüm siparişlerin komisyon, kargo, vergi ve net kâr dökümü</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs font-semibold">
          <Download className="w-3.5 h-3.5" /> Excel İndir (Asenkron)
        </Button>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3 px-3">Sipariş No</th>
                <th className="pb-3 px-3">Tarih</th>
                <th className="pb-3 px-3">Tutar</th>
                <th className="pb-3 px-3">Maliyet</th>
                <th className="pb-3 px-3">Komisyon</th>
                <th className="pb-3 px-3">Kargo</th>
                <th className="pb-3 px-3">Net Kâr</th>
                <th className="pb-3 px-3">Kâr Marjı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-canvas/50">
                <td className="py-3 px-3 font-mono font-bold text-dark">#TY-9921401</td>
                <td className="py-3 px-3 text-gray-500">26 Ağu 2026, 01:45</td>
                <td className="py-3 px-3 font-bold tabular-nums">₺289.90</td>
                <td className="py-3 px-3 tabular-nums">₺65.00</td>
                <td className="py-3 px-3 tabular-nums">₺64.36</td>
                <td className="py-3 px-3 tabular-nums">₺45.00</td>
                <td className="py-3 px-3 font-extrabold text-emerald-600 tabular-nums">₺94.20</td>
                <td className="py-3 px-3"><Badge variant="excellent">%32.5</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
