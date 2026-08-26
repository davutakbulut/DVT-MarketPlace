import { describe, it, expect } from 'vitest';
import { calculateCargoBaremCost, TRENDYOL_BAREM_RATES } from '../cargo-barem';

describe('Trendyol Kargo Barem Destek Sistemi (10 Ağustos 2026)', () => {
  it('TEX 0-199.99 TL bareminde 1 gün termin ile avantajlı indirimli fiyatı (38.74 TL) uygulamalı', () => {
    const res = calculateCargoBaremCost({
      packetAmountExVat: 150,
      carrier: 'TEX',
      isFastDeliveryCompliant: true,
    });
    expect(res.appliedTier).toBe('0_199');
    expect(res.isDiscounted).toBe(true);
    expect(res.shippingFeeExVat).toBe(38.74);
    expect(res.shippingFeeIncVat).toBe(46.49); // 38.74 * 1.20 = 46.488 -> 46.49
    expect(res.baremSupportSaving).toBe(41.51); // (73.33 - 38.74) * 1.20 = 41.508 -> 41.51
  });

  it('Aras Kargo 0-199.99 TL bareminde gecikmeli/1+ gün terminde standart ceza fiyatını (80.83 TL) uygulamalı', () => {
    const res = calculateCargoBaremCost({
      packetAmountExVat: 100,
      carrier: 'Aras',
      isFastDeliveryCompliant: false,
    });
    expect(res.appliedTier).toBe('0_199');
    expect(res.isDiscounted).toBe(false);
    expect(res.shippingFeeExVat).toBe(80.83);
    expect(res.baremSupportSaving).toBe(0);
  });

  it('Yurtiçi Kargo (YK) 200-349.99 TL bareminde indirimli 113.33 TL ve desteksiz 119.16 TL hesaplamalı', () => {
    const resDiscounted = calculateCargoBaremCost({
      packetAmountExVat: 280,
      carrier: 'YK',
      isFastDeliveryCompliant: true,
    });
    expect(resDiscounted.appliedTier).toBe('200_349');
    expect(resDiscounted.shippingFeeExVat).toBe(113.33);

    const resStandard = calculateCargoBaremCost({
      packetAmountExVat: 280,
      carrier: 'YK',
      isFastDeliveryCompliant: false,
    });
    expect(resStandard.shippingFeeExVat).toBe(119.16);
  });

  it('350 TL ve üzerindeki gönderilerde standart desi fiyatını uygulamalı', () => {
    const res = calculateCargoBaremCost({
      packetAmountExVat: 450,
      carrier: 'TEX',
      customStandardPrice: 52.0,
    });
    expect(res.appliedTier).toBe('standard_desi');
    expect(res.shippingFeeExVat).toBe(52.0);
  });
});
