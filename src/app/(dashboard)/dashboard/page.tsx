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
  Clock, Store, Filter, PieChart as PieIcon, BarChart3, Activity,
  ChevronDown, ChevronUp, Receipt, Info
} from "lucide-react";
import Link from "next/link";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { useDateStore } from "@/store/useDateStore";
import { useTenantStore } from "@/stores/useTenantStore";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isExpensesExpanded, setIsExpensesExpanded] = useState(true);
  const { period, startDate, endDate, label } = useDateStore();
  const { activeStoreId } = useTenantStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      let url = `/api/dashboard?period=${period}&storeId=${activeStoreId}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast.error("Dashboard verileri yüklenemedi.");
      }
    } catch (e) {
      toast.error("Dashboard verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period, startDate, endDate, activeStoreId]);

  const d = data || {};
  const exp = d.expenses || {};
  const monthlyTrends = d.monthlyTrends || [];
  const topProducts = d.topProducts || [];
  const recentOrders = d.recentOrders || [];
  const carrierDistribution = d.carrierDistribution || [];
  const hourlyDistribution = d.hourlyDistribution || [];
  const dailyProfitTrends = d.dailyProfitTrends || [];
  const stores = d.stores || [];

  const grossRev = parseFloat(d.invoicedRevenue || 1);
  const costBreakdownData = [
    { name: "Net Nakit Kâr", value: parseFloat(d.netProfit || 0), color: "#10B981" },
    { name: "Pazaryeri Komisyonu", value: parseFloat(d.commissionTotal || 0), color: "#F59E0B" },
    { name: "Kargo Gideri", value: parseFloat(d.shippingTotal || 0), color: "#38BDF8" },
    { name: "Ürün Alış (COGS)", value: Math.max(0, grossRev - parseFloat(d.grossProfit || 0)), color: "#EF4444" },
    { name: `Ekstra Operasyon (%${d.extraOperationRate || 6})`, value: parseFloat(d.extraOperationTotal || 0), color: "#EC4899" },
    { name: "Hizmet Bedeli", value: parseFloat(d.serviceFeeTotal || 0), color: "#8B5CF6" },
    { name: "Vergi & Stopaj", value: parseFloat(d.taxesTotal || 0), color: "#64748B" },
  ].filter(x => x.value > 0);

  // 14 Masraf Kalemleri Donut Chart Data
  const donutExpensesList = [
    { id: "cogs", name: "Toplam Ürün Maliyeti (COGS)", value: exp.cogs || 0, color: "#F97316" },
    { id: "comm", name: "Toplam Komisyon", value: exp.commission || 0, color: "#0EA5E9" },
    { id: "ship", name: "Toplam Kargo Ücreti", value: exp.shipping || 0, color: "#22C55E" },
    { id: "retShip", name: "İade Kargo Zararı", value: exp.returnShippingLoss || 0, color: "#EF4444" },
    { id: "sFee", name: "Toplam Hizmet Bedeli", value: exp.serviceFee || 0, color: "#14B8A6" },
    { id: "intlSFee", name: "Uluslararası Hizmet Bedeli", value: exp.intlServiceFee || 0, color: "#8B5CF6" },
    { id: "intlOp", name: "Uluslararası Operasyon Bedeli", value: exp.intlOperationFee || 0, color: "#A855F7" },
    { id: "wTax", name: "Toplam Stopaj Kesintisi", value: exp.withholdingTax || 0, color: "#E11D48" },
    { id: "nVat", name: "Toplam Net KDV", value: exp.netVat || 0, color: "#64748B" },
    { id: "adSpend", name: "Toplam Reklam Harcaması", value: exp.adSpendCost || 0, color: "#EAB308" },
    { id: "penalty", name: "Toplam Ceza", value: exp.penaltyCost || 0, color: "#DC2626" },
    { id: "earlyPayout", name: "Toplam Erken Ödeme Kesintisi", value: exp.earlyPayoutCost || 0, color: "#D97706" },
    { id: "other", name: "Toplam Diğer Faturalar", value: exp.otherInvoices || 0, color: "#475569" },
    { id: "fixedExtra", name: `Sabit Maliyet / Ekstra Operasyon (%${exp.extraOperationRate || 6})`, value: exp.fixedExtraOperation || 0, color: "#EC4899" },
  ];

  const filteredDonutData = donutExpensesList.filter(x => x.value > 0);

  // Daily Spline Line Data
  const dailyChartData = dailyProfitTrends.map((pt: any) => ({
    date: pt.dayLabel || pt.fullDate,
    fullDate: pt.fullDate,
    kar: Math.round(parseFloat(pt.profit || 0)),
    ciro: Math.round(parseFloat(pt.revenue || 0)),
    siparis: parseInt(pt.orderCount || 0),
  }));

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
            {d.totalOrders || 0} sipariş, kargo baremi, komisyon kesintileri ve interaktif kârlılık grafikleri
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

      {/* ========================================================= */}
      {/* 1. TOP 4 MAIN KPI CARDS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Invoiced Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border-t-4 border-t-blue-500 border-x border-b border-border shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Maliyeti Olan Ciro</span>
            <div className="p-2 rounded-2xl bg-blue-50 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-black text-primary tabular-nums mt-1.5 truncate">
            {formatCurrency(d.grossRevenue || d.invoicedRevenue || 0)}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 mt-2 flex-wrap">
            <span className="text-red-600 font-semibold">🔴 -{formatCurrency(d.cancelledAmount || 0)} İptal</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">🔄 -{formatCurrency(d.returnedAmount || 0)} İade</span>
            <span>•</span>
            <span className="text-blue-600 font-semibold">🏷️ -{formatCurrency(d.discountAmount || 0)} İndirim</span>
          </div>
        </div>

        {/* Net Cash Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border-t-4 border-t-emerald-500 border-x border-b border-border shadow-xs hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Net Nakit Kâr</span>
            <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-black text-emerald-700 tabular-nums mt-1.5 truncate">
            {formatCurrency(d.netProfit || 0)}
          </div>
          <span className="text-[11px] text-emerald-800 font-bold mt-2 block">
            Net Marj: %{parseFloat(d.netProfitMargin || 0).toFixed(2)} (Tüm Giderler Düşüldü)
          </span>
        </div>

        {/* Commission & Service Fee Total */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border-t-4 border-t-amber-500 border-x border-b border-border shadow-xs hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Komisyon & Hizmet</span>
            <div className="p-2 rounded-2xl bg-amber-100 text-amber-700">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-black text-dark tabular-nums mt-1.5 truncate">
            {formatCurrency((d.commissionTotal || 0) + (d.serviceFeeTotal || 0))}
          </div>
          <span className="text-[11px] text-gray-500 font-semibold mt-2 block">
            {formatCurrency(d.commissionTotal || 0)} Komisyon + {formatCurrency(d.serviceFeeTotal || 0)} Hizmet
          </span>
        </div>

        {/* Shipping & Orders Total */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border-t-4 border-t-teal-500 border-x border-b border-border shadow-xs hover:border-sky-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Kargo & Toplam Sipariş</span>
            <div className="p-2 rounded-2xl bg-teal-50 text-teal-700">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-black text-dark tabular-nums mt-1.5 truncate">
            {d.totalOrders || 0} Paket
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 mt-2 flex-wrap">
            <span className="text-emerald-700 font-semibold">🟢 {d.activeOrders || 0} Aktif</span>
            <span>•</span>
            <span className="text-red-600 font-semibold">🔴 {d.cancelledOrders || 0} İptal</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">🔄 {d.returnedOrders || 0} İade</span>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 2. COLLAPSIBLE CARD: 14 MASRAF KALEMLERİ (₺) + DONUT */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden transition-all">
        <div 
          onClick={() => setIsExpensesExpanded(!isExpensesExpanded)}
          className="p-4 sm:p-5 flex items-center justify-between bg-canvas/40 hover:bg-canvas/80 cursor-pointer border-b border-border/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Receipt className="w-4 h-4 text-primary" />
            <h4 className="text-sm sm:text-base font-black text-dark">Masraf Kalemleri (₺)</h4>
            <Badge variant="secondary" className="text-[10px] font-bold">14 Masraf Kalemi</Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-600">
              <span>Toplam Maliyet:</span>
              <strong className="text-dark font-black tabular-nums">{formatCurrency(exp.totalCostSum || 0)}</strong>
            </div>

            <Button size="sm" variant="ghost" className="h-7 text-xs font-bold gap-1 text-gray-600">
              <span>{isExpensesExpanded ? 'Alanı Daralt' : 'Detayları Göster'}</span>
              {isExpensesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {isExpensesExpanded && (
          <div className="p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left: Donut Chart with Center Total Cost Label */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-2 relative">
                <div className="h-64 w-64 relative flex items-center justify-center">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={filteredDonutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={105}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {filteredDonutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(val: any) => formatCurrency(parseFloat(val || 0))}
                          contentStyle={{ borderRadius: '16px', border: '1px solid #E5E7EB', fontWeight: 'bold', fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                    <span className="text-[11px] font-bold text-gray-500">Toplam Maliyet</span>
                    <span className="text-base sm:text-lg font-black text-dark tabular-nums mt-0.5">
                      {formatCurrency(exp.totalCostSum || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: 14 Expense Items Grid */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                  {donutExpensesList.map((item) => (
                    <div key={item.id} className="p-3 rounded-2xl bg-canvas/30 border border-border/80 hover:border-primary/30 transition-all space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[11px] font-bold text-gray-600 truncate" title={item.name}>{item.name}</span>
                      </div>
                      <div className="text-sm font-black text-dark tabular-nums pl-4">
                        {formatCurrency(item.value || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. CHART: GÜNLÜK KÂR PERFORMANSI (Spline Curve Trend) */}
      {/* ========================================================= */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📈</span>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-dark">Günlük Kâr Performansı</h4>
              <p className="text-[11px] text-gray-500">Dönem boyunca gün gün gerçekleşen net nakit kâr eğrisi</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">Net Kâr (₺)</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          {mounted && dailyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 'bold' }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 'bold' }}
                  tickFormatter={(v) => `₺${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => [formatCurrency(parseFloat(value || 0)), name === 'kar' ? 'Net Kâr' : name]}
                  labelFormatter={(lbl, items) => {
                    const item = items?.[0]?.payload;
                    return item ? `${item.fullDate || lbl} (${item.siparis || 0} Sipariş • Ciro: ${formatCurrency(item.ciro || 0)})` : lbl;
                  }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #E5E7EB', fontWeight: 'bold', fontSize: '11px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="kar" 
                  stroke="#10B981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#profitGrad)" 
                  dot={{ r: 3, fill: '#10B981', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                  activeDot={{ r: 6, fill: '#10B981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-bold text-gray-400">
              Seçili tarih aralığında günlük kâr verisi bulunamadı.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. CHARTS ROW 1 (3d9cc39): Monthly Trend + Cost Breakdown */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Monthly Revenue & Net Profit Area Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
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

          <div className="h-52 w-full flex items-center justify-center">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
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

      {/* ========================================================= */}
      {/* 5. CHARTS ROW 2 (3d9cc39): Hourly Bar Chart + Carrier Cards */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Hourly 24-Hour Orders & Revenue Bar Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
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

      {/* ========================================================= */}
      {/* 6. BOTTOM ROW (3d9cc39): Top Products & Recent Live Orders */}
      {/* ========================================================= */}
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
