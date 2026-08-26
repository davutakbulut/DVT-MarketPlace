"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OrderStatusBadge } from "@/components/common/OrderStatusBadge";
import { useDateStore } from "@/store/useDateStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { 
  Undo2, AlertTriangle, RefreshCw, Search, Filter, 
  Package, Truck, Calendar, DollarSign, User, ShieldAlert,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, ArrowUpRight,
  TrendingDown, ShoppingBag, Info, ExternalLink, Hash,
  BarChart3, PieChart, Lightbulb, Sparkles, PackageX, FileText, ArrowRight
} from "lucide-react";

export default function ReturnsCancellationsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalCount: 0,
    returnCount: 0,
    cancellationCount: 0,
    returnGrossTotal: 0,
    cancellationGrossTotal: 0,
    totalReturnLoss: 0,
    totalRefundAmount: 0,
  });
  const [reasonsDistribution, setReasonsDistribution] = useState<any[]>([]);
  const [categorizedAnalytics, setCategorizedAnalytics] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, totalPages: 1 });
  const { period, startDate, endDate, label } = useDateStore();
  const { activeStoreId } = useTenantStore();

  // Filters
  const [activeTab, setActiveTab] = useState<"all" | "return" | "cancellation">("all");
  const [search, setSearch] = useState("");
  const [selectedReason, setSelectedReason] = useState("all");
  const [searchInput, setSearchInput] = useState("");

  const fetchReturnsAndCancellations = async () => {
    setLoading(true);
    try {
      const paramsObj: Record<string, string> = {
        type: activeTab,
        reason: selectedReason,
        search: search,
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        period: period || "all",
        storeId: activeStoreId || "all",
      };
      if (startDate && endDate) {
        paramsObj.startDate = startDate;
        paramsObj.endDate = endDate;
      }
      const params = new URLSearchParams(paramsObj);

      const res = await fetch(`/api/orders/returns-cancellations?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setOrders(data.orders || []);
        setSummary(data.summary || {});
        setReasonsDistribution(data.reasonsDistribution || []);
        setCategorizedAnalytics(data.categorizedAnalytics || []);
        setPagination((prev) => ({
          ...prev,
          totalPages: data.pagination?.totalPages || 1,
        }));
      } else {
        toast.error(data.error || "Veriler alınamadı.");
      }
    } catch (e) {
      console.error(e);
      toast.error("İade ve iptal siparişleri yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnsAndCancellations();
  }, [activeTab, selectedReason, search, pagination.page, period, startDate, endDate, activeStoreId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Calculate highest reason count for relative percentage bars
  const maxReasonCount = Math.max(...reasonsDistribution.map(r => parseInt(r.count) || 0), 1);
  const totalReportCount = summary.totalCount || 1;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-black text-dark flex items-center gap-2">
              <Undo2 className="w-5 h-5 text-primary" />
              <span>İptal & İade Siparişleri Yönetimi</span>
            </h3>
            <Badge variant="danger" className="text-[10px] sm:text-xs">
              {summary.returnCount} İade • {summary.cancellationCount} İptal
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Trendyol mağazanızdan gelen iade ve iptal talepleri, kargo zarar analizleri ve müşteri gerekçeleri
          </p>
        </div>

        <Button 
          size="sm" 
          variant="outline" 
          onClick={fetchReturnsAndCancellations} 
          className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-2xl text-xs gap-1.5 font-bold bg-white hover:bg-canvas text-dark border-border shadow-xs shrink-0 cursor-pointer"
          title="Verileri Yenile"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Yenile</span>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Toplam İade */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Toplam İade</span>
            <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Undo2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-dark tabular-nums">
              {summary.returnCount} <span className="text-xs font-bold text-gray-400 font-sans">Sipariş</span>
            </div>
            <span className="text-xs text-red-600 font-bold block mt-0.5">
              {formatCurrency(summary.returnGrossTotal)} İade Tutarı
            </span>
          </div>
        </div>

        {/* 2. Toplam İptal */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Toplam İptal</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-dark tabular-nums">
              {summary.cancellationCount} <span className="text-xs font-bold text-gray-400 font-sans">Sipariş</span>
            </div>
            <span className="text-xs text-amber-600 font-bold block mt-0.5">
              {formatCurrency(summary.cancellationGrossTotal)} İptal Tutarı
            </span>
          </div>
        </div>

        {/* 3. İade Kargo & İşlem Zararı */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">İade Kargo Zararı</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 tabular-nums">
              -{formatCurrency(summary.totalReturnLoss)}
            </div>
            <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
              Kargo ve platform kesintisi
            </span>
          </div>
        </div>

        {/* 4. Toplam Geri Ödenen */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Geri Ödenen Tutar</span>
            <div className="w-7 h-7 rounded-xl bg-primary-tint-50 text-primary flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-dark tabular-nums">
              {formatCurrency(summary.totalRefundAmount)}
            </div>
            <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
              Müşteriye iade edilen bakiye
            </span>
          </div>
        </div>
      </div>

      {/* REASONS QUICK FILTER BAR */}
      {reasonsDistribution.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-dark flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <span>Hızlı Gerekçe Filtresi</span>
            </span>
            <span className="text-[11px] text-gray-400 font-bold">Tıkla & Filtrele</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {reasonsDistribution.slice(0, 10).map((r, idx) => {
              const isReturn = r.type === "return";
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedReason(selectedReason === r.reasonName ? "all" : r.reasonName);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`px-3 py-2 rounded-2xl border text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                    selectedReason === r.reasonName
                      ? "bg-primary text-white border-primary shadow-xs"
                      : isReturn 
                        ? "bg-red-50/60 border-red-200 text-red-900 hover:bg-red-100/60" 
                        : "bg-amber-50/60 border-amber-200 text-amber-900 hover:bg-amber-100/60"
                  }`}
                >
                  <span className="truncate max-w-[200px]">{r.reasonName}</span>
                  <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black ${
                    selectedReason === r.reasonName ? "bg-white/20 text-white" : "bg-white border border-border text-dark"
                  }`}>
                    {r.count} Adet
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER & TAB CONTROLS */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* TAB BUTTONS */}
          <div className="flex items-center gap-1.5 p-1 bg-canvas rounded-2xl border border-border">
            <button
              onClick={() => { setActiveTab("all"); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all" ? "bg-white text-dark shadow-xs" : "text-gray-500 hover:text-dark"
              }`}
            >
              Tümü ({summary.totalCount})
            </button>
            <button
              onClick={() => { setActiveTab("return"); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "return" ? "bg-red-50 text-red-700 shadow-xs border border-red-200" : "text-gray-500 hover:text-dark"
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>İadeler ({summary.returnCount})</span>
            </button>
            <button
              onClick={() => { setActiveTab("cancellation"); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "cancellation" ? "bg-amber-50 text-amber-700 shadow-xs border border-amber-200" : "text-gray-500 hover:text-dark"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>İptaller ({summary.cancellationCount})</span>
            </button>
          </div>

          {/* SEARCH FORM */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Sipariş no, takip no, müşteri veya gerekçe ara..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>
            <Button type="submit" size="sm" className="h-8.5 text-xs font-bold bg-primary text-white rounded-xl cursor-pointer">
              Ara
            </Button>
            {search && (
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={() => { setSearch(""); setSearchInput(""); }}
                className="h-8.5 text-xs rounded-xl cursor-pointer"
              >
                Temizle
              </Button>
            )}
          </form>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-bold">İptal ve iade siparişleri yükleniyor...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Package className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-dark">Kayıtlı İptal veya İade Siparişi Bulunamadı</h4>
            <p className="text-xs text-gray-400">Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((ord) => {
              const isReturn = ord.orderType === "return";
              const reasonText = ord.returnReason || ord.cancellationReason || "Gerekçe belirtilmedi";

              return (
                <div key={ord.id} className="p-4 sm:p-5 hover:bg-canvas/50 transition-colors space-y-3">
                  {/* Top Line: Order Number, Badges, Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-dark text-sm bg-canvas px-2.5 py-1 rounded-xl border border-border">
                        #{ord.orderNumber}
                      </span>
                      <OrderStatusBadge status={ord.status || (isReturn ? 'Returned' : 'Cancelled')} size="sm" />
                      {ord.returnStatus && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ {ord.returnStatus}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-500 font-medium">
                        Sipariş: <strong className="text-dark">{ord.orderDate}</strong>
                      </span>
                      {(ord.returnDate || ord.cancellationDate) && (
                        <span className="text-[11px] text-gray-500 font-medium">
                          • {isReturn ? "İade Talebi" : "İptal"}: <strong className="text-primary">{ord.returnDate || ord.cancellationDate}</strong>
                        </span>
                      )}
                    </div>

                    <div className="text-right flex items-center gap-3 self-end sm:self-auto">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block">İade / İptal Tutarı</span>
                        <span className="font-black text-dark text-sm tabular-nums">{formatCurrency(parseFloat(ord.paidAmount || ord.grossAmount || 0))}</span>
                      </div>
                      {isReturn && (
                        <div className="bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 text-right">
                          <span className="text-[10px] text-rose-600 font-bold block">Kargo Zararı</span>
                          <span className="font-black text-rose-700 text-xs tabular-nums">
                            -{formatCurrency(parseFloat(ord.shippingCost || 46.49) + parseFloat(ord.serviceFee || 13.19))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Line: Customer & Products Info */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                    {/* Customer info (3 cols) */}
                    <div className="md:col-span-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-dark">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{ord.customerName}</span>
                      </div>
                      <span className="text-[11px] text-gray-500 block">
                        {ord.city} • {ord.storeName || "Trendyol Mağazası"}
                      </span>
                      {ord.trackingCode && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-600 font-mono">
                          <Truck className="w-3 h-3 text-primary" />
                          <span>Kargo Takip: {ord.trackingCode}</span>
                        </div>
                      )}
                    </div>

                    {/* Products list (5 cols) */}
                    <div className="md:col-span-5 space-y-1.5 border-t md:border-t-0 md:border-l border-border pt-2 md:pt-0 md:pl-3">
                      {ord.items && ord.items.length > 0 ? (
                        ord.items.map((it: any, iIdx: number) => (
                          <div key={iIdx} className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <span className="font-bold text-dark block leading-snug line-clamp-1">
                                {it.quantity}x {it.title}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                                <span>Barkod: {it.barcode}</span>
                                {it.sku && <span>SKU: {it.sku}</span>}
                              </div>
                            </div>
                            <span className="font-black text-dark text-xs tabular-nums shrink-0">
                              {formatCurrency(parseFloat(it.grossAmount || it.unitPrice || 0))}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">Ürün detayları sipariş kaydında</span>
                      )}
                    </div>

                    {/* Reason & Customer Note (4 cols) */}
                    <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-border pt-2 md:pt-0 md:pl-3">
                      <div className={`p-2.5 rounded-2xl border text-xs space-y-1 ${
                        isReturn ? "bg-red-50/40 border-red-200" : "bg-amber-50/40 border-amber-200"
                      }`}>
                        <span className={`font-black flex items-center gap-1 text-[11px] ${
                          isReturn ? "text-red-800" : "text-amber-800"
                        }`}>
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{isReturn ? "İade Sebebi:" : "İptal Nedeni:"}</span>
                        </span>
                        <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                          {reasonText}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-canvas/30 text-xs">
            <span className="font-bold text-gray-500">
              Sayfa {pagination.page} / {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="h-8 text-xs font-bold gap-1 rounded-xl cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Önceki</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="h-8 text-xs font-bold gap-1 rounded-xl cursor-pointer"
              >
                <span>Sonraki</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 📊 EN SIK KARŞILAŞILAN İADE & İPTAL GEREKÇELERİ RAPORU (GÖRSELLİ & GRAFİKLİ EN ALT ALAN) */}
      <div className="bg-white rounded-3xl border border-border shadow-xs p-5 sm:p-7 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-dark flex items-center gap-2">
                  <span>En Sık Karşılaşılan İade & İptal Gerekçeleri Raporu</span>
                  <Badge variant="danger" className="text-[10px]">Kök Neden & Zarar Analitiği</Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Müşteri iade/iptal gerekçeleri, finansal kayıp ağırlıkları ve operasyonel önleme tavsiyeleri
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-canvas p-1 rounded-2xl border border-border text-xs">
            <div className="px-3 py-1.5 rounded-xl font-bold bg-white text-dark shadow-2xs">
              Toplam {summary.totalCount} Vaka
            </div>
            <div className="px-3 py-1.5 rounded-xl font-bold text-rose-600">
              -{formatCurrency(summary.totalReturnLoss)} Net Zarar
            </div>
          </div>
        </div>

        {/* 1. Categorized Cluster Visual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {categorizedAnalytics.map((cat, idx) => {
            const percentage = Math.round((parseInt(cat.count || 0) / totalReportCount) * 100) || 0;
            const isHeavyLoss = parseFloat(cat.totalLoss || 0) > 300;

            return (
              <div 
                key={idx} 
                className="bg-canvas/50 hover:bg-canvas rounded-2xl p-4 border border-border/80 space-y-3 transition-all relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Kategori #{idx + 1}
                    </span>
                    <h4 className="text-xs font-black text-dark group-hover:text-primary transition-colors">
                      {cat.category}
                    </h4>
                  </div>
                  <Badge 
                    variant={isHeavyLoss ? "danger" : "secondary"}
                    className="text-[10px] font-mono shrink-0"
                  >
                    %{percentage} Pay
                  </Badge>
                </div>

                {/* Progress Visual Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-border/60 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? "bg-rose-500" : idx === 1 ? "bg-amber-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold">
                    <span>{cat.count} Sipariş</span>
                    <span className="text-rose-600">-{formatCurrency(cat.totalLoss)} Kargo Zararı</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Ciro Etkisi:</span>
                  <span className="font-black text-dark tabular-nums">{formatCurrency(cat.totalAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Detailed Visual Breakdown Bars (Gerekçe Bazlı Dağılım Çubukları) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-dark uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              <span>Gerekçe Bazlı Detay Dağılımı & Zarar Matrisi</span>
            </h4>
            <span className="text-[11px] text-gray-400 font-semibold">Vaka Sayısına Göre Sıralı</span>
          </div>

          <div className="space-y-2.5">
            {reasonsDistribution.map((item, idx) => {
              const count = parseInt(item.count) || 0;
              const barWidthPercent = Math.min(100, Math.round((count / maxReasonCount) * 100));
              const isReturn = item.type === "return";
              const totalLoss = parseFloat(item.totalLoss || 0);

              return (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedReason(item.reasonName);
                    setPagination(p => ({ ...p, page: 1 }));
                    window.scrollTo({ top: 400, behavior: "smooth" });
                  }}
                  className="p-3 rounded-2xl bg-white hover:bg-canvas/70 border border-border/80 transition-all cursor-pointer space-y-2 group shadow-2xs hover:border-primary/40"
                  title="Bu gerekçedeki siparişleri yukarıda filtrelemek için tıklayın"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isReturn ? "bg-red-500" : "bg-amber-500"}`} />
                      <span className="font-bold text-dark group-hover:text-primary transition-colors truncate max-w-[320px] sm:max-w-[450px]">
                        {item.reasonName}
                      </span>
                      <Badge variant={isReturn ? "danger" : "warning"} className="text-[9px] py-0 px-1.5 shrink-0">
                        {isReturn ? "İade" : "İptal"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto font-mono text-[11px]">
                      <span className="text-gray-500">
                        <strong className="text-dark font-black">{count}</strong> vaka
                      </span>
                      <span>•</span>
                      <span className="text-gray-600 font-bold">
                        {formatCurrency(item.totalAmount)}
                      </span>
                      {totalLoss > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-rose-600 font-black">
                            -{formatCurrency(totalLoss)} Zarar
                          </span>
                        </>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Relative Visual Bar */}
                  <div className="w-full h-2 rounded-full bg-border/40 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isReturn 
                          ? "bg-gradient-to-r from-red-400 to-rose-600" 
                          : "bg-gradient-to-r from-amber-400 to-orange-500"
                      }`}
                      style={{ width: `${Math.max(barWidthPercent, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Actionable Prevention Insights (Aksiyon & Önleme Rehberi) */}
        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/50 rounded-2xl p-4 sm:p-5 border border-blue-200/80 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-blue-600 shrink-0" />
            <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider">
              İade & İptal Oranını Düşürmek İçin Yapay Zeka & Finans Tavsiyeleri
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-900">
            <div className="bg-white/80 p-3 rounded-xl border border-blue-100 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-blue-950">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>SKT (Son Kullanma) Kontrolü</span>
              </span>
              <p className="text-[11px] text-blue-800/80 leading-snug">
                Siparişe giden ürünlerde minimum 6 ay raf ömrü protokolü uygulayarak en sık gelen iade sebebini %80 oranında engelleyin.
              </p>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-blue-100 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-blue-950">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Barkodlu Çift Doğrulama</span>
              </span>
              <p className="text-[11px] text-blue-800/80 leading-snug">
                Farklı ml veya iğne ucu kalınlığı karışıklığını önlemek için paketleme istasyonunda el terminali ile barkod okutma zorunluluğu getirin.
              </p>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-blue-100 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-blue-950">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Görsel & Boyut Kılavuzu</span>
              </span>
              <p className="text-[11px] text-blue-800/80 leading-snug">
                Müşteri yanlış siparişlerinin önüne geçmek için Trendyol ürün görsellerine net ölçü, iğne ucu (G) ve ml karşılaştırma tablosu ekleyin.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
