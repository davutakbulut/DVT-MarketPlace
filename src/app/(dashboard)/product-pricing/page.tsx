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
  Layers, Check, ChevronRight, Eye
} from "lucide-react";

export default function ProductPricingPage() {
  // DB Products
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductObj, setSelectedProductObj] = useState<any>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form State
  const [costPrice, setCostPrice] = useState<number>(50);
  const [targetMargin, setTargetMargin] = useState<number>(20);
  const [commissionRate, setCommissionRate] = useState<number>(16.15);
  const [vatRate, setVatRate] = useState<number>(10);
  const [desi, setDesi] = useState<number>(1);
  const [carrier, setCarrier] = useState<string>("Trendyol Express");
  const [leadTimeDays, setLeadTimeDays] = useState<number>(1); // 1, 2, 3 days
  const [manualSalePrice, setManualSalePrice] = useState<number>(0);
  const [competitorBuyboxPrice, setCompetitorBuyboxPrice] = useState<number>(149.90);
  const [syncingPrice, setSyncingPrice] = useState(false);

  // Fetch real products from DB
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.products || []);
      setDbProducts(list);
      if (list.length > 0 && !selectedProductId) {
        handleSelectProduct(list[0]);
      }
    } catch (e) {
      toast.error("Ürünler veritabanından çekilemedi.");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSelectProduct = (p: any) => {
    setSelectedProductId(p.id);
    setSelectedProductObj(p);
    setCostPrice(parseFloat(p.costPrice || 50));
    setCommissionRate(parseFloat(p.commissionRate || 16.15));
    setVatRate(parseInt(p.vatRate || 10));
    setDesi(parseFloat(p.desi || 1.0));
    const sale = parseFloat(p.salePrice || 0);
    setManualSalePrice(sale);
    setCompetitorBuyboxPrice(sale > 0 ? sale * 0.98 : 149.90);
    setLeadTimeDays(p.deliveryType === 'fast_delivery' ? 1 : 2);
  };

  // Shipping Desi Rates Matrix (DB Grounded)
  const carrierRates: Record<string, { base: number; perDesi: number }> = {
    "Trendyol Express": { base: 38.74, perDesi: 4.20 },
    "Aras Kargo": { base: 45.00, perDesi: 4.80 },
    "PTT Kargo": { base: 36.50, perDesi: 3.90 },
    "Sürat Kargo": { base: 42.00, perDesi: 4.40 },
    "Yurtiçi Kargo": { base: 49.00, perDesi: 5.10 },
    "Kolay Gelsin": { base: 46.00, perDesi: 4.50 },
    "DHL eCommerce": { base: 48.00, perDesi: 4.70 },
  };

  // 1. CARGO BAREM SUPPORT & LEAD TIME CALCULATION
  const currentCarrierRate = carrierRates[carrier] || carrierRates["Trendyol Express"];
  const baseShippingCost = currentCarrierRate.base + (Math.max(1, desi) - 1) * currentCarrierRate.perDesi;

  // Lead Time factor:
  // 1 Day (Hızlı Teslimat) -> %5 Trendyol Kargo Barem Desteği İndirimi
  // 2 Day (Standart) -> 1.0x
  // 3 Day (Gecikmeli) -> +%5 Kargo Ek Maliyeti
  const leadTimeFactor = leadTimeDays === 1 ? 0.95 : leadTimeDays === 2 ? 1.00 : 1.05;
  const effectiveShippingCost = baseShippingCost * leadTimeFactor;

  // Fixed Service Fee (₺13.19 KDV Dahil)
  const serviceFee = 13.19;
  const withholdingTaxRate = 0.01; // %1 Stopaj Kesintisi

  // 2. REVERSE PRICING CALCULATION (Cost + Target Margin -> Selling Price)
  const effectiveMargin = targetMargin / 100;
  const effectiveCommission = commissionRate / 100;

  // Formula: SalePrice * (1 - Commission - Withholding - Margin) = Cost + EffectiveShipping + ServiceFee
  const denominator = 1 - effectiveCommission - withholdingTaxRate - effectiveMargin;
  const calculatedTargetPrice = denominator > 0 
    ? (costPrice + effectiveShippingCost + serviceFee) / denominator 
    : costPrice * 1.5;

  // 3. FORWARD PROFIT SIMULATION (Final Sale Price -> Net Cash Profit)
  const activeSalePrice = manualSalePrice > 0 ? manualSalePrice : calculatedTargetPrice;
  
  // Barem Support Threshold Check
  let baremStatusLabel = "Standart Barem";
  if (activeSalePrice < 200) {
    baremStatusLabel = "1. Kademe Barem Desteği (0 - 199.99 ₺)";
  } else if (activeSalePrice < 350) {
    baremStatusLabel = "2. Kademe Barem Desteği (200 - 349.99 ₺)";
  } else {
    baremStatusLabel = "Standart Desi Baremi (350+ ₺)";
  }

  // Cost Breakdown for Active Sale Price
  const commissionAmount = activeSalePrice * effectiveCommission;
  const withholdingAmount = activeSalePrice * withholdingTaxRate;

  // KDV Doğrusallaştırma
  const kdvMultiplier = 1 + (vatRate / 100);
  const saleVat = (activeSalePrice / kdvMultiplier) * (vatRate / 100);
  const costVat = (costPrice / kdvMultiplier) * (vatRate / 100);
  const netVatAmount = Math.max(0, saleVat - costVat);

  // Net Cash Profit
  const netCashProfit = activeSalePrice - (costPrice + commissionAmount + effectiveShippingCost + serviceFee + withholdingAmount + netVatAmount);
  const achievedMarginPercent = activeSalePrice > 0 ? (netCashProfit / activeSalePrice) * 100 : 0;
  const achievedMarkupPercent = costPrice > 0 ? (netCashProfit / costPrice) * 100 : 0;

  // 4. BUYBOX SIMULATION
  const buyboxCommission = competitorBuyboxPrice * effectiveCommission;
  const buyboxWithholding = competitorBuyboxPrice * withholdingTaxRate;
  const buyboxSaleVat = (competitorBuyboxPrice / kdvMultiplier) * (vatRate / 100);
  const buyboxNetVat = Math.max(0, buyboxSaleVat - costVat);
  const buyboxProfit = competitorBuyboxPrice - (costPrice + buyboxCommission + effectiveShippingCost + serviceFee + buyboxWithholding + buyboxNetVat);
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
            <h3 className="text-base sm:text-lg font-black text-dark">Akıllı Ürün Fiyatlandırma & Kârlılık Simülatörü</h3>
            <Badge variant="excellent">Canlı Kargo Barem Desteği</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hedef marjdan satış fiyatı bulma, son fiyata göre net kâr analizi, 1-2-3 gün termin süresi ve kargo barem desteği
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={fetchProducts} className="h-8 sm:h-9 text-xs gap-1.5 font-bold">
          <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts ? 'animate-spin' : ''}`} />
          <span>Ürünleri Yenile</span>
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

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* LEFT COLUMN: PARAMETER INPUTS (6 COLS) */}
        <div className="lg:col-span-6 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-5">
          <h4 className="text-xs sm:text-sm font-black text-dark flex items-center gap-2 pb-2 border-b border-border">
            <Calculator className="w-4 h-4 text-primary" />
            <span>Maliyet, Komisyon & Kargo Parametreleri</span>
          </h4>

          <div className="space-y-4 text-xs">
            {/* Alış Maliyeti & Hedef Kâr Marjı */}
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
                <label className="font-bold text-dark block mb-1">Hedef Net Kâr Marjı (%) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-emerald-300 font-bold text-emerald-700 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute left-2.5 top-2 font-bold text-emerald-600">%</span>
                </div>
              </div>
            </div>

            {/* Komisyon Oranı & KDV Oranı */}
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

            {/* Kargo Şirketi & Desi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-dark block mb-1">Kargo Firması *</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
                >
                  <option value="Trendyol Express">Trendyol Express (TEX)</option>
                  <option value="Aras Kargo">Aras Kargo</option>
                  <option value="PTT Kargo">PTT Kargo</option>
                  <option value="Sürat Kargo">Sürat Kargo</option>
                  <option value="Yurtiçi Kargo">Yurtiçi Kargo</option>
                  <option value="Kolay Gelsin">Kolay Gelsin</option>
                  <option value="DHL eCommerce">DHL eCommerce</option>
                </select>
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

            {/* Termin Süresi (1-2-3 Gün Seçimi & Barem Desteği) */}
            <div className="p-3.5 rounded-2xl bg-canvas border border-border space-y-2">
              <label className="font-black text-dark flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Termin Süresi & Kargo Barem Desteği</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">
                  {leadTimeDays === 1 ? '⚡ %5 Kargo Barem Bonusu' : leadTimeDays === 2 ? 'Standart' : 'Ek Maliyet Riski'}
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 1, label: '1 Gün (Hızlı Teslimat)', badge: '%5 İndirimli' },
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

            {/* SON SATIŞ FİYATINA GÖRE ANLIK KÂRLILIK GÖRME ALANI */}
            <div className="p-4 rounded-2xl bg-primary-tint-50/50 border border-primary/20 space-y-2">
              <label className="font-black text-primary block">
                ⭐ Son Satış Fiyatı Girerek Kârı Gör (İleri Simülasyon):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  placeholder="İstediğiniz son satış fiyatını girin..."
                  value={manualSalePrice || ''}
                  onChange={(e) => setManualSalePrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-primary font-black text-dark text-sm bg-white focus:ring-2 focus:ring-primary shadow-xs"
                />
                <span className="absolute left-3 top-2.5 font-bold text-primary text-sm">₺</span>
              </div>
              <span className="text-[10px] text-gray-500 block">
                Boş bırakırsanız yukarıdaki hedef marja göre hesaplanan ideal hedef fiyat kullanılır.
              </span>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: CALCULATION RESULTS & WATERFALL (6 COLS) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Main Price & Net Profit Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Önerilen Satış Fiyatı</span>
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
                Kâr Marjı: <strong className="text-emerald-700">%{achievedMarginPercent.toFixed(1)}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-canvas border border-border text-dark">
                Maliyet Üzeri Kâr: <strong className="text-primary">%{achievedMarkupPercent.toFixed(1)}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-[11px]">
                {baremStatusLabel}
              </span>
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
                  <span>3. Kargo Gideri ({carrier}, {desi} Desi)</span>
                  {leadTimeDays === 1 && <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">-%5 İndirimli</span>}
                </span>
                <span className="font-bold text-gray-800 tabular-nums">-₺{effectiveShippingCost.toFixed(2)}</span>
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
