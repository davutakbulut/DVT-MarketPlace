# 📋 DVT-MarketPlace: Adım Adım Detaylı Uygulama ve İşlem Sırası Planı (DETAILED_STEP_BY_STEP_EXECUTION_PLAN.md)

Bu belge, **DVT-MarketPlace** projesinin sıfırdan canlıya alınmasına kadar yapılacak **tüm teknik işlemleri, yazılacak dosyaları ve bunların kesin uygulanış sırasını** içermektedir.

---

## 🧭 İŞLEM SIRASI GENEL ÖZETİ (AŞAMALAR)

```
[AŞAMA 1: TEMEL ALTYAPI & VERİTABANI] (Adım 1 - 4)
  │
  ▼
[AŞAMA 2: SAF MATEMATİK & FİNANSAL MOTOR] (Adım 5 - 7)
  │
  ▼
[AŞAMA 3: TASARIM SİSTEMİ & ÇEKİRDEK LAYOUT] (Adım 8 - 11)
  │
  ▼
[AŞAMA 4: ANASAYFA & CANLI ANALİZ MODÜLLERİ] (Adım 12 - 14)
  │
  ▼
[AŞAMA 5: FİYATLANDIRMA & TARİFE SİMÜLATÖRLERİ] (Adım 15 - 17)
  │
  ▼
[AŞAMA 6: HAKEDİŞ, RAPORLAR & UYARI SİSTEMİ] (Adım 18 - 20)
  │
  ▼
[AŞAMA 7: AYARLAR, KULLANICI YÖNETİMİ & RBAC] (Adım 21 - 22)
  │
  ▼
[AŞAMA 8: TOPLU VERİ YÖNETİMİ, PAZARYERİ API & DEPLOYMENT] (Adım 23 - 25)
```

---

## 🛠️ ADIM ADIM DETAYLI UYGULAMA PLANI

---

### 🟢 AŞAMA 1: VERİTABANI, SUPABASE VE PROJE TEMELİNİN KURULMASI

#### 📌 ADIM 1: Next.js 14/15 Projesinin ve Paketlerin Kurulması
- **Yapılacak İşlem**: TypeScript, Tailwind CSS, ESLint, App Router ile modern Next.js yapısının başlatılması.
- **Yüklenecek Paketler**:
  - `@supabase/supabase-js`, `@supabase/ssr` (Veritabanı ve Auth)
  - `@tanstack/react-query`, `@tanstack/react-table`, `@tanstack/react-virtual` (Veri yönetimi & yüksek performanslı sanallaştırılmış tablolar)
  - `lucide-react`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-popover`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@radix-ui/react-select` (Tasarım bileşenleri)
  - `recharts` (Finansal grafikler ve Huni)
  - `sonner` (Toast bildirimleri)
  - `zustand` (İstemci tarafı mağaza/filtre durumu)
  - `exceljs`, `papaparse`, `fast-xml-parser` (Excel/CSV/XML içe/dışa aktarımı)
  - `clsx`, `tailwind-merge`, `class-variance-authority` (Stil yardımcıları)
- **Oluşturulacak Dosyalar**: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`.
- **Doğrulama Kriteri**: `npm install` ve `npm run build` komutlarının hatasız çalışması.

#### 📌 ADIM 2: Tailwind ve Tasarım Belirteçlerinin (Design Tokens) Yapılandırılması
- **Yapılacak İşlem**: `DESIGN_SYSTEM.md` dosyasındaki Mercan (`#FF7855`), Koyu Başlık (`#1A0C09`), Canvas (`#F8F9FA`) ve Kâr Marjı Rozet renklerinin Tailwind konfigürasyonuna eklenmesi.
- **Oluşturulacak Dosyalar**: `tailwind.config.ts`, `src/styles/globals.css`.
- **Doğrulama Kriteri**: Renk değişkenlerinin ve `tabular-nums` tipografi sınıflarının CSS'te tanımlanması.

