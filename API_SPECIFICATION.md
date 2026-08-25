# 🔌 DVT-MarketPlace: API ve Entegrasyon Spesifikasyonu (API_SPECIFICATION.md)

## 1. Mimari Tasarım & Uç Noktalar

### 1.1 Senkron Olmayan (Non-Blocking) İstek Prensibi
Tüm harici pazaryeri senkronizasyonları ve büyük veri dışa aktarımları anında `HTTP 202 Accepted` döner. İstemciye dönen `jobId` üzerinden arka plan durumu sorgulanır.

---

## 2. API Uç Noktaları

| Rota | Metot | Açıklama | Yetki |
| :--- | :--- | :--- | :--- |
| `/api/auth/session` | GET | Aktif kullanıcı oturumu ve firma rollerini döner | Authenticated |
| `/api/products/update-cost` | POST | Canlı Analiz için ürün birim maliyetini günceller | `can_edit_costs` |
| `/api/pricing/calculate` | POST | Tersine hedef fiyat hesaplaması yapar | Public/Auth |
| `/api/sync/trigger` | POST | Pazaryerinden sipariş/ürün senkronizasyonunu tetikler | Admin |
| `/api/export/create-job` | POST | Asenkron Excel raporu oluşturma kuyruğuna iş ekler | `can_export_reports` |
| `/api/export/status/:jobId` | GET | Dışa aktarma durumunu ve imzalı indirme URL'sini döner | Authenticated |
| `/api/tariffs/apply-tier` | POST | Seçilen komisyon veya rozet baremini toplu uygular | `can_update_prices` |

---

## 3. Harici Pazaryeri Adaptörleri

### 3.1 Trendyol Supplier API (SAPI)
- **Kimlik Doğrulama**: HTTP Basic Auth `Base64(apiKey:apiSecret)`
- **Sipariş Uç Noktası**: `GET /sapigw/suppliers/{supplierId}/orders`
- **Hakediş Uç Noktası**: `GET /sapigw/suppliers/{supplierId}/finance/settlements`
- **Fiyat Güncelleme**: `POST /sapigw/suppliers/{supplierId}/v2/products/price-and-inventory`
- **Rate Limit Koruması**: Token bucket algoritması ile dakikada maksimum 200 istek.
