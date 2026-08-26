"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  X, ChevronRight, ChevronLeft, CheckCircle2, 
  Lightbulb, Compass, ArrowRight, LayoutDashboard, Activity, Package,
  Undo2, TrendingUp, Calculator, Percent, Megaphone,
  Boxes, Coins, BadgePercent, FileCheck2, FileSpreadsheet, AlertOctagon, Store, Settings, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface TourStep {
  target?: string; // CSS selector or data-tour attribute
  title: string;
  desc: string;
  tip?: string;
  tag?: string;
}

export interface TourGuidePage {
  pathname: string;
  title: string;
  category: string;
  icon: any;
  summary: string;
  steps: TourStep[];
}

export const TOUR_PAGES: Record<string, TourGuidePage> = {
  "/dashboard": {
    pathname: "/dashboard",
    title: "Kontrol Paneli",
    category: "Genel Bakış & KPI",
    icon: LayoutDashboard,
    summary: "Mağazanızın faturalanan cirosunu, 14 masraf kalemini, net kârını ve günlük kâr performansını tek ekranda izleyin.",
    steps: [
      {
        target: '[data-tour="dashboard-kpis"]',
        title: "1. Üst 4 Ana Finansal KPI Kartı",
        desc: "Faturalanan Ciro, Net Nakit Kâr, Komisyon & Hizmet ve Kargo Giderleri tutarlarını gerçek zamanlı izleyin.",
        tip: "Net Nakit Kâr kartında net kâr marjınızın ciroya oranını (%) anlık takip edebilirsiniz.",
        tag: "Ana Metrikler"
      },
      {
        target: '[data-tour="dashboard-expenses"]',
        title: "2. 14 Masraf Kalemi Akordeon Matrisi",
        desc: "COGS, Komisyon, Kargo, İade Kargo Zararı, Stopaj, Net KDV, Reklam, Ceza, Erken Ödeme ve %6 Ekstra Operasyon kesintilerinin ayrı ayrı ve toplam dökümü.",
        tip: "Tüm Masrafları Göster butonuna basarak tüm kalemleri inceleyebilirsiniz.",
        tag: "14 Masraf Kalemi"
      },
      {
        target: '[data-tour="dashboard-daily-profit"]',
        title: "3. Günlük Kâr Performansı Eğri Grafiği",
        desc: "Seçili tarih aralığında gün gün gerçekleşen net kazancınızı yeşil gradyanlı eğri grafiği üzerinde görün.",
        tip: "Kârınızın aniden düştüğü günleri anında tespit edip nedenini analiz edebilirsiniz.",
        tag: "Günlük Trend"
      },
      {
        target: '[data-tour="dashboard-monthly-trend"]',
        title: "4. Aylık Ciro & Net Kâr Gelişimi Alan Grafiği",
        desc: "Aylar bazında ciro hacminizin ne kadarının net kâra dönüştüğünü gösteren karşılaştırmalı alan grafiğidir.",
        tip: "Ciro yükselirken kâr marjınızın düşüp düşmediğini bu grafikten denetleyin.",
        tag: "Aylık Analiz"
      },
      {
        target: '[data-tour="dashboard-hourly-carrier"]',
        title: "5. 24 Saatlik Sipariş Yoğunluğu & Kargo Dağılımı",
        desc: "Siparişlerinizin günün hangi saatlerinde yoğunlaştığını ve hangi kargo şirketiyle kaç adet gönderildiğini inceleyin.",
        tip: "En çok sipariş aldığınız saatlere özel reklam bütçesi planlayabilirsiniz.",
        tag: "Saatlik & Kargo"
      },
      {
        target: '[data-tour="dashboard-top-products"]',
        title: "6. En Kârlı Ürünler & Canlı Son Siparişler Akışı",
        desc: "Dönemin en kârlı ürünlerini ve en son gelen canlı siparişleri listeleyin.",
        tip: "Her siparişin yanındaki 'İncele' butonuna basarak kargo baremini ve net kârını anında görün.",
        tag: "Canlı Siparişler"
      }
    ]
  },

  "/live-analysis": {
    pathname: "/live-analysis",
    title: "Canlı Analiz",
    category: "Canlı Takip",
    icon: Activity,
    summary: "Bugün gelen ve taşınan canlı siparişleri anlık takip edin, alış maliyeti eksik ürünlerin maliyetini satır içinde anında girin.",
    steps: [
      {
        target: '[data-tour="live-kpis"]',
        title: "1. Canlı Sipariş & Kâr Kartları",
        desc: "Filtrelenen sipariş sayısı, faturalanan brüt ciro, gerçekleşen net kâr ve ortalama kâr marjını anlık güncellenen kartlarla izleyin.",
        tip: "Sipariş geldikçe sayfa otomatik yenilenir ve kâr hesabı yapılır.",
        tag: "Canlı Özet"
      },
      {
        target: '[data-tour="live-charts"]',
        title: "2. Kümülatif Kâr Eğrisi & Marj Sağlığı Pastası",
        desc: "Günün 1. siparişinden son siparişine kadar biriken kümülatif kârı ve siparişlerin kârlılık sağlık dilimlerini görün.",
        tip: "Kırmızı renkle gösterilen zararına siparişleri anında fark edip fiyat güncelleyin.",
        tag: "Grafikler"
      },
      {
        target: '[data-tour="live-batch-cost"]',
        title: "3. Satır İçi & Toplu Alış Maliyeti Güncelleme",
        desc: "'Toplu Maliyet Güncelle' butonuna basarak barkod bazında birim alış maliyetini kaydedin. Sistem geçmiş ve gelecek tüm siparişlerin kârını anında yeniden hesaplar.",
        tip: "Alış maliyeti girilmeyen ürünlerin kârı %100 ciro gibi görünmez, eksik maliyet uyarısı verilir.",
        tag: "Maliyet Girişi"
      },
      {
        target: '[data-tour="live-table"]',
        title: "4. Canlı Sipariş Tablosu & Detay Modalı",
        desc: "Sipariş no, müşteri adı, kargo desi, ciro, komisyon, kargo bedeli ve net kâr sütunlarını inceleyin.",
        tip: "Tablo kuruşsuz tam TL formatında raporlama kolaylığı sunar.",
        tag: "Sipariş Tablosu"
      }
    ]
  },

  "/products": {
    pathname: "/products",
    title: "Ürünlerim (Katalog)",
    category: "Katalog & Maliyet",
    icon: Package,
    summary: "Mağazanızdaki tüm ürünlerin satış fiyatı, stok miktarı ve alış maliyetlerini tek ekranda yönetin.",
    steps: [
      {
        target: '[data-tour="products-search"]',
        title: "1. Ürün Kataloğu & Barkod Arama",
        desc: "Tüm ürünlerinizi barkod, model kodu, ürün adı veya kategoriye göre anında arayın ve listeleyin.",
        tip: "Arama kutusuna barkodun ilk birkaç hanesini yazarak filtreleme yapabilirsiniz.",
        tag: "Katalog"
      },
      {
        target: '[data-tour="products-table"]',
        title: "2. Satır İçi Birim Alış Maliyeti Düzenleme",
        desc: "Her ürünün yanındaki 'Alış Maliyeti (₺)' alanına tıklayarak birim maliyeti doğrudan düzenleyin ve 'Kaydet' butonuna basın.",
        tip: "Maliyeti güncellenen ürünün kâr marjı sistemdeki tüm sipariş ve analizlerde anında düzelir.",
        tag: "Maliyet Düzenleme"
      }
    ]
  },

  "/returns-cancellations": {
    pathname: "/returns-cancellations",
    title: "İptal & İade Siparişler",
    category: "İade & Zarar Analizi",
    icon: Undo2,
    summary: "İptal ve iade edilen siparişleri, satıcıya yansıtılan çift taraflı iade kargo zararlarını ve net kâra etkisini inceleyin.",
    steps: [
      {
        target: '[data-tour="returns-kpis"]',
        title: "1. İade & İptal Sipariş Takibi",
        desc: "Müşteri tarafından iptal edilen veya iade edilen siparişlerin tarih, müşteri ve tutar dökümüdür.",
        tip: "Hangi ürünlerin daha sık iade edildiğini tespit etmek için gerekçeye göre filtreleyebilirsiniz.",
        tag: "İade Takibi"
      },
      {
        target: '[data-tour="returns-table"]',
        title: "2. İade Kargo Zarar Tespiti",
        desc: "İade edilen siparişlerde satıcıdan kesilen gidiş-dönüş kargo bedellerinin hesaplanmasıdır.",
        tip: "İade kargo zararı Dashboard üzerindeki 14 masraf kalemi içerisine otomatik dahil edilir.",
        tag: "Kargo Zararı"
      }
    ]
  },

  "/product-profitability": {
    pathname: "/product-profitability",
    title: "Ürün Kârlılık Analizi",
    category: "Finansal Analiz",
    icon: TrendingUp,
    summary: "Sipariş, ürün ve kategori bazında derinlemesine kârlılık analizi yapın.",
    steps: [
      {
        target: '[data-tour="profitability-kpis"]',
        title: "1. Kârlılık Özet Metrikleri",
        desc: "Satılan ürün çeşidi, toplam adet, faturalanan brüt ciro ve gerçekleşen net kâr dökümüdür.",
        tip: "Ağırlıklı kâr marjınızı ciroya oranla anlık denetleyin.",
        tag: "Kâr Özeti"
      },
      {
        target: '[data-tour="profitability-export"]',
        title: "2. Excel (CSV) Dışa Aktarım",
        desc: "Oluşturulan tüm kârlılık analizlerini tek tıkla Türkçe karakter destekli Excel veya CSV formatında indirin.",
        tip: "Muhasebe ve finans ekiplerinizle paylaşmak için Excel export butonunu kullanın.",
        tag: "Excel İndir"
      },
      {
        target: '[data-tour="profitability-table"]',
        title: "3. Ürün Bazlı Kâr & Marj Tablosu",
        desc: "Her bir ürünün adet, toplam ciro, komisyon kesintisi, kargo bedeli ve net kâr sütunlarını inceleyin.",
        tip: "Tabloda en kârlı ürünleriniz en üstte sıralanır.",
        tag: "Kârlılık Tablosu"
      }
    ]
  },

  "/product-pricing": {
    pathname: "/product-pricing",
    title: "Ürün Fiyatlandırma",
    category: "Fiyatlandırma Motoru",
    icon: Calculator,
    summary: "Hedef kâr marjınızı girin; komisyon, barem kargo, KDV, stopaj ve %6 ekstra operasyon kesintisini otomatik düşerek ideal satış fiyatınızı bulun.",
    steps: [
      {
        target: '[data-tour="pricing-form"]',
        title: "1. Tersine Hedef Satış Fiyatı Hesaplayıcı",
        desc: "Ürünün birim alış maliyetini ve kazanmak istediğiniz net kâr marjını (%25 vb.) girin. Motor satış fiyatını anında hesaplar.",
        tip: "Fiyat hesaplanırken %6 Ekstra Operasyon Oranı paydadan otomatik düşülür.",
        tag: "Tersine Hesaplama"
      },
      {
        target: '[data-tour="pricing-waterfall"]',
        title: "2. 7 Satırlı Finansal Şelale (Waterfall)",
        desc: "Satış Fiyatı, COGS, Kargo Maliyeti, Komisyon, Stopaj Kesintisi (%1), Net KDV ve Ekstra Operasyon (%6) dökümünü adım adım inceleyin.",
        tip: "Her bir kesintinin TL ve yüzde payı şelalede açıkça gösterilir.",
        tag: "Maliyet Şelalesi"
      },
      {
        target: '[data-tour="pricing-buybox"]',
        title: "3. Buybox Rekabet Simülasyonu",
        desc: "Rakip firmanın fiyatını girin; o fiyata indiğinizde net kârınızın ve kâr marjınızın ne olacağını canlı simüle edin.",
        tip: "Zararına rekabete girmeden önce Buybox simülasyonunu mutlaka çalıştırın.",
        tag: "Buybox Testi"
      }
    ]
  },

  "/profit-margin-list": {
    pathname: "/profit-margin-list",
    title: "Kâr Marjı Listesi",
    category: "Fiyat & Marj",
    icon: Percent,
    summary: "Ürünlerin satış fiyatı ile maliyetleri arasındaki kâr marjlarını toplu olarak inceleyin ve düzenleyin.",
    steps: [
      {
        target: '[data-tour="margin-table"]',
        title: "1. Ürün Marjı Listesi & Satır İçi Düzenleme",
        desc: "Her ürünün güncel satış fiyatı, alış maliyeti, komisyon oranı, tahmini net kârı ve kâr marjını tek tabloda görün.",
        tip: "Maliyeti değiştirdiğinizde tahmini net kâr anında yeniden hesaplanır.",
        tag: "Marj Listesi"
      }
    ]
  },

  "/marketing/ads": {
    pathname: "/marketing/ads",
    title: "Reklamlarım & HepsiAd",
    category: "Pazarlama & ROAS",
    icon: Megaphone,
    summary: "Trendyol ve Hepsiburada reklam faturalarınızı kaydedin; ROAS, TACoS ve sipariş başına reklam payını net kârınıza yansıtın.",
    steps: [
      {
        target: '[data-tour="ads-invoices"]',
        title: "1. Reklam Faturaları Kaydı & Harcama Listesi",
        desc: "Dönem içinde kesilen reklam faturalarını kaydedin, mağaza bazlı filtreleyin ve sipariş başına reklam maliyetini hesaplatın.",
        tip: "Hepsiburada seçildiğinde HepsiAd harcamaları, Trendyol seçildiğinde Trendyol reklamları listelenir.",
        tag: "Reklam Faturası"
      }
    ]
  },

  "/customers": {
    pathname: "/customers",
    title: "Müşteri Listesi & Sadakat",
    category: "Müşteri Yönetimi",
    icon: Users,
    summary: "Müşterilerinizin toplam harcamaları, bıraktıkları net kâr ve VIP tekrarlayan sipariş dökümleri.",
    steps: [
      {
        target: '[data-tour="customers-kpis"]',
        title: "1. Müşteri KPI Kartları & Sadakat Özeti",
        desc: "Toplam tekil müşteri, toplam faturalanan ciro, bırakılan net kâr ve 2+ sipariş veren VIP müşteri sayısı.",
        tip: "Mağaza bazında müşterilerinizin bıraktığı toplam net kârı buradan izleyebilirsiniz.",
        tag: "Müşteri KPI"
      },
      {
        target: '[data-tour="customers-table"]',
        title: "2. Müşteri Geçmişi & Sipariş Dökümü",
        desc: "Müşterilerin isim, şehir, sipariş sayısı, toplam ciro, net kâr ve son sipariş tarihi tablosudur.",
        tip: "'Geçmiş' butonuna tıklayarak müşterinin tüm eski sipariş dökümünü inceleyebilirsiniz.",
        tag: "Müşteri Tablosu"
      }
    ]
  },

  "/tariffs/desi": {
    pathname: "/tariffs/desi",
    title: "Kargo Desi Fiyatları (0-500)",
    category: "Kargo Tarifeleri",
    icon: Boxes,
    summary: "10 kargo partnerinin 0-500 desi arasındaki 501 kademe fiyat listesini inceleyin, Excel ile toplu düzenleyin.",
    steps: [
      {
        target: '[data-tour="desi-table"]',
        title: "1. 501 Kademe Kargo Matrisi & Excel",
        desc: "Trendyol Express, Aras, Yurtiçi, MNG, Sürat ve PTT kargonun güncel fiyat skalasını listeleyin ve Excel ile düzenleyin.",
        tip: "Hücrelerdeki fiyatı klavyeden doğrudan değiştirip 'Kaydet'e basabilirsiniz.",
        tag: "Desi Matrisi"
      }
    ]
  },

  "/tariffs/cargo-barem": {
    pathname: "/tariffs/cargo-barem",
    title: "Kargo Barem Destek",
    category: "Kargo Tarifeleri",
    icon: Coins,
    summary: "Trendyol 0-199₺, 200-349₺ ve 350₺+ kargo barem destek tutarlarını ve satıcı kargo paylarını yönetin.",
    steps: [
      {
        target: '[data-tour="barem-matrix"]',
        title: "1. Barem Kademeleri & Satıcı Desteği",
        desc: "Sepet tutarına göre Trendyol'un satıcıya sunduğu kargo desteği ve satıcının ödediği net kargo barem tutarlarını listeler.",
        tip: "200-349₺ arasındaki barem indirimleri fiyatlandırma motoruna otomatik entegre edilir.",
        tag: "Barem Desteği"
      }
    ]
  },

  "/tariffs/commission": {
    pathname: "/tariffs/commission",
    title: "Ürün Komisyon Tarifesi",
    category: "Pazaryeri Tarifeleri",
    icon: BadgePercent,
    summary: "Tüm kategorilerdeki standart komisyon oranlarını inceleyin, özel komisyonlarınızı tanımlayın.",
    steps: [
      {
        target: '[data-tour="commission-search"]',
        title: "1. Kategori Komisyon Arama & Özel Oranlar",
        desc: "Yüzlerce kategori arasından arama yaparak ürününüzün güncel standart komisyon oranını anında bulun.",
        tip: "Excel ile içe aktararak tüm kategorilerin komisyonunu tek seferde güncelleyebilirsiniz.",
        tag: "Komisyon Arama"
      }
    ]
  },

  "/settlement-desi-audit": {
    pathname: "/settlement-desi-audit",
    title: "Hakediş & Desi Kontrol",
    category: "Mutabakat & Denetim",
    icon: FileCheck2,
    summary: "Kargo faturalarındaki desi aşımlarını tespit edin, fazla kesintilere tek tıkla resmi itiraz dilekçesi kopyalayarak paranızı geri alın.",
    steps: [
      {
        target: '[data-tour="desi-audit-table"]',
        title: "1. Desi Aşım Tespit Motoru & İtiraz Dilekçesi",
        desc: "Ürününüzün sistemdeki gerçek desisi ile kargo faturasında kesilen fahiş desi arasındaki farkları listeler ve tek tıkla resmi itiraz dilekçesi kopyalar.",
        tip: "Düzenli itiraz yapan satıcılar kargo maliyetlerinin %15'ini geri almaktadır.",
        tag: "İtiraz Motoru"
      }
    ]
  },

  "/reports/order-profitability": {
    pathname: "/reports/order-profitability",
    title: "Finansal Raporlar",
    category: "Raporlama",
    icon: FileSpreadsheet,
    summary: "Sipariş, ürün ve kategori bazlı detaylı finansal raporlarınızı inceleyin ve Türkçe Excel olarak indirin.",
    steps: [
      {
        target: '[data-tour="reports-table"]',
        title: "1. Finansal Sipariş Kârlılık Raporu",
        desc: "Her siparişin brüt ciro, komisyon, kargo, net KDV, stopaj, %6 ekstra operasyon ve net kâr dökümünü listeler.",
        tip: "Tarih ve mağaza filtresi uygulayarak dilediğiniz dönemi raporlayabilirsiniz.",
        tag: "Sipariş Raporu"
      }
    ]
  },

  "/alerts": {
    pathname: "/alerts",
    title: "Uyarı Listesi",
    category: "Risk Yönetimi",
    icon: AlertOctagon,
    summary: "Zararına satılan siparişler, düşük marjlı ürünler ve alış maliyeti eksik kalemler için otomatik finansal erken uyarı sistemi.",
    steps: [
      {
        target: '[data-tour="alerts-list"]',
        title: "1. Zararına Satış & Düşük Marj Uyarıları",
        desc: "Komisyon, kargo ve vergi kesintileri sonrası eksiye düşen siparişleri ve maliyeti eksik ürünleri listeler.",
        tip: "Zararına satılan ürünün fiyatını hemen artırarak zararı durdurun.",
        tag: "Uyarılar"
      }
    ]
  },

  "/stores": {
    pathname: "/stores",
    title: "Mağazalarım & Yeni Bağla",
    category: "Entegrasyon",
    icon: Store,
    summary: "Trendyol, Hepsiburada ve Amazon mağaza API anahtarlarınızı yönetin, canlı bağlantı testleri gerçekleştirin.",
    steps: [
      {
        target: '[data-tour="stores-list"]',
        title: "1. API Anahtarları & Bağlantı Testi",
        desc: "Pazaryeri panellerinden aldığınız API anahtarlarını kaydedin ve tek tıkla test edin.",
        tip: "Yeşil rozet mağazanızın canlı ve senkron olduğunu gösterir.",
        tag: "API Bağlantısı"
      }
    ]
  },

  "/settings": {
    pathname: "/settings",
    title: "Ayarlar",
    category: "Sistem Yapılandırması",
    icon: Settings,
    summary: "Firma bilgileri, kargo baremleri, %6 ekstra operasyon, %0.16 erken ödeme, e-posta bildirimleri ve kullanıcı yetkilerini yönetin.",
    steps: [
      {
        target: '[data-tour="settings-tabs"]',
        title: "1. 11 Kapsamlı Ayar Sekmesi",
        desc: "Hesap, Genel, Kargo, Operasyon, Marj Uyarıları, Kesintiler & Sabit Giderler, E-Posta Bildirimleri, XML, Kullanıcılar, Abonelik ve Yedekleme sekmeleri.",
        tip: "Her sekmedeki değişiklikler veritabanına anında kalıcı olarak kaydedilir.",
        tag: "11 Sekme"
      },
      {
        target: '[data-tour="settings-expenses"]',
        title: "2. Kesintiler & Sabit Giderler",
        desc: "Platform Hizmet Bedeli, Stopaj (%1), Koli, Fatura, Günlük Erken Ödeme (%0.16) ve %6 Ekstra Operasyon kesintilerini tanımlayın.",
        tip: "Burada tanımladığınız giderler tüm kârlılık motorlarına ve raporlara anında uygulanır.",
        tag: "Gider Ayarları"
      }
    ]
  }
};

