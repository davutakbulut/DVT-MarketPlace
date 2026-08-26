"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Truck, 
  Percent, RefreshCw, ArrowUpRight, CheckCircle2, ShieldCheck, 
  Layers, Package, Calendar, Award, ExternalLink, Users, Eye,
  Clock, Store, Filter, PieChart as PieIcon, BarChart3, Activity
} from "lucide-react";
import Link from "next/link";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { useDateStore } from "@/store/useDateStore";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { period, startDate, endDate, label } = useDateStore();
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      let url = `/api/dashboard?period=${period}&storeId=${selectedStore}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
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
  }, [period, startDate, endDate, selectedStore]);

  const d = data || {};
  const monthlyTrends = d.monthlyTrends || [];
  const topProducts = d.topProducts || [];
  const recentOrders = d.recentOrders || [];
  const carrierDistribution = d.carrierDistribution || [];
  const hourlyDistribution = d.hourlyDistribution || [];
  const stores = d.stores || [];

  const grossRev = parseFloat(d.invoicedRevenue || 1);
  const costBreakdownData = [
    { name: "Net Nakit Kâr", value: parseFloat(d.netProfit || 0), color: "#10B981" },
    { name: "Pazaryeri Komisyonu", value: parseFloat(d.commissionTotal || 0), color: "#F59E0B" },
    { name: "Kargo Gideri", value: parseFloat(d.shippingTotal || 0), color: "#38BDF8" },
    { name: "Ürün Alış (COGS)", value: Math.max(0, grossRev - parseFloat(d.grossProfit || 0)), color: "#EF4444" },
    { name: "Hizmet Bedeli", value: parseFloat(d.serviceFeeTotal || 0), color: "#8B5CF6" },
    { name: "Vergi & Stopaj", value: parseFloat(d.taxesTotal || 0), color: "#64748B" },
  ].filter(x => x.value > 0);

  const hourlyChartData = Array.from({ length: 24 }).map((_, h) => {
    const hData = hourlyDistribution.find((x: any) => x.hour === h) || { orderCount: 0, revenue: 0, profit: 0 };
    return {
      hour: `${String(h).padStart(2, '0')}:00`,
      siparis: parseInt(hData.orderCount || 0),
      ciro: parseFloat(hData.revenue || 0),
      kar: parseFloat(hData.profit || 0),
    };
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner with Clean Responsive Layout */}
      <div className="flex items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-black text-dark">Trendyol Finansal Kontrol Paneli</h3>
            <Badge variant="excellent" className="text-[10px] sm:text-xs">Canlı Analitik</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            2.366 sipariş, kargo baremi, komisyon kesintileri ve interaktif kârlılık grafikleri
          </p>
        </div>

        {/* Action Group: Global Period Indicator on Large Screens & Unified Refresh Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas border border-border text-xs font-bold text-dark">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Dönem: {label}</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchDashboard}
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-2xl text-xs gap-1.5 font-bold bg-white hover:bg-canvas text-dark border-border shadow-xs cursor-pointer shrink-0"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Yenile</span>
          </Button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Invoiced Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Faturalanan Ciro</span>
            <div className="p-2 rounded-2xl bg-primary-tint-100 text-primary">
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
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200 bg-emerald-50/20 shadow-xs hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Net Nakit Kâr</span>
            <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-700">
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
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Komisyon & Hizmet</span>
            <div className="p-2 rounded-2xl bg-amber-100 text-amber-700">
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
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs hover:border-sky-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Kargo Giderleri</span>
            <div className="p-2 rounded-2xl bg-sky-100 text-sky-700">
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

      {/* CHARTS ROW 1: Monthly Trend Area Chart + Donut Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Monthly Revenue & Net Profit Area Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Aylık Ciro & Net Kâr Gelişimi (Mayıs - Ağustos 2026)
              </h4>
              <p className="text-[11px] text-gray-500">Aylar bazında ciro hacmi ve net kâr trendi</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-gray-600">Ciro (₺)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-emerald-700">Net Kâr (₺)</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF7855" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FF7855" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="monthKey" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} tickFormatter={(val) => `₺${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E5E7EB", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                    formatter={(val: any, name: string) => [formatCurrency(parseFloat(val || 0)), name === "revenue" ? "Toplam Ciro" : "Net Kâr"]}
                    labelFormatter={(label) => `Dönem: ${label}`}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#FF7855" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="revenue" />
                  <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name="profit" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Financial Cost Breakdown Donut Chart (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2 pb-2 border-b border-border">
              <PieIcon className="w-4 h-4 text-primary" />
              Gelir & Masraf Dağılım Pastası
            </h4>
            <p className="text-[11px] text-gray-500 mt-1">Cironun gider kalemleri ve net kâra oranı</p>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {costBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "0.75rem", border: "1px solid #E5E7EB" }}
                    formatter={(val: any) => [formatCurrency(parseFloat(val || 0)), "Tutar"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border text-[11px]">
            {costBreakdownData.map((c, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-gray-600 truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CHARTS ROW 2: Hourly 24-Hour Bar Chart + Carrier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Hourly 24-Hour Orders & Revenue Bar Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                24 Saatlik Sipariş Yoğunluğu & Ciro Grafiği
              </h4>
              <p className="text-[11px] text-gray-500">Günün saatlerine göre sipariş adedi ve oluşturulan ciro hacmi</p>
            </div>
          </div>

          <div className="h-60 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={10} tickLine={false} interval={2} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E5E7EB" }}
                    formatter={(val: any, name: string) => [
                      name === "siparis" ? `${val} Adet` : formatCurrency(parseFloat(val || 0)),
                      name === "siparis" ? "Sipariş Sayısı" : "Saatlik Ciro"
                    ]}
                  />
                  <Bar dataKey="siparis" fill="#FF7855" radius={[6, 6, 0, 0]} name="siparis" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Carrier Distribution Comparison (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Kargo Dağılımı
            </h4>
          </div>

          <div className="space-y-2.5">
            {carrierDistribution.map((c: any, idx: number) => (
              <div key={idx} className="p-3 rounded-2xl bg-canvas border border-border flex items-center justify-between text-xs hover:border-primary/30 transition-all">
                <div>
                  <span className="font-bold text-dark block">{c.carrier}</span>
                  <span className="text-[10px] text-gray-500">{c.orderCount} Sipariş • Ort. {c.avgDesi} Desi</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-primary block tabular-nums">{formatCurrency(parseFloat(c.totalShippingCost || 0))}</span>
                  <span className="text-[10px] font-bold text-emerald-700">Kâr: {formatCurrency(parseFloat(c.profit || 0))}</span>
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
