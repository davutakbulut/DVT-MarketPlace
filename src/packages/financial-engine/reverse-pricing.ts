import { ReversePricingInput, ReversePricingResult } from './types';

export class ReversePricingEngine {
  public static calculate(input: ReversePricingInput): ReversePricingResult {
    const serviceFee = input.serviceFee ?? 13.19;
    const withholdingRate = (input.withholdingRate ?? 1.0) / 100;
    const extraCost = input.extraCost ?? 0.0;
    const commRateWithVat = (input.commissionRate * 1.20) / 100;
    const shippingFee = input.shippingFee ?? 42.50;

    // Linearization terms for VAT
    const outputVatRate = 1 - 1 / (1 + input.saleVatRate / 100);
    const commVatRecoveryRate = commRateWithVat * (1 - 1 / 1.20);
    const alphaVat = Math.max(0, outputVatRate - commVatRecoveryRate);

    // Fixed Input VAT credits
    const cogsVat = input.cogs * (1 - 1 / (1 + input.costVatRate / 100));
    const shippingVat = shippingFee * (1 - 1 / 1.20);
    const serviceFeeVat = serviceFee * (1 - 1 / 1.20);
    const extraCostVat = extraCost * (1 - 1 / 1.20);
    const betaVatRaw = cogsVat + shippingVat + serviceFeeVat + extraCostVat;
    const betaVat = input.saleVatRate === 0 ? 0 : betaVatRaw;

    const fixedCosts = input.cogs + shippingFee + serviceFee + extraCost;

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
      shippingFee +
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
      netProfit,
      profitMarginPercent,
      profitMarkupPercent,
      breakdown: {
        cogs: input.cogs,
        shippingFee,
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
}
