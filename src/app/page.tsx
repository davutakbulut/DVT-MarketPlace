"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Calculator,
  ArrowRight,
  Layers,
  FileCheck2,
  AlertOctagon,
  ChevronDown,
  CheckCircle2,
  Store,
  Compass,
  DollarSign,
  Package,
  Percent,
  Sparkles,
  Users,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VirtualTourModal } from '@/components/layout/VirtualTourModal';
import { formatCurrency } from '@/lib/formatters';

export default function LandingHomePage() {
  const [tourOpen, setTourOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  // Interactive Live Calculator Preview State
  const [calcCost, setCalcCost] = useState(100);
  const [calcMargin, setCalcMargin] = useState(25);
  const [calcCommission, setCalcCommission] = useState(18);

  // Quick reverse price approximation for the hero widget
  const commWithVat = (calcCommission * 1.20) / 100;
  const withholding = 0.01 / 1.20;
  const targetPrice = Math.round((calcCost + 45 + 13.19) / (1 - (commWithVat + withholding + calcMargin / 100)));
  const netProfit = Math.round(targetPrice * (calcMargin / 100));

  const faqs = [
    {
      q: "DVT-MarketPlace'i nasıl kullanmaya başlayabilirim?",
      a: "Ücretsiz kayıt olduktan veya giriş yaptıktan sonra Ayarlar menüsünden Trendyol ve Hepsiburada API anahtarlarınızı bağlayarak ürünlerinizi ve siparişlerinizi anında içeri aktarabilirsiniz. Ürün maliyetlerinizi girdikten sonra sistem tüm siparişlerinizin kârlılığını canlı olarak hesaplamaya başlar."
    },
    {
      q: "Kârlılık hesaplamalarında hangi giderler dikkate alınır?",
      a: "Sistem ürün alış maliyetiniz, pazaryeri kategori komisyonu (+%20 KDV), kargo desi taşıma ücreti, sabit hizmet bedeli, %1 stopaj tevkifatı ve devlete ödenecek Net KDV mahsubunu kuruşu kuruşuna düşerek gerçek net nakit kârınızı hesaplar."
    },
    {
      q: "Tersine Fiyatlandırma Motoru nasıl çalışır?",
      a: "Ürününüzün maliyetini ve hedeflediğiniz kâr marjını (Örn: %25) girdiğinizde; komisyon, stopaj ve vergileri hesaba katarak zarar etmeyeceğiniz en doğru pazaryeri liste satış fiyatını saniyeler içinde belirler."
    },
    {
      q: "Birden fazla mağaza ve kullanıcı yönetebilir miyim?",
      a: "Evet. Çok kiracılı (multi-tenant) mimarimiz sayesinde tek bir firma altında birden fazla Trendyol ve Hepsiburada mağazası açabilir, operatörlerinize dilediğiniz mağazaları atayabilir ve kâr görme yetkisini (can_view_profit) kısıtlayabilirsiniz."
    },
    {
      q: "Hakediş ve Kargo Desi Farkı Denetimi nedir?",
      a: "Pazaryerinin kestiği kargo fatura desisi ile ürününüzün gerçek depo desisi arasındaki farkları otomatik tarar ve fazla kesilen kargo tutarlarını zarar raporu olarak size sunar."
    }
  ];

  return (
    <div className="min-h-screen bg-canvas text-dark flex flex-col selection:bg-primary-tint-200 selection:text-primary">
      {/* Top Floating Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm shadow-xs">
              D
            </div>
            <span className="text-base font-black tracking-tight text-dark">
              DVT<span className="text-primary">MarketPlace</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-dark/80">
            <a href="#nasil-calisir" className="hover:text-primary transition-colors">Nasıl Çalışır?</a>
            <a href="#ozellikler" className="hover:text-primary transition-colors">Özellikler</a>
            <a href="#hesaplayici" className="hover:text-primary transition-colors">Kâr Simülatörü</a>
            <a href="#sss" className="hover:text-primary transition-colors">Sıkça Sorulanlar</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTourOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-dark hover:text-primary"
            >
              <Compass className="w-4 h-4 text-primary" />
              <span>Nasıl Yapılır?</span>
            </Button>

            <Link href="/login">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold px-4">
                Giriş Yap
              </Button>
            </Link>

            <Link href="/register">
              <Button size="sm" className="rounded-xl text-xs font-bold px-4 shadow-xs">
                Ücretsiz Başla
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-tint-100 border border-primary-tint-200 px-3.5 py-1 rounded-full text-xs font-bold text-primary animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Türkiye’nin En Hızlı Büyüyen Pazaryeri Satıcılarının Tercihi</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-dark leading-[1.15]">
            Her Siparişin Arkasındaki <br className="hidden sm:inline" />
            <span className="text-primary underline decoration-primary/30 decoration-wavy">Gerçek Net Kârı</span> Keşfedin!
          </h1>

          <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Komisyonlar, kargo baremleri, %1 stopaj ve KDV kesintileri kârlılığınızı fark ettirmeden eritmesin.
            DVT-MarketPlace ile mağazanızı kârlılık odaklı yönetin ve hedef marjınıza göre doğru fiyatlandırın.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 rounded-2xl text-sm font-bold gap-2 shadow-md w-full sm:w-auto">
                <span>30 Günlük Kârlılık Raporuna Ulaş</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 px-6 rounded-2xl text-sm font-bold w-full sm:w-auto bg-white">
                Admin Girişi Yap
              </Button>
            </Link>
          </div>
        </div>

        {/* INTERACTIVE HERO PREVIEW WIDGET */}
        <div id="hesaplayici" className="mt-12 bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-xl max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Canlı Fiyatlandırma & Kâr Simülatörü</span>
              <h3 className="text-base font-extrabold text-dark">Maliyetinizi Girin, Hedef Satış Fiyatınızı Anında Görün</h3>
            </div>
            <Badge variant="excellent" className="self-start sm:self-auto">Matematik Motoru v1.0</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
            <div className="md:col-span-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-dark block mb-1">Ürün Alış Maliyeti (KDV Dahil): ₺{calcCost}</label>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={calcCost}
                  onChange={(e) => setCalcCost(parseInt(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-dark block mb-1">Hedef Kâr Marjı: %{calcMargin}</label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={calcMargin}
                  onChange={(e) => setCalcMargin(parseInt(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-dark block mb-1">Pazaryeri Komisyonu: %{calcCommission}</label>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="0.5"
                  value={calcCommission}
                  onChange={(e) => setCalcCommission(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="md:col-span-6 bg-primary-tint-50/50 rounded-2xl p-5 border border-primary-tint-200 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Önerilen Satış Fiyatı</span>
                <div className="text-3xl sm:text-4xl font-black text-primary tabular-nums mt-0.5">
                  {formatCurrency(targetPrice)}
                </div>
                <div className="text-xs text-gray-600 mt-1 font-medium">
                  Net Nakit Kârınız: <strong className="text-emerald-600 font-extrabold">{formatCurrency(netProfit)}</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-primary-tint-200/80 text-[11px] space-y-1 text-gray-600">
                <div className="flex justify-between"><span>Kargo (1 Desi):</span><strong className="text-dark">₺45.00</strong></div>
                <div className="flex justify-between"><span>Pazaryeri Hizmet Bedeli:</span><strong className="text-dark">₺13.19</strong></div>
                <div className="flex justify-between"><span>%1 Stopaj & Net KDV:</span><strong className="text-dark">Dahil Edildi</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 STEPS ONBOARDING (MELONTİK NASIL ÇALIŞIR?) */}
      <section id="nasil-calisir" className="py-16 bg-white border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-2 max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">3 ADIMDA BAŞLAYIN</span>
            <h2 className="text-2xl sm:text-3xl font-black text-dark">DVT-MarketPlace Nasıl Çalışır?</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Mağazanızın tüm verilerini sizin için işler ve kârlılığınızı zahmetsizce yönetmenizi sağlar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-canvas p-6 rounded-3xl border border-border relative group hover:border-primary transition-all">
              <div className="w-10 h-10 rounded-2xl bg-primary text-white font-black text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="text-sm font-extrabold text-dark mb-2">Mağazanızı Bağlayın</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Trendyol veya Hepsiburada API bilgilerinizi 1 dakikada entegre edin ve canlı veri akışını hemen başlatın.
              </p>
            </div>

            <div className="bg-canvas p-6 rounded-3xl border border-border relative group hover:border-primary transition-all">
              <div className="w-10 h-10 rounded-2xl bg-primary text-white font-black text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="text-sm font-extrabold text-dark mb-2">Maliyetlerinizi Girin</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Ürün alış maliyetlerinizi Excel veya satır içi düzenleyici ile girin. Komisyon, kargo ve stopaj otomatik işlensin.
              </p>
            </div>

            <div className="bg-canvas p-6 rounded-3xl border border-border relative group hover:border-primary transition-all">
              <div className="w-10 h-10 rounded-2xl bg-primary text-white font-black text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="text-sm font-extrabold text-dark mb-2">Kârlılığınızı Canlı Yönetin</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Her siparişin net kârını anında görün, zarar eden ürünleri tespit edin ve hedef marjınıza göre fiyatınızı güncelleyin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="ozellikler" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-2 max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">GELİŞMİŞ MODÜLLER</span>
          <h2 className="text-2xl sm:text-3xl font-black text-dark">Pazaryerinde Satış Yapmanın En Akıllı Yolu</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-border space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-tint-100 text-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-dark">Mağazanızın Tamamı Tek Ekranda</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Ciro, brüt kâr, kargo gideri, komisyon kesintisi ve net kâr tek bir kâr hunisi grafiğinde.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-border space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-tint-100 text-primary flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-dark">Görmekle Kalmayın, Fiyatı Yönetin</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tersine matematiksel fiyat motoru ile hedef marjınıza göre satış fiyatını anında belirleyin.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-border space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-tint-100 text-primary flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-dark">Kampanyaya Girmeden Önce Kârını Görün</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Trendyol Plus ve baremli komisyon tarifelerinde kâr farkını önceden simüle edin.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-border space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-tint-100 text-primary flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-dark">Pazaryerinin Fazla Kestiği Para Sizde Kalsın</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Kargo desi aşımı zararlarını ve hakediş kesinti uyuşmazlıklarını otomatik olarak yakalayın.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-border space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-tint-100 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-dark">Çok Kiracılı RBAC & Kâr Maskeleme</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Personelinize mağaza atayın, isterseniz kâr ve maliyet rakamlarını veritabanı seviyesinde gizleyin.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-border space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-tint-100 text-primary flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-dark">Akıllı Uyarı & Anomali Tespit Merkezi</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Zararına yapılan satışlar, düşük marjlı siparişler ve eksik maliyetler için anlık alarmlar alın.
            </p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 bg-white border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-2 mb-10">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">KULLANICI DENEYİMLERİ</span>
            <h3 className="text-2xl font-black text-dark">Satıcılar DVT-MarketPlace İçin Ne Diyor?</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-canvas p-6 rounded-3xl border border-border space-y-3">
              <p className="text-xs text-gray-700 italic leading-relaxed">
                "DVT-MarketPlace’i kullanmaya başladıktan sonra pazaryerlerindeki fiyatlama ve kârlılık süreçlerimiz tamamen netleşti. Komisyonlar, kampanyalar ve indirimler kârlılığı fark edilmeden eritebiliyordu; bu sistem bu riski tamamen ortadan kaldırdı."
              </p>
              <div className="pt-2 border-t border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-tint-200 text-primary font-bold text-xs flex items-center justify-center">
                  EA
                </div>
                <div>
                  <span className="text-xs font-bold text-dark block">E-Ticaret Direktörü</span>
                  <span className="text-[11px] text-gray-500">Kozmetik & Kişisel Bakım Mağazası</span>
                </div>
              </div>
            </div>

            <div className="bg-canvas p-6 rounded-3xl border border-border space-y-3">
              <p className="text-xs text-gray-700 italic leading-relaxed">
                "E-ticarette en büyük sorun satış yapmak değil, yapılan satışın gerçekten kârlı olup olmadığını net şekilde görebilmektir. DVT-MarketPlace, komisyon, kargo, iade ve tüm maliyetleri tek yerde görünür kılarak karar alma sürecimizi inanılmaz sadeleştirdi."
              </p>
              <div className="pt-2 border-t border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-tint-200 text-primary font-bold text-xs flex items-center justify-center">
                  MK
                </div>
                <div>
                  <span className="text-xs font-bold text-dark block">Firma Kurucusu</span>
                  <span className="text-[11px] text-gray-500">Moda & Tekstil Markası</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="sss" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">DESTEK REHBERİ</span>
          <h3 className="text-2xl font-black text-dark">Sıkça Sorulan Sorular</h3>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              className="bg-white rounded-2xl border border-border p-4 cursor-pointer transition-all hover:border-primary/50"
            >
              <div className="flex justify-between items-center">
                <h5 className="text-xs sm:text-sm font-bold text-dark">{f.q}</h5>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${faqOpen === i ? 'rotate-180 text-primary' : ''}`} />
              </div>
              {faqOpen === i && (
                <p className="text-xs text-gray-600 mt-2.5 pt-2.5 border-t border-border leading-relaxed animate-in fade-in">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="bg-primary text-white py-12 px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h3 className="text-2xl sm:text-3xl font-black">Pazaryerinde Gerçek Kârlılığınızı Yönetmeye Hazır mısınız?</h3>
        <p className="text-xs sm:text-sm text-white/90 max-w-xl mx-auto">
          Hemen ücretsiz kaydolun, 1 dakikada mağazanızı bağlayın ve tüm finansal analizlerinize anında ulaşın.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/register">
            <Button size="lg" variant="secondary" className="h-11 px-8 rounded-xl text-xs font-bold bg-white text-primary hover:bg-canvas shadow-lg">
              Ücretsiz Hesabımı Aç
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-11 px-6 rounded-xl text-xs font-bold text-white border-white/40 hover:bg-white/10">
              Giriş Yap
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-border py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-dark">DVT-MarketPlace</span>
            <span>• © 2026 Tüm Hakları Saklıdır.</span>
          </div>
          <div className="flex gap-4 font-medium">
            <a href="#" className="hover:underline">Gizlilik Politikası</a>
            <a href="#" className="hover:underline">Kullanım Şartları</a>
            <a href="#" className="hover:underline">İletişim</a>
          </div>
        </div>
      </footer>

      <VirtualTourModal open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
}
