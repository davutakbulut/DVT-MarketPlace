# 🏗️ DVT-MarketPlace: Sistem Mimarisi ve Modülerlik Kılavuzu (ARCHITECTURE.md)

## 1. Genel Bakış ve Mimari Vizyon
**DVT-MarketPlace**, Türkiye'deki e-ticaret pazaryerlerinde (Trendyol, Hepsiburada, Amazon TR vb.) satış yapan firmaların maliyetlerini, komisyonlarını, kargo desi baremlerini, platform kesintilerini ve vergilerini hatasız şekilde hesaplayan, sipariş kârlılıklarını canlı olarak takip eden ve tersine matematiksel motor ile hedef kâr marjına göre satış fiyatı belirleyen kurumsal bir finansal zeka ve yönetim platformudur.

---

## 2. Temel Mimari Prensipler

### 2.1 Modüler Ada (Vertical Slice) Mimarisi
Sistem, Next.js 14/15 App Router üzerinde dikey dilimler (vertical domain slices) halinde yapılandırılmıştır. Her modül (`dashboard`, `live-analysis`, `pricing-engine`, `tariffs`, `reports`, `settlements`, `alerts`, `settings`) tamamen bağımsızdır:
- Her modülün kendi özel bileşenleri (`components/`), hook'ları (`hooks/`), servis çağrıları (`services/`) ve tip tanımları (`types/`) bulunur.
- Bir sayfadaki veya modüldeki hata ya da harici API gecikmesi diğer sayfaları asla etkilemez.
- Birden fazla geliştirici kendi modüllerinde eşzamanlı çalışabilir, kod çakışması (merge conflict) riski minimuma indirilmiştir.

### 2.2 Katmanlı Hata İzolasyonu (Hierarchical Error Boundaries)
Sistem 4 kademeli Hata Yakalama (Error Boundary) hiyerarşisine sahiptir:
1. **Root App Error Boundary**: Global çöküşleri engeller, sistemin ayakta kalmasını sağlar.
2. **Page Route Error Boundary**: İlgili sayfa rotasını izole eder.
3. **Module Section Boundary**: Tablo, filtre barı veya grafik alanlarını birbirinden ayırır.
4. **Individual Widget Error Boundary**: Her KPI kartı, huni grafiği ve maliyet pastası kendi `<WidgetErrorBoundary>` kapsayıcısına sahiptir. Bir grafiğin veri hatası vermesi durumunda diğer tüm kartlar ve tablolar %100 çalışmaya devam eder; hata veren widget içinde "Yeniden Dene" butonu sunulur.

### 2.3 Çok Kiracılı (Multi-Tenant) ve Firma Bazlı Yapı
- **Firma (Company)**: En üst seviye tüzel kişilik organizasyonudur.
- **Mağaza (Store / Marketplace Account)**: Bir firmanın aynı veya farklı pazaryerlerindeki birden fazla mağazasıdır (Örn: Trendyol Kozmetik Mağazası, Trendyol Tekstil Mağazası, Hepsiburada Mağazası).
- **Kullanıcı Rolleri (RBAC)**:
  - **Admin**: Firma sahibi veya tam yetkili yönetici. Tüm mağazaları, kullanıcı davetlerini, mağaza bazlı izinleri, API anahtarlarını ve faturalandırmayı yönetir.
  - **Kullanıcı (User)**: Firma bünyesindeki operatör veya personel. Yalnızca admin tarafından kendisine atanan mağazaları ve izin verilen sayfaları/modülleri görebilir.
  - **Finansal Maskeleme (`can_view_profit: false`)**: Bir kullanıcıya kâr görme yetkisi verilmediğinde, veritabanı seviyesinde maliyet ve kâr kolonları maskelenir, kullanıcı sadece ciro ve adetleri görebilir.

---

## 3. Dizin Yapısı (Project Directory Tree)

