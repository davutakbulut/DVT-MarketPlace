"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Calculator, TrendingUp, DollarSign, Truck, ShieldCheck, 
  HelpCircle, RefreshCw, Send, CheckCircle2, AlertTriangle, 
  Clock, ArrowRight, Zap, Target, Package, Award, Sparkles,
  Layers, Check, ChevronRight, Eye, Info, Sliders, ArrowDownRight,
  TrendingDown, Search, Filter, X, ZoomIn, ExternalLink
} from "lucide-react";
import { calculateTrendyolShipping, BaremTier, DesiRate } from "@/lib/shippingCalculator";

export default function ProductPricingPage() {
  // DB Products & Tariffs
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [baremTiers, setBaremTiers] = useState<BaremTier[]>([]);
  const [desiRates, setDesiRates] = useState<DesiRate[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductObj, setSelectedProductObj] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal & Lightbox States
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalBrandFilter, setModalBrandFilter] = useState("all");
  const [modalStockFilter, setModalStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Pricing Mode: 'target_margin' (Hedef Kârdan Fiyat Bul) vs 'manual_price' (Fiyattan Kâr Hesapla)
  const [pricingMode, setPricingMode] = useState<'target_margin' | 'manual_price'>('target_margin');

  // Form State
  const [costPrice, setCostPrice] = useState<number>(50);
  const [targetMargin, setTargetMargin] = useState<number>(20);
  const [commissionRate, setCommissionRate] = useState<number>(16.15);
  const [vatRate, setVatRate] = useState<number>(10);
  const [desi, setDesi] = useState<number>(1);
  const [carrier, setCarrier] = useState<string>("TEX");
  const [leadTimeDays, setLeadTimeDays] = useState<number>(1); // 1, 2, 3 days
  const [manualSalePrice, setManualSalePrice] = useState<number>(149.90);
  const [competitorBuyboxPrice, setCompetitorBuyboxPrice] = useState<number>(139.90);
  const [syncingPrice, setSyncingPrice] = useState(false);

  // Fetch real products and live cargo barem tiers from DB
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Products
      const pRes = await fetch('/api/products');
      const pData = await pRes.json();
      const pList = Array.isArray(pData) ? pData : (pData.products || []);
      setDbProducts(pList);

      // 2. Cargo Barem & Desi Rates from DB
      const bRes = await fetch('/api/tariffs/cargo-barem');
      const bData = await bRes.json();
      const tiers = bData.tiers || (Array.isArray(bData) ? bData : []);
      const dRates = bData.desiRates || [];
      setBaremTiers(tiers);
      setDesiRates(dRates);

      if (pList.length > 0 && !selectedProductId) {
        handleSelectProduct(pList[0]);
      }
    } catch (e) {
      toast.error("Veriler veritabanından çekilemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSelectProduct = (p: any) => {
    setSelectedProductId(p.id);
    setSelectedProductObj(p);
    setCostPrice(parseFloat(p.costPrice || 50));
    setCommissionRate(parseFloat(p.commissionRate || 16.15));
    setVatRate(parseInt(p.vatRate || 10));
    setDesi(parseFloat(p.desi || 1.0));
    const sale = parseFloat(p.salePrice || 149.90);
    setManualSalePrice(sale);
    setCompetitorBuyboxPrice(sale > 0 ? sale * 0.98 : 139.90);
    setLeadTimeDays(p.deliveryType === 'fast_delivery' ? 1 : 2);
    setShowProductModal(false);
  };

  // Fixed Platform Service Fee (₺13.19 KDV Dahil)
  const serviceFee = 13.19;
  const withholdingTaxRate = 0.01; // %1 Stopaj Kesintisi
  const effectiveMargin = targetMargin / 100;
  const effectiveCommission = commissionRate / 100;

  // 1. REVERSE PRICING CALCULATION WITH EXACT LINEARIZED VAT & WITHHOLDING
  const kdvMultiplier = 1 + (vatRate / 100);
  const vatFraction = (vatRate / 100) / kdvMultiplier;
  const costPriceExVatDiff = costPrice * (1 - vatFraction);

  let calculatedTargetPrice = 0;
  const denominator = 1 - effectiveCommission - withholdingTaxRate - vatFraction - effectiveMargin;

  if (denominator > 0) {
    let currentGuess = (costPriceExVatDiff + 46.50 + serviceFee) / denominator;
    for (let i = 0; i < 6; i++) {
      const shipGuess = calculateTrendyolShipping(currentGuess, desi, carrier, leadTimeDays, baremTiers, desiRates);
      currentGuess = (costPriceExVatDiff + shipGuess.appliedPriceIncVat + serviceFee) / denominator;
    }
    calculatedTargetPrice = Math.round(currentGuess * 100) / 100;
  } else {
    calculatedTargetPrice = costPrice * 1.5;
  }

  // 2. ACTIVE SALE PRICE FOR RENDERING & SIMULATION
  const activeSalePrice = pricingMode === 'target_margin' 
    ? calculatedTargetPrice 
    : (manualSalePrice > 0 ? manualSalePrice : calculatedTargetPrice);

  // 3. EXACT SHIPPING COST FOR ACTIVE SALE PRICE (Using Official Engine)
  const activeShipping = calculateTrendyolShipping(activeSalePrice, desi, carrier, leadTimeDays, baremTiers, desiRates);
  const effectiveShippingCost = activeShipping.appliedPriceIncVat;

  // Cost Breakdown for Active Sale Price
  const commissionAmount = activeSalePrice * effectiveCommission;
  const withholdingAmount = activeSalePrice * withholdingTaxRate;

  // KDV Doğrusallaştırma
  const saleVat = (activeSalePrice / kdvMultiplier) * (vatRate / 100);
  const costVat = (costPrice / kdvMultiplier) * (vatRate / 100);
  const netVatAmount = Math.max(0, saleVat - costVat);

  // Net Cash Profit & Margins
  const netCashProfit = activeSalePrice - (costPrice + commissionAmount + effectiveShippingCost + serviceFee + withholdingAmount + netVatAmount);
  const achievedMarginPercent = activeSalePrice > 0 ? (netCashProfit / activeSalePrice) * 100 : 0;
  const achievedMarkupPercent = costPrice > 0 ? (netCashProfit / costPrice) * 100 : 0;

  // 4. BUYBOX SIMULATION
  const buyboxShipping = calculateTrendyolShipping(competitorBuyboxPrice, desi, carrier, leadTimeDays, baremTiers, desiRates);
  const buyboxCommission = competitorBuyboxPrice * effectiveCommission;
  const buyboxWithholding = competitorBuyboxPrice * withholdingTaxRate;
  const buyboxSaleVat = (competitorBuyboxPrice / kdvMultiplier) * (vatRate / 100);
  const buyboxNetVat = Math.max(0, buyboxSaleVat - costVat);
  const buyboxProfit = competitorBuyboxPrice - (costPrice + buyboxCommission + buyboxShipping.appliedPriceIncVat + serviceFee + buyboxWithholding + buyboxNetVat);
  const buyboxMargin = competitorBuyboxPrice > 0 ? (buyboxProfit / competitorBuyboxPrice) * 100 : 0;

  const handlePushPriceToTrendyol = async () => {
    setSyncingPrice(true);
    try {
      if (selectedProductObj) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: selectedProductObj.id,
            salePrice: activeSalePrice,
            costPrice: costPrice
          })
        });
      }

      toast.success(`Satış Fiyatı (₺${activeSalePrice.toFixed(2)}) veritabanına kaydedildi ve Trendyol mağazanıza iletildi!`);
    } catch (e) {
      toast.error("Fiyat kaydedilemedi.");
    } finally {
      setSyncingPrice(false);
    }
  };

  // Filter products for the Modal Picker
  const brandsList = Array.from(new Set(dbProducts.map(p => p.brand).filter(Boolean)));
  const filteredModalProducts = dbProducts.filter((p) => {
    const s = modalSearch.toLowerCase();
    const matchesSearch = !s || 
      (p.title || '').toLowerCase().includes(s) ||
      (p.barcode || '').toLowerCase().includes(s) ||
      (p.modelCode || '').toLowerCase().includes(s) ||
      (p.brand || '').toLowerCase().includes(s);

    const matchesBrand = modalBrandFilter === 'all' || p.brand === modalBrandFilter;
    const matchesStock = modalStockFilter === 'all' || 
      (modalStockFilter === 'in_stock' ? (p.stockQuantity > 0) : (p.stockQuantity === 0));

    return matchesSearch && matchesBrand && matchesStock;
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-black text-dark">Trendyol Kargo Barem Desteği & Fiyatlandırma Motoru</h3>
            <Badge variant="excellent" className="text-[10px] sm:text-xs">10 Ağustos 2026 Resmi Tarife</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            1 Gün Termin / Hızlı Teslimat avantajlı baremleri, 1 günden fazla standart baremler ve 350₺ üzeri desi tarifesi
          </p>
        </div>

        <Button 
          size="sm" 
          variant="outline" 
          onClick={fetchAllData} 
          className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-2xl text-xs gap-1.5 font-bold bg-white hover:bg-canvas text-dark border-border shadow-xs shrink-0 cursor-pointer"
          title="Verileri Yenile"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Yenile</span>
        </Button>
      </div>

      {/* RICH SELECTED PRODUCT CARD (POPUP TRIGGER) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 pb-3 border-b border-border mb-3">
          <label className="text-xs font-black text-dark flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span>Fiyatlandırılan Ürün Bilgisi:</span>
          </label>
          <Button
            size="sm"
            onClick={() => setShowProductModal(true)}
            className="h-8.5 text-xs font-bold gap-1.5 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-xs w-full xs:w-auto justify-center cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Katalogdan Ürün Seç ({dbProducts.length})</span>
          </Button>
        </div>

        {selectedProductObj ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
            <div className="flex items-start gap-3 min-w-0">
              {/* Thumbnail with zoom click */}
              <div 
                onClick={() => selectedProductObj.imageUrl && setZoomImageUrl(selectedProductObj.imageUrl)}
                className="w-14 h-14 rounded-2xl bg-canvas border border-border shrink-0 overflow-hidden flex items-center justify-center relative group cursor-pointer"
              >
                {selectedProductObj.imageUrl ? (
                  <>
                    <img 
                      src={selectedProductObj.imageUrl} 
                      alt={selectedProductObj.title} 
                      className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                  </>
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-dark leading-snug line-clamp-2">
                  {selectedProductObj.title}
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="px-2 py-0.5 rounded-lg bg-canvas text-gray-600 font-mono text-[10px] sm:text-[11px] font-bold border border-border">
                    Barkod: {selectedProductObj.barcode}
                  </span>
                  {selectedProductObj.brand && (
                    <Badge variant="outline" className="text-[10px]">{selectedProductObj.brand}</Badge>
                  )}
                  <Badge variant={selectedProductObj.stockQuantity > 0 ? "excellent" : "secondary"} className="text-[10px]">
                    {selectedProductObj.stockQuantity > 0 ? `Stok: ${selectedProductObj.stockQuantity}` : "Tükendi"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end bg-canvas p-2.5 rounded-2xl border border-border text-xs shrink-0">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block">Katalog Satış Fiyatı</span>
                <span className="font-black text-dark text-sm tabular-nums">₺{parseFloat(selectedProductObj.salePrice || 0).toFixed(2)}</span>
              </div>
              <div className="w-px h-6 bg-border"></div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block">Komisyon</span>
                <span className="font-black text-primary text-sm">%{selectedProductObj.commissionRate || 16.15}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-gray-500">
            Henüz ürün seçilmedi. Lütfen ürün seçin.
          </div>
        )}
      </div>

      {/* MODE TOGGLE BUTTONS - 2 COLUMN COMPACT GRID FOR MOBILE & DESKTOP */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setPricingMode('target_margin')}
          className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border text-left transition-all flex flex-col xs:flex-row items-start gap-2 sm:gap-3 shadow-xs cursor-pointer ${
            pricingMode === 'target_margin'
              ? 'bg-primary text-white border-primary ring-2 ring-primary/20'
              : 'bg-white text-dark border-border hover:bg-canvas'
          }`}
        >
          <Target className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 ${pricingMode === 'target_margin' ? 'text-white' : 'text-primary'}`} />
          <div className="min-w-0">
            <span className="font-black text-xs sm:text-sm block truncate">1. Hedef Kârdan Fiyat</span>
            <span className={`text-[10px] sm:text-xs block mt-0.5 leading-tight ${pricingMode === 'target_margin' ? 'text-white/85' : 'text-gray-500'}`}>
              Marj gir ➔ Fiyat bul
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setPricingMode('manual_price')}
          className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border text-left transition-all flex flex-col xs:flex-row items-start gap-2 sm:gap-3 shadow-xs cursor-pointer ${
            pricingMode === 'manual_price'
              ? 'bg-primary text-white border-primary ring-2 ring-primary/20'
              : 'bg-white text-dark border-border hover:bg-canvas'
          }`}
        >
          <Sliders className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 ${pricingMode === 'manual_price' ? 'text-white' : 'text-primary'}`} />
          <div className="min-w-0">
            <span className="font-black text-xs sm:text-sm block truncate">2. Fiyattan Kâr Gör</span>
            <span className={`text-[10px] sm:text-xs block mt-0.5 leading-tight ${pricingMode === 'manual_price' ? 'text-white/85' : 'text-gray-500'}`}>
              Fiyat gir ➔ Net kârı gör
            </span>
          </div>
        </button>
      </div>

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* LEFT COLUMN: PARAMETER INPUTS (6 COLS) */}
        <div className="lg:col-span-6 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-5">
          <h4 className="text-xs sm:text-sm font-black text-dark flex items-center gap-2 pb-2 border-b border-border">
            <Calculator className="w-4 h-4 text-primary" />
            <span>Fiyatlandırma & Kargo Parametreleri</span>
          </h4>

          <div className="space-y-4 text-xs">
            
            {/* DYNAMIC MODE MODULE: ONLY SHOWS THE SELECTED MODE'S INPUT CARD */}
            {pricingMode === 'target_margin' ? (
              /* 1. HEDEF KÂR MARJI MODÜLÜ */
              <div className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-500/20 animate-in fade-in zoom-in-95 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-emerald-800 flex items-center gap-1.5 text-xs">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>Hedef Net Kâr Marjı (%) *</span>
                  </label>
                  <Badge variant="excellent" className="text-[10px]">Ters Fiyatlama Aktif</Badge>
                </div>
                
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-emerald-400 font-black text-emerald-800 text-sm bg-white focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                  <span className="absolute left-3 top-2.5 font-bold text-emerald-600 text-sm">%</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold block">
                  Belirlediğiniz %{targetMargin} kâr marjını elde etmek için gereken Trendyol satış fiyatı sağda anlık hesaplanır.
                </span>
              </div>
            ) : (
              /* 2. MANUEL SATIŞ FİYATI MODÜLÜ */
              <div className="p-4 rounded-2xl border border-primary bg-primary-tint-50/50 ring-2 ring-primary/20 animate-in fade-in zoom-in-95 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-primary flex items-center gap-1.5 text-xs">
                    <Sliders className="w-4 h-4 text-primary" />
                    <span>Satış Fiyatı (₺ KDV Dahil) *</span>
                  </label>
                  <Badge variant="default" className="text-[10px]">Kâr Simülasyonu Aktif</Badge>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={manualSalePrice || ''}
                    onChange={(e) => setManualSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-primary font-black text-dark text-sm bg-white focus:ring-2 focus:ring-primary shadow-xs"
                  />
                  <span className="absolute left-3 top-2.5 font-bold text-primary text-sm">₺</span>
                </div>
                <span className="text-[11px] text-gray-600 block">
                  ₺{manualSalePrice} satış fiyatında Trendyol kesintileri düşüldükten sonra cebinize kalacak net kâr sağda listelenir.
                </span>
              </div>
            )}

            {/* Alış Maliyeti & KDV Oranı */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-dark block mb-1">Birim Alış Maliyeti (₺ KDV Dahil) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-border font-bold text-dark focus:ring-2 focus:ring-primary"
                  />
                  <span className="absolute left-2.5 top-2 font-bold text-gray-400">₺</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-dark block mb-1">Ürün KDV Oranı (%) *</label>
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                >
                  <option value={1}>%1 KDV</option>
                  <option value={10}>%10 KDV (Medikal & Temel)</option>
                  <option value={20}>%20 KDV (Genel Standart)</option>
                </select>
              </div>
            </div>

            {/* Komisyon Oranı & Desi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-dark block mb-1">Pazaryeri Komisyon Oranı (%) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-border font-bold text-dark focus:ring-2 focus:ring-primary"
                  />
                  <span className="absolute left-2.5 top-2 font-bold text-gray-400">%</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-dark block mb-1">Paket Desi (350₺ Üzerinde Geçerli) *</label>
                <input
                  type="number"
                  step="0.5"
                  value={desi}
                  onChange={(e) => setDesi(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Kargo Şirketi & Termin Süresi */}
            <div className="space-y-3">
              <div>
                <label className="font-bold text-dark block mb-1">Kargo Firması (Resmi Barem Destekli) *</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                >
                  <option value="TEX">Trendyol Express (TEX) - En Avantajlı</option>
                  <option value="PTT">PTT Kargo - En Avantajlı</option>
                  <option value="Aras">Aras Kargo</option>
                  <option value="Sürat">Sürat Kargo</option>
                  <option value="Kolay Gelsin">Kolay Gelsin</option>
                  <option value="DHL eCommerce">DHL eCommerce</option>
                  <option value="YK">Yurtiçi Kargo (YK)</option>
                </select>
              </div>

              {/* Termin Süresi (1-2-3 Gün Seçimi & Barem Desteği) */}
              <div className="p-3.5 rounded-2xl bg-canvas border border-border space-y-2">
                <label className="font-black text-dark flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Termin Süresi & Kargo Barem Desteği</span>
                  </span>
                  <span className={`text-[11px] font-black ${leadTimeDays === 1 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {leadTimeDays === 1 ? '⚡ 1 Gün: Avantajlı Barem (İndirimli)' : '⚠️ 1 Günden Fazla: Standart Barem'}
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLeadTimeDays(1)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      leadTimeDays === 1
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-border bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-black block">1 Gün Termin / Hızlı Teslimat</span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5 font-semibold">
                      ✓ Avantajlı Barem Uygulanır
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeadTimeDays(2)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      leadTimeDays >= 2
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs ring-2 ring-amber-500/20'
                        : 'border-border bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-black block">1 Günden Fazla (2-3 Gün)</span>
                    <span className="text-[10px] text-amber-700 block mt-0.5 font-semibold">
                      ⚠️ Standart Barem Uygulanır
                    </span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: CALCULATION RESULTS & WATERFALL (6 COLS) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Main Price & Net Profit Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">
                  {pricingMode === 'target_margin' ? '🎯 Hedef Marja Göre Hesaplanan Satış Fiyatı' : '🏷️ Belirlenen Satış Fiyatı'}
                </span>
                <div className="text-3xl font-black text-primary tabular-nums mt-1">
                  {formatCurrency(activeSalePrice)}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">Net Nakit Kâr</span>
                <div className={`text-2xl font-black tabular-nums mt-1 ${netCashProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(netCashProfit)}
                </div>
              </div>
            </div>

            {/* Badges Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-bold">
              <span className="px-2.5 py-1 rounded-xl bg-canvas border border-border text-dark">
                Net Marj: <strong className="text-emerald-700">%{achievedMarginPercent.toFixed(1)}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-canvas border border-border text-dark">
                Maliyet Üzeri Kâr: <strong className="text-primary">%{achievedMarkupPercent.toFixed(1)}</strong>
              </span>
              <span className={`px-2.5 py-1 rounded-xl text-[11px] border ${
                activeShipping.isBaremSupported 
                  ? (activeShipping.advantageStatus === 'advantageous_1day' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-amber-50 border-amber-300 text-amber-800')
                  : 'bg-gray-100 border-gray-300 text-gray-800'
              }`}>
                {activeShipping.isBaremSupported 
                  ? (activeShipping.advantageStatus === 'advantageous_1day' ? `✓ ${activeShipping.tierName} (Avantajlı)` : `⚠️ ${activeShipping.tierName} (Standart)`)
                  : `📦 ${activeShipping.tierName}`}
              </span>
            </div>

            {/* Dynamic Shipping Explanation Box */}
            <div className="p-3.5 rounded-2xl bg-canvas border border-border flex items-start gap-2.5 text-xs text-gray-600">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-dark block">Kargo Barem Hesaplama Bilgisi:</span>
                <span className="text-[11px] text-gray-600 leading-relaxed block mt-0.5">{activeShipping.explanation}</span>
                {activeShipping.savingsAmount > 0 && (
                  <span className="text-[11px] text-emerald-700 font-bold block mt-1">
                    🎉 1 Gün Termin tanımladığınız için bu siparişte ₺{activeShipping.savingsAmount.toFixed(2)} kargo avantajınız var!
                  </span>
                )}
              </div>
            </div>

            {/* Financial Waterfall Cost Breakdown */}
            <div className="space-y-2 pt-2 border-t border-border text-xs">
              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>1. Birim Alış Maliyeti (COGS)</span>
                <span className="font-bold text-red-700 tabular-nums">-₺{costPrice.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>2. Trendyol Komisyonu (%{commissionRate})</span>
                <span className="font-bold text-gray-800 tabular-nums">-₺{commissionAmount.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span className="flex items-center gap-1">
                  <span>3. Kargo Gideri ({carrier}, {activeShipping.isBaremSupported ? activeShipping.tierName : `${desi} Desi`})</span>
                  {activeShipping.advantageStatus === 'advantageous_1day' && (
                    <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">Avantajlı</span>
                  )}
                </span>
                <span className="font-bold text-primary tabular-nums">-₺{effectiveShippingCost.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>4. Hizmet Bedeli Kesintisi (Sabit)</span>
                <span className="font-bold text-gray-800 tabular-nums">-₺{serviceFee.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>5. Stopaj Kesintisi (%1)</span>
                <span className="font-bold text-gray-800 tabular-nums">-₺{withholdingAmount.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>6. Ödenecek Net KDV Farkı</span>
                <span className="font-bold text-gray-800 tabular-nums">-₺{netVatAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Push to Trendyol Button */}
            <Button
              onClick={handlePushPriceToTrendyol}
              disabled={syncingPrice}
              className="w-full h-10 text-xs font-black gap-2 bg-primary hover:bg-primary-hover text-white shadow-xs rounded-2xl"
            >
              <Send className="w-4 h-4" />
              <span>{syncingPrice ? "Trendyol'a İletiliyor..." : `Fiyatı Kaydet & Trendyol'a İlet (₺${activeSalePrice.toFixed(2)})`}</span>
            </Button>
          </div>

          {/* BUYBOX COMPETITOR SIMULATION CARD */}
          <div className="bg-white p-5 rounded-3xl border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h5 className="text-xs font-black text-dark flex items-center gap-1.5">
                <Target className="w-4 h-4 text-primary" />
                <span>Buybox Rekabet Fiyat Simülatörü</span>
              </h5>
              <Badge variant={buyboxProfit < 0 ? "danger" : (buyboxMargin >= 10 ? "excellent" : "warning")}>
                {buyboxProfit < 0 ? "⚠️ Zararına Satış Uyarısı" : (buyboxMargin >= 10 ? "✓ Kârlı Rekabet" : "Düşük Kâr Uyarısı")}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-gray-600 block mb-1">Hedef BuyBox Fiyatı (₺)</label>
                <input
                  type="number"
                  step="0.5"
                  value={competitorBuyboxPrice}
                  onChange={(e) => setCompetitorBuyboxPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl border border-border font-bold text-dark"
                />
              </div>

              <div className="p-2 rounded-xl bg-canvas border border-border">
                <span className="text-[10px] text-gray-500 font-bold block">Buybox Net Kârı</span>
                <span className={`text-base font-black tabular-nums block ${buyboxProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(buyboxProfit)}
                </span>
                <span className="text-[10px] text-gray-500 font-semibold">Marj: %{buyboxMargin.toFixed(1)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* PRODUCT PICKER MODAL DIALOG */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-canvas/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-dark">Katalogdan Ürün Seç</h3>
                  <p className="text-xs text-gray-500">283 benzersiz ürün arasından arayın, filtreleyin ve tek tıkla fiyatlandırmaya aktarın</p>
                </div>
              </div>

              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 rounded-2xl hover:bg-canvas text-gray-400 hover:text-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap bg-white">
              {/* Search input */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Başlık, barkod, model kodu veya marka ile anlık ara..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              {/* Brand Filter */}
              <select
                value={modalBrandFilter}
                onChange={(e) => setModalBrandFilter(e.target.value)}
                className="px-3 py-2 rounded-2xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary cursor-pointer shadow-xs"
              >
                <option value="all">Tüm Markalar ({brandsList.length})</option>
                {brandsList.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              {/* Stock Filter */}
              <select
                value={modalStockFilter}
                onChange={(e) => setModalStockFilter(e.target.value as any)}
                className="px-3 py-2 rounded-2xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary cursor-pointer shadow-xs"
              >
                <option value="all">Tüm Stok Durumları</option>
                <option value="in_stock">Yalnızca Stokta Olanlar</option>
                <option value="out_of_stock">Tükenen Ürünler</option>
              </select>

              <span className="text-xs text-gray-500 font-bold ml-auto">
                {filteredModalProducts.length} Ürün Bulundu
              </span>
            </div>

            {/* Modal Products Table */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {filteredModalProducts.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Package className="w-10 h-10 text-gray-300 mx-auto" />
                  <h4 className="text-sm font-bold text-dark">Arama kriterlerinize uygun ürün bulunamadı.</h4>
                  <p className="text-xs text-gray-400">Arama kelimenizi veya filtreleri temizleyip tekrar deneyin.</p>
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border text-gray-500 font-black">
                      <th className="pb-2.5 px-3 w-16 text-center">Görsel</th>
                      <th className="pb-2.5 px-3">Ürün Başlığı & Model</th>
                      <th className="pb-2.5 px-3">Barkod & Marka</th>
                      <th className="pb-2.5 px-3 text-center">Stok</th>
                      <th className="pb-2.5 px-3 text-right">Satış Fiyatı</th>
                      <th className="pb-2.5 px-3 text-right">Maliyet</th>
                      <th className="pb-2.5 px-3 text-right">Komisyon</th>
                      <th className="pb-2.5 px-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredModalProducts.map((p) => {
                      const isSelected = selectedProductId === p.id;
                      return (
                        <tr 
                          key={p.id} 
                          className={`hover:bg-canvas/60 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                        >
                          {/* Image Thumbnail with zoom trigger */}
                          <td className="py-2.5 px-3 text-center">
                            <div 
                              onClick={() => p.imageUrl && setZoomImageUrl(p.imageUrl)}
                              className="w-11 h-11 rounded-xl bg-canvas border border-border mx-auto overflow-hidden flex items-center justify-center relative group cursor-pointer"
                            >
                              {p.imageUrl ? (
                                <>
                                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-contain p-0.5 group-hover:scale-110 transition-transform" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <ZoomIn className="w-3 h-3 text-white" />
                                  </div>
                                </>
                              ) : (
                                <Package className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                          </td>

                          {/* Title & Model */}
                          <td className="py-2.5 px-3 font-bold text-dark max-w-sm">
                            <span className="block truncate font-bold text-dark">{p.title}</span>
                            {p.modelCode && (
                              <span className="text-[10px] font-mono text-gray-400 block mt-0.5">Model: {p.modelCode}</span>
                            )}
                          </td>

                          {/* Barcode & Brand */}
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-canvas text-gray-700 font-mono text-[10px] font-bold border border-border block w-max">
                              {p.barcode}
                            </span>
                            {p.brand && (
                              <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">{p.brand}</span>
                            )}
                          </td>

                          {/* Stock Quantity */}
                          <td className="py-2.5 px-3 text-center">
                            <Badge variant={p.stockQuantity > 0 ? "excellent" : "secondary"}>
                              {p.stockQuantity} Adet
                            </Badge>
                          </td>

                          {/* Sale Price */}
                          <td className="py-2.5 px-3 text-right font-black text-dark tabular-nums">
                            ₺{parseFloat(p.salePrice || 0).toFixed(2)}
                          </td>

                          {/* Cost Price */}
                          <td className="py-2.5 px-3 text-right font-bold text-red-700 tabular-nums">
                            ₺{parseFloat(p.costPrice || 50).toFixed(2)}
                          </td>

                          {/* Commission Rate */}
                          <td className="py-2.5 px-3 text-right font-black text-primary">
                            %{p.commissionRate || 16.15}
                          </td>

                          {/* Select Action */}
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              size="sm"
                              variant={isSelected ? "outline" : "default"}
                              onClick={() => handleSelectProduct(p)}
                              className={`h-7 text-xs font-bold gap-1 rounded-xl ${
                                isSelected ? 'border-primary text-primary bg-primary/5' : 'bg-primary hover:bg-primary-hover text-white'
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              <span>{isSelected ? "Seçili" : "Seç"}</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-border bg-canvas/40 flex items-center justify-between text-xs text-gray-500">
              <span>Toplam <strong>{dbProducts.length}</strong> katalog ürünü listelendi. Görsellere tıklayarak büyütebilirsiniz.</span>
              <Button size="sm" variant="outline" onClick={() => setShowProductModal(false)} className="h-8 text-xs font-bold">
                Kapat
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {zoomImageUrl && (
        <div 
          onClick={() => setZoomImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white p-4 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center justify-center">
            <button
              onClick={() => setZoomImageUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={zoomImageUrl} 
              alt="Büyütülmüş Ürün Görseli" 
              className="max-w-full max-h-[75vh] object-contain rounded-2xl" 
            />
            <span className="text-xs font-bold text-gray-500 mt-2">Kapatmak için herhangi bir yere tıklayın</span>
          </div>
        </div>
      )}

    </div>
  );
}
