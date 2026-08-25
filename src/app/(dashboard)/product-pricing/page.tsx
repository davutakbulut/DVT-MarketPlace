"use client";
import React, { useState } from "react";
import { ReversePricingEngine } from "@/packages/financial-engine/reverse-pricing";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Calculator, Sparkles, Truck, Tag, Percent, Info, ArrowRight } from "lucide-react";

export default function ProductPricingPage() {
  const [cogs, setCogs] = useState(120);
  const [targetMargin, setTargetMargin] = useState(25);
  const [commissionRate, setCommissionRate] = useState(18.5);
  const [desi, setDesi] = useState(1);
  const [shippingFee, setShippingFee] = useState(45.00);
  const [serviceFee, setServiceFee] = useState(8.49);
  const [deliveryType, setDeliveryType] = useState<"standard" | "fast" | "today">("standard");

  const calculation = ReversePricingEngine.calculate({
    cogs,
    costVatRate: 20,
    saleVatRate: 20,
    desi,
    shippingFee,
    commissionRate,
    serviceFee,
    withholdingRate: 1.0,
    targetMode: "margin_percent",
    targetValue: targetMargin,
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h3 className="text-lg font-bold text-dark">Ürün Satış Fiyatı Hesaplama (Tersine Fiyat Motoru)</h3>
        <p className="text-xs text-muted-foreground">Ürün maliyeti ve hedef kâr marjınızdan yola çıkarak optimum pazaryeri satış fiyatını belirleyin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-border space-y-4">
          <div>
            <label className="text-xs font-bold text-dark block mb-1">Ürün Alış / Üretim Maliyeti (KDV Dahil)</label>
            <div className="relative">
              <input
                type="number"
                value={cogs}
                onChange={(e) => setCogs(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border font-bold text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary pl-8 tabular-nums"
              />
              <span className="absolute left-3 top-3 text-xs font-bold text-gray-400">₺</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-dark block mb-1">Hedef Kâr Marjı (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border font-bold text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary pl-8 tabular-nums"
                />
                <span className="absolute left-3 top-3 text-xs font-bold text-gray-400">%</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-dark block mb-1">Kategori Komisyonu (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border font-bold text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary pl-8 tabular-nums"
                />
                <span className="absolute left-3 top-3 text-xs font-bold text-gray-400">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-dark block mb-1.5">Teslimat Tipi</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "standard", label: "Standart" },
                { id: "fast", label: "Hızlı Teslimat" },
                { id: "today", label: "Bugün Kargoda" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDeliveryType(t.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    deliveryType === t.id
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-canvas text-dark border-border hover:bg-border/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-dark block mb-1">Kargo Desi</label>
              <input
                type="number"
                value={desi}
                onChange={(e) => {
                  const d = parseFloat(e.target.value) || 1;
                  setDesi(d);
                  setShippingFee(d <= 1 ? 45 : d <= 2 ? 52 : 65);
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-border font-semibold text-xs text-dark focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-dark block mb-1">Kargo Taşıma Bedeli (₺)</label>
              <input
                type="number"
                value={shippingFee}
                onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-border font-semibold text-xs text-dark focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-primary-tint-200 bg-primary-tint-50/20 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-extrabold text-xs tracking-wider uppercase mb-1">
              <Sparkles className="w-4 h-4" /> Önerilen Satış Fiyatı
            </div>
            <div className="text-4xl font-black text-primary tabular-nums">
              {formatCurrency(calculation.targetSalePrice)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Bu fiyattan sattığınızda hedeflenen %{targetMargin} kâr marjı garanti edilir.</p>

            <div className="mt-6 space-y-2.5 pt-4 border-t border-border/80 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Net Nakit Kârınız:</span>
                <span className="font-extrabold text-emerald-600 tabular-nums">{formatCurrency(calculation.netProfit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pazaryeri Komisyonu (+KDV):</span>
                <span className="font-bold text-dark tabular-nums">{formatCurrency(calculation.breakdown.commissionAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Kargo Taşıma Bedeli:</span>
                <span className="font-bold text-dark tabular-nums">{formatCurrency(calculation.breakdown.shippingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pazaryeri Hizmet Bedeli:</span>
                <span className="font-bold text-dark tabular-nums">{formatCurrency(calculation.breakdown.serviceFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">%1 Stopaj Kesintisi:</span>
                <span className="font-bold text-dark tabular-nums">{formatCurrency(calculation.breakdown.withholdingTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Devlete Ödenecek Net KDV:</span>
                <span className="font-bold text-dark tabular-nums">{formatCurrency(calculation.breakdown.netVatPayable)}</span>
              </div>
            </div>
          </div>

          <Button className="w-full gap-2 rounded-2xl h-11 text-sm font-bold">
            <span>Pazaryerine Yeni Fiyat Gönder</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
