"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Activity, RefreshCw, Search, Eye, Filter, Truck, CheckCircle2, 
  AlertTriangle, DollarSign, Package, Clock, ShieldCheck, ChevronRight, 
  Layers, Edit3, Check, X
} from "lucide-react";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";

export default function LiveAnalysisPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");
  
  // Selected Order for Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Batch Cost Update Modal State
  const [batchCostModal, setBatchCostModal] = useState(false);
  const [batchBarcode, setBatchBarcode] = useState("");
  const [batchNewCost, setBatchNewCost] = useState<number>(0);
  const [savingBatch, setSavingBatch] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = `/api/orders?search=${encodeURIComponent(search)}&status=${statusFilter}&carrier=${carrierFilter}&limit=100`;
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
  }, [statusFilter, carrierFilter]);

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
      // Update in products table
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
            Trendyol mağazanızdan çekilen gerçek siparişler, komisyon, kargo baremi ve net kâr dökümleri
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => setBatchCostModal(true)}
            className="text-xs h-8 sm:h-9 gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary-hover text-white"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Toplu Maliyet Güncelle</span>
          </Button>

          <Button size="sm" variant="outline" onClick={fetchOrders} className="h-8 sm:h-9 text-xs gap-1.5 font-bold">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Toplam Sipariş</span>
          <div className="text-2xl font-black text-dark tabular-nums mt-1">{summary.totalOrders || 0} Adet</div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">4 Aylık Canlı Veri</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Toplam Ciro</span>
          <div className="text-2xl font-black text-primary tabular-nums mt-1">{formatCurrency(parseFloat(summary.totalInvoicedRevenue || 0))}</div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">Faturalanan Tutar</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Toplam Net Kâr</span>
          <div className="text-2xl font-black text-emerald-700 tabular-nums mt-1">{formatCurrency(parseFloat(summary.totalNetProfit || 0))}</div>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 block">Tüm Kesintiler Sonrası</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Ortalama Kâr Marjı</span>
          <div className="text-2xl font-black text-dark tabular-nums mt-1">%{parseFloat(summary.averageMarginPercent || 0).toFixed(1)}</div>
          <span className="text-[11px] text-primary font-bold mt-1 block">Net Kâr / Ciro</span>
        </div>
      </div>

      {/* Order Status Tabs (Tümü, Teslim Edildi, Kargoda, İptal/İade) */}
      <div className="flex items-center bg-canvas p-1 rounded-2xl border border-border overflow-x-auto gap-1">
        {[
          { id: 'all', label: 'Tüm Siparişler (2.366)' },
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

      {/* Search & Filter Bar */}
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark bg-white"
          >
            <option value="all">Tüm Kargolar</option>
            <option value="Trendyol Express">Trendyol Express</option>
            <option value="Aras">Aras Kargo</option>
            <option value="MNG">MNG Kargo</option>
            <option value="Yurtiçi">Yurtiçi Kargo</option>
            <option value="Sürat">Sürat Kargo</option>
            <option value="PTT">PTT Kargo</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                <th className="py-3 px-4 table-sticky-first-col bg-canvas">Sipariş & Paket No</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Müşteri & Şehir</th>
                <th className="py-3 px-4">Kargo & Desi</th>
                <th className="py-3 px-4 text-primary font-bold">Tutar (₺)</th>
                <th className="py-3 px-4">Maliyet (₺)</th>
                <th className="py-3 px-4">Komisyon + Kargo</th>
                <th className="py-3 px-4 text-emerald-700 font-bold">Net Kâr (₺)</th>
                <th className="py-3 px-4">Marj</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {orders.map((o) => {
                const isProfitable = parseFloat(o.netProfit) >= 0;
                return (
                  <tr 
                    key={o.id} 
                    onClick={() => setSelectedOrderId(o.id)}
                    className="hover:bg-primary-tint-50/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono">{o.orderNumber}</span>
                        {o.isCorporate && <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">Kurumsal</span>}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono block">Paket: {o.packageNumber}</span>
                    </td>

                    <td className="py-3 px-4 text-gray-500 tabular-nums text-[11px]">
                      {o.orderDate}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-dark block truncate max-w-[140px]">{o.customerName}</span>
                      <span className="text-[10px] text-gray-500">{o.city} {o.district ? `(${o.district})` : ''}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-dark block truncate max-w-[130px]">{o.carrierName}</span>
                      <span className="text-[10px] text-primary font-mono">{o.billedDesi} Desi</span>
                    </td>

                    <td className="py-3 px-4 font-black text-primary tabular-nums">
                      ₺{parseFloat(o.paidAmount || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-4 font-bold text-red-700 tabular-nums">
                      ₺{parseFloat(o.cogs || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-gray-600 tabular-nums text-[11px]">
                      ₺{(parseFloat(o.commission || 0) + parseFloat(o.shippingCost || 0)).toFixed(2)}
                    </td>

                    <td className={`py-3 px-4 font-black tabular-nums ${isProfitable ? 'text-emerald-700' : 'text-red-600'}`}>
                      ₺{parseFloat(o.netProfit || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-4 font-bold tabular-nums">
                      <Badge variant={isProfitable ? 'excellent' : 'secondary'} className="text-[10px]">
                        %{parseFloat(o.marginPercent || 0).toFixed(1)}
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
