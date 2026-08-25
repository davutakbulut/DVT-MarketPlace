# 🚀 DVT-MarketPlace: Pazaryeri Finansal Analiz & Dinamik Fiyatlandırma Sistemi

Trendyol, Hepsiburada ve Amazon TR gibi platformlardaki satışların maliyetlerini toplu olarak yönetebileceğiniz, sipariş kârlılıklarını canlı olarak hesaplayabileceğiniz ve tersine matematiksel motorla hedef kâr marjına göre en uygun satış fiyatını belirleyebileceğiniz kurumsal e-ticaret finans platformu.

---

## ✨ Temel Özellikler

- 🏢 **Çok Kiracılı (Firma & Mağaza) Mimarisi**: Bir firmanın birden fazla pazaryerindeki mağazalarını tek panelden yönetebilme.
- 👥 **Gelişmiş Yetkilendirme (RBAC)**: Admin ve Kullanıcı rolleri, mağaza bazlı atama, kâr maskeleme (`can_view_profit: false`).
- 💵 **Gerçek Zamanlı Sipariş Kârlılık Takibi (Canlı Analiz)**: Günlük siparişlerin komisyon, kargo, stopaj, net KDV ve masraflar düşüldükten sonraki net kârını anlık hesaplama.
- 🏷️ **Tersine Fiyatlandırma Motoru (Ürün Fiyatlandırma)**: Ürün maliyeti, kargo desi ve kategori komisyonundan yola çıkarak istenilen kâr tutarı veya marjına göre satış fiyatı belirleme.
- 📊 **6 Kapsamlı Finansal Rapor**: Sipariş, Ürün, Kategori, İade Zarar, Reklam Kârlılık ve Kampanya Analizleri.
- 🎯 **3 Pazaryeri Tarife Simülatörü**: Ürün Komisyon Tarifesi (4 barem), Trendyol Plus İndirim Tarifesi, Avantajlı Ürün Etiketi analizi.
- 📦 **Hakediş & Desi Kontrolü**: Pazaryeri kargo kesintileri ile ürünün gerçek desi ölçümünü karşılaştırarak fazla kesintileri tespit etme.
- 🚨 **Akıllı Uyarı Sistemi**: Zararına satışlar, eksik maliyetler ve hakediş uyuşmazlıkları için anlık bildirimler.
- ⚡ **Modüler & Sıfır Çöküş Mimarisi**: Bir sayfadaki hatanın diğer sayfaları etkilemediği izole bileşenler ve yüksek performanslı Supabase veritabanı.

---

## 🛠️ Teknoloji Yığını

- **Frontend**: Next.js 14/15 App Router, TypeScript, Tailwind CSS, Radix UI / shadcn/ui, TanStack Query v5, TanStack Table
- **Backend / Veritabanı**: Supabase PostgreSQL 15 (Supavisor Connection Pooler), Row Level Security (RLS)
- **Grafikler**: Recharts & Canvas
- **Dışa/İçe Aktarım**: ExcelJS, PapaParse, Fast-XML-Parser, Web Workers

---

## 🚀 Kurulum ve Başlangıç

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

---
*Geliştirici: Davut Akbulut | DVT-MarketPlace*