```
DVT-MarketPlace/
├── src/
│   ├── app/                               # Next.js 14/15 App Router (İnce Koordinasyon Katmanı)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                 # Sabit Header + Katlanabilir Sidebar + Tenant Provider
│   │   │   ├── page.tsx                   # Redirect -> /dashboard
│   │   │   ├── dashboard/page.tsx         # Anasayfa (KPIs, Huni, 12 Masraf Dilimi, 3 Metrik Kartı)
│   │   │   ├── live-analysis/page.tsx     # Canlı Analiz (Çift Tablo, Canlı Maliyet Editörü)
│   │   │   ├── product-pricing/page.tsx   # Ürün Fiyatlandırma (Ters Fiyat Hesaplama Motoru)
│   │   │   ├── profit-margin-list/page.tsx# Kâr Marjı Listesi (Liste Fiyatı vs Müşteri Fiyatı)
│   │   │   ├── tariffs/
│   │   │   │   ├── commission/page.tsx    # Ürün Komisyon Tarifesi (4 Fiyat Aralığı Simülasyonu)
│   │   │   │   ├── plus/page.tsx          # Plus Komisyon Tarifesi (Trendyol Plus İndirim Simülatörü)
│   │   │   │   └── badges/page.tsx        # Avantajlı Ürün Etiketi (Avantaj, Çok Avantaj, Süper Avantaj)
│   │   │   ├── settlement-desi-audit/page.tsx # Hakediş & Desi Kontrolü (Desi Farkı & Kesinti Denetimi)
│   │   │   ├── alerts/page.tsx            # Uyarı Listesi (Zararına Satış, Eksik Maliyet, Desi Farkı)
│   │   │   ├── reports/
│   │   │   │   ├── order-profitability/page.tsx
│   │   │   │   ├── product-profitability/page.tsx
│   │   │   │   ├── category-profitability/page.tsx
│   │   │   │   ├── return-loss/page.tsx
│   │   │   │   ├── ads-profitability/page.tsx
│   │   │   │   └── campaign-profitability/page.tsx
│   │   │   └── settings/                  # 12 Ayar Sekmesi
│   │   │       ├── account/page.tsx
│   │   │       ├── integrations/page.tsx
│   │   │       ├── general/page.tsx
│   │   │       ├── carriers/page.tsx
│   │   │       ├── operations/page.tsx
│   │   │       ├── alerts/page.tsx
│   │   │       ├── users/page.tsx
│   │   │       └── billing/page.tsx
│   │   └── api/
│   │       ├── webhooks/
│   │       ├── sync/
│   │       └── export/
│   ├── modules/                           # Dikey Bağımsız Domain Modülleri
│   │   ├── dashboard/
│   │   ├── live-analysis/
│   │   ├── pricing-engine/
│   │   ├── tariffs/
│   │   ├── settlements/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── shared/
│   ├── packages/
│   │   └── financial-engine/              # Saf TypeScript Finansal Hesaplama Kütüphanesi
│   │       ├── index.ts
│   │       ├── reverse-pricing.ts
│   │       ├── vat-calculator.ts
│   │       ├── commission-simulator.ts
│   │       └── return-loss.ts
│   ├── components/
│   │   ├── ui/                            # Temel UI Primitives (Button, Table, Dialog, Sheet, Badge vb.)
│   │   ├── layout/                        # Header, Sidebar, StoreSelector, CountrySelector, NotificationCenter
│   │   ├── feedback/                      # ErrorBoundary, Skeletons, ProtectedDialog
│   │   └── auth/                          # PermissionGate
│   ├── stores/                            # Zustand UI State (useTenantStore, useTableDensityStore)
│   └── lib/
│       ├── supabase/                      # Supabase Client, Server & SSR Config
│       ├── query-keys.ts                  # Hiyerarşik TanStack Query Key Factory
│       ├── formatters.ts                  # tr-TR Para ve Yüzde Formatlayıcıları
│       └── utils.ts
```

---

## 4. İstemci Tarafı Önbellek ve Veri Akış Mimarisi

### 4.1 TanStack Query v5 Key Hiyerarşisi
Pazaryeri ve mağaza değişimlerinde veri sızıntısını ve eski veri kalıntılarını önlemek için katı anahtar hiyerarşisi uygulanır:
```typescript
queryKeys.dashboard(companyId, storeId, dateRange, filters);
queryKeys.liveOrders(companyId, storeId, activeDate, filters);
queryKeys.pricingEngine(companyId, storeId, categoryId, targetMode);
queryKeys.reports(companyId, storeId, reportType, dateRange, filters);
```
Kullanıcı üst bardaki mağaza seçiciden mağaza değiştirdiği anda:
1. Eski mağazaya ait devam eden tüm sorgular (`queryClient.cancelQueries`) anında iptal edilir.
2. Yeni mağazanın verileri yüklenirken UI kilitlenmez, pürüzsüz skeleton geçişi sağlanır.

### 4.2 İyimser Güncellemeler (Optimistic Updates)
Canlı Analiz tablosunda ürün maliyeti değiştirildiğinde:
1. UI anında yeni kâr ve marj değerleriyle güncellenir.
2. Arka planda Supabase'e yazılır.
3. Sunucu tarafında hata oluşursa önceki durum otomatik geri yüklenir ve kırmızı toast bildirimi gösterilir.

---

## 5. Sıfır Statik Veri Garantisi
Sistemde kategori komisyon oranları, kargo desi baremleri, para birimi kurları, mağaza bilgileri, ürünler, siparişler ve ayarlar dahil **hiçbir veri statik veya hardcoded değildir**. Tüm veriler Supabase PostgreSQL veritabanındaki tablolardan dinamik olarak çekilir ve yönetilir.
