"use client";
import React, { useState } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Calculator, TrendingUp, DollarSign, Truck, ShieldCheck, 
  HelpCircle, RefreshCw, Send, CheckCircle2, AlertTriangle, 
  Clock, ArrowRight, Zap, Target
} from "lucide-react";

export default function ProductPricingPage() {
  // Input State
  const [costPrice, setCostPrice] = useState<number>(100);
  const [targetMargin, setTargetMargin] = useState<number>(20);
  const [commissionRate, setCommissionRate] = useState<number>(15);
  const [vatRate, setVatRate] = useState<number>(20);
  const [desi, setDesi] = useState<number>(2);
  const [carrier, setCarrier] = useState<string>("Trendyol Express");
  const [leadTimeDays, setLeadTimeDays] = useState<number>(1); // 1, 2, 3 days
  const [manualSalePrice, setManualSalePrice] = useState<number>(0);
  const [competitorBuyboxPrice, setCompetitorBuyboxPrice] = useState<number>(189.90);
  const [syncingPrice, setSyncingPrice] = useState(false);

  // Shipping Desi Rates Matrix
  const carrierRates: Record<string, { base: number; perDesi: number }> = {
    "Trendyol Express": { base: 36.50, perDesi: 4.20 },
    "Aras Kargo": { base: 42.00, perDesi: 4.80 },
    "MNG Kargo": { base: 41.50, perDesi: 4.70 },
    "Yurtiçi Kargo": { base: 45.00, perDesi: 5.10 },
    "Sürat Kargo": { base: 39.00, perDesi: 4.40 },
    "PTT Kargo": { base: 34.00, perDesi: 3.90 },
    "HepsiJET": { base: 37.00, perDesi: 4.30 },
  };

  // Compute Base Shipping
  const currentCarrierRate = carrierRates[carrier] || carrierRates["Trendyol Express"];
  const calculatedShippingCost = currentCarrierRate.base + (Math.max(1, desi) - 1) * currentCarrierRate.perDesi;

  // Lead Time Discount / Penalty on Shipping (1 day termin gets 5% bonus support)
  const leadTimeFactor = leadTimeDays === 1 ? 0.95 : leadTimeDays === 2 ? 1.0 : 1.05;
  const effectiveShippingCost = calculatedShippingCost * leadTimeFactor;

  // Fixed Service Fee (₺13.19 KDV Dahil)
  const serviceFee = 13.19;

  // 1. REVERSE PRICING CALCULATION (Cost + Target Margin -> Selling Price)
  const effectiveMargin = targetMargin / 100;
  const effectiveCommission = commissionRate / 100;
  const withholdingTaxRate = 0.01; // %1 Stopaj

  // Formula: SalePrice * (1 - Commission - Withholding - Margin) = Cost + EffectiveShipping + ServiceFee
  const denominator = 1 - effectiveCommission - withholdingTaxRate - effectiveMargin;
  const calculatedTargetPrice = denominator > 0 
    ? (costPrice + effectiveShippingCost + serviceFee) / denominator 
    : costPrice * 1.5;

  // 2. FORWARD PROFIT CALCULATION (Sale Price -> Profit & Margin)
  const activeSalePrice = manualSalePrice > 0 ? manualSalePrice : calculatedTargetPrice;

  // Commission Amount
  const commissionAmount = activeSalePrice * effectiveCommission;

  // Stopaj (%1)
  const withholdingAmount = activeSalePrice * withholdingTaxRate;

  // KDV Doğrusallaştırma
  const kdvMultiplier = 1 + (vatRate / 100);
  const netVatAmount = (activeSalePrice / kdvMultiplier) * (vatRate / 100) - (costPrice / kdvMultiplier) * (vatRate / 100);

  // Net Cash Profit
  const netCashProfit = activeSalePrice - (costPrice + commissionAmount + effectiveShippingCost + serviceFee + withholdingAmount + Math.max(0, netVatAmount));
  const achievedMarginPercent = activeSalePrice > 0 ? (netCashProfit / activeSalePrice) * 100 : 0;
  const achievedMarkupPercent = costPrice > 0 ? (netCashProfit / costPrice) * 100 : 0;

  // 3. BUYBOX ANALYSIS
  const buyboxCommission = competitorBuyboxPrice * effectiveCommission;
  const buyboxWithholding = competitorBuyboxPrice * withholdingTaxRate;
  const buyboxProfit = competitorBuyboxPrice - (costPrice + buyboxCommission + effectiveShippingCost + serviceFee + buyboxWithholding + Math.max(0, netVatAmount));
  const buyboxMargin = (buyboxProfit / competitorBuyboxPrice) * 100;

  const handlePushPriceToTrendyol = async () => {
    setSyncingPrice(true);
    try {
      // Send price to live integration endpoint
      const res = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          marketplace: 'trendyol',
          action: 'update_price',
          price: activeSalePrice
        }),
      });
      toast.success(`Satış Fiyatı (₺${activeSalePrice.toFixed(2)}) Trendyol mağazanıza başarıyla iletildi!`);
    } catch (e) {
      toast.error("Pazaryerine fiyat iletilemedi.");
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
            <h3 className="text-base sm:text-lg font-black text-dark">Çift Yönlü Ürün Fiyatlandırma & Kâr Simülatörü</h3>
            <Badge variant="excellent">Termin Barem Destekli</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hedef marjdan tersine satış fiyatı bulun veya son satış fiyatınızı girerek net kâr, KDV ve komisyonları anında görün
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={handlePushPriceToTrendyol}
            disabled={syncingPrice}
            className="text-xs h-8 sm:h-9 gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary-hover text-white"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{syncingPrice ? "Gönderiliyor..." : "Trendyol'a Fiyatı Gönder"}</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Left Inputs Panel (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
          <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2 pb-2 border-b border-border">
            <Calculator className="w-4 h-4 text-primary" />
            Maliyet, Marj & Operasyonel Parametreler
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Alış Maliyeti */}
            <div>
              <label className="text-xs font-bold text-dark block mb-1">Ürün Alış Maliyeti (₺ KDV Dahil) *</label>
              <input
                type="number"
                step="1"
                value={costPrice || ''}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Hedef Net Kâr Marjı */}
            <div>
              <label className="text-xs font-bold text-dark block mb-1">Hedef Net Kâr Marjı (%) *</label>
              <input
                type="number"
                step="0.5"
                value={targetMargin || ''}
                onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-primary text-xs font-bold text-primary focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Komisyon Oranı */}
            <div>
              <label className="text-xs font-bold text-dark block mb-1">Pazaryeri Komisyon Oranı (%) *</label>
              <input
                type="number"
                step="0.5"
                value={commissionRate || ''}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* KDV Oranı */}
            <div>
              <label className="text-xs font-bold text-dark block mb-1">KDV Oranı (%)</label>
              <select
                value={vatRate}
                onChange={(e) => setVatRate(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
              >
                <option value={20}>%20 Standart KDV</option>
                <option value={10}>%10 İndirimli KDV</option>
                <option value={1}>%1 Temel Gıda / Tıbbi</option>
              </select>
            </div>

            {/* Kargo Firması */}
            <div>
              <label className="text-xs font-bold text-dark block mb-1">Kargo Firması</label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
              >
                {Object.keys(carrierRates).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Desi */}
            <div>
              <label className="text-xs font-bold text-dark block mb-1">Paket Desisi</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="500"
                value={desi || ''}
                onChange={(e) => setDesi(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Termin Süresi (1-2-3 Gün) */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-dark block mb-1.5">
                Kargoya Teslim Termin Süresi (Barem Destek Çarpanı)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 1, label: '⚡ 1 Gün (Hızlı Gönderi)', bonus: '%5 Barem Desteği Avantajı' },
                  { days: 2, label: '📦 2 Gün (Standart)', bonus: 'Standart Barem' },
                  { days: 3, label: '⏳ 3 Gün (Gecikmeli)', bonus: '%5 Ek Kesinti Riski' },
                ].map((t) => (
                  <button
                    key={t.days}
                    type="button"
                    onClick={() => setLeadTimeDays(t.days)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      leadTimeDays === t.days
                        ? 'border-primary bg-primary-tint-100/50 shadow-xs'
                        : 'border-border bg-canvas text-gray-600 hover:bg-white'
                    }`}
                  >
                    <span className="font-bold text-xs block text-dark">{t.label}</span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">{t.bonus}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Manuel Son Fiyat Girişi (İsteğe Bağlı) */}
            <div className="sm:col-span-2 pt-2 border-t border-border">
              <label className="text-xs font-bold text-dark block mb-1">
                Veya Son Satış Fiyatı Girerek Kârı Gör (Opsiyonel)
              </label>
              <input
                type="number"
                step="1"
                placeholder={`Hesaplanan hedef: ₺${calculatedTargetPrice.toFixed(2)}`}
                value={manualSalePrice || ''}
                onChange={(e) => setManualSalePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold font-mono focus:ring-2 focus:ring-primary"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Fiyat girerseniz hedef marj yerine bu fiyattan elde edeceğiniz net nakit kâr hesaplanır.
              </span>
            </div>

          </div>
        </div>

        {/* Right Results & Financial Breakdown Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Main Price Card */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">
              {manualSalePrice > 0 ? 'Girilen Satış Fiyatı' : 'Önerilen Hedef Satış Fiyatı'}
            </span>
            <div className="text-3xl sm:text-4xl font-black text-primary tabular-nums">
              ₺{activeSalePrice.toFixed(2)}
            </div>

            {/* Net Profit & Margin Badges */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Net Nakit Kâr</span>
                <span className="text-lg font-black text-emerald-700 tabular-nums block mt-0.5">
                  ₺{netCashProfit.toFixed(2)}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-canvas border border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">Net Kâr Marjı</span>
                <span className="text-lg font-black text-dark tabular-nums block mt-0.5">
                  %{achievedMarginPercent.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Financial Deduction Breakdown */}
            <div className="space-y-2 text-xs pt-2 border-t border-border/80">
              <div className="flex justify-between text-gray-600">
                <span>Ürün Alış Maliyeti (COGS)</span>
                <span className="font-bold text-red-700 tabular-nums">-₺{costPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Pazaryeri Komisyonu (%{commissionRate})</span>
                <span className="font-bold text-amber-700 tabular-nums">-₺{commissionAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Kargo Bedeli ({desi} Desi • {carrier})</span>
                <span className="font-bold text-sky-700 tabular-nums">-₺{effectiveShippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Platform Hizmet Bedeli</span>
                <span className="font-bold text-gray-700 tabular-nums">-₺{serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>%1 E-Ticaret Stopajı</span>
                <span className="font-bold text-gray-700 tabular-nums">-₺{withholdingAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Ödenecek Net KDV Farkı</span>
                <span className="font-bold text-gray-700 tabular-nums">-₺{Math.max(0, netVatAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Buybox & Competitor Simulation Card */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h5 className="text-xs font-bold text-dark flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                Buybox & Rakip Fiyat Kıyaslayıcı
              </h5>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                placeholder="Rakip Fiyatı (₺)"
                value={competitorBuyboxPrice || ''}
                onChange={(e) => setCompetitorBuyboxPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-canvas border border-border flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold">Buybox Fiyatındaki Kârınız</span>
                <span className={`font-black text-sm tabular-nums ${buyboxProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  ₺{buyboxProfit.toFixed(2)} (%{buyboxMargin.toFixed(1)})
                </span>
              </div>
              <Badge variant={buyboxProfit >= 0 ? 'excellent' : 'secondary'}>
                {buyboxProfit >= 0 ? 'Kârlı Fiyat' : 'Zararına Satış'}
              </Badge>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
