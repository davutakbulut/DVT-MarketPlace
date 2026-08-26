import { CargoBaremInput, CargoBaremResult } from './types';

// Official 10 Ağustos 2026 Trendyol Barem Tarife Tablosu (KDV Hariç)
export const TRENDYOL_BAREM_RATES: Record<string, { tier1: { discounted: number; standard: number }; tier2: { discounted: number; standard: number } }> = {
  'Aras': { tier1: { discounted: 48.33, standard: 80.83 }, tier2: { discounted: 79.16, standard: 86.24 } },
  'DHL eCommerce': { tier1: { discounted: 57.08, standard: 89.58 }, tier2: { discounted: 87.91, standard: 94.99 } },
  'Kolay Gelsin': { tier1: { discounted: 55.83, standard: 88.33 }, tier2: { discounted: 86.66, standard: 93.74 } },
  'PTT': { tier1: { discounted: 38.74, standard: 73.33 }, tier2: { discounted: 70.41, standard: 78.74 } },
  'Sürat': { tier1: { discounted: 54.58, standard: 87.08 }, tier2: { discounted: 85.41, standard: 92.49 } },
  'TEX': { tier1: { discounted: 38.74, standard: 73.33 }, tier2: { discounted: 70.41, standard: 78.74 } },
  'YK': { tier1: { discounted: 83.33, standard: 114.16 }, tier2: { discounted: 113.33, standard: 119.16 } },
};

/**
 * Calculates exact Trendyol shipping cost considering 10 Ağustos 2026 Barem Support System
 */
export function calculateCargoBaremCost(input: CargoBaremInput): CargoBaremResult {
  const { packetAmountExVat, carrier = 'TEX', isFastDeliveryCompliant = true, customStandardPrice = 45.0 } = input;
  const normalizedCarrier = Object.keys(TRENDYOL_BAREM_RATES).find(
    (k) => k.toLowerCase() === carrier.toLowerCase() || (k === 'TEX' && carrier.toLowerCase().includes('trendyol'))
  ) || 'TEX';

  const rates = TRENDYOL_BAREM_RATES[normalizedCarrier];

  // Tier 1: 0 - 199.99 TL
  if (packetAmountExVat >= 0 && packetAmountExVat < 200.0) {
    const feeExVat = isFastDeliveryCompliant ? rates.tier1.discounted : rates.tier1.standard;
    const savingExVat = rates.tier1.standard - rates.tier1.discounted;
    return {
      appliedTier: '0_199',
      tierLabel: '0 TL - 199,99 TL Barem Altı',
      isDiscounted: isFastDeliveryCompliant,
      shippingFeeExVat: feeExVat,
      shippingFeeIncVat: Math.round(feeExVat * 1.20 * 100) / 100,
      baremSupportSaving: isFastDeliveryCompliant ? Math.round(savingExVat * 1.20 * 100) / 100 : 0,
      carrier: normalizedCarrier,
    };
  }

  // Tier 2: 200 - 349.99 TL
  if (packetAmountExVat >= 200.0 && packetAmountExVat < 350.0) {
    const feeExVat = isFastDeliveryCompliant ? rates.tier2.discounted : rates.tier2.standard;
    const savingExVat = rates.tier2.standard - rates.tier2.discounted;
    return {
      appliedTier: '200_349',
      tierLabel: '200 TL - 349,99 TL Barem Altı',
      isDiscounted: isFastDeliveryCompliant,
      shippingFeeExVat: feeExVat,
      shippingFeeIncVat: Math.round(feeExVat * 1.20 * 100) / 100,
      baremSupportSaving: isFastDeliveryCompliant ? Math.round(savingExVat * 1.20 * 100) / 100 : 0,
      carrier: normalizedCarrier,
    };
  }

  // Tier 3: 350 TL ve Üzeri -> Standart Desi Matrisi
  return {
    appliedTier: 'standard_desi',
    tierLabel: '350 TL ve Üzeri (Desi Matrisi)',
    isDiscounted: false,
    shippingFeeExVat: customStandardPrice,
    shippingFeeIncVat: Math.round(customStandardPrice * 1.20 * 100) / 100,
    baremSupportSaving: 0,
    carrier: normalizedCarrier,
  };
}
