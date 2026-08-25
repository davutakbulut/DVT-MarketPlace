# 🌐 DVT-MarketPlace: Canlı Önizleme ve Dağıtım Durumu (DEPLOYMENT_STATUS.md)

## 🔗 Canlı Erişim Bağlantıları
- **🌍 Cloudflare Public Tunnel (Her Yerden Erişilebilir)**: 
  👉 **[https://uncertainty-essential-group-con.trycloudflare.com](https://uncertainty-essential-group-con.trycloudflare.com)**
- **💻 Yerel Sunucu (Localhost)**: 
  👉 **[http://localhost:3005](http://localhost:3005)**
- **🐙 GitHub Deposu**: 
  👉 **[https://github.com/davutakbulut/DVT-MarketPlace](https://github.com/davutakbulut/DVT-MarketPlace)**

---

## 🛠️ Yapılan İşlemlerin Özeti (Ne İçin Yapıldı, Nasıl Çalışıyor, Ne Düzeltildi?)

### 1. Canlı Sunucu ve Cloudflare Tüneli Kurulumu
- **Ne İçin Yapıldı?**: Geliştirilen Next.js 15 uygulamasının hem yerel bilgisayarınızda hem de internet üzerinden herhangi bir tarayıcı veya mobil cihazdan anında test edilebilmesi için yapıldı.
- **Nasıl Çalışıyor?**: Yerel geliştirme sunucusu port `3005` üzerinde `Next.js 15 App Router` ile çalıştırıldı. `cloudflared` tünel servisi başlatılarak Cloudflare Global Edge ağı üzerinden güvenli `HTTPS` tüneli oluşturuldu.
- **Ne Düzeltildi?**: Port 3000'deki çakışma riski önlenerek port 3005'e taşındı ve SSL sertifikalı güvenli public tünel sağlandı.

---

## 📱 Aktif Canlı Sayfalar ve Rotalar

1. **[Anasayfa / Dashboard](https://uncertainty-essential-group-con.trycloudflare.com/dashboard)**: Ciro, Kâr Waterfall Hunisi, 12 Masraf Pastası, Eksik Maliyet Uyarı Barı.
2. **[Canlı Analiz](https://uncertainty-essential-group-con.trycloudflare.com/live-analysis)**: Bugünkü sipariş akışı, satır içi iyimser maliyet düzenleyici, %85-%100 yakınlaştırma.
3. **[Ürün Fiyatlandırma](https://uncertainty-essential-group-con.trycloudflare.com/product-pricing)**: Hedef kâr marjına göre tersine satış fiyatı hesaplayıcı.
4. **[Kâr Marjı Listesi](https://uncertainty-essential-group-con.trycloudflare.com/profit-margin-list)**: TSF vs Müşteri fiyatı marj dökümü.
5. **[Tarifeler & Plus Komisyon](https://uncertainty-essential-group-con.trycloudflare.com/tariffs/plus)**: Trendyol Plus indirimli komisyon kâr farkı simülatörü.
6. **[Hakediş & Desi Kontrol](https://uncertainty-essential-group-con.trycloudflare.com/settlement-desi-audit)**: Desi aşım tespiti ve kargo kesinti denetimi.
7. **[Sipariş Kârlılık Raporu](https://uncertainty-essential-group-con.trycloudflare.com/reports/order-profitability)**: Kalem kalem kârlılık defteri.
8. **[Uyarı Listesi](https://uncertainty-essential-group-con.trycloudflare.com/alerts)**: Zararına satış ve düşük marj alarmları.
9. **[Ayarlar & RBAC](https://uncertainty-essential-group-con.trycloudflare.com/settings)**: Genel KDV/stopaj, Trendyol API bağlantı testi ve Kullanıcı/Mağaza yetki matrisi.
