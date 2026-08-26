import { OrderItemProfitInput, OrderItemProfitResult } from './types';

export class OrderProfitEngine {
  public static calculate(params: OrderItemProfitInput): OrderItemProfitResult {
    const qty = params.quantity;
    const grossRevenue = params.unitSalePrice * qty;
    const cogs = params.unitCostPrice * qty;
    const extraCost = (params.extraCost ?? 0) * qty;
    const commRateWithVat = (params.commissionRate * 1.20) / 100;
    const commissionAmount = grossRevenue * commRateWithVat;
    const withholdingRate = (params.withholdingRate ?? 1.0) / 100;
    const withholdingTax = (grossRevenue / (1 + params.saleVatRate / 100)) * withholdingRate;
    const shippingFee = params.shippingFee ?? 42.50;

    const outputVat = grossRevenue * (1 - 1 / (1 + params.saleVatRate / 100));
    const cogsVat = cogs * (1 - 1 / (1 + params.costVatRate / 100));
    const shippingVat = shippingFee * (1 - 1 / 1.20);
    const commVat = commissionAmount * (1 - 1 / 1.20);
    const serviceFeeVat = params.serviceFeeShare * (1 - 1 / 1.20);
    const inputVat = cogsVat + shippingVat + commVat + serviceFeeVat;
    const netVatPayable = Math.max(0, outputVat - inputVat);

    const totalCost =
      cogs +
      commissionAmount +
      shippingFee +
      params.serviceFeeShare +
      withholdingTax +
      netVatPayable +
      extraCost +
      (params.adSpendShare ?? 0) +
      (params.penaltyShare ?? 0) +
      (params.earlyPayoutShare ?? 0);

    const netProfit = grossRevenue - totalCost;
    const profitMarginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    const profitMarkupPercent = cogs > 0 ? (netProfit / cogs) * 100 : 0;

    return {
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      cogs: Math.round(cogs * 100) / 100,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      shippingFee: Math.round(shippingFee * 100) / 100,
      baremSaving: 0,
      serviceFeeShare: Math.round(params.serviceFeeShare * 100) / 100,
      withholdingTax: Math.round(withholdingTax * 100) / 100,
      netVatPayable: Math.round(netVatPayable * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMarginPercent: Math.round(profitMarginPercent * 100) / 100,
      profitMarkupPercent: Math.round(profitMarkupPercent * 100) / 100,
    };
  }
}
