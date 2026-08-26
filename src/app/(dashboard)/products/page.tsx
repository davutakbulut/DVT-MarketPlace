"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Package, Search, Filter, RefreshCw, ExternalLink, Edit3, 
  Check, X, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  TrendingUp, Truck, Layers, DollarSign, Award, AlertCircle
} from "lucide-react";
import Image from "next/image";
import { useTenantStore } from "@/stores/useTenantStore";

export default function ProductsCatalogPage() {
  const { activeStoreId } = useTenantStore();
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 1,
  });

  // Inline Quick Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCost, setEditCost] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = `/api/products?page=${pagination.page}&pageSize=${pagination.pageSize}&search=${encodeURIComponent(search)}&brand=${selectedBrand}&stockStatus=${stockStatus}&storeId=${activeStoreId}`;
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
      setBrands(data.brands || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (e) {
      toast.error("Ürün listesi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, pagination.pageSize, selectedBrand, stockStatus, activeStoreId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const handleStartEdit = (p: any) => {
    setEditingId(p.id);
    setEditPrice(parseFloat(p.salePrice || 0));
    setEditCost(parseFloat(p.costPrice ?? p.currentCost ?? 0));
    setEditStock(parseInt(p.stockQuantity || 0));
  };

  const handleSaveEdit = async (productId: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          salePrice: editPrice,
          costPrice: editCost,
          stockQuantity: editStock
        }),
      });
      if (res.ok) {
        toast.success("Ürün bilgileri başarıyla güncellendi!");
        setEditingId(null);
        fetchProducts();
      }
    } catch (e) {
      toast.error("Güncelleme başarısız oldu.");
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Trendyol Ürün Kataloğu & Envanter</h3>
            <Badge variant="excellent">{pagination.totalCount} Aktif Ürün</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ürün görselleri, stok adetleri, satış fiyatları, alış maliyetleri ve doğrudan Trendyol bağlantıları
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchProducts} className="h-8 sm:h-9 text-xs gap-1.5 font-bold">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Ürün adı, barkod, model veya stok kodu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-between sm:justify-end">
          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white shadow-xs cursor-pointer"
          >
            <option value="all">Tüm Markalar</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white shadow-xs cursor-pointer"
          >
            <option value="all">Tüm Stok Durumları</option>
            <option value="in_stock">Stokta Var (&gt; 0)</option>
            <option value="out_of_stock">Stok Tükendi (0)</option>
          </select>

          {/* Page Size */}
          <select
            value={pagination.pageSize}
            onChange={(e) => setPagination(prev => ({ ...prev, page: 1, pageSize: parseInt(e.target.value) }))}
            className="px-2.5 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white shadow-xs cursor-pointer"
          >
            <option value={25}>25 Ürün</option>
            <option value={50}>50 Ürün</option>
            <option value={100}>100 Ürün</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Ürünler veritabanından yükleniyor...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 font-bold">
            Arama kriterlerine uygun ürün bulunamadı.
          </div>
        ) : (
                    <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">Görsel</th>
                    <th className="py-3 px-4 table-sticky-first-col bg-canvas">Ürün Adı & Model</th>
                    <th className="py-3 px-4">Marka</th>
                    <th className="py-3 px-4 text-center font-bold">Stok</th>
                    <th className="py-3 px-4 text-primary font-bold">Satış Fiyatı (₺)</th>
                    <th className="py-3 px-4 font-bold text-red-700">Alış Maliyeti (₺)</th>
                    <th className="py-3 px-4">Komisyon / KDV</th>
                    <th className="py-3 px-4">Desi</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {products.map((p) => {
                    const isEditing = editingId === p.id;
                    const hasStock = parseInt(p.stockQuantity || 0) > 0;

                    return (
                      <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                        <td className="py-3 px-4 text-center">
                          {p.imageUrl ? (
                            <img 
                              src={p.imageUrl} 
                              alt={p.title} 
                              className="w-10 h-10 object-cover rounded-xl border border-border shadow-2xs mx-auto"
                              onError={(e) => { (e.target as any).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-border flex items-center justify-center mx-auto text-gray-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                          <div className="flex items-center gap-1.5">
                            <span className="block truncate max-w-[280px]">{p.title}</span>
                            {p.deliveryType === 'fast_delivery' && (
                              <span className="text-[9px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">Hızlı</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 font-mono">Barkod: {p.barcode}</span>
                            {p.modelCode && <span className="text-[10px] text-gray-400 font-mono">Model: {p.modelCode}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-700">
                          {p.brand || 'Genject'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 rounded-lg border border-primary text-center font-bold"
                            />
                          ) : (
                            <Badge variant={hasStock ? "excellent" : "secondary"}>
                              {p.stockQuantity} Adet
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 font-black text-primary tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.5"
                              value={editPrice}
                              onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 rounded-lg border border-primary font-bold text-primary"
                            />
                          ) : (
                            `₺${parseFloat(p.salePrice || 0).toFixed(2)}`
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-red-700 tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.5"
                              value={editCost}
                              onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 rounded-lg border border-red-500 font-bold text-red-700"
                            />
                          ) : (
                            `₺${parseFloat(p.costPrice ?? p.currentCost ?? 0).toFixed(2)}`
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-[11px] tabular-nums">
                          <span>%{p.commissionRate || 16.15} Kom.</span>
                          <span className="text-[10px] text-gray-400 block">KDV: %{p.vatRate || 10}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-dark font-mono text-[11px]">
                          {p.desi ?? p.shipmentDesi ?? 1.0} Desi
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  disabled={saving}
                                  onClick={() => handleSaveEdit(p.id)}
                                  className="h-7 px-2 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Kaydet</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                  className="h-7 px-2 text-[10px] rounded-lg"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStartEdit(p)}
                                  className="h-7 px-2 text-[11px] font-bold text-gray-600 hover:text-dark hover:bg-canvas rounded-lg"
                                  title="Fiyat & Stok Düzenle"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </Button>
                                {p.marketplaceUrl && (
                                  <a
                                    href={p.marketplaceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg text-primary hover:bg-primary-tint-100 transition-colors"
                                    title="Trendyol Mağazasında Görüntüle"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card View */}
            <div className="block md:hidden divide-y divide-border/60">
              {products.map((p) => {
                const isEditing = editingId === p.id;
                const hasStock = parseInt(p.stockQuantity || 0) > 0;

                return (
                  <div key={p.id} className="p-3.5 space-y-3 bg-white hover:bg-canvas/30 transition-colors">
                    {/* Header: Image + Title + Badges */}
                    <div className="flex gap-3 items-start">
                      {p.imageUrl ? (
                        <img 
                          src={p.imageUrl} 
                          alt={p.title} 
                          className="w-12 h-12 object-cover rounded-2xl border border-border shadow-2xs shrink-0"
                          onError={(e) => { (e.target as any).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-canvas border border-border flex items-center justify-center shrink-0 text-gray-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-dark truncate max-w-[200px]">{p.title}</h4>
                          {p.deliveryType === 'fast_delivery' && (
                            <span className="text-[9px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded-full">Hızlı</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 font-mono">
                          <span>{p.barcode}</span>
                          <span>•</span>
                          <span>{p.brand || 'Genject'}</span>
                        </div>
                      </div>

                      <Badge variant={hasStock ? "excellent" : "secondary"} className="shrink-0 text-[10px]">
                        {p.stockQuantity} Adet
                      </Badge>
                    </div>

                    {/* Financial Micro-Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-canvas/60 p-2.5 rounded-2xl border border-border/80 text-[11px]">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Satış Fiyatı</span>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            value={editPrice}
                            onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 rounded-lg border border-primary font-black text-primary bg-white text-xs"
                          />
                        ) : (
                          <span className="font-black text-primary tabular-nums">₺{parseFloat(p.salePrice || 0).toFixed(2)}</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Alış Maliyeti</span>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            value={editCost}
                            onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 rounded-lg border border-red-500 font-bold text-red-700 bg-white text-xs"
                          />
                        ) : (
                          <span className="font-bold text-red-700 tabular-nums">₺{parseFloat(p.costPrice ?? p.currentCost ?? 0).toFixed(2)}</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Komisyon/Desi</span>
                        <span className="font-bold text-gray-700 tabular-nums">%{p.commissionRate || 16.15} / {p.desi ?? p.shipmentDesi ?? 1}D</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-400">KDV: %{p.vatRate || 10}</span>
                      
                      <div className="flex items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              disabled={saving}
                              onClick={() => handleSaveEdit(p.id)}
                              className="h-7 px-3 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Kaydet</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              className="h-7 px-2.5 text-[11px] rounded-xl"
                            >
                              İptal
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(p)}
                              className="h-7 px-2.5 text-[11px] font-bold gap-1 rounded-xl text-dark"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Düzenle</span>
                            </Button>
                            {p.marketplaceUrl && (
                              <a
                                href={p.marketplaceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-xl border border-border text-primary hover:bg-primary-tint-50 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* PAGINATION BAR */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-canvas border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-gray-500 font-semibold text-[11px]">
              Toplam <strong>{pagination.totalCount}</strong> üründen <strong>{(pagination.page - 1) * pagination.pageSize + 1}</strong> - <strong>{Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}</strong> arası gösteriliyor (Sayfa {pagination.page} / {pagination.totalPages})
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                let pageNum = pagination.page;
                if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                if (pageNum < 1 || pageNum > pagination.totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    onClick={() => handlePageChange(pageNum)}
                    className={`h-8 w-8 p-0 font-bold ${
                      pagination.page === pageNum 
                        ? 'bg-primary text-white hover:bg-primary-hover shadow-xs' 
                        : 'text-dark bg-white'
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page >= pagination.totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
