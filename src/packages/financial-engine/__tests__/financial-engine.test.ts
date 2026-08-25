import { describe, it, expect } from 'vitest';
import { ReversePricingEngine } from '../reverse-pricing';
import { OrderProfitEngine } from '../order-profit';
import { TariffSimulator } from '../tariff-simulator';
import { DesiAuditEngine } from '../desi-audit';

describe('Financial Engine Tests', () => {
  it('calculates reverse target price accurately for 20% margin target', () => {
    const result = ReversePricingEngine.calculate({
      cogs: 100,
      costVatRate: 20,
      saleVatRate: 20,
      desi: 1,
      shippingFee: 45,
      commissionRate: 18,
      serviceFee: 8.49,
      withholdingRate: 1,
      extraCost: 5,
      targetMode: 'margin_percent',
      targetValue: 20,
    });

    expect(result.targetSalePrice).toBeGreaterThan(158.49);
    expect(result.profitMarginPercent).toBeCloseTo(20, 0);
    expect(result.netProfit).toBeGreaterThan(0);
  });

  it('handles 0% VAT (Kitap) exemption correctly without negative tax bleed', () => {
    const result = ReversePricingEngine.calculate({
      cogs: 50,
      costVatRate: 0,
      saleVatRate: 0,
      desi: 1,
      shippingFee: 40,
      commissionRate: 15,
      serviceFee: 8.49,
      targetMode: 'cash_amount',
      targetValue: 25,
    });

    expect(result.breakdown.netVatPayable).toBe(0);
    expect(result.netProfit).toBeCloseTo(25, 0);
  });

  it('calculates order line item profit waterfall correctly', () => {
    const item = OrderProfitEngine.calculate({
      unitSalePrice: 300,
      unitCostPrice: 100,
      quantity: 1,
      saleVatRate: 20,
      costVatRate: 20,
      commissionRate: 18,
      shippingFee: 45,
      serviceFeeShare: 8.49,
    });

    expect(item.grossRevenue).toBe(300);
    expect(item.cogs).toBe(100);
    expect(item.commissionAmount).toBeCloseTo(300 * 0.18 * 1.20, 1);
    expect(item.netProfit).toBeGreaterThan(0);
    expect(item.profitMarginPercent).toBeGreaterThan(0);
  });

  it('simulates Plus commission discount advantages', () => {
    const sim = TariffSimulator.simulateTier({
      unitCostPrice: 80,
      vatRate: 20,
      shippingFee: 40,
      serviceFee: 8.49,
      currentPrice: 250,
      currentCommissionRate: 18,
      simulatedPrice: 220,
      simulatedCommissionRate: 12,
    });

    expect(sim.simulatedProfit).toBeDefined();
    expect(sim.badgeText).toContain('₺');
  });

  it('detects courier desi overcharge accurately', () => {
    const audit = DesiAuditEngine.calculateDesiOvercharge({
      billedDesi: 4,
      catalogDesi: 2,
      billedShippingFee: 75.00,
      expectedShippingFee: 50.00,
    });

    expect(audit.hasOvercharge).toBe(true);
    expect(audit.desiDifference).toBe(2);
    expect(audit.overchargeAmount).toBe(25.00);
  });
});
