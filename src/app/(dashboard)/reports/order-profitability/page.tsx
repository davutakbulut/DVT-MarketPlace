"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  FileSpreadsheet, Download, RefreshCw, Eye, Filter, 
  Layers, Package, TrendingUp, AlertTriangle, Truck, Award,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search
, Calendar } from "lucide-react";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { useDateStore } from "@/store/useDateStore";

export default function OrderProfitabilityReportPage() {
  const [reportType, setReportType] = useState<'order' | 'product' | 'category' | 'returns' | 'shipping'>('order');
  const [reportData, setReportData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const { period, startDate, endDate, label } = useDateStore();
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/api/reports?type=${reportType}&page=${pagination.page}&pageSize=${pagination.pageSize}&search=${encodeURIComponent(search)}&period=${period}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      setReportData(json.data || []);
      if (json.pagination) {
        setPagination(json.pagination);
      }
    } catch (e) {
      toast.error("Rapor yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, pagination.page, pagination.pageSize, period, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchReport();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination({
      page: 1,
      pageSize: newSize,
      totalCount: pagination.totalCount,
      totalPages: Math.ceil(pagination.totalCount / newSize)
    });
  };

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      toast.error("İndirilecek veri yok.");
      return;
    }

    const headers = Object.keys(reportData[0]).join(",");
    const rows = reportData.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Trendyol_${reportType}_raporu_sayfa_${pagination.page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Rapor UTF-8 Excel CSV olarak başarıyla indirildi!");
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Kapsamlı Finansal & Kârlılık Raporları</h3>
            <Badge variant="excellent">2.366 Canlı Sipariş</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sipariş, ürün, marka, kargo ve iade bazında 4 aylık detaylı finansal kârlılık dökümleri
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleExportCSV} className="h-8 sm:h-9 text-xs gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary-hover text-white">
            <Download className="w-3.5 h-3.5" />
            <span>Excel (CSV) İndir</span>
          </Button>

          <Button size="sm" variant="outline" onClick={fetchReport} className="h-8 sm:h-9 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex items-center bg-canvas p-1 rounded-2xl border border-border overflow-x-auto gap-1">
        {[
          { id: 'order', label: '1. Sipariş Kârlılık', icon: FileSpreadsheet },
          { id: 'product', label: '2. Ürün Kârlılık', icon: Package },
          { id: 'category', label: '3. Marka & Kategori', icon: Award },
          { id: 'returns', label: '4. İade & Zarar Analizi', icon: AlertTriangle },
          { id: 'shipping', label: '5. Kargo & Desi Dağılımı', icon: Truck },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setReportType(t.id as any);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              reportType === t.id ? 'bg-primary text-white shadow-xs' : 'text-dark hover:bg-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search Bar, Universal DateRangePicker and Page Size Selector */}
      <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Arama yapın (Sipariş no, müşteri, barkod)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-between sm:justify-end">
          {/* Global Active Period Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas border border-border text-xs font-bold text-dark">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Dönem: {label}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={pagination.pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
            >
              <option value={25}>25 Kayıt</option>
              <option value={50}>50 Kayıt</option>
              <option value={100}>100 Kayıt</option>
              <option value={200}>200 Kayıt</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Tables */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'order' && (
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Sipariş No</th>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4">Müşteri</th>
                  <th className="py-3 px-4 text-primary font-bold">Ciro (₺)</th>
                  <th className="py-3 px-4">Maliyet (₺)</th>
                  <th className="py-3 px-4">Komisyon (₺)</th>
                  <th className="py-3 px-4">Kargo (₺)</th>
                  <th className="py-3 px-4 text-emerald-700 font-bold">Net Kâr (₺)</th>
                  <th className="py-3 px-4">Marj</th>
                  <th className="py-3 px-4 text-right">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reportData.map((r) => (
                  <tr key={r.id} onClick={() => setSelectedOrderId(r.id)} className="hover:bg-primary-tint-50/30 cursor-pointer">
                    <td className="py-2.5 px-4 table-sticky-first-col font-bold text-dark font-mono">{r.orderNumber}</td>
                    <td className="py-2.5 px-4 text-gray-500 tabular-nums">{r.orderDate}</td>
                    <td className="py-2.5 px-4 font-semibold text-dark truncate max-w-[140px]">{r.customerName}</td>
                    <td className="py-2.5 px-4 font-black text-primary tabular-nums">₺{parseFloat(r.paidAmount || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-4 font-bold text-red-700 tabular-nums">₺{parseFloat(r.cogs || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-gray-600 tabular-nums">₺{parseFloat(r.commission || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-gray-600 tabular-nums">₺{parseFloat(r.shippingCost || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-4 font-black text-emerald-700 tabular-nums">₺{parseFloat(r.netProfit || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-4 font-bold tabular-nums">
                      <Badge variant={parseFloat(r.netProfit) >= 0 ? "excellent" : "secondary"}>
                        %{parseFloat(r.marginPercent || 0).toFixed(1)}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Button size="sm" variant="ghost" className="h-6 text-[11px] font-bold text-primary">
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        İncele
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'product' && (
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Ürün Adı & Barkod</th>
                  <th className="py-3 px-4">Marka</th>
                  <th className="py-3 px-4 text-center font-bold">Satılan Adet</th>
                  <th className="py-3 px-4 text-primary font-bold">Toplam Ciro (₺)</th>
                  <th className="py-3 px-4">Toplam Maliyet (₺)</th>
                  <th className="py-3 px-4">Komisyon (₺)</th>
                  <th className="py-3 px-4 text-emerald-700 font-bold">Net Kâr (₺)</th>
                  <th className="py-3 px-4 text-right">Kâr Marjı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reportData.map((r, idx) => (
                  <tr key={idx} className="hover:bg-canvas/50">
                    <td className="py-2.5 px-4 table-sticky-first-col font-bold text-dark">
                      <span className="block truncate max-w-[280px]">{r.title}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{r.barcode}</span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-600 font-semibold">{r.brand}</td>
                    <td className="py-2.5 px-4 text-center font-black tabular-nums">{r.totalQuantity} Adet</td>
                    <td className="py-2.5 px-4 font-black text-primary tabular-nums">{formatCurrency(parseFloat(r.totalRevenue || 0))}</td>
                    <td className="py-2.5 px-4 font-bold text-red-700 tabular-nums">₺{parseFloat(r.totalCogs || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-gray-600 tabular-nums">₺{parseFloat(r.totalCommission || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-4 font-black text-emerald-700 tabular-nums">{formatCurrency(parseFloat(r.totalProfit || 0))}</td>
                    <td className="py-2.5 px-4 text-right font-bold tabular-nums">
                      <Badge variant="excellent">%{r.avgMarginPercent}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'category' && (
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4">Marka Adı</th>
                  <th className="py-3 px-4 text-center">Sipariş Sayısı</th>
                  <th className="py-3 px-4 text-center">Satılan Adet</th>
                  <th className="py-3 px-4 text-primary font-bold">Toplam Ciro (₺)</th>
                  <th className="py-3 px-4 text-emerald-700 font-bold">Toplam Net Kâr (₺)</th>
                  <th className="py-3 px-4 text-right">Ort. Kâr Marjı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reportData.map((r, idx) => (
                  <tr key={idx} className="hover:bg-canvas/50">
                    <td className="py-2.5 px-4 font-black text-dark">{r.brand}</td>
                    <td className="py-2.5 px-4 text-center font-bold tabular-nums">{r.orderCount} Sipariş</td>
                    <td className="py-2.5 px-4 text-center font-bold tabular-nums">{r.totalQuantity} Adet</td>
                    <td className="py-2.5 px-4 font-black text-primary tabular-nums">{formatCurrency(parseFloat(r.totalRevenue || 0))}</td>
                    <td className="py-2.5 px-4 font-black text-emerald-700 tabular-nums">{formatCurrency(parseFloat(r.totalProfit || 0))}</td>
                    <td className="py-2.5 px-4 text-right font-bold tabular-nums">
                      <Badge variant="excellent">%{r.marginPercent}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'returns' && (
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4">Sipariş No</th>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4">Müşteri</th>
                  <th className="py-3 px-4">Kargo Şirketi</th>
                  <th className="py-3 px-4 text-red-700 font-bold">Kargo Zararı (₺)</th>
                  <th className="py-3 px-4 text-red-700 font-bold">Hizmet Bedeli Zararı (₺)</th>
                  <th className="py-3 px-4 font-black text-red-700 text-right">Toplam İade Zararı (₺)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reportData.map((r) => (
                  <tr key={r.id} onClick={() => setSelectedOrderId(r.id)} className="hover:bg-red-50/40 cursor-pointer">
                    <td className="py-2.5 px-4 font-bold text-dark font-mono">{r.orderNumber}</td>
                    <td className="py-2.5 px-4 text-gray-500 tabular-nums">{r.orderDate}</td>
                    <td className="py-2.5 px-4 font-semibold text-dark">{r.customerName}</td>
                    <td className="py-2.5 px-4 text-gray-600">{r.carrierName}</td>
                    <td className="py-2.5 px-4 font-bold text-red-700 tabular-nums">₺{parseFloat(r.shippingLoss || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-4 font-bold text-red-700 tabular-nums">₺{parseFloat(r.serviceFeeLoss || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-4 font-black text-red-700 tabular-nums text-right">₺{parseFloat(r.totalReturnLoss || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'shipping' && (
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4">Kargo Firması</th>
                  <th className="py-3 px-4 text-center font-bold">Taşınan Paket</th>
                  <th className="py-3 px-4 text-center">Ort. Kargodan Alınan Desi</th>
                  <th className="py-3 px-4 text-primary font-bold">Toplam Kargo Faturası (₺)</th>
                  <th className="py-3 px-4 text-emerald-700 font-bold text-right">Bu Kargo İle Üretilen Net Kâr (₺)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reportData.map((r, idx) => (
                  <tr key={idx} className="hover:bg-canvas/50">
                    <td className="py-2.5 px-4 font-black text-dark">{r.carrier}</td>
                    <td className="py-2.5 px-4 text-center font-black tabular-nums">{r.totalShipments} Paket</td>
                    <td className="py-2.5 px-4 text-center font-bold tabular-nums text-primary">{r.avgBilledDesi} Desi</td>
                    <td className="py-2.5 px-4 font-black text-primary tabular-nums">{formatCurrency(parseFloat(r.totalShippingFee || 0))}</td>
                    <td className="py-2.5 px-4 font-black text-emerald-700 tabular-nums text-right">{formatCurrency(parseFloat(r.totalGeneratedProfit || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION BAR */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-canvas border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-gray-500 font-semibold text-[11px]">
              Toplam <strong>{pagination.totalCount}</strong> kayıttan <strong>{(pagination.page - 1) * pagination.pageSize + 1}</strong> - <strong>{Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}</strong> arası gösteriliyor (Sayfa {pagination.page} / {pagination.totalPages})
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page <= 1}
                className="h-8 w-8 p-0"
                title="İlk Sayfa"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="h-8 w-8 p-0"
                title="Önceki Sayfa"
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
                    onClick={() => handlePageChange(pageNum)}
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
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="h-8 w-8 p-0"
                title="Sonraki Sayfa"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page >= pagination.totalPages}
                className="h-8 w-8 p-0"
                title="Son Sayfa"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
