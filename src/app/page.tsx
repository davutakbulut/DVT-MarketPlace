"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Gift,
  Sparkle,
  Lock,
  CheckCheck,
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
  User,
  LayoutDashboard,
  Play,
  Pause,
  RotateCcw,
  Truck,
  Check,
  ChevronRight,
  BarChart3,
  Flame,
  Clock,
  Eye,
  Sliders,
  Activity,
  Award,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandLogo } from '@/components/common/BrandLogo';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

export default function LandingHomePage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userSession, setUserSession] = useState<{ name: string; email: string; role: string } | null>(null);

  // Fetch active user session
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUserSession(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Lock body & html scroll completely when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen]);

  // 1. CINEMATIC FRAME-TO-FRAME SIMULATOR STATE
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const cinematicFrames = [
    {
      id: 0,
      title: "1. Adım: Canlı Sipariş Akışı",
      subtitle: "Trendyol mağazanızdan anlık sipariş düştü",
      orderNo: "#11538090393",
      productName: "Genject 3 Parça 5ml Enjektör (100 Adet)",
      grossPrice: 389.90,
      status: "Sipariş Alındı",
      statusColor: "bg-blue-100 text-blue-800",
      details: "Müşteri İstanbul / Kadıköy adresinden ₺389.90 tutarında sipariş oluşturdu.",
      kpis: { ciro: "₺389.90", maliyet: "₺145.00", kargo: "Hesaplanıyor...", netKar: "Bekleniyor..." }
    },
    {
      id: 1,
      title: "2. Adım: 10 Ağustos 2026 Kargo Barem Desteği",
      subtitle: "Termin süresi & kargo desi matrisi otomatik eşleşti",
      orderNo: "#11538090393",
      productName: "Genject 3 Parça 5ml Enjektör (100 Adet)",
      grossPrice: 389.90,
      status: "1 Gün Termin Avantajı",
      statusColor: "bg-sky-100 text-sky-800",
      details: "Sipariş 200-350 TL aralığında ve 1 gün hızlı terminli olduğu için Trendyol Express ₺70.41 + KDV baremi uygulandı.",
      kpis: { ciro: "₺389.90", maliyet: "₺145.00", kargo: "₺84.49 (KDV Dahil)", netKar: "Hesaplanıyor..." }
    },
    {
      id: 2,
      title: "3. Adım: Komisyon, KDV & Stopaj Kesintileri",
      subtitle: "Pazaryeri komisyonu, tevkifat ve hizmet bedeli düşüldü",
      orderNo: "#11538090393",
      productName: "Genject 3 Parça 5ml Enjektör (100 Adet)",
      grossPrice: 389.90,
      status: "Gider Şelalesi Uygulandı",
      statusColor: "bg-amber-100 text-amber-800",
      details: "%16.15 Medikal Komisyonu (₺62.97) + %1 Stopaj (₺3.25) + Platform Hizmet Bedeli (₺13.19) ayrıştırıldı.",
      kpis: { ciro: "₺389.90", kesintiler: "₺163.90", maliyet: "₺145.00", netKar: "₺81.00" }
    },
    {
      id: 3,
      title: "4. Adım: Kuruşu Kuruşuna Gerçek Net Nakit Kâr",
      subtitle: "Net Nakit Kâr cebinize girmeden önce tam doğrulandı",
      orderNo: "#11538090393",
      productName: "Genject 3 Parça 5ml Enjektör (100 Adet)",
      grossPrice: 389.90,
      status: "Kusursuz Net Kâr: +₺81.00 (%20.8 Marj)",
      statusColor: "bg-emerald-100 text-emerald-800",
      details: "Banka hesabınıza geçecek net para ₺226.00, ürün maliyetiniz ₺145.00 düşüldüğünde cebinize kalan net nakit kâr ₺81.00!",
      kpis: { ciro: "₺389.90", toplamGider: "₺308.90", netKar: "+₺81.00", marj: "%20.8" }
    }
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % cinematicFrames.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, cinematicFrames.length]);

  // 2. INTERACTIVE LIVE REVERSE CALCULATOR STATE
  const [calcCost, setCalcCost] = useState(120);
  const [calcTargetMargin, setCalcTargetMargin] = useState(25);
  const [calcCommission, setCalcCommission] = useState(16.15);
  const [calcTermin, setCalcTermin] = useState<1 | 2>(1);

  // Exact 10 August 2026 shipping barem logic for interactive widget
  const getSimShipping = (price: number, termin: number) => {
    if (price < 200) return termin === 1 ? 38.74 * 1.20 : 73.33 * 1.20;
    if (price <= 350) return termin === 1 ? 70.41 * 1.20 : 78.74 * 1.20;
    return 89.50; // Desi rate
  };

  const simShipping = getSimShipping(300, calcTermin);
  const commWithVat = (calcCommission * 1.20) / 100;
  const withholding = 0.01 / 1.20;
  const targetPrice = Math.max(1, Math.round((calcCost + simShipping + 13.19) / (1 - (commWithVat + withholding + calcTargetMargin / 100))));
  const calculatedProfit = Math.round(targetPrice * (calcTargetMargin / 100));

  const faqs = [
    {
      q: "DVT-MarketPlace ile diğer muhasebe programları arasındaki fark nedir?",
      a: "Geleneksel muhasebe yazılımları sadece ciro ve faturaya bakar; pazaryerlerinin 10 Ağustos 2026 güncel kargo baremlerini, 1 günlük hızlı termin desteklerini, Plus komisyon kademelerini ve kargonun fazla kestiği desi farklarını hesaplayamaz. DVT-MarketPlace her siparişi kuruşu kuruşuna denetler."
    },
    {
      q: "10 Ağustos 2026 Resmi Trendyol Kargo Barem Desteği nasıl hesaplanıyor?",
      a: "Sistem, siparişin tutarına (0-200 TL, 200-350 TL ve 350 TL+) ve mağazanızın kargoya verme süresine (1 gün hızlı teslimat vs 2+ gün standart) bakar. Avantajlı barem desteğini ve KDV'yi kuruşu kuruşuna uygulayarak gerçek kargo maliyetini çıkarır."
    },
    {
      q: "Tersine Hedef Kâr Fiyatlandırma Motoru nasıl çalışır?",
      a: "Satmak istediğiniz ürünün alış maliyetini ve hedeflediğiniz kâr marjını (Örn: %25) yazarsınız. Algoritma pazaryeri komisyonu, stopaj, kargo ve KDV'yi ekleyerek zarar etmeyeceğiniz en kârlı liste satış fiyatını anında üretir."
    },
    {
      q: "Kargo Desi Aşımı ve Hakediş Denetimi nedir?",
      a: "Kargo firmasının faturada kestiği desi (Örn: 3 Desi) ile ürünün gerçek desi ölçümü (Örn: 1 Desi) arasındaki farkları 7/24 otomatik tarar ve hakediş kesintisi itiraz raporunu tek tıkla oluşturur."
    },
    {
      q: "Bildirim sistemi arka planda nasıl otomatik çalışıyor?",
      a: "Geliştirdiğimiz Otomasyon Motoru 7/24 arka planda çalışarak zararına siparişleri, desi aşımlarını ve kritik stokları insan müdahalesine gerek kalmadan algılar ve bildirim merkezinize anında alarm düşürür."
    }
  ];

  return (
    <div className="min-h-screen bg-canvas text-dark flex flex-col selection:bg-primary-tint-200 selection:text-primary">
      {/* 1. TOP FLOATING NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-dark hover:bg-canvas transition-colors shrink-0"
              aria-label="Menüyü Aç"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo with click to toggle mobile drawer or navigate */}
            <div className="shrink-0">
              <BrandLogo size="md" href="/" showSlogan={false} />
            </div>
          </div>

          {/* Desktop Clean Centered Navigation */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs font-bold text-dark/80 whitespace-nowrap">
            <a href="#canli-akis" className="hover:text-primary transition-colors flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Canlı Akış</span>
            </a>
            <a href="#motorlar" className="hover:text-primary transition-colors">11 Güçlü Motor</a>
            <a href="#hesaplayici" className="hover:text-primary transition-colors">Kâr Simülatörü</a>
            <a href="#karsilastirma" className="hover:text-primary transition-colors">Neden DVT?</a>
            <a href="#sss" className="hover:text-primary transition-colors">Sıkça Sorulanlar</a>
          </nav>

          {/* Right Desktop / Mobile Actions with Auth Session Detection */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {userSession ? (
              <Link href="/dashboard">
                <Button size="sm" className="rounded-2xl text-xs font-bold px-3.5 sm:px-4 h-9 bg-dark hover:bg-dark/90 text-white shadow-xs flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>Panelim ({userSession.name.split(' ')[0]})</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary hidden sm:inline" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold px-3.5 h-9 bg-white hover:bg-canvas">
                    Giriş Yap
                  </Button>
                </Link>

                <Link href="/register">
                  <Button size="sm" className="rounded-xl text-xs font-bold px-3 sm:px-4 h-8 sm:h-9 shadow-xs bg-primary text-white hover:bg-primary-hover whitespace-nowrap">
                    <span className="hidden xs:inline">Canlı </span>Başla ➔
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. STANDALONE MOBILE SLIDE-IN DRAWER (CLEAN, SOLID OPAQUE & HIGH Z-INDEX) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Opaque Dark Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 z-[101]"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Solid White Opaque Slide-In Drawer */}
          <div className="fixed inset-y-0 left-0 w-72 sm:w-80 bg-white z-[102] p-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200 border-r border-border overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <BrandLogo size="sm" href="/" showSlogan={true} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-gray-500 hover:text-dark hover:bg-canvas transition-colors cursor-pointer"
                  aria-label="Menüyü Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1 text-sm font-bold text-dark">
                <a
                  href="#canli-akis"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl hover:bg-canvas text-dark hover:text-primary transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span>Canlı Akış Deneyimi</span>
                </a>
                <a
                  href="#motorlar"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl hover:bg-canvas text-dark hover:text-primary transition-colors"
                >
                  <Layers className="w-4 h-4 text-primary shrink-0" />
                  <span>11 Güçlü Motor</span>
                </a>
                <a
                  href="#hesaplayici"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl hover:bg-canvas text-dark hover:text-primary transition-colors"
                >
                  <Calculator className="w-4 h-4 text-primary shrink-0" />
                  <span>Tersine Kâr Simülatörü</span>
                </a>
                <a
                  href="#karsilastirma"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl hover:bg-canvas text-dark hover:text-primary transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Neden DVT-MarketPlace?</span>
                </a>
                <a
                  href="#sss"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl hover:bg-canvas text-dark hover:text-primary transition-colors"
                >
                  <Compass className="w-4 h-4 text-gray-500 shrink-0" />
                  <span>Sıkça Sorulan Sorular</span>
                </a>
              </nav>
            </div>

            {/* Drawer Bottom Area: User Session Profile or Login Buttons */}
            <div className="pt-4 border-t border-border space-y-2.5">
              {userSession ? (
                <div className="p-3 bg-canvas rounded-2xl border border-border space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                      {userSession.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-dark truncate flex items-center gap-1">
                        {userSession.name}
                        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono truncate">{userSession.email}</div>
                    </div>
                  </div>

                  <Link href="/dashboard" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full h-9 text-xs font-bold rounded-xl justify-center bg-primary text-white hover:bg-primary-hover shadow-xs gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Yönetim Paneline Git</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Link href="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full h-10 text-xs font-bold rounded-2xl justify-center bg-canvas">
                      Giriş Yap
                    </Button>
                  </Link>

                  <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full h-10 text-xs font-bold rounded-2xl justify-center bg-primary text-white hover:bg-primary-hover shadow-xs">
                      Ücretsiz Başla ➔
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION WITH CINEMATIC LIVE FRAME SIMULATOR */}
      <section id="canli-akis" className="relative pt-10 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Glow ambient meshes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-tint-100 border border-primary-tint-200 px-4 py-1.5 rounded-full text-xs font-black text-primary shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>Resmi 10 Ağustos 2026 Kargo Barem Desteği & Akıllı Finansal Zeka</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-dark leading-[1.12]">
            Pazaryerinde <span className="text-primary underline decoration-primary/30 decoration-wavy">Gerçek Net Kârınızı</span> Biliyor Musunuz?
          </h1>

          <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Kargo baremleri, Plus komisyonları, %1 stopaj ve devlete ödenecek KDV kesintilerini tek ekranda kuruşu kuruşuna hesaplayın. Zararına satışları durdurun, kâr marjınızı garantiye alın.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 rounded-2xl text-sm font-bold gap-2 shadow-md w-full sm:w-auto bg-primary text-white hover:bg-primary-hover">
                <span>Canlı Mağazanızı Bağlayın</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="h-12 px-6 rounded-2xl text-sm font-bold w-full sm:w-auto bg-white hover:bg-canvas">
                <Store className="w-4 h-4 mr-2 text-primary" />
                <span>Canlı Paneli İncele</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 🎬 CINEMATIC FRAME-BY-FRAME VIDEO-LIKE SIMULATOR */}
        <div className="mt-12 bg-white rounded-3xl sm:rounded-[36px] border border-border shadow-2xl overflow-hidden max-w-5xl mx-auto">
          {/* Top Video Bar */}
          <div className="p-4 sm:p-5 bg-dark text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-gray-300 ml-2 font-mono">DVT Live Transaction Engine v2.6</span>
            </div>

            {/* Frame Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                {cinematicFrames.map((f, idx) => (
                  <button
                    key={f.id}
                    onClick={() => { setCurrentFrame(idx); setIsPlaying(false); }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      currentFrame === idx ? 'bg-primary text-white shadow-xs' : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    Adım {idx + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title={isPlaying ? "Durdur" : "Oynat"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Active Frame Scene */}
          <div className="p-6 sm:p-8 space-y-6 bg-gradient-to-b from-white to-canvas/40">
            {/* Scene Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                  {cinematicFrames[currentFrame].title}
                </span>
                <h3 className="text-base sm:text-xl font-black text-dark mt-0.5">
                  {cinematicFrames[currentFrame].subtitle}
                </h3>
              </div>

              <Badge className={`${cinematicFrames[currentFrame].statusColor} text-xs font-bold px-3 py-1 rounded-xl shadow-2xs`}>
                {cinematicFrames[currentFrame].status}
              </Badge>
            </div>

            {/* Simulated Live Order Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-tint-100 text-primary flex items-center justify-center font-black shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-dark">{cinematicFrames[currentFrame].orderNo}</span>
                    <span className="text-[10px] bg-canvas px-2 py-0.5 rounded-md font-bold text-gray-500">Trendyol Express</span>
                  </div>
                  <h4 className="text-sm font-bold text-dark mt-0.5">{cinematicFrames[currentFrame].productName}</h4>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Müşteri Satış Fiyatı</span>
                <span className="text-xl font-black text-primary tabular-nums">₺{cinematicFrames[currentFrame].grossPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Scene KPI Metric Waterfall */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(cinematicFrames[currentFrame].kpis).map(([key, val]) => (
                <div key={key} className="bg-canvas p-3.5 rounded-2xl border border-border">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">{key}</span>
                  <span className={`text-base font-black tabular-nums mt-0.5 block ${
                    key.includes('netKar') ? 'text-emerald-700' : 'text-dark'
                  }`}>
                    {val}
                  </span>
                </div>
              ))}
            </div>

            {/* Explanation Quote */}
            <div className="p-4 rounded-2xl bg-primary-tint-50/40 border border-primary-tint-100 text-xs text-gray-700 leading-relaxed font-medium">
              💡 <strong>Nasıl Çalıştı:</strong> {cinematicFrames[currentFrame].details}
            </div>
          </div>
        </div>
      </section>

      {/* 3. 11 CORE BUSINESS ENGINES SECTION */}
      <section id="motorlar" className="py-16 bg-white border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black text-dark tracking-tight">
              Pazaryerinde Tam Kontrol Sağlayan <span className="text-primary">11 Akıllı Motor</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              Statik tablolar değil; canlı veritabanı, 7/24 anomali otomasyonu ve yapay zeka destekli analizler.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-canvas/40 border border-border hover:border-primary transition-all space-y-3 group hover:shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-primary-tint-100 text-primary flex items-center justify-center font-bold">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-dark group-hover:text-primary transition-colors">
                Tersine Hedef Kâr Fiyatlandırma Motoru
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Hedeflediğiniz kâr marjını girin; algoritma komisyon, kargo baremi, stopaj ve hizmet bedelini çözerek zarar ettirmeyecek en doğru satış fiyatını belirlesin.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-canvas/40 border border-border hover:border-primary transition-all space-y-3 group hover:shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-dark group-hover:text-primary transition-colors">
                10 Ağustos 2026 Kargo Barem & Desi Motoru
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                7 kargo firmasının (TEX, Aras, Yurtiçi, MNG, Sürat, PTT, Kolay Gelsin) 0-200₺, 200-350₺ baremleri ve 1 gün hızlı termin desteği kuruşu kuruşuna devrede.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-canvas/40 border border-border hover:border-primary transition-all space-y-3 group hover:shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-dark group-hover:text-primary transition-colors">
                Kargo Desi Farkı & Hakediş Denetimi
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Kargo şirketlerinin faturaya fazla yansıttığı desi kesintilerini otomatik tarayın, itiraz raporu hazırlayın ve hakediş kesintilerinizi geri alın.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-canvas/40 border border-border hover:border-primary transition-all space-y-3 group hover:shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-dark group-hover:text-primary transition-colors">
                Canlı Sipariş Akışı & Anlık Kâr Takibi
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Gelen her siparişin brüt cirosunu, kargo giderini, komisyonunu ve cebinize kalan net nakit kârını saniyesinde görün.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-canvas/40 border border-border hover:border-primary transition-all space-y-3 group hover:shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-dark group-hover:text-primary transition-colors">
                7/24 Otomatik Anomali & Çökme Takibi
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Zararına siparişler, desi aşımları, sıfırlanan stoklar ve sistem çökmeleri insan müdahalesine gerek kalmadan arka planda taranır ve alarm üretilir.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-canvas/40 border border-border hover:border-primary transition-all space-y-3 group hover:shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-dark group-hover:text-primary transition-colors">
                Mobil Adaptif Kartlar & Universal Sayfalama
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mobilde yatay kaydırma çilesi yok; tüm tablolar dokunmatik adaptif kartlara dönüşür. 11 sayfada sayfa boyutu seçilebilir sayfalama mevcuttur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE REVERSE PRICE SIMULATOR SECTION */}
      <section id="hesaplayici" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl sm:rounded-[36px] border border-border p-6 sm:p-10 shadow-xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-2xl font-black text-dark">Canlı Tersine Fiyatlandırma Simülatörü</h3>
                <Badge variant="excellent">Canlı Motor</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Alış maliyetinizi ve hedef kârınızı belirleyin, kargo baremi ve komisyonu düşerek olması gereken satış fiyatını anında görün.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Interactive Sliders */}
            <div className="lg:col-span-7 space-y-6">
              {/* Cost Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-700">Ürün Alış Maliyeti (₺ KDV Dahil)</span>
                  <span className="text-primary font-black text-sm">₺{calcCost}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="5"
                  value={calcCost}
                  onChange={(e) => setCalcCost(Number(e.target.value))}
                  className="w-full h-2 bg-canvas rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Target Margin Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-700">Hedef Net Kâr Marjı (%)</span>
                  <span className="text-emerald-700 font-black text-sm">%{calcTargetMargin}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={calcTargetMargin}
                  onChange={(e) => setCalcTargetMargin(Number(e.target.value))}
                  className="w-full h-2 bg-canvas rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Commission Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-700">Pazaryeri Komisyon Oranı (%)</span>
                  <span className="text-dark font-black text-sm">%{calcCommission}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="0.5"
                  value={calcCommission}
                  onChange={(e) => setCalcCommission(Number(e.target.value))}
                  className="w-full h-2 bg-canvas rounded-lg appearance-none cursor-pointer accent-dark"
                />
              </div>

              {/* Lead Time Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-bold text-gray-700">Termin Süresi:</span>
                <button
                  onClick={() => setCalcTermin(1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    calcTermin === 1 ? 'bg-primary text-white shadow-xs' : 'bg-canvas text-gray-700'
                  }`}
                >
                  ⚡ 1 Gün (Avantajlı Barem)
                </button>
                <button
                  onClick={() => setCalcTermin(2)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    calcTermin === 2 ? 'bg-primary text-white shadow-xs' : 'bg-canvas text-gray-700'
                  }`}
                >
                  📦 2-3 Gün (Standart Barem)
                </button>
              </div>
            </div>

            {/* Right: Real-time Output Price Card */}
            <div className="lg:col-span-5 bg-canvas/80 p-6 rounded-3xl border border-border/80 space-y-4 text-center sm:text-left">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block">
                Önerilen Pazaryeri Satış Fiyatı
              </span>
              <div className="text-4xl sm:text-5xl font-black text-primary tabular-nums">
                ₺{targetPrice.toFixed(2)}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border text-xs text-left">
                <div className="bg-white p-3 rounded-2xl border border-border">
                  <span className="text-[10px] text-gray-400 block font-semibold">Tahmini Net Kâr</span>
                  <span className="font-black text-emerald-700 text-base tabular-nums">+₺{calculatedProfit}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-border">
                  <span className="text-[10px] text-gray-400 block font-semibold">Uygulanan Kargo</span>
                  <span className="font-bold text-dark text-base tabular-nums">₺{simShipping.toFixed(2)}</span>
                </div>
              </div>

              <Link href="/product-pricing" className="block pt-2">
                <Button className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary-hover shadow-xs">
                  Detaylı Fiyatlandırma Motoruna Git ➔
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMPARISON SECTION */}
      <section id="karsilastirma" className="py-16 bg-white border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-dark tracking-tight">
              Geleneksel Muhasebe vs <span className="text-primary">DVT-MarketPlace</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              E-ticaret pazaryerleri özel kurallarla çalışır. Standart programlar kargo baremlerini göremez.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-6 rounded-3xl bg-red-50/40 border border-red-200/60 space-y-3">
              <h3 className="text-base font-bold text-red-800 flex items-center gap-2">
                <span>❌ Standart Muhasebe / Excel</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>10 Ağustos 2026 kargo baremlerini bilmez, ortalama kargo yazar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>Kargo firmasının faturada kestiği desi aşımlarını tespit edemez.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>Hedef kâr marjına göre tersine fiyat hesaplayamaz.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>Mobilde tabloları kaydırmaktan çalışılamaz hale gelir.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-200 space-y-3">
              <h3 className="text-base font-bold text-emerald-800 flex items-center gap-2">
                <span>✅ DVT-MarketPlace Akıllı Finans</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-gray-700 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Resmi Trendyol kargo baremleri ve termin desteği canlı devrede.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Hakediş ve desi aşımlarını 7/24 otomatik tarar, alarm üretir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Tek tıkla hedef kârdan satış fiyatı ve Buybox analizi yapar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Mobilde adaptif dokunmatik kartlar ve universal sayfalama sunar.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION SECTION */}
      <section id="sss" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">Sıkça Sorulan Sorular</h2>
          <p className="text-xs text-gray-500">DVT-MarketPlace hakkında merak ettiğiniz tüm detaylar</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = faqOpen === idx;
            return (
              <div key={idx} className="bg-white rounded-2xl sm:rounded-3xl border border-border overflow-hidden transition-all">
                <button
                  onClick={() => setFaqOpen(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-dark hover:bg-canvas/40 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-gray-600 leading-relaxed pt-1 border-t border-border/40 bg-canvas/20">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. HIGH-CONVERSION CAMPAIGN CTA BANNER (HAREKETE GEÇİRİCİ KAMPANYA BANDI) */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl sm:rounded-[40px] bg-gradient-to-br from-[#1A0C09] via-[#2A120D] to-[#120806] text-white p-8 sm:p-12 lg:p-16 border border-primary/30 shadow-2xl overflow-hidden">
          {/* Glowing background ambient lights */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#FF5722]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-primary shadow-2xs">
                <Gift className="w-4 h-4 text-primary animate-bounce" />
                <span>Sınırlı Süreli Kampanya: 30 Gün Ücretsiz VIP Kârlılık Denetimi</span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
                Pazaryeri Kesintilerine Son Verin, <br className="hidden sm:inline" />
                <span className="text-primary underline decoration-primary/40 decoration-wavy">Cebinizde Kalan Gerçek Kârı</span> Büyütün!
              </h2>

              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed font-medium">
                Mağazanızı bağlayın; ilk 100 siparişinizin kargo barem kesintilerini, komisyon farklarını ve desi aşımlarını 2 dakika içinde otomatik denetleyelim.
              </p>

              {/* Trust Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-gray-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>Kredi Kartı Gerekmez</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>Resmi Trendyol & HB API</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>Anında Canlı Kurulum (2 Dk)</span>
                </span>
              </div>
            </div>

            {/* Right Action Box */}
            <div className="lg:col-span-4 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-3.5 text-center shadow-xl">
              <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                Hemen Ücretsiz Başlayın
              </span>
              <p className="text-xs text-gray-300">
                14 gün boyunca tüm modülleri sınırsız test edin. Memnun kalmazsanız tek tıkla iptal.
              </p>

              <Link href="/register" className="block">
                <Button className="w-full h-12 text-sm font-black rounded-2xl bg-primary text-white hover:bg-primary-hover shadow-lg gap-2">
                  <span>VIP Hesabınızı Başlatın</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link href="/login" className="block text-[11px] text-gray-400 hover:text-white font-semibold transition-colors">
                Zaten hesabınız var mı? Giriş Yapın ➔
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. COMPREHENSIVE ENTERPRISE FOOTER (DETAYLI & KAPSAMLI KURUMSAL FOOTER) */}
      <footer className="mt-auto bg-dark text-white border-t border-border/20 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Main 5-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-white/10">
            {/* Column 1: Brand & Identity */}
            <div className="space-y-4 lg:col-span-1">
              <BrandLogo size="md" href="/" showSlogan={false} className="text-white" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Türkiye'nin ilk ve tek resmi 10 Ağustos 2026 kargo baremi ve tersine fiyatlandırma destekli pazaryeri finansal zeka motoru.
              </p>
              
              <div className="pt-2 space-y-2 text-[11px] text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-gray-300">PostgreSQL 16 High-Availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>256-Bit SSL Banka Düzeyi Şifreleme</span>
                </div>
              </div>
            </div>

            {/* Column 2: 11 Akıllı Finans Motoru */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                11 Finansal Motor
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <Link href="/product-pricing" className="hover:text-primary transition-colors block">
                    Tersine Fiyatlandırma Motoru
                  </Link>
                </li>
                <li>
                  <Link href="/live-analysis" className="hover:text-primary transition-colors block">
                    Canlı Sipariş & Kâr Akışı
                  </Link>
                </li>
                <li>
                  <Link href="/tariffs/desi" className="hover:text-primary transition-colors block">
                    10 Ağustos Kargo Baremleri
                  </Link>
                </li>
                <li>
                  <Link href="/settlement-desi-audit" className="hover:text-primary transition-colors block">
                    Kargo Desi Farkı & Hakediş
                  </Link>
                </li>
                <li>
                  <Link href="/profit-margin-list" className="hover:text-primary transition-colors block">
                    Kâr Marjı & Alış Maliyetleri
                  </Link>
                </li>
                <li>
                  <Link href="/tariffs/plus" className="hover:text-primary transition-colors block">
                    Plus Komisyon Simülasyonu
                  </Link>
                </li>
                <li>
                  <Link href="/tariffs/badges" className="hover:text-primary transition-colors block">
                    Avantajlı Ürün Etiketleri
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Entegrasyonlar */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Entegrasyonlar
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <Link href="/stores" className="hover:text-primary transition-colors block">
                    Trendyol Pazaryeri API
                  </Link>
                </li>
                <li>
                  <Link href="/stores" className="hover:text-primary transition-colors block">
                    Hepsiburada Satıcı API
                  </Link>
                </li>
                <li>
                  <span className="text-gray-500 block">Amazon Türkiye (Çok Yakında)</span>
                </li>
                <li>
                  <span className="text-gray-500 block">Trendyol Express (TEX) Baremi</span>
                </li>
                <li>
                  <span className="text-gray-500 block">Aras & Yurtiçi Kargo Desi</span>
                </li>
                <li>
                  <span className="text-gray-500 block">MNG, Sürat & Kolay Gelsin</span>
                </li>
                <li>
                  <Link href="/system/analytics" className="hover:text-primary transition-colors block">
                    Isı Haritası & Sayfa Telemetrisi
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Satıcı Kaynakları & Hesaplayıcılar */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Satıcı Kaynakları
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <Link href="/tariffs/commission" className="hover:text-primary transition-colors block">
                    Resmi Komisyon Tarifeleri 2026
                  </Link>
                </li>
                <li>
                  <Link href="/reports/order-profitability" className="hover:text-primary transition-colors block">
                    Kârlılık Raporu Excel Dışa Aktar
                  </Link>
                </li>
                <li>
                  <Link href="/marketing/ads" className="hover:text-primary transition-colors block">
                    Pazaryeri Reklam Harcama Analizi
                  </Link>
                </li>
                <li>
                  <Link href="/customers" className="hover:text-primary transition-colors block">
                    Müşteri Sadakat & Ciro Analitiği
                  </Link>
                </li>
                <li>
                  <Link href="/alerts" className="hover:text-primary transition-colors block">
                    7/24 Otomatik Anomali Uyarıları
                  </Link>
                </li>
                <li>
                  <Link href="/super-admin" className="hover:text-primary transition-colors block">
                    Süper Admin Komuta Merkezi
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 5: İletişim, Destek & Kurumsal */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                İletişim & Destek
              </h4>
              <div className="space-y-2.5 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <a href="mailto:bilgi@davutakbulut.co" className="hover:text-white transition-colors">
                    bilgi@davutakbulut.co
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a href="tel:05378826858" className="font-mono text-gray-300 hover:text-white transition-colors">
                    0 537 882 68 58 (Canlı Destek)
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="leading-snug">Molla Gürani, Uygar Sokağı No:17/A, Fatih/İstanbul</span>
                </div>
                <div className="pt-1">
                  <a
                    href="https://wa.me/905378826858?text=Merhaba%20Davut%20Bey,%20DVT-MarketPlace%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all text-xs font-bold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Canlı Destek</span>
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-1 text-[11px] text-gray-400">
                <Link href="/settings" className="hover:text-white block">KVKK Aydınlatma Metni</Link>
                <Link href="/settings" className="hover:text-white block">Kullanıcı Hizmet Sözleşmesi</Link>
                <Link href="/settings" className="hover:text-white block">Gizlilik & Güvenlik Politikası</Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Live Telemetry */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 pt-2">
            <p>© 2026 DVT MarketPlace Financial Intelligence Inc. Tüm hakları saklıdır.</p>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>API Yanıt Süresi: 16ms</span>
              </span>
              <span>•</span>
              <span>İstanbul / TR Sunucuları</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
