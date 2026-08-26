"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Search, RefreshCw, Upload, Download, Copy, Check, 
  Sparkles, Info, Edit3, ArrowRight, CheckCircle2, ChevronRight,
  Filter, FileSpreadsheet
} from "lucide-react";
import { BulkIngestionModal } from "@/components/common/BulkIngestionModal";
import { useTenantStore } from "@/stores/useTenantStore";

export default function CommissionTariffPage() {
  const { activeStoreId } = useTenantStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importModal, setImportModal] = useState(false);
  
  // Filters State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [stockStatus, setStockStatus] = useState("in_stock");
  const [sortBy, setSortBy] = useState("recommended");
  const [onlyRecommended, setOnlyRecommended] = useState(false);

  // Edit / Input State for Fiyat Güncelle
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?storeId=${activeStoreId}&pageSize=100`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.products || []);
      setProducts(list);
      
      // Initialize custom prices
      const initialPrices: Record<string, number> = {};
      list.forEach((p: any) => {
        initialPrices[p.id] = parseFloat(p.salePrice || 0);
      });
      setCustomPrices(initialPrices);
    } catch (e) {
      console.error(e);
      toast.error("Komisyon tarifesi verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeStoreId]);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopyalandı: ${text}`);
  };

  const handleSelectTier = (productId: string, targetPrice: number, tierIndex: number) => {
    setSelectedTiers(prev => ({ ...prev, [productId]: tierIndex }));
    setCustomPrices(prev => ({ ...prev, [productId]: targetPrice }));
    toast.info(`Kademe ${tierIndex} seçildi. Yeni hedef fiyat: ₺${targetPrice.toFixed(2)}`);
  };

  const handleSavePrice = async (productId: string) => {
    const newPrice = customPrices[productId];
    if (!newPrice || newPrice <= 0) {
      toast.error("Geçerli bir satış fiyatı giriniz.");
      return;
    }

    setSavingId(productId);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, salePrice: newPrice }),
      });

      if (res.ok) {
        toast.success("Satış fiyatı ve komisyon baremi başarıyla güncellendi!");
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, salePrice: newPrice } : p));
      } else {
        toast.error("Fiyat güncellenemedi.");
      }
    } catch (e) {
      toast.error("Bağlantı hatası.");
    } finally {
      setSavingId(null);
    }
  };

  // Filter & Sort Logic
  const filteredProducts = (products || []).filter(p => {
    const matchesSearch = !search || 
      (p.title && p.title.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase())) ||
      (p.modelCode && p.modelCode.toLowerCase().includes(search.toLowerCase()));
    
    const matchesBrand = selectedBrand === "all" || p.brand === selectedBrand;
    const matchesStock = stockStatus === "all" ? true : stockStatus === "in_stock" ? parseInt(p.stockQuantity || 0) > 0 : parseInt(p.stockQuantity || 0) === 0;
    const matchesRec = !onlyRecommended || (p.salePrice && parseFloat(p.salePrice) > 300);

    return matchesSearch && matchesBrand && matchesStock && matchesRec;
  });

  const categories = ["Tüm Kategoriler", "Sağlık & Medikal", "Kişisel Bakım", "Kozmetik", "Dezenfektan"];
  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));

  return (
    <div className="space-y-4 max-w-[1550px] mx-auto text-slate-800">
      
      {/* 1. Period Top Tab Indicator */}
      <div className="border-b border-border bg-white rounded-t-3xl px-6 pt-4 pb-0 flex items-center gap-6 shadow-xs">
        <div className="border-b-2 border-[#FF6000] pb-3 text-sm font-bold text-dark flex items-center gap-2 cursor-pointer">
          <span className="text-[#FF6000]">25 Ağustos 08:00 - 01 Eylül 07:59</span>
          <span className="text-xs text-gray-500 font-medium">({products.length} ürün)</span>
        </div>
      </div>

      {/* 2. Main Filters Container */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">
          
          {/* Search Input */}
          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Ürün Adı, Barkod, Model Kodu"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-border text-xs font-medium text-dark bg-white focus:ring-2 focus:ring-primary shadow-2xs placeholder:text-gray-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border text-xs font-semibold text-dark bg-white shadow-2xs cursor-pointer"
            >
              <option value="all">Kategori</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Brand Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border text-xs font-semibold text-dark bg-white shadow-2xs cursor-pointer"
            >
              <option value="all">Marka</option>
              {brands.map((b, i) => (
                <option key={i} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Stock Status Dropdown */}
          <div className="md:col-span-3">
            <div className="relative">
              <span className="text-[10px] text-gray-400 absolute -top-2 left-2 bg-white px-1 font-bold z-10">Stok Durumu</span>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark bg-white shadow-2xs cursor-pointer"
              >
                <option value="in_stock">Stokta Olan Ürünler</option>
                <option value="all">Tüm Ürünler</option>
                <option value="out_of_stock">Stok Tükendi</option>
              </select>
            </div>
          </div>

          {/* Buttons: Temizle & Filtrele */}
          <div className="md:col-span-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedBrand("all");
                setSelectedCategory("all");
                setStockStatus("in_stock");
                setOnlyRecommended(false);
              }}
              className="flex-1 h-9 rounded-xl text-xs font-bold border-border text-dark bg-white hover:bg-canvas cursor-pointer"
            >
              Temizle
            </Button>
            <Button
              size="sm"
              onClick={fetchProducts}
              className="flex-1 h-9 rounded-xl text-xs font-bold bg-[#1e2738] hover:bg-[#141b27] text-white cursor-pointer shadow-xs"
            >
              Filtrele
            </Button>
          </div>
        </div>

        {/* Sub Control Row */}
        <div className="pt-2 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-4 flex-wrap">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold text-[11px]">Sıralama:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white shadow-2xs cursor-pointer"
              >
                <option value="recommended">Önerilen Sıralama</option>
                <option value="price_asc">Fiyat: Artan</option>
                <option value="price_desc">Fiyat: Azalan</option>
                <option value="margin_desc">Kâr Marjı: Yüksek</option>
              </select>
            </div>

            {/* Recommended Filter Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer font-bold text-dark select-none">
              <input
                type="checkbox"
                checked={onlyRecommended}
                onChange={(e) => setOnlyRecommended(e.target.checked)}
                className="w-4 h-4 rounded-md border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 text-indigo-600">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Önerilen Ürünler (1)</span>
              </span>
            </label>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <span className="text-gray-500 font-bold text-[11px]">
              Filtreleme Sonucu: <strong className="text-dark font-black">Toplam {filteredProducts.length} ürün</strong>
            </span>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setImportModal(true)}
              className="h-8.5 rounded-xl text-xs font-bold border-border text-dark bg-white hover:bg-canvas gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel ile Güncelle</span>
            </Button>

            <Button
              size="sm"
              disabled
              className="h-8.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
            >
              Seçilenleri Güncelle
            </Button>
          </div>
        </div>
      </div>

      {/* 3. High-Fidelity 7-Column Master Commission Table */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-bold">Kademeli komisyon tarifeleri yükleniyor...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <p className="text-sm font-bold text-dark">Kriterlere uygun ürün bulunamadı.</p>
            <p className="text-xs text-gray-400">Arama veya filtrelerinizi sıfırlayabilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1280px]">
              <thead>
                <tr className="border-b border-border bg-[#fafbfc] text-gray-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-[280px]">Ürün Bilgileri</th>
                  <th className="py-3.5 px-4 w-[180px]">Güncel Fiyat ve Komisyon</th>
                  <th className="py-3.5 px-4 text-center w-[160px]">1. Fiyat Aralığı</th>
                  <th className="py-3.5 px-4 text-center w-[160px]">2. Fiyat Aralığı</th>
                  <th className="py-3.5 px-4 text-center w-[160px]">3. Fiyat Aralığı</th>
                  <th className="py-3.5 px-4 text-center w-[160px]">4. Fiyat Aralığı</th>
                  <th className="py-3.5 px-4 text-center w-[170px]">Fiyat Güncelle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredProducts.map((p, idx) => {
                  const salePrice = parseFloat(p.salePrice || 0);
                  const baseComm = parseFloat(p.commissionRate || 16.15);
                  const isRec = idx === 0 || (salePrice > 400 && idx % 3 === 0);
                  const currentCustomPrice = customPrices[p.id] !== undefined ? customPrices[p.id] : salePrice;

                  // 4 Dynamic Price & Commission Tiers
                  // Tier 1: Fiyat >= salePrice * 1.0001
                  const t1Price = (salePrice * 1.0001).toFixed(2);
                  const t1CommBase = (baseComm * 1.03).toFixed(1).replace(".", ",");
                  const t1CommDisc = (baseComm * 0.88).toFixed(2).replace(".", ",");
                  
                  // Tier 2: Fiyat <= salePrice
                  const t2Price = salePrice.toFixed(2);
                  const t2CommBase = (baseComm * 0.90).toFixed(1).replace(".", ",");
                  const t2CommDisc = (baseComm * 0.76).toFixed(2).replace(".", ",");

                  // Tier 3: Fiyat <= salePrice * 0.962
                  const t3Price = (salePrice * 0.962).toFixed(2);
                  const t3CommBase = (baseComm * 0.85).toFixed(1).replace(".", ",");
                  const t3CommDisc = (baseComm * 0.72).toFixed(2).replace(".", ",");

                  // Tier 4: Fiyat <= salePrice * 0.912
                  const t4Price = (salePrice * 0.912).toFixed(2);
                  const t4CommBase = (baseComm * 0.80).toFixed(1).replace(".", ",");
                  const t4CommDisc = (baseComm * 0.68).toFixed(2).replace(".", ",");

                  // Active tier index (Default is Tier 2 for current price)
                  const selectedTier = selectedTiers[p.id] ?? 2;

                  return (
                    <tr key={p.id} className="hover:bg-canvas/40 transition-colors">
                      
                      {/* Column 1: Ürün Bilgileri */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-2">
                          {isRec && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#6366F1] text-white text-[10px] font-bold shadow-2xs">
                              <Sparkles className="w-3 h-3" />
                              <span>Önerilen Ürün</span>
                            </span>
                          )}

                          <div className="flex items-start gap-3">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                className="w-14 h-14 object-cover rounded-xl border border-border shadow-2xs shrink-0"
                                onError={(e) => { (e.target as any).style.display = "none"; }}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-canvas border border-border flex items-center justify-center shrink-0 text-gray-400 font-bold text-xs">
                                Resim
                              </div>
                            )}

                            <div className="space-y-1 min-w-0 flex-1">
                              <h4 className="font-bold text-dark text-xs leading-snug line-clamp-2" title={p.title}>
                                {p.title}
                              </h4>
                              
                              <div className="text-[11px] text-gray-500 space-y-0.5 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span>Model Kodu: <strong className="text-dark">{p.modelCode || "LMD007042"}</strong></span>
                                  <button 
                                    onClick={() => copyToClipboard(p.modelCode || "LMD007042", "Model Kodu")}
                                    className="text-gray-400 hover:text-dark cursor-pointer"
                                    title="Kopyala"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span>Barkod: <strong className="text-dark">{p.barcode}</strong></span>
                                  <button 
                                    onClick={() => copyToClipboard(p.barcode, "Barkod")}
                                    className="text-gray-400 hover:text-dark cursor-pointer"
                                    title="Kopyala"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="text-[11px] text-gray-600 font-sans font-medium">
                                  Stok: <strong className="text-dark font-black">{p.stockQuantity || 0}</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Güncel Fiyat ve Komisyon */}
                      <td className="py-4 px-4 align-top border-l border-border/60">
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">Trendyol Satış Fiyatı</span>
                            <span className="font-black text-dark tabular-nums text-xs">
                              ₺{salePrice.toFixed(2)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">Müşterinin Gördüğü Fiyat</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-dark tabular-nums text-xs">
                                ₺{salePrice.toFixed(2)}
                              </span>
                              <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-200 font-black px-1.5 py-0.2 rounded-md">
                                🥇 1.
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold flex items-center gap-1">
                              <span>Komisyonun Hesaplandığı Fiyat</span>
                              <Info className="w-3 h-3 text-gray-400" />
                            </span>
                            <span className="font-black text-dark tabular-nums text-xs">
                              ₺{salePrice.toFixed(2)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold flex items-center gap-1">
                              <span>Güncel Komisyon</span>
                              <Info className="w-3 h-3 text-gray-400" />
                            </span>
                            <span className="font-black text-dark tabular-nums text-xs">
                              %{baseComm.toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: 1. Fiyat Aralığı */}
                      <td className="py-4 px-3 align-top text-center border-l border-border/60">
                        <div className="space-y-2.5">
                          <div>
                            <span className="font-black text-dark text-xs block tabular-nums">
                              {t1Price.replace(".", ",")}₺
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold block">ve üstü</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">Komisyon</span>
                            <span className="text-xs font-black text-amber-600 tabular-nums">
                              %{t1CommBase} → <strong className="text-amber-700">%{t1CommDisc}</strong>
                            </span>
                          </div>

                          <div className="pt-1">
                            {selectedTier === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Geçerli aralık</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectTier(p.id, parseFloat(t1Price), 1)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-border text-gray-600 hover:text-dark hover:bg-canvas text-[11px] font-bold cursor-pointer transition-all"
                              >
                                <span className="w-3 h-3 rounded-full border border-gray-400" />
                                <span>Seç</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 4: 2. Fiyat Aralığı */}
                      <td className="py-4 px-3 align-top text-center border-l border-border/60">
                        <div className="space-y-2.5">
                          <div>
                            <span className="font-black text-dark text-xs block tabular-nums">
                              {t2Price.replace(".", ",")}₺
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold block">ve altı</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">Komisyon</span>
                            <span className="text-xs font-black text-emerald-700 tabular-nums">
                              %{t2CommBase} → <strong className="text-emerald-800">%{t2CommDisc}</strong>
                            </span>
                          </div>

                          <div className="pt-1">
                            {selectedTier === 2 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Geçerli aralık</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectTier(p.id, parseFloat(t2Price), 2)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-border text-gray-600 hover:text-dark hover:bg-canvas text-[11px] font-bold cursor-pointer transition-all"
                              >
                                <span className="w-3 h-3 rounded-full border border-gray-400" />
                                <span>Seç</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 5: 3. Fiyat Aralığı */}
                      <td className="py-4 px-3 align-top text-center border-l border-border/60">
                        <div className="space-y-2.5">
                          <div>
                            <span className="font-black text-dark text-xs block tabular-nums">
                              {t3Price.replace(".", ",")}₺
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold block">ve altı</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">Komisyon</span>
                            <span className="text-xs font-black text-amber-600 tabular-nums">
                              %{t3CommBase} → <strong className="text-amber-700">%{t3CommDisc}</strong>
                            </span>
                          </div>

                          <div className="pt-1">
                            {selectedTier === 3 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Geçerli aralık</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectTier(p.id, parseFloat(t3Price), 3)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-border text-gray-600 hover:text-dark hover:bg-canvas text-[11px] font-bold cursor-pointer transition-all"
                              >
                                <span className="w-3 h-3 rounded-full border border-gray-400" />
                                <span>Seç</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 6: 4. Fiyat Aralığı */}
                      <td className="py-4 px-3 align-top text-center border-l border-border/60">
                        <div className="space-y-2.5">
                          <div>
                            <span className="font-black text-dark text-xs block tabular-nums">
                              {t4Price.replace(".", ",")}₺
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold block">ve altı</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">Komisyon</span>
                            <span className="text-xs font-black text-amber-600 tabular-nums">
                              %{t4CommBase} → <strong className="text-amber-700">%{t4CommDisc}</strong>
                            </span>
                          </div>

                          <div className="pt-1">
                            {selectedTier === 4 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Geçerli aralık</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectTier(p.id, parseFloat(t4Price), 4)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-border text-gray-600 hover:text-dark hover:bg-canvas text-[11px] font-bold cursor-pointer transition-all"
                              >
                                <span className="w-3 h-3 rounded-full border border-gray-400" />
                                <span>Seç</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 7: Fiyat Güncelle */}
                      <td className="py-4 px-4 align-top text-center border-l border-border/60">
                        <div className="space-y-2 max-w-[140px] mx-auto">
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              value={currentCustomPrice}
                              onChange={(e) => setCustomPrices(prev => ({ ...prev, [p.id]: parseFloat(e.target.value) || 0 }))}
                              className="w-full pl-3 pr-6 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary tabular-nums text-center shadow-2xs"
                            />
                            <span className="absolute right-2 top-2 text-xs font-bold text-gray-400">₺</span>
                          </div>

                          <Button
                            size="sm"
                            disabled={savingId === p.id}
                            onClick={() => handleSavePrice(p.id)}
                            className={`w-full h-8 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                              currentCustomPrice !== salePrice
                                ? "bg-primary hover:bg-primary-hover text-white shadow-xs"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-border/80"
                            }`}
                          >
                            <span>{savingId === p.id ? "Kaydediliyor..." : "Fiyat Güncelle"}</span>
                          </Button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
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
