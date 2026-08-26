"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Compass, X, Sparkles, CheckCircle2, ChevronRight, ChevronLeft,
  LayoutDashboard, Activity, Package, Undo2, TrendingUp, Calculator,
  Percent, Megaphone, Truck, Layers, FileCheck2, FileSpreadsheet,
  Users, AlertOctagon, Store, ShieldAlert, Settings, HelpCircle,
  Lightbulb, ArrowRight, Eye, Boxes, Coins, BadgePercent, Award,
  ShieldCheck, Receipt, BarChart3, Clock, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export interface PageGuideStep {
  title: string;
  desc: string;
  tip?: string;
  tag?: string;
}

export interface PageGuideData {
  pathname: string;
  title: string;
  category: string;
  icon: any;
  summary: string;
  steps: PageGuideStep[];
}

export const PAGE_GUIDES: Record<string, PageGuideData> = {
  '/dashboard': {
    pathname: '/dashboard',
    title: 'Kontrol Paneli (Dashboard)',
    category: 'Genel Bakış & KPI',
    icon: LayoutDashboard,
    summary: 'Mağazanızın faturalanan cirosunu, 14 masraf kalemini, net nakit kârını ve günlük kâr performansını tek ekranda izleyin.',
    steps: [
      {
        title: '1. Üst 4 Ana Finansal KPI Kartı',
        desc: 'Faturalanan Ciro, Net Nakit Kâr, Komisyon & Hizmet ve Kargo Giderleri tutarlarını gerçek zamanlı izleyin. Başlıkların altındaki renkli kapsüller aktif, iptal ve iade siparişlerin sayı ve tutar ayrımını verir.',
        tip: 'Net Nakit Kâr kartında net kâr marjınızın ciroya oranını (%) anlık takip edebilirsiniz.',
        tag: 'Ana Metrikler'
      },
      {
        title: '2. 14 Masraf Kalemi Akordeon Matrisi (Donut Pasta)',
        desc: 'Alandan kazanmak için varsayılan olarak kapalı gelen bu kartı "Tüm Masrafları Göster" butonuna basarak açabilirsiniz. COGS, Komisyon, Kargo, İade Kargo Zararı, Stopaj, Net KDV, Reklam, Ceza, Erken Ödeme ve %6 Ekstra Operasyon maliyetlerinin ayrı ayrı ve toplam dökümünü içerir.',
        tip: 'Ortadaki halka grafiğin merkezinde toplam kesinti ve maliyet tutarınız otomatik toplanır.',
        tag: '14 Masraf Kalemi'
      },
      {
        title: '3. Günlük Kâr Performansı Eğri Grafiği',
        desc: 'Seçili tarih aralığında gün gün gerçekleşen net kazancınızı yeşil gradyanlı yumuşak eğri (spline curve) grafiği üzerinde görün. Fareyle günün üzerine gelerek sipariş adedi ve kâr detayını okuyabilirsiniz.',
        tip: 'Kârınızın aniden düştüğü günleri anında tespit edip nedenini analiz edebilirsiniz.',
        tag: 'Günlük Trend'
      },
      {
        title: '4. Aylık Ciro & Net Kâr Gelişimi Alan Grafiği',
        desc: 'Aylar bazında ciro hacminizin ne kadarının net kâra dönüştüğünü gösteren karşılaştırmalı alan grafiğidir.',
        tip: 'Ciro yükselirken kâr marjınızın düşüp düşmediğini bu grafikten denetleyin.',
        tag: 'Aylık Analiz'
      },
      {
        title: '5. 24 Saatlik Sipariş Yoğunluğu & Kargo Dağılımı',
        desc: 'Siparişlerinizin günün hangi saatlerinde yoğunlaştığını (00:00-23:00) ve hangi kargo şirketiyle kaç adet gönderildiğini kâr/maliyet ayrımıyla inceleyin.',
        tip: 'En çok sipariş aldığınız saatlere özel reklam bütçesi planlayabilirsiniz.',
        tag: 'Saatlik & Kargo'
      },
      {
        title: '6. En Kârlı Ürünler & Canlı Son Siparişler Akışı',
        desc: 'Dönemin en kârlı 5 ürününü ve en son gelen canlı siparişleri listeleyin. Canlı siparişe tıklayarak 5 kolonlu Finansal Şelale Modalı üzerinden siparişi detaylıca inceleyebilirsiniz.',
        tip: 'Her siparişin yanındaki "İncele" butonuna basarak siparişin kargo baremini ve net kârını anında görün.',
        tag: 'Canlı Siparişler'
      }
    ]
  },

  '/live-analysis': {
    pathname: '/live-analysis',
    title: 'Canlı Analiz & Sipariş Akışı',
    category: 'Canlı Takip',
    icon: Activity,
    summary: 'Bugün gelen ve taşınan canlı siparişleri anlık takip edin, alış maliyeti eksik ürünlerin maliyetini satır içinde anında girin.',
    steps: [
      {
        title: '1. Canlı Sipariş & Kâr Kartları',
        desc: 'Filtrelenen sipariş sayısı, faturalanan brüt ciro, gerçekleşen net kâr ve ortalama kâr marjını anlık güncellenen kartlarla izleyin.',
        tip: 'Sipariş geldikçe sayfa otomatik yenilenir ve kâr hesabı yapılır.',
        tag: 'Canlı Özet'
      },
      {
        title: '2. Kümülatif Kâr Birikim Eğrisi',
        desc: 'Günün 1. siparişinden son siparişine kadar biriken toplam nakit kârınızı gösteren kümülatif kâr grafiğidir.',
        tip: 'Gün boyunca kârınızın hangi siparişlerle sıçrama yaptığını grafik üzerinden görebilirsiniz.',
        tag: 'Kümülatif Kâr'
      },
      {
        title: '3. Sipariş Kâr Sağlık Dağılımı (Dilimli Pasta)',
        desc: 'Siparişlerinizi %20+ Yüksek Kâr, %5-%20 Standart, %0-%5 Düşük Marj ve Zararına Siparişler olarak 4 sağlık dilimine ayırır.',
        tip: 'Kırmızı renkle gösterilen zararına siparişleri anında fark edip fiyat güncelleyin.',
        tag: 'Marj Sağlığı'
      },
      {
        title: '4. Satır İçi & Toplu Alış Maliyeti Güncelleme',
        desc: '"Toplu Maliyet Güncelle" butonuna basarak barkod bazında birim alış maliyetini kaydedin. Sistem geçmiş ve gelecek tüm siparişlerin kârını anında yeniden hesaplar.',
        tip: 'Alış maliyeti girilmeyen ürünlerin kârı %100 ciro gibi görünmez, eksik maliyet uyarısı verilir.',
        tag: 'Maliyet Girişi'
      },
      {
        title: '5. Canlı Sipariş Tablosu & Detay Modalı',
        desc: 'Sipariş no, müşteri adı, kargo desi, ciro, komisyon, kargo bedeli ve net kâr sütunlarını inceleyin. "İncele" butonuna tıklayarak siparişin ayrıntılı kesinti şelalesine ulaşın.',
        tip: 'Tablo kuruşsuz tam TL formatında raporlama kolaylığı sunar.',
        tag: 'Sipariş Tablosu'
      }
    ]
  },

  '/products': {
    pathname: '/products',
    title: 'Ürünlerim & Katalog Yönetimi',
    category: 'Katalog & Maliyet',
    icon: Package,
    summary: 'Trendyol mağazanızdaki tüm ürünlerin satış fiyatı, stok miktarı ve alış maliyetlerini tek ekranda yönetin.',
    steps: [
      {
        title: '1. Ürün Kataloğu & Barkod Arama',
        desc: 'Tüm ürünlerinizi barkod, model kodu, ürün adı veya kategoriye göre anında arayın ve listeleyin.',
        tip: 'Arama kutusuna barkodun ilk birkaç hanesini yazarak filtreleme yapabilirsiniz.',
        tag: 'Katalog'
      },
      {
        title: '2. Satır İçi Birim Alış Maliyeti Düzenleme',
        desc: 'Her ürünün yanındaki "Alış Maliyeti (₺)" alanına tıklayarak birim maliyeti doğrudan düzenleyin ve "Kaydet" butonuna basın.',
        tip: 'Maliyeti güncellenen ürünün kâr marjı sistemdeki tüm sipariş ve analizlerde anında düzelir.',
        tag: 'Maliyet Düzenleme'
      },
      {
        title: '3. Canlı Trendyol Mağaza Bağlantısı',
        desc: 'Ürünün yanındaki harici bağlantı ikonuna tıklayarak ürünün Trendyol üzerindeki canlı satış sayfasını yeni sekmede açın.',
        tip: 'Rakip fiyatlarını ve buybox durumunu kontrol etmek için hızlıca mağazaya geçebilirsiniz.',
        tag: 'Trendyol Linki'
      }
    ]
  },

  '/returns-cancellations': {
    pathname: '/returns-cancellations',
    title: 'İptal & İade Siparişler',
    category: 'İade & Zarar Analizi',
    icon: Undo2,
    summary: 'İptal ve iade edilen siparişleri, satıcıya yansıtılan çift taraflı iade kargo zararlarını ve net kâra etkisini inceleyin.',
    steps: [
      {
        title: '1. İade & İptal Sipariş Takibi',
        desc: 'Müşteri tarafından iptal edilen veya teslim alındıktan sonra iade edilen siparişlerin tarih, müşteri ve tutar dökümüdür.',
        tip: 'Hangi ürünlerin daha sık iade edildiğini tespit etmek için kategoriye göre filtreleyebilirsiniz.',
        tag: 'İade Takibi'
      },
      {
        title: '2. İade Kargo Zarar Tespiti',
        desc: 'Trendyol ve kargo şirketlerinin iade edilen siparişlerde satıcıdan kestiği gidiş-dönüş kargo bedellerinin hesaplanmasıdır.',
        tip: 'İade kargo zararı Dashboard üzerindeki 14 masraf kalemi içerisine otomatik dahil edilir.',
        tag: 'Kargo Zararı'
      }
    ]
  },

  '/product-profitability': {
    pathname: '/product-profitability',
    title: 'Ürün Kârlılık Analizi',
    category: 'Finansal Analiz',
    icon: TrendingUp,
    summary: '5 ayrık raporlama türüyle sipariş, ürün, kategori ve reklam bazında derinlemesine kârlılık analizi yapın.',
    steps: [
      {
        title: '1. 5 Ayrık Rapor Türü',
        desc: 'Sipariş Bazlı, Ürün Bazlı, Kategori Bazlı, İade Zarar ve Reklam Kârlılık raporları arasında tek tıkla geçiş yapın.',
        tip: 'Hangi kategorinin mağazanıza en çok kâr bıraktığını Kategori Raporu üzerinden görün.',
        tag: '5 Rapor Türü'
      },
      {
        title: '2. Excel & CSV Dışa Aktarım',
        desc: 'Oluşturulan tüm kârlılık analizlerini tek tıkla Türkçe karakter destekli Excel veya CSV formatında bilgisayarınıza indirin.',
        tip: 'Muhasebe ve finans ekiplerinizle paylaşmak için Excel export butonunu kullanın.',
        tag: 'Excel İndir'
      }
    ]
  },

  '/product-pricing': {
    pathname: '/product-pricing',
    title: 'Ürün Fiyatlandırma Motoru',
    category: 'Fiyatlandırma Motoru',
    icon: Calculator,
    summary: 'Hedef kâr marjınızı girin; komisyon, 10 Ağustos barem kargo bedeli, KDV, stopaj ve %6 ekstra operasyon kesintisini otomatik düşerek ideal satış fiyatınızı bulun.',
    steps: [
      {
        title: '1. Tersine Hedef Satış Fiyatı Hesaplayıcı',
        desc: 'Ürünün birim alış maliyetini ve kazanmak istediğiniz net kâr marjını (%25 vb.) girin. Motor komisyon, kargo, KDV ve vergileri hesaba katarak Trendyol satış fiyatını anında hesaplar.',
        tip: 'Fiyat hesaplanırken %6 Ekstra Operasyon Oranı paydadan otomatik düşülür.',
        tag: 'Tersine Hesaplama'
      },
      {
        title: '2. Kargo Barem & Taşıyıcı Seçici',
        desc: '0-199₺, 200-349₺ veya 350₺+ kargo barem kademesini ve taşıyıcı firmanızı seçin. Barem desteği satış fiyatına göre dinamik uygulanır.',
        tip: '200-349₺ bareminde satıcıya sağlanan destek satış fiyatınızı daha rekabetçi yapmanızı sağlar.',
        tag: 'Barem Kargo'
      },
      {
        title: '3. 7 Satırlı Finansal Şelale (Waterfall)',
        desc: '1. Satış Fiyatı, 2. Ürün Alış (COGS), 3. Kargo Maliyeti, 4. Pazaryeri Komisyonu, 5. Stopaj Kesintisi (%1), 6. Net KDV, 7. Ekstra Operasyon (%6) ve Net Nakit Kâr dökümünü adım adım inceleyin.',
        tip: 'Her bir kesintinin TL ve yüzde payı şelalede açıkça gösterilir.',
        tag: 'Maliyet Şelalesi'
      },
      {
        title: '4. Buybox Rekabet Simülasyonu',
        desc: 'Rakip firmanın Trendyol fiyatını girin; o fiyata indiğinizde net kârınızın ve kâr marjınızın ne olacağını canlı simüle edin.',
        tip: 'Zararına rekabete girmeden önce Buybox simülasyonunu mutlaka çalıştırın.',
        tag: 'Buybox Testi'
      }
    ]
  },

  '/profit-margin-list': {
    pathname: '/profit-margin-list',
    title: 'Kâr Marjı Listesi',
    category: 'Fiyat & Marj',
    icon: Percent,
    summary: 'Ürünlerin liste fiyatı ile müşteri satış fiyatı arasındaki farkı görün, kâr marjlarını toplu olarak güncelleyin.',
    steps: [
      {
        title: '1. Liste Fiyatı vs Müşteri Fiyatı Kıyası',
        desc: 'Ürününüzün katalog liste fiyatı ile sepette uygulanan indirimli müşteri fiyatı arasındaki kâr marjı değişimini takip edin.',
        tip: 'Kupon ve indirim kampanyalarında marjınızın eksiye düşüp düşmediğini kontrol edin.',
        tag: 'Fiyat Kıyası'
      },
      {
        title: '2. Toplu Marj Güncelleme',
        desc: 'Seçtiğiniz ürünlerin kâr marjını tek tıkla %5, %10 artırarak yeni tavsiye edilen satış fiyatlarını listeleyin.',
        tip: 'Enflasyon veya maliyet artışlarında tüm ürünlerin fiyatını saniyeler içinde simüle edebilirsiniz.',
        tag: 'Toplu Güncelleme'
      }
    ]
  },

  '/marketing/ads': {
    pathname: '/marketing/ads',
    title: 'Reklamlarım & ROAS Dağıtım Motoru',
    category: 'Pazarlama & ROAS',
    icon: Megaphone,
    summary: 'Trendyol reklam faturalarınızı kaydedin; ROAS, TACoS ve sipariş başına düşen reklam payını net kârınıza yansıtın.',
    steps: [
      {
        title: '1. Reklam Faturaları Kaydı',
        desc: 'Dönem içinde Trendyol tarafından kesilen reklam ve sponsorlu ürün faturalarını sisteme kaydedin.',
        tip: 'Kaydedilen reklam tutarı Kontrol Paneli ve kârlılık raporlarında otomatik olarak siparişlere paylaştırılır.',
        tag: 'Fatura Girişi'
      },
      {
        title: '2. ROAS & TACoS Katsayıları',
        desc: 'Harcanan reklam bütçesinin kaç katı ciro ürettiğini (ROAS) ve cironun yüzde kaçının reklama gittiğini (TACoS) takip edin.',
        tip: 'ROAS 5x ve üzeri kampanyalar kârlı reklam performansına işaret eder.',
        tag: 'ROAS Analizi'
      }
    ]
  },

  '/tariffs/desi': {
    pathname: '/tariffs/desi',
    title: 'Kargo Desi Fiyatları (0-500 Desi)',
    category: 'Kargo Tarifeleri',
    icon: Boxes,
    summary: '10 kargo partnerinin 0-500 desi arasındaki 501 kademe fiyat listesini inceleyin, Excel ile toplu düzenleyin.',
    steps: [
      {
        title: '1. 501 Kademe Kargo Matrisi',
        desc: 'Trendyol Express, Aras, Yurtiçi, MNG, Sürat ve PTT kargonun 0\'dan 500 desiye kadar güncel fiyat skalasını listeleyin.',
        tip: 'Desi arttıkça kademeli fiyat geçişlerini tablo üzerinden kontrol edin.',
        tag: 'Desi Matrisi'
      },
      {
        title: '2. Excel İçe / Dışa Aktarım',
        desc: 'Kargo fiyat listesini tek tıkla Excel olarak indirin, anlaşmalı özel fiyatlarınızı girdikten sonra geri yükleyin.',
        tip: 'Excel yüklemesiyle binlerce desi kademesi anında güncellenir.',
        tag: 'Excel Düzenleme'
      }
    ]
  },

  '/tariffs/cargo-barem': {
    pathname: '/tariffs/cargo-barem',
    title: 'Kargo Barem Destek Matrisi',
    category: 'Kargo Tarifeleri',
    icon: Coins,
    summary: 'Trendyol 0-199₺, 200-349₺ ve 350₺+ kargo barem destek tutarlarını ve satıcı kargo paylarını yönetin.',
    steps: [
      {
        title: '1. Barem Kademeleri & Satıcı Desteği',
        desc: 'Sepet tutarına göre Trendyol\'un satıcıya sunduğu kargo desteği ve satıcının ödediği net kargo barem tutarlarını listeler.',
        tip: '200-349₺ arasındaki barem indirimleri fiyatlandırma motoruna otomatik entegre edilir.',
        tag: 'Barem Kademeleri'
      },
      {
        title: '2. Barem Açma / Kapatma Simülasyonu',
        desc: 'Mağazanızın barem desteğinden yararlanıp yararlanmadığını Ayarlar sayfasından belirleyebilir, buradaki matristen takip edebilirsiniz.',
        tip: 'Baremleri kapatırsanız ürün fiyatlandırma motoru tam kargo fiyatı üzerinden hesaplama yapar.',
        tag: 'Barem Durumu'
      }
    ]
  },

  '/tariffs/commission': {
    pathname: '/tariffs/commission',
    title: 'Ürün Komisyon Tarifesi',
    category: 'Pazaryeri Tarifeleri',
    icon: BadgePercent,
    summary: 'Trendyol\'un tüm kategorilerdeki standart komisyon oranlarını inceleyin, özel komisyonlarınızı tanımlayın.',
    steps: [
      {
        title: '1. Kategori Komisyon Arama',
        desc: 'Yüzlerce kategori arasından arama yaparak ürününüzün güncel standart komisyon oranını anında bulun.',
        tip: 'Kategori adı yazarak saniyeler içinde komisyon yüzdesini görebilirsiniz.',
        tag: 'Komisyon Arama'
      },
      {
        title: '2. Özel Anlaşmalı Komisyon Tanımlama',
        desc: 'Trendyol ile yaptığınız özel anlaşmalı indirimli komisyon oranlarını kategoriye özel olarak kaydedin.',
        tip: 'Özel komisyon tanımlandığında kârlılık motoru standart oran yerine özel oranınızı kullanır.',
        tag: 'Özel Oranlar'
      }
    ]
  },

  '/tariffs/plus': {
    pathname: '/tariffs/plus',
    title: 'Plus Komisyon Tarifesi',
    category: 'Pazaryeri Tarifeleri',
    icon: Sparkles,
    summary: 'Trendyol Plus üyesi müşterilerin siparişlerinde geçerli kademeli komisyon indirimlerini simüle edin.',
    steps: [
      {
        title: '1. Plus Komisyon Kademeleri',
        desc: 'Plus satışlarında uygulanan kademeli komisyon avantajlarını ve net kâra sağladığı ek marjı listeler.',
        tip: 'Plus siparişlerinde komisyon oranınız düşerek net kârınız artar.',
        tag: 'Plus Kademeleri'
      }
    ]
  },

  '/tariffs/badges': {
    pathname: '/tariffs/badges',
    title: 'Avantajlı Ürün Etiketi',
    category: 'Pazaryeri Tarifeleri',
    icon: Award,
    summary: 'Avantajlı Ürün Rozeti almak için gereken fiyat indirim eşiklerini ve kârlılığa etkisini simüle edin.',
    steps: [
      {
        title: '1. Rozet Fiyat İndirim Eşikleri',
        desc: 'Trendyol Avantajlı Ürün rozetini korumak için gereken minimum indirim yüzdesini ve net nakit kârınızı hesaplar.',
        tip: 'Rozet için fiyat kırmadan önce kâr marjınızın kabul edilebilir seviyede kaldığından emin olun.',
        tag: 'Rozet Eşikleri'
      }
    ]
  },

  '/settlement-desi-audit': {
    pathname: '/settlement-desi-audit',
    title: 'Hakediş & Desi Kontrol (İtiraz Motoru)',
    category: 'Mutabakat & Denetim',
    icon: FileCheck2,
    summary: 'Kargo faturalarındaki desi aşımlarını tespit edin, fazla kesintilere tek tıkla resmi itiraz dilekçesi kopyalayarak paranızı geri alın.',
    steps: [
      {
        title: '1. Desi Aşım Tespit Motoru',
        desc: 'Ürününüzün sistemdeki gerçek desisi ile kargo faturasında kesilen fahiş desi arasındaki farkları otomatik listeler.',
        tip: 'Kargonun 1 desi yerine 3 desi faturalandırdığı siparişleri kırmızı uyarıyla anında görün.',
        tag: 'Aşım Tespiti'
      },
      {
        title: '2. Tek Tıkla Resmi İtiraz Dilekçesi',
        desc: '"İtiraz Metnini Kopyala" butonuna basarak Trendyol Satıcı Paneli veya kargo firmasına gönderilmeye hazır resmi itiraz dilekçesi oluşturun.',
        tip: 'Dilekçe sipariş no, paket no, faturalanan desi ve hak edilen iade tutarını eksiksiz içerir.',
        tag: 'İtiraz Dilekçesi'
      },
      {
        title: '3. Kurtarılabilecek Toplam Tutar',
        desc: 'Hatalı desi kesintilerinden geri alabileceğiniz toplam nakit tutarı en üstteki sayaç kartında canlı izleyin.',
        tip: 'Düzenli itiraz yapan satıcılar kargo maliyetlerinin %15\'ini geri almaktadır.',
        tag: 'Geri Alınacak Tutar'
      }
    ]
  },

  '/reports/order-profitability': {
    pathname: '/reports/order-profitability',
    title: 'Finansal Raporlar',
    category: 'Raporlama',
    icon: FileSpreadsheet,
    summary: 'Sipariş, ürün, kategori ve pazaryeri bazlı detaylı finansal raporlarınızı inceleyin ve Türkçe Excel olarak indirin.',
    steps: [
      {
        title: '1. Kapsamlı Sipariş Kârlılık Tablosu',
        desc: 'Her siparişin brüt ciro, komisyon, kargo, net KDV, stopaj, %6 ekstra operasyon ve net kâr dökümünü sütun sütun listeler.',
        tip: 'Tarih ve mağaza filtresi uygulayarak dilediğiniz dönemi raporlayabilirsiniz.',
        tag: 'Sipariş Tablosu'
      },
      {
        title: '2. Arka Plan Asenkron Kuyruk & Export',
        desc: 'Binlerce siparişlik dev raporları sisteminizi yormadan arka planda hazırlar ve Excel / CSV olarak dışa aktarır.',
        tip: 'Rapor oluşturulurken diğer sayfalarda kesintisiz çalışmaya devam edebilirsiniz.',
        tag: 'Excel Export'
      }
    ]
  },

  '/customers': {
    pathname: '/customers',
    title: 'Müşterilerim & Sipariş Sadakati',
    category: 'Müşteri Yönetimi',
    icon: Users,
    summary: 'Mağazanızdan alışveriş yapan müşterilerin toplam sipariş adedi, harcama tutarları ve şehir dağılımını izleyin.',
    steps: [
      {
        title: '1. Müşteri Sipariş Geçmişi',
        desc: 'Müşterilerin ad, şehir, toplam sipariş sayısı ve bıraktığı toplam ciro miktarını listeler.',
        tip: 'En çok alışveriş yapan sadık müşterilerinizi tespit edin.',
        tag: 'Müşteri Listesi'
      }
    ]
  },

  '/alerts': {
    pathname: '/alerts',
    title: 'Uyarı Listesi & Anomali Tespiti',
    category: 'Risk Yönetimi',
    icon: AlertOctagon,
    summary: 'Zararına satılan siparişler, düşük marjlı ürünler ve alış maliyeti eksik kalemler için otomatik finansal erken uyarı sistemi.',
    steps: [
      {
        title: '1. Zararına Sipariş Uyarıları',
        desc: 'Komisyon, kargo ve vergi kesintileri sonrası eksiye düşen (zarar eden) siparişleri kırmızı bayrakla listeler.',
        tip: 'Zararına satılan ürünün fiyatını hemen artırarak zararı durdurun.',
        tag: 'Zarar Uyarısı'
      },
      {
        title: '2. Eksik Maliyetli Ürünler',
        desc: 'Alış maliyeti girilmediği için kârı sağlıklı hesaplanamayan ürünleri listeler.',
        tip: 'Listeden tek tıkla maliyet girerek uyarıyı çözebilirsiniz.',
        tag: 'Eksik Maliyet'
      }
    ]
  },

  '/stores': {
    pathname: '/stores',
    title: 'Mağazalarım & API Entegrasyonları',
    category: 'Entegrasyon',
    icon: Store,
    summary: 'Trendyol, Hepsiburada ve Amazon mağaza API anahtarlarınızı yönetin, canlı bağlantı testleri gerçekleştirin.',
    steps: [
      {
        title: '1. Mağaza API Bağlantısı',
        desc: 'Trendyol Satıcı Panelinden aldığınız App Key, App Secret ve Satıcı (Supplier) ID bilgilerinizi kaydedin.',
        tip: 'Şifrelenmiş güvenli veritabanında saklanır.',
        tag: 'API Girişi'
      },
      {
        title: '2. Canlı Bağlantı Testi',
        desc: '"Bağlantıyı Test Et" butonuna basarak API anahtarlarınızın doğru çalıştığını ve sipariş çekebildiğini anında doğrulayın.',
        tip: 'Yeşil rozet mağazanızın canlı ve senkron olduğunu gösterir.',
        tag: 'Bağlantı Testi'
      }
    ]
  },

  '/settings': {
    pathname: '/settings',
    title: 'Ayarlar (11 Modül)',
    category: 'Sistem Yapılandırması',
    icon: Settings,
    summary: 'Firma bilgileri, kargo baremleri, operasyon adetleri, %6 ekstra operasyon, %0.16 erken ödeme ve e-posta bildirimlerini yönetin.',
    steps: [
      {
        title: '1. 11 Kapsamlı Ayar Sekmesi',
        desc: 'Hesap, Genel, Kargo, Operasyon, Marj Uyarıları, Kesintiler & Sabit Giderler, E-Posta Bildirimleri, XML, Kullanıcılar, Abonelik ve Yedekleme sekmeleri.',
        tip: 'Her sekmedeki değişiklikler PostgreSQL veritabanına anında kalıcı olarak kaydedilir.',
        tag: '11 Sekme'
      },
      {
        title: '2. Kesintiler & Sabit Giderler (Ekstra Operasyon %6 & Erken Ödeme %0.16)',
        desc: 'Platform Hizmet Bedeli (₺13.19), Stopaj (%1), Koli, Fatura, Günlük Erken Ödeme (%0.16) ve Siparişin %6\'sı oranında Ekstra Operasyon kesintilerini tanımlayın.',
        tip: 'Burada tanımladığınız giderler tüm kârlılık motorlarına ve raporlara anında uygulanır.',
        tag: 'Gider Ayarları'
      },
      {
        title: '3. Kullanıcılar & Kâr Maskeleme (RBAC)',
        desc: 'Ekip çalışanlarınıza operatör yetkisi verin; maliyet ve net kâr alanlarını gizleyerek yetkisiz görmeleri engelleyin.',
        tip: 'Çalışanlarınız sadece sipariş paketleme ve kargo takibi yapabilir, şirket kârını göremez.',
        tag: 'Kâr Maskeleme'
      }
    ]
  },

  '/system/analytics': {
    pathname: '/system/analytics',
    title: 'Sayfa Analitiği & Tıklama Isı Haritası',
    category: 'Sistem & Kullanım',
    icon: BarChart3,
    summary: 'Panel sayfalarının ziyaret sıklığını, en çok kullanılan araçları ve tıklama ısı haritasını canlı izleyin.',
    steps: [
      {
        title: '1. Sayfa Ziyaret & Tıklama İstatistikleri',
        desc: 'Kullanıcılarınızın hangi sayfalarda daha çok vakit geçirdiğini ve hangi butonları kullandığını gösterir.',
        tip: 'Kullanım alışkanlıklarınıza göre iş akışlarınızı hızlandırın.',
        tag: 'Isı Haritası'
      }
    ]
  },

  '/system/crashes': {
    pathname: '/system/crashes',
    title: 'Çökme & Hata Takip Merkezi',
    category: 'Sistem Sağlığı',
    icon: ShieldAlert,
    summary: 'Sistemde oluşan API ve istemci hatalarını canlı loglayın, stack trace ile teşhis edip çözün.',
    steps: [
      {
        title: '1. Canlı Hata Günlüğü & Teşhis',
        desc: 'Oluşan teknik hataların mesajını, URL\'sini, oluştuğu dosya ve satır numarasını detaylıca listeler.',
        tip: 'Düzeltilen hataları "Çözüldü Olarak İşaretle" butonuyla arşivleyebilirsiniz.',
        tag: 'Hata Teşhisi'
      }
    ]
  }
};

