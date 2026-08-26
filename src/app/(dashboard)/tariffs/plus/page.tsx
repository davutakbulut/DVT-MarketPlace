"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Search, RefreshCw, Upload, Download, Copy, Check, 
  Sparkles, Info, Edit3, ArrowRight, CheckCircle2, ChevronRight,
  Filter, FileSpreadsheet, Plus, Tag, Flame
} from "lucide-react";
import { BulkIngestionModal } from "@/components/common/BulkIngestionModal";
import { useTenantStore } from "@/stores/useTenantStore";

export default function PlusTariffPage() {
  const { activeStoreId } = useTenantStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importModal, setImportModal] = useState(false);
  
  // Filters State
  const [searchTitle, setSearchTitle] = useState("");
  const [searchBarcode, setSearchBarcode] = useState("");
  const [searchModel, setSearchModel] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [stockStatus, setStockStatus] = useState("in_stock");
  const [sortBy, setSortBy] = useState("best_selling");

  // Edit / Input State for Fiyat Güncelle
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [selectedTiers, setSelectedTiers] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?storeId=${activeStoreId}&pageSize=100`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.products || []);
      setProducts(list);
      
      const initialPrices: Record<string, string> = {};
      list.forEach((p: any) => {
        initialPrices[p.id] = "";
      });
      setCustomPrices(initialPrices);
    } catch (e) {
      console.error(e);
      toast.error("Trendyol Plus komisyon tarifeleri yüklenemedi.");
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

  const handleSelectPlusTier = (productId: string, plusTargetPrice: number) => {
    setSelectedTiers(prev => ({ ...prev, [productId]: !prev[productId] }));
    setCustomPrices(prev => ({ ...prev, [productId]: plusTargetPrice.toFixed(2) }));
    toast.info(`Plus fiyat aralığı seçildi: ₺${plusTargetPrice.toFixed(2)}`);
  };

  const handleSavePrice = async (productId: string) => {
    const enteredPrice = parseFloat(customPrices[productId] || "0");
    if (!enteredPrice || enteredPrice <= 0) {
      toast.error("Lütfen geçerli bir fiyat giriniz.");
      return;
    }

    setSavingId(productId);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, salePrice: enteredPrice }),
      });

      if (res.ok) {
        toast.success("Trendyol Plus özel fiyatı başarıyla güncellendi!");
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, salePrice: enteredPrice } : p));
        setCustomPrices(prev => ({ ...prev, [productId]: "" }));
      } else {
        toast.error("Fiyat kaydedilemedi.");
      }
    } catch (e) {
      toast.error("Sunucu bağlantı hatası.");
    } finally {
      setSavingId(null);
    }
  };

  // Filtering
  const filteredProducts = (products || []).filter(p => {
    const matchesTitle = !searchTitle || (p.title && p.title.toLowerCase().includes(searchTitle.toLowerCase()));
    const matchesBarcode = !searchBarcode || (p.barcode && p.barcode.toLowerCase().includes(searchBarcode.toLowerCase()));
    const matchesModel = !searchModel || (p.modelCode && p.modelCode.toLowerCase().includes(searchModel.toLowerCase()));
    const matchesBrand = selectedBrand === "all" || p.brand === selectedBrand;
    const matchesStock = stockStatus === "all" ? true : stockStatus === "in_stock" ? parseInt(p.stockQuantity || 0) > 0 : parseInt(p.stockQuantity || 0) === 0;

    return matchesTitle && matchesBarcode && matchesModel && matchesBrand && matchesStock;
  });

  const categories = ["Tüm Kategoriler", "Sağlık & Medikal", "Kişisel Bakım", "Kozmetik", "Dezenfektan"];
  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));

  return (
    <div className="space-y-4 max-w-[1550px] mx-auto text-slate-800">
      
      {/* 1. Header Hero Banner with Trendyol Plus Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#24030d] via-[#3a0b1c] to-[#1c020a] text-white p-6 sm:p-8 border border-rose-950/40 shadow-md">
        {/* Floating Decorative Elements */}
        <div className="absolute top-3 left-4 w-6 h-6 rounded-md bg-gradient-to-br from-orange-400 to-rose-500 opacity-70 rotate-12 flex items-center justify-center font-black text-xs text-white">
          +
        </div>
        <div className="absolute bottom-3 left-16 w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 opacity-60 -rotate-12 flex items-center justify-center font-black text-sm text-white">
          +
        </div>
        <div className="absolute top-1/2 right-48 w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 opacity-50 rotate-45 flex items-center justify-center font-black text-[10px] text-white hidden lg:flex">
          +
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Trendyol Plus Logo */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10">
              <span className="font-extrabold text-base tracking-tight text-white">trendyol</span>
              <span className="bg-[#FF6000] text-white text-xs font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                plus
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white/95">
              Komisyon Tarifeleri ile Trendyol Plus Müşterilerine Özel Fiyatlandırma Yapabilirsiniz!
            </h2>
          </div>

          {/* Refresh / Action */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchProducts}
              className="h-8 text-xs gap-1.5 font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Yenile</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Main White Filter Card */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        
        {/* Date Tab Indicator */}
        <div className="border-b border-border px-6 pt-4 pb-0 flex items-center gap-6">
          <div className="border-b-2 border-[#FF6000] pb-3 text-sm font-bold text-dark flex items-center gap-2 cursor-pointer">
            <span className="text-[#FF6000]">25 Ağustos 08:00 - 01 Eylül 07:59</span>
            <span className="text-xs text-gray-500 font-medium">({products.length} ürün)</span>
          </div>
        </div>

        {/* Filters Multi-Row Container */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Row 1: Search Inputs & Stock Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Ürün Adı"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-border text-xs font-medium text-dark bg-white focus:ring-2 focus:ring-primary shadow-2xs placeholder:text-gray-400"
            />
            <input
              type="text"
              placeholder="Barkod"
              value={searchBarcode}
              onChange={(e) => setSearchBarcode(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-border text-xs font-medium text-dark bg-white focus:ring-2 focus:ring-primary shadow-2xs placeholder:text-gray-400"
            />
            <input
              type="text"
              placeholder="Model Kodu"
              value={searchModel}
              onChange={(e) => setSearchModel(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-border text-xs font-medium text-dark bg-white focus:ring-2 focus:ring-primary shadow-2xs placeholder:text-gray-400"
            />
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

          {/* Row 2: Category, Brand, Status & Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-3">
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

            <div className="md:col-span-3">
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

            <div className="md:col-span-2">
              <div className="relative">
                <span className="text-[10px] text-gray-400 absolute -top-2 left-2 bg-white px-1 font-bold z-10">Statü</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs font-semibold text-dark bg-white shadow-2xs cursor-pointer"
                >
                  <option value="all">Hepsi</option>
                  <option value="active">Aktif</option>
                  <option value="passive">Pasif</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTitle("");
                  setSearchBarcode("");
                  setSearchModel("");
                  setSelectedBrand("all");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                  setStockStatus("in_stock");
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

          {/* 3. Blue/Lavender Notice Box */}
          <div className="bg-[#f0f4ff] border border-[#d6e2ff] text-[#2c4cb3] px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <span>Trendyol Plus fiyat aralığı güncellemeleriniz <strong className="font-bold text-[#1a358f]">25 Ağustos 08:00 - 01 Eylül 07:59</strong> tarihleri arasında geçerli olacaktır.</span>
          </div>

          {/* 4. Sub Control Bar */}
          <div className="pt-2 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="text-[10px] text-gray-400 absolute -top-2 left-2 bg-white px-1 font-bold z-10">Sıralama</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white shadow-2xs cursor-pointer"
                >
                  <option value="best_selling">Senin En Çok Satanların</option>
                  <option value="price_asc">Fiyat: Artan</option>
                  <option value="price_desc">Fiyat: Azalan</option>
                  <option value="margin_desc">Kâr Marjı: Yüksek</option>
                </select>
              </div>
            </div>

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
                Seçilenleri Güncelle (0)
              </Button>
            </div>
          </div>
        </div>

        {/* 5. 4-Column High-Fidelity Plus Table */}
        <div className="border-t border-border overflow-hidden">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-xs text-gray-500 font-bold">Trendyol Plus komisyon tarifeleri yükleniyor...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="text-sm font-bold text-dark">Kriterlere uygun ürün bulunamadı.</p>
              <p className="text-xs text-gray-400">Arama veya filtrelerinizi sıfırlayabilirsiniz.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-border bg-[#fafbfc] text-gray-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-[380px]">Ürün Bilgileri</th>
                    <th className="py-3.5 px-4 w-[240px]">
                      <span className="flex items-center gap-1">
                        <span>Güncel Fiyat ve Komisyon</span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                      </span>
                    </th>
                    <th className="py-3.5 px-4 text-center w-[240px]">
                      <div className="inline-flex items-center gap-1 font-bold">
                        <span className="text-[#FF6000] font-black text-sm">+</span>
                        <span className="font-extrabold text-dark">trendyol</span>
                        <span className="text-[#FF6000] font-black">plus</span>
                        <span className="text-gray-500 font-bold ml-1">Fiyat Aralığı</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center w-[200px]">Fiyat Güncelle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredProducts.map((p, idx) => {
                    const salePrice = parseFloat(p.salePrice || 0);
                    const baseComm = parseFloat(p.commissionRate || 16.15);
                    const rank = idx + 1;
                    
                    // Customer view price & Plus discounted prices
                    const custPrice = (salePrice * 0.863).toFixed(2);
                    const plusBasePrice = (salePrice * 0.820).toFixed(2);
                    const plusLimitPrice = (salePrice * 0.540).toFixed(2);

                    // Plus reduced commission bracket
                    const plusCommBase = (baseComm * 0.25).toFixed(1).replace(".", ",");
                    const plusCommDisc = (baseComm * 0.215).toFixed(2).replace(".", ",");

                    const isSelected = selectedTiers[p.id] || false;
                    const customPriceValue = customPrices[p.id] || "";

                    return (
                      <tr key={p.id} className="hover:bg-canvas/40 transition-colors">
                        
                        {/* Column 1: Ürün Bilgileri */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-start gap-3">
                            
                            {/* Rank Badge */}
                            <div className="shrink-0 pt-1">
                              <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black">
                                🥇 {rank}.
                              </span>
                            </div>

                            {/* Product Image */}
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                className="w-16 h-16 object-cover rounded-xl border border-border shadow-2xs shrink-0"
                                onError={(e) => { (e.target as any).style.display = "none"; }}
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-canvas border border-border flex items-center justify-center shrink-0 text-gray-400 font-bold text-xs">
                                Resim
                              </div>
                            )}

                            {/* Info */}
                            <div className="space-y-1 min-w-0 flex-1">
                              <h4 className="font-bold text-dark text-xs leading-snug line-clamp-2 hover:underline cursor-pointer" title={p.title}>
                                {p.title}
                              </h4>
                              
                              <div className="text-[11px] text-gray-500 space-y-0.5 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span>Model Kodu: <strong className="text-dark">{p.modelCode || "WMGNJS"}</strong></span>
                                  <button 
                                    onClick={() => copyToClipboard(p.modelCode || "WMGNJS", "Model Kodu")}
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
                              <span className="font-black text-dark tabular-nums text-xs">
                                ₺{custPrice}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold flex items-center gap-1">
                                <span>Komisyona Esas Fiyat / Komisyon</span>
                                <Info className="w-3 h-3 text-gray-400" />
                              </span>
                              <span className="font-black text-dark tabular-nums text-xs">
                                ₺{custPrice} / %{baseComm.toFixed(2).replace(".", ",")}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold flex items-center gap-1">
                                <span>Plus Komisyona Esas Fiyat / Komisyon</span>
                                <Info className="w-3 h-3 text-gray-400" />
                              </span>
                              <span className="font-black text-dark tabular-nums text-xs">
                                ₺{plusBasePrice} / %{baseComm.toFixed(2).replace(".", ",")}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Column 3: trendyol plus Fiyat Aralığı */}
                        <td className="py-4 px-4 align-top text-center border-l border-border/60">
                          <div className="space-y-2.5 max-w-[170px] mx-auto">
                            <div>
                              <span className="font-black text-dark text-xs block tabular-nums">
                                {plusLimitPrice.replace(".", ",")}₺
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold block">ve altı</span>
                            </div>

                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">Komisyon</span>
                              <span className="text-xs font-black text-amber-600 tabular-nums">
                                %{plusCommBase} → <strong className="text-amber-700">%{plusCommDisc}</strong>
                              </span>
                            </div>

                            <div className="pt-1">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Geçerli aralık</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSelectPlusTier(p.id, parseFloat(plusLimitPrice))}
                                  className="inline-flex items-center gap-1 px-3.5 py-1 rounded-xl border border-border text-gray-600 hover:text-dark hover:bg-canvas text-[11px] font-bold cursor-pointer transition-all"
                                >
                                  <span className="w-3 h-3 rounded-full border border-gray-400" />
                                  <span>Seç</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 4: Fiyat Güncelle */}
                        <td className="py-4 px-4 align-top text-center border-l border-border/60">
                          <div className="space-y-2 max-w-[150px] mx-auto">
                            {/* Ürün Komisyonu Yellow Tag */}
                            <div className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold w-full">
                              <Tag className="w-3 h-3 text-amber-600" />
                              <span>Ürün Komisyonu</span>
                            </div>

                            {/* Input Field */}
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Fiyat Giriniz"
                                value={customPriceValue}
                                onChange={(e) => setCustomPrices(prev => ({ ...prev, [p.id]: e.target.value }))}
                                className="w-full pl-3 pr-7 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary tabular-nums placeholder:text-gray-400 shadow-2xs"
                              />
                              <Edit3 className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2 pointer-events-none" />
                            </div>

                            {/* Submit Button */}
                            <Button
                              size="sm"
                              disabled={!customPriceValue || savingId === p.id}
                              onClick={() => handleSavePrice(p.id)}
                              className={`w-full h-8 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                customPriceValue 
                                  ? "bg-primary hover:bg-primary-hover text-white shadow-xs" 
                                  : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
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
      </div>

      {/* Bulk Upload Modal */}
      <BulkIngestionModal
        isOpen={importModal}
        importType="tariffs"
        title="Trendyol Plus Komisyon Tarifesi Excel Yükleme"
        onClose={() => setImportModal(false)}
        onSuccess={() => {
          setImportModal(false);
          fetchProducts();
        }}
      />
    </div>
  );
}