export function InteractiveSpotlightGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const currentPathname = usePathname();
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState<string>("/dashboard");
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [highlightRect, setHighlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  // Auto-detect current active page when opened
  useEffect(() => {
    if (open) {
      const match = Object.keys(TOUR_PAGES).find(
        (p) => currentPathname === p || (p !== "/dashboard" && currentPathname.startsWith(p))
      );
      setSelectedPath(match || "/dashboard");
      setStepIndex(0);
    }
  }, [open, currentPathname]);

  const currentGuide = TOUR_PAGES[selectedPath] || TOUR_PAGES["/dashboard"];
  const steps = currentGuide.steps || [];
  const currentStep = steps[stepIndex] || steps[0];
  const Icon = currentGuide.icon || LayoutDashboard;

  // Measure and scroll target element into view with retries
  const updateTargetPosition = useCallback(() => {
    if (!open || !currentStep?.target) {
      setHighlightRect(null);
      return;
    }

    let attempts = 0;
    const maxAttempts = 8;

    const findAndMeasure = () => {
      try {
        const el = document.querySelector(currentStep.target!);
        if (el) {
          const rect = el.getBoundingClientRect();
          const isInViewport =
            rect.top >= 80 &&
            rect.bottom <= window.innerHeight - 80;

          if (!isInViewport) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }

          setTimeout(() => {
            const freshRect = el.getBoundingClientRect();
            setHighlightRect({
              top: freshRect.top,
              left: freshRect.left,
              width: freshRect.width,
              height: freshRect.height,
            });
          }, 120);
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(findAndMeasure, 150);
          } else {
            setHighlightRect(null);
          }
        }
      } catch (e) {
        setHighlightRect(null);
      }
    };

    findAndMeasure();
  }, [open, currentStep]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition, true);
    return () => {
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition, true);
    };
  }, [updateTargetPosition, stepIndex, selectedPath]);

  if (!open) return null;

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handlePageChange = (newPath: string) => {
    setSelectedPath(newPath);
    setStepIndex(0);
    if (currentPathname !== newPath) {
      router.push(newPath);
    }
  };

  // Smart floating popover positioning relative to target element
  const getPopoverStyle = (): React.CSSProperties => {
    if (typeof window === 'undefined') return { position: 'fixed', bottom: '1.5rem', right: '1.5rem' };

    const cardWidth = Math.min(window.innerWidth - 32, 480);
    const cardHeight = 330;

    if (!highlightRect) {
      return {
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        width: `${cardWidth}px`,
        maxWidth: 'calc(100vw - 2rem)',
        zIndex: 102,
      };
    }

    const spaceBelow = window.innerHeight - (highlightRect.top + highlightRect.height);
    const spaceAbove = highlightRect.top;

    let top: number;
    if (spaceBelow >= cardHeight + 20) {
      top = highlightRect.top + highlightRect.height + 16;
    } else if (spaceAbove >= cardHeight + 20) {
      top = Math.max(16, highlightRect.top - cardHeight - 16);
    } else {
      top = Math.max(16, Math.min(window.innerHeight - cardHeight - 16, highlightRect.top + 20));
    }

    const targetCenterX = highlightRect.left + (highlightRect.width / 2);
    let left = targetCenterX - (cardWidth / 2);
    left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, left));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
      maxWidth: 'calc(100vw - 2rem)',
      zIndex: 102,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  return (
    <div className="fixed inset-0 z-100 select-none">
      {/* 1. Backdrop Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto" 
      />

      {/* 2. Target Element Spotlight Frame */}
      {highlightRect && (
        <div
          style={{
            position: "fixed",
            top: Math.max(0, highlightRect.top - 6),
            left: Math.max(0, highlightRect.left - 6),
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65), 0 0 25px rgba(255, 120, 85, 0.4)",
            pointerEvents: "none",
            borderRadius: "1.5rem",
            border: "3px solid #FF7855",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 101,
          }}
        />
      )}

      {/* 3. Floating Interactive Guide Card (Smart Positioned directly next to Target) */}
      <div style={getPopoverStyle()} className="animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-primary/30 space-y-4">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-border gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-primary-tint-100 flex items-center justify-center text-primary shrink-0 shadow-xs">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-dark">Rehber</h3>
                  <Badge variant="secondary" className="text-[10px] font-bold bg-primary-tint-50 text-primary border border-primary-tint-200">
                    📍 {currentGuide.title}
                  </Badge>
                </div>
                <span className="text-[10px] text-gray-500 font-semibold">
                  Adım {stepIndex + 1} / {steps.length}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-dark hover:bg-canvas transition-colors cursor-pointer shrink-0"
              aria-label="Rehberi Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Page Switcher Selector with Router Push */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-canvas border border-border/80 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-gray-600">
              <Icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px]">Sayfa:</span>
            </div>

            <select
              value={selectedPath}
              onChange={(e) => handlePageChange(e.target.value)}
              className="px-2 py-1 rounded-lg border border-border text-[11px] font-bold text-dark bg-white shadow-2xs focus:ring-1 focus:ring-primary cursor-pointer max-w-[240px] truncate"
            >
              {Object.entries(TOUR_PAGES).map(([path, guide]) => (
                <option key={path} value={path}>
                  {guide.title} ({guide.category})
                </option>
              ))}
            </select>
          </div>

          {/* Step Content */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs">
                  {stepIndex + 1}
                </span>
                <h4 className="text-xs sm:text-sm font-black text-dark">{currentStep.title}</h4>
              </div>

              {currentStep.tag && (
                <Badge variant="default" className="text-[9px] font-bold bg-dark text-white shrink-0">
                  {currentStep.tag}
                </Badge>
              )}
            </div>

            <p className="text-xs text-gray-700 leading-relaxed pl-7">
              {currentStep.desc}
            </p>

            {currentStep.tip && (
              <div className="ml-7 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-950 flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Uzman İpucu: </strong>
                  <span>{currentStep.tip}</span>
                </div>
              </div>
            )}

            {/* Quick Link to Page if user is on different route */}
            {currentPathname !== selectedPath && (
              <div className="pl-7 pt-1">
                <Link href={selectedPath} onClick={onClose}>
                  <Button size="sm" variant="outline" className="text-[11px] h-7 font-bold gap-1 text-primary bg-white hover:bg-primary hover:text-white transition-all shadow-2xs">
                    <span>Bu Sayfaya Geç</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Footer Controls & Progress Dots */}
          <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
            {/* Step Indicators */}
            <div className="flex items-center gap-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStepIndex(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    stepIndex === i ? "bg-primary w-5" : "bg-gray-200 hover:bg-gray-300 w-1.5"
                  }`}
                  title={`Adım ${i + 1}`}
                />
              ))}
            </div>

            {/* Prev / Next Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={stepIndex === 0}
                onClick={handlePrev}
                className="text-xs font-bold gap-1 h-8 px-3 rounded-xl bg-white hover:bg-canvas"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Geri</span>
              </Button>

              {stepIndex < steps.length - 1 ? (
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="text-xs font-bold gap-1 h-8 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white shadow-xs"
                >
                  <span>İleri</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={onClose}
                  className="text-xs font-bold gap-1 h-8 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tamamla</span>
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