export function PageGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentPathname = usePathname();
  const [selectedPath, setSelectedPath] = useState<string>('/dashboard');
  const [stepIndex, setStepIndex] = useState<number>(0);

  // Auto-detect current active page whenever modal opens or route changes
  useEffect(() => {
    if (open) {
      const match = Object.keys(PAGE_GUIDES).find(p => currentPathname === p || (p !== '/dashboard' && currentPathname.startsWith(p)));
      setSelectedPath(match || '/dashboard');
      setStepIndex(0);
    }
  }, [open, currentPathname]);

  if (!open) return null;

  const currentGuide = PAGE_GUIDES[selectedPath] || PAGE_GUIDES['/dashboard'];
  const steps = currentGuide.steps || [];
  const currentStep = steps[stepIndex] || steps[0];
  const Icon = currentGuide.icon || LayoutDashboard;

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

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-dark/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-border space-y-5 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-border gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary-tint-100 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-dark truncate">Sayfa Sanal Tur Rehberi</h3>
                <Badge variant="secondary" className="text-[10px] font-bold bg-primary-tint-50 text-primary border border-primary-tint-200">
                  📍 {currentGuide.title}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{currentGuide.summary}</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-gray-400 hover:text-dark hover:bg-canvas transition-colors cursor-pointer shrink-0"
            aria-label="Rehberi Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Page Switcher Selector Dropdown */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-canvas border border-border shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
            <Icon className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Tanıtılan Sayfa:</span>
          </div>

          <select
            value={selectedPath}
            onChange={(e) => {
              setSelectedPath(e.target.value);
              setStepIndex(0);
            }}
            className="px-3 py-1.5 rounded-xl border border-border text-xs font-black text-dark bg-white shadow-2xs focus:ring-2 focus:ring-primary cursor-pointer max-w-[280px] sm:max-w-xs truncate"
          >
            {Object.entries(PAGE_GUIDES).map(([path, guide]) => (
              <option key={path} value={path}>
                {guide.title} ({guide.category})
              </option>
            ))}
          </select>
        </div>

        {/* Interactive Step Card Body */}
        <div className="bg-canvas/50 p-4 sm:p-5 rounded-2xl border border-border space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 shadow-xs">
                {stepIndex + 1}
              </span>
              <h4 className="text-xs sm:text-sm font-black text-dark">{currentStep.title}</h4>
            </div>

            {currentStep.tag && (
              <Badge variant="default" className="text-[10px] font-bold bg-dark text-white shrink-0">
                {currentStep.tag}
              </Badge>
            )}
          </div>

          <p className="text-xs text-gray-700 leading-relaxed pl-8">
            {currentStep.desc}
          </p>

          {currentStep.tip && (
            <div className="ml-8 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Uzman İpucu: </strong>
                <span>{currentStep.tip}</span>
              </div>
            </div>
          )}

          {/* Quick Navigate to page if user is not already on it */}
          {currentPathname !== selectedPath && (
            <div className="pl-8 pt-1">
              <Link href={selectedPath} onClick={onClose}>
                <Button size="sm" variant="outline" className="text-xs h-7 font-bold gap-1 text-primary bg-white hover:bg-primary hover:text-white transition-all shadow-2xs">
                  <span>Bu Sayfaya Git</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-border shrink-0 gap-2">
          
          {/* Step Indicator Dots */}
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIndex(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  stepIndex === i ? "bg-primary w-5 sm:w-6" : "bg-gray-200 hover:bg-gray-300 w-2"
                }`}
                title={`Adım ${i + 1}`}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
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
                <span>Rehberi Tamamla</span>
              </Button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
