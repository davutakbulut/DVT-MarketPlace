import { ReversePricingInput, ReversePricingResult } from './types';
import { calculateCargoBaremCost } from './cargo-barem';

export class ReversePricingEngine {
  /**
   * Helper to compute exact target price given a fixed shipping fee
   */
  private static solveWithFixedShipping(input: ReversePricingInput, shippingFeeIncVat: number): { targetSalePrice: number; totalDeductions: number; netProfit: number; profitMarginPercent: number; profitMarkupPercent: number; breakdown: any } {
    const serviceFee = input.serviceFee ?? 13.19;
    const withholdingRate = (input.withholdingRate ?? 1.0) / 100;
    const extraCost = input.extraCost ?? 0.0;
    const commRateWithVat = (input.commissionRate * 1.20) / 100;

    const outputVatRate = 1 - 1 / (1 + input.saleVatRate / 100);
    const commVatRecoveryRate = commRateWithVat * (1 - 1 / 1.20);
    const alphaVat = Math.max(0, outputVatRate - commVatRecoveryRate);

    const cogsVat = input.cogs * (1 - 1 / (1 + input.costVatRate / 100));
    const shippingVat = shippingFeeIncVat * (1 - 1 / 1.20);
    const serviceFeeVat = serviceFee * (1 - 1 / 1.20);
    const extraCostVat = extraCost * (1 - 1 / 1.20);
    const betaVatRaw = cogsVat + shippingVat + serviceFeeVat + extraCostVat;
    const betaVat = input.saleVatRate === 0 ? 0 : betaVatRaw;

    const fixedCosts = input.cogs + shippingFeeIncVat + serviceFee + extraCost;

    let targetCashProfit = 0;
    let variableMarginRate = 0;

    if (input.targetMode === 'cash_amount') {
      targetCashProfit = input.targetValue;
      variableMarginRate = 0;
    } else if (input.targetMode === 'markup_percent') {
      targetCashProfit = input.cogs * (input.targetValue / 100);
      variableMarginRate = 0;
    } else if (input.targetMode === 'margin_percent') {
      targetCashProfit = 0;
      variableMarginRate = input.targetValue / 100;
    }

    const totalVariableRate =
      commRateWithVat +
      withholdingRate / (1 + input.saleVatRate / 100) +
      alphaVat +
      variableMarginRate;

    if (totalVariableRate >= 0.88) {
      throw new Error(
        `Ulaşılamaz hedef marj. Toplam kesinti oranı %${(totalVariableRate * 100).toFixed(1)} oldu (Maksimum güvenli sınır %88).`
      );
    }

    const numerator = fixedCosts + targetCashProfit - betaVat;
    const denominator = 1 - totalVariableRate;
    const targetSalePrice = Math.max(0, Math.round((numerator / denominator) * 100) / 100);

    const commissionAmount = Math.round(targetSalePrice * commRateWithVat * 100) / 100;
    const withholdingTax = Math.round((targetSalePrice / (1 + input.saleVatRate / 100)) * withholdingRate * 100) / 100;
    const outputVat = targetSalePrice * outputVatRate;
    const totalInputVat = betaVatRaw + commissionAmount * (1 - 1 / 1.20);
    const netVatPayable = Math.max(0, Math.round((outputVat - totalInputVat) * 100) / 100);

    const totalDeductions =
      input.cogs +
      shippingFeeIncVat +
      serviceFee +
      extraCost +
      commissionAmount +
      withholdingTax +
      netVatPayable;

    const netProfit = Math.round((targetSalePrice - totalDeductions) * 100) / 100;
    const profitMarginPercent = targetSalePrice > 0 ? Math.round((netProfit / targetSalePrice) * 10000) / 100 : 0;
    const profitMarkupPercent = input.cogs > 0 ? Math.round((netProfit / input.cogs) * 10000) / 100 : 0;

    return {
      targetSalePrice,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      netProfit,
      profitMarginPercent,
      profitMarkupPercent,
      breakdown: {
        cogs: input.cogs,
        shippingFee: shippingFeeIncVat,
        baremSaving: 0,
        commissionAmount,
        serviceFee,
        withholdingTax,
        netVatPayable,
        extraCost,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
      },
    };
  }

  /**
   * Main calculation that dynamically selects Barem Tier based on resulting target Sale Price (Ex VAT)
   */
  public static calculate(input: ReversePricingInput): ReversePricingResult {
    const carrier = input.carrier || 'TEX';
    const isFastDelivery = input.isFastDeliveryCompliant !== false;
    const standardDesiPrice = input.shippingFee ?? 81.95;

    // Step 1: Assume Tier 1 (0 - 199.99 TL)
    const tier1Cargo = calculateCargoBaremCost({
      packetAmountExVat: 100.0,
      carrier,
      isFastDeliveryCompliant: isFastDelivery,
      customStandardPrice: standardDesiPrice,
    });
    let res = this.solveWithFixedShipping(input, tier1Cargo.shippingFeeIncVat);
    let salePriceExVat = res.targetSalePrice / (1 + input.saleVatRate / 100);

    if (salePriceExVat < 200.0) {
      res.breakdown.baremSaving = tier1Cargo.baremSupportSaving;
      return res;
    }

    // Step 2: Sale price is >= 200 TL, evaluate Tier 2 (200 - 349.99 TL)
    const tier2Cargo = calculateCargoBaremCost({
      packetAmountExVat: 250.0,
      carrier,
      isFastDeliveryCompliant: isFastDelivery,
      customStandardPrice: standardDesiPrice,
    });
    res = this.solveWithFixedShipping(input, tier2Cargo.shippingFeeIncVat);
    salePriceExVat = res.targetSalePrice / (1 + input.saleVatRate / 100);

    if (salePriceExVat < 350.0) {
      res.breakdown.baremSaving = tier2Cargo.baremSupportSaving;
      return res;
    }

    // Step 3: Sale price is >= 350 TL, evaluate Standard Desi Matrix Tier
    const tier3Cargo = calculateCargoBaremCost({
      packetAmountExVat: 400.0,
      carrier,
      isFastDeliveryCompliant: isFastDelivery,
      customStandardPrice: standardDesiPrice,
    });
    res = this.solveWithFixedShipping(input, tier3Cargo.shippingFeeIncVat);
    res.breakdown.baremSaving = 0;
    return res;
  }
}
