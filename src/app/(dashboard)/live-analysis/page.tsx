"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatCurrencyNoCents, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TablePagination } from "@/components/common/TablePagination";
import { 
  Activity, RefreshCw, Search, Eye, Filter, Truck, CheckCircle2, 
  AlertTriangle, DollarSign, Package, Clock, ShieldCheck, ChevronRight, 
  Layers, Edit3, Check, X, TrendingUp, PieChart as PieIcon, BarChart3
, Calendar } from "lucide-react";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { useDateStore } from "@/store/useDateStore";
import { useTenantStore } from "@/stores/useTenantStore";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

export default function LiveAnalysisPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const { period, startDate, endDate, label } = useDateStore();
  const { activeStoreId } = useTenantStore();
  const [showCharts, setShowCharts] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Selected Order for Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Batch Cost Update Modal State
  const [batchCostModal, setBatchCostModal] = useState(false);
  const [batchBarcode, setBatchBarcode] = useState("");
  const [batchNewCost, setBatchNewCost] = useState<number>(0);
  const [marketplaceFilter, setMarketplaceFilter] = useState("all");
  const [savingBatch, setSavingBatch] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/api/orders?search=${encodeURIComponent(search)}&status=${statusFilter}&carrier=${carrierFilter}&marketplace=${marketplaceFilter}&period=${period}&storeId=${activeStoreId}&limit=100`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data.orders || []);
      setSummary(data.summary || {});
    } catch (e) {
      toast.error("Canlı sipariş verileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, carrierFilter, marketplaceFilter, period, startDate, endDate, activeStoreId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleBatchCostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchBarcode || batchNewCost <= 0) {
      toast.error("Lütfen geçerli bir barkod ve maliyet tutarı girin.");
      return;
    }

    setSavingBatch(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: batchBarcode, currentCost: batchNewCost }),
      });
      if (res.ok) {
        toast.success(`Barkod ${batchBarcode} için birim maliyet ₺${batchNewCost} olarak güncellendi ve kârlar hesaplandı!`);
        setBatchCostModal(false);
        fetchOrders();
      }
    } catch (e) {
      toast.error("Toplu maliyet güncellenemedi.");
    } finally {
      setSavingBatch(false);
    }
  };

  let runningRev = 0;
  let runningProfit = 0;
  const cumulativeData = [...orders].reverse().map((o, idx) => {
    runningRev += parseFloat(o.paidAmount || 0);
    runningProfit += parseFloat(o.netProfit || 0);
    return {
      index: idx + 1,
      orderNumber: o.orderNumber,
      kumulatifCiro: Math.round(runningRev),
      kumulatifKar: Math.round(runningProfit),
      kar: parseFloat(o.netProfit || 0),
    };
  });

  const highMarginCount = orders.filter(o => parseFloat(o.marginPercent) >= 20).length;
  const normalMarginCount = orders.filter(o => parseFloat(o.marginPercent) >= 5 && parseFloat(o.marginPercent) < 20).length;
  const lowMarginCount = orders.filter(o => parseFloat(o.marginPercent) >= 0 && parseFloat(o.marginPercent) < 5).length;
  const negativeMarginCount = orders.filter(o => parseFloat(o.marginPercent) < 0).length;

  const marginPieData = [
    { name: "%20+ Yüksek Kâr", value: highMarginCount, color: "#10B981" },
    { name: "%5-%20 Standart", value: normalMarginCount, color: "#38BDF8" },
    { name: "%0-%5 Düşük Marj", value: lowMarginCount, color: "#F59E0B" },
    { name: "Zararına Sipariş", value: negativeMarginCount, color: "#EF4444" },
  ].filter(x => x.value > 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Canlı Sipariş & Kâr Analiz Akışı</h3>
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-xs border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              2.366 Canlı Sipariş
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Trendyol mağazanızdan çekilen gerçek siparişler, kümülatif kâr eğrileri ve anlık maliyet dökümleri
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowCharts(!showCharts)}
            className="text-xs h-8 sm:h-9 gap-1.5 font-bold"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{showCharts ? 'Grafikleri Gizle' : 'Grafikleri Göster'}</span>
          </Button>

          <Button 
            data-tour="live-batch-cost"
            size="sm" 
            onClick={() => setBatchCostModal(true)}
            className="text-xs h-8 sm:h-9 gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary-hover text-white"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Toplu Maliyet Güncelle</span>
          </Button>

          <Button size="sm" variant="outline" onClick={fetchOrders} className="h-8 sm:h-9 text-xs gap-1.5 font-bold">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div data-tour="live-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Filtrelenen Sipariş</span>
          <div className="text-2xl font-black text-dark tabular-nums mt-1">{summary.totalOrders || 0} Adet</div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">Canlı Veri</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Filtrelenen Ciro</span>
          <div className="text-2xl font-black text-primary tabular-nums mt-1">{formatCurrencyNoCents(parseFloat(summary.totalInvoicedRevenue || 0))}</div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">Faturalanan Tutar</span>
        </div>

        <div className={`bg-white p-4 sm:p-5 rounded-3xl border shadow-xs transition-all ${
          parseFloat(summary.totalNetProfit || 0) < 0 ? 'border-red-200 bg-red-50/20' : 'border-border'
        }`}>
          <span className={`text-[11px] font-bold uppercase tracking-wide block ${
            parseFloat(summary.totalNetProfit || 0) < 0 ? 'text-red-800' : 'text-muted-foreground'
          }`}>
            {parseFloat(summary.totalNetProfit || 0) < 0 ? 'Filtrelenen Net Zarar' : 'Filtrelenen Net Kâr'}
          </span>
          <div className={`text-2xl font-black tabular-nums mt-1 ${
            parseFloat(summary.totalNetProfit || 0) < 0 ? 'text-red-600' : 'text-emerald-700'
          }`}>
            {formatCurrencyNoCents(parseFloat(summary.totalNetProfit || 0))}
          </div>
          <span className={`text-[11px] font-bold mt-1 block ${
            parseFloat(summary.totalNetProfit || 0) < 0 ? 'text-red-800' : 'text-emerald-700'
          }`}>
            Tüm Kesintiler Sonrası
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Ortalama Kâr Marjı</span>
          <div className="text-2xl font-black text-dark tabular-nums mt-1">%{parseFloat(summary.averageMarginPercent || 0).toFixed(1)}</div>
          <span className="text-[11px] text-primary font-bold mt-1 block">Net Kâr / Ciro</span>
        </div>
      </div>

      {/* LIVE CHARTS ROW */}
      {showCharts && (
        <div data-tour="live-charts" className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 animate-in fade-in">
          
          <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Sipariş Akışı Kümülatif Kâr & Ciro Eğrisi
                </h4>
                <p className="text-[11px] text-gray-500">Seçilen dönem siparişleri boyunca kümülatif net kâr birikimi</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700">Kümülatif Kâr (₺)</span>
                </div>
              </div>
            </div>

            <div className="h-56 sm:h-64 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorKumulatifKar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="index" stroke="#9CA3AF" fontSize={11} tickLine={false} tickFormatter={(v) => `#${v}`} />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} tickFormatter={(v) => `₺${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E5E7EB" }}
                      formatter={(val: any) => [formatCurrencyNoCents(parseFloat(val || 0)), "Kümülatif Net Kâr"]}
                      labelFormatter={(l) => `Sipariş Sırası: ${l}`}
                    />
                    <Area type="monotone" dataKey="kumulatifKar" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorKumulatifKar)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2 pb-2 border-b border-border">
                <PieIcon className="w-4 h-4 text-primary" />
                Sipariş Kâr Marjı Sağlık Dağılımı
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">Siparişlerin kârlılık dilimlerine göre dağılımı</p>
            </div>

            <div className="h-48 w-full relative flex items-center justify-center">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={marginPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {marginPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "0.75rem", border: "1px solid #E5E7EB" }}
                      formatter={(val: any) => [`${val} Sipariş`, "Adet"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border text-[11px]">
              {marginPieData.map((c, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-gray-600 truncate">{c.name} ({c.value})</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Order Status Tabs */}
      <div className="flex items-center bg-canvas p-1 rounded-2xl border border-border overflow-x-auto gap-1">
        {[
          { id: 'all', label: 'Tüm Durumlar' },
          { id: 'Teslim Edildi', label: '✓ Teslim Edildi' },
          { id: 'Kargoda', label: '🚚 Kargoda / Taşımada' },
          { id: 'İade', label: '↩️ İade / İptal' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-primary text-white shadow-xs'
                : 'text-dark hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Sipariş No, Paket No, Müşteri veya Şehir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {/* Global Active Period Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas border border-border text-xs font-bold text-dark">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Dönem: {label}</span>
          </div>

          <select
            value={marketplaceFilter}
            onChange={(e) => setMarketplaceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white shadow-xs cursor-pointer"
          >
            <option value="all">🏪 Tüm Pazaryerleri</option>
            <option value="trendyol">🟠 Trendyol</option>
            <option value="hepsiburada">🟠 Hepsiburada</option>
          </select>

          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white shadow-xs cursor-pointer"
          >
            <option value="all">Tüm Kargolar</option>
            <option value="Trendyol Express">Trendyol Express</option>
            <option value="Hepsijet">Hepsijet</option>
            <option value="Aras">Aras Kargo</option>
            <option value="MNG">MNG Kargo</option>
            <option value="Yurtiçi">Yurtiçi Kargo</option>
            <option value="Sürat">Sürat Kargo</option>
            <option value="PTT">PTT Kargo</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div data-tour="live-table" className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
                  <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                    <th className="py-3 px-4 table-sticky-first-col bg-canvas">Sipariş No & Müşteri</th>
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">Kargo & Desi</th>
                    <th className="py-3 px-4 text-primary font-bold">Ciro (₺)</th>
                    <th className="py-3 px-4">Komisyon (₺)</th>
                    <th className="py-3 px-4">Kargo Gideri (₺)</th>
                    <th className="py-3 px-4">Ürün Maliyeti (₺)</th>
                    <th className="py-3 px-4 font-black text-emerald-700">Net Kâr (₺)</th>
                    <th className="py-3 px-4">Kâr Marjı</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {orders.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((o) => {
                    const isProfitable = parseFloat(o.netProfit) >= 0;
                    return (
                      <tr 
                        key={o.id} 
                        onClick={() => setSelectedOrderId(o.id)}
                        className="hover:bg-primary-tint-50/30 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-dark">{o.orderNumber}</span>
                            <Badge 
                              className={`text-[9px] py-0 px-1.5 font-bold uppercase tracking-wider ${
                                o.marketplace === 'hepsiburada' 
                                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                  : 'bg-orange-100 text-orange-800 border-orange-300'
                              }`}
                            >
                              {o.marketplace === 'hepsiburada' ? 'Hepsiburada' : 'Trendyol'}
                            </Badge>
                            <Badge variant={o.status === 'Delivered' ? 'excellent' : 'default'} className="text-[10px] py-0">
                              {o.status === 'Delivered' ? 'Teslim Edildi' : o.status === 'Shipped' ? 'Kargoda' : o.status === 'Cancelled' ? 'İptal' : 'Yeni'}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-gray-400 block font-normal mt-0.5">{o.customerName || 'Gizli Müşteri'}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 tabular-nums text-[11px]">{o.orderDate}</td>
                        <td className="py-3 px-4 font-semibold text-gray-700">
                          <div>{o.cargoProvider || 'Trendyol Express'}</div>
                          <span className="text-[10px] text-gray-400 font-mono">{o.calculatedDesi || 1} Desi</span>
                        </td>
                        <td className="py-3 px-4 font-black text-primary tabular-nums">{formatCurrencyNoCents(parseFloat(o.grossAmount || 0))}</td>
                        <td className="py-3 px-4 text-gray-600 tabular-nums">{formatCurrencyNoCents(parseFloat(o.commission || 0))}</td>
                        <td className="py-3 px-4 text-gray-600 tabular-nums">{formatCurrencyNoCents(parseFloat(o.shippingCost || 0))}</td>
                        <td className="py-3 px-4 text-gray-600 tabular-nums">{formatCurrencyNoCents(parseFloat(o.cogs || 0))}</td>
                        <td className={`py-3 px-4 font-black tabular-nums ${isProfitable ? 'text-emerald-700' : 'text-red-600'}`}>
                          {formatCurrencyNoCents(parseFloat(o.netProfit || 0))}
                        </td>
                        <td className="py-3 px-4 font-bold tabular-nums">
                          <Badge variant={isProfitable ? 'excellent' : 'secondary'}>
                            %{parseFloat(o.marginPercent ?? o.profitMargin ?? 0).toFixed(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(o.id);
                            }}
                            className="h-7 text-[11px] font-bold px-2 text-primary hover:bg-primary-tint-100"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>İncele</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card View */}
            <div className="block md:hidden divide-y divide-border/60">
              {orders.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((o) => {
                const isProfitable = parseFloat(o.netProfit) >= 0;
                return (
                  <div 
                    key={o.id} 
                    onClick={() => setSelectedOrderId(o.id)}
                    className="p-3.5 space-y-3 bg-white hover:bg-canvas/40 transition-colors cursor-pointer"
                  >
                    {/* Header: Order Number + Status + Margin */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-dark font-mono">{o.orderNumber}</span>
                          <Badge 
                            className={`text-[8px] py-0 px-1 font-bold uppercase tracking-wider ${
                              o.marketplace === 'hepsiburada' 
                                ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                : 'bg-orange-100 text-orange-800 border-orange-300'
                            }`}
                          >
                            {o.marketplace === 'hepsiburada' ? 'Hepsiburada' : 'Trendyol'}
                          </Badge>
                          <Badge variant={o.status === 'Delivered' ? 'excellent' : 'default'} className="text-[9px] py-0">
                            {o.status === 'Delivered' ? 'Teslim' : o.status === 'Shipped' ? 'Kargoda' : 'Yeni'}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{o.customerName || 'Müşteri'} • {o.orderDate}</span>
                      </div>

                      <Badge variant={isProfitable ? 'excellent' : 'secondary'} className="text-[10px] shrink-0">
                        %{parseFloat(o.marginPercent ?? o.profitMargin ?? 0).toFixed(1)} Marj
                      </Badge>
                    </div>

                    {/* Financial Micro-Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-canvas/60 p-2.5 rounded-2xl border border-border/80 text-[11px]">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Ciro</span>
                        <span className="font-black text-primary tabular-nums">{formatCurrencyNoCents(parseFloat(o.grossAmount || 0))}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Giderler (Kargo+Kom)</span>
                        <span className="font-bold text-gray-700 tabular-nums">
                          {formatCurrencyNoCents(parseFloat(o.shippingCost || 0) + parseFloat(o.commission || 0))}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Net Kâr</span>
                        <span className={`font-black tabular-nums ${isProfitable ? 'text-emerald-700' : 'text-red-600'}`}>
                          {formatCurrencyNoCents(parseFloat(o.netProfit || 0))}
                        </span>
                      </div>
                    </div>

                    {/* Footer / Action */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <span>{o.cargoProvider || 'Kargo'} ({o.calculatedDesi || 1} Desi)</span>
                      <span className="font-bold text-primary flex items-center gap-1 text-xs">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Siparişi İncele ➔</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        <TablePagination currentPage={currentPage} totalPages={Math.ceil(orders.length / pageSize) || 1} pageSize={pageSize} totalItems={orders.length} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      {/* Batch Cost Update Modal */}
      {batchCostModal && (
        <div className="fixed inset-0 z-50 bg-dark/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-border shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                <h4 className="text-sm font-black text-dark">Toplu Alış Maliyeti Güncelle</h4>
              </div>
              <button onClick={() => setBatchCostModal(false)} className="text-gray-400 hover:text-dark font-bold">✕</button>
            </div>

            <form onSubmit={handleBatchCostUpdate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-dark block mb-1">Ürün Barkodu *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 8699931759877"
                  value={batchBarcode}
                  onChange={(e) => setBatchBarcode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-dark block mb-1">Yeni Birim Alış Maliyeti (₺ KDV Dahil) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="Örn: 45.00"
                  value={batchNewCost || ''}
                  onChange={(e) => setBatchNewCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-primary font-bold text-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setBatchCostModal(false)}>
                  Vazgeç
                </Button>
                <Button type="submit" size="sm" disabled={savingBatch} className="text-xs font-bold gap-1 bg-primary hover:bg-primary-hover text-white">
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingBatch ? 'Güncelleniyor...' : 'Maliyeti Güncelle'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onUpdated={fetchOrders}
      />
    </div>
  );
}
