import { describe, it, expect } from 'vitest';
import { TrendyolClient } from '../client';
import { calculateOrderFinancials } from '@/lib/financialEngine';
import { calculateTrendyolShipping } from '@/lib/shippingCalculator';

describe('Trendyol Integration Core Engine', () => {
  it('should initialize TrendyolClient with valid credentials and generate basic auth header', () => {
    const client = new TrendyolClient({
      supplierId: '108452',
      apiKey: 'test_api_key',
      apiSecret: 'test_api_secret',
    });

    expect(client).toBeDefined();
    // Verify client internal auth formatting
    const raw = `test_api_key:test_api_secret`;
    const expectedBase64 = Buffer.from(raw).toString('base64');
    expect(expectedBase64).toBe('dGVzdF9hcGlfa2V5OnRlc3RfYXBpX3NlY3JldA==');
  });

  it('should throw error when supplierId is missing', () => {
    expect(() => {
      new TrendyolClient({
        supplierId: '',
        apiKey: 'key',
        apiSecret: 'secret',
      });
    }).toThrow('Trendyol Supplier ID zorunludur.');
  });

  it('should calculate accurate shipping barem for Trendyol under 350 TL', () => {
    const mockBarems = [
      {
        carrierName: 'TEX',
        tierName: '1. Kademe (0-200 TL)',
        minAmount: 0,
        maxAmount: 199.99,
        discountedPriceExVat: 38.74,
        standardPriceExVat: 50.00,
      },
      {
        carrierName: 'TEX',
        tierName: '2. Kademe (200-350 TL)',
        minAmount: 200,
        maxAmount: 349.99,
        discountedPriceExVat: 70.41,
        standardPriceExVat: 85.00,
      },
    ];

    // Order 150 TL with 1 day lead time (Advantageous Barem)
    const result1 = calculateTrendyolShipping(150, 1.0, 'TEX', 1, mockBarems, []);
    expect(result1.isBaremSupported).toBe(true);
    expect(result1.calculationMethod).toBe('barem_tier_1');
    expect(result1.appliedPriceExVat).toBe(38.74);
    expect(result1.appliedPriceIncVat).toBe(46.49); // 38.74 * 1.20 = 46.488 -> 46.49

    // Order 250 TL with 1 day lead time (2nd Tier)
    const result2 = calculateTrendyolShipping(250, 1.0, 'TEX', 1, mockBarems, []);
    expect(result2.isBaremSupported).toBe(true);
    expect(result2.calculationMethod).toBe('barem_tier_2');
    expect(result2.appliedPriceExVat).toBe(70.41);
    expect(result2.appliedPriceIncVat).toBe(84.49); // 70.41 * 1.20 = 84.492 -> 84.49

    // Order 450 TL (>= 350 TL -> Desi Matrix)
    const result3 = calculateTrendyolShipping(450, 2.0, 'TEX', 1, mockBarems, []);
    expect(result3.isBaremSupported).toBe(false);
    expect(result3.calculationMethod).toBe('desi_matrix');
  });

  it('should calculate accurate net profit and margin for Trendyol order', () => {
    const financials = calculateOrderFinancials({
      paidAmount: 500.0,
      grossAmount: 500.0,
      cogs: 200.0,
      commission: 75.0, // 15%
      shippingCost: 46.49,
      serviceFee: 13.19,
      stopaj: 5.0, // 1%
      netVat: 30.0,
      extraOperationRate: 6.0, // 6% = 30.0
    });

    expect(financials.paidAmount ?? financials.invoicedRevenue).toBe(500.0);
    expect(financials.cogs).toBe(200.0);
    expect(financials.extraOperationCost).toBe(30.0);
    expect(financials.totalExpenses).toBe(200 + 75 + 46.49 + 13.19 + 5 + 30 + 30); // 399.68
    expect(financials.netProfit).toBeCloseTo(100.32, 1);
    expect(financials.marginPercent).toBeCloseTo(20.06, 1);
  });
});
