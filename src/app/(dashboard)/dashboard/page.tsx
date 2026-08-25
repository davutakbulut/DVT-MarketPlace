"use client";
import React from "react";
import { KpiGrid } from "@/modules/dashboard/components/KpiGrid";
import { ProfitWaterfallFunnel } from "@/modules/dashboard/components/ProfitWaterfallFunnel";
import { WidgetErrorBoundary } from "@/components/feedback/WidgetErrorBoundary";
import { AlertTriangle, Package, ShoppingCart, RotateCcw, Megaphone, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";

export default function DashboardPage() {
  const mockData = {
    grossRevenue: 489240.50,
    costCoveredRevenue: 452100.00,
    grossProfit: 210450.00,
    netProfit: 114620.35,
    netProfitMargin: 23.43,
    netProfitMarkup: 48.12,
    shippingTotal: 42150.00,
    commissionTotal: 84600.00,
    taxesTotal: 47870.15,
  };

  return (
    <div className="space-y-6">
      {/* Missing Cost Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-amber-900">4 Adet Ürünün Maliyeti Henüz Girilmemiş!</h5>
            <p className="text-[11px] text-amber-800">Net kârınızın %100 doğru hesaplanabilmesi için eksik maliyetleri tamamlayın.</p>
          </div>
        </div>
        <Link
          href="/live-analysis"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors"
        >
          <span>Eksik Maliyetleri Gir</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main KPI Grid */}
      <WidgetErrorBoundary title="KPI Kartları">
        <KpiGrid data={mockData} />
      </WidgetErrorBoundary>

      {/* Charts & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetErrorBoundary title="Kâr Performans Hunisi">
          <ProfitWaterfallFunnel
            gross={mockData.grossRevenue}
            shipping={mockData.shippingTotal}
            commission={mockData.commissionTotal}
            taxes={mockData.taxesTotal}
            net={mockData.netProfit}
          />
        </WidgetErrorBoundary>

        {/* 12 Cost Slices Card */}
        <WidgetErrorBoundary title="Masraf Dağılımı">
          <div className="bg-white p-5 rounded-3xl border border-border flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-dark">Gider & Masraf Dağılımı (12 Kalem)</h4>
              <p className="text-xs text-muted-foreground mb-4">Pazaryeri komisyonları, kargo ve stopaj dökümü</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-canvas border border-border">
                  <span className="text-gray-500 text-[11px] block">Pazaryeri Komisyonu (%18.2)</span>
                  <span className="font-extrabold text-dark text-sm tabular-nums mt-0.5 block">{formatCurrency(mockData.commissionTotal)}</span>
                </div>
                <div className="p-3 rounded-xl bg-canvas border border-border">
                  <span className="text-gray-500 text-[11px] block">Kargo Taşıma Gideri</span>
                  <span className="font-extrabold text-dark text-sm tabular-nums mt-0.5 block">{formatCurrency(mockData.shippingTotal)}</span>
                </div>
                <div className="p-3 rounded-xl bg-canvas border border-border">
                  <span className="text-gray-500 text-[11px] block">Stopaj & Net KDV</span>
                  <span className="font-extrabold text-dark text-sm tabular-nums mt-0.5 block">{formatCurrency(mockData.taxesTotal)}</span>
                </div>
                <div className="p-3 rounded-xl bg-canvas border border-border">
                  <span className="text-gray-500 text-[11px] block">Pazaryeri Hizmet Bedeli</span>
                  <span className="font-extrabold text-dark text-sm tabular-nums mt-0.5 block">{formatCurrency(18420.00)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-border flex justify-between items-center text-xs">
              <span className="text-gray-500">Toplam Kesintiler Oranı:</span>
              <span className="font-bold text-red-600 text-sm">%42.8 Satış Payı</span>
            </div>
          </div>
        </WidgetErrorBoundary>
      </div>

      {/* 4 Metric Subcards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Satılan Ürün</span>
            <div className="text-lg font-bold text-dark tabular-nums mt-0.5">1,482 Adet</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Toplam Sipariş</span>
            <div className="text-lg font-bold text-dark tabular-nums mt-0.5">894 Paket</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">İade Zararı</span>
            <div className="text-lg font-bold text-dark tabular-nums mt-0.5">₺3,840.00</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Reklam Harcaması</span>
            <div className="text-lg font-bold text-dark tabular-nums mt-0.5">₺6,200.00</div>
          </div>
        </div>
      </div>
    </div>
  );
}
