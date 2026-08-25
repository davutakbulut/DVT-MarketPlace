"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";

export default function AdvantageousBadgesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-dark">Avantajlı Ürün Etiketi Analizi</h3>
        <p className="text-xs text-muted-foreground">Avantaj, Çok Avantaj ve Süper Avantaj etiket eşiklerindeki kârlılık simülasyonu</p>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3 px-3">Ürün</th>
                <th className="pb-3 px-3">Avantaj Fiyatı</th>
                <th className="pb-3 px-3">Çok Avantaj Fiyatı</th>
                <th className="pb-3 px-3">Süper Avantaj Fiyatı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-canvas/50">
                <td className="py-3 px-3 font-semibold">Organik Argan Yağlı Saç Serumu 100ml</td>
                <td className="py-3 px-3 tabular-nums">₺275.00 <span className="text-emerald-600 font-bold">(₺86.40 Kâr)</span></td>
                <td className="py-3 px-3 tabular-nums">₺259.00 <span className="text-emerald-600 font-bold">(₺78.10 Kâr)</span></td>
                <td className="py-3 px-3 tabular-nums">₺239.00 <span className="text-amber-600 font-bold">(₺62.40 Kâr)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
