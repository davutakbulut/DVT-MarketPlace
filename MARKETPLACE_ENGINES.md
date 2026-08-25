# 🧮 DVT-MarketPlace: Finansal & Fiyatlandırma Matematiksel Motorları (MARKETPLACE_ENGINES.md)

## 1. Tersine Hedef Satış Fiyatı Hesaplama Motoru (Ürün Fiyatlandırma)

### Değişkenler:
- C: Ürün Alış/Üretim Maliyeti (KDV Dahil COGS)
- V_cost: Maliyet KDV Oranı (%0, %1, %10, %20)
- V_sale: Satış KDV Oranı (%0, %1, %10, %20)
- S: Kargo Desi Taşıma Bedeli (KDV Dahil)
- K: Pazaryeri Kategori Komisyon Oranı (% KDV Hariç)
- F: Sabit Pazaryeri Hizmet Bedeli (TL KDV Dahil, Varsayılan: 8.49 TL)
- W: Stopaj Kesintisi Oranı (% Varsayılan: %1)
- E: Ekstra Paketleme / Sarf Gideri (TL KDV Dahil)
- M_sale: Hedef Kâr Marjı (% Satış Fiyatı Üzerinden) VEYA P_target: Hedef Net Nakit Kâr (TL)

### Kapalı Form Matematiksel Denklem:
Hedef Satış Fiyatı (X) = (C + S + F + E + P_target - beta_vat) / (1 - ((K * 1.20) / 100 + W / (100 * (1 + V_sale/100)) + alpha_vat + M_sale / 100))

Burada:
- alpha_vat = max(0, (1 - 1 / (1 + V_sale/100)) - (K * 0.20) / 100)
- beta_vat = COGS_KDV + Kargo_KDV + Hizmet_Bedeli_KDV + Ek_Maliyet_KDV

---

## 2. Sipariş Kalemi Net Kâr Şelalesi (Waterfall)

1. Brüt Satış Geliri = P * Q
2. Toplam Ürün Maliyeti = C * Q
3. Pazaryeri Komisyonu = P * Q * ((K * 1.20) / 100)
4. Kargo Taşıma Ücreti = CarrierMatrix(Desi)
5. Hizmet Bedeli Payı = F / N_items
6. Stopaj Kesintisi = (P * Q / (1 + V_sale/100)) * (W / 100)
7. Satış KDV'si = P * Q - (P * Q / (1 + V_sale/100))
8. Girdi KDV'si = Maliyet_KDV + Kargo_KDV (%20) + Komisyon_KDV (%20) + Hizmet_KDV (%20)
9. Devlete Ödenecek Net KDV = max(0, Satış_KDV - Girdi_KDV)
10. Toplam Kesinti & Maliyet = COGS + Komisyon + Kargo + Hizmet + Stopaj + Net_KDV + Ekstra
11. Net Kâr (TL) = Brüt Satış Geliri - Toplam Kesinti & Maliyet
12. Kâr Marjı (%) = (Net Kâr / Brüt Satış Geliri) * 100
13. Kâr Oranı / Markup (%) = (Net Kâr / Toplam Ürün Maliyeti) * 100

---

## 3. Ürün & Plus Komisyon Tarifesi Simülatörü

Trendyol Plus veya baremli komisyon tarifelerinde, fiyat indirildiğinde komisyon oranı düşer (Örn: 250 TL'de %18 iken, 213.74 TL ve altında %12).
Simülatör her fiyat baremi için kâr farkını hesaplar:
Delta_Kâr = Net_Kâr(P_barem, K_indirimli) - Net_Kâr(P_guncel, K_standart)
Eğer fiyat düşmesine rağmen komisyon avantajı sayesinde net nakit kâr artıyorsa, UI üzerinde yeşil `+₺16.57 Kâr Artışı (%7.75)` rozeti gösterilir.

---

## 4. Hakediş & Desi Farkı Denetim Motoru

- Delta_Desi = Desi_fatura - Desi_katalog
- Eğer Delta_Desi > 0 ise:
  Kargo Desi Farkı Zararı = KargoÜcreti(Desi_fatura) - KargoÜcreti(Desi_katalog)
Sistem bu farkları anında tespit ederek "Hakediş & Desi Kontrol" tablosunda kırmızı uyarı etiketi ve kesinti tutarı olarak listeler.
