"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, CheckCircle2, ChevronRight, ChevronLeft, 
  HelpCircle, Compass, LayoutDashboard, Activity, Calculator, 
  Truck, FileSpreadsheet, ShieldCheck, Megaphone, Receipt
} from "lucide-react";

export function InteractiveTourGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "1. Finansal Dashboard & Gelir-Gider Şelalesi",
      icon: LayoutDashboard,
      desc: "Anasayfada gerçek sipariş cirolarınız, net kârınız, komisyon ve kargo giderlerinizin şelale dökümünü anlık izleyin.",
      link: "/dashboard"
    },
    {
      title: "2. Canlı Analiz & Satır İçi Maliyet Düzenleme",
      icon: Activity,
      desc: "Bugün gelen siparişleri canlı olarak takip edin, alış maliyeti eksik ürünlerin maliyetini satır içinde anında girip kaydedin.",
      link: "/live-analysis"
    },
    {
      title: "3. Satış Tutarı Bazlı Ürün Fiyatlandırma Motoru",
      icon: Calculator,
      desc: "Hedef kâr marjınızı (%25 vb.) girin; komisyon, 10 Ağustos barem kargo bedeli, KDV ve %1 stopajı otomatik hesaplayıp hedef satış fiyatınızı bulun.",
      link: "/product-pricing"
    },
    {
      title: "4. 501 Desi Kargo Fiyat Matrisi (0-500 Desi)",
      icon: Truck,
      desc: "10 kargo partnerinin 501 kademe fiyatını tek ekranda inceleyin, Excel olarak indirin veya düzenleyip geri yükleyin.",
      link: "/tariffs/desi"
    },
    {
      title: "5. Hakediş & Desi Aşım Denetimi (İtiraz Motoru)",
      icon: Receipt,
      desc: "Kargo faturalarındaki desi aşımlarını tespit edin, fazla kesintilere tek tıkla resmi itiraz dilekçesi kopyalayarak paranızı geri alın.",
      link: "/settlement-desi-audit"
    },
    {
      title: "6. Reklamlarım & ROAS / TACoS Dağıtım Motoru",
      icon: Megaphone,
      desc: "Trendyol reklam faturalarınızı kaydedin; sipariş başına düşen reklam payını (₺ ve %) otomatik hesaplayıp kârınıza yansıtın.",
      link: "/marketing/ads"
    },
    {
      title: "7. Kapsamlı 6 Finansal Rapor & Excel İndirme",
      icon: FileSpreadsheet,
      desc: "Sipariş, ürün, kategori, iade ve pazaryeri bazlı detaylı raporlarınızı inceleyin ve tek tıkla Türkçe Excel olarak dışa aktarın.",
      link: "/reports/order-profitability"
    },
    {
      title: "8. Çok Kiracılı Kullanıcı Yönetimi & Kâr Maskeleme (RBAC)",
      icon: ShieldCheck,
      desc: "Ekip üyelerinize özel roller atayın, operatörlerin maliyet ve net kâr oranlarını görmesini tek tıkla maskeleyin.",
      link: "/settings"
    },
  ];

  const current = steps[currentStep];
  const Icon = current.icon;

  return (
    <>
      {/* Trigger Button in Header/Layout */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-tint-50 text-primary hover:bg-primary-tint-100 transition-all text-xs font-bold border border-primary-tint-200 shadow-2xs"
        title="8 Adımlı İnteraktif Sanal Rehber"
      >
        <Compass className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Nasıl Yapılır? (Rehber)</span>
      </button>

      {/* Interactive Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-dark/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-border shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-dark">DVT-MarketPlace Sanal Tur Rehberi</h4>
                  <span className="text-[11px] text-gray-500">Adım {currentStep + 1} / {steps.length}</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-dark font-bold">✕</button>
            </div>

            {/* Step Content */}
            <div className="bg-canvas p-5 rounded-2xl border border-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-border flex items-center justify-center text-primary shadow-xs">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-dark">{current.title}</h5>
                  <Badge variant="excellent" className="mt-0.5">Tur Modülü</Badge>
                </div>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed pt-1">
                {current.desc}
              </p>

              <div className="pt-2">
                <a href={current.link} onClick={() => setIsOpen(false)}>
                  <Button size="sm" variant="outline" className="text-xs font-bold gap-1 bg-white hover:bg-primary hover:text-white transition-all">
                    <span>İlgili Sayfayı Aç</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Step Indicators & Pagination Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      currentStep === i ? "bg-primary w-6" : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep((p) => p - 1)}
                  className="text-xs font-bold gap-1 h-8"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Geri</span>
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentStep((p) => p + 1)}
                    className="text-xs font-bold gap-1 h-8 shadow-xs"
                  >
                    <span>İleri</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-bold gap-1 h-8 bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Turu Tamamla</span>
                  </Button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