#### 📌 ADIM 3: Supabase Veritabanı Şemasının Uygulanması (DDL Migration)
- **Yapılacak İşlem**: `supabase/migrations/20260826000000_initial_schema.sql` dosyasının Supabase (`dzgfhmsfvbwsxdddxxhb`) veritabanına uygulanması.
- **Uygulanacak Tablolar**:
  1. `companies` & `user_company_roles` (Firma ve Roller)
  2. `stores` & `user_store_permissions` (Mağazalar ve İzinler)
  3. `marketplace_categories` (Kategoriler & Komisyonlar)
  4. `products` & `product_cost_history` (Ürünler & Maliyet Geçmişi)
  5. `carrier_desi_rates` (Kargo Desi Baremleri)
  6. `orders` & `order_items` (Siparişler & Kalem Finansal Defteri)
  7. `daily_financial_rollups` (Anasayfa Hızlı Agregasyon Tablosu)
  8. `settlements` & `settlement_transactions` (Hakediş & Desi Bordroları)
  9. `commission_tariffs`, `plus_commission_tariffs`, `advantageous_badge_tariffs` (Simülasyon Tabloları)
  10. `system_alerts` & `company_settings` & `async_export_jobs` & `financial_audit_logs`
- **Doğrulama Kriteri**: Supabase Dashboard üzerinde 17 tablonun, indekslerin ve RLS politikalarının eksiksiz listelenmesi.

#### 📌 ADIM 4: Veritabanı Başlangıç Tohum Verilerinin (Seed Data) Eklenmesi
- **Yapılacak İşlem**: Melontik referansındaki Trendyol kategori ağacı (Kitap, Elektronik, Ev-Yaşam, Giyim vb.), kargo desi baremleri (Aras, Yurtiçi, Trendyol Express) ve demo firma/mağaza verilerinin SQL ile veritabanına yazılması.
- **Oluşturulacak Dosyalar**: `supabase/seed.sql`.
- **Doğrulama Kriteri**: `SELECT count(*) FROM marketplace_categories;` sorgusunun tüm kategorileri dönmesi.

---

### 🟢 AŞAMA 2: SAF MATEMATİKSEL MOTOR & BİRİM TESTLER

#### 📌 ADIM 5: `@dvt/financial-engine` Matematik Kütüphanesinin Yazılması
- **Yapılacak İşlem**: `MARKETPLACE_ENGINES.md` içerisinde formülleri verilen finansal hesaplama motorunun bağımsız, saf TypeScript fonksiyonları olarak yazılması.
- **Oluşturulacak Dosyalar**:
  - `src/packages/financial-engine/reverse-pricing.ts` (Tersine Hedef Satış Fiyatı Denklemi)
  - `src/packages/financial-engine/order-profit.ts` (Sipariş Net Kâr Şelalesi, KDV Mahsubu, Stopaj)
  - `src/packages/financial-engine/tariff-simulator.ts` (Plus ve 4 Barem Komisyon Kâr Farkı Hesaplayıcı)
  - `src/packages/financial-engine/desi-audit.ts` (Kargo Desi Aşım & Zarar Hesaplayıcı)
  - `src/packages/financial-engine/types.ts`
  - `src/packages/financial-engine/index.ts`
- **Doğrulama Kriteri**: Kütüphanenin sıfır harici bağımlılıkla saf matematiksel olarak çalışması.

#### 📌 ADIM 6: Finansal Motor Birim Testlerinin (Vitest) Yazılması
- **Yapılacak İşlem**: KDV oranları (%0 Kitap, %1 Gıda, %10 Tekstil, %20 Genel), Devreden KDV, komisyon KDV'si (%20), %1 stopaj ve sınır durumlar (asemptotik kâr marjı koruması) için otomatik testlerin yazılması.
- **Oluşturulacak Dosyalar**: `src/packages/financial-engine/__tests__/financial-engine.test.ts`.
- **Doğrulama Kriteri**: `npm test` çalıştırıldığında tüm testlerin yeşil (PASS) geçmesi.

---

### 🟢 AŞAMA 3: TASARIM SİSTEMİ, UI BİLEŞENLERİ & TEMEL LAYOUT

#### 📌 ADIM 7: Temel UI Bileşenlerinin (UI Primitives) Oluşturulması
- **Yapılacak İşlem**: Radix UI ve Tailwind ile katı tasarım kurallarına uygun temel bileşenlerin kodlanması.
- **Oluşturulacak Dosyalar**:
  - `src/components/ui/button.tsx` (Primary Coral, Secondary, Outline, Danger, Ghost)
  - `src/components/ui/input.tsx` (Metin, Para Birimi ve Yüzde Girişleri)
  - `src/components/ui/select.tsx` & `src/components/ui/dialog.tsx` & `src/components/ui/sheet.tsx`
  - `src/components/ui/badge.tsx` (Kâr marjı renkli rozetleri: Danger, Warning, Success, Excellent)
  - `src/components/ui/table.tsx` & `src/components/ui/card.tsx`
  - `src/components/feedback/WidgetErrorBoundary.tsx` (İzole Hata Yakalayıcı)
  - `src/components/feedback/ProtectedDialog.tsx` (Kaydedilmemiş Değişiklik Uyarılı Modal)
