"use client";
import React, { useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileCheck2, Search } from "lucide-react";

export default function SettlementDesiAuditPage() {
  const [activeTab, setActiveTab] = useState<"desi" | "settlement">("desi");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-dark">Hakediş & Desi Kontrolü</h3>
          <p className="text-xs text-muted-foreground">Pazaryeri kesintileri denetimi ve kargo desi aşım zararlarının tespiti</p>
        </div>
        <div className="flex bg-canvas p-1 rounded-2xl border border-border">
          <button
            onClick={() => setActiveTab("desi")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "desi" ? "bg-primary text-white shadow-xs" : "text-dark hover:bg-border/50"
            }`}
          >
            Desi Kontrolü (Aşım Tespiti)
          </button>
          <button
            onClick={() => setActiveTab("settlement")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "settlement" ? "bg-primary text-white shadow-xs" : "text-dark hover:bg-border/50"
            }`}
          >
            Hakediş Kesinti Bordrosu
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3 px-3">Sipariş No</th>
                <th className="pb-3 px-3">Ürün</th>
                <th className="pb-3 px-3">Katalog Desi</th>
                <th className="pb-3 px-3">Faturalanan Desi</th>
                <th className="pb-3 px-3">Beklenen Kargo</th>
                <th className="pb-3 px-3">Kesilen Kargo</th>
                <th className="pb-3 px-3">Desi Farkı Zararı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-canvas/50">
                <td className="py-3 px-3 font-mono font-bold text-dark">#TY-9921402</td>
                <td className="py-3 px-3 font-semibold">Hyaluronik Asit Nemlendirici Krem 50ml</td>
                <td className="py-3 px-3 font-bold tabular-nums">1.0 Desi</td>
                <td className="py-3 px-3 font-black text-red-600 tabular-nums">3.0 Desi</td>
                <td className="py-3 px-3 tabular-nums">₺45.00</td>
                <td className="py-3 px-3 font-bold text-red-600 tabular-nums">₺68.50</td>
                <td className="py-3 px-3"><Badge variant="danger">-₺23.50 Aşım Zararı</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
