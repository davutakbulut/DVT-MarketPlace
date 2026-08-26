"use client";
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Layers, Upload, Download, RefreshCw, Sparkles, ArrowRight } from "lucide-react";
import { BulkIngestionModal } from "@/components/common/BulkIngestionModal";

export default function CommissionTariffPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importModal, setImportModal] = useState(false);

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

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Ürün Komisyon Tarifesi (4 Barem Simülatörü)</h3>
            <Badge variant="excellent">Adım 20: Ingestion & Barem</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fiyat aralıklarına göre kademeli komisyon oranları, kâr farkı simülasyonu ve toplu Excel komisyon yükleme
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setImportModal(true)}
            className="text-xs h-8 sm:h-9 gap-1.5 font-bold shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Excel ile İçe Aktar</span>
          </Button>

          <Button size="sm" variant="ghost" onClick={fetchProducts} className="h-8 sm:h-9 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 4 Tier Simulation Table */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                <th className="py-3 px-4 table-sticky-first-col bg-canvas">Barkod / Ürün Adı</th>
                <th className="py-3 px-4">Mevcut Fiyat / Komisyon</th>
                <th className="py-3 px-4 text-emerald-800 font-bold">1. Barem Fiyatı (%14.0)</th>
                <th className="py-3 px-4">2. Barem Fiyatı (%11.0)</th>
                <th className="py-3 px-4">3. Barem Fiyatı (%8.0)</th>
                <th className="py-3 px-4 text-right">Önerilen Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {products.map((p) => {
                const salePrice = parseFloat(p.salePrice) || 289.90;
                const comm = parseFloat(p.commissionRate) || 18.5;
                const b1Price = Math.round((salePrice * 0.88) * 10) / 10;
                const b2Price = Math.round((salePrice * 0.72) * 10) / 10;
                const b3Price = Math.round((salePrice * 0.55) * 10) / 10;

                return (
                  <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4 table-sticky-first-col font-semibold text-gray-800">
                      <div className="font-bold text-dark">{p.title}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{p.barcode || p.sku}</div>
                    </td>
                    <td className="py-3 px-4 font-black text-primary tabular-nums">
                      {formatCurrency(salePrice)} <span className="text-gray-500 font-normal">(%{comm})</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700 tabular-nums">
                      {formatCurrency(b1Price)}
                      <Badge variant="success" className="ml-1.5 text-[10px]">+₺12.40 Kâr</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-700 tabular-nums">
                      {formatCurrency(b2Price)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-700 tabular-nums">
                      {formatCurrency(b3Price)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold px-2.5">
                        1. Bareme Geç
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <BulkIngestionModal
        isOpen={importModal}
        onClose={() => setImportModal(false)}
        importType="products"
        title="Toplu Ürün & Maliyet Listesi İçe Aktar"
        onSuccess={fetchProducts}
      />
    </div>
  );
}
