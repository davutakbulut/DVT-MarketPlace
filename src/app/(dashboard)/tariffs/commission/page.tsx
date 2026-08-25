"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";

export default function CommissionTariffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-dark">Ürün Komisyon Tarifesi (4 Barem Simülatörü)</h3>
        <p className="text-xs text-muted-foreground">Fiyat aralıklarına göre kademeli komisyon oranları ve kâr farkı simülasyonu</p>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3 px-3">Ürün</th>
                <th className="pb-3 px-3">Mevcut Fiyat / Komisyon</th>
                <th className="pb-3 px-3">1. Barem Fiyatı</th>
                <th className="pb-3 px-3">2. Barem Fiyatı</th>
                <th className="pb-3 px-3">3. Barem Fiyatı</th>
                <th className="pb-3 px-3">Önerilen Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-canvas/50">
                <td className="py-3 px-3 font-semibold">Organik Argan Yağlı Saç Serumu 100ml</td>
                <td className="py-3 px-3 font-bold tabular-nums">₺289.90 (%18.5)</td>
                <td className="py-3 px-3 tabular-nums">₺249.90 (%14.0) <Badge variant="success" className="ml-1">+₺12.40 Kâr</Badge></td>
                <td className="py-3 px-3 tabular-nums">₺199.90 (%11.0)</td>
                <td className="py-3 px-3 tabular-nums">₺149.90 (%8.0)</td>
                <td className="py-3 px-3"><Button size="sm" className="h-7 text-[11px]">1. Bareme Geç</Button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
