/**
 * Trendyol Minimum Sipariş Adedi (Minimum Satış Adedi) Hesaplayıcısı
 * Fiyat baremlerine göre zorunlu minimum sipariş adedini ve sepet kârlılık çarpanını belirler.
 */

export interface MOQTier {
  minPrice: number;
  maxPrice: number;
  minQuantity: number;
  label: string;
}

export const TRENDYOL_MOQ_TIERS: MOQTier[] = [
  { minPrice: 0, maxPrice: 25.00, minQuantity: 6, label: '0₺ - 25₺ arası' },
  { minPrice: 25.0001, maxPrice: 35.00, minQuantity: 4, label: '25₺ - 35₺ arası' },
  { minPrice: 35.0001, maxPrice: 50.00, minQuantity: 3, label: '35₺ - 50₺ arası' },
  { minPrice: 50.0001, maxPrice: 75.00, minQuantity: 2, label: '50₺ - 75₺ arası' },
  { minPrice: 75.0001, maxPrice: Infinity, minQuantity: 1, label: '75₺ ve üzeri' },
];

/**
 * Ürün birim satış fiyatına göre Trendyol zorunlu minimum sipariş adedini döner.
 * @param unitPrice Ürün birim satış fiyatı (TL)
 * @returns Minimum sipariş adedi (1, 2, 3, 4, 6)
 */
export function getMinimumOrderQuantity(unitPrice: number): number {
  const price = Number(unitPrice) || 0;
  if (price <= 25.00) return 6;
  if (price <= 35.00) return 4;
  if (price <= 50.00) return 3;
  if (price <= 75.00) return 2;
  return 1;
}

/**
 * Minimum sipariş adedine göre stok yeterlilik kontrolü
 * @param currentStock Ürünün mevcut stoğu
 * @param minQuantity Minimum satış adedi
 */
export function checkMOQStockSufficiency(currentStock: number, minQuantity: number): {
  isSufficient: boolean;
  message?: string;
} {
  const stock = Number(currentStock) || 0;
  if (stock < minQuantity) {
    return {
      isSufficient: false,
      message: `Stok (${stock} Adet), Minimum Sipariş Adedinden (${minQuantity} Adet) az olduğu için ürün Trendyol'da TÜKENDİ sayılır.`
    };
  }
  return { isSufficient: true };
}
