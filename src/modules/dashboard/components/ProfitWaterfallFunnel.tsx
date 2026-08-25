"use client";
import React from "react";
import { formatCurrency } from "@/lib/formatters";

export function ProfitWaterfallFunnel({ gross, shipping, commission, taxes, net }: { gross: number; shipping: number; commission: number; taxes: number; net: number }) {
  const steps = [
    { label: "1. Toplam Brüt Satış Cirosu", val: gross, color: "bg-gray-900", percent: 100 },
    { label: "2. Kargo Kesintisi Düşülmüş Gelir", val: gross - shipping, color: "bg-blue-600", percent: ((gross - shipping) / gross) * 100 },
    { label: "3. Komisyon Düşülmüş Gelir", val: gross - shipping - commission, color: "bg-amber-600", percent: ((gross - shipping - commission) / gross) * 100 },
    { label: "4. Vergi (Stopaj & Net KDV) Düşülmüş Gelir", val: gross - shipping - commission - taxes, color: "bg-indigo-600", percent: ((gross - shipping - commission - taxes) / gross) * 100 },
    { label: "5. Nihai Net Cebe Kalan Kâr", val: net, color: "bg-primary", percent: (net / gross) * 100 },
  ];

  return (
    <div className="bg-white p-5 rounded-3xl border border-border">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
        <div>
          <h4 className="text-sm font-bold text-dark">Kâr Performans Hunisi (Waterfall)</h4>
          <p className="text-xs text-muted-foreground">Satıştan cebe giren net kâra kademeli nakit akışı</p>
        </div>
        <span className="text-xs font-bold text-primary tabular-nums">Net Kâr: {formatCurrency(net)}</span>
      </div>

      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-dark font-semibold">{s.label}</span>
              <span className="tabular-nums font-bold text-dark">{formatCurrency(s.val)}</span>
            </div>
            <div className="w-full bg-canvas rounded-full h-3 overflow-hidden border border-border/50">
              <div
                className={`h-full ${s.color} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.max(5, s.percent)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
