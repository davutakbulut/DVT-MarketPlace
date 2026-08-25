"use client";
import React, { useEffect, useState } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTableDensityStore } from "@/stores/useTableDensityStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { toast } from "sonner";
import { RefreshCw, Save, CheckCircle2, ZoomIn } from "lucide-react";

export default function LiveAnalysisPage() {
  const { activeStore } = useTenantStore();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { zoomLevel, setZoomLevel } = useTableDensityStore();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?storeId=${activeStore?.id || ''}`);
      const data = await res.json();
      const enhanced = data.map((r: any) => {
        const sale = parseFloat(r.salePrice) || 0;
        const cost = parseFloat(r.costPrice) || 0;
        const commRate = parseFloat(r.commissionRate) || 18;
        const comm = sale * ((commRate * 1.20) / 100);
        const shipping = 42.50;
        const service = 8.49;
        const withholding = (sale / 1.20) * 0.01;
        const netVat = Math.max(0, (sale * (1 - 1/1.20)) - (cost * (1 - 1/1.20) + shipping * (1 - 1/1.20) + comm * (1 - 1/1.20)));
        const netProfit = sale - (cost + comm + shipping + service + withholding + netVat);
        const margin = sale > 0 ? (netProfit / sale) * 100 : 0;
        return {
          ...r,
          salePrice: sale,
          costPrice: cost,
          commissionRate: commRate,
          ordersCount: Math.floor(Math.random() * 20) + 5,
          netProfit: Math.round(netProfit * 100) / 100,
          marginPercent: Math.round(margin * 100) / 100,
          isSaved: true
        };
      });
      setRows(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeStore?.id]);

  const handleCostChange = (id: string, newCost: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const comm = r.salePrice * ((r.commissionRate * 1.20) / 100);
          const shipping = 42.50;
          const service = 8.49;
          const withholding = (r.salePrice / 1.20) * 0.01;
          const netVat = Math.max(0, (r.salePrice * (1 - 1/1.20)) - (newCost * (1 - 1/1.20) + shipping * (1 - 1/1.20) + comm * (1 - 1/1.20)));
          const netProfit = r.salePrice - (newCost + comm + shipping + service + withholding + netVat);
          const margin = (netProfit / r.salePrice) * 100;
          return { ...r, costPrice: newCost, netProfit: Math.round(netProfit * 100) / 100, marginPercent: Math.round(margin * 100) / 100, isSaved: false };
        }
        return r;
      })
    );
  };

  const handleSaveRow = async (id: string, costPrice: number) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, costPrice }),
      });
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isSaved: true } : r)));
        toast.success("Maliyet Supabase veritabanına kaydedildi!");
      }
    } catch (e) {
      toast.error("Kaydedilirken hata oluştu.");
    }
  };

  const totalLiveProfit = rows.reduce((acc, r) => acc + (r.netProfit || 0) * (r.ordersCount || 1), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Live Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-primary-tint-200 bg-primary-tint-50/20 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-primary uppercase">Bugünkü Canlı Net Kârım</span>
          <div className="text-xl sm:text-2xl font-black text-primary tabular-nums mt-1">{formatCurrency(totalLiveProfit)}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Canlı sipariş kârı</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-dark uppercase">Kâr / Satış Oranı</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums mt-1">%28.4</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Günlük ortalama marj</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-dark uppercase">Kâr / Maliyet Oranı</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums mt-1">%54.2</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Sermaye kârlılığı</div>
        </div>
      </div>

      {/* Table Toolbar & Zoom Control */}
      <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-border gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-dark">Bugün Sipariş Alan Ürünler (Canlı Maliyet Düzenleyici)</h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Maliyeti düzenlediğiniz an kâr ve marjlar anında hesaplanır</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="hidden sm:flex items-center bg-canvas p-1 rounded-xl border border-border text-xs">
              <span className="text-[10px] font-bold text-gray-500 px-2 flex items-center gap-1">
                <ZoomIn className="w-3 h-3" /> Yakınlaştır:
              </span>
              {[85, 90, 100].map((z) => (
                <button
                  key={z}
                  onClick={() => setZoomLevel(z as 85 | 90 | 100)}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                    zoomLevel === z ? "bg-primary text-white" : "text-dark hover:bg-border/50"
                  }`}
                >
                  %{z}
                </button>
              ))}
            </div>

            <Button size="sm" variant="outline" onClick={fetchProducts} className="gap-1.5 text-xs h-8">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Yenile
            </Button>
          </div>
        </div>

        {/* Live Products Table with Horizontal Swipe Support */}
        <div className={`overflow-x-auto mt-3 sm:mt-4 transition-all ${zoomLevel === 85 ? 'table-zoom-85' : zoomLevel === 90 ? 'table-zoom-90' : 'table-zoom-100'}`}>
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3 px-3 table-sticky-first-col">Barkod / Ürün</th>
                <th className="pb-3 px-3 text-center">Sipariş</th>
                <th className="pb-3 px-3">Satış Fiyatı</th>
                <th className="pb-3 px-3">Ürün Maliyeti (₺)</th>
                <th className="pb-3 px-3">Komisyon</th>
                <th className="pb-3 px-3">Net Kâr (₺)</th>
                <th className="pb-3 px-3">Kâr Marjı</th>
                <th className="pb-3 px-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-canvas/60 transition-colors">
                  <td className="py-2.5 sm:py-3 px-3 table-sticky-first-col max-w-[200px] sm:max-w-[260px]">
                    <div className="font-mono font-bold text-dark text-[11px] sm:text-xs">{r.barcode}</div>
                    <div className="text-[11px] text-gray-700 font-medium truncate" title={r.title}>{r.title}</div>
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 text-center font-extrabold text-primary tabular-nums">
                    {r.ordersCount} Adet
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 font-bold text-dark tabular-nums">
                    {formatCurrency(r.salePrice)}
                  </td>
                  <td className="py-2.5 sm:py-3 px-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={r.costPrice || ""}
                        placeholder="Maliyet..."
                        onChange={(e) => handleCostChange(r.id, parseFloat(e.target.value) || 0)}
                        className={`w-20 sm:w-24 px-2 py-1 rounded-lg border font-bold text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-primary ${
                          r.costPrice === 0 ? "border-red-400 bg-red-50 text-red-700" : "border-border bg-white text-dark"
                        }`}
                      />
                      <span className="text-[10px] text-gray-500">₺</span>
                    </div>
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 font-semibold text-gray-700 tabular-nums">
                    %{r.commissionRate}
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 font-extrabold tabular-nums">
                    <span className={r.netProfit < 0 ? "text-status-danger-text" : "text-emerald-600"}>
                      {formatCurrency(r.netProfit)}
                    </span>
                  </td>
                  <td className="py-2.5 sm:py-3 px-3">
                    <Badge
                      variant={
                        r.marginPercent < 5
                          ? "danger"
                          : r.marginPercent < 15
                          ? "warning"
                          : r.marginPercent < 30
                          ? "success"
                          : "excellent"
                      }
                    >
                      {formatPercentage(r.marginPercent)}
                    </Badge>
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 text-right">
                    <Button
                      size="sm"
                      variant={r.isSaved ? "outline" : "default"}
                      className="h-7 text-[11px] gap-1 px-2"
                      onClick={() => handleSaveRow(r.id, r.costPrice)}
                    >
                      {r.isSaved ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Save className="w-3 h-3" />}
                      <span>{r.isSaved ? "Kayıtlı" : "Kaydet"}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
