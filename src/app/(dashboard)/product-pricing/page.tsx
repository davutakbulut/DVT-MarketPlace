"use client";
import React, { useState } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Calculator, ArrowRight, Sparkles, Truck, ShieldCheck, CheckCircle2, 
  Clock, AlertTriangle, TrendingUp, Layers, Check, RefreshCw, Copy, ArrowLeftRight
} from "lucide-react";
import { ReversePricingEngine } from "@/packages/financial-engine/reverse-pricing";
import { calculateCargoBaremCost, TRENDYOL_BAREM_RATES } from "@/packages/financial-engine/cargo-barem";
import { VatRate } from "@/packages/financial-engine/types";

export default function ProductPricingPage() {
  // Mode: 'target_margin' (Hedef Marjdan Fiyat Bul) vs 'direct_price' (Son Fiyattan Kâr Gör)
  const [calculationMode, setCalculationMode] = useState<'target_margin' | 'direct_price'>('target_margin');

  // Core Inputs
  const [cogs, setCogs] = useState<number>(120);
  const [targetMargin, setTargetMargin] = useState<number>(25);
  const [sellingPrice, setSellingPrice] = useState<number>(289.90);
  const [commissionRate, setCommissionRate] = useState<number>(18);
  const [carrier, setCarrier] = useState<string>('TEX');
  const [leadTimeDays, setLeadTimeDays] = useState<number>(1); // 1, 2, 3 gün
  const [serviceFee, setServiceFee] = useState<number>(13.19);
  const [desi, setDesi] = useState<number>(1);
  const [costVatRate, setCostVatRate] = useState<VatRate>(20);
  const [saleVatRate, setSaleVatRate] = useState<VatRate>(20);
  const [withholdingRate, setWithholdingRate] = useState<number>(1.0);

  // 1 Gün Termin = Avantajlı/Barem Destekli Fiyat, 2 veya 3 Gün = Standart/Desteksiz Fiyat
  const isFastDeliveryCompliant = leadTimeDays === 1;

  // -------------------------------------------------------------
  // CALCULATION LOGIC
  // -------------------------------------------------------------
  let calculatedSalePrice = 0;
  let netProfit = 0;
  let profitMargin = 0;
  let commissionAmount = 0;
  let shippingCost = 0;
  let baremLabel = '';
  let baremSaving = 0;
  let netVat = 0;
  let withholdingTax = 0;

  if (calculationMode === 'target_margin') {
    // Mode A: Reverse Pricing from Target Margin %
    try {
      const rev = ReversePricingEngine.calculate({
        cogs,
        costVatRate: 20 as VatRate,
        saleVatRate: 20 as VatRate,
        desi,
        carrier,
        isFastDeliveryCompliant,
        commissionRate,
        serviceFee,
        withholdingRate,
        targetMode: 'margin_percent',
        targetValue: targetMargin,
      });

      calculatedSalePrice = rev.targetSalePrice;
      netProfit = rev.netProfit;
      profitMargin = rev.profitMarginPercent;
      commissionAmount = rev.breakdown.commissionAmount;
      shippingCost = rev.breakdown.shippingFee;
      withholdingTax = rev.breakdown.withholdingTax;
      netVat = rev.breakdown.netVatPayable;

      const saleExVat = calculatedSalePrice / (1 + saleVatRate / 100);
      const bRes = calculateCargoBaremCost({
        packetAmountExVat: saleExVat,
        carrier,
        isFastDeliveryCompliant,
        customStandardPrice: 81.95,
      });
      baremLabel = bRes.tierLabel;
      baremSaving = bRes.baremSupportSaving;
    } catch (e) {
      calculatedSalePrice = 0;
    }
  } else {
    // Mode B: Direct Profit Calculation from Entered Selling Price
    calculatedSalePrice = sellingPrice;
    const saleExVat = calculatedSalePrice / (1 + saleVatRate / 100);
    const costExVat = cogs / (1 + costVatRate / 100);

    const bRes = calculateCargoBaremCost({
      packetAmountExVat: saleExVat,
      carrier,
      isFastDeliveryCompliant,
      customStandardPrice: 81.95,
    });
    shippingCost = bRes.shippingFeeIncVat;
    baremLabel = bRes.tierLabel;
    baremSaving = bRes.baremSupportSaving;

    commissionAmount = Math.round((calculatedSalePrice * (commissionRate / 100)) * 100) / 100;
    withholdingTax = Math.round((saleExVat * (withholdingRate / 100)) * 100) / 100;

    // Linearized VAT logic
    const saleVat = calculatedSalePrice - saleExVat;
    const costVat = cogs - costExVat;
    const commVat = (commissionAmount / 1.20) * 0.20;
    const shipVat = (shippingCost / 1.20) * 0.20;
    const srvVat = (serviceFee / 1.20) * 0.20;
    const calculatedNetVat = saleVat - costVat - commVat - shipVat - srvVat;
    netVat = calculatedNetVat > 0 ? Math.round(calculatedNetVat * 100) / 100 : 0;

    const totalDeductions = cogs + commissionAmount + shippingCost + serviceFee + withholdingTax + netVat;
    netProfit = Math.round((calculatedSalePrice - totalDeductions) * 100) / 100;
    profitMargin = calculatedSalePrice > 0 ? Math.round((netProfit / calculatedSalePrice) * 1000) / 10 : 0;
  }

  // Calculate Lead Time Cost Difference (1 gün vs 2-3 gün farkı)
  const saleExVatForDiff = (calculatedSalePrice || 200) / (1 + saleVatRate / 100);
  const fastBarem = calculateCargoBaremCost({ packetAmountExVat: saleExVatForDiff, carrier, isFastDeliveryCompliant: true });
  const slowBarem = calculateCargoBaremCost({ packetAmountExVat: saleExVatForDiff, carrier, isFastDeliveryCompliant: false });
  const leadTimeDifference = Math.max(0, Math.round((slowBarem.shippingFeeIncVat - fastBarem.shippingFeeIncVat) * 100) / 100);

  // -------------------------------------------------------------
  // CARRIER COMPARISON MATRIX (All 7 Carriers)
  // -------------------------------------------------------------
  const allCarriers = [
    { code: 'TEX', name: 'Trendyol Express (TEX)', isDefault: true },
    { code: 'Aras', name: 'Aras Kargo' },
    { code: 'PTT', name: 'PTT Kargo' },
    { code: 'Sürat', name: 'Sürat Kargo' },
    { code: 'Kolay Gelsin', name: 'Kolay Gelsin' },
    { code: 'DHL eCommerce', name: 'DHL eCommerce' },
    { code: 'YK', name: 'Yurtiçi Kargo (YK)' },
  ];

  const carrierComparison = allCarriers.map((c) => {
    const sEx = (calculatedSalePrice || 200) / (1 + saleVatRate / 100);
    const bRes = calculateCargoBaremCost({
      packetAmountExVat: sEx,
      carrier: c.code,
      isFastDeliveryCompliant,
      customStandardPrice: 81.95,
    });

    const cShipFee = bRes.shippingFeeIncVat;
    const cComm = Math.round(((calculatedSalePrice || 200) * (commissionRate / 100)) * 100) / 100;
    const cWithhold = Math.round((sEx * (withholdingRate / 100)) * 100) / 100;
    const cProfit = Math.round(((calculatedSalePrice || 200) - (cogs + cComm + cShipFee + serviceFee + cWithhold)) * 100) / 100;
    const cMargin = calculatedSalePrice > 0 ? Math.round((cProfit / calculatedSalePrice) * 1000) / 10 : 0;

    return {
      code: c.code,
      name: c.name,
      shippingFee: cShipFee,
      netProfit: cProfit,
      margin: cMargin,
      saving: bRes.baremSupportSaving,
      tier: bRes.tierLabel,
      isSelected: carrier === c.code,
    };
  });

  const bestCarrier = [...carrierComparison].sort((a, b) => b.netProfit - a.netProfit)[0];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Ürün Fiyatlandırma & Kargo Barem Simülatörü</h3>
            <Badge variant="excellent">Çift Yönlü Motor</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Termin süresinin kargo barem desteğine etkisi, tersine hedef fiyat veya son satış fiyatından kâr hesabı ve tüm kargoların karşılaştırması
          </p>
        </div>

        {/* Calculation Mode Switcher */}
        <div className="flex items-center bg-canvas p-1 rounded-2xl border border-border">
          <button
            onClick={() => setCalculationMode('target_margin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              calculationMode === 'target_margin'
                ? 'bg-primary text-white shadow-xs'
                : 'text-dark hover:bg-white'
            }`}
          >
            🎯 Hedef Marjdan Fiyat Bul
          </button>
          <button
            onClick={() => setCalculationMode('direct_price')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              calculationMode === 'direct_price'
                ? 'bg-primary text-white shadow-xs'
                : 'text-dark hover:bg-white'
            }`}
          >
            💰 Son Fiyattan Kâr Gör
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Left Inputs Card */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-3xl border border-border space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-xs font-bold text-primary uppercase tracking-wide">
              {calculationMode === 'target_margin' ? '1. Maliyet ve Hedef Kâr Parametreleri' : '1. Ürün Maliyeti ve Son Satış Fiyatı'}
            </span>
            <Badge variant="excellent">10 Ağustos 2026 Barem</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-dark block mb-1">Ürün Alış Maliyeti (KDV Dahil ₺)</label>
              <input
                type="number"
                step="1"
                value={cogs}
                onChange={(e) => setCogs(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {calculationMode === 'target_margin' ? (
              <div>
                <label className="text-xs font-bold text-primary block mb-1">İstenen Net Kâr Marjı (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-primary text-xs font-bold text-primary bg-primary-tint-50/20 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-primary block mb-1">Planlanan Satış Fiyatı (₺ KDV Dahil)</label>
                <input
                  type="number"
                  step="0.5"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-primary text-xs font-bold text-primary bg-primary-tint-50/20 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-dark block mb-1">Pazaryeri Komisyonu (%)</label>
              <input
                type="number"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-dark block mb-1">Kargo Firması</label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                {allCarriers.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lead Time (Termin Süresi) Selection & Barem Impact Box */}
          <div className="border border-border p-4 rounded-2xl bg-canvas space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-dark">Termin Süresi Seçimi & Barem Desteği</span>
              </div>
              <Badge variant={leadTimeDays === 1 ? "excellent" : "secondary"}>
                {leadTimeDays === 1 ? "⚡ Hızlı Teslimat (Avantajlı Fiyat)" : "Standart Termin (Desteksiz)"}
              </Badge>
            </div>

            {/* 1-2-3 Gün Termin Butonları */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { days: 1, label: '1 Gün Termin', sub: 'Hızlı Teslimat (Destekli)' },
                { days: 2, label: '2 Gün Termin', sub: 'Standart (Barem Desteği Yok)' },
                { days: 3, label: '3+ Gün Termin', sub: 'Standart (Barem Desteği Yok)' },
              ].map((t) => (
                <button
                  key={t.days}
                  type="button"
                  onClick={() => setLeadTimeDays(t.days)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    leadTimeDays === t.days
                      ? 'border-primary bg-primary-tint-100 text-primary font-black shadow-xs ring-1 ring-primary'
                      : 'border-border bg-white text-dark font-semibold hover:bg-canvas'
                  }`}
                >
                  <span className="block text-xs">{t.label}</span>
                  <span className="text-[10px] text-gray-500 font-normal block">{t.sub}</span>
                </button>
              ))}
            </div>

            {/* Termin Süresi Fark Analizi */}
            {leadTimeDays > 1 && leadTimeDifference > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Termin süresini <strong>1 Gün (Hızlı Teslimat)</strong> yaparsanız kargo maliyetiniz sipariş başı <strong>₺{leadTimeDifference}</strong> düşer ve kârınız artar!
                </span>
              </div>
            )}

            {leadTimeDays === 1 && baremSaving > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1 Gün Termin sayesinde bu üründe sipariş başı <strong>₺{baremSaving}</strong> kargo desteği sağlandı.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Output & Financial Breakdown Card */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-3xl border border-primary-tint-200 bg-primary-tint-50/20 space-y-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-primary uppercase">
                {calculationMode === 'target_margin' ? 'Tavsiye Edilen Satış Fiyatı' : 'Hesaplanan Finansal Sonuç'}
              </span>
              <Badge variant={netProfit > 0 ? "excellent" : "secondary"}>
                Marj: %{profitMargin}
              </Badge>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-primary tabular-nums mt-3">
              {formatCurrency(calculatedSalePrice)}
            </div>

            <div className={`text-xs font-bold mt-1.5 flex items-center gap-1.5 ${netProfit > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4" />
              <span>Net Nakit Kârınız: <strong>{formatCurrency(netProfit)}</strong></span>
            </div>
          </div>

          <div className="pt-3 border-t border-border space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Ürün Alış Maliyeti (COGS):</span>
              <strong className="text-dark tabular-nums">₺{cogs.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Kargo Maliyeti ({baremLabel}):</span>
              <strong className="text-primary tabular-nums">₺{shippingCost.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Pazaryeri Komisyonu (%{commissionRate}):</span>
              <strong className="text-dark tabular-nums">₺{commissionAmount.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Platform Hizmet Bedeli:</span>
              <strong className="text-dark tabular-nums">₺{serviceFee.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>%1 Stopaj + Net KDV:</span>
              <strong className="text-dark tabular-nums">₺{(withholdingTax + netVat).toFixed(2)}</strong>
            </div>
          </div>

          <Button 
            onClick={() => {
              navigator.clipboard.writeText(calculatedSalePrice.toFixed(2));
              toast.success(`₺${calculatedSalePrice.toFixed(2)} fiyatı panoya kopyalandı!`);
            }} 
            className="w-full text-xs font-bold h-10 rounded-xl gap-2 shadow-xs bg-primary hover:bg-primary-hover text-white"
          >
            <Copy className="w-4 h-4" />
            <span>Fiyatı Panoya Kopyala</span>
          </Button>
        </div>
      </div>

      {/* Carrier Comparison Table (7 Kargo Firması Kıyaslama Matrisi) */}
      <div className="bg-white rounded-3xl border border-border p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-dark flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Tüm Kargo Firmalarında Kâr & Maliyet Karşılaştırması
            </h4>
            <p className="text-[11px] text-gray-500">
              Aynı ürün için {leadTimeDays} Gün Termin ile 7 kargo firmasının barem fiyatları ve net kâr kıyası
            </p>
          </div>

          {bestCarrier && (
            <Badge variant="excellent" className="self-start sm:self-auto">
              🏆 En Kârlı Kargo: {bestCarrier.name} (Net Kâr: ₺{bestCarrier.netProfit})
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-2.5 px-3 table-sticky-first-col">Kargo Firması</th>
                <th className="pb-2.5 px-3">Uygulanan Kademe</th>
                <th className="pb-2.5 px-3 text-primary font-bold">Kargo Maliyeti (KDV Dahil)</th>
                <th className="pb-2.5 px-3 text-emerald-700 font-bold">Net Kâr (₺)</th>
                <th className="pb-2.5 px-3 font-bold">Kâr Marjı (%)</th>
                <th className="pb-2.5 px-3 text-right">Seçim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {carrierComparison.map((c) => {
                const isBest = c.code === bestCarrier?.code;

                return (
                  <tr 
                    key={c.code} 
                    className={`transition-colors ${
                      c.isSelected ? 'bg-primary-tint-50/50 font-bold' : 'hover:bg-canvas/50'
                    }`}
                  >
                    <td className="py-2.5 px-3 table-sticky-first-col font-bold text-dark flex items-center gap-2">
                      <span>{c.name}</span>
                      {isBest && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded-full">
                          En Kârlı
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{c.tier}</td>
                    <td className="py-2.5 px-3 font-black text-primary tabular-nums">
                      ₺{c.shippingFee.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-black text-emerald-700 tabular-nums">
                      ₺{c.netProfit.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-dark tabular-nums">
                      %{c.margin}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        size="sm"
                        variant={c.isSelected ? "default" : "outline"}
                        onClick={() => {
                          setCarrier(c.code);
                          toast.success(`${c.name} aktif kargo olarak seçildi.`);
                        }}
                        className="h-7 text-[11px] font-bold px-2.5"
                      >
                        {c.isSelected ? 'Seçili' : 'Seç'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
