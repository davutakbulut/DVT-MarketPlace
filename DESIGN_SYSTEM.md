# 🎨 DVT-MarketPlace: Tasarım Sistemi ve Arayüz Standartları (DESIGN_SYSTEM.md)

## 1. Renk Paleti & Tasarım Belirteçleri (Design Tokens)

| Belirteç | Hex Kodu | Kullanım Alanı |
| :--- | :--- | :--- |
| **Canvas / Background** | `#F8F9FA` | Sayfa ana arka planı (Göz yormayan sıcak nötr gri) |
| **Card / Surface** | `#FFFFFF` | Kart, tablo ve açılır panel arka planları |
| **Primary Brand (Coral)** | `#FF7855` | Birincil butonlar, aktif menü göstergeleri, vurgular |
| **Primary Hover** | `#FF6238` | Buton hover durumu |
| **Primary Tint (Light)** | `#FFEBE6` | Seçili menü arka planı, açık vurgular |
| **Primary Dark Shade** | `#4D241A` | İkonlar ve koyu marka elemanları |
| **Heading Typography** | `#1A0C09` | Başlıklar, KPI değerleri, ana metinler |
| **Body Typography** | `#5C4E4B` | Açıklama metinleri, tablo hücreleri |
| **Muted Typography** | `#948785` | İkincil alt yazılar, pasif metinler |
| **Border Default** | `#EFEFEF` | Kart ve tablo kenarlıkları |
| **Table Divider** | `#F4EFEB` | Tablo satır ayırıcıları |

### Finansal Durum & Kâr Marjı Renk Standartları
- 🚨 **Zarar / Kritik (< 5% Kâr Marjı)**: Arka Plan `#FFF1F0`, Kenarlık `#FFA39E`, Metin `#CF1322`
- ⚠️ **Düşük Marj (5% - 15%)**: Arka Plan `#FFFBE6`, Kenarlık `#FFE58F`, Metin `#D48806`
- 🟢 **Sağlıklı Kâr (15% - 30%)**: Arka Plan `#F6FFED`, Kenarlık `#B7EB8F`, Metin `#389E0D`
- 💎 **Yüksek Kâr (> 30%)**: Arka Plan `#E6F7FF`, Kenarlık `#91CAFF`, Metin `#096DD9`

---

## 2. Tipografi Hiyerarşisi

- **Yazı Tipi Ailesi**: `Inter`, `Plus Jakarta Sans`, sans-serif
- **Sayısal Değerler**: Tüm finansal para birimi ve oranlar `font-variant-numeric: tabular-nums` veya `font-mono` ile render edilir (hizalama kayması önlenir).
- **Hiyerarşi Skalası**:
  - **KPI Display**: `28px - 32px` (font-bold)
  - **H1 (Sayfa Başlığı)**: `22px - 24px` (font-semibold, text-[#1A0C09])
  - **H2 (Kart Başlığı)**: `16px - 18px` (font-semibold, text-[#1A0C09])
  - **H3 (Alt Başlık / Modal Başlığı)**: `14px - 15px` (font-semibold)
  - **Body (Gövde Metni)**: `13px - 14px` (font-normal, text-[#5C4E4B])
  - **Tablo Hücresi**: `12px - 13px` (font-medium)
  - **Rozet / Badge**: `11px` (font-semibold, uppercase tracking-wide)
  - **Açıklama / Caption**: `10px - 11px` (font-normal, text-[#948785])

---

## 3. Katman (Z-Index) ve Overlay Hiyerarşisi

```
z-90: Global Toast Bildirimleri (Sonner Toast)
z-80: Kritik Onay / Silme Uyarı Modalları (ConfirmAlertModal)
z-70: Standart İş Akışı Modalları (Excel Yükleyici, Maliyet Editörü, Sanal Tur Modalı)
z-60: Dropdown Menüler, Popover Paneller, Tarih Seçiciler, Tooltip'ler
z-50: Mobil Navigasyon Drawer (Sol Açılır Menü)
z-40: Sabit Üst Header (Sticky Topbar)
z-20: Tablo Yapışkan İlk Kolonu (Sticky Product Column)
z-0:  Ana Sayfa Canvas & Grafikler
```

---

## 4. Responsive Navigasyon & Düzen Standartları

### Masaüstü (>= 1024px)
- **Sol Sidebar**:
  - Genişletilmiş mod: `260px`, ikon + etiket + alt menü açılırları.
  - Daraltılmış mod: `72px`, yalnızca ikonlar ve sağa açılan Radix tooltip'ler.
  - Pinlenme (Sabitlenme) durumu `localStorage` üzerinde saklanır.
- **Sabit Header**: Yükseklik `64px`, `top-0`, `z-40`, `backdrop-blur bg-white/95`. İçerik: Mağaza Seçici, Ülke/İhracat Seçici, Tarih Seçici, Bildirim Çanı, Profil Avatarı.

### Mobil (< 1024px)
- **Sabit Header**: Yükseklik `56px`, Hamburger menü butonu, aktif mağaza rozeti ve kullanıcı ikonu.
- **Sol Drawer**: Hamburger butonuna tıklandığında soldan yumuşakça kayarak açılan (`z-50`) tam navigasyon çekmecesi.
- **Tablolar**: Yatay kaydırılabilir, ürün ismi kolonu solda sabit (`z-20`), üstte Tablo Yoğunluk / Yakınlaştırma butonları (`85%`, `90%`, `100%`).

---

## 📱 KATI RESPONSIVE & MOBİL STANDARTLARI (MANDATORY RESPONSIVE RULES)

Tüm sayfalar ve bileşenler istisnasız aşağıdaki 4 ekran kırılımında (breakpoint) %100 kusursuz ve taşmasız çalışmalıdır:

### 1. Kırılım Noktaları (Breakpoints)
- 📱 **Mobil Küçük (< 480px)**: Tek kolonlu kartlar, kompakt butonlar, yatay kaydırılabilir yapışkan başlıklı tablolar (`table-sticky-first-col`).
- 📱 **Mobil Standart & Tablet Dikey (480px - 767px)**: 2 kolonlu KPI gridleri, soldan açılan tam çekmece (drawer).
- 💻 **Tablet Yatay & Küçük Laptop (768px - 1023px)**: 3 kolonlu metrikler, daraltılabilir üst bar araçları.
- 🖥️ **Masaüstü & Geniş Ekran (>= 1024px)**: 260px sabit/katlanabilir sol sidebar, 6 kolonlu KPI panelleri, yan yana form ve sonuç kartları.

### 2. Tablo Duyarlılık (Responsive Table) Kuralları
- Tüm veri tabloları `<div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">` ile sarılmalıdır.
- İlk sütun (Ürün / Barkod) mobilde `table-sticky-first-col` ile solda sabit kalmalı, diğer sütunlar sağa doğru akıcı şekilde kaydırılabilmelidir.
- Mobilde dokunma alanları minimum `36px - 44px` yüksekliğinde olmalı, yakınlaştırma (`%85`, `%90`, `%100`) butonları her zaman erişilebilir olmalıdır.

### 3. Header & Navigasyon Kuralları
- Header yüksekliği mobilde `56px`, masaüstünde `64px` olmalı, asla yatay taşmaya (`overflow-x`) neden olmamalıdır.
- Mobil cihazlarda sol sidebar gizlenmeli; hamburger menü tıklandığında soldan yumuşakça kayarak açılan (`z-50`) mobil çekmece devreye girmelidir.
