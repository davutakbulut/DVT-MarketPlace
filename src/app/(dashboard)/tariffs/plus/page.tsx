"use client";
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { TablePagination } from "@/components/common/TablePagination";
import { Sparkles, RefreshCw, Layers, TrendingUp, ArrowRight } from "lucide-react";

import { useTenantStore } from "@/stores/useTenantStore";

export default function PlusTariffPage() {
  const { activeStoreId } = useTenantStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?storeId=${activeStoreId}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.products || []);
      setProducts(list);
    } catch (e) {
      toast.error("Ürünler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeStoreId]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Trendyol Plus Komisyon Tarifesi Simülatörü</h3>
            <Badge variant="excellent">Canlı Veritabanı</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Trendyol Plus indirimli komisyon baremleri (%4-%6 komisyon indirimi) ile net kâr ve ciro artış simülasyonu
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={fetchProducts} className="h-8 sm:h-9 text-xs gap-1.5 font-bold">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Veritabanından ürünler yükleniyor...</span>
          </div>
        ) : (products || []).length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 font-bold">
            Veritabanında ürün bulunamadı.
          </div>
        ) : (
                    <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                    <th className="py-3 px-4 table-sticky-first-col bg-canvas">Ürün Adı & Barkod</th>
                    <th className="py-3 px-4 text-center">Fiyat (₺)</th>
                    <th className="py-3 px-4 text-center">Standart Komisyon</th>
                    <th className="py-3 px-4 text-center font-bold text-primary">Plus Komisyon</th>
                    <th className="py-3 px-4 text-center font-bold text-emerald-700">Tahmini Plus Tasarruf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(products || []).slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p) => {
                    const price = parseFloat(p.salePrice || 0);
                    const stdRate = parseFloat(p.commissionRate || 16.15);
                    const plusRate = Math.max(8.0, stdRate - 3.5);
                    const stdFee = (price * stdRate) / 100;
                    const plusFee = (price * plusRate) / 100;
                    const saving = Math.max(0, stdFee - plusFee);
                    return (
                      <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                        <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                          <span className="block truncate max-w-[260px]">{p.title}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{p.barcode}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-dark tabular-nums">₺{price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center text-gray-500 tabular-nums">%{stdRate.toFixed(1)}</td>
                        <td className="py-3 px-4 text-center font-black text-primary tabular-nums">%{plusRate.toFixed(1)}</td>
                        <td className="py-3 px-4 text-center font-black text-emerald-700 tabular-nums">+₺{saving.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card View */}
            <div className="block md:hidden divide-y divide-border/60">
              {(products || []).slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p) => {
                const price = parseFloat(p.salePrice || 0);
                const stdRate = parseFloat(p.commissionRate || 16.15);
                const plusRate = Math.max(8.0, stdRate - 3.5);
                const stdFee = (price * stdRate) / 100;
                const plusFee = (price * plusRate) / 100;
                const saving = Math.max(0, stdFee - plusFee);
                return (
                  <div key={p.id} className="p-3.5 space-y-2.5 bg-white hover:bg-canvas/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-dark truncate">{p.title}</h4>
                        <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{p.barcode}</span>
                      </div>
                      <Badge variant="excellent" className="text-[10px] shrink-0 font-bold">
                        +₺{saving.toFixed(2)} Tasarruf
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-canvas/60 p-2.5 rounded-2xl border border-border/80 text-[11px]">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Satış Fiyatı</span>
                        <span className="font-bold text-dark tabular-nums">₺{price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Standart</span>
                        <span className="font-semibold text-gray-500 tabular-nums">%{stdRate.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Plus Oran</span>
                        <span className="font-black text-primary tabular-nums">%{plusRate.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
