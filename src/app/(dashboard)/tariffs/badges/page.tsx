"use client";
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { Award, RefreshCw, Sparkles, ArrowRight } from "lucide-react";

export default function AdvantageousBadgesPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
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
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Avantajlı Ürün Etiketi & Eşik Kârlılık Analizi</h3>
            <Badge variant="excellent">Canlı Veritabanı</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Avantaj, Çok Avantaj ve Süper Avantaj etiket eşiklerindeki satış fiyatı ve net kâr simülasyonu
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Ürün Adı & Barkod</th>
                  <th className="py-3 px-4">Mevcut Fiyat</th>
                  <th className="py-3 px-4 text-emerald-700 font-bold">⭐ Avantaj Fiyatı (%5 İndirim)</th>
                  <th className="py-3 px-4 text-sky-700 font-bold">🔥 Çok Avantaj (%10 İndirim)</th>
                  <th className="py-3 px-4 text-amber-700 font-bold text-right">⚡ Süper Avantaj (%15 İndirim)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(products || []).map((p) => {
                  const currentPrice = parseFloat(p.salePrice || 100);
                  const cost = parseFloat(p.costPrice || 50);
                  const comm = parseFloat(p.commissionRate || 18);
                  
                  const p1 = currentPrice * 0.95;
                  const profit1 = p1 - (cost + (p1 * comm / 100) + 45 + 13.19);
                  
                  const p2 = currentPrice * 0.90;
                  const profit2 = p2 - (cost + (p2 * comm / 100) + 45 + 13.19);
                  
                  const p3 = currentPrice * 0.85;
                  const profit3 = p3 - (cost + (p3 * comm / 100) + 45 + 13.19);

                  return (
                    <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                        <span className="block truncate max-w-[280px]">{p.title}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{p.barcode}</span>
                      </td>

                      <td className="py-3 px-4 font-bold text-dark tabular-nums">
                        ₺{currentPrice.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 tabular-nums">
                        <span className="font-black text-emerald-700 block">₺{p1.toFixed(2)}</span>
                        <span className="text-[10px] text-emerald-800 font-bold">Kâr: ₺{profit1.toFixed(2)}</span>
                      </td>

                      <td className="py-3 px-4 tabular-nums">
                        <span className="font-black text-sky-700 block">₺{p2.toFixed(2)}</span>
                        <span className="text-[10px] text-sky-800 font-bold">Kâr: ₺{profit2.toFixed(2)}</span>
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums">
                        <span className="font-black text-amber-700 block">₺{p3.toFixed(2)}</span>
                        <span className="text-[10px] text-amber-800 font-bold">Kâr: ₺{profit3.toFixed(2)}</span>
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
