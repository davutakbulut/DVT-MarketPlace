"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Percent, Filter, ArrowUpRight, RefreshCw, Save, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";

export default function ProfitMarginListPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.products || []);
      setProducts(list);
    } catch (e) {
      console.error(e);
      toast.error("Ürünler yüklenemedi.");
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

  const filteredProducts = (products || []).filter(p => 
    !search || 
    (p.title && p.title.toLowerCase().includes(search.toLowerCase())) ||
    (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Kâr Marjı Listesi</h3>
            <Badge variant="excellent">Canlı Veritabanı</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ürün bazlı güncel satış fiyatları, maliyetler ve anlık kâr marjı dökümü
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchProducts} className="h-8 sm:h-9 text-xs gap-1.5 font-bold">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Ürün adı veya barkod ile filtrele..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Kâr marjları yükleniyor...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 font-bold">
            Ürün bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Ürün Adı & Barkod</th>
                  <th className="py-3 px-4">Satış Fiyatı (₺)</th>
                  <th className="py-3 px-4">Alış Maliyeti (₺)</th>
                  <th className="py-3 px-4">Komisyon Oranı</th>
                  <th className="py-3 px-4 text-emerald-700 font-bold">Tahmini Net Kâr (₺)</th>
                  <th className="py-3 px-4">Kâr Marjı</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredProducts.map((p) => {
                  const salePrice = parseFloat(p.salePrice || 0);
                  const costPrice = parseFloat(p.costPrice || 0);
                  const comm = parseFloat(p.commissionRate || 16.15);
                  const estProfit = salePrice - (costPrice + (salePrice * comm / 100) + 45 + 13.19);
                  const margin = salePrice > 0 ? (estProfit / salePrice) * 100 : 0;
                  const isProfitable = estProfit >= 0;

                  return (
                    <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                        <span className="block truncate max-w-[280px]">{p.title}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{p.barcode}</span>
                      </td>

                      <td className="py-3 px-4 font-black text-primary tabular-nums">
                        ₺{salePrice.toFixed(2)}
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.5"
                          value={p.costPrice || ''}
                          onChange={(e) => handleCostChange(p.id, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 rounded-lg border border-border text-xs font-bold text-dark bg-white focus:ring-1 focus:ring-primary"
                        />
                      </td>

                      <td className="py-3 px-4 text-gray-600 font-semibold tabular-nums">
                        %{comm.toFixed(1)}
                      </td>

                      <td className={`py-3 px-4 font-black tabular-nums ${isProfitable ? 'text-emerald-700' : 'text-red-600'}`}>
                        ₺{estProfit.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 font-bold tabular-nums">
                        <Badge variant={isProfitable ? 'excellent' : 'secondary'}>
                          %{margin.toFixed(1)}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {p.isEdited && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveCost(p.id, p.costPrice)}
                            className="h-7 px-2.5 text-[10px] font-bold bg-primary hover:bg-primary-hover text-white rounded-lg gap-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>Kaydet</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
