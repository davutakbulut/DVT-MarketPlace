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
  AlertCircle, Undo2, Receipt, Box, Settings, Coins
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

  // Form State
  const [costPrice, setCostPrice] = useState<number>(1.00);
  const [targetMargin, setTargetMargin] = useState<number>(20);
  const [commissionRate, setCommissionRate] = useState<number>(16.15);
  const [vatRate, setVatRate] = useState<number>(10);
  const [desi, setDesi] = useState<number>(1);
  const [carrier, setCarrier] = useState<string>("TEX");
  const [leadTimeDays, setLeadTimeDays] = useState<number>(1); // 1, 2, 3 days
  const [manualSalePrice, setManualSalePrice] = useState<number>(149.90);
  const [competitorBuyboxPrice, setCompetitorBuyboxPrice] = useState<number>(139.90);
  const [syncingPrice, setSyncingPrice] = useState(false);

  // =========================================================================
  // DYNAMIC SETTINGS & FIXED EXPENSES (Ayarlardan Çekilen Tüm Sabit Giderler)
  // =========================================================================
  const [serviceFee, setServiceFee] = useState<number>(13.19); // Platform Hizmet Bedeli
  const [packagingCost, setPackagingCost] = useState<number>(1.00); // Sabit Paketleme/Ambalaj
  const [invoiceCost, setInvoiceCost] = useState<number>(0.30); // Sabit E-Fatura/Muhasebe
  const [fixedExtraOpCost, setFixedExtraOpCost] = useState<number>(0.50); // Sabit Ekstra Operasyon
  const [extraOperationRate, setExtraOperationRate] = useState<number>(6.0); // Oransal Ekstra Operasyon (%)
  const [earlyPayoutRate, setEarlyPayoutRate] = useState<number>(0.16); // Erken Ödeme Oranı (%)
  const [withholdingTaxRate, setWithholdingTaxRate] = useState<number>(0.01); // Stopaj Kesintisi (%1)
  const [prevMonthReturnRate, setPrevMonthReturnRate] = useState<number>(0.69); // Önceki Ay İade Yüzdesi (%)

  // Fetch real products, live cargo barems, and all fixed settings from DB
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Products
      const pRes = await fetch(`/api/products?storeId=${activeStoreId}`);
      const pData = await pRes.json();
      const pList = Array.isArray(pData) ? pData : (pData.products || []);
      setDbProducts(pList);

      // 2. Fetch ALL Fixed Settings & Previous Month Return Rate
      try {
        const sRes = await fetch('/api/settings/general');
        const sData = await sRes.json();
        if (sData?.settings) {
          const st = sData.settings;
          if (st.defaultServiceFee !== undefined) setServiceFee(parseFloat(st.defaultServiceFee) || 13.19);
          if (st.defaultPackagingCost !== undefined) setPackagingCost(parseFloat(st.defaultPackagingCost) || 1.00);
          if (st.invoiceFixedCost !== undefined) setInvoiceCost(parseFloat(st.invoiceFixedCost) || 0.30);
          if (st.extraOperationCost !== undefined) setFixedExtraOpCost(parseFloat(st.extraOperationCost) || 0.50);
          if (st.extraOperationRate !== undefined) setExtraOperationRate(parseFloat(st.extraOperationRate) || 6.0);
          if (st.earlyPayoutRate !== undefined) setEarlyPayoutRate(parseFloat(st.earlyPayoutRate) || 0.16);
          if (st.defaultWithholdingRate !== undefined || st.defaultStopajRate !== undefined) {
            setWithholdingTaxRate((parseFloat(st.defaultWithholdingRate || st.defaultStopajRate) || 1.0) / 100);
          }
          if (st.prevMonthReturnRate !== undefined) {
            setPrevMonthReturnRate(parseFloat(st.prevMonthReturnRate) || 0.69);
          }
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

  const handleSelectProduct = (p: any) => {
    setSelectedProductId(p.id);
    setSelectedProductObj(p);
    setCostPrice(parseFloat(p.costPrice || 1.00));
    setCommissionRate(parseFloat(p.commissionRate || 16.15));
    setVatRate(parseInt(p.vatRate || 10));
    setDesi(parseFloat(p.desi || 1.0));
    const sale = parseFloat(p.salePrice || 149.90);
    setManualSalePrice(sale);
    setCompetitorBuyboxPrice(sale > 0 ? sale * 0.98 : 139.90);
    setLeadTimeDays(p.deliveryType === 'fast_delivery' ? 1 : 2);
    setShowProductModal(false);
  };

  // Financial Rates & Constants
  const effectiveMargin = targetMargin / 100;
  const effectiveCommission = commissionRate / 100;
  const effectiveExtraOp = (extraOperationRate || 0) / 100;
  const effectiveEarlyPayout = (earlyPayoutRate || 0) / 100;
  const effectiveReturnRate = (prevMonthReturnRate || 0) / 100;
  const kdvMultiplier = 1 + (vatRate / 100);
  const vatFraction = (vatRate / 100) / kdvMultiplier;

  // Toplam Sabit Masraflar (Sipariş Başına: Hizmet + Ambalaj + Fatura + Sabit Operasyon)
  const totalFixedOrderOverhead = serviceFee + packagingCost + invoiceCost + fixedExtraOpCost;

  // =========================================================================
  // 1. REVERSE PRICING CALCULATION WITH MINIMUM ORDER QUANTITY (MOQ) & ALL FIXED EXPENSES
  // =========================================================================
  const calculateReversePrice = () => {
    const denominator = 1 - effectiveCommission - withholdingTaxRate - vatFraction - effectiveMargin - effectiveExtraOp - effectiveEarlyPayout;
    if (denominator <= 0) return costPrice * 1.5;

    const candidateTiers = [
      { minP: 0, maxP: 25.00, q: 6 },
      { minP: 25.0001, maxP: 35.00, q: 4 },
      { minP: 35.0001, maxP: 50.00, q: 3 },
      { minP: 50.0001, maxP: 75.00, q: 2 },
      { minP: 75.0001, maxP: Infinity, q: 1 },
    ];

    for (const t of candidateTiers) {
      const basketCostExVat = (costPrice * t.q) * (1 - vatFraction);
      let guessBasket = (basketCostExVat + 46.50 + totalFixedOrderOverhead) / denominator;
      for (let i = 0; i < 6; i++) {
        const shipGuess = calculateTrendyolShipping(guessBasket, desi, carrier, leadTimeDays, baremTiers, desiRates);
        const returnRiskReserve = effectiveReturnRate * (shipGuess.appliedPriceIncVat * 1.5 + serviceFee);
        guessBasket = (basketCostExVat + shipGuess.appliedPriceIncVat + totalFixedOrderOverhead + returnRiskReserve) / denominator;
      }
      const unitP = guessBasket / t.q;
      if (unitP >= t.minP && (t.maxP === Infinity || unitP <= t.maxP)) {
        return Math.round(unitP * 100) / 100;
      }
    }

    // Default Fallback
    const costExVat = costPrice * (1 - vatFraction);
    let guess = (costExVat + 46.50 + totalFixedOrderOverhead) / denominator;
    for (let i = 0; i < 6; i++) {
      const shipGuess = calculateTrendyolShipping(guess, desi, carrier, leadTimeDays, baremTiers, desiRates);
      const returnRiskReserve = effectiveReturnRate * (shipGuess.appliedPriceIncVat * 1.5 + serviceFee);
      guess = (costExVat + shipGuess.appliedPriceIncVat + totalFixedOrderOverhead + returnRiskReserve) / denominator;
    }
    return Math.round(guess * 100) / 100;
  };

  const calculatedTargetPrice = calculateReversePrice();

  // 2. ACTIVE SALE PRICE FOR RENDERING & SIMULATION
  const activeSalePrice = pricingMode === 'target_margin' 
    ? calculatedTargetPrice 
    : (manualSalePrice > 0 ? manualSalePrice : calculatedTargetPrice);

  // 3. MINIMUM ORDER QUANTITY (MOQ) FOR ACTIVE SALE PRICE
  const activeMOQ = getMinimumOrderQuantity(activeSalePrice);

  // 4. BASKET-LEVEL CALCULATIONS (Minimum Sipariş Sepet Paketi)
  const basketGrossAmount = activeSalePrice * activeMOQ;
  const basketCostAmount = costPrice * activeMOQ;

  // Exact Shipping Cost for the Minimum Order Basket
  const activeShipping = calculateTrendyolShipping(basketGrossAmount, desi, carrier, leadTimeDays, baremTiers, desiRates);
  const effectiveShippingCost = activeShipping.appliedPriceIncVat;

  // Önceki Ay İade Oranına Göre İade Riski Karşılığı
  const returnRiskCostPerBasket = effectiveReturnRate * (effectiveShippingCost * 1.5 + serviceFee);

  // Basket Cost Breakdown (Tüm Sabit ve Oransal Giderler Dahil)
  const basketCommission = basketGrossAmount * effectiveCommission;
  const basketWithholding = basketGrossAmount * withholdingTaxRate;
  const basketExtraOp = basketGrossAmount * effectiveExtraOp;
  const basketEarlyPayout = basketGrossAmount * effectiveEarlyPayout;

  // KDV Doğrusallaştırma
  const basketSaleVat = (basketGrossAmount / kdvMultiplier) * (vatRate / 100);
  const basketCostVat = (basketCostAmount / kdvMultiplier) * (vatRate / 100);
  const basketNetVat = Math.max(0, basketSaleVat - basketCostVat);

  // Toplam Sepet Giderleri
  const basketTotalExpenses = (
    basketCostAmount +
    basketCommission +
    effectiveShippingCost +
    serviceFee +
    packagingCost +
    invoiceCost +
    fixedExtraOpCost +
    basketWithholding +
    basketNetVat +
    basketExtraOp +
    basketEarlyPayout +
    returnRiskCostPerBasket
  );

  // Net Cash Profit & Margins
  const basketNetProfit = basketGrossAmount - basketTotalExpenses;
  const unitNetProfit = basketNetProfit / activeMOQ;

  const achievedMarginPercent = basketGrossAmount > 0 ? (basketNetProfit / basketGrossAmount) * 100 : 0;
  const achievedMarkupPercent = basketCostAmount > 0 ? (basketNetProfit / basketCostAmount) * 100 : 0;

  // 5. BUYBOX SIMULATION (Considering MOQ of Competitor Price)
  const buyboxMOQ = getMinimumOrderQuantity(competitorBuyboxPrice);
  const buyboxBasketGross = competitorBuyboxPrice * buyboxMOQ;
  const buyboxBasketCost = costPrice * buyboxMOQ;
  const buyboxShipping = calculateTrendyolShipping(buyboxBasketGross, desi, carrier, leadTimeDays, baremTiers, desiRates);
  const buyboxReturnRisk = effectiveReturnRate * (buyboxShipping.appliedPriceIncVat * 1.5 + serviceFee);
  const buyboxCommission = buyboxBasketGross * effectiveCommission;
  const buyboxWithholding = buyboxBasketGross * withholdingTaxRate;
  const buyboxExtraOp = buyboxBasketGross * effectiveExtraOp;
  const buyboxEarlyPayout = buyboxBasketGross * effectiveEarlyPayout;
  const buyboxSaleVat = (buyboxBasketGross / kdvMultiplier) * (vatRate / 100);
  const buyboxCostVat = (buyboxBasketCost / kdvMultiplier) * (vatRate / 100);
  const buyboxNetVat = Math.max(0, buyboxSaleVat - buyboxCostVat);
  const buyboxBasketProfit = buyboxBasketGross - (
    buyboxBasketCost + 
    buyboxCommission + 
    buyboxShipping.appliedPriceIncVat + 
    totalFixedOrderOverhead + 
    buyboxWithholding + 
    buyboxNetVat + 
    buyboxExtraOp + 
    buyboxEarlyPayout + 
    buyboxReturnRisk
  );
  const buyboxUnitProfit = buyboxBasketProfit / buyboxMOQ;
  const buyboxMargin = buyboxBasketGross > 0 ? (buyboxBasketProfit / buyboxBasketGross) * 100 : 0;

  // Stock sufficiency check
  const stockCount = selectedProductObj ? Number(selectedProductObj.stockQuantity || 0) : 100;
  const isStockInsufficientForMOQ = stockCount < activeMOQ;

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
            <h3 className="text-base sm:text-lg font-black text-dark">Trendyol Fiyatlandırma & Minimum Sipariş Motoru</h3>
            <Badge variant="excellent" className="text-[10px] sm:text-xs">Tüm Sabit Giderler & İade Riski Dahil</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Ürün fiyatına göre zorunlu <strong>Minimum Sipariş Adedi</strong>, tüm şirket sabit giderleri ({formatCurrency(totalFixedOrderOverhead)}/sipariş) ve önceki ay iade riski rezervi ({prevMonthReturnRate}%) dahil kârlılık optimizasyonu.
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

      {/* ========================================================================= */}
      {/* 🚀 TRENDYOL MINIMUM SIPARIS ADEDI & HIGHLIGHT CARDS (USER SCREENSHOT MATCH) */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm sm:text-base font-black text-dark flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span>Minimum Sipariş Adedi & Paket Hacmi</span>
            </h4>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-gray-500">Önceki Ay İade Oranı:</span>
              <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 font-mono">
                %{prevMonthReturnRate.toFixed(2)}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Minimum Sipariş Adedi, bir ürünün müşteri tarafından alınması gereken minimum sayıyı belirtir. Müşteri ürünü sipariş içerisinde bu adetten daha az sayıda alamaz. Ürün fiyat baremine göre minimum sipariş adetleri aşağıda belirtilmiştir. <strong>Ürün stoğu Minimum Sipariş Adedi değerinden düşük ise ürünün stoğu tükendi olarak değerlendirilecektir.</strong>
          </p>
        </div>

        {/* 4 + 1 BAREM TIERS GRID (EXACTLY AS IN SCREENSHOT) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* Tier 1: 0 - 25 TL */}
          <div className={`p-3.5 rounded-2xl border text-center transition-all ${
            activeSalePrice <= 25.00
              ? 'border-primary bg-primary-tint-50/50 ring-2 ring-primary/30 shadow-xs'
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
              ? 'border-primary bg-primary-tint-50/50 ring-2 ring-primary/30 shadow-xs'
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
              ? 'border-primary bg-primary-tint-50/50 ring-2 ring-primary/30 shadow-xs'
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
              ? 'border-primary bg-primary-tint-50/50 ring-2 ring-primary/30 shadow-xs'
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
              ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/30 shadow-xs'
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

        {/* 🌟 USER REQUEST: MINIMUM SIPARIS ADEDINE GİREN SİPARİŞLER İÇİN TOPLAM SATIŞ TUTARI VE TOPLAM KÂR ÖZET KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Paket / Sepet Toplamı */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-tint-50/80 via-white to-primary-tint-50/40 border border-primary/30 flex items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-black text-primary uppercase tracking-wide flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Minimum Sipariş Sepet Paketi ({activeMOQ} Adet)</span>
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-dark tabular-nums">
                  {formatCurrency(basketGrossAmount)}
                </span>
                <span className="text-xs font-bold text-gray-500">Toplam Satış Tutarı</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">Toplam Oluşacak Kâr</span>
              <div className={`text-xl font-black tabular-nums ${basketNetProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {formatCurrency(basketNetProfit)}
              </div>
              <span className="text-[10px] font-bold text-emerald-700 block">%{achievedMarginPercent.toFixed(1)} Marj</span>
            </div>
          </div>

          {/* Tekil Birim Başına Getiri */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-border flex items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-black text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                <Package className="w-4 h-4 text-gray-500" />
                <span>Tekil Birim Başına Değerler (1 Adet)</span>
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-dark tabular-nums">
                  {formatCurrency(activeSalePrice)}
                </span>
                <span className="text-xs font-bold text-gray-500">Birim Satış Fiyatı</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">Birim Net Kâr</span>
              <div className={`text-xl font-black tabular-nums ${unitNetProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {formatCurrency(unitNetProfit)}
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
                Ürününüzün mevcut stoğu (<strong>{stockCount} Adet</strong>), belirlenen fiyat için zorunlu minimum sipariş adedinden (<strong>{activeMOQ} Adet</strong>) az olduğu için Trendyol bu ürünü otomatik olarak <strong>"TÜKENDİ"</strong> sayacak ve satışa kapatacaktır. Lütfen stok miktarınızı en az {activeMOQ} adede yükseltin.
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
              Marj gir ➔ Fiyat bul (Sabit Giderler & MOQ Dahil)
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
        
        {/* LEFT COLUMN: PARAMETER INPUTS (6 COLS) */}
        <div className="lg:col-span-6 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-5">
          <h4 className="text-xs sm:text-sm font-black text-dark flex items-center gap-2 pb-2 border-b border-border">
            <Calculator className="w-4 h-4 text-primary" />
            <span>Fiyatlandırma & Maliyet Parametreleri</span>
          </h4>

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
                  <Badge className="text-[10px] bg-primary text-white">Minimum {activeMOQ} Adet Satılır</Badge>
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
                  <strong className="text-primary font-black">₺{basketGrossAmount.toFixed(2)} ({activeMOQ} Adet)</strong>
                </div>
              </div>
            )}

            {/* Parameter Fields Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Birim Alış Maliyeti */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Birim Alış Maliyeti (₺)</label>
                <input
                  type="number"
                  step="0.5"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Komisyon Oranı */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Komisyon Oranı (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* KDV Oranı */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">KDV Oranı (%)</label>
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value={1}>%1 (Temel Gıda / Tıbbi)</option>
                  <option value={10}>%10 (Medikal & İlaç)</option>
                  <option value={20}>%20 (Genel Standart)</option>
                </select>
              </div>

              {/* Paket Desisi */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Ürün / Paket Desisi</label>
                <input
                  type="number"
                  step="0.5"
                  value={desi}
                  onChange={(e) => setDesi(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Kargo & Taşıyıcı Seçici */}
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
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
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
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
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

              {/* DİNAMİK SABİT GİDERLER & İADE YÜZDESİ ÖZET PANELİ (SETTINGS SYNC) */}
              <div className="p-3.5 rounded-2xl bg-canvas/60 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-dark">
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-primary" />
                    <span>Ayarlardaki Sabit Giderler & İade Karşılığı</span>
                  </span>
                  <Badge variant="outline" className="text-[10px]">Ayarlarla Canlı Senkron</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white border border-border">
                    <span className="text-gray-400 block text-[9px] font-semibold">Platform Hizmeti</span>
                    <span className="font-black text-dark">{formatCurrency(serviceFee)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-border">
                    <span className="text-gray-400 block text-[9px] font-semibold">Ambalaj / Paket</span>
                    <span className="font-black text-dark">{formatCurrency(packagingCost)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-border">
                    <span className="text-gray-400 block text-[9px] font-semibold">E-Fatura & Operasyon</span>
                    <span className="font-black text-dark">{formatCurrency(invoiceCost + fixedExtraOpCost)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-border">
                    <span className="text-gray-400 block text-[9px] font-semibold">Önceki Ay İade Oranı</span>
                    <span className="font-black text-purple-700">%{prevMonthReturnRate.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: CALCULATION RESULTS & WATERFALL (6 COLS) */}
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
                Minimum Sepet ({activeMOQ} Adet Toplamı)
              </button>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">
                  {breakdownView === 'unit' 
                    ? (pricingMode === 'target_margin' ? '🎯 Birim Satış Fiyatı' : '🏷️ Birim Satış Fiyatı')
                    : `📦 Toplam Oluşacak Satış Tutarı (${activeMOQ} Adet)`}
                </span>
                <div className="text-3xl font-black text-primary tabular-nums mt-1">
                  {formatCurrency(breakdownView === 'unit' ? activeSalePrice : basketGrossAmount)}
                </div>
                {activeMOQ > 1 && (
                  <span className="text-[11px] text-gray-500 font-semibold block mt-0.5">
                    {breakdownView === 'unit' 
                      ? `Minimum Sipariş: ${activeMOQ} Adet (Sepet: ₺${basketGrossAmount.toFixed(2)})`
                      : `Birim Fiyat: ₺${activeSalePrice.toFixed(2)} × ${activeMOQ} Adet`}
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                  {breakdownView === 'unit' ? 'Birim Net Nakit Kâr' : `Toplam Oluşacak Kâr (${activeMOQ} Adet)`}
                </span>
                <div className={`text-2xl font-black tabular-nums mt-1 ${unitNetProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(breakdownView === 'unit' ? unitNetProfit : basketNetProfit)}
                </div>
                <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                  Marj: %{achievedMarginPercent.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Badges Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-bold">
              <span className="px-2.5 py-1 rounded-xl bg-canvas border border-border text-dark">
                Net Marj: <strong className="text-emerald-700">%{achievedMarginPercent.toFixed(1)}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-canvas border border-border text-dark">
                Maliyet Üzeri: <strong className="text-primary">%{achievedMarkupPercent.toFixed(1)}</strong>
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

            {/* Dynamic Shipping Explanation Box (Calculated on Basket Total) */}
            <div className="p-3.5 rounded-2xl bg-canvas border border-border flex items-start gap-2.5 text-xs text-gray-600">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-dark block">
                  Kargo Baremi (₺{basketGrossAmount.toFixed(2)} Sepet Tutarına Göre):
                </span>
                <span className="text-[11px] text-gray-600 leading-relaxed block mt-0.5">
                  {activeShipping.explanation}
                </span>
                {activeMOQ > 1 && (
                  <span className="text-[11px] text-primary font-bold block mt-1">
                    💡 Minimum Sipariş Adedi ({activeMOQ} Adet) sayesinde tek bir kargo ücreti ({formatCurrency(effectiveShippingCost)}) tüm sepete bölünerek ürün kârlılığı korunur!
                  </span>
                )}
              </div>
            </div>

            {/* Comprehensive Financial Waterfall Cost Breakdown */}
            <div className="space-y-2 pt-2 border-t border-border text-xs">
              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>1. Alış Maliyeti (COGS)</span>
                <span className="font-bold text-red-700 tabular-nums">
                  -₺{(breakdownView === 'unit' ? costPrice : basketCostAmount).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>2. Trendyol Komisyonu (%{commissionRate})</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (basketCommission / activeMOQ) : basketCommission).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>3. Kargo Gideri ({carrier}, {activeShipping.isBaremSupported ? activeShipping.tierName : `${desi} Desi`})</span>
                <span className="font-bold text-primary tabular-nums">
                  -₺{(breakdownView === 'unit' ? (effectiveShippingCost / activeMOQ) : effectiveShippingCost).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>4. Platform Hizmet Bedeli ({formatCurrency(serviceFee)}/sipariş)</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (serviceFee / activeMOQ) : serviceFee).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>5. Ambalaj & Paketleme Sabit Gideri ({formatCurrency(packagingCost)}/sipariş)</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (packagingCost / activeMOQ) : packagingCost).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>6. E-Fatura & Sabit Operasyon Gideri ({formatCurrency(invoiceCost + fixedExtraOpCost)}/sipariş)</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? ((invoiceCost + fixedExtraOpCost) / activeMOQ) : (invoiceCost + fixedExtraOpCost)).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>7. Stopaj Kesintisi (%{(withholdingTaxRate * 100).toFixed(0)})</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (basketWithholding / activeMOQ) : basketWithholding).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>8. Ödenecek Net KDV Farkı</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (basketNetVat / activeMOQ) : basketNetVat).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-600">
                <span>9. Ekstra Operasyon Gideri (%{extraOperationRate})</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  -₺{(breakdownView === 'unit' ? (basketExtraOp / activeMOQ) : basketExtraOp).toFixed(2)}
                </span>
              </div>

              {/* Önceki Ay İade Riski Rezervi */}
              <div className="flex items-center justify-between py-1 text-purple-900 bg-purple-50/60 px-2 rounded-lg font-semibold">
                <span className="flex items-center gap-1">
                  <Undo2 className="w-3 h-3 text-purple-600" />
                  <span>10. Önceki Ay İade Riski Rezervi (%{prevMonthReturnRate.toFixed(2)})</span>
                </span>
                <span className="font-bold tabular-nums">
                  -₺{(breakdownView === 'unit' ? (returnRiskCostPerBasket / activeMOQ) : returnRiskCostPerBasket).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Push to Trendyol Button */}
            <Button
              onClick={handlePushPriceToTrendyol}
              disabled={syncingPrice}
              className="w-full h-10 text-xs font-black gap-2 bg-primary hover:bg-primary-hover text-white shadow-xs rounded-2xl cursor-pointer"
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
              <Badge variant={buyboxUnitProfit < 0 ? "danger" : (buyboxMargin >= 10 ? "excellent" : "warning")}>
                {buyboxUnitProfit < 0 ? "⚠️ Zararına Satış Uyarısı" : (buyboxMargin >= 10 ? "✓ Kârlı Rekabet" : "Düşük Kâr Uyarısı")}
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
                  MOQ: {buyboxMOQ} Adet (Sepet: ₺{buyboxBasketGross.toFixed(2)})
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-canvas border border-border">
                <span className="text-[10px] text-gray-500 font-bold block">Birim Net Kâr</span>
                <span className={`text-base font-black tabular-nums block ${buyboxUnitProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(buyboxUnitProfit)}
                </span>
                <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                  Sepet Kârı: {formatCurrency(buyboxBasketProfit)} (%{buyboxMargin.toFixed(1)})
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
                  <p className="text-xs text-gray-500">{dbProducts.length} benzersiz ürün arasından arayın, filtreleyin ve tek tıkla fiyatlandırmaya aktarın</p>
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
