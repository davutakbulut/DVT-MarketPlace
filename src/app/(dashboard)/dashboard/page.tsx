"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Truck, 
  Percent, RefreshCw, ArrowUpRight, CheckCircle2, ShieldCheck, 
  Layers, Package, Calendar, Award, ExternalLink, Users, Eye
} from "lucide-react";
import Link from "next/link";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch (e) {
      toast.error("Dashboard verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const d = data || {};
  const monthlyTrends = d.monthlyTrends || [];
  const topProducts = d.topProducts || [];
  const recentOrders = d.recentOrders || [];
  const carrierDistribution = d.carrierDistribution || [];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Trendyol Ana Mağaza Finansal Genel Bakış</h3>
            <Badge variant="excellent">4 Aylık Canlı Veri</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            2.366 sipariş, kargo baremi, komisyon kesintileri ve net nakit kârlılık göstergeleri
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchDashboard} className="h-8 sm:h-9 text-xs gap-1.5 font-bold">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </Button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Invoiced Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Faturalanan Ciro</span>
            <div className="p-1.5 rounded-xl bg-primary-tint-100 text-primary">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-primary tabular-nums mt-2">
            {formatCurrency(d.invoicedRevenue || 0)}
          </div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">
            {d.totalOrders || 0} Siparişten Toplandı
          </span>
        </div>

        {/* Net Cash Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Net Nakit Kâr</span>
            <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 tabular-nums mt-2">
            {formatCurrency(d.netProfit || 0)}
          </div>
          <span className="text-[11px] text-emerald-800 font-bold mt-1 block">
            Net Marj: %{d.netProfitMargin || 0}
          </span>
        </div>

        {/* Commission & Service Fee Total */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Komisyon & Hizmet</span>
            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-dark tabular-nums mt-2">
            {formatCurrency((d.commissionTotal || 0) + (d.serviceFeeTotal || 0))}
          </div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">
            ₺{formatCurrency(d.commissionTotal || 0)} Komisyon + ₺{formatCurrency(d.serviceFeeTotal || 0)} Hizmet
          </span>
        </div>

        {/* Shipping Total */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Kargo Giderleri</span>
            <div className="p-1.5 rounded-xl bg-sky-100 text-sky-700">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-dark tabular-nums mt-2">
            {formatCurrency(d.shippingTotal || 0)}
          </div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">
            Faturalanan Kargo Bedelleri
          </span>
        </div>

      </div>

      {/* Monthly Performance & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Monthly Performance Bar Table */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                4 Aylık Ciro ve Kâr Gelişimi (Mayıs - Ağustos 2026)
              </h4>
              <p className="text-[11px] text-gray-500">Trendyol mağazanızın aylık performans tablosu</p>
            </div>
          </div>

          <div className="space-y-3">
            {monthlyTrends.map((m: any, idx: number) => {
              const rev = parseFloat(m.revenue || 0);
              const prof = parseFloat(m.profit || 0);
              const margin = parseFloat(m.margin || 0);
              const maxRev = Math.max(...monthlyTrends.map((x: any) => parseFloat(x.revenue || 1)));
              const widthPct = Math.min(100, Math.max(10, Math.round((rev / maxRev) * 100)));

              return (
                <div key={idx} className="p-3 rounded-2xl bg-canvas border border-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-dark">{m.monthKey} ({m.orderCount} Sipariş)</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary tabular-nums">Ciro: {formatCurrency(rev)}</span>
                      <span className="font-black text-emerald-700 tabular-nums">Net Kâr: {formatCurrency(prof)}</span>
                      <Badge variant="excellent">%{margin}</Badge>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${widthPct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrier Distribution */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Kargo Dağılımı
            </h4>
          </div>

          <div className="space-y-2.5">
            {carrierDistribution.map((c: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-2xl bg-canvas border border-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-dark block">{c.carrier}</span>
                  <span className="text-[10px] text-gray-500">{c.orderCount} Sipariş • Ort. {c.avgDesi} Desi</span>
                </div>
                <div className="text-right font-black text-primary tabular-nums">
                  {formatCurrency(parseFloat(c.totalShippingCost || 0))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Top Profitable Products & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Top Profitable Products */}
        <div className="lg:col-span-6 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              En Kârlı Ürünler
            </h4>
            <Link href="/profit-margin-list">
              <span className="text-xs text-primary font-bold hover:underline">Tümünü Gör ➔</span>
            </Link>
          </div>

          <div className="divide-y divide-border/60">
            {topProducts.map((p: any, idx: number) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="max-w-[240px]">
                  <span className="font-bold text-dark block truncate">{p.title}</span>
                  <span className="text-[10px] text-gray-400 font-mono">{p.barcode} • {p.totalQuantity} Adet Satıldı</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-700 block tabular-nums">{formatCurrency(parseFloat(p.totalProfit || 0))}</span>
                  <span className="text-[10px] font-bold text-gray-500">Marj: %{p.avgMargin}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders Feed */}
        <div className="lg:col-span-6 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Son Siparişler (Canlı Akış)
            </h4>
            <Link href="/live-analysis">
              <span className="text-xs text-primary font-bold hover:underline">Canlı Analiz ➔</span>
            </Link>
          </div>

          <div className="divide-y divide-border/60">
            {recentOrders.map((o: any) => (
              <div 
                key={o.id} 
                onClick={() => setSelectedOrderId(o.id)}
                className="py-2 flex items-center justify-between text-xs hover:bg-primary-tint-50/30 cursor-pointer p-1 rounded-xl transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-dark font-mono">{o.orderNumber}</span>
                    <span className="text-[10px] text-gray-400">{o.city}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 block truncate max-w-[180px]">{o.customerName}</span>
                </div>

                <div className="text-right flex items-center gap-2">
                  <div>
                    <span className="font-black text-primary block tabular-nums">₺{parseFloat(o.paidAmount || 0).toFixed(2)}</span>
                    <span className="text-[10px] font-black text-emerald-700 block">Kâr: ₺{parseFloat(o.netProfit || 0).toFixed(2)}</span>
                  </div>
                  <Eye className="w-3.5 h-3.5 text-gray-400 hover:text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onUpdated={fetchDashboard}
      />
    </div>
  );
}
