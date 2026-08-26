"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Save, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "@/components/common/TablePagination";
import { useTenantStore } from "@/stores/useTenantStore";

export default function ProfitMarginListPage() {
  const { activeStoreId } = useTenantStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?storeId=${activeStoreId}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data.products || []));
    } catch (e) {
      toast.error("Ürünler veritabanından çekilemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeStoreId]);

  const handleCostChange = (id: string, newCost: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, costPrice: newCost, isEdited: true } : p))
    );
  };

  const handleSaveCost = async (id: string, costPrice: number) => {
    setSavingId(id);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, costPrice }),
      });

      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isEdited: false } : p)));
        toast.success("Maliyet ve kâr marjı veritabanına kaydedildi!");
      }
    } catch (e) {
      toast.error("Kaydedilemedi.");
    } finally {
      setSavingId(null);
    }
  };

  const filteredProducts = (products || []).filter(p => 
    !search || 
    (p.title && p.title.toLowerCase().includes(search.toLowerCase())) ||
    (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-xs focus:ring-2 focus:ring-primary font-bold text-dark bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
                  <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                    <th className="py-3 px-4 table-sticky-first-col">Ürün Bilgisi</th>
                    <th className="py-3 px-4 text-primary font-bold">Satış Fiyatı</th>
                    <th className="py-3 px-4">Alış Maliyeti (₺)</th>
                    <th className="py-3 px-4">Komisyon</th>
                    <th className="py-3 px-4">Tahmini Net Kâr</th>
                    <th className="py-3 px-4">Kâr Marjı (%)</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedProducts.map((p) => {
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
                          {p.isEdited ? (
                            <Button
                              size="sm"
                              onClick={() => handleSaveCost(p.id, p.costPrice)}
                              disabled={savingId === p.id}
                              className="h-7 text-[11px] font-bold px-2.5 bg-primary text-white hover:bg-primary-hover shadow-xs"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              <span>Kaydet</span>
                            </Button>
                          ) : (
                            <span className="text-gray-300 flex items-center justify-end gap-1 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Güncel</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card View */}
            <div className="block md:hidden divide-y divide-border/60">
              {paginatedProducts.map((p) => {
                const salePrice = parseFloat(p.salePrice || 0);
                const costPrice = parseFloat(p.costPrice || 0);
                const comm = parseFloat(p.commissionRate || 16.15);
                const estProfit = salePrice - (costPrice + (salePrice * comm / 100) + 45 + 13.19);
                const margin = salePrice > 0 ? (estProfit / salePrice) * 100 : 0;
                const isProfitable = estProfit >= 0;

                return (
                  <div key={p.id} className="p-3.5 space-y-3 bg-white hover:bg-canvas/30 transition-colors">
                    {/* Header: Title + Margin Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-dark truncate">{p.title}</h4>
                        <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{p.barcode}</span>
                      </div>
                      <Badge variant={isProfitable ? 'excellent' : 'secondary'} className="shrink-0 text-[10px]">
                        %{margin.toFixed(1)} Marj
                      </Badge>
                    </div>

                    {/* Financial Micro-Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-canvas/60 p-2.5 rounded-2xl border border-border/80 text-[11px]">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Satış Fiyatı</span>
                        <span className="font-black text-primary tabular-nums">₺{salePrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Komisyon</span>
                        <span className="font-bold text-gray-700 tabular-nums">%{comm.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Net Kâr</span>
                        <span className={`font-black tabular-nums ${isProfitable ? 'text-emerald-700' : 'text-red-600'}`}>
                          ₺{estProfit.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Cost Input & Save Action Row */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2 flex-1">
                        <label className="text-[11px] font-bold text-gray-600 shrink-0">Alış Maliyeti:</label>
                        <input
                          type="number"
                          step="0.5"
                          value={p.costPrice || ''}
                          onChange={(e) => handleCostChange(p.id, parseFloat(e.target.value) || 0)}
                          placeholder="₺0.00"
                          className="w-24 px-2 py-1 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {p.isEdited ? (
                        <Button
                          size="sm"
                          onClick={() => handleSaveCost(p.id, p.costPrice)}
                          disabled={savingId === p.id}
                          className="h-8 text-xs font-bold px-3 bg-primary text-white hover:bg-primary-hover rounded-xl shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5 mr-1" />
                          <span>Kaydet</span>
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-[11px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Kayıtlı</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredProducts.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
