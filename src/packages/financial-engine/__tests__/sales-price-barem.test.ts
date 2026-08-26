import { describe, it, expect } from 'vitest';
import { ReversePricingEngine } from '../reverse-pricing';
import { OrderProfitEngine } from '../order-profit';

describe('Satış Tutarı Bazlı Kargo Barem Hesaplama', () => {
  it('Satış tutarı 0 - 199.99 TL bareminde kaldığında indirimli TEX ₺38.74 (+KDV ₺46.49) kargo maliyeti uygulanmalı', () => {
    const res = ReversePricingEngine.calculate({
      cogs: 50,
      costVatRate: 20,
      saleVatRate: 20,
      desi: 1,
      carrier: 'TEX',
      isFastDeliveryCompliant: true,
      commissionRate: 15,
      targetMode: 'margin_percent',
      targetValue: 20,
    });
    expect(res.targetSalePrice / 1.20).toBeLessThan(200);
    expect(res.breakdown.shippingFee).toBe(46.49); // 38.74 * 1.20 = 46.49
  });

  it('Satış tutarı 200 - 349.99 TL baremine çıktığında otomatik olarak 2. Kademe (₺70.41 +KDV ₺84.49) uygulanmalı', () => {
    const res = ReversePricingEngine.calculate({
      cogs: 80,
      costVatRate: 20,
      saleVatRate: 20,
      desi: 1,
      carrier: 'TEX',
      isFastDeliveryCompliant: true,
      commissionRate: 18,
      targetMode: 'margin_percent',
      targetValue: 20,
    });
    expect(res.targetSalePrice / 1.20).toBeGreaterThanOrEqual(200);
    expect(res.targetSalePrice / 1.20).toBeLessThan(350);
    expect(res.breakdown.shippingFee).toBe(84.49); // 70.41 * 1.20 = 84.49
  });

  it('Sipariş kârlılığında ciroya göre otomatik kargo maliyeti atanmalı', () => {
    const orderRes = OrderProfitEngine.calculate({
      unitSalePrice: 150,
      unitCostPrice: 60,
      quantity: 1,
      saleVatRate: 20,
      costVatRate: 20,
      commissionRate: 15,
      serviceFeeShare: 13.19,
      carrier: 'TEX',
      isFastDeliveryCompliant: true,
    });
    expect(orderRes.shippingFee).toBe(46.49);
    expect(orderRes.baremSaving).toBe(41.51);
  });
});
