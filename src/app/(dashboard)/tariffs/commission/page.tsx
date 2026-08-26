"use client";
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Layers, Upload, Download, RefreshCw, Sparkles, ArrowRight } from "lucide-react";
import { BulkIngestionModal } from "@/components/common/BulkIngestionModal";

export default function CommissionTariffPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importModal, setImportModal] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.products || []);
      setProducts(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Ürün Komisyon Tarifesi (4 Barem Simülatörü)</h3>
            <Badge variant="excellent">Canlı Veritabanı</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fiyat aralıklarına göre kademeli komisyon oranları ve kâr simülasyonu
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setImportModal(true)}
            className="text-xs h-8 sm:h-9 gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary-hover text-white"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Excel ile İçe Aktar</span>
          </Button>

          <Button size="sm" variant="outline" onClick={fetchProducts} className="h-8 sm:h-9 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Komisyon tarifeleri yükleniyor...</span>
          </div>
        ) : (products || []).length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 font-bold">
            Veritabanında ürün bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Ürün Adı & Barkod</th>
                  <th className="py-3 px-4">Satış Fiyatı (₺)</th>
                  <th className="py-3 px-4">Mevcut Komisyon</th>
                  <th className="py-3 px-4">1. Barem (&lt;100₺)</th>
                  <th className="py-3 px-4">2. Barem (100-300₺)</th>
                  <th className="py-3 px-4">3. Barem (300-600₺)</th>
                  <th className="py-3 px-4 text-right">4. Barem (&gt;600₺)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(products || []).map((p) => {
                  const currentPrice = parseFloat(p.salePrice || 100);
                  const comm = parseFloat(p.commissionRate || 16.15);

                  return (
                    <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                        <span className="block truncate max-w-[260px]">{p.title}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{p.barcode}</span>
                      </td>

                      <td className="py-3 px-4 font-black text-primary tabular-nums">
                        ₺{currentPrice.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 font-bold text-dark tabular-nums">
                        %{comm.toFixed(1)}
                      </td>

                      <td className="py-3 px-4 font-bold text-emerald-700 tabular-nums">
                        %{(comm * 0.85).toFixed(1)}
                      </td>

                      <td className="py-3 px-4 font-bold text-sky-700 tabular-nums">
                        %{(comm * 0.92).toFixed(1)}
                      </td>

                      <td className="py-3 px-4 font-bold text-amber-700 tabular-nums">
                        %{comm.toFixed(1)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-gray-700 tabular-nums">
                        %{(comm * 1.05).toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BulkIngestionModal
        isOpen={importModal}
        importType="tariffs"
        title="Ürün Komisyon Tarifesi Excel Yükleme"
        onClose={() => setImportModal(false)}
        onSuccess={() => {
          setImportModal(false);
          fetchProducts();
        }}
      />
    </div>
  );
}
