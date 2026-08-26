"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatCurrencyNoCents, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Truck, 
  Percent, RefreshCw, ArrowUpRight, CheckCircle2, ShieldCheck, 
  Layers, Package, Calendar, Award, ExternalLink, Users, Eye,
  Clock, Store, Filter, PieChart as PieIcon, BarChart3, Activity,
  ChevronDown, ChevronUp, Receipt, Info, ShoppingBag, Zap, CalendarDays,
  Crown, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { OrderStatusBadge } from "@/components/common/OrderStatusBadge";
import { useDateStore } from "@/store/useDateStore";
import { useTenantStore } from "@/stores/useTenantStore";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isExpensesExpanded, setIsExpensesExpanded] = useState(false);
  const { period, startDate, endDate, label } = useDateStore();
  const { activeStoreId } = useTenantStore();
  const { user } = useAuth();
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
  const velocity = d.velocity || {};
  const weeklyTrends = d.weeklyTrends || [];
  const monthlyTrends = d.monthlyTrends || [];
  const topProducts = d.topProducts || [];
  const recentOrders = d.recentOrders || [];
  const carrierDistribution = d.carrierDistribution || [];
  const hourlyDistribution = d.hourlyDistribution || [];
  const dailyProfitTrends = d.dailyProfitTrends || [];
  const stores = d.stores || [];

  const grossRev = parseFloat(d.invoicedRevenue || 1);
  const costBreakdownData = [
    { name: "Net Nakit Kâr", value: Math.max(0, parseFloat(d.netProfit || 0)), color: "#10B981" },
    { name: "Pazaryeri Komisyonu", value: parseFloat(d.commissionTotal || 0), color: "#F59E0B" },
    { name: "Kargo Gideri", value: parseFloat(d.shippingTotal || 0), color: "#38BDF8" },
    { name: "Ürün Alış (COGS)", value: parseFloat(exp.cogs || Math.max(0, grossRev - parseFloat(d.grossProfit || 0))), color: "#EF4444" },
    { name: `Ekstra Operasyon (%${d.extraOperationRate || 6})`, value: parseFloat(d.extraOperationTotal || 0), color: "#EC4899" },
    { name: "Hizmet Bedeli", value: parseFloat(d.serviceFeeTotal || 0), color: "#8B5CF6" },
    { name: "Vergi & Stopaj", value: parseFloat(d.taxesTotal || 0), color: "#64748B" },
    { name: "Reklam Harcaması", value: parseFloat(exp.adSpendCost || 0), color: "#EAB308" },
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
      {/* Top Banner */}
      <div className="flex items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-black text-dark">Trendyol & Pazaryeri Finansal Kontrol Paneli</h3>
            <Badge variant="excellent" className="text-[10px] sm:text-xs">Canlı Veritabanı</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {d.totalOrders || 0} sipariş, kargo baremi, komisyon kesintileri, haftalık/aylık sipariş hızları ve kârlılık grafikleri
          </p>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas border border-border text-xs font-bold text-dark">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span suppressHydrationWarning>Dönem: {label}</span>
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
      {/* 1. TOP 5 FINANCIAL & VELOCITY KPI CARDS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Invoiced Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Faturalanan Ciro</span>
            <div className="p-2 rounded-2xl bg-primary-tint-100 text-primary">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg xs:text-xl sm:text-2xl font-black text-primary tabular-nums mt-1.5 truncate">
            {formatCurrencyNoCents(d.invoicedRevenue || 0)}
          </div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">
            {d.totalOrders || 0} Siparişten Toplandı
          </span>
        </div>

        {/* Net Cash Profit */}
        <div className={`bg-white p-4 sm:p-5 rounded-3xl border shadow-xs transition-all ${
          parseFloat(d.netProfit || 0) < 0 
            ? 'border-red-200 bg-red-50/20 hover:border-red-400' 
            : 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wide ${
              parseFloat(d.netProfit || 0) < 0 ? 'text-red-800' : 'text-emerald-800'
            }`}>
              {parseFloat(d.netProfit || 0) < 0 ? 'Net Nakit Zarar' : 'Net Nakit Kâr'}
            </span>
            <div className={`p-2 rounded-2xl ${
              parseFloat(d.netProfit || 0) < 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {parseFloat(d.netProfit || 0) < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-lg xs:text-xl sm:text-2xl font-black tabular-nums mt-1.5 truncate ${
            parseFloat(d.netProfit || 0) < 0 ? 'text-red-600' : 'text-emerald-700'
          }`}>
            {formatCurrencyNoCents(d.netProfit || 0)}
          </div>
          <span className={`text-[11px] font-bold mt-1 block ${
            parseFloat(d.netProfit || 0) < 0 ? 'text-red-800' : 'text-emerald-800'
          }`}>
            {parseFloat(d.netProfit || 0) < 0 ? 'Net Zarar Marjı' : 'Net Marj'}: %{d.netProfitMargin || 0}
          </span>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs hover:border-indigo-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Ort. Sepet Tutarı</span>
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg xs:text-xl sm:text-2xl font-black text-indigo-700 tabular-nums mt-1.5 truncate">
            {formatCurrency(d.avgOrderValue || (parseFloat(d.invoicedRevenue || 0) / (d.totalOrders || 1)))}
          </div>
          <span className="text-[11px] text-indigo-600 font-bold mt-1 block">
            Sipariş Başına (AOV)
          </span>
        </div>

        {/* Weekly Average Order Count */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs hover:border-sky-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Haftalık Ort. Sipariş</span>
            <div className="p-2 rounded-2xl bg-sky-50 text-sky-700">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg xs:text-xl sm:text-2xl font-black text-sky-800 tabular-nums mt-1.5 truncate">
            {velocity.avgWeeklyOrders || Math.round((d.totalOrders || 0) / Math.max(1, weeklyTrends.length))} Adet
          </div>
          <span className="text-[11px] text-sky-600 font-bold mt-1 block">
            {formatCurrencyNoCents(velocity.avgWeeklyRevenue || ((d.invoicedRevenue || 0) / Math.max(1, weeklyTrends.length)))} / Hafta
          </span>
        </div>

        {/* Monthly Average Order Count */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs hover:border-amber-400/40 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Aylık Ort. Sipariş</span>
            <div className="p-2 rounded-2xl bg-amber-50 text-amber-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg xs:text-xl sm:text-2xl font-black text-amber-800 tabular-nums mt-1.5 truncate">
            {velocity.avgMonthlyOrders || Math.round((d.totalOrders || 0) / Math.max(1, monthlyTrends.length))} Adet
          </div>
          <span className="text-[11px] text-amber-700 font-bold mt-1 block">
            {formatCurrencyNoCents(velocity.avgMonthlyRevenue || ((d.invoicedRevenue || 0) / Math.max(1, monthlyTrends.length)))} / Ay
          </span>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 2. AÇILIR-KAPANIR 14 MASRAF KALEMLERİ (₺) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden transition-all">
        {/* Header Bar */}
        <div 
          onClick={() => setIsExpensesExpanded(!isExpensesExpanded)}
          className="p-4 sm:p-5 flex items-center justify-between bg-canvas/40 hover:bg-canvas/80 cursor-pointer border-b border-border/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-primary text-white shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black text-dark">
                  14 Masraf Kalemi ve Kesinti Dökümü (Melontik Finansal Matrisi)
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {isExpensesExpanded ? 'Detayları Gizle' : 'Tüm Masrafları Göster'}
                </Badge>
              </div>
              <p className="text-[11px] text-gray-500">
                COGS, Komisyon, Kargo, İade Kargo, Stopaj (%1), Net KDV, Reklam, Erken Ödeme ve %{exp.extraOperationRate || 6} Ekstra Operasyon Kesintisi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-gray-400 font-bold block">Toplam Kesinti & Masraf</span>
              <span className="text-xs font-black text-red-600 tabular-nums">
                -{formatCurrency(exp.totalCostSum || 0)}
              </span>
            </div>
            <button className="p-1.5 rounded-xl hover:bg-white text-gray-400 hover:text-dark transition-colors">
              {isExpensesExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content Grid */}
        {isExpensesExpanded && (
          <div className="p-4 sm:p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
            {/* 14 Individual Expense Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3">
              {donutExpensesList.map((item) => (
                <div key={item.id} className="p-3 rounded-2xl bg-canvas/60 border border-border/80 flex flex-col justify-between space-y-1 hover:bg-white hover:shadow-xs transition-all">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-bold text-gray-600 truncate" title={item.name}>{item.name}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-dark tabular-nums">
                    {formatCurrency(item.value)}
                  </div>
                </div>
              ))}
            </div>

            {/* Waterfall Summary Row */}
            <div className="p-4 rounded-2xl bg-dark text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-primary shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-gray-300 font-bold block">14 Kalem Sonrası Gerçekleşen Net Bakiye</span>
                  <div className="text-lg sm:text-xl font-black text-emerald-400 tabular-nums">
                    {formatCurrency(d.netProfit || 0)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-gray-400 block">Kâr Marjı</span>
                  <span className="font-black text-white tabular-nums">%{d.netProfitMargin || 0}</span>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-gray-400 block">Kâr Çarpanı (Markup)</span>
                  <span className="font-black text-white tabular-nums">%{d.netProfitMarkup || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. CHART: GÜNLÜK KÂR PERFORMANSI (Spline Curve) */}
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
                  formatter={(value: any, name: any) => [formatCurrencyNoCents(parseFloat(value || 0)), name === 'kar' ? 'Net Kâr' : name]}
                  labelFormatter={(lbl, items) => {
                    const item = items?.[0]?.payload;
                    return item ? `${item.fullDate || lbl} (${item.siparis || 0} Sipariş • Ciro: ${formatCurrencyNoCents(item.ciro || 0)})` : lbl;
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
      {/* 4. CHARTS ROW 1: Monthly Trend + Cost Breakdown */}
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
                    formatter={(val: any, name: string) => [formatCurrencyNoCents(parseFloat(val || 0)), name === "revenue" ? "Toplam Ciro" : "Net Kâr"]}
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
                    formatter={(val: any) => [formatCurrencyNoCents(parseFloat(val || 0)), "Tutar"]}
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
      {/* 6. CHARTS ROW 2: Hourly Bar Chart + Carrier Cards */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Hourly 24-Hour Orders & Revenue Bar Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                24 Saatlik Sipariş Yoğunluğu Dağılımı
              </h4>
              <p className="text-[11px] text-gray-500">Günün saatlerine göre sipariş adedi dökümü</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold">24 Saatlik Akış</Badge>
          </div>

          <div className="h-56 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={10} tickLine={false} interval={1} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "0.75rem", border: "1px solid #E5E7EB" }}
                    formatter={(val: any) => [`${val} Sipariş`, "Adet"]}
                    labelFormatter={(label) => `Saat Dilimi: ${label}`}
                  />
                  <Bar dataKey="siparis" fill="#FF7855" radius={[4, 4, 0, 0]} name="Sipariş Adedi" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Carrier Distribution Cards (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2 pb-2 border-b border-border">
              <Truck className="w-4 h-4 text-primary" />
              Kargo Firmaları Dağılımı
            </h4>
            <p className="text-[11px] text-gray-500 mt-1">Hangi kargo şirketiyle kaç paket gönderildi</p>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-56 pr-1 custom-scrollbar">
            {carrierDistribution.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">Kargo verisi bulunamadı</div>
            ) : (
              carrierDistribution.map((c: any, idx: number) => {
                const totalOrdersCount = carrierDistribution.reduce((acc: number, curr: any) => acc + parseInt(curr.orderCount || 0), 0) || 1;
                const pct = Math.round((parseInt(c.orderCount || 0) / totalOrdersCount) * 100);
                return (
                  <div key={idx} className="p-2.5 rounded-2xl bg-canvas/70 border border-border/80 flex items-center justify-between text-xs hover:bg-white transition-all">
                    <div>
                      <span className="font-bold text-dark block">{c.carrier}</span>
                      <span className="text-[10px] text-gray-500 font-mono">Ort. {c.avgDesi || 1} Desi • {formatCurrency(c.totalShippingCost)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-primary tabular-nums">{c.orderCount} Paket</span>
                      <span className="text-[10px] text-emerald-700 font-bold block">%{pct}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 7. TOP PRODUCTS & RECENT ORDERS STREAM */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Top Profitable Products (6 Cols) */}
        <div className="lg:col-span-6 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <h4 className="text-xs sm:text-sm font-bold text-dark">En Kârlı Ürünler (Dönem Liderleri)</h4>
            </div>
            <Link href="/product-profitability" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              Tümü ➔
            </Link>
          </div>

          <div className="space-y-2.5">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">Kârlı ürün verisi bulunamadı</div>
            ) : (
              topProducts.map((p: any, idx: number) => (
                <div key={idx} className="p-3 rounded-2xl bg-canvas/60 border border-border/80 flex items-center justify-between gap-2 hover:bg-white transition-all text-xs">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-dark truncate">{p.title}</h5>
                    <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{p.barcode} • {p.totalQuantity} Adet Satıldı</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-emerald-700 block tabular-nums">{formatCurrency(p.totalProfit)}</span>
                    <Badge variant="excellent" className="text-[10px] py-0 font-bold">
                      %{p.avgMargin} Marj
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Recent Orders Stream (6 Cols) */}
        <div className="lg:col-span-6 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-xs sm:text-sm font-bold text-dark">Canlı Son Siparişler Akışı</h4>
            </div>
            <Link href="/live-analysis" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              Canlı Analiz ➔
            </Link>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-80 pr-1 custom-scrollbar">
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">Son sipariş bulunamadı</div>
            ) : (
              recentOrders.map((ord: any) => (
                <div 
                  key={ord.id} 
                  onClick={() => setSelectedOrderId(ord.id)}
                  className="p-3 rounded-2xl bg-canvas/60 border border-border/80 flex items-center justify-between gap-2 hover:bg-white cursor-pointer transition-all text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-dark font-mono">{ord.orderNumber}</span>
                      <OrderStatusBadge status={ord.status} size="sm" />
                      <span className="text-[10px] text-gray-400">• {ord.city}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 block">{ord.orderDate} • {ord.customerName}</span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-primary block tabular-nums">{formatCurrencyNoCents(parseFloat(ord.paidAmount || 0))}</span>
                    <span className={`text-[11px] font-black tabular-nums ${parseFloat(ord.netProfit) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {formatCurrencyNoCents(parseFloat(ord.netProfit || 0))} Kâr
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
