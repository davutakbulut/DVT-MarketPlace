# 🗺️ DVT-MarketPlace: Yol Haritası ve Kilometre Taşları (ROADMAP_AND_MILESTONES.md)

## Faz 1: Veritabanı, Güvenlik ve Finansal Hesaplama Motoru
- [x] Supabase DDL SQL şemasının oluşturulması (17 tablo, RLS politikaları, tetikleyiciler)
- [x] `@dvt/financial-engine` saf TypeScript matematiksel motorunun yazılması
- [x] Vitest ile KDV, stopaj, kargo desi ve tersine fiyat denklemlerinin birim testlerinin tamamlanması

## Faz 2: Çekirdek Arayüz, Dashboard ve Canlı Analiz
- [x] Next.js 14/15 App Router temelinin, Tailwind renk tokenlarının ve Radix UI bileşenlerinin kurulması
- [x] Responsive layout (Masaüstü katlanabilir sidebar + sabit header, Mobil çekmece)
- [x] Anasayfa Dashboard (KPI kartları, kâr performans hunisi, 12 masraf dilimi pastası, 3 metrik kartı)
- [x] Canlı Analiz (Bugünkü siparişler akışı, çift tablo, satır içi iyimser maliyet editörü, %85-%100 zoom)
- [x] Ürün Fiyatlandırma (Tersine hedef fiyat hesaplayıcı, teslimat tipi seçici, komisyon otomatik tamamlama)

## Faz 3: Raporlar, Tarife Simülatörleri ve Hakediş Kontrolü
- [x] 6 Farklı Rapor (Sipariş, Ürün, Kategori, İade Zarar, Reklam RoAS, Kampanya)
- [x] 3 Simülasyon Modülü (Ürün Komisyon Tarifesi, Plus Komisyon Tarifesi, Avantajlı Ürün Etiketi)
- [x] Hakediş & Desi Kontrolü (Desi aşım tespiti ve pazaryeri kesinti mutabakatı)
- [x] Uyarı Listesi ve 12 Ayar Alt Sekmesi

## Faz 4: Toplu Veri İçe/Dışa Aktarım, Pazaryeri API Entegrasyonları ve Canlıya Alma
- [x] Excel/CSV/XML sürükle-bırak yükleyici ve akıllı kolon eşleştirici
- [x] Asenkron Excel rapor kuyruğu ve Supabase Storage imzalı link dağıtımı
- [x] Trendyol, Hepsiburada ve Amazon TR API adaptörleri
- [x] Özel alan adı (Custom Domain) dağıtımı ve GitHub CI/CD kurulumu
