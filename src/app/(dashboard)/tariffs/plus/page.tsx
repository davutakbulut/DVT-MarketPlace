"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PlusTariffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-dark">Plus Komisyon Tarifesi Simülatörü</h3>
        <p className="text-xs text-muted-foreground">Trendyol Plus indirimli komisyon baremleri ve net kâr artış analizi</p>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3 px-3">Ürün</th>
                <th className="pb-3 px-3">Mevcut Fiyat</th>
                <th className="pb-3 px-3">Plus Fiyatı</th>
                <th className="pb-3 px-3">Komisyon İndirimi</th>
                <th className="pb-3 px-3">Net Kâr Değişimi</th>
                <th className="pb-3 px-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-canvas/50">
                <td className="py-3 px-3 font-semibold">C Vitamini Aydınlatıcı Yüz Serumu 30ml</td>
                <td className="py-3 px-3 font-bold tabular-nums">₺219.00 (%18)</td>
                <td className="py-3 px-3 font-extrabold text-primary tabular-nums">₺197.10</td>
                <td className="py-3 px-3 font-bold text-emerald-600">%12.0 (%6 İndirim)</td>
                <td className="py-3 px-3 font-black text-emerald-600 tabular-nums">+₺16.57 Kâr Artışı</td>
                <td className="py-3 px-3"><Badge variant="success">Avantajlı</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
