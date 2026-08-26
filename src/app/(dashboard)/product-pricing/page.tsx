"use client";
import React, { useState, useEffect, useMemo } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Calculator, TrendingUp, DollarSign, Truck, ShieldCheck, 
  HelpCircle, RefreshCw, Send, CheckCircle2, AlertTriangle, 
  Clock, ArrowRight, Zap, Target, Package, Award, Sparkles,
  Layers, Check, ChevronRight, Eye, Info, Sliders, ArrowDownRight,
  TrendingDown, Search, Filter, X, ZoomIn, ExternalLink, ShoppingBag, 
  AlertCircle, Undo2, Receipt, Box, Settings, Coins, Edit3, ArrowUpRight
} from "lucide-react";
import { calculateTrendyolShipping, BaremTier, DesiRate } from "@/lib/shippingCalculator";
import { getMinimumOrderQuantity, TRENDYOL_MOQ_TIERS } from "@/lib/minimumOrderQuantity";
import { useTenantStore } from "@/stores/useTenantStore";

export default function ProductPricingPage() {
  const { activeStoreId } = useTenantStore();

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

  // Breakdown View Mode: 'unit' (Birim Başına) vs 'basket' (Minimum Sipariş Sepet Paketi)
  const [breakdownView, setBreakdownView] = useState<'unit' | 'basket'>('unit');

  // =========================================================================
  // 10 DYNAMICALLY EDITABLE FINANCIAL PARAMETERS (Tüm Veriler Dinamik & Anlık)
  // =========================================================================
  const [costPrice, setCostPrice] = useState<number>(4.50); // 1. Alış Maliyeti (COGS)
  const [commissionRate, setCommissionRate] = useState<number>(19.0); // 2. Trendyol Komisyonu (%)
  const [desi, setDesi] = useState<number>(1.0); // 3. Desi
  const [carrier, setCarrier] = useState<string>("TEX"); // 3. Taşıyıcı
  const [leadTimeDays, setLeadTimeDays] = useState<number>(1); // 3. Termin Süresi (1 Gün vs 2 Gün)
  const [serviceFee, setServiceFee] = useState<number>(13.19); // 4. Platform Hizmet Bedeli (₺/sipariş)
  const [packagingCost, setPackagingCost] = useState<number>(2.50); // 5. Ambalaj & Paketleme Sabit Gideri (₺/sipariş)
  const [fixedOpCost, setFixedOpCost] = useState<number>(1.35); // 6. E-Fatura & Sabit Operasyon Gideri (₺/sipariş)
  const [stopajRate, setStopajRate] = useState<number>(2.0); // 7. Stopaj Kesintisi (%)
  const [vatRate, setVatRate] = useState<number>(10); // 8. KDV Oranı (%)
  const [extraOpRate, setExtraOpRate] = useState<number>(6.0); // 9. Ekstra Operasyon Oranı (%)
  const [earlyPayoutRate, setEarlyPayoutRate] = useState<number>(0.16); // Erken Ödeme Oranı (%)
  const [returnRate, setReturnRate] = useState<number>(1.40); // 10. Önceki Ay İade Riski Oranı (%)

  // Target Margin & Manual Price Inputs
  const [targetMargin, setTargetMargin] = useState<number>(20.0);
  const [manualSalePrice, setManualSalePrice] = useState<number>(157.22);
  const [competitorBuyboxPrice, setCompetitorBuyboxPrice] = useState<number>(149.90);
  const [syncingPrice, setSyncingPrice] = useState(false);

  // Fetch real products, live cargo barems, and default settings from DB
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Products
      const pRes = await fetch(`/api/products?storeId=${activeStoreId || 'all'}`);
      const pData = await pRes.json();
      const pList = Array.isArray(pData) ? pData : (pData.products || []);
      setDbProducts(pList);

      // 2. Fetch General Settings & Previous Month Return Rate
      try {
        const sRes = await fetch('/api/settings/general');
        const sData = await sRes.json();
        if (sData?.settings) {
          const st = sData.settings;
          if (st.defaultServiceFee !== undefined) setServiceFee(parseFloat(st.defaultServiceFee) || 13.19);
          if (st.defaultPackagingCost !== undefined) setPackagingCost(parseFloat(st.defaultPackagingCost) || 2.50);
          if (st.invoiceFixedCost !== undefined || st.extraOperationCost !== undefined) {
            const inv = parseFloat(st.invoiceFixedCost) || 0.35;
            const op = parseFloat(st.extraOperationCost) || 1.00;
            setFixedOpCost(Math.round((inv + op) * 100) / 100);
          }
          if (st.defaultWithholdingRate !== undefined || st.defaultStopajRate !== undefined) {
            setStopajRate(parseFloat(st.defaultWithholdingRate || st.defaultStopajRate) || 2.0);
          }
          if (st.extraOperationRate !== undefined) setExtraOpRate(parseFloat(st.extraOperationRate) || 6.0);
          if (st.earlyPayoutRate !== undefined) setEarlyPayoutRate(parseFloat(st.earlyPayoutRate) || 0.16);
          if (st.prevMonthReturnRate !== undefined) setReturnRate(parseFloat(st.prevMonthReturnRate) || 1.40);
        }
      } catch (err) {
        console.error('Settings fetch error in pricing:', err);
      }

      // 3. Cargo Barem & Desi Rates from DB
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
  }, [activeStoreId]);

  // Handle Product Selection from Modal or Initial Load
  const handleSelectProduct = (p: any) => {
    if (!p) return;
    setSelectedProductId(p.id);
    setSelectedProductObj(p);

    const cost = parseFloat(p.costPrice ?? p.currentCost ?? 1.00);
    const comm = parseFloat(p.commissionRate ?? 16.15);
    const vat = parseInt(p.vatRate ?? 10);
    const d = parseFloat(p.desi ?? p.shipmentDesi ?? 1.0);
    const sale = parseFloat(p.salePrice ?? p.currentSalePrice ?? 149.90);

    setCostPrice(cost);
    setCommissionRate(comm);
    setVatRate(vat);
    setDesi(d);
    setManualSalePrice(sale);
    setCompetitorBuyboxPrice(sale > 0 ? Math.round(sale * 0.96 * 100) / 100 : 139.90);
    setLeadTimeDays(p.deliveryType === 'fast_delivery' ? 1 : 1);
    setShowProductModal(false);
    toast.success(`"${p.title?.slice(0, 35)}..." seçildi ve verileri aktarıldı.`);
  };

  // =========================================================================
  // CORE FINANCIAL CALCULATION ENGINE (FORWARD SIMULATION)
  // =========================================================================
  const evaluateFinancials = (unitPrice: number) => {
    const q = getMinimumOrderQuantity(unitPrice);
    const basketGross = unitPrice * q;
    const basketCost = costPrice * q;

    // Shipping calculation for this basket amount
    const shippingObj = calculateTrendyolShipping(basketGross, desi, carrier, leadTimeDays, baremTiers, desiRates);
    const ship = shippingObj.appliedPriceIncVat;

    const comm = basketGross * (commissionRate / 100);
    const stopaj = basketGross * (stopajRate / 100);

    const kdvMul = 1 + (vatRate / 100);
    const saleVat = (basketGross / kdvMul) * (vatRate / 100);
    const costVat = (basketCost / kdvMul) * (vatRate / 100);
    const netVat = Math.max(0, saleVat - costVat);

    const extraOp = basketGross * (extraOpRate / 100);
    const earlyPayout = basketGross * (earlyPayoutRate / 100);

    // Return Risk Reserve (Ürün Başına & Sepet Başına)
    const returnRiskBasket = (returnRate / 100) * (ship * 1.5 + serviceFee);
    const returnRiskUnit = returnRiskBasket / q;

    const totalExpenses = (
      basketCost +
      comm +
      ship +
      serviceFee +
      packagingCost +
      fixedOpCost +
      stopaj +
      netVat +
      extraOp +
      earlyPayout +
      returnRiskBasket
    );

    const basketProfit = basketGross - totalExpenses;
    const unitProfit = basketProfit / q;
    const marginPercent = basketGross > 0 ? (basketProfit / basketGross) * 100 : 0;
    const markupPercent = basketCost > 0 ? (basketProfit / basketCost) * 100 : 0;

    return {
      q,
      unitPrice,
      basketGross,
      basketCost,
      comm,
      ship,
      shippingObj,
      serviceFee,
      packagingCost,
      fixedOpCost,
      stopaj,
      netVat,
      extraOp,
      earlyPayout,
      returnRiskBasket,
      returnRiskUnit,
      totalExpenses,
      basketProfit,
      unitProfit,
      marginPercent,
      markupPercent
    };
  };

  // =========================================================================
  // EXACT MATHEMATICAL ROOT-FINDING SOLVER FOR "1. HEDEF KÂRDAN FİYAT"
  // =========================================================================
  const solvePriceForTargetMargin = (targetM: number) => {
    const candidateTiers = [
      { min: 0.50, max: 25.00 },
      { min: 25.01, max: 35.00 },
      { min: 35.01, max: 50.00 },
      { min: 50.01, max: 75.00 },
      { min: 75.01, max: 50000.00 }
    ];

    for (const tier of candidateTiers) {
      const rLow = evaluateFinancials(tier.min);
      const rHigh = evaluateFinancials(tier.max);

      if (rLow.marginPercent <= targetM && rHigh.marginPercent >= targetM) {
        let low = tier.min, high = tier.max;
        for (let i = 0; i < 35; i++) {
          const mid = (low + high) / 2;
          const res = evaluateFinancials(mid);
          if (res.marginPercent < targetM) {
            low = mid;
          } else {
            high = mid;
          }
        }
        return Math.round(low * 100) / 100;
      }
    }

    // Global monotonic binary search fallback
    let low = 0.50, high = 50000.00;
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      const res = evaluateFinancials(mid);
      if (res.marginPercent < targetM) low = mid;
      else high = mid;
    }
    return Math.round(low * 100) / 100;
  };

  // Current Target Price Calculated from Solver
  const solvedTargetPrice = solvePriceForTargetMargin(targetMargin);

  // Active Sale Price Depending on Mode
  const activeSalePrice = pricingMode === 'target_margin' 
    ? solvedTargetPrice 
    : (manualSalePrice > 0 ? manualSalePrice : solvedTargetPrice);

  // Active Simulation Results
  const currentSim = evaluateFinancials(activeSalePrice);

  // Buybox Simulation
  const buyboxSim = evaluateFinancials(competitorBuyboxPrice);

  // Current Product Original Catalog Margin
  const originalCatalogPrice = selectedProductObj ? parseFloat(selectedProductObj.salePrice || 0) : 0;
  const originalCatalogSim = originalCatalogPrice > 0 ? evaluateFinancials(originalCatalogPrice) : null;

  // Stock sufficiency check
  const stockCount = selectedProductObj ? Number(selectedProductObj.stockQuantity || 0) : 100;
  const isStockInsufficientForMOQ = stockCount < currentSim.q;

  // Push Price to Trendyol & DB
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

      toast.success(`Birim Satış Fiyatı (₺${activeSalePrice.toFixed(2)}) veritabanına kaydedildi ve Trendyol mağazanıza iletildi!`);
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
            <h3 className="text-base sm:text-lg font-black text-dark">Trendyol Fiyatlandırma & Minimum Sipariş Motoru</h3>
            <Badge variant="excellent" className="text-[10px] sm:text-xs">Dinamik 10'lu Gider Şelalesi & MOQ</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Ürün fiyat baremine göre <strong>Minimum Sipariş Adedi (MOQ)</strong>, sepet kargo desteği, tüm şirket sabit giderleri ve <strong>ürün başına iade riski</strong> anlık olarak hesaplanır.
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

      {/* RICH SELECTED PRODUCT CARD (MODAL TRIGGER & CURRENT METRICS) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 pb-3 border-b border-border mb-3">
          <label className="text-xs font-black text-dark flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span>Fiyatlandırılan Ürün & Katalog Durumu:</span>
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
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* Thumbnail with zoom click */}
              <div 
                onClick={() => selectedProductObj.imageUrl && setZoomImageUrl(selectedProductObj.imageUrl)}
                className="w-16 h-16 rounded-2xl bg-canvas border border-border shrink-0 overflow-hidden flex items-center justify-center relative group cursor-pointer"
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
                  <Package className="w-7 h-7 text-gray-400" />
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-dark leading-snug line-clamp-2">
                  {selectedProductObj.title}
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="px-2 py-0.5 rounded-lg bg-canvas text-gray-700 font-mono text-[10px] sm:text-[11px] font-bold border border-border">
                    Barkod: {selectedProductObj.barcode}
                  </span>
                  {selectedProductObj.brand && (
                    <Badge variant="outline" className="text-[10px]">{selectedProductObj.brand}</Badge>
                  )}
                  <Badge variant={selectedProductObj.stockQuantity > 0 ? "excellent" : "secondary"} className="text-[10px]">
                    {selectedProductObj.stockQuantity > 0 ? `Stok: ${selectedProductObj.stockQuantity} Adet` : "Tükendi"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Current Catalog Stats Strip */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end bg-canvas p-3 rounded-2xl border border-border text-xs shrink-0 flex-wrap sm:flex-nowrap">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block">Katalog Satış Fiyatı</span>
                <span className="font-black text-dark text-sm tabular-nums">
                  ₺{parseFloat(selectedProductObj.salePrice || 0).toFixed(2)}
                </span>
              </div>
              <div className="w-px h-7 bg-border hidden sm:block"></div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block">Alış Maliyeti</span>
                <span className="font-bold text-red-700 text-sm tabular-nums">
                  ₺{parseFloat(selectedProductObj.costPrice || 1.00).toFixed(2)}
                </span>
              </div>
              <div className="w-px h-7 bg-border hidden sm:block"></div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block">Mevcut Kâr Marjı</span>
                <span className={`font-black text-sm tabular-nums ${originalCatalogSim && originalCatalogSim.unitProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {originalCatalogSim ? `%${originalCatalogSim.marginPercent.toFixed(1)} (${formatCurrency(originalCatalogSim.unitProfit)})` : '-'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-gray-500">
            Henüz ürün seçilmedi. Lütfen ürün seçin.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🚀 TRENDYOL MINIMUM SIPARIS ADEDI (MOQ) BAREM KARTLARI (KULLANICI GÖRSELİ) */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm sm:text-base font-black text-dark flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span>Minimum Sipariş Adedi & Sepet Kârlılığı</span>
            </h4>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-gray-500">Aktif Minimum Sipariş Kuralı:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-primary-tint-100 text-primary border border-primary/30 font-black">
                {currentSim.q} Adet / Sepet
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Minimum Sipariş Adedi, bir ürünün müşteri tarafından alınması gereken minimum sayıyı belirtir. Müşteri ürünü sipariş içerisinde bu adetten daha az sayıda alamaz. <strong>Ürün stoğu Minimum Sipariş Adedi değerinden düşük ise ürünün stoğu tükendi olarak değerlendirilecektir.</strong>
          </p>
        </div>

        {/* 4 + 1 BAREM TIERS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* Tier 1: 0 - 25 TL */}
          <div className={`p-3.5 rounded-2xl border text-center transition-all ${
            activeSalePrice <= 25.00
              ? 'border-primary bg-primary-tint-50/70 ring-2 ring-primary/30 shadow-xs'
              : 'border-border bg-slate-50/70 text-gray-600'
          }`}>
            <span className="text-xs sm:text-sm font-black text-dark block">0₺ - 25₺</span>
            <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Minimum Satış Adedi</span>
            <span className={`text-xl sm:text-2xl font-black block mt-1 ${activeSalePrice <= 25.00 ? 'text-primary' : 'text-gray-700'}`}>
              6
            </span>
            {activeSalePrice <= 25.00 && (
              <span className="text-[9px] font-black uppercase text-primary bg-white px-2 py-0.5 rounded-full border border-primary/20 inline-block mt-1">
                ✓ Aktif Kural
              </span>
            )}
          </div>

          {/* Tier 2: 25 - 35 TL */}
          <div className={`p-3.5 rounded-2xl border text-center transition-all ${
            activeSalePrice > 25.00 && activeSalePrice <= 35.00
              ? 'border-primary bg-primary-tint-50/70 ring-2 ring-primary/30 shadow-xs'
              : 'border-border bg-slate-50/70 text-gray-600'
          }`}>
            <span className="text-xs sm:text-sm font-black text-dark block">25₺ - 35₺</span>
            <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Minimum Satış Adedi</span>
            <span className={`text-xl sm:text-2xl font-black block mt-1 ${activeSalePrice > 25.00 && activeSalePrice <= 35.00 ? 'text-primary' : 'text-gray-700'}`}>
              4
            </span>
            {activeSalePrice > 25.00 && activeSalePrice <= 35.00 && (
              <span className="text-[9px] font-black uppercase text-primary bg-white px-2 py-0.5 rounded-full border border-primary/20 inline-block mt-1">
                ✓ Aktif Kural
              </span>
            )}
          </div>

          {/* Tier 3: 35 - 50 TL */}
          <div className={`p-3.5 rounded-2xl border text-center transition-all ${
            activeSalePrice > 35.00 && activeSalePrice <= 50.00
              ? 'border-primary bg-primary-tint-50/70 ring-2 ring-primary/30 shadow-xs'
              : 'border-border bg-slate-50/70 text-gray-600'
          }`}>
            <span className="text-xs sm:text-sm font-black text-dark block">35₺ - 50₺</span>
            <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Minimum Satış Adedi</span>
            <span className={`text-xl sm:text-2xl font-black block mt-1 ${activeSalePrice > 35.00 && activeSalePrice <= 50.00 ? 'text-primary' : 'text-gray-700'}`}>
              3
            </span>
            {activeSalePrice > 35.00 && activeSalePrice <= 50.00 && (
              <span className="text-[9px] font-black uppercase text-primary bg-white px-2 py-0.5 rounded-full border border-primary/20 inline-block mt-1">
                ✓ Aktif Kural
              </span>
            )}
          </div>

          {/* Tier 4: 50 - 75 TL */}
          <div className={`p-3.5 rounded-2xl border text-center transition-all ${
            activeSalePrice > 50.00 && activeSalePrice <= 75.00
              ? 'border-primary bg-primary-tint-50/70 ring-2 ring-primary/30 shadow-xs'
              : 'border-border bg-slate-50/70 text-gray-600'
          }`}>
            <span className="text-xs sm:text-sm font-black text-dark block">50₺ - 75₺</span>
            <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Minimum Satış Adedi</span>
            <span className={`text-xl sm:text-2xl font-black block mt-1 ${activeSalePrice > 50.00 && activeSalePrice <= 75.00 ? 'text-primary' : 'text-gray-700'}`}>
              2
            </span>
            {activeSalePrice > 50.00 && activeSalePrice <= 75.00 && (
              <span className="text-[9px] font-black uppercase text-primary bg-white px-2 py-0.5 rounded-full border border-primary/20 inline-block mt-1">
                ✓ Aktif Kural
              </span>
            )}
          </div>

          {/* Tier 5: 75 TL ve Üzeri */}
          <div className={`p-3.5 rounded-2xl border text-center transition-all col-span-2 sm:col-span-4 lg:col-span-1 ${
            activeSalePrice > 75.00
              ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/30 shadow-xs'
              : 'border-border bg-slate-50/70 text-gray-600'
          }`}>
            <span className="text-xs sm:text-sm font-black text-dark block">75₺ ve Üzeri</span>
            <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Minimum Satış Adedi</span>
            <span className={`text-xl sm:text-2xl font-black block mt-1 ${activeSalePrice > 75.00 ? 'text-emerald-700' : 'text-gray-700'}`}>
              1
            </span>
            {activeSalePrice > 75.00 && (
              <span className="text-[9px] font-black uppercase text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-300 inline-block mt-1">
                ✓ Tekli Satış
              </span>
            )}
          </div>
        </div>

        {/* 🌟 USER REQUEST: MINIMUM SIPARIS TOPLAM SATIŞ & TOPLAM KÂR HIGHLIGHT KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Paket / Sepet Toplamı */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-tint-50/80 via-white to-primary-tint-50/40 border border-primary/30 flex items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-black text-primary uppercase tracking-wide flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Minimum Sipariş Sepet Paketi ({currentSim.q} Adet)</span>
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-dark tabular-nums">
                  {formatCurrency(currentSim.basketGross)}
                </span>
                <span className="text-xs font-bold text-gray-500">Toplam Satış Tutarı</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">Toplam Oluşacak Kâr</span>
              <div className={`text-xl font-black tabular-nums ${currentSim.basketProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {formatCurrency(currentSim.basketProfit)}
              </div>
              <span className="text-[10px] font-bold text-emerald-700 block">%{currentSim.marginPercent.toFixed(1)} Marj</span>
            </div>
          </div>

          {/* Tekil Birim Başına Değerler */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-border flex items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-black text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                <Package className="w-4 h-4 text-gray-500" />
                <span>Tekil Birim Başına Değerler (1 Adet)</span>
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-dark tabular-nums">
                  {formatCurrency(currentSim.unitPrice)}
                </span>
                <span className="text-xs font-bold text-gray-500">Birim Satış Fiyatı</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">Birim Net Kâr</span>
              <div className={`text-xl font-black tabular-nums ${currentSim.unitProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {formatCurrency(currentSim.unitProfit)}
              </div>
              <span className="text-[10px] font-bold text-gray-500 block">Maliyet: {formatCurrency(costPrice)}</span>
            </div>
          </div>
        </div>

        {/* INSUFFICIENT STOCK WARNING BANNER IF APPLICABLE */}
        {isStockInsufficientForMOQ && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">⚠️ Trendyol Yetersiz Stok Uyarısı:</strong>
              <span>
                Ürününüzün mevcut stoğu (<strong>{stockCount} Adet</strong>), belirlenen fiyat için zorunlu minimum sipariş adedinden (<strong>{currentSim.q} Adet</strong>) az olduğu için Trendyol bu ürünü otomatik olarak <strong>"TÜKENDİ"</strong> sayacak ve satışa kapatacaktır. Lütfen stok miktarınızı en az {currentSim.q} adede yükseltin.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* MODE TOGGLE BUTTONS - ULTRA-COMPACT HORIZONTAL ROW LAYOUT */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setPricingMode('target_margin')}
          className={`px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl sm:rounded-3xl border text-left transition-all flex items-center gap-2 sm:gap-2.5 shadow-xs cursor-pointer ${
            pricingMode === 'target_margin'
              ? 'bg-primary text-white border-primary ring-2 ring-primary/20'
              : 'bg-white text-dark border-border hover:bg-canvas'
          }`}
        >
          <div className={`p-1.5 rounded-xl shrink-0 flex items-center justify-center ${
            pricingMode === 'target_margin' ? 'bg-white/20 text-white' : 'bg-primary-tint-100 text-primary'
          }`}>
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-black text-xs sm:text-sm block truncate leading-tight">1. Hedef Kârdan Fiyat</span>
            <span className={`text-[10px] sm:text-[11px] block leading-tight truncate mt-0.5 ${
              pricingMode === 'target_margin' ? 'text-white/85' : 'text-gray-500'
            }`}>
              Marj gir ➔ Fiyat bul (MOQ, Kargo & Giderler Dahil)
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setPricingMode('manual_price')}
          className={`px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl sm:rounded-3xl border text-left transition-all flex items-center gap-2 sm:gap-2.5 shadow-xs cursor-pointer ${
            pricingMode === 'manual_price'
              ? 'bg-primary text-white border-primary ring-2 ring-primary/20'
              : 'bg-white text-dark border-border hover:bg-canvas'
          }`}
        >
          <div className={`p-1.5 rounded-xl shrink-0 flex items-center justify-center ${
            pricingMode === 'manual_price' ? 'bg-white/20 text-white' : 'bg-primary-tint-100 text-primary'
          }`}>
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-black text-xs sm:text-sm block truncate leading-tight">2. Fiyattan Kâr Gör</span>
            <span className={`text-[10px] sm:text-[11px] block leading-tight truncate mt-0.5 ${
              pricingMode === 'manual_price' ? 'text-white/85' : 'text-gray-500'
            }`}>
              Fiyat gir ➔ Net kârı & sepeti gör
            </span>
          </div>
        </button>
      </div>

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* LEFT COLUMN: 10 DYNAMIC PARAMETER INPUTS (6 COLS) */}
        <div className="lg:col-span-6 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="text-xs sm:text-sm font-black text-dark flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              <span>Fiyatlandırma & Dinamik Gider Parametreleri</span>
            </h4>
            <Badge variant="outline" className="text-[10px]">Canlı Hesaplama</Badge>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* DYNAMIC MODE MODULE */}
            {pricingMode === 'target_margin' ? (
              <div className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-500/20 animate-in fade-in zoom-in-95 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-emerald-800 flex items-center gap-1.5 text-xs">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>Hedef Net Kâr Marjı (%) *</span>
                  </label>
                  <Badge variant="excellent" className="text-[10px]">Ters Fiyatlama & MOQ Aktif</Badge>
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
                  Belirlediğiniz %{targetMargin} kâr marjını elde etmek için gereken Trendyol birim satış fiyatı sağda anlık hesaplanır.
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-primary/40 bg-primary-tint-50/50 ring-2 ring-primary/20 animate-in fade-in zoom-in-95 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-primary flex items-center gap-1.5 text-xs">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span>Belirlenen Birim Satış Fiyatı (₺) *</span>
                  </label>
                  <Badge className="text-[10px] bg-primary text-white">Minimum {currentSim.q} Adet Satılır</Badge>
                </div>
                
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={manualSalePrice}
                    onChange={(e) => setManualSalePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-primary font-black text-primary text-sm bg-white focus:ring-2 focus:ring-primary shadow-xs"
                  />
                  <span className="absolute left-3 top-2.5 font-bold text-primary text-sm">₺</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-600 font-semibold">
                  <span>Minimum Sipariş Sepet Tutarı:</span>
                  <strong className="text-primary font-black">₺{currentSim.basketGross.toFixed(2)} ({currentSim.q} Adet)</strong>
                </div>
              </div>
            )}

            {/* DYNAMIC PARAMETER FIELDS GRID (1-10 DEĞİŞTİRİLEBİLİR GİDERLER) */}
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Birim Alış Maliyeti */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">1. Alış Maliyeti (₺ COGS)</label>
                <input
                  type="number"
                  step="0.1"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 2. Komisyon Oranı */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">2. Komisyon Oranı (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 3. Desi & Kargo */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">3. Paket Desisi</label>
                <input
                  type="number"
                  step="0.5"
                  value={desi}
                  onChange={(e) => setDesi(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 4. Platform Hizmet Bedeli */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">4. Hizmet Bedeli (₺/sipariş)</label>
                <input
                  type="number"
                  step="0.1"
                  value={serviceFee}
                  onChange={(e) => setServiceFee(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 5. Ambalaj & Paketleme Sabit Gideri */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">5. Ambalaj Gideri (₺/sipariş)</label>
                <input
                  type="number"
                  step="0.1"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 6. E-Fatura & Sabit Operasyon Gideri */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">6. E-Fatura & Sabit Op. (₺/sip)</label>
                <input
                  type="number"
                  step="0.05"
                  value={fixedOpCost}
                  onChange={(e) => setFixedOpCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 7. Stopaj Kesintisi (%) */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">7. Stopaj Kesintisi (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={stopajRate}
                  onChange={(e) => setStopajRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 8. KDV Oranı (%) */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">8. KDV Oranı (%)</label>
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value={1}>%1 (Gıda / Tıbbi)</option>
                  <option value={10}>%10 (Medikal & İlaç)</option>
                  <option value={20}>%20 (Genel Standart)</option>
                </select>
              </div>

              {/* 9. Ekstra Operasyon Gideri (%) */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">9. Ekstra Operasyon (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={extraOpRate}
                  onChange={(e) => setExtraOpRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 10. Önceki Ay İade Riski Oranı (%) */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">10. İade Riski Oranı (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={returnRate}
                  onChange={(e) => setReturnRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Kargo & Taşıyıcı & Termin Ayarları */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Anlaşmalı Kargo Taşıyıcısı</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="TEX">Trendyol Express (TEX)</option>
                  <option value="ARAS">Aras Kargo</option>
                  <option value="SURAT">Sürat Kargo</option>
                  <option value="MNG">MNG Kargo</option>
                  <option value="PTT">PTT Kargo</option>
                  <option value="YK">Yurtiçi Kargo (YK)</option>
                </select>
              </div>

              {/* Teslimat Modeli & Platform Hizmet Bedeli (Bugün Kargoda 4.99 TL vs Standart 10.99 TL) */}
              <div className="p-3.5 rounded-2xl bg-canvas border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-black text-dark flex items-center gap-1.5 text-xs">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Teslimat Modeli & Platform Hizmet Bedeli</span>
                  </label>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                    leadTimeDays === 1 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    {leadTimeDays === 1 ? '⚡ 4.99 TL + KDV (7.20 ₺ Tasarruf)' : '10.99 TL + KDV Standart'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLeadTimeDays(1);
                      setServiceFee(5.99); // 4.99 TL + %20 KDV
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      leadTimeDays === 1
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-border bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black block">⚡ Bugün Kargoda</span>
                      <span className="text-[10px] font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">₺5.99</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 block mt-1 font-semibold leading-tight">
                      ✓ 4.99 TL + KDV Hizmet Bedeli + Avantajlı Kargo Baremi
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLeadTimeDays(2);
                      setServiceFee(13.19); // 10.99 TL + %20 KDV
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      leadTimeDays >= 2
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs ring-2 ring-amber-500/20'
                        : 'border-border bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black block">📦 Standart Gönderi</span>
                      <span className="text-[10px] font-black text-amber-800 bg-white px-1.5 py-0.5 rounded border border-amber-200">₺13.19</span>
                    </div>
                    <span className="text-[10px] text-amber-700 block mt-1 font-semibold leading-tight">
                      10.99 TL + KDV Hizmet Bedeli (Standart Barem)
                    </span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: 10-ITEM WATERFALL & RESULTS (USER SCREENSHOT MATCH) (6 COLS) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Main Price & Net Profit Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
            
            {/* View Mode Switch: Birim Başına vs Minimum Sepet Paketi */}
            <div className="flex items-center justify-between gap-2 p-1 bg-canvas rounded-2xl border border-border">
              <button
                type="button"
                onClick={() => setBreakdownView('unit')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  breakdownView === 'unit'
                    ? 'bg-white text-dark shadow-xs font-black'
                    : 'text-gray-500 hover:text-dark'
                }`}
              >
                Birim Başına (1 Adet)
              </button>
              <button
                type="button"
                onClick={() => setBreakdownView('basket')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  breakdownView === 'basket'
                    ? 'bg-white text-primary font-black shadow-xs'
                    : 'text-gray-500 hover:text-dark'
                }`}
              >
                Minimum Sepet ({currentSim.q} Adet Toplamı)
              </button>
            </div>

            {/* Big Top Price & Net Profit */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">
                  {breakdownView === 'unit' 
                    ? (pricingMode === 'target_margin' ? '🎯 Birim Satış Fiyatı' : '🏷️ Birim Satış Fiyatı')
                    : `📦 Toplam Satış Tutarı (${currentSim.q} Adet)`}
                </span>
                <div className="text-3xl font-black text-primary tabular-nums mt-1">
                  {formatCurrency(breakdownView === 'unit' ? currentSim.unitPrice : currentSim.basketGross)}
                </div>
                {currentSim.q > 1 && (
                  <span className="text-[11px] text-gray-500 font-semibold block mt-0.5">
                    {breakdownView === 'unit' 
                      ? `Minimum Sipariş: ${currentSim.q} Adet (Sepet: ₺${currentSim.basketGross.toFixed(2)})`
                      : `Birim Fiyat: ₺${currentSim.unitPrice.toFixed(2)} × ${currentSim.q} Adet`}
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                  {breakdownView === 'unit' ? 'Birim Net Nakit Kâr' : `Toplam Oluşacak Kâr (${currentSim.q} Adet)`}
                </span>
                <div className={`text-2xl font-black tabular-nums mt-1 ${currentSim.unitProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(breakdownView === 'unit' ? currentSim.unitProfit : currentSim.basketProfit)}
                </div>
                <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                  Marj: %{currentSim.marginPercent.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Badges Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-bold">
              <span className="px-2.5 py-1 rounded-xl bg-canvas border border-border text-dark">
                Net Marj: <strong className="text-emerald-700">%{currentSim.marginPercent.toFixed(1)}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-canvas border border-border text-dark">
                Maliyet Üzeri: <strong className="text-primary">%{currentSim.markupPercent.toFixed(1)}</strong>
              </span>
              <span className={`px-2.5 py-1 rounded-xl text-[11px] border ${
                currentSim.shippingObj.isBaremSupported 
                  ? (currentSim.shippingObj.advantageStatus === 'advantageous_1day' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-amber-50 border-amber-300 text-amber-800')
                  : 'bg-gray-100 border-gray-300 text-gray-800'
              }`}>
                {currentSim.shippingObj.isBaremSupported 
                  ? (currentSim.shippingObj.advantageStatus === 'advantageous_1day' ? `✓ ${currentSim.shippingObj.tierName} (Avantajlı)` : `⚠️ ${currentSim.shippingObj.tierName} (Standart)`)
                  : `📦 ${currentSim.shippingObj.tierName}`}
              </span>
            </div>

            {/* 🌟 10-ITEM FINANCIAL WATERFALL (EXACTLY AS IN USER'S SCREENSHOT) */}
            <div className="space-y-2.5 pt-2 border-t border-border text-xs">
              
              {/* 1. Alış Maliyeti (COGS) */}
              <div className="flex items-center justify-between py-1 text-gray-700">
                <span>1. Alış Maliyeti (COGS)</span>
                <span className="font-bold text-red-700 tabular-nums">
                  -₺{(breakdownView === 'unit' ? costPrice : currentSim.basketCost).toFixed(2)}
                </span>
              </div>

              {/* 2. Trendyol Komisyonu */}
              <div className="flex items-center justify-between py-1 text-gray-700">
                <span>2. Trendyol Komisyonu (%{commissionRate})</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (currentSim.comm / currentSim.q) : currentSim.comm).toFixed(2)}
                </span>
              </div>

              {/* 3. Kargo Gideri */}
              <div className="flex items-center justify-between py-1 text-gray-700">
                <span>3. Kargo Gideri ({carrier}, {currentSim.shippingObj.tierName})</span>
                <span className="font-bold text-primary tabular-nums">
                  -₺{(breakdownView === 'unit' ? (currentSim.ship / currentSim.q) : currentSim.ship).toFixed(2)}
                </span>
              </div>

              {/* 4. Platform Hizmet Bedeli */}
              <div className="flex items-center justify-between py-1 text-gray-700">
                <span>
                  4. Platform Hizmet Bedeli ({serviceFee <= 6.5 ? 'Bugün Kargoda: 4.99 TL + KDV = ₺5.99/sipariş' : 'Standart: 10.99 TL + KDV = ₺13.19/sipariş'})
                </span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (serviceFee / currentSim.q) : serviceFee).toFixed(2)}
                </span>
              </div>

              {/* 5. Ambalaj & Paketleme Sabit Gideri */}
              <div className="flex items-center justify-between py-1 text-gray-700">
                <span>5. Ambalaj & Paketleme Sabit Gideri (₺{packagingCost.toFixed(2)}/sipariş)</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (packagingCost / currentSim.q) : packagingCost).toFixed(2)}
                </span>
              </div>

              {/* 6. E-Fatura & Sabit Operasyon Gideri */}
              <div className="flex items-center justify-between py-1 text-gray-700">
                <span>6. E-Fatura & Sabit Operasyon Gideri (₺{fixedOpCost.toFixed(2)}/sipariş)</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (fixedOpCost / currentSim.q) : fixedOpCost).toFixed(2)}
                </span>
              </div>

              {/* 7. Stopaj Kesintisi */}
              <div className="flex items-center justify-between py-1 text-gray-700">
                <span>7. Stopaj Kesintisi (%{stopajRate})</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (currentSim.stopaj / currentSim.q) : currentSim.stopaj).toFixed(2)}
                </span>
              </div>

              {/* 8. Ödenecek Net KDV Farkı */}
              <div className="flex items-center justify-between py-1 text-gray-700">
                <span>8. Ödenecek Net KDV Farkı (%{vatRate} KDV)</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (currentSim.netVat / currentSim.q) : currentSim.netVat).toFixed(2)}
                </span>
              </div>

              {/* 9. Ekstra Operasyon Gideri */}
              <div className="flex items-center justify-between py-1 text-gray-700">
                <span>9. Ekstra Operasyon Gideri (%{extraOpRate})</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (currentSim.extraOp / currentSim.q) : currentSim.extraOp).toFixed(2)}
                </span>
              </div>

              {/* 10. Önceki Ay İade Riski Rezervi (Ürün Başına Yapıldı) */}
              <div className="flex items-center justify-between py-1.5 text-purple-900 bg-purple-50 px-2.5 rounded-xl font-bold border border-purple-200">
                <span className="flex items-center gap-1.5">
                  <Undo2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>10. Önceki Ay İade Riski Rezervi (%{returnRate.toFixed(2)})</span>
                </span>
                <span className="font-black tabular-nums">
                  -₺{(breakdownView === 'unit' ? currentSim.returnRiskUnit : currentSim.returnRiskBasket).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Push to Trendyol Button (Matches orange style in screenshot) */}
            <Button
              onClick={handlePushPriceToTrendyol}
              disabled={syncingPrice}
              className="w-full h-11 text-xs font-black gap-2 bg-primary hover:bg-primary-hover text-white shadow-md rounded-2xl cursor-pointer mt-2"
            >
              <Send className="w-4 h-4" />
              <span>{syncingPrice ? "Trendyol'a İletiliyor..." : `Fiyatı Kaydet & Trendyol'a İlet (Birim: ₺${activeSalePrice.toFixed(2)})`}</span>
            </Button>
          </div>

          {/* BUYBOX COMPETITOR SIMULATION CARD */}
          <div className="bg-white p-5 rounded-3xl border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h5 className="text-xs font-black text-dark flex items-center gap-1.5">
                <Target className="w-4 h-4 text-primary" />
                <span>Buybox Rekabet Fiyat Simülatörü</span>
              </h5>
              <Badge variant={buyboxSim.unitProfit < 0 ? "danger" : (buyboxSim.marginPercent >= 10 ? "excellent" : "warning")}>
                {buyboxSim.unitProfit < 0 ? "⚠️ Zararına Satış Uyarısı" : (buyboxSim.marginPercent >= 10 ? "✓ Kârlı Rekabet" : "Düşük Kâr Uyarısı")}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-gray-600 block mb-1">Hedef BuyBox Birim Fiyatı (₺)</label>
                <input
                  type="number"
                  step="0.5"
                  value={competitorBuyboxPrice}
                  onChange={(e) => setCompetitorBuyboxPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl border border-border font-bold text-dark"
                />
                <span className="text-[10px] text-gray-500 font-semibold block mt-1">
                  MOQ: {buyboxSim.q} Adet (Sepet: ₺{buyboxSim.basketGross.toFixed(2)})
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-canvas border border-border">
                <span className="text-[10px] text-gray-500 font-bold block">Birim Net Kâr</span>
                <span className={`text-base font-black tabular-nums block ${buyboxSim.unitProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(buyboxSim.unitProfit)}
                </span>
                <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                  Sepet Kârı: {formatCurrency(buyboxSim.basketProfit)} (%{buyboxSim.marginPercent.toFixed(1)})
                </span>
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
                  <p className="text-xs text-gray-500">{dbProducts.length} ürün arasından arayın ve tek tıkla fiyatlandırma motoruna aktarın</p>
                </div>
              </div>

              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 rounded-2xl hover:bg-canvas text-gray-400 hover:text-dark transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap bg-white">
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

                          <td className="py-2.5 px-3 font-bold text-dark max-w-sm">
                            <span className="block truncate font-bold text-dark">{p.title}</span>
                            {p.modelCode && (
                              <span className="text-[10px] font-mono text-gray-400 block mt-0.5">Model: {p.modelCode}</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-canvas text-gray-700 font-mono text-[10px] font-bold border border-border block w-max">
                              {p.barcode}
                            </span>
                            {p.brand && (
                              <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">{p.brand}</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <Badge variant={p.stockQuantity > 0 ? "excellent" : "secondary"}>
                              {p.stockQuantity} Adet
                            </Badge>
                          </td>

                          <td className="py-2.5 px-3 text-right font-black text-dark tabular-nums">
                            ₺{parseFloat(p.salePrice || 0).toFixed(2)}
                          </td>

                          <td className="py-2.5 px-3 text-right font-bold text-red-700 tabular-nums">
                            ₺{parseFloat(p.costPrice || 1.00).toFixed(2)}
                          </td>

                          <td className="py-2.5 px-3 text-right font-black text-primary">
                            %{p.commissionRate || 16.15}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <Button
                              size="sm"
                              variant={isSelected ? "outline" : "default"}
                              onClick={() => handleSelectProduct(p)}
                              className={`h-7 text-xs font-bold gap-1 rounded-xl cursor-pointer ${
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
              <Button size="sm" variant="outline" onClick={() => setShowProductModal(false)} className="h-8 text-xs font-bold cursor-pointer">
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
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
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