- **Doğrulama Kriteri**: Bileşenlerin tip güvenli ve erişilebilir (a11y) olarak render edilmesi.

#### 📌 ADIM 8: Çok Kiracılı Durum Yönetimi & TanStack Query Key Factory
- **Yapılacak İşlem**: Aktif firma, aktif mağaza ve mağaza bazlı izinleri yöneten Zustand store'unun ve mağaza sızıntısını engelleyen Query Key fabrikasının yazılması.
- **Oluşturulacak Dosyalar**:
  - `src/stores/useTenantStore.ts`
  - `src/stores/useTableDensityStore.ts` (%85, %90, %100 Tablo Zoom)
  - `src/lib/query-keys.ts`
  - `src/lib/formatters.ts` (`tr-TR` Para Birimi `₺` ve Yüzde `%` formatlayıcıları)
- **Doğrulama Kriteri**: Mağaza değişiminde eski sorguların otomatik iptal edilmesi.

#### 📌 ADIM 9: Ana Düzen (Layout): Header, Sidebar ve Mobil Çekmece
- **Yapılacak İşlem**: Masaüstünde katlanabilir/sabitlenebilir (260px / 72px) sidebar, üstte sabit header (Mağaza Seçici, Ülke Seçici, Tarih Seçici, Bildirim Çanı, Profil), mobilde soldan açılan çekmecenin kodlanması.
- **Oluşturulacak Dosyalar**:
  - `src/components/layout/Header.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/MobileNav.tsx`
  - `src/components/layout/StoreSelector.tsx`
  - `src/components/layout/CountrySelector.tsx`
  - `src/components/layout/DateRangePicker.tsx`
  - `src/components/layout/NotificationCenter.tsx`
  - `src/app/(dashboard)/layout.tsx`
- **Doğrulama Kriteri**: Hem masaüstü hem mobil ekranlarda duyarlı (responsive) ve pürüzsüz çalışması.

---

### 🟢 AŞAMA 4: ANASAYFA (DASHBOARD) & CANLI ANALİZ MODÜLLERİ

#### 📌 ADIM 10: Anasayfa Dashboard Modülü
- **Yapılacak İşlem**: Melontik ANASAYFA referansındaki tüm KPI ve grafiklerin kodlanması.
- **Geliştirilecek Bileşenler**:
  - `KpiGrid.tsx` (Toplam Ciro, Maliyeti Olan Ciro, Brüt Kâr, Net Kâr, Net Kâr / Satış Oranı, Net Kâr / Maliyet Oranı)
  - `ProfitWaterfallFunnel.tsx` (Ciro -> Kargo Düşülmüş -> Komisyon Düşülmüş -> Vergi Düşülmüş -> Net Kâr)
  - `CostDistributionChart.tsx` (12 Masraf Kalemi Pastası)
  - `MetricCards.tsx` (Ürün Metrikleri, Sipariş Metrikleri, İade Metrikleri, Reklam Metrikleri)
  - `MissingCostWarningBanner.tsx` (Eksik maliyetli ürünler uyarı barı & tıkla-düzelt modalı)
- **Oluşturulacak Dosyalar**: `src/modules/dashboard/*`, `src/app/(dashboard)/dashboard/page.tsx`.
- **Doğrulama Kriteri**: Tarih ve mağaza filtresi değiştiğinde verilerin 50ms altında agregasyon tablosundan yüklenmesi.

#### 📌 ADIM 11: Canlı Analiz (Live Performance) Modülü
- **Yapılacak İşlem**: Melontik CANLI ANALİZ sayfasındaki çift tablolu canlı akışın ve satır içi maliyet editörünün geliştirilmesi.
- **Geliştirilecek Bileşenler**:
  - `LiveKpiCards.tsx` (Bugünkü Net Kârım, Kâr/Maliyet Oranı, Kâr/Satış Oranı, Ciro)
  - `LiveProductsTable.tsx` (`Bugün Sipariş Alan Ürünler` tablosu: Satır içi maliyet, KDV ve desi dropdownları, eşleşen ürünlere uygula opsiyonu)
  - `LiveOrdersTable.tsx` (`Sipariş Kârlılık Analizi` tablosu: Sipariş no, tutar, kâr tutarı, kâr oranı, kâr marjı, detay butonu)
  - `TableDensityToolbar.tsx` (%85, %90, %100 Yakınlaştırma ve Tabloyu Genişlet butonları)
  - `OrderDetailSheet.tsx` (Sağdan açılan detaylı sipariş kârlılık şelalesi çekmecesi)
