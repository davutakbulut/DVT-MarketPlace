"use client";
import React, { useState } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTableDensityStore } from "@/stores/useTableDensityStore";
import { toast } from "sonner";
import { RefreshCw, Save, CheckCircle2, ChevronRight, FileSpreadsheet, ZoomIn } from "lucide-react";

interface LiveProductRow {
  id: string;
  barcode: string;
  modelCode: string;
  title: string;
  ordersCount: number;
  salePrice: number;
  costPrice: number;
  costVatRate: number;
  desi: number;
  commissionRate: number;
  netProfit: number;
  marginPercent: number;
  isSaved?: boolean;
}

const initialRows: LiveProductRow[] = [
  { id: "1", barcode: "8690001001", modelCode: "MDL-A1", title: "Organik Argan Yağlı Saç Serumu 100ml", ordersCount: 28, salePrice: 289.90, costPrice: 65.00, costVatRate: 20, desi: 1, commissionRate: 18.0, netProfit: 94.20, marginPercent: 32.5 },
  { id: "2", barcode: "8690001002", modelCode: "MDL-A2", title: "C Vitamini Aydınlatıcı Yüz Serumu 30ml", ordersCount: 19, salePrice: 219.00, costPrice: 48.00, costVatRate: 20, desi: 1, commissionRate: 18.0, netProfit: 62.40, marginPercent: 28.5 },
  { id: "3", barcode: "8690001003", modelCode: "MDL-B1", title: "Hyaluronik Asit Nemlendirici Krem 50ml", ordersCount: 14, salePrice: 179.90, costPrice: 0.00, costVatRate: 20, desi: 1, commissionRate: 18.0, netProfit: -12.40, marginPercent: -6.9 },
  { id: "4", barcode: "8690001004", modelCode: "MDL-B2", title: "Doğal Gül Suyu Tonik 200ml", ordersCount: 11, salePrice: 129.50, costPrice: 25.00, costVatRate: 20, desi: 1, commissionRate: 17.5, netProfit: 35.10, marginPercent: 27.1 },
];

export default function LiveAnalysisPage() {
  const [rows, setRows] = useState<LiveProductRow[]>(initialRows);
  const { zoomLevel, setZoomLevel } = useTableDensityStore();

  const handleCostChange = (id: string, newCost: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const estimatedComm = r.salePrice * ((r.commissionRate * 1.20) / 100);
          const shipping = 42.00;
          const service = 8.49;
          const withholding = (r.salePrice / 1.20) * 0.01;
          const netVat = (r.salePrice * (1 - 1/1.20)) - (newCost * (1 - 1/1.20) + shipping * (1 - 1/1.20) + estimatedComm * (1 - 1/1.20));
          const netProfit = r.salePrice - (newCost + estimatedComm + shipping + service + withholding + Math.max(0, netVat));
          const marginPercent = (netProfit / r.salePrice) * 100;
          return { ...r, costPrice: newCost, netProfit, marginPercent, isSaved: false };
        }
        return r;
      })
    );
  };

  const handleSaveRow = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isSaved: true } : r)));
    toast.success("Ürün maliyeti veritabanına kaydedildi!");
  };

  const totalLiveProfit = rows.reduce((acc, r) => acc + r.netProfit * r.ordersCount, 0);
  const totalLiveOrders = rows.reduce((acc, r) => acc + r.ordersCount, 0);

  return (
    <div className="space-y-6">
      {/* Live Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-primary-tint-200 bg-primary-tint-50/20">
          <span className="text-[11px] font-bold text-primary uppercase">Bugünkü Net Kârım</span>
          <div className="text-2xl font-black text-primary tabular-nums mt-1">{formatCurrency(totalLiveProfit)}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{totalLiveOrders} Adet bugünkü canlı sipariş</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border">
          <span className="text-[11px] font-bold text-dark uppercase">Kâr / Satış Oranı</span>
          <div className="text-2xl font-black text-emerald-600 tabular-nums mt-1">%28.4</div>
          <div className="text-[10px] text-muted-foreground mt-1">Canlı günlük kâr marjı</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border">
          <span className="text-[11px] font-bold text-dark uppercase">Kâr / Maliyet Oranı</span>
          <div className="text-2xl font-black text-emerald-600 tabular-nums mt-1">%54.2</div>
          <div className="text-[10px] text-muted-foreground mt-1">Sermaye kârlılığı</div>
        </div>
      </div>

      {/* Table Toolbar & Zoom Control */}
      <div className="bg-white p-4 rounded-3xl border border-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
          <div>
            <h4 className="text-sm font-bold text-dark">Bugün Sipariş Alan Ürünler (Canlı Maliyet Düzenleyici)</h4>
            <p className="text-xs text-muted-foreground">Maliyet değiştikçe kâr ve marjlar anında otomatik hesaplanır</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-canvas p-1 rounded-xl border border-border text-xs">
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

            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Canlı Yenile
            </Button>
          </div>
        </div>

        {/* Live Products Table */}
        <div className={`overflow-x-auto mt-4 transition-all ${zoomLevel === 85 ? 'table-zoom-85' : zoomLevel === 90 ? 'table-zoom-90' : 'table-zoom-100'}`}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3 px-3">Barkod / Model</th>
                <th className="pb-3 px-3">Ürün Adı</th>
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
                  <td className="py-3 px-3 font-mono font-bold text-dark">
                    {r.barcode}
                    <span className="block text-[10px] text-gray-500 font-sans">{r.modelCode}</span>
                  </td>
                  <td className="py-3 px-3 font-medium text-dark max-w-[220px] truncate" title={r.title}>
                    {r.title}
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-primary tabular-nums">
                    {r.ordersCount} Adet
                  </td>
                  <td className="py-3 px-3 font-bold text-dark tabular-nums">
                    {formatCurrency(r.salePrice)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={r.costPrice || ""}
                        placeholder="Maliyet Gir..."
                        onChange={(e) => handleCostChange(r.id, parseFloat(e.target.value) || 0)}
                        className={`w-24 px-2.5 py-1 rounded-lg border font-bold text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-primary ${
                          r.costPrice === 0 ? "border-red-400 bg-red-50 text-red-700" : "border-border bg-white text-dark"
                        }`}
                      />
                      <span className="text-[10px] text-gray-500">₺</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-gray-700 tabular-nums">
                    %{r.commissionRate}
                  </td>
                  <td className="py-3 px-3 font-extrabold tabular-nums">
                    <span className={r.netProfit < 0 ? "text-status-danger-text" : "text-emerald-600"}>
                      {formatCurrency(r.netProfit)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
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
                  <td className="py-3 px-3 text-right">
                    <Button
                      size="sm"
                      variant={r.isSaved ? "outline" : "default"}
                      className="h-7 text-[11px] gap-1 px-2.5"
                      onClick={() => handleSaveRow(r.id)}
                    >
                      {r.isSaved ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Save className="w-3 h-3" />}
                      <span>{r.isSaved ? "Kaydedildi" : "Kaydet"}</span>
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
