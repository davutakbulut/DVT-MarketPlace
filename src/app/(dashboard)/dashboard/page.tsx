"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  TrendingUp, DollarSign, Package, Truck, Percent, 
  HelpCircle, RefreshCw, Layers, ShieldCheck, 
  ChevronRight, Calendar, ArrowUpRight, ArrowDownRight,
  CheckCircle2, AlertTriangle, Clock, ChevronDown, ChevronUp,
  Info, PieChart as PieIcon, Activity, Receipt, Store
} from "lucide-react";
import { useDateStore } from "@/store/useDateStore";
import { useTenantStore } from "@/stores/useTenantStore";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line
} from "recharts";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isExpensesExpanded, setIsExpensesExpanded] = useState(true);
  const { period, startDate, endDate, label } = useDateStore();
  const { activeStoreId } = useTenantStore();

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
        toast.error("Finansal veriler alınamadı.");
      }
    } catch (e) {
      toast.error("Bağlantı hatası.");
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
  const carrierDistribution = d.carrierDistribution || [];
  const hourlyDistribution = d.hourlyDistribution || [];
  const dailyProfitTrends = d.dailyProfitTrends || [];
  const topProducts = d.topProducts || [];
  const recentOrders = d.recentOrders || [];

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

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-black text-dark">Trendyol Finansal Kontrol Paneli</h3>
            <Badge variant="excellent" className="text-[10px] sm:text-xs">Canlı Veritabanı</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Tüm masraf kalemleri, kargo barem kesintileri, reklam giderleri ve günlük kâr eğrileri
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas border border-border text-xs font-bold text-dark">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Dönem: {label}</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchDashboard}
            className="h-8 sm:h-9 px-3 rounded-2xl text-xs gap-1.5 font-bold bg-white hover:bg-canvas text-dark border-border shadow-xs cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Yenile</span>
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. TOP 4 KPI CARDS (Birebir Referans Tasarım) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Toplam Sipariş */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border-t-4 border-t-amber-500 border-x border-b border-border shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">Toplam Sipariş</span>
            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help" title="Filtrelenen dönemdeki toplam paket ve durum ayrımı">
              <Info className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-dark tabular-nums mt-1.5">
            {d.totalOrders || 0} Paket
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 mt-2 flex-wrap">
            <span className="text-emerald-700 font-semibold">🟢 {d.activeOrders || 0} Aktif</span>
            <span>•</span>
            <span className="text-red-600 font-semibold">🔴 {d.cancelledOrders || 0} İptal</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">🔄 {d.returnedOrders || 0} İade</span>
          </div>
        </div>

        {/* Card 2: Maliyeti Olan Ciro */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border-t-4 border-t-blue-500 border-x border-b border-border shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">Maliyeti Olan Ciro</span>
            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help" title="Faturalanan toplam brüt ciro ve kesinti tutarları">
              <Info className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-dark tabular-nums mt-1.5">
            {formatCurrency(d.grossRevenue || 0)}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 mt-2 flex-wrap">
            <span className="text-red-600 font-semibold">🔴 -{formatCurrency(d.cancelledAmount || 0)} İptal</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">🔄 -{formatCurrency(d.returnedAmount || 0)} İade</span>
            <span>•</span>
            <span className="text-blue-600 font-semibold">🏷️ -{formatCurrency(d.discountAmount || 0)} İndirim</span>
          </div>
        </div>

        {/* Card 3: Net Kâr */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border-t-4 border-t-emerald-500 border-x border-b border-border shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">Net Kâr</span>
            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help" title="Tüm 14 masraf kalemi ve kesintiler düşüldükten sonra kalan net kazanç">
              <Info className="w-3 h-3" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-black tabular-nums mt-1.5 ${parseFloat(d.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(d.netProfit || 0)}
          </div>
          <span className="text-[11px] text-emerald-800 font-semibold mt-2 block">
            Tüm 14 Masraf Kalemi Düşüldü
          </span>
        </div>

        {/* Card 4: Net Kâr / Satış Oranı */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border-t-4 border-t-teal-500 border-x border-b border-border shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">Net Kâr / Satış Oranı</span>
            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-help" title="Net kârın faturalanan ciroya bölünmesiyle elde edilen kâr marjı">
              <Info className="w-3 h-3" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-black tabular-nums mt-1.5 ${parseFloat(d.netProfitMargin || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            %{parseFloat(d.netProfitMargin || 0).toFixed(2)}
          </div>
          <span className="text-[11px] text-gray-500 font-semibold mt-2 block">
            Net Kâr ÷ Ciro Oranı
          </span>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 2. COLLAPSIBLE CARD: MASRAF KALEMLERİ (₺) + DONUT CHART */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden transition-all">
        {/* Collapsible Header */}
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

        {/* Collapsible Content */}
        {isExpensesExpanded && (
          <div className="p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Column: Donut Chart with Center Total Cost Label */}
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

                  {/* Center Label in Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                    <span className="text-[11px] font-bold text-gray-500">Toplam Maliyet</span>
                    <span className="text-base sm:text-lg font-black text-dark tabular-nums mt-0.5">
                      {formatCurrency(exp.totalCostSum || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: 14 Expense Items Grid (4 cols x 4 rows) */}
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
      {/* 4. OTHER ANALYTICS: Monthly Trends & Top Products */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Monthly Breakdown Chart */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Aylık Kâr & Ciro Karşılaştırması
              </h4>
              <p className="text-[11px] text-gray-500">Ay bazında toplam ciro ve net kâr dağılımı</p>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full">
            {mounted && monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(val: any) => formatCurrency(parseFloat(val || 0))} contentStyle={{ borderRadius: '16px', border: '1px solid #E5E7EB', fontWeight: 'bold', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="revenue" name="Ciro (₺)" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="profit" name="Net Kâr (₺)" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Top Profitable Products */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                En Yüksek Kâr Getiren Ürünler
              </h4>
              <p className="text-[11px] text-gray-500">Seçili dönemde en yüksek kâr üreten 5 ürün</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {topProducts.slice(0, 5).map((p: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-2xl border border-border/80 hover:border-primary/30 transition-all flex items-center justify-between gap-3 bg-canvas/30 text-xs">
                <div className="min-w-0">
                  <span className="font-bold text-dark truncate block">{p.title}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{p.barcode} • {p.totalQuantity} adet satıldı</span>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black text-emerald-700 block tabular-nums">{formatCurrency(p.totalProfit || 0)}</span>
                  <Badge variant="excellent" className="text-[9px] py-0 px-1 font-bold">Marj: %{p.avgMargin || 0}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

function BarChart3(props: any) {
  return <Layers {...props} />;
}

function Award(props: any) {
  return <ShieldCheck {...props} />;
}