- **Oluşturulacak Dosyalar**: `src/modules/live-analysis/*`, `src/app/(dashboard)/live-analysis/page.tsx`.
- **Doğrulama Kriteri**: Maliyet hücresi değiştirildiğinde UI'ın anında iyimser (optimistic) güncellenmesi.

---

### 🟢 AŞAMA 5: ÜRÜN FİYATLANDIRMA & TARİFE SİMÜLATÖRLERİ

#### 📌 ADIM 12: Ürün Fiyatlandırma (Tersine Fiyat Motoru) Modülü
- **Yapılacak İşlem**: Melontik ÜRÜN FİYATLANDIRMA sayfasının modern arayüzle kodlanması.
- **Geliştirilecek Bileşenler**:
  - Fiyatlandırma Formu: Ürün Maliyeti, Teslimat Tipi (`Standart`, `Hızlı Teslimat`, `Bugün Kargoda`), İstenilen Kâr (`Tutara Göre ₺`, `Orana Göre %`), Kargo Desi, KDV Oranı (%0, %1, %10, %20), Kategori Arama & Komisyon Seçici.
  - Canlı Hesaplama Kartı: Önerilen Satış Fiyatı, Net Kâr, Komisyon Tutarı, Kargo Ücreti, Stopaj, Net KDV dökümü.
- **Oluşturulacak Dosyalar**: `src/modules/pricing-engine/*`, `src/app/(dashboard)/product-pricing/page.tsx`.
- **Doğrulama Kriteri**: Değerler girildikçe formun anında hatasız hedef liste fiyatını hesaplaması.

#### 📌 ADIM 13: Kâr Marjı Listesi Modülü
- **Yapılacak İşlem**: Melontik KAR MARJI LİSTESİ sayfasının geliştirilmesi.
- **Geliştirilecek Bileşenler**: TSF Liste Fiyatı vs Müşterinin Gördüğü Fiyat, Kâr eden / Zarar eden ürün filtreleri, Kategori ağacı filtresi, Toplu Güncelleme / "Pazaryerine Fiyat Güncelle" barı.
- **Oluşturulacak Dosyalar**: `src/modules/tariffs/profit-margin-list/*`, `src/app/(dashboard)/profit-margin-list/page.tsx`.
- **Doğrulama Kriteri**: Kâr marjı eşiklerine göre filtrelemenin ve satır içi liste fiyatı düzenlemenin çalışması.

#### 📌 ADIM 14: 3 Farklı Tarife & Rozet Simülatörü Modülü
- **Yapılacak İşlem**:
  1. **Ürün Komisyon Tarifesi**: 4 farklı fiyat baremi simülasyonu ve seçim anahtarları.
  2. **Plus Komisyon Tarifesi**: Trendyol Plus indirimli komisyon simülatörü ve `+₺16.57 Kâr Artışı` rozetleri.
  3. **Avantajlı Ürün Etiketi**: Avantaj, Çok Avantaj, Süper Avantaj rozet fiyat eşiklerindeki kârlılık simülasyonu.
- **Oluşturulacak Dosyalar**: `src/modules/tariffs/*`, `src/app/(dashboard)/tariffs/**/page.tsx`.
- **Doğrulama Kriteri**: Simüle edilen barem seçildiğinde net kâr farkının doğru hesaplanması.

---

### 🟢 AŞAMA 6: HAKEDİŞ KONTROLÜ, RAPORLAR & UYARI SİSTEMİ

#### 📌 ADIM 15: Hakediş & Desi Kontrolü Modülü
- **Yapılacak İşlem**: Melontik HAKEDİŞ DESİ KONTROL sayfasının geliştirilmesi.
- **Geliştirilecek Bileşenler**:
  - `Hakediş Kontrolü` sekmesi: Pazaryeri hakediş bordrosundaki kesintilerin doğrulanması.
  - `Desi Kontrolü` sekmesi: Siparişte faturalanan kargo desisi ile ürünün gerçek depo desisini kıyaslayıp kargo desi aşım zararlarını kırmızı uyarı rozetiyle listeleme.
- **Oluşturulacak Dosyalar**: `src/modules/settlements/*`, `src/app/(dashboard)/settlement-desi-audit/page.tsx`.
- **Doğrulama Kriteri**: Desi farkı olan siparişlerin net zarar tutarıyla listelenmesi.

