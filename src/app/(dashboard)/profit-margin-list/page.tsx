"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Percent, Filter, ArrowUpRight, RefreshCw, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfitMarginListPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCostChange = (id: string, newCost: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, costPrice: newCost, isEdited: true } : p))
    );
  };

  const handleSaveCost = async (id: string, newCost: number) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, costPrice: newCost }),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isEdited: false } : p)));
        toast.success("Maliyet ve kâr marjı veritabanına kaydedildi!");
      }
    } catch (e) {
      toast.error("Kaydedilemedi.");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Kâr Marjı Listesi</h3>
            <Badge variant="excellent">Canlı Veritabanı</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ürün liste fiyatı ile müşteri satış fiyatı kıyası, maliyet düzenlemesi ve net marj analizi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchProducts} className="text-xs h-8 sm:h-9 gap-1.5 font-bold">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                <th className="py-3 px-4 table-sticky-first-col bg-canvas">Barkod / SKU</th>
                <th className="py-3 px-4">Ürün Adı</th>
                <th className="py-3 px-4">Satış Fiyatı</th>
                <th className="py-3 px-4">Maliyet (₺)</th>
                <th className="py-3 px-4">Net Kâr</th>
                <th className="py-3 px-4">Kâr Marjı</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {products.map((p) => {
                const salePrice = parseFloat(p.salePrice) || 0;
                const costPrice = parseFloat(p.costPrice) || 0;
                const comm = salePrice * ((parseFloat(p.commissionRate) || 18) * 1.20 / 100);
                const shipping = 46.49;
                const service = 13.19;
                const stopaj = (salePrice / 1.20) * 0.01;
                const totalCost = costPrice + comm + shipping + service + stopaj;
                const netProfit = Math.round((salePrice - totalCost) * 100) / 100;
                const margin = salePrice > 0 ? Math.round((netProfit / salePrice) * 1000) / 10 : 0;

                return (
                  <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4 table-sticky-first-col font-mono font-bold text-dark text-xs">
                      {p.barcode || p.sku}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {p.title}
                    </td>
                    <td className="py-3 px-4 font-black text-primary tabular-nums text-xs">
                      {formatCurrency(salePrice)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          value={costPrice}
                          onChange={(e) => handleCostChange(p.id, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 rounded-lg border border-border text-xs font-bold tabular-nums focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                        <span className="text-[10px] text-gray-400">TL</span>
                      </div>
                    </td>
                    <td className={`py-3 px-4 font-black tabular-nums text-xs ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(netProfit)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={margin >= 25 ? "excellent" : margin >= 15 ? "success" : margin >= 5 ? "warning" : "danger"}>
                        %{margin.toFixed(1)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant={p.isEdited ? "default" : "outline"}
                        className="h-7 text-[11px] gap-1 px-2.5 font-bold"
                        onClick={() => handleSaveCost(p.id, costPrice)}
                      >
                        <Save className="w-3 h-3" />
                        <span>Kaydet</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
