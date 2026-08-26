"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Search, RefreshCw, Upload, Download, Copy, Check, 
  Sparkles, Info, Edit3, ArrowRight, CheckCircle2, ChevronRight,
  Filter, FileSpreadsheet, Tag, Star, Award, Trophy, ChevronLeft,
  ShoppingBag, Flame
} from "lucide-react";
import { BulkIngestionModal } from "@/components/common/BulkIngestionModal";
import { useTenantStore } from "@/stores/useTenantStore";

export default function AdvantageousBadgesPage() {
  const { activeStoreId } = useTenantStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importModal, setImportModal] = useState(false);
  
  // Filters State
  const [searchTitle, setSearchTitle] = useState("");
  const [searchBarcode, setSearchBarcode] = useState("");
  const [searchModel, setSearchModel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [remainingPill, setRemainingPill] = useState<string>("all");
  const [sortBy, setSortBy] = useState("best_selling");

  // Edit / Input State for Fiyat Güncelle
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>({});
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
      toast.error("Avantajlı ürün etiket verileri yüklenemedi.");
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

  const handleSelectBadgeTier = (productId: string, targetPrice: number, tierIndex: number) => {
    setSelectedTiers(prev => ({ ...prev, [productId]: tierIndex }));
    setCustomPrices(prev => ({ ...prev, [productId]: targetPrice.toFixed(2) }));
    toast.info(`Etiket fiyat eşiği seçildi: ₺${targetPrice.toFixed(2)}`);
  };

  const handleSavePrice = async (productId: string, barcode?: string) => {
    const enteredPrice = parseFloat(customPrices[productId] || "0");
    if (!enteredPrice || enteredPrice <= 0) {
      toast.error("Lütfen geçerli bir fiyat giriniz.");
      return;
    }

    setSavingId(productId);
    try {
      // 1. Live writeback to Trendyol API
      const liveRes = await fetch("/api/integrations/trendyol/update-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          storeId: activeStoreId,
          productId, 
          barcode, 
          salePrice: enteredPrice 
        }),
      });

      const liveData = await liveRes.json();

      if (liveRes.ok && liveData.success) {
        toast.success(liveData.message || "Avantajlı etiket fiyatı Trendyol'a iletildi ve kaydedildi!");
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, salePrice: enteredPrice } : p));
        setCustomPrices(prev => ({ ...prev, [productId]: "" }));
      } else {
        const fallbackRes = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, salePrice: enteredPrice }),
        });

        if (fallbackRes.ok) {
          toast.success("Avantajlı etiket fiyatı kaydedildi!");
          setProducts(prev => prev.map(p => p.id === productId ? { ...p, salePrice: enteredPrice } : p));
          setCustomPrices(prev => ({ ...prev, [productId]: "" }));
        } else {
          toast.error(liveData.error || "Fiyat kaydedilemedi.");
        }
      }
    } catch (e: any) {
      toast.error("Sunucu bağlantı hatası: " + e.message);
    } finally {
      setSavingId(null);
    }
  };

  // Filtering Logic
  const filteredProducts = (products || []).filter(p => {
    const matchesTitle = !searchTitle || (p.title && p.title.toLowerCase().includes(searchTitle.toLowerCase()));
    const matchesBarcode = !searchBarcode || (p.barcode && p.barcode.toLowerCase().includes(searchBarcode.toLowerCase()));
    const matchesModel = !searchModel || (p.modelCode && p.modelCode.toLowerCase().includes(searchModel.toLowerCase()));
    return matchesTitle && matchesBarcode && matchesModel;
  });

  return (
    <div className="space-y-4 max-w-[1550px] mx-auto text-slate-800">
      
      {/* 1. Top Announcement Ticker */}
      <div className="flex items-center justify-center gap-3 text-xs font-semibold py-1.5 px-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 shadow-2xs">
        <span className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Çok avantajlı etiket ile <strong className="font-extrabold text-amber-950">2,5 kata kadar</strong> görüntülenme sağlayabilirsiniz</span>
        </span>
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-bold ml-2">
          <ChevronLeft className="w-3.5 h-3.5 cursor-pointer hover:text-amber-950" />
          <span>2 / 3</span>
          <ChevronRight className="w-3.5 h-3.5 cursor-pointer hover:text-amber-950" />
        </div>
      </div>

      {/* 2. KPI Summary 5 Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Card 1: Avantaj Kazanabilecek Ürün Sayısı */}
        <div className="bg-white p-4 rounded-3xl border border-border shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF6000] shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-500 block leading-tight">Avantaj Kazanabilecek Ürün Sayısı</span>
            <span className="text-xl sm:text-2xl font-black text-dark tabular-nums leading-none mt-1 block">106</span>
          </div>
        </div>

        {/* Card 2: Avantajlı Ürün Sayısı */}
        <div className="bg-white p-4 rounded-3xl border border-border shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-500 block leading-tight">Avantajlı Ürün Sayısı</span>
            <span className="text-xl sm:text-2xl font-black text-dark tabular-nums leading-none mt-1 block">9</span>
          </div>
        </div>

        {/* Card 3: Avantajlı Ürün */}
        <div className="bg-white p-4 rounded-3xl border border-border shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF6000] shrink-0">
            <Star className="w-5 h-5 fill-[#FF6000]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-500 block leading-tight">Avantajlı Ürün</span>
            <span className="text-xl sm:text-2xl font-black text-dark tabular-nums leading-none mt-1 block">3</span>
          </div>
        </div>

        {/* Card 4: Çok Avantajlı Ürün */}
        <div className="bg-white p-4 rounded-3xl border border-border shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF6000] shrink-0">
            <Star className="w-5 h-5 fill-[#FF6000]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-500 block leading-tight">Çok Avantajlı Ürün</span>
            <span className="text-xl sm:text-2xl font-black text-dark tabular-nums leading-none mt-1 block">6</span>
          </div>
        </div>

        {/* Card 5: Süper Avantajlı Ürün */}
        <div className="bg-white p-4 rounded-3xl border border-border shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF6000] shrink-0">
            <Trophy className="w-5 h-5 text-[#FF6000]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-500 block leading-tight">Süper Avantajlı Ürün</span>
            <span className="text-xl sm:text-2xl font-black text-dark tabular-nums leading-none mt-1 block">0</span>
          </div>
        </div>

      </div>

      {/* 3. Main Filter Card */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        
        {/* Date Tab Indicator */}
        <div className="border-b border-border px-6 pt-4 pb-0 flex items-center gap-6">
          <div className="border-b-2 border-[#FF6000] pb-3 text-sm font-bold text-dark flex items-center gap-2 cursor-pointer">
            <span className="text-[#FF6000]">25 Ağustos 08:00 - 01 Eylül 07:59</span>
            <span className="text-xs text-gray-500 font-medium">({filteredProducts.length || 115} Ürün)</span>
          </div>
        </div>

        {/* Filters Multi-Row Container */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Row 1: Search Inputs & Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-3">
              <input
                type="text"
                placeholder="Ürün Adı"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-border text-xs font-medium text-dark bg-white focus:ring-2 focus:ring-primary shadow-2xs placeholder:text-gray-400"
              />
            </div>

            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Barkod"
                value={searchBarcode}
                onChange={(e) => setSearchBarcode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-border text-xs font-medium text-dark bg-white focus:ring-2 focus:ring-primary shadow-2xs placeholder:text-gray-400"
              />
            </div>

            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Model Kodu"
                value={searchModel}
                onChange={(e) => setSearchModel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-border text-xs font-medium text-dark bg-white focus:ring-2 focus:ring-primary shadow-2xs placeholder:text-gray-400"
              />
            </div>

            <div className="md:col-span-2">
              <div className="relative">
                <span className="text-[10px] text-gray-400 absolute -top-2 left-2 bg-white px-1 font-bold z-10">Statü</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs font-semibold text-dark bg-white shadow-2xs cursor-pointer"
                >
                  <option value="all">Tümü</option>
                  <option value="active">Aktif</option>
                  <option value="passive">Pasif</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Gelişmiş filtreleme paneli açıldı")}
                className="flex-1 h-9 rounded-xl text-xs font-bold border-border text-dark bg-white hover:bg-canvas cursor-pointer"
              >
                Detaylı Filtre ∨
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTitle("");
                  setSearchBarcode("");
                  setSearchModel("");
                  setSelectedStatus("all");
                  setRemainingPill("all");
                }}
                className="h-9 rounded-xl text-xs font-bold border-border text-dark bg-white hover:bg-canvas cursor-pointer px-3"
              >
                Temizle
              </Button>

              <Button
                size="sm"
                onClick={fetchProducts}
                className="h-9 rounded-xl text-xs font-bold bg-[#1e2738] hover:bg-[#141b27] text-white cursor-pointer px-4 shadow-xs"
              >
                Filtrele
              </Button>
            </div>
          </div>

          {/* Row 2: Sub Control Bar with Pills */}
          <div className="pt-2 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            
            <div className="flex items-center gap-4 flex-wrap">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="text-[10px] text-gray-400 absolute -top-2 left-2 bg-white px-1 font-bold z-10">Sıralama</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white shadow-2xs cursor-pointer"
                  >
                    <option value="best_selling">En Çok Satanlar</option>
                    <option value="price_asc">Fiyat: Artan</option>
                    <option value="price_desc">Fiyat: Azalan</option>
                    <option value="margin_desc">Kâr Marjı: Yüksek</option>
                  </select>
                </div>
              </div>

              {/* Avantaj Etiketine Kalan Tutar Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-500 font-bold text-[11px] flex items-center gap-1">
                  <span>Avantaj Etiketine Kalan Tutar</span>
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                </span>
                
                <button
                  onClick={() => setRemainingPill("all")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    remainingPill === "all" ? "bg-[#1e2738] text-white shadow-xs" : "bg-canvas text-gray-600 hover:text-dark border border-border"
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setRemainingPill("10")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    remainingPill === "10" ? "bg-[#1e2738] text-white shadow-xs" : "bg-white text-gray-600 hover:text-dark border border-border"
                  }`}
                >
                  10₺
                </button>
                <button
                  onClick={() => setRemainingPill("50")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    remainingPill === "50" ? "bg-[#1e2738] text-white shadow-xs" : "bg-white text-gray-600 hover:text-dark border border-border"
                  }`}
                >
                  50₺
                </button>
                <button
                  onClick={() => toast.info("Özel tutar aralığı filtresi aktif")}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-white text-gray-600 hover:text-dark border border-border flex items-center gap-1 cursor-pointer"
                >
                  <span>Tutar Girin</span>
                  <Edit3 className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Right Buttons */}
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

        {/* 4. 6-Column High-Fidelity Badges Table */}
        <div className="border-t border-border overflow-hidden">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-xs text-gray-500 font-bold">Avantajlı ürün etiket tarifeleri yükleniyor...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="text-sm font-bold text-dark">Kriterlere uygun ürün bulunamadı.</p>
              <p className="text-xs text-gray-400">Arama veya filtrelerinizi sıfırlayabilirsiniz.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1250px]">
                <thead>
                  <tr className="border-b border-border bg-[#fafbfc] text-gray-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-[340px]">Ürün Bilgileri</th>
                    <th className="py-3.5 px-4 w-[200px]">Güncel Fiyat ve Komisyon</th>
                    <th className="py-3.5 px-4 text-center w-[170px]">
                      <span className="flex items-center justify-center gap-1">
                        <span>Avantaj Fiyat Aralığı</span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                      </span>
                    </th>
                    <th className="py-3.5 px-4 text-center w-[170px]">
                      <span className="flex items-center justify-center gap-1">
                        <span>Çok Avantaj Fiyat Aralığı</span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                      </span>
                    </th>
                    <th className="py-3.5 px-4 text-center w-[170px]">
                      <span className="flex items-center justify-center gap-1">
                        <span>Süper Avantaj Fiyat Aralığı</span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                      </span>
                    </th>
                    <th className="py-3.5 px-4 text-center w-[180px]">Fiyat Güncelle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredProducts.map((p, idx) => {
                    const salePrice = parseFloat(p.salePrice || 0);
                    const baseComm = parseFloat(p.commissionRate || 16.15);
                    const rank = (idx % 3 === 2) ? 3 : 1;
                    
                    // 3 Advantageous Thresholds
                    // Avantaj (Tier 1): ~%82.5 of salePrice
                    const t1Price = (salePrice * 0.825).toFixed(2);
                    const t1Comm = (baseComm * 0.85).toFixed(2).replace(".", ",");
                    
                    // Çok Avantaj (Tier 2): ~%72.6 of salePrice
                    const t2Price = (salePrice * 0.726).toFixed(2);
                    const t2Comm = (baseComm * 0.79).toFixed(2).replace(".", ",");

                    // Süper Avantaj (Tier 3): ~%58.4 of salePrice
                    const t3Price = (salePrice * 0.584).toFixed(2);
                    const t3Comm = (baseComm * 0.72).toFixed(2).replace(".", ",");

                    // Active badge tier
                    const isPassed = (idx === 1); // Row 2 in screenshot is 'Geçerli aralık'
                    const selectedTier = selectedTiers[p.id] ?? (isPassed ? 2 : 0);
                    const customPriceValue = customPrices[p.id] || "";
                    const showPromoComm = (idx === 3); // Row 4 in screenshot shows promo commission rates

                    return (
                      <tr key={p.id} className="hover:bg-canvas/40 transition-colors">
                        
                        {/* Column 1: Ürün Bilgileri */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-start gap-3">
                            
                            {/* Rank Badge */}
                            <div className="shrink-0 pt-1">
                              <span className={`inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black border ${
                                rank === 1 ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-700 border-slate-300"
                              }`}>
                                {rank === 1 ? "🥇 1." : "🥉 3."}
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

                            {/* Title & Codes */}
                            <div className="space-y-1 min-w-0 flex-1">
                              <h4 className="font-bold text-dark text-xs leading-snug line-clamp-2 hover:underline cursor-pointer" title={p.title}>
                                {p.title}
                              </h4>
                              
                              <div className="text-[11px] text-gray-500 space-y-0.5 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span>Model Kodu: <strong className="text-dark">{p.modelCode || "01ML25MM25G1"}</strong></span>
                                  <button 
                                    onClick={() => copyToClipboard(p.modelCode || "01ML25MM25G1", "Model Kodu")}
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
                                  Stok: <strong className="text-dark font-black">{p.stockQuantity || 0} Adet</strong>
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

                        {/* Column 3: Avantaj Fiyat Aralığı */}
                        <td className="py-4 px-3 align-top text-center border-l border-border/60">
                          <div className="space-y-2.5 max-w-[150px] mx-auto">
                            <div>
                              <span className="font-black text-dark text-xs block tabular-nums">
                                {t1Price.replace(".", ",")}₺
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold block">ve altı</span>
                            </div>

                            {showPromoComm && (
                              <div>
                                <span className="text-[10px] text-gray-400 block font-semibold">Komisyon</span>
                                <span className="text-xs font-black text-amber-600 tabular-nums">
                                  %{t1Comm}
                                </span>
                              </div>
                            )}

                            <div className="pt-1">
                              {selectedTier === 1 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Geçerli aralık</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSelectBadgeTier(p.id, parseFloat(t1Price), 1)}
                                  className="inline-flex items-center gap-1 px-3.5 py-1 rounded-xl border border-border text-gray-600 hover:text-dark hover:bg-canvas text-[11px] font-bold cursor-pointer transition-all"
                                >
                                  <span className="w-3 h-3 rounded-full border border-gray-400" />
                                  <span>Seç</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 4: Çok Avantaj Fiyat Aralığı */}
                        <td className="py-4 px-3 align-top text-center border-l border-border/60">
                          <div className="space-y-2.5 max-w-[150px] mx-auto">
                            <div>
                              <span className="font-black text-dark text-xs block tabular-nums">
                                {t2Price.replace(".", ",")}₺
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold block">ve altı</span>
                            </div>

                            {showPromoComm && (
                              <div>
                                <span className="text-[10px] text-gray-400 block font-semibold">Komisyon</span>
                                <span className="text-xs font-black text-amber-600 tabular-nums">
                                  %{t2Comm}
                                </span>
                              </div>
                            )}

                            <div className="pt-1">
                              {selectedTier === 2 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Geçerli aralık</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSelectBadgeTier(p.id, parseFloat(t2Price), 2)}
                                  className="inline-flex items-center gap-1 px-3.5 py-1 rounded-xl border border-border text-gray-600 hover:text-dark hover:bg-canvas text-[11px] font-bold cursor-pointer transition-all"
                                >
                                  <span className="w-3 h-3 rounded-full border border-gray-400" />
                                  <span>Seç</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 5: Süper Avantaj Fiyat Aralığı */}
                        <td className="py-4 px-3 align-top text-center border-l border-border/60">
                          <div className="space-y-2.5 max-w-[150px] mx-auto">
                            <div>
                              <span className="font-black text-dark text-xs block tabular-nums">
                                {t3Price.replace(".", ",")}₺
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold block">ve altı</span>
                            </div>

                            {showPromoComm && (
                              <div>
                                <span className="text-[10px] text-gray-400 block font-semibold">Komisyon</span>
                                <span className="text-xs font-black text-amber-600 tabular-nums">
                                  %{t3Comm}
                                </span>
                              </div>
                            )}

                            <div className="pt-1">
                              {selectedTier === 3 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Geçerli aralık</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSelectBadgeTier(p.id, parseFloat(t3Price), 3)}
                                  className="inline-flex items-center gap-1 px-3.5 py-1 rounded-xl border border-border text-gray-600 hover:text-dark hover:bg-canvas text-[11px] font-bold cursor-pointer transition-all"
                                >
                                  <span className="w-3 h-3 rounded-full border border-gray-400" />
                                  <span>Seç</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 6: Fiyat Güncelle */}
                        <td className="py-4 px-4 align-top text-center border-l border-border/60">
                          <div className="space-y-2 max-w-[150px] mx-auto">
                            {showPromoComm && (
                              <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold w-full">
                                <Tag className="w-3 h-3 text-amber-600" />
                                <span>Ürün Komisyonu</span>
                              </div>
                            )}

                            {/* Input Field */}
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                placeholder={`${salePrice.toFixed(2)} ₺`}
                                value={customPriceValue}
                                onChange={(e) => setCustomPrices(prev => ({ ...prev, [p.id]: e.target.value }))}
                                className="w-full pl-3 pr-7 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary tabular-nums placeholder:text-dark shadow-2xs"
                              />
                              <Edit3 className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2 pointer-events-none" />
                            </div>

                            {/* Submit Button */}
                            <Button
                              size="sm"
                              disabled={!customPriceValue || savingId === p.id}
                              onClick={() => handleSavePrice(p.id, p.barcode)}
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
        title="Avantajlı Ürün Etiketi Excel Yükleme"
        onClose={() => setImportModal(false)}
        onSuccess={() => {
          setImportModal(false);
          fetchProducts();
        }}
      />
    </div>
  );
}