#### 📌 ADIM 16: Kapsamlı 6 Finansal Rapor Modülü
- **Yapılacak İşlem**: Melontik ÜRÜN KARLILIK ANALİZİ sayfasındaki 6 farklı rapor görünümünün geliştirilmesi:
  1. `Sipariş Kârlılık Analizi`
  2. `Ürün Kârlılık Analizi`
  3. `Kategori Kârlılık Analizi`
  4. `İade Zarar Analizi` (Gidiş-Dönüş kargo ve operasyon kaybı)
  5. `Reklam Kârlılık Analizi` (RoAS ve reklam payı)
  6. `Kampanya Kârlılık Analizi` (İndirim kampanyalarının kârlılık etkisi)
- **Oluşturulacak Dosyalar**: `src/modules/reports/*`, `src/app/(dashboard)/reports/**/page.tsx`.
- **Doğrulama Kriteri**: Tarih aralığına göre 6 raporun filtrelenebilmesi ve asenkron Excel'e aktarılabilmesi.

#### 📌 ADIM 17: Uyarı Listesi (Alerts & Anomaly Center) Modülü
- **Yapılacak İşlem**: Melontik UYARI LİSTESİ sayfasının geliştirilmesi.
- **Geliştirilecek Bileşenler**: Zararına satışlar, %20 altı düşük marjlı siparişler, eksik maliyetler, hakediş uyuşmazlıkları için uyarı kartları ve sipariş analiz açılır modalı.
- **Oluşturulacak Dosyalar**: `src/modules/alerts/*`, `src/app/(dashboard)/alerts/page.tsx`.
- **Doğrulama Kriteri**: Anomali içeren siparişlerin filtrelenip detaylarının incelenebilmesi.

---

### 🟢 AŞAMA 7: AYARLAR (12 SEKME), KULLANICI YÖNETİMİ & RBAC

#### 📌 ADIM 18: 12 Alt Sekmeli Ayarlar Modülü
- **Yapılacak İşlem**: Melontik AYARLAR sayfasındaki 12 alt sekmenin eksiksiz kodlanması:
  1. `Hesap Ayarları` (Firma bilgileri, fatura adresi)
  2. `Trendyol API Bilgileri` (API Key, Secret, Supplier ID, Canlı Bağlantı Testi)
  3. `Hepsiburada API Bilgileri` (Merchant ID, Secret Key, Canlı Test)
  4. `Genel Ayarlar` (Varsayılan KDV, Stopaj %, Hizmet Bedeli)
  5. `Kargo Ayarları` (Kargo firmaları desi baremleri tablosu)
  6. `Operasyon Ayarları` (Paketleme, sarf malzeme maliyetleri)
  7. `Uyarılar` (Kâr marjı ve iade eşik ayarları)
  8. `Ürün Kârlılık Listesi`
  9. `Kâr Marjı Renklendirme` (Marj aralıklarına göre özel renk belirleme)
  10. `Eposta Bildirim Ayarları` (Günlük özet ve anlık zarar alarmları)
  11. `Toplu İşlemler` (Excel maliyet listesi ve XML etiket eşleme ekranı)
  12. `Ödeme Bilgileri` (Abonelik planı ve fatura geçmişi)
- **Oluşturulacak Dosyalar**: `src/modules/settings/*`, `src/app/(dashboard)/settings/**/page.tsx`.
- **Doğrulama Kriteri**: Ayarların kaydedilip Supabase veritabanına anında yansıması.

#### 📌 ADIM 19: Çok Kiracılı Kullanıcı & Rol Yönetimi Modülü
- **Yapılacak İşlem**: Admin panelinden yeni kullanıcı açma, mağaza atama, `can_view_profit`, `can_edit_costs`, `can_update_prices` ve `allowed_modules` izinlerini yönetme arayüzü.
- **Oluşturulacak Dosyalar**: `src/modules/settings/components/UsersAndRolesTab.tsx`, `src/components/auth/PermissionGate.tsx`.
- **Doğrulama Kriteri**: Kâr görme yetkisi kapalı kullanıcının ekranda maliyetleri görememesi.

---

### 🟢 AŞAMA 8: TOPLU VERİ İÇE/DIŞA AKTARIM, API ADAPTÖRLERİ & DEPLOYMENT

