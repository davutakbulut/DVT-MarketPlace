"use client";
import React, { useState } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calculator, ArrowRight, Sparkles, Truck, ShieldCheck, CheckCircle2 } from "lucide-react";
import { calculateCargoBaremCost } from "@/packages/financial-engine/cargo-barem";

export default function ProductPricingPage() {
  const [cogs, setCogs] = useState(120);
  const [targetMargin, setTargetMargin] = useState(25);
  const [commissionRate, setCommissionRate] = useState(18);
  const [carrier, setCarrier] = useState('TEX');
  const [isFastDelivery, setIsFastDelivery] = useState(true);
  const [desi, setDesi] = useState(1);

  // Dynamic Barem Calculation based on preliminary sale price estimation
  const commFactor = (commissionRate * 1.20) / 100;
  const withholdingFactor = 0.01 / 1.20;
  const marginFactor = targetMargin / 100;

  // Approximate target price for barem lookup
  let preliminaryPrice = (cogs + 40 + 13.19) / (1 - (commFactor + withholdingFactor + marginFactor));
  let priceExVat = preliminaryPrice / 1.20;

  const cargoResult = calculateCargoBaremCost({
    packetAmountExVat: priceExVat,
    carrier,
    isFastDeliveryCompliant: isFastDelivery,
    customStandardPrice: 42.50,
  });

  const finalShippingFee = cargoResult.shippingFeeIncVat;
  const targetSalePrice = Math.round((cogs + finalShippingFee + 13.19) / (1 - (commFactor + withholdingFactor + marginFactor)));
  const netProfit = Math.round(targetSalePrice * marginFactor);
  const commAmount = Math.round(targetSalePrice * commFactor);
  const withholding = Math.round((targetSalePrice / 1.20) * 0.01);
  const netVat = Math.max(0, Math.round((targetSalePrice * 0.20/1.20) - (cogs * 0.20/1.20 + finalShippingFee * 0.20/1.20 + commAmount * 0.20/1.20)));

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-dark">Ürün Fiyatlandırma & Kargo Barem Motoru</h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground">
          Maliyet ve hedef kâr marjınızı girin; 10 Ağustos 2026 kargo barem desteği ve vergiler dahil doğru satış fiyatını belirleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Inputs Card */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-3xl border border-border space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-xs font-bold text-primary uppercase tracking-wide">Fiyatlama Parametreleri</span>
            <Badge variant="excellent">Tersine Motor v2.0</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-dark block mb-1">Ürün Alış Maliyeti (KDV Dahil ₺)</label>
              <input
                type="number"
                value={cogs}
                onChange={(e) => setCogs(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-dark block mb-1">Hedef Net Kâr Marjı (%)</label>
              <input
                type="number"
                value={targetMargin}
                onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

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
                <option value="TEX">TEX (Trendyol Express)</option>
                <option value="Aras">Aras Kargo</option>
                <option value="PTT">PTT Kargo</option>
                <option value="Sürat">Sürat Kargo</option>
                <option value="Kolay Gelsin">Kolay Gelsin</option>
                <option value="DHL eCommerce">DHL eCommerce</option>
                <option value="YK">Yurtiçi Kargo (YK)</option>
              </select>
            </div>
          </div>

          {/* Barem Support Toggle Switch */}
          <div className="bg-primary-tint-50/70 border border-primary-tint-200 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-dark">Hızlı Teslimat / 1 Gün Termin (Barem Desteği)</span>
              </div>
              <input
                type="checkbox"
                checked={isFastDelivery}
                onChange={(e) => setIsFastDelivery(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer rounded"
              />
            </div>
            <div className="text-[11px] text-gray-600 flex items-center justify-between pt-1 border-t border-primary-tint-200">
              <span>Uygulanan Kademe: <strong>{cargoResult.tierLabel}</strong></span>
              <span className="font-extrabold text-primary">Kargo: ₺{cargoResult.shippingFeeExVat} + KDV</span>
            </div>
            {cargoResult.baremSupportSaving > 0 && (
              <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Barem desteği sayesinde bu üründe sipariş başı ₺{cargoResult.baremSupportSaving} tasarruf ediyorsunuz!
              </div>
            )}
          </div>
        </div>

        {/* Right Output & Breakdown Card */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-3xl border border-primary-tint-200 bg-primary-tint-50/20 space-y-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-primary uppercase">Önerilen Satış Fiyatı</span>
              <Badge variant="excellent">Hedef %{targetMargin} Marj</Badge>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-primary tabular-nums mt-3">
              {formatCurrency(targetSalePrice)}
            </div>

            <div className="text-xs font-bold text-emerald-600 mt-1">
              Net Nakit Kârınız: {formatCurrency(netProfit)}
            </div>
          </div>

          <div className="pt-3 border-t border-border space-y-2 text-xs">
            <div className="flex justify-between text-gray-600"><span>Ürün Alış Maliyeti:</span><strong className="text-dark tabular-nums">₺{cogs.toFixed(2)}</strong></div>
            <div className="flex justify-between text-gray-600"><span>Kargo Maliyeti (Barem {cargoResult.appliedTier}):</span><strong className="text-primary tabular-nums">₺{finalShippingFee.toFixed(2)}</strong></div>
            <div className="flex justify-between text-gray-600"><span>Pazaryeri Komisyonu (%{commissionRate}):</span><strong className="text-dark tabular-nums">₺{commAmount.toFixed(2)}</strong></div>
            <div className="flex justify-between text-gray-600"><span>Hizmet Bedeli:</span><strong className="text-dark tabular-nums">₺13.19</strong></div>
            <div className="flex justify-between text-gray-600"><span>%1 Stopaj + Net KDV:</span><strong className="text-dark tabular-nums">₺{(withholding + netVat).toFixed(2)}</strong></div>
          </div>

          <Button onClick={() => toast.success("Hedef fiyat kopyalandı veya mağazaya gönderilebilir!")} className="w-full text-xs font-bold h-10 rounded-xl gap-2 shadow-xs">
            <span>Fiyatı Listeye Ekle</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
