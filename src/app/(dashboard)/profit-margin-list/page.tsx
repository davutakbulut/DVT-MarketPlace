"use client";
import React, { useState } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Percent, Filter, ArrowUpRight } from "lucide-react";

export default function ProfitMarginListPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-dark">Kâr Marjı Listesi</h3>
          <p className="text-xs text-muted-foreground">TSF Liste Fiyatı ile müşterinin gördüğü fiyat kıyası ve toplu marj analizi</p>
        </div>
        <Button className="text-xs font-semibold gap-1.5">
          <ArrowUpRight className="w-4 h-4" /> Toplu Fiyat Güncelle
        </Button>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3 px-3">Barkod / Model</th>
                <th className="pb-3 px-3">Ürün Adı</th>
                <th className="pb-3 px-3">TSF Liste Fiyatı</th>
                <th className="pb-3 px-3">Müşteri Fiyatı</th>
                <th className="pb-3 px-3">Maliyet</th>
                <th className="pb-3 px-3">Net Kâr</th>
                <th className="pb-3 px-3">Kâr Marjı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-canvas/50">
                <td className="py-3 px-3 font-mono font-bold">8690001001</td>
                <td className="py-3 px-3 font-semibold">Organik Argan Yağlı Saç Serumu 100ml</td>
                <td className="py-3 px-3 font-bold tabular-nums">₺320.00</td>
                <td className="py-3 px-3 font-extrabold text-primary tabular-nums">₺289.90</td>
                <td className="py-3 px-3 tabular-nums">₺65.00</td>
                <td className="py-3 px-3 font-bold text-emerald-600 tabular-nums">₺94.20</td>
                <td className="py-3 px-3"><Badge variant="excellent">%32.5</Badge></td>
              </tr>
              <tr className="hover:bg-canvas/50">
                <td className="py-3 px-3 font-mono font-bold">8690001002</td>
                <td className="py-3 px-3 font-semibold">C Vitamini Aydınlatıcı Yüz Serumu 30ml</td>
                <td className="py-3 px-3 font-bold tabular-nums">₺240.00</td>
                <td className="py-3 px-3 font-extrabold text-primary tabular-nums">₺219.00</td>
                <td className="py-3 px-3 tabular-nums">₺48.00</td>
                <td className="py-3 px-3 font-bold text-emerald-600 tabular-nums">₺62.40</td>
                <td className="py-3 px-3"><Badge variant="success">%28.5</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
