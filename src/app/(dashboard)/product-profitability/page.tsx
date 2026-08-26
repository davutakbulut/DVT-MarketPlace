"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  TrendingUp, Download, RefreshCw, Search, Package, 
  DollarSign, Percent, Truck, ExternalLink, ChevronLeft, 
  ChevronRight, ChevronsLeft, ChevronsRight, Award, AlertTriangle
, Calendar } from "lucide-react";
import { useDateStore } from "@/store/useDateStore";
import { useTenantStore } from "@/stores/useTenantStore";

export default function ProductProfitabilityPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { period, startDate, endDate, label } = useDateStore();
  const { activeStoreId } = useTenantStore();
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 1,
  });

  const fetchProfitability = async () => {
    setLoading(true);
    try {
      let url = `/api/products/profitability?page=${pagination.page}&pageSize=${pagination.pageSize}&search=${encodeURIComponent(search)}&period=${period}&storeId=${activeStoreId}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setItems(data.items || []);
      setSummary(data.summary || {});
      if (data.pagination) setPagination(data.pagination);
    } catch (e) {
      toast.error("Kârlılık verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitability();
  }, [pagination.page, pagination.pageSize, period, startDate, endDate, activeStoreId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProfitability();
  };

  const handleExportCSV = () => {
    if (!items || items.length === 0) {
      toast.error("İndirilecek veri yok.");
      return;
    }

    const headers = "Barkod,Ürün Adı,Marka,Satılan Adet,Toplam Ciro (TL),Toplam Alış Maliyeti (TL),Komisyon Gideri (TL),Kargo Gideri (TL),Net Nakit Kâr (TL),Kâr Marjı (%)";
    const rows = items.map(p => 
      `"${p.barcode}","${(p.title || '').replace(/"/g, '""')}","${p.brand || 'Genject'}",${p.unitsSold},${p.totalRevenue},${p.totalCogs},${p.totalCommission},${p.totalShipping},${p.totalNetProfit},${p.marginPercent}`
    );
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Urun_Karlilik_Raporu_Sayfa_${pagination.page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Ürün kârlılık raporu başarıyla indirildi!");
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Ürün Bazlı Net Kârlılık & Marj Analizi</h3>
            <Badge variant="excellent">{summary.totalUniqueProducts || 0} Çeşit Ürün Satıldı</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Siparişlerde satılan her bir ürünün toplam adet, ciro, komisyon, kargo kesintisi ve net kâr dökümü
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleExportCSV} className="h-8 sm:h-9 text-xs gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary-hover text-white">
            <Download className="w-3.5 h-3.5" />
            <span>Excel (CSV) İndir</span>
          </Button>

          <Button size="sm" variant="outline" onClick={fetchProfitability} className="h-8 sm:h-9 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Satılan Toplam Ürün</span>
          <div className="text-2xl font-black text-dark tabular-nums mt-1">{summary.totalUnitsSold || 0} Adet</div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">Tüm Siparişlerden</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Toplam Ürün Cirosu</span>
          <div className="text-2xl font-black text-primary tabular-nums mt-1">{formatCurrency(parseFloat(summary.totalRevenue || 0))}</div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">KDV Dahil Satış</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">Toplam Net Kâr</span>
          <div className="text-2xl font-black text-emerald-700 tabular-nums mt-1">{formatCurrency(parseFloat(summary.totalNetProfit || 0))}</div>
          <span className="text-[11px] text-emerald-800 font-bold mt-1 block">Tüm Kesintiler Düştükten Sonra</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Ağırlıklı Kâr Marjı</span>
          <div className="text-2xl font-black text-dark tabular-nums mt-1">%{summary.overallMarginPercent || 0}</div>
          <span className="text-[11px] text-primary font-bold mt-1 block">Net Kâr / Toplam Ciro</span>
        </div>
      </div>

      {/* Search, Universal DateRangePicker and Page Size */}
      <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Barkod, ürün adı veya marka ile arayın..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-between sm:justify-end">
          {/* Global Header Date Range Indicator */}
          <div className="flex items-center gap-1.5 bg-canvas px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span suppressHydrationWarning>Dönem: {label}</span>
          </div>

          <select
            value={pagination.pageSize}
            onChange={(e) => setPagination(prev => ({ ...prev, page: 1, pageSize: parseInt(e.target.value) }))}
            className="px-2.5 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white shadow-xs cursor-pointer"
          >
            <option value={25}>25 Kayıt</option>
            <option value={50}>50 Kayıt</option>
            <option value={100}>100 Kayıt</option>
          </select>
        </div>
      </div>

      {/* Profitability Table */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Kârlılık analizi hesaplanıyor...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 font-bold">
            Bu tarih aralığında satılan ürün bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Ürün Adı & Barkod</th>
                  <th className="py-3 px-4">Marka</th>
                  <th className="py-3 px-4 text-center font-bold">Satılan Adet</th>
                  <th className="py-3 px-4 text-primary font-bold">Toplam Ciro (₺)</th>
                  <th className="py-3 px-4 font-bold text-red-700">Toplam Alış (₺)</th>
                  <th className="py-3 px-4">Komisyon Kesintisi</th>
                  <th className="py-3 px-4">Kargo Gideri</th>
                  <th className="py-3 px-4 text-emerald-700 font-bold">Net Nakit Kâr (₺)</th>
                  <th className="py-3 px-4 text-right">Kâr Marjı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((p, idx) => {
                  const isProfitable = parseFloat(p.totalNetProfit) >= 0;

                  return (
                    <tr key={idx} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                        <div className="flex items-center gap-2">
                          {p.imageUrl && (
                            <img src={p.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-border shrink-0" />
                          )}
                          <div>
                            <span className="block truncate max-w-[260px]">{p.title}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{p.barcode}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {p.brand}
                      </td>

                      <td className="py-3 px-4 text-center font-black tabular-nums">
                        {p.unitsSold} Adet
                      </td>

                      <td className="py-3 px-4 font-black text-primary tabular-nums">
                        {formatCurrency(parseFloat(p.totalRevenue || 0))}
                      </td>

                      <td className="py-3 px-4 font-bold text-red-700 tabular-nums">
                        ₺{parseFloat(p.totalCogs || 0).toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-gray-600 tabular-nums text-[11px]">
                        ₺{parseFloat(p.totalCommission || 0).toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-gray-600 tabular-nums text-[11px]">
                        ₺{parseFloat(p.totalShipping || 0).toFixed(2)}
                      </td>

                      <td className={`py-3 px-4 font-black tabular-nums ${isProfitable ? 'text-emerald-700' : 'text-red-600'}`}>
                        {formatCurrency(parseFloat(p.totalNetProfit || 0))}
                      </td>

                      <td className="py-3 px-4 text-right font-bold tabular-nums">
                        <Badge variant={isProfitable ? "excellent" : "secondary"}>
                          %{p.marginPercent}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION BAR */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-canvas border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-gray-500 font-semibold text-[11px]">
              Toplam <strong>{pagination.totalCount}</strong> üründen <strong>{(pagination.page - 1) * pagination.pageSize + 1}</strong> - <strong>{Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}</strong> arası gösteriliyor (Sayfa {pagination.page} / {pagination.totalPages})
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                disabled={pagination.page <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                let pageNum = pagination.page;
                if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                if (pageNum < 1 || pageNum > pagination.totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                    className={`h-8 w-8 p-0 font-bold ${
                      pagination.page === pageNum 
                        ? 'bg-primary text-white hover:bg-primary-hover shadow-xs' 
                        : 'text-dark bg-white'
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                size="sm"
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                disabled={pagination.page >= pagination.totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
