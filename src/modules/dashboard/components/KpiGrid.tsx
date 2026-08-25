"use client";
import React from "react";
import { ArrowUpRight } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface DashboardKpiProps {
  grossRevenue: number;
  costCoveredRevenue: number;
  grossProfit: number;
  netProfit: number;
  netProfitMargin: number;
  netProfitMarkup: number;
}

export function KpiGrid({ data }: { data: DashboardKpiProps }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-border shadow-xs">
        <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Toplam Ciro</span>
        <div className="text-base sm:text-lg font-extrabold text-dark tabular-nums mt-1">{formatCurrency(data.grossRevenue)}</div>
        <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
          <ArrowUpRight className="w-3 h-3" /> +14.2% canlı
        </div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-border shadow-xs">
        <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Maliyetli Ciro</span>
        <div className="text-base sm:text-lg font-extrabold text-dark tabular-nums mt-1">{formatCurrency(data.costCoveredRevenue)}</div>
        <div className="text-[10px] text-gray-500 font-medium mt-0.5">Maliyeti bilinen</div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-border shadow-xs">
        <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Brüt Kâr</span>
        <div className="text-base sm:text-lg font-extrabold text-dark tabular-nums mt-1">{formatCurrency(data.grossProfit)}</div>
        <div className="text-[10px] text-gray-500 font-medium mt-0.5">Gider öncesi</div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-primary-tint-200 bg-primary-tint-50/40 shadow-xs sm:col-span-1">
        <span className="text-[10px] sm:text-[11px] font-bold text-primary uppercase tracking-wide">Net Kârım (₺)</span>
        <div className="text-lg sm:text-xl font-black text-primary tabular-nums mt-1">{formatCurrency(data.netProfit)}</div>
        <div className="text-[10px] text-primary font-bold mt-0.5">Vergiler sonrası</div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-border shadow-xs">
        <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Kâr / Satış (%)</span>
        <div className="text-base sm:text-lg font-extrabold text-emerald-600 tabular-nums mt-1">{formatPercentage(data.netProfitMargin)}</div>
        <div className="text-[10px] text-gray-500 font-medium mt-0.5">Net Kâr Marjı</div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-border shadow-xs">
        <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Kâr / Maliyet (%)</span>
        <div className="text-base sm:text-lg font-extrabold text-emerald-600 tabular-nums mt-1">{formatPercentage(data.netProfitMarkup)}</div>
        <div className="text-[10px] text-gray-500 font-medium mt-0.5">Markup Kârlılığı</div>
      </div>
    </div>
  );
}
