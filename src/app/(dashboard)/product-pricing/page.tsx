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
  Layers, Check, ChevronRight, Eye, Info, Sliders, ArrowDownRight
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
  };

  // Fixed Platform Service Fee (₺13.19 KDV Dahil)
  const serviceFee = 13.19;
  const withholdingTaxRate = 0.01; // %1 Stopaj Kesintisi
  const effectiveMargin = targetMargin / 100;
  const effectiveCommission = commissionRate / 100;

  // 1. REVERSE PRICING CALCULATION (Target Margin % -> Required Sale Price)
  // Iterative convergence to find the exact price matching cargo barem / desi
  let calculatedTargetPrice = 0;
  const denominator = 1 - effectiveCommission - withholdingTaxRate - effectiveMargin;

  if (denominator > 0) {
    // Initial guess
    let currentGuess = (costPrice + 46.50 + serviceFee) / denominator;
    for (let i = 0; i < 4; i++) {
      const shipGuess = calculateTrendyolShipping(currentGuess, desi, carrier, leadTimeDays, baremTiers, desiRates);
      currentGuess = (costPrice + shipGuess.finalShippingCostIncVat + serviceFee) / denominator;
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
  const effectiveShippingCost = activeShipping.finalShippingCostIncVat;

  // Cost Breakdown for Active Sale Price
  const commissionAmount = activeSalePrice * effectiveCommission;
  const withholdingAmount = activeSalePrice * withholdingTaxRate;

  // KDV Doğrusallaştırma
  const kdvMultiplier = 1 + (vatRate / 100);
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
  const buyboxProfit = competitorBuyboxPrice - (costPrice + buyboxCommission + buyboxShipping.finalShippingCostIncVat + serviceFee + buyboxWithholding + buyboxNetVat);
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

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Trendyol Akıllı Fiyatlandırma & Kârlılık Motoru</h3>
            <Badge variant="excellent">İki Yönlü Hesaplama</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hedef kâr marjından ideal satış fiyatı bulma, son fiyata göre net kâr analizi ve canlı kargo barem desteği
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={fetchAllData} className="h-8 sm:h-9 text-xs gap-1.5 font-bold">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Verileri Yenile</span>
        </Button>
      </div>

      {/* Select Product from Live DB */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-dark flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span>Veritabanından Ürün Seçerek Otomatik Doldur:</span>
          </label>
          {selectedProductObj && (
            <span className="text-[11px] font-mono text-gray-500 font-bold">
              Barkod: {selectedProductObj.barcode}
            </span>
          )}
        </div>

        <select
          value={selectedProductId}
          onChange={(e) => {
            const found = dbProducts.find(p => p.id === e.target.value);
            if (found) handleSelectProduct(found);
          }}
          className="w-full px-3 py-2.5 rounded-2xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
        >
          {dbProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} (Fiyat: ₺{parseFloat(p.salePrice || 0).toFixed(2)} | Stok: {p.stockQuantity} | Komisyon: %{p.commissionRate || 16.15})
            </option>
          ))}
        </select>
      </div>

      {/* MODE TOGGLE BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPricingMode('target_margin')}
          className={`p-4 rounded-3xl border text-left transition-all flex items-start gap-3 shadow-xs ${
            pricingMode === 'target_margin'
              ? 'bg-primary text-white border-primary ring-2 ring-primary/20'
              : 'bg-white text-dark border-border hover:bg-canvas'
          }`}
        >
          <Target className={`w-5 h-5 shrink-0 mt-0.5 ${pricingMode === 'target_margin' ? 'text-white' : 'text-primary'}`} />
          <div>
            <span className="font-black text-sm block">1. Mod: Hedef Kâr Marjından Fiyat Bul (Ters Fiyatlama)</span>
            <span className={`text-xs block mt-1 ${pricingMode === 'target_margin' ? 'text-white/80' : 'text-gray-500'}`}>
              Hedef kâr marjınızı (%) girin, sistem komisyon, kargo baremi ve stopajı düşerek satmanız gereken fiyatı otomatik hesaplasın.
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setPricingMode('manual_price')}
          className={`p-4 rounded-3xl border text-left transition-all flex items-start gap-3 shadow-xs ${
            pricingMode === 'manual_price'
              ? 'bg-primary text-white border-primary ring-2 ring-primary/20'
              : 'bg-white text-dark border-border hover:bg-canvas'
          }`}
        >
          <Sliders className={`w-5 h-5 shrink-0 mt-0.5 ${pricingMode === 'manual_price' ? 'text-white' : 'text-primary'}`} />
          <div>
            <span className="font-black text-sm block">2. Mod: Son Satış Fiyatından Net Kârı Gör (İleri Simülasyon)</span>
            <span className={`text-xs block mt-1 ${pricingMode === 'manual_price' ? 'text-white/80' : 'text-gray-500'}`}>
              Belirlediğiniz satış fiyatını (₺) girin, net nakit kârınızı, kâr marjınızı ve kesintileri anlık inceleyin.
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
            <span>Fiyatlandırma Parametreleri</span>
          </h4>

          <div className="space-y-4 text-xs">
            
            {/* HEDEF KÂR GİRİŞİ (VURGULANMIŞ) */}
            <div className={`p-4 rounded-2xl border transition-all ${
              pricingMode === 'target_margin' 
                ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20' 
                : 'bg-canvas/50 border-border'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-black text-emerald-800 flex items-center gap-1.5 text-xs">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span>Hedef Net Kâr Marjı (%) *</span>
                </label>
                {pricingMode === 'target_margin' && (
                  <Badge variant="excellent">Aktif Hesaplama Modu</Badge>
                )}
              </div>
              
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={targetMargin}
                  onChange={(e) => {
                    setTargetMargin(Math.max(0, parseFloat(e.target.value) || 0));
                    if (pricingMode !== 'target_margin') setPricingMode('target_margin');
                  }}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-emerald-400 font-black text-emerald-800 text-sm bg-white focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
                <span className="absolute left-3 top-2.5 font-bold text-emerald-600 text-sm">%</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold block mt-1.5">
                Bu marjı değiştirdiğinizde hedef satış fiyatı otomatik olarak anında hesaplanır.
              </span>
            </div>

            {/* SON SATIŞ FİYATI GİRİŞİ */}
            <div className={`p-4 rounded-2xl border transition-all ${
              pricingMode === 'manual_price' 
                ? 'bg-primary-tint-50/50 border-primary ring-2 ring-primary/20' 
                : 'bg-canvas/50 border-border'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-black text-primary flex items-center gap-1.5 text-xs">
                  <Sliders className="w-4 h-4 text-primary" />
                  <span>Son Satış Fiyatı (₺ KDV Dahil) *</span>
                </label>
                {pricingMode === 'manual_price' && (
                  <Badge variant="default">Aktif Hesaplama Modu</Badge>
                )}
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={manualSalePrice || ''}
                  onChange={(e) => {
                    setManualSalePrice(parseFloat(e.target.value) || 0);
                    if (pricingMode !== 'manual_price') setPricingMode('manual_price');
                  }}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-primary font-black text-dark text-sm bg-white focus:ring-2 focus:ring-primary shadow-xs"
                />
                <span className="absolute left-3 top-2.5 font-bold text-primary text-sm">₺</span>
              </div>
              <span className="text-[11px] text-gray-500 block mt-1.5">
                Fiyat girdiğinizde elde edeceğiniz net kâr ve marj anında listelenir.
              </span>
            </div>

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
                <label className="font-bold text-dark block mb-1">Paket Desi *</label>
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
                <label className="font-bold text-dark block mb-1">Kargo Firması (Veritabanı Tarifesi) *</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                >
                  <option value="TEX">Trendyol Express (TEX)</option>
                  <option value="Aras">Aras Kargo</option>
                  <option value="PTT">PTT Kargo</option>
                  <option value="Sürat">Sürat Kargo</option>
                  <option value="YK">Yurtiçi Kargo (YK)</option>
                  <option value="Kolay Gelsin">Kolay Gelsin</option>
                  <option value="DHL eCommerce">DHL eCommerce</option>
                </select>
              </div>

              {/* Termin Süresi (1-2-3 Gün Seçimi & Barem Desteği) */}
              <div className="p-3 rounded-2xl bg-canvas border border-border space-y-2">
                <label className="font-black text-dark flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>Termin Süresi & Kargo Barem Desteği</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {leadTimeDays === 1 ? '⚡ %5 Hızlı Teslimat Bonusu' : leadTimeDays === 2 ? 'Standart Barem' : 'Ek Maliyet'}
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { days: 1, label: '1 Gün (Hızlı)', badge: '%5 İndirimli' },
                    { days: 2, label: '2 Gün (Standart)', badge: 'Normal' },
                    { days: 3, label: '3 Gün (Uzatılmış)', badge: '+%5 Ceza' },
                  ].map((t) => (
                    <button
                      key={t.days}
                      type="button"
                      onClick={() => setLeadTimeDays(t.days)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        leadTimeDays === t.days
                          ? 'border-primary bg-primary-tint-50 text-primary font-bold shadow-xs'
                          : 'border-border bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xs block">{t.label}</span>
                      <span className="text-[9px] text-gray-400 block mt-0.5">{t.badge}</span>
                    </button>
                  ))}
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
                  {pricingMode === 'target_margin' ? '🎯 Hedef Marja Göre Olması Gereken Fiyat' : '🏷️ Belirlenen Satış Fiyatı'}
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
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {activeShipping.isBaremSupported ? `✓ ${activeShipping.tierName} Desteği` : `⚠️ ${activeShipping.tierName}`}
              </span>
            </div>

            {/* Dynamic Shipping Explanation Box */}
            <div className="p-3 rounded-2xl bg-canvas border border-border flex items-start gap-2.5 text-xs text-gray-600">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-dark block">Kargo Hesaplama Detayı:</span>
                <span className="text-[11px] text-gray-500 leading-relaxed">{activeShipping.explanation}</span>
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
                  <span>3. Kargo Gideri ({carrier}, {activeShipping.isBaremSupported ? 'Barem Desteği' : `${desi} Desi`})</span>
                  {leadTimeDays === 1 && activeShipping.leadTimeDiscountAmount > 0 && (
                    <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">-%5 İndirimli</span>
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
              <Badge variant={buyboxMargin >= 10 ? "excellent" : "secondary"}>
                {buyboxMargin >= 10 ? "Kârlı Rekabet" : "Düşük Kâr Uyarısı"}
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
    </div>
  );
}