#### 📌 ADIM 20: Toplu Excel/CSV ve XML Yükleyici (Ingestion Engine)
- **Yapılacak İşlem**: 500 satırlık parçalarla (chunked) tarayıcıyı dondurmayan Web Worker tabanlı Excel yükleyici, Windows-1254 Türkçe ERP kodlama algılayıcı ve XML etiket eşleştirici.
- **Oluşturulacak Dosyalar**: `src/lib/ingestion/excel-importer.ts`, `src/lib/ingestion/xml-feed-sync.ts`.
- **Doğrulama Kriteri**: 10.000 satırlık ürün maliyet dosyasının saniyeler içinde hatasız yüklenmesi.

#### 📌 ADIM 21: Asenkron Rapor İndirme Kuyruğu (Async Exporter)
- **Yapılacak İşlem**: Melontik "Rapor İndirme Ekranı" modalı ile arka planda Excel üretimi (`ExcelJS`), ilerleme çubuğu ve Supabase Storage imzalı link oluşturulması.
- **Oluşturulacak Dosyalar**: `src/lib/export/excel-styler.ts`, `src/app/api/export/route.ts`.
- **Doğrulama Kriteri**: Rapor oluştur butonuna basıldığında ilerleme çubuğunun dolup dosyanın inmesi.

#### 📌 ADIM 22: Pazaryeri API Entegratörleri (Trendyol & Hepsiburada)
- **Yapılacak İşlem**: `IMarketplaceConnector` arayüzü ile Trendyol SAPI ve Hepsiburada API sipariş çekme, hakediş bordrosu alma ve fiyat güncelleme adaptörleri.
- **Oluşturulacak Dosyalar**: `src/lib/connectors/trendyol.ts`, `src/lib/connectors/hepsiburada.ts`.
- **Doğrulama Kriteri**: Test butonuyla pazaryerine bağlanıp siparişlerin çekilmesi.

#### 📌 ADIM 23: Nasıl Yapılır? / 8 Aşamalı Sanal Tur Modalı
- **Yapılacak İşlem**: Melontik üst bardaki "🧭 Nasıl Yapılır? / İzle Öğren" butonuna basıldığında açılan 8 turlu rehber modalının kodlanması.
- **Oluşturulacak Dosyalar**: `src/components/layout/VirtualTourModal.tsx`.
- **Doğrulama Kriteri**: Tur adımlarının tıklandığında interaktif rehberi açması.

#### 📌 ADIM 24: Üretim Dağıtımı (Production Deployment & Custom Domain)
- **Yapılacak İşlem**: Vercel / Node.js üzerine dağıtım, Supabase URL ve anahtarlarının bağlanması, özel alan adı (Custom Domain) DNS ve SSL yapılandırması.
- **Oluşturulacak Dosyalar**: `.env.example`, `.github/workflows/ci.yml`.
- **Doğrulama Kriteri**: Sistemin kendi alan adınızda canlıya alınması.

---

## 📊 İŞLEM SIRASI VE ZAMAN ÇİZELGESİ ÖZETİ

| Adım # | Kapsam | İlgili Dosyalar & Modüller | Bağımlılık |
| :--- | :--- | :--- | :--- |
| **1 - 4** | Temel Altyapı, Supabase DDL & Seed | `package.json`, `tailwind.config.ts`, `supabase/migrations/*` | Yok |
| **5 - 6** | Finansal Matematik Motoru & Testler | `@dvt/financial-engine`, `__tests__/*` | Adım 1 |
| **7 - 9** | Tasarım Sistemi, Layout & Navigasyon | `components/ui/*`, `Sidebar.tsx`, `Header.tsx` | Adım 2 |
| **10 - 11** | Anasayfa Dashboard & Canlı Analiz | `modules/dashboard/*`, `modules/live-analysis/*` | Adım 3, 5, 7 |
| **12 - 14** | Fiyatlandırma & 3 Tarife Simülatörü | `modules/pricing-engine/*`, `modules/tariffs/*` | Adım 5, 7 |
| **15 - 17** | Hakediş, 6 Rapor & Uyarı Listesi | `modules/settlements/*`, `modules/reports/*`, `modules/alerts/*` | Adım 10, 11 |
| **18 - 19** | 12 Ayar Sekmesi & Çok Kiracılı RBAC | `modules/settings/*`, `PermissionGate.tsx` | Adım 3, 8 |
| **20 - 23** | Toplu Excel/XML, API'ler & Sanal Tur | `lib/ingestion/*`, `lib/connectors/*`, `VirtualTourModal.tsx` | Adım 18 |
| **24** | Canlı Dağıtım & GitHub CI/CD | `ci.yml`, Vercel / Custom Domain | Adım 23 |

